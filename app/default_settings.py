"""Configuration properties that are retrieved from the environment
 and their default settings."""
import os

class Config():
    """Configuration object used as part of initializing this Flask app."""
    DICTIONARY_SERVER = os.getenv('DICTIONARY_SERVER', 'http://dictionary')
    dbHost = os.getenv('dbHost', '192.168.37.135')
    dbPort = os.getenv('dbPort', 13306)
    dbName = os.getenv('dbName', 'docuscope')
    dbTable = os.getenv('dbTable', 'ds_documents')
    dbUsername = os.getenv('dbUsername', 'unity')
    dbPassword = os.getenv('dbPassword', '4570WK821X6OdfyT508srN09wV')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    COUCHDB_USER = os.getenv('COUCHDB_USER', 'guest')
    COUCHDB_PASSWORD = os.getenv('COUCHDB_PASSWORD', 'guest')
    COUCHDB_URL = os.getenv('COUCHDB_URL', 'http://couchdb:5984')
