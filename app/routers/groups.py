""" Handles /groups requests. """
import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pandas import DataFrame, Series
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette.status import \
    HTTP_400_BAD_REQUEST, HTTP_500_INTERNAL_SERVER_ERROR

from ds_groups import get_best_groups
from response import AssignmentData, ERROR_RESPONSES
from util import get_db_session, get_stats

router = APIRouter()

class GroupsSchema(BaseModel):
    """Schema for '/groups' requests."""
    corpus: List[UUID]
    group_size: int = 2

def get_pairings(documents: List[UUID], group_size: int, db_session: Session):
    """Generate the groups for this corpus."""
    stats = get_stats(documents, db_session)
    frame = DataFrame.from_dict(stats.frame)
    # logging.warning(frame)
    frame = frame.loc[:, list(frame.loc['ownedby'] == 'student')]
    title_row = frame.loc['title']
    frame = frame.drop('title').drop('ownedby', errors='ignore')
    frame = frame.apply(lambda x: x.divide(x['total_words'])
                        if x['total_words'] else Series(0, index=x.index))
    frame = frame.drop('total_words')
    frame = frame.drop('Other', errors='ignore')
    frame = frame.append(title_row)
    frame = frame.transpose().fillna(0).set_index('title')
    # logging.warning(frame)
    data = get_best_groups(frame, group_size=group_size)
    if 'assignments' in stats.__fields_set__:
        data['assignment'] = ", ".join(stats.assignments)
    if 'courses' in stats.__fields_set__:
        data['course'] = ", ".join(stats.courses)
    if 'instructors' in stats.__fields_set__:
        data['instructor'] = ", ".join(stats.instructors)
    if 'categories' in stats.__fields_set__:
        data['categories'] = stats.categories
    return data

class GroupsData(AssignmentData): #pylint: disable=too-few-public-methods
    """Schema for "groups" data."""
    groups: List[List[str]] = ...
    grp_qualities: List[float] = None
    quality: float = None

@router.post('/groups', response_model=GroupsData,
             responses=ERROR_RESPONSES)
def generate_groups(corpus: GroupsSchema, db_session: Session = Depends(get_db_session)):
    """Responds to requests to generate groups."""
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    if len(corpus.corpus) < corpus.group_size:
        raise HTTPException(
            detail="Not enough documents to make groups of size {}.".format(corpus.group_size),
            status_code=HTTP_400_BAD_REQUEST)
    try:
        return get_pairings(corpus.corpus, corpus.group_size, db_session)
    except Exception as excp:
        logging.error(excp)
        raise HTTPException(
            detail=excp.args[0],
            status_code=HTTP_500_INTERNAL_SERVER_ERROR) from excp
