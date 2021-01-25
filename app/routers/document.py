""" Handle /document requests. """
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
#from ds_tones import DocuScopeTones
from lat_frame import LAT_FRAME
from response import AssignmentData, ERROR_RESPONSES
from tone_parser import ToneParser
from util import document_state_check, get_db_session, get_ds_info

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

#@router.get('/document/{file_id}', response_model=Documents,
#            responses=ERROR_RESPONSES)
#def get_document(file_id: UUID,
#                       db_session: Session = Depends(get_db_session)):
#    """Get the tagged text information for the given file."""
#    return get_documents([file_id], db_session)

@router.post('/document', response_model=Documents, responses=ERROR_RESPONSES)
async def get_documents(corpus: List[UUID],
                        db_session: Session = Depends(get_db_session)):
    """ Responds to post requests for tagged documents. """
    #pylint: disable=too-many-locals
    if not corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    logging.info("Document request for %s", corpus)
    ds_dict = None
    #tones = None
    docs = []
    course = set()
    assignment = set()
    instructor = set()
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
            logging.error('Dictionary incompatibility: %s != %s',
                          ds_dict, doc['ds_dictionary'])
            raise HTTPException(
                detail="Submitted documents are tagged with incompatible dictionaries.",
                status_code=HTTP_400_BAD_REQUEST)
        course.add(a_course)
        instructor.add(a_instructor)
        assignment.add(a_name)
        html_content = re.sub(r'(\n|\s)+', ' ', doc['ds_output'])
        html = "<p>" + html_content.replace("PZPZPZ", "</p><p>") + "</p>"
        #if tones is None:
        #    tones = DocuScopeTones(ds_dict)
        buf = io.StringIO()
        parser = ToneParser(LAT_FRAME, buf)
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
    if len(course) > 1 or len(instructor) > 1 or len(assignment) > 1:
        raise HTTPException(
            detail="Specified documents are from different sections and cannot be compared.",
            status_code=HTTP_400_BAD_REQUEST)
    return Documents(
        course=course.pop() if course else None,
        instructor=instructor.pop() if instructor else None,
        assignment=assignment.pop() if assignment else None,
        categories=ds_info['cluster'],
        documents=docs
    )
