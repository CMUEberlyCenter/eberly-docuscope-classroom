"""DocuScope Classroom analysis tools interface."""
#from functools import partial
import logging
import os
import traceback

from fastapi import FastAPI, Request, Response
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse
#from brotli_asgi import BrotliMiddleware # brotli-asgi
#from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.staticfiles import StaticFiles
#from fastapi_profiler.profiler_middleware import PyInstrumentProfilerMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from starlette.middleware.cors import CORSMiddleware
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR
#from starlet_authlib.middlewar import AuthlibMiddleware # starlette-authlib

from default_settings import SETTINGS, SQLALCHEMY_DATABASE_URI
from routers import document, ds_data, generate_reports, groups, patterns

#logging.basicConfig(level=logging.DEBUG)

# Setup database sesson manager
ENGINE = create_engine(
    SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=True,
    pool_recycle=3600)
SESSION = sessionmaker(autocommit=False, autoflush=False, bind=ENGINE)

# Setup API service.
app = FastAPI( #pylint: disable=invalid-name
    title="DocuScope Classroom Analysis Tools",
    description="Collection of corpus analysis tools to be used in a classroom.",
    version="5.1.2",
    license={
        'name': 'CC BY-NC-SA 4.0',
        'url': 'https://creativecommons.org/licenses/by-nc-sa/4.0/'
    })

#app.add_middleware(PyInstrumentProfilerMiddleware) # profiling
#python -c 'import os; print(os.urandom(16))' =>
#secret_key = b'\xf7i\x0b\xb5[)C\x0b\x15\xf0T\x13\xe1\xd2\x9e\x8a'

## Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['GET', 'POST'],
    allow_headers=['*'])

#app.add_middleware(BrotliMiddleware)
app.add_middleware(GZipMiddleware)
#app.add_middleware(HTTPSRedirectMiddleware)
#app.add_middleware(AuthlibMiddleware, secret='secret')

## Add custom middleware for database connection.
@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    """Middleware for adding database sessions to a request."""
    response = Response("Internal server error",
                        status_code=HTTP_500_INTERNAL_SERVER_ERROR)
    try:
        request.state.db = SESSION()
        request.state.db.flush()
        response = await call_next(request)
        request.state.db.commit()
    except Exception as exp: #pylint: disable=broad-except
        traceback.print_exc()
        logging.error(exp)
        response = Response(f"Internal server error: {exp}",
                            status_code=HTTP_500_INTERNAL_SERVER_ERROR)
        request.state.db.rollback()
    finally:
        request.state.db.close()
    return response

app.include_router(document.router)
app.include_router(ds_data.router) # boxplot, rank, and scatter use ds_data
app.include_router(groups.router)
app.include_router(patterns.router)
app.include_router(generate_reports.router)

## Serve static files.
@app.get("/common_dictionary")
async def common_dictionary():
    """Serve the common dictionary information."""
    return FileResponse(os.path.join(SETTINGS.dictionary_home, 'common_dict.json'))

@app.middleware("http")
async def add_custom_header(request: Request, call_next):
    """Serve the classroom web application from static."""
    response = await call_next(request)
    if response.status_code == 404:
        return FileResponse('static/index.html')
    return response

@app.exception_handler(404)
def not_found(_request: Request, _exc):
    """Handler for 404 error which instead returns index.html"""
    return FileResponse('static/index.html')

app.mount("/classroom", StaticFiles(directory="static", html=True),
          name="static")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080, log_level="info")
