"""Utility functions for initializing and creating application interfaces."""
from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
#from whitenoise import WhiteNoise

from default_settings import Config

def create_flask_app():
    """Create and initialize the Flask application."""
    app = Flask(__name__)
    app.config.from_object(Config)
    app.engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
    app.Session = sessionmaker(bind=app.engine)
    #app.wsgi_app = WhiteNoise(app.wsgi_app, root='static/', index_file=True)
    return app
