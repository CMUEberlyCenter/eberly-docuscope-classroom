""" Handle /document requests. """
import logging
import re
from collections import Counter, defaultdict
from typing import List
from uuid import UUID

from count_patterns import CategoryPatternData, count_patterns, sort_patterns
from ds_db import Assignment, Filesystem
from fastapi import APIRouter, Depends, HTTPException
from lat_frame import LAT_MAP
from lxml import etree
from lxml.html import Classes
from pydantic import BaseModel
from response import ERROR_RESPONSES, AssignmentData
from sqlalchemy.orm import Session
from starlette.status import HTTP_400_BAD_REQUEST
from util import document_state_check, get_db_session

router = APIRouter()

class Document(BaseModel):
    """ Schema for tagged document information. """
    text_id: str = ...
    owner: str = ...
    ownedby: str = ...
    word_count: int = 0
    html_content: str = ""
    patterns: List[CategoryPatternData]

class Documents(AssignmentData):
    """ Schema for a collection of tagged documents. """
    documents: List[Document]

@router.get('/document/{file_id}', response_model=Documents,
            responses=ERROR_RESPONSES)
async def get_document(file_id: UUID,
                       db_session: Session = Depends(get_db_session)):
    """Get the tagged text information for the given file."""
    return await get_documents([file_id], db_session)

@router.post('/document', response_model=Documents, responses=ERROR_RESPONSES)
async def get_documents(corpus: List[UUID],
                        db_session: Session = Depends(get_db_session)):
    """ Responds to post requests for tagged documents. """
    #pylint: disable=too-many-locals
    if not corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    logging.info("Document request for %s", corpus)
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
        #if ds_dict is None:
        #    ds_dict = doc['ds_dictionary']
        #if ds_dict != doc['ds_dictionary']:
        #    logging.error('Dictionary incompatibility: %s != %s',
        #                  ds_dict, doc['ds_dictionary'])
        #    raise HTTPException(
        #        detail="Submitted documents are tagged with incompatible dictionaries.",
        #        status_code=HTTP_400_BAD_REQUEST)
        course.add(a_course)
        instructor.add(a_instructor)
        assignment.add(a_name)
        html_content = re.sub(r'(\n|\s)+', ' ', doc['ds_output'])
        html = "<body><p>" + re.sub(r"<span[^>]*>\s*PZPZPZ\s*</span>",
                                    "</p><p>", html_content) + "</p></body>"
        pats = defaultdict(Counter)
        try:
            etr = etree.fromstring(html)
        except Exception as exp:
            logging.error(html)
            raise exp
        count_patterns(etr, pats)
        for tag in etr.iterfind(".//*[@data-key]"):
            lat = tag.get('data-key')
            categories = LAT_MAP[lat]
            #TODO: clear bad lats from data-key?
            #tag.set('data-key', None)
            if categories:
                if categories['cluster'] != 'Other': # Filter out Other
                    cats = [categories['category'],
                            categories['subcategory'],
                            categories['cluster']]
                    cpath = " > ".join([categories['category'],
                                        categories['subcategory'],
                                        categories['cluster_label']])
                    sup = etree.SubElement(tag, "sup")
                    sup.text = "{" + cpath + "}"
                    sclasses = Classes(sup.attrib)
                    sclasses |= cats
                    sclasses |= ['d_none', 'cluster_id']
                    tclasses = Classes(tag.attrib)
                    tclasses |= cats
                    tag.set('data-key', cpath)
            else:
                logging.info("No category mapping for %s.", lat)
        docs.append(Document(
            text_id=filename,
            owner=fullname,
            ownedby=ownedby,
            word_count=doc['ds_num_word_tokens'],
            html_content=etree.tostring(etr),
            patterns=sort_patterns(pats)
        ))
    if len(course) > 1 or len(instructor) > 1 or len(assignment) > 1:
        raise HTTPException(
            detail="Specified documents are from different sections and cannot be compared.",
            status_code=HTTP_400_BAD_REQUEST)
    return Documents(
        course=course.pop() if course else None,
        instructor=instructor.pop() if instructor else None,
        assignment=assignment.pop() if assignment else None,
        #categories=ds_info['cluster'],
        documents=docs
    )
