""" Handles /groups requests. """
import logging
from uuid import UUID
from database import get_documents, session

from ds_groups import get_best_groups
from fastapi import APIRouter, Depends, HTTPException
from lat_frame import LAT_FRAME
from pandas import concat, merge
from pydantic import BaseModel
from response import ERROR_RESPONSES, AssignmentData
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.status import (HTTP_400_BAD_REQUEST,
                              HTTP_500_INTERNAL_SERVER_ERROR)

router = APIRouter()

class GroupsSchema(BaseModel):
    """Schema for '/groups' requests."""
    corpus: list[UUID]
    group_size: int = 2

async def get_pairings(documents: list[UUID], group_size: int, session: AsyncSession) -> GroupsSchema:
    """Generate the groups for this corpus."""
    stats, info = await get_documents(documents, session)
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
    frame = concat([frame.fillna(0).transpose(), info.loc['title']], axis=1).set_index('title')
    data = get_best_groups(frame, group_size=group_size)
    # Set Assignment data.
    data['assignment'] = ", ".join(info.loc['assignment_name'].unique())
    data['course'] = ", ".join(info.loc['course_name'].unique())
    data['instructor'] = ", ".join(info.loc['instructor_name'].unique())
    return data

class GroupsData(AssignmentData): #pylint: disable=too-few-public-methods
    """Schema for "groups" data."""
    groups: list[list[str]] = ...
    grp_qualities: list[float] = None
    quality: float = None

@router.post('/groups', response_model=GroupsData,
             responses=ERROR_RESPONSES)
async def generate_groups(group_req: GroupsSchema, db_session: AsyncSession = Depends(session)):
    """Responds to requests to generate groups."""
    if not group_req.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    if len(group_req.corpus) < group_req.group_size:
        raise HTTPException(
            detail=f"Not enough documents to make groups of size {group_req.group_size}.",
            status_code=HTTP_400_BAD_REQUEST)
    try:
        return await get_pairings(group_req.corpus, group_req.group_size, db_session)
    except Exception as excp:
        logging.error(excp)
        raise HTTPException(
            detail=excp.args[0],
            status_code=HTTP_500_INTERNAL_SERVER_ERROR) from excp
