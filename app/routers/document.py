""" Handle /document requests. """
import logging
import re
from collections import Counter, defaultdict
from uuid import UUID

from count_patterns import CategoryPatternData, count_patterns, sort_patterns
from database import DOCUMENTS_QUERY, Submission, document_state_check, session
from fastapi import APIRouter, Depends, HTTPException
from lat_frame import LAT_MAP
from lxml import etree  # nosec
from lxml.html import Classes  # nosec
from pydantic import BaseModel
from response import ERROR_RESPONSES, AssignmentData
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.status import HTTP_400_BAD_REQUEST

router = APIRouter()


class Document(BaseModel):
    """ Schema for tagged document information. """
    text_id: str = ...
    owner: str = ...
    ownedby: str = ...
    word_count: int = 0
    html_content: str = ""
    patterns: list[CategoryPatternData]


class Documents(AssignmentData):
    """ Schema for a collection of tagged documents. """
    documents: list[Document]


@router.get('/document/{file_id}', response_model=Documents,
            responses=ERROR_RESPONSES)
async def get_document(file_id: UUID,
                       db_session: AsyncSession = Depends(session)):
    """Get the tagged text information for the given file."""
    return await get_documents([file_id], db_session)


@router.post('/document', response_model=Documents, responses=ERROR_RESPONSES)
async def get_documents(corpus: list[UUID],
                        sql: AsyncSession = Depends(session)):
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
    result = await sql.stream(DOCUMENTS_QUERY.where(Submission.id.in_(corpus)))
    parser = etree.XMLParser(load_dtd=False, no_network=True,
                             remove_pis=True, resolve_entities=False)
    async for doc, fullname, ownedby, filename, doc_id, state, \
            a_name, a_course, a_instructor in result:
        await document_state_check(state, doc_id, filename, doc, sql)
        course.add(a_course)
        instructor.add(a_instructor)
        assignment.add(a_name)
        html_content = re.sub(r'(\n|\s)+', ' ', doc['ds_output'])
        html = "<body><p>" + re.sub(r"<span[^>]*>\s*PZPZPZ\s*</span>",
                                    "</p><p>", html_content) + "</p></body>"
        pats = defaultdict(Counter)
        try:
            etr = etree.fromstring(html, parser)  # nosec
        except Exception as p_exp:
            logging.error(html)
            raise p_exp
        count_patterns(etr, pats)
        for tag in etr.iterfind(".//*[@data-key]"):
            lat = tag.get('data-key')
            categories = LAT_MAP.get(lat, None)
            if categories:
                if categories['cluster'] != 'Other':  # Filter out Other
                    cats = [categories['category'],
                            categories['subcategory'],
                            categories['cluster']]
                    cpath = " > ".join([categories['category_label'],
                                        categories['subcategory_label'],
                                        categories['cluster_label']])
                    sup = etree.SubElement(tag, "sup")
                    sup.text = "{" + cpath + "}"
                    sclasses = Classes(sup.attrib)
                    sclasses |= cats
                    sclasses |= ['d_none', 'cluster_id']
                    tclasses = Classes(tag.attrib)
                    tclasses |= cats
                    tag.set('data-key', cpath)
            # else:
            #    logging.info("No category mapping for %s.", lat)
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
        documents=docs
    )
