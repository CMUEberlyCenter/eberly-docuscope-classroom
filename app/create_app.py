"""Utility functions for initializing and creating application interfaces."""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy

from default_settings import Config

db = SQLAlchemy()

def create_flask_app():
    """Create and initialize the Flask application."""
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    return app
