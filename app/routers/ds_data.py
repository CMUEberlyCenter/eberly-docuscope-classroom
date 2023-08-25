""" Handles /ds_data requests. """
import logging
import traceback
from typing import Optional
from uuid import UUID

from bounded_fences import bounded_fences
from database import get_documents, session
from fastapi import APIRouter, Depends, HTTPException
from lat_frame import LAT_FRAME
from pandas import DataFrame, concat, merge
from pydantic import ConfigDict, BaseModel
from response import ERROR_RESPONSES
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.status import HTTP_400_BAD_REQUEST

router = APIRouter()


class DocumentData(BaseModel):
    """ Schema for metadata of a document. """
    id: UUID
    title: str # human readable student name or document name
    ownedby: str # 'student' or 'instructor'
    total_words: int = 0
    model_config = ConfigDict(extra='allow')


class CategoryData(BaseModel):
    """ Schema for category metadata. """
    id: str
    #name: str
    #description: str = None
    q1: float
    q2: float  # median
    q3: float
    min: float
    max: float
    uifence: float
    lifence: float


class DocuScopeData(BaseModel):
    """ Response schema for DocuScope statistical data. """
    assignment: Optional[str] = None
    course: Optional[str] = None
    instructor: Optional[str] = None
    categories: list[CategoryData] = []
    data: list[DocumentData] = []


def calculate_data(stats: DataFrame, info: DataFrame) -> DocuScopeData:
    """Generate the boxplot data for this request."""
    data = DocuScopeData()
    data.assignment = ", ".join(info.loc['assignment_name'].unique())
    data.course = ", ".join(info.loc['course_name'].unique())
    data.instructor = ", ".join(info.loc['instructor_name'].unique())
    ### Categories ###
    hdata = merge(LAT_FRAME, stats, left_on="lat",
                  right_index=True, how="outer")
    hdata['lat'] = hdata['lat'].astype("string")  # fix typing from merge
    # Columns: category, clabel, subcategory, sclabel, cluster, cluster_label, dimension, lat, uuid+
    docs = range(8, len(hdata.columns))
    cstats = concat([hdata.iloc[:, [0, *docs]].groupby('category').sum(),
                     hdata.iloc[:, [2, *docs]].groupby('subcategory').sum(),
                     hdata.iloc[:, [4, *docs]].groupby('cluster').sum()])
    cstats = cstats.drop('Other')  # Drop Other cluster
    nstats = cstats / info.loc['total_words'].astype('Int64')
    nstats = nstats.fillna(0)
    quants = nstats.transpose().quantile(q=[0, 0.25, 0.5, 0.75, 1])
    upper_inner_fence, lower_inner_fence = bounded_fences(quants)
    categories = DataFrame({
        "q1": quants.loc[0.25],
        "q2": quants.loc[0.5],
        "q3": quants.loc[0.75],
        "min": quants.loc[0],
        "max": quants.loc[1],
        "uifence": upper_inner_fence,
        "lifence": lower_inner_fence
    }).fillna(0)
    data.categories = [CategoryData(**{'id': i, **d}) for i, d in categories.iterrows()]

    # want frequency not raw
    data.data = [DocumentData(**{'id': k, **v})
                 for k, v in concat([info, nstats]).to_dict().items()]

    logging.info("Returned data: %s", data)
    return data


@router.post('/ds_data', response_model=DocuScopeData,
             responses=ERROR_RESPONSES)
async def get_ds_data(corpus: list[UUID],
                      sql: AsyncSession = Depends(session)):
    """Responds to "ds_data" requests."""
    if not corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    logging.info("Metadata request for %s", corpus)
    try:
        stats, info = await get_documents(corpus, sql)
        data = calculate_data(stats, info)
    except Exception as exp:
        traceback.print_exc()
        logging.error(exp)
        raise exp
    return data
