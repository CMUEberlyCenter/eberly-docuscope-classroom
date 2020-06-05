"""DocuScope Classroom analysis tools interface."""
#from functools import partial
import logging
import traceback

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import Response, FileResponse
from starlette.staticfiles import StaticFiles
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from default_settings import Config
from routers import ds_data, generate_reports, groups, patterns, text_content

# logging.basicConfig(level=logging.INFO)

# Setup database sesson manager
ENGINE = create_engine(
    Config.SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=True,
    pool_recycle=3600)
SESSION = sessionmaker(autocommit=False, autoflush=False, bind=ENGINE)

# Setup API service.
app = FastAPI( #pylint: disable=invalid-name
    title="DocuScope Classroom Analysis Tools",
    description="Collection of corpus analysis tools to be used in a classroom.",
    version="4.0.0",
    license={
        'name': 'CC BY-NC-SA 4.0',
        'url': 'https://creativecommons.org/licenses/by-nc-sa/4.0/'
    })

#python -c 'import os; print(os.urandom(16))' =>
#secret_key = b'\xf7i\x0b\xb5[)C\x0b\x15\xf0T\x13\xe1\xd2\x9e\x8a'

## Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['GET', 'POST'],
    allow_headers=['*'])

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
        response = Response("Internal server error: %s" % exp,
                            status_code=HTTP_500_INTERNAL_SERVER_ERROR)
        request.state.db.rollback()
    finally:
        request.state.db.close()
    return response

app.include_router(ds_data.router) # boxplot, rank, and scatter use ds_data
app.include_router(groups.router)
app.include_router(patterns.router)
app.include_router(generate_reports.router)
app.include_router(text_content.router)

## Serve static files.
@app.middleware("http")
async def add_custom_header(request, call_next):
    """Serve the classroom web application from static."""
    response = await call_next(request)
    if response.status_code == 404:
        return FileResponse('static/index.html')
    return response
@app.exception_handler(404)
def not_found(_request, _exc):
    """Handler for 404 error which instead returns index.html"""
    return FileResponse('static/index.html')
app.mount("/classroom", StaticFiles(directory="static", html=True), name="static")

#if __name__ == '__main__':
#    app.run(debug=True)
