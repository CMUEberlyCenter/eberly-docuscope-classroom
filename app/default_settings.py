"""Configuration properties that are retrieved from the environment
 and their default settings."""
import os
from pathlib import Path

def get_secret(env_var, default=None):
    """Retrieves the value of the given environment variable prefering any
    {env_var}_FILE variation to work with docker secrets."""
    efile = os.getenv(f"{env_var}_FILE")
    return Path(efile).read_text(encoding="UTF-8").strip() if efile else os.getenv(env_var, default)


class Config(): #pylint: disable=R0903
    """Configuration object used as part of initializing this app."""
    DICTIONARY_HOME = os.getenv('DICTIONARY_HOME',
                                os.path.join('/app', 'dictionaries'))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+mysqldb://"
        f"{get_secret('MYSQL_USER', 'root')}"
        f":{get_secret('MYSQL_PASSWORD', 'rootpw')}"
        f"@{os.getenv('DB_HOST', 'mysql')}"
        f":{os.getenv('DB_PORT', '3306')}"
        f"/{os.getenv('MYSQL_DATABASE', 'docuscope')}"
        f"?charset=utf8mb4")
