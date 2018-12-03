"""Utility functions for initializing and creating application interfaces."""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from default_settings import Config

db = SQLAlchemy()

def create_flask_app():
    """Create and initialize the Flask application."""
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config['SQLALCHEMY_DATABASE_URI'] = "mysql+mysqldb://{0.dbUsername}:{0.dbPassword}@{0.dbHost}:{0.dbPort}/{0.dbName}".format(Config)
    db.init_app(app)
    #db.Model.metadata.reflect(db.get_engine(app=app))
    return app
