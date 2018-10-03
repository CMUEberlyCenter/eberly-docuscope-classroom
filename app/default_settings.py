import os

class Config():
    DICTIONARY_SERVER = os.getenv('DICTIONARY_SERVER', 'http://dictionary')
    COUCHDB_USER = os.getenv('COUCHDB_USER', 'guest')
    COUCHDB_PASSWORD = os.getenv('COUCHDB_PASSWORD', 'guest')
    COUCHDB_URL = os.getenv('COUCHDB_URL', 'http://couchdb:5984')
