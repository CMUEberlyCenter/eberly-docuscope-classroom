"""Shared response models."""
from enum import Enum
from typing import List
from uuid import UUID

from pydantic import BaseModel
from starlette.status import (HTTP_400_BAD_REQUEST,
                              HTTP_500_INTERNAL_SERVER_ERROR,
                              HTTP_503_SERVICE_UNAVAILABLE)


class ErrorResponse(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for error response."""
    detail: str

class DictionaryInformation(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for dictionary help."""
    id: str = ...
    name: str = ...
    description: str = None
    # included: bool = True
    # max?: float # this would be useful for rank, scatter might benefit as well

class LevelEnum(str, Enum):
    """Enumeration of the possible analysis levels."""
    dimension = "Dimension"
    cluster = "Cluster"

class LevelFrame(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for an analysis level data frame."""
    corpus: List[UUID] = []
    level: LevelEnum = LevelEnum.cluster
    ds_dictionary: str = ""
    assignments: List[str] = []
    courses: List[str] = []
    instructors: List[str] = []
    #categories: List[DictionaryInformation] = None
    frame: dict = None

class AssignmentData(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for information about the assignment."""
    assignment: str = None
    course: str = None
    instructor: str = None
    #categories: List[DictionaryInformation] = None

ERROR_RESPONSES = {
    HTTP_400_BAD_REQUEST: {
        "model": ErrorResponse,
        "description": "Bad Request"},
    HTTP_500_INTERNAL_SERVER_ERROR: {
        "model": ErrorResponse,
        "description": "Internal Server Error"},
    HTTP_503_SERVICE_UNAVAILABLE: {
        "model": ErrorResponse,
        "description": "Service Unavailable (untagged documents)"}
}
