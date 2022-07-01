""" Handle /document requests. """
import logging
import re
from collections import Counter, defaultdict
from uuid import UUID

from bs4 import BeautifulSoup

from count_patterns import CategoryPatternData, count_patterns, sort_patterns
from database import DOCUMENTS_QUERY, Submission, document_state_check, session
from fastapi import APIRouter, Depends, HTTPException
from lat_frame import LAT_MAP
from pydantic import BaseModel
from response import ERROR_RESPONSES, AssignmentData
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.status import HTTP_400_BAD_REQUEST, HTTP_500_INTERNAL_SERVER_ERROR

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
            soup = BeautifulSoup(html, features="lxml")
        except Exception as exp:
            logging.error("%s (%s): %s", doc_id, filename, html)
            logging.error(exp)
            raise HTTPException(detail="Unparsable tagged text.",
                            status_code=HTTP_500_INTERNAL_SERVER_ERROR) from exp
        count_patterns(soup, pats)
        docs.append(Document(
            text_id=filename,
            owner=fullname,
            ownedby=ownedby,
            word_count=doc['ds_num_word_tokens'],
            html_content=generate_tagged_html(soup),
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

def generate_tagged_html(soup: BeautifulSoup) -> str:
    """Takes an etree and adds the tag elements and classes."""
    for tag in soup.find_all(attrs={"data-key": True}):
        lat = tag.get('data-key', None)
        categories = LAT_MAP.get(lat, None)
        if categories:
            if categories['cluster'] != 'Other':
                cats = [categories['category'],
                        categories['subcategory'],
                        categories['cluster']]
                cpath = " > ".join([categories['category_label'],
                                    categories['subcategory_label'],
                                    categories['cluster_label']])
                sup = soup.new_tag("sup")
                sup.string = f"{{{cpath}}}"
                sup["class"] = sup.get('class', []) + cats + ['d_none', 'cluster_id']
                tag.append(sup)
                tag['class'] = tag.get('class', []) + cats
                tag['data-key'] = cpath
        # else:
        #    logging.info("No category mapping for %s.", lat)
    return str(soup)
