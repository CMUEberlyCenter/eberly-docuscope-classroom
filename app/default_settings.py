"""Configuration properties that are retrieved from the environment
 and their default settings."""
import os

from pydantic import DirectoryPath, MySQLDsn, SecretStr
from pydantic_settings import SettingsConfigDict, BaseSettings


class Settings(BaseSettings):
    """Configuration Settings.

    With the magic of pydantic and dotenv, these settings are all configurable
    with environment variables and .env files."""
    dictionary_home: DirectoryPath = os.path.join(os.path.dirname(__file__),
                                                  'dictionaries')
    sqlalchemy_track_modifications: bool = False
    db_host: str = '127.0.0.1'
    db_port: int = 3306
    db_password: SecretStr = None
    db_user: str = 'docuscope'
    mysql_database: str = 'docuscope'
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        secrets_dir='/run/secrets' if os.path.isdir('/run/secrets') else None)


SETTINGS = Settings()
SQLALCHEMY_DATABASE_URI: MySQLDsn = (
    f"mysql+aiomysql://"
    f"{SETTINGS.db_user}"
    f":{SETTINGS.db_password.get_secret_value()}"  # pylint: disable=no-member
    f"@{SETTINGS.db_host}"
    f":{SETTINGS.db_port}"
    f"/{SETTINGS.mysql_database}")
