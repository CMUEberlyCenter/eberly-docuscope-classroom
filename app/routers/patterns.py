""" Handles /patterns requests. """
from collections import defaultdict, Counter
from functools import partial
import logging
from operator import itemgetter
from typing import List
from uuid import UUID

from bs4 import BeautifulSoup as bs
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette.status import HTTP_400_BAD_REQUEST

from ds_db import Filesystem
from ds_tones import DocuScopeTones
from response import DictionaryInformation, ERROR_RESPONSES
from util import document_state_check, get_db_session, get_ds_info

router = APIRouter()

def count_patterns(node, ds_dict, patterns_all):
    """Accumulate patterns for each category into patterns_all."""
    content = ''
    for child in node.children:
        if getattr(child, 'name', None):
            if 'class' in child.attrs and 'tag' in child.attrs['class']:
                words = count_patterns(child, ds_dict, patterns_all)
                key = ' '.join(words).lower().strip()
                content += ' ' + key
                cluster = ds_dict[child.attrs['data-key']].get('cluster', '?')
                if cluster != 'Other':
                    patterns_all[cluster].update([key])
            elif 'token' in child.attrs['class']:
                if child.text.isspace():
                    content += child.text
                else:
                    content += child.text.strip()
        else:
            try:
                if not child.isspace():
                    content += child
            except (AttributeError, TypeError) as exc:
                logging.error("Node: %s, Error: %s", child, exc)
    return content.split('PZPZPZ')

class PatternData(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for pattern data."""
    pattern: str = ...
    count: int = 0

class CategoryPatternData(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for pattern data for each category."""
    category: DictionaryInformation = ...
    patterns: List[PatternData] = []

@router.post('/patterns', response_model=List[CategoryPatternData],
             responses=ERROR_RESPONSES)
def patterns(corpus: List[UUID],
             db_session: Session = Depends(get_db_session)):
    """Generate the list of categorized patterns in the given corpus."""
    if not corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    pats = defaultdict(Counter)
    tones = None
    ds_dictionary = ''
    for (uuid, doc, filename, status) in db_session.query(
            Filesystem.id, Filesystem.processed, Filesystem.name,
            Filesystem.state).filter(Filesystem.id.in_(corpus)):
        document_state_check(status, uuid, filename, doc, db_session)
        ds_dictionary = doc['ds_dictionary'] # Check for dictionary consistency
        if not tones or tones.dictionary_name != ds_dictionary:
            tones = DocuScopeTones(ds_dictionary)
        if doc and doc['ds_tag_dict']:
            lats = {
                lat: {"dimension": tones.get_dimension(lat),
                      "cluster": tones.get_lat_cluster(lat)}
                for lat in doc['ds_tag_dict'].keys()
            }
            count_patterns(bs(doc['ds_output'], 'html.parser'), lats, pats)
    ds_info = get_ds_info(ds_dictionary, db_session)
    dsi = ds_info['cluster'] + ds_info['dimension']
    for clust in ds_info['cluster']: # assumes cluster view.
        pats[clust['id']].update([])
    return [
        {'category': next(filter(partial(lambda cur, c: c['id'] == cur, cat), dsi),
                          {'id': cat, 'name': cat.capitalize()}),
         'patterns': sorted(
             sorted([{'pattern': word, 'count': count}
                     for (word, count) in cpats.items()],
                    key=itemgetter('pattern')),
             key=itemgetter('count'), reverse=True)}
        for (cat, cpats) in sorted(
            sorted(pats.items(), key=itemgetter(0)),
            key=lambda pat: -sum(c for (_, c) in pat[1].items()),
            reverse=False)
    ]
