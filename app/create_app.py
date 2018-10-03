"""Utility functions for initializing and creating application interfaces."""

from flask import Flask
from default_settings import Config

def create_flask_app():
    """Create and initialize the Flask application."""
    app = Flask(__name__)
    app.config.from_object(Config)
    return app
