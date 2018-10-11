"""Configuration properties that are retrieved from the environment
 and their default settings."""
import os

class Config():
    """Configuration object used as part of initializing this Flask app."""
    DICTIONARY_SERVER = os.getenv('DICTIONARY_SERVER', 'http://dictionary')
    COUCHDB_USER = os.getenv('COUCHDB_USER', 'guest')
    COUCHDB_PASSWORD = os.getenv('COUCHDB_PASSWORD', 'guest')
    COUCHDB_URL = os.getenv('COUCHDB_URL', 'http://couchdb:5984')
