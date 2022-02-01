"""Configuration properties that are retrieved from the environment
 and their default settings."""
import os

from pydantic import BaseSettings, DirectoryPath, SecretStr, stricturl

class Settings(BaseSettings):
    dictionary_home: DirectoryPath = os.path.join(os.path.dirname(__file__),
                                                  'dictionaries')
    sqlalchemy_track_modifications: bool = False
    db_host: str = '127.0.0.1'
    db_port: int = 3306
    db_password: SecretStr = 'docuscope'
    db_user: str = 'docuscope'
    mysql_database: str = 'docuscope'

    class Config():
        env_file = '.env'
        env_file_encoding = 'utf-8'
        secrets_dir = '/run/secrets' if os.path.isdir('/run/secrets') else None

SETTINGS = Settings()
SQLALCHEMY_DATABASE_URI: stricturl(tld_required = False, allowed_schemes=['mysql+mysqldb']) = (
        f"mysql+mysqldb://"
        f"{SETTINGS.db_user}"
        f":{SETTINGS.db_password}"
        f"@{SETTINGS.db_host}"
        f":{SETTINGS.db_port}"
        f"/{SETTINGS.mysql_database}")
