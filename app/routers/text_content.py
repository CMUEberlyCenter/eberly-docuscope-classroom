""" Get content for single text view. """
from html.parser import HTMLParser
import io
import logging
import re
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette.status import \
    HTTP_400_BAD_REQUEST, \
    HTTP_500_INTERNAL_SERVER_ERROR, \
    HTTP_503_SERVICE_UNAVAILABLE

from ds_db import Assignment, Filesystem
from ds_tones import DocuScopeTones
from response import AssignmentData, DictionaryInformation, ERROR_RESPONSES
from util import get_db_session, get_ds_info

router = APIRouter()

class ToneParser(HTMLParser):
    """ An HTML parser that converts data-key=<lat> to <cluster>. """
    def __init__(self, tones: DocuScopeTones, out: io.StringIO):
        super().__init__()
        self.tones = tones
        self.out = out
    def error(self, message):
        logging.error(message)
        raise RuntimeError(message)
    def handle_starttag(self, tag, attrs):
        self.out.write("<%s" % tag)
        for attr in attrs:
            if attr[0] == 'data-key':
                cluster = self.tones.get_lat_cluster(attr[1])
                if cluster != 'Other':
                    self.out.write(' %s="%s"' % (attr[0], cluster))
            else:
                self.out.write(" %s" % attr[0])
                if attr[1]:
                    self.out.write('="%s"' % attr[1])
        self.out.write(">")
    def handle_endtag(self, tag):
        self.out.write("</%s>" % tag)
    def handle_data(self, data):
        self.out.write(data)
    def handle_comment(self, data):
        self.out.write("<!-- %s -->" % data)
    def handle_decl(self, decl):
        self.out.write("<!%s>" % decl)

class DictionaryEntry(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for dimension->cluster mapping."""
    dimension: str = ...
    cluster: str = ...

class DictInfo(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for dictionary information."""
    cluster: List[DictionaryInformation] = []
    dimension: List[DictionaryInformation] = []

class TextContent(AssignmentData): #pylint: disable=too-few-public-methods
    """Schema for text_content data."""
    text_id: str = ...
    word_count: int = 0
    html_content: str = ""

@router.get('/text_content/{file_id}', response_model=TextContent,
            responses=ERROR_RESPONSES)
def get_tagged_text(file_id: UUID,
                    db_session: Session = Depends(get_db_session)):
    """Get the tagged text information for the given file."""
    if not file_id:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    doc, filename, state, a_name, a_course, a_instructor = db_session.query(
        Filesystem.processed, Filesystem.name, Filesystem.state,
        Assignment.name, Assignment.course, Assignment.instructor
    ).filter_by(id=file_id).filter(Assignment.id == Filesystem.assignment).first()
    if state in ('pending', 'submitted'):
        logging.error("%s has state %s", file_id, state)
        raise HTTPException(detail="Document is still being processed, try again later.",
                            status_code=HTTP_503_SERVICE_UNAVAILABLE)
    if state == 'error':
        logging.error("Error while tagging: %s", doc)
        raise HTTPException(detail="Error while tagging document.",
                            status_code=HTTP_500_INTERNAL_SERVER_ERROR)
    if not doc:
        logging.error("File not found %s", file_id.text_id)
        raise HTTPException(detail="File not found %s" % file_id.text_id,
                            status_code=HTTP_400_BAD_REQUEST)
    ds_info = get_ds_info(doc['ds_dictionary'], db_session)
    res = TextContent(text_id=filename or file_id.text_id,
                      word_count=doc['ds_num_word_tokens'],
                      course=a_course,
                      instructor=a_instructor,
                      assignment=a_name,
                      categories=ds_info['cluster'])
    html_content = doc['ds_output']
    html_content = re.sub(r'(\n|\s)+', ' ', html_content)
    html = "<p>" + html_content.replace("PZPZPZ", "</p><p>") + "</p"
    tones = DocuScopeTones(doc['ds_dictionary'])
    buf = io.StringIO()
    parser = ToneParser(tones, buf)
    parser.feed(html)
    parser.close()
    res.html_content = buf.getvalue()
    buf.close()
    return res
