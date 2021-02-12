""" Handles /patterns requests. """
from collections import defaultdict, Counter
#from functools import partial
import logging
#from operator import itemgetter
from typing import List
from uuid import UUID

#from bs4 import BeautifulSoup as bs
from bs4.element import Tag
from deprecation import deprecated
from fastapi import APIRouter, Depends, HTTPException
from lxml import etree
#from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette.status import HTTP_400_BAD_REQUEST

from count_patterns import fast_count_patterns, CategoryPatternData, sort_patterns
from ds_db import Filesystem
from lat_frame import LAT_FRAME
from response import ERROR_RESPONSES
from util import document_state_check, get_db_session

router = APIRouter()

#@deprecated(deprecated_in="5.0.0", detail="Use fast_count_patterns instead")
def count_patterns(node, patterns_all):
    """Accumulate patterns for each category into patterns_all."""
    content = ''
    for child in node.children:
        if isinstance(child, Tag): #'name' in child: #getattr(child, 'name', None):
            if 'class' in child.attrs:
                if 'tag' in child['class']:
                    words = count_patterns(child, patterns_all)
                    key = ' '.join(words).lower().strip()
                    content = f'{content} {key}'
                    cluster_row = LAT_FRAME[LAT_FRAME.lat == child.attrs['data-key']].head(1)
                    cluster = cluster_row.cluster.iloc[0] if not cluster_row.empty else '?'
                    if cluster != 'Other':
                        patterns_all[cluster].update([key])
                elif 'token' in child['class']:
                    text = child.get_text()
                    if text.isspace():
                        content = f'{content}{text}'
                    else:
                        content = f'{content}{text.strip()}'
        else:
            try:
                if not child.isspace():
                    content = f'{content}{child}'
            except (AttributeError, TypeError) as exc:
                logging.error("Node: %s, Error: %s", child, exc)
    return content.split('PZPZPZ')

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
            fast_count_patterns(etr, pats)
    return sort_patterns(pats)
#[
#        {'category': cat,
#         'patterns': sorted(
#             sorted([{'pattern': word, 'count': count}
#                     for (word, count) in cpats.items()],
#                    key=itemgetter('pattern')),
#             key=itemgetter('count'), reverse=True)}
#        for (cat, cpats) in sorted(
#            sorted(pats.items(), key=itemgetter(0)),
#            key=lambda pat: -sum(c for (_, c) in pat[1].items()),
#            reverse=False)
#    ]
