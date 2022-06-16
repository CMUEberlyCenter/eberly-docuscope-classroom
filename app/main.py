"""DocuScope Classroom analysis tools interface."""
#from functools import partial
import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse
# from brotli_asgi import BrotliMiddleware # brotli-asgi
#from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.staticfiles import StaticFiles
#from fastapi_profiler.profiler_middleware import PyInstrumentProfilerMiddleware
from starlette.middleware.cors import CORSMiddleware

from database import ENGINE
from default_settings import SETTINGS
from routers import document, ds_data, generate_reports, groups, patterns

# from starlet_authlib.middlewar import AuthlibMiddleware # starlette-authlib


# logging.basicConfig(level=logging.DEBUG)


# Setup API service.
app = FastAPI(  # pylint: disable=invalid-name
    title="DocuScope Classroom Analysis Tools",
    description="Collection of corpus analysis tools to be used in a classroom.",
    version="5.1.2",
    license={
        'name': 'CC BY-NC-SA 4.0',
        'url': 'https://creativecommons.org/licenses/by-nc-sa/4.0/'
    })

# app.add_middleware(PyInstrumentProfilerMiddleware) # profiling
# python -c 'import os; print(os.urandom(16))' =>
#secret_key = b'\xf7i\x0b\xb5[)C\x0b\x15\xf0T\x13\xe1\xd2\x9e\x8a'

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['GET', 'POST'],
    allow_headers=['*'])

# app.add_middleware(BrotliMiddleware)
app.add_middleware(GZipMiddleware)
# app.add_middleware(HTTPSRedirectMiddleware)
#app.add_middleware(AuthlibMiddleware, secret='secret')


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanly shut down database engine on shutdown event."""
    if ENGINE is not None:
        await ENGINE.dispose()

app.include_router(document.router)
app.include_router(ds_data.router)  # boxplot, rank, and scatter use ds_data
app.include_router(groups.router)
app.include_router(patterns.router)
app.include_router(generate_reports.router)

# Serve static files.
@app.get("/common_dictionary")
async def common_dictionary():
    """Serve the common dictionary information."""
    return FileResponse(os.path.join(SETTINGS.dictionary_home, 'common_dict.json'))

app.mount("/classroom", StaticFiles(directory="static", html=True),
          name="static")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    import asyncio

    from hypercorn.asyncio import serve
    from hypercorn.config import Config
    config = Config()
    config.bind = ["0.0.0.0:4200"]
    config.loglevel = "info"
    asyncio.run(serve(app, config))
