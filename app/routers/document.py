""" Handle /document requests. """
#TODO: handle get requests (single document)
import io
import logging
import re
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette.status import HTTP_400_BAD_REQUEST

from ds_db import Assignment, Filesystem
from ds_tones import DocuScopeTones
from response import AssignmentData, ERROR_RESPONSES
from util import document_state_check, get_db_session, get_ds_info

from .text_content import ToneParser

router = APIRouter()

class Document(BaseModel):
    """ Schema for tagged document information. """
    text_id: str = ...
    owner: str = ...
    ownedby: str = ...
    word_count: int = 0
    html_content: str = ""

class Documents(AssignmentData):
    """ Schema for a collection of tagged documents. """
    documents: List[Document]

@router.post('/document', response_model=Documents, responses=ERROR_RESPONSES)
async def get_document(corpus: List[UUID],
                       db_session: Session = Depends(get_db_session)):
    """ Responds to post requests for tagged documents. """
    if not corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    logging.info("Document request for %s", corpus)
    ds_dict = None
    tones = None
    docs = []
    course = None
    assignment = None
    instructor = None
    for doc, fullname, ownedby, filename, doc_id, state, \
        a_name, a_course, a_instructor in \
        db_session.query(Filesystem.processed, Filesystem.fullname,
                         Filesystem.ownedby, Filesystem.name, Filesystem.id,
                         Filesystem.state,
                         Assignment.name, Assignment.course,
                         Assignment.instructor)\
                  .filter(Filesystem.id.in_(corpus))\
                  .filter(Assignment.id == Filesystem.assignment):
        document_state_check(state, doc_id, filename, doc, db_session)
        if ds_dict is None:
            ds_dict = doc['ds_dictionary']
        if ds_dict != doc['ds_dictionary']:
            logging.error('Dictionary incompatability: %s != %s',
                          ds_dict, doc['ds_dictionary'])
            raise HTTPException(
                detail="Submitted documents are tagged with incomatable dictionaries.",
                status_code=HTTP_400_BAD_REQUEST)
        if course is None:
            course = a_course
        #TODO: course check
        if instructor is None:
            instructor = a_instructor
        #TODO: instructor check
        if assignment is None:
            assignment = a_name
        #TODO: assignment check
        html_content = doc['ds_output']
        html_content = re.sub(r'(\n|\s)+', ' ', html_content)
        html = "<p>" + html_content.replace("PZPZPZ", "</p><p>") + "</p>"
        if tones is None:
            tones = DocuScopeTones(ds_dict)
        buf = io.StringIO()
        parser = ToneParser(tones, buf)
        parser.feed(html)
        parser.close()
        docs.append(Document(
            text_id=filename,
            owner=fullname,
            ownedby=ownedby,
            word_count=doc['ds_num_word_tokens'],
            html_content=buf.getvalue()
        ))
        buf.close()
    ds_info = get_ds_info(ds_dict, db_session)
    return Documents(
        course=course,
        instructor=instructor,
        assignment=assignment,
        categories=ds_info['cluster'],
        documents=docs
    )
