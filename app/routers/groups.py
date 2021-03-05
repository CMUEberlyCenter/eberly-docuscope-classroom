""" Handles /groups requests. """
import logging
from typing import List
from uuid import UUID

from ds_groups import get_best_groups
from fastapi import APIRouter, Depends, HTTPException
from lat_frame import LAT_FRAME
from pandas import merge
from pydantic import BaseModel
from response import ERROR_RESPONSES, AssignmentData
from sqlalchemy.orm import Session
from starlette.status import (HTTP_400_BAD_REQUEST,
                              HTTP_500_INTERNAL_SERVER_ERROR)
from util import get_db_session, get_documents

router = APIRouter()

class GroupsSchema(BaseModel):
    """Schema for '/groups' requests."""
    corpus: List[UUID]
    group_size: int = 2

def get_pairings(documents: List[UUID], group_size: int, db_session: Session) -> GroupsSchema:
    """Generate the groups for this corpus."""
    stats, info = get_documents(documents, db_session)
    # Keep only students.
    students = info.loc['ownedby'] == 'student'
    info = info.transpose()[students].transpose()
    stats = stats.transpose()[students].transpose()

    # Merge with common dictionary
    hdata = merge(LAT_FRAME, stats, left_on="lat", right_index=True, how="outer")
    hdata['lat'] = hdata['lat'].astype("string")
    docs = range(6, len(hdata.columns))
    frame = hdata.iloc[:, [0, *docs]].groupby('category').sum()
    #frame = frame.drop('Other', errors='ignore') # Unnecessary when using category
    frame = frame / info.loc['total_words'].astype('Int64') # Normalize
    # Set index to student's name.
    frame = frame.fillna(0).append(info.loc['title']).transpose().set_index('title')
    data = get_best_groups(frame, group_size=group_size)
    # Set Assignment data.
    data['assignment'] = ", ".join(info.loc['assignment_name'].unique())
    data['course'] = ", ".join(info.loc['course_name'].unique())
    data['instructor'] = ", ".join(info.loc['instructor_name'].unique())
    return data

class GroupsData(AssignmentData): #pylint: disable=too-few-public-methods
    """Schema for "groups" data."""
    groups: List[List[str]] = ...
    grp_qualities: List[float] = None
    quality: float = None

@router.post('/groups', response_model=GroupsData,
             responses=ERROR_RESPONSES)
def generate_groups(group_req: GroupsSchema, db_session: Session = Depends(get_db_session)):
    """Responds to requests to generate groups."""
    if not group_req.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    if len(group_req.corpus) < group_req.group_size:
        raise HTTPException(
            detail="Not enough documents to make groups of size {}.".format(group_req.group_size),
            status_code=HTTP_400_BAD_REQUEST)
    try:
        return get_pairings(group_req.corpus, group_req.group_size, db_session)
    except Exception as excp:
        logging.error(excp)
        raise HTTPException(
            detail=excp.args[0],
            status_code=HTTP_500_INTERNAL_SERVER_ERROR) from excp
