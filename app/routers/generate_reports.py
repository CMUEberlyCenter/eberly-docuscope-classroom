""" Handles /generate_reports requests. """
import logging
import re
import traceback
from typing import List
from uuid import UUID

from ds_db import Filesystem
from ds_report import generate_pdf_reports
from ds_tones import DocuScopeTones
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pandas import DataFrame
from pydantic import BaseModel
from response import ERROR_RESPONSES
from sqlalchemy.orm import Session
from starlette.status import (HTTP_200_OK, HTTP_400_BAD_REQUEST,
                              HTTP_500_INTERNAL_SERVER_ERROR)
from util import document_state_check, get_db_session, get_stats

from routers.ds_data import calculate_data

router = APIRouter()

class ReportsSchema(BaseModel):
    """Schema for '/report' requests."""
    corpus: List[UUID] = ...
    intro: str = None
    stv_intro: str = None

def get_reports(ids: List[UUID], gintro, sintro, db_session: Session):
    """Generate the report for this corpus."""
    stats = get_stats(ids, db_session)
    tones = DocuScopeTones(stats.ds_dictionary)
    documents = {}
    for (uuid, doc, filename, status) in db_session.query(
            Filesystem.id, Filesystem.processed, Filesystem.name,
            Filesystem.state).filter(Filesystem.id.in_(ids)):
        document_state_check(status, uuid, filename, doc, db_session)
        tagged = {
            'html_content': re.sub(r'(\n|\s)+', ' ', doc['ds_output']),
            'dict': {}
        }
        if doc['ds_tag_dict']:
            tagged['dict'] = {
                lat: {"dimension": tones.get_dimension(lat),
                      "cluster": tones.get_lat_cluster(lat)}
                for lat in doc['ds_tag_dict'].keys()
            }
        documents[uuid] = tagged

    descriptions = {
        #'course': ", ".join(stats.courses), # redundant
        #'assignment': ", ".join(stats.assignments), # redundant
        #'instructor': ", ".join(stats.instructors), # redundant
        'intro': gintro,
        'stv_intro': sintro
    }
    return generate_pdf_reports(DataFrame.from_dict(stats.frame),
                                documents,
                                stats.ds_dictionary,
                                calculate_data(stats),
                                descriptions)

@router.post('/generate_reports',
             #response_class=StreamingResponse,
             responses={
                 **ERROR_RESPONSES,
                 HTTP_200_OK: {
                     "content": {"application/zip": {}},
                     "description": "Return the zip archive of reports."
                 }
             })
async def generate_reports(corpus: ReportsSchema,
                           db_session: Session = Depends(get_db_session)):
    """Responds to generate_reports requests by streaming the report zipfile."""
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    #if corpus.level is not LevelEnum.cluster:
    #    logging.warning("Level is not Cluster, resetting.")
    #    corpus.level = LevelEnum.cluster
    try:
        zip_buffer = get_reports(corpus.corpus,
                                 corpus.intro,
                                 corpus.stv_intro,
                                 db_session)
    except Exception as excp:
        logging.error("%s\n%s", corpus.corpus, excp)
        traceback.print_exc()
        raise HTTPException(
            detail="ERROR in report generation.",
            status_code=HTTP_500_INTERNAL_SERVER_ERROR) from excp
    return StreamingResponse(zip_buffer, media_type='application/zip',
                             headers={'Content-Disposition':
                                      "attachment; filename='report.zip'"})
