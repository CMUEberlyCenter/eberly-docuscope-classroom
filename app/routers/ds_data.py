""" Handles /ds_data requests. """
import logging
import traceback
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pandas import DataFrame, Series
import pandas
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette.status import HTTP_400_BAD_REQUEST

from util import get_db_session, get_stats, LevelFrame
from response import DictionaryInformation, ERROR_RESPONSES

router = APIRouter()

class DocumentData(BaseModel):
    """ Schema for metadata of a document. """
    id: UUID = ...
    title: str = ... # human readable student name or document name
    ownedby: str = ... # 'student' or 'instructor'
    total_words: int = 0

    class Config: #pylint: disable=too-few-public-methods
        """ Configuration settings for DocumentData. """
        extra = 'allow'

class CategoryData(DictionaryInformation):
    """ Schema for category metadata. """
    #id: str = ...
    #name: str = ...
    #description: str = None
    q1: float = ...
    q2: float = ... # median
    q3: float = ...
    min: float = ...
    max: float = ...
    uifence: float = ...
    lifence: float = ...

class DocuScopeData(BaseModel):
    """ Response schema for DocuScope statistical data. """
    assignment: str = None
    course: str = None
    instructor: str = None
    categories: List[CategoryData] = []
    data: List[DocumentData] = []

def calculate_data(stats: LevelFrame) -> DocuScopeData:
    """Generate the boxplot data for this request."""
    sframe = DataFrame.from_dict(stats.frame)
    frame = sframe.drop('title').drop('ownedby', errors='ignore')
    frame = frame.apply(lambda x: x.divide(x['total_words'])
                        if x['total_words'] else Series(0, index=x.index))
    frame = frame.drop('total_words').drop('Other', errors='ignore')
    frame = frame.transpose()
    frame = frame.fillna(0)
    quantiles = frame.quantile(q=[0, 0.25, 0.5, 0.75, 1])
    iqr = quantiles.loc[0.75] - quantiles.loc[0.25]
    upper_inner_fence = quantiles.loc[0.75] + 1.5 * iqr
    lower_inner_fence = (quantiles.loc[0.25] - 1.5 * iqr).apply(lambda x: 0 if x < 0 else x)
    sframe = sframe.transpose()
    dataf = pandas.concat([frame, sframe.loc[:, ['total_words', 'title', 'ownedby']]], axis=1)
    #foutliers = frame[((frame < lower_inner_fence) | (frame > upper_inner_fence)).any(axis=1)]
    #logging.warning(foutliers)
    quants = DataFrame({
        "q1": quantiles.loc[0.25],
        "q2": quantiles.loc[0.5],
        "q3": quantiles.loc[0.75],
        "min": quantiles.loc[0],
        "max": quantiles.loc[1],
        "uifence": upper_inner_fence,
        "lifence": lower_inner_fence
    }).fillna(0)
    data = DocuScopeData()
    if 'assignments' in stats.__fields_set__:
        data.assignment = ", ".join(stats.assignments)
    if 'courses' in stats.__fields_set__:
        data.course = ", ".join(stats.courses)
    if 'instructors' in stats.__fields_set__:
        data.instructor = ", ".join(stats.instructors)
    qud = quants.to_dict('index')
    data.categories = [{**di, **qud[di['id']]} for di in stats.categories]
    # want frequency not raw
    data.data = [{'id': k, **v} for k, v in dataf.to_dict('index').items()]
    logging.info("Returned data: %s", data)
    return data

@router.post('/ds_data', response_model=DocuScopeData,
             responses=ERROR_RESPONSES)
async def get_ds_data(corpus: List[UUID],
                      db_session: Session = Depends(get_db_session)):
    """Responds to "ds_data" requests."""
    if not corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    logging.info("Metadata request for %s", corpus)
    try:
        data = calculate_data(get_stats(corpus, db_session))
    except Exception as exp:
        traceback.print_exc()
        logging.error(exp)
        raise exp
    return data
