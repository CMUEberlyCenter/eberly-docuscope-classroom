"""Utility functions for initializing and creating application interfaces."""
from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
#from flask_sqlalchemy import SQLAlchemy

from default_settings import Config

#db = SQLAlchemy()

def create_flask_app():
    """Create and initialize the Flask application."""
    app = Flask(__name__)
    app.config.from_object(Config)
    engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
    app.Session = sessionmaker(bind=engine)
    #db.init_app(app)
    #db.Model.metadata.reflect(db.get_engine(app=app))
    return app
