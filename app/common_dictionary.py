try:
    import ujson as json
except ImportError:
    import json
import logging
import os
from typing import List, Set, Tuple
from fastapi import HTTPException
from pandas import DataFrame
from pydantic import BaseModel, ValidationError
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY
from default_settings import Config

class Entry(BaseModel):
    label: str
    help: str

class Cluster(Entry):
    name: str

class Subcategory(Entry):
    clusters: List[Cluster]

class Category(Entry):
    subcategories: List[Subcategory]

LevelMap = List[Tuple[str, Set[str]]]
class CommonDictionary(BaseModel):
    default_dict: str
    custom_dict: str
    use_default_dict: bool
    timestamp: str
    categories: List[Category]

def get_common_dictionary() -> CommonDictionary:
    """Retrieve the DocuScope Common Dictionary."""
    try:
        with open(os.path.join(Config.DICTIONARY_HOME,
                               "common_dict.json")) as cin:
            data = json.load(cin)
    except ValueError as enc_error:
        logging.error(f"While parsing common_dictionary: {enc_error}")
        raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY,
                            detail=f"Error parsing common_dict.json: {enc_error}") from enc_error
    except OSError as os_error:
        logging.error(f"While loading common_dictionary: {os_error}")
        raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY,
                            detail=f"Error reading common_dict.json: {os_error}") from os_error
    try:
        dscommon = CommonDictionary(**data)
    except ValidationError as err:
        logging.error(f"While validating common_dict.json: {err}")
        raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY,
                           detail=f"Error validating common_dict.json: {err}") from err
    except ValueError as v_err:
        logging.error(f"Invalid JSON in common_dict.json: {v_err}")
        raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY,
                            detail=f"JSON error in common_dict.json: {v_err}") from v_err
    if not dscommon:
        logging.error("Empty common dictionary")
        raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY,
                            details="Empty common dictionary")
    return dscommon

def common_frame() -> DataFrame:
    dscommon = get_common_dictionary()
    dsc = [{"category": cat.label, "subcategory": sub.label, "cluster": clust.name} for cat in dscommon.categories for sub in cat.subcategories for clust in sub.clusters]
    return DataFrame(dsc, dtype="string")

COMMON_DICTIONARY_FRAME = common_frame()
