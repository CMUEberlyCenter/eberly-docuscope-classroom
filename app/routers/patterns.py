""" Handles /patterns requests. """
# import logging
from collections import Counter, defaultdict
from typing import List
from uuid import UUID

from count_patterns import CategoryPatternData, count_patterns, sort_patterns
from ds_db import Filesystem
from fastapi import APIRouter, Depends, HTTPException
from lxml import etree
from response import ERROR_RESPONSES
from sqlalchemy.orm import Session
from starlette.status import HTTP_400_BAD_REQUEST
from util import document_state_check, get_db_session

router = APIRouter()

@router.post('/patterns', response_model=List[CategoryPatternData],
             responses=ERROR_RESPONSES)
def patterns(corpus: List[UUID],
             db_session: Session = Depends(get_db_session)):
    """Generate the list of categorized patterns in the given corpus."""
    if not corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    pats = defaultdict(Counter)
    for (uuid, doc, filename, status) in db_session.query(
            Filesystem.id, Filesystem.processed, Filesystem.name,
            Filesystem.state).filter(Filesystem.id.in_(corpus)):
        document_state_check(status, uuid, filename, doc, db_session)
        if doc and doc['ds_tag_dict']:
            etr = etree.fromstring(f"<body>{doc['ds_output']}</body>")
            count_patterns(etr, pats)
    return sort_patterns(pats)
