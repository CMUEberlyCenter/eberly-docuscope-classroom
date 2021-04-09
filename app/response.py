"""Shared response models."""
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

class AssignmentData(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for information about the assignment."""
    assignment: str = None
    course: str = None
    instructor: str = None

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
