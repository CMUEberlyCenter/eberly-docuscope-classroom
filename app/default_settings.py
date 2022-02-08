"""Configuration properties that are retrieved from the environment
 and their default settings."""
import os

from pydantic import BaseSettings, DirectoryPath, SecretStr, stricturl

class Settings(BaseSettings):
    """Configuration Settings.

    With the magic of pydantic and dotenv, these settings are all configurable
    with environment variables and .env files."""
    dictionary_home: DirectoryPath = os.path.join(os.path.dirname(__file__),
                                                  'dictionaries')
    sqlalchemy_track_modifications: bool = False
    db_host: str = '127.0.0.1'
    db_port: int = 3306
    db_password: SecretStr = ''
    db_user: str = 'docuscope'
    mysql_database: str = 'docuscope'

    class Config(): #pylint: disable=too-few-public-methods
        """Configuration class for Settings."""
        env_file = '.env'
        env_file_encoding = 'utf-8'
        # Following is for docker secrets.
        secrets_dir = '/run/secrets' if os.path.isdir('/run/secrets') else None

SETTINGS = Settings()
SQLALCHEMY_DATABASE_URI: stricturl(tld_required = False, allowed_schemes=['mysql+mysqldb']) = (
        f"mysql+mysqldb://"
        f"{SETTINGS.db_user}"
        f":{SETTINGS.db_password.get_secret_value()}" #pylint: disable=no-member
        f"@{SETTINGS.db_host}"
        f":{SETTINGS.db_port}"
        f"/{SETTINGS.mysql_database}")
