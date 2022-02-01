""" General utility functions for DocuScope classroom """
import logging
from typing import List, Tuple
from uuid import UUID

from fastapi import HTTPException
from pandas import DataFrame, Series
from sqlalchemy.orm import Session
from starlette.requests import Request
from starlette.status import (HTTP_500_INTERNAL_SERVER_ERROR,
                              HTTP_503_SERVICE_UNAVAILABLE)

from ds_db import Assignment, DSDictionary, Filesystem


def get_db_session(request: Request) -> Session:
    """Get the database session from the given request."""
    return request.state.db

def get_ds_info(ds_dict: str, db_session: Session):
    """Get the dictionary of DocuScope Dictionary information."""
    return db_session\
        .query(DSDictionary.class_info)\
        .filter(DSDictionary.name == ds_dict, DSDictionary.enabled)\
        .one_or_none()[0]

def queue_length(db_session: Session):
    """ Returns the number of documents that are yet to be tagged. """
    return db_session.query(Filesystem.id, Filesystem.state)\
                     .filter(Filesystem.state.in_(['pending', 'submitted']))\
                     .count()

def document_state_check(status: str, uuid: UUID, filename: str, doc: str,
                         db_session: Session):
    """ Raises HTTPExceptions when the status is problematic. """
    logging.debug('%s, %s, %s', status, uuid, filename)
    if status == 'error':
        logging.error("Aborting: error in %s (%s): %s", uuid, filename, doc)
        raise HTTPException(
            detail=f"There was an error while tagging {filename}",
            status_code=HTTP_500_INTERNAL_SERVER_ERROR)
    if status != 'tagged':
        queue = queue_length(db_session)
        logging.error("Aborting: %s (%s) has state %s, queue: %s",
                      uuid, filename, status, queue)
        raise HTTPException(
            detail=(f"{filename} is not yet tagged (state: {status})"
                    f" and should be available soon."
                    f" There are {queue} documents queued for tagging."
                    f" Try reloading this page after waiting a bit."
                    f" Contact technical support if this message persists"
                    f" for more than five minutes."),
            status_code=HTTP_503_SERVICE_UNAVAILABLE)
    if not doc:
        logging.error("No tagging data for %s (%s)", filename, uuid)
        raise HTTPException(
            detail=f"No tagging data for {filename}",
            status_code=HTTP_500_INTERNAL_SERVER_ERROR)
    if doc['ds_num_word_tokens'] == 0:
        logging.error("Invalid documenxt, no content for %s (%s)", filename, uuid)
        raise HTTPException(
            detail=f"Tagger failed to parse {filename}",
            status_code=HTTP_500_INTERNAL_SERVER_ERROR)

def get_documents(documents: List[UUID], db_session: Session) -> Tuple[DataFrame, DataFrame]:
    """ Retrieve the documents and preprocess each one. """
    docs = {}
    info = {}
    for doc, fullname, ownedby, filename, doc_id, state, \
        a_name, a_course, a_instructor in \
        db_session.query(Filesystem.processed,
                         Filesystem.fullname,
                         Filesystem.ownedby,
                         Filesystem.name,
                         Filesystem.id,
                         Filesystem.state,
                         Assignment.name,
                         Assignment.course,
                         Assignment.instructor)\
                  .filter(Filesystem.id.in_(documents))\
                  .filter(Assignment.id == Filesystem.assignment):
        document_state_check(state, doc_id, filename, doc, db_session)
        docs[doc_id] = Series({key: val['num_tags'] for key, val in
                               doc['ds_tag_dict'].items()})
        desc = Series(dtype='float64')
        desc['total_words'] = doc['ds_num_word_tokens']
        desc['doc_id'] = doc_id
        desc['title'] = fullname if ownedby == 'student' and fullname \
            else '.'.join(filename.split('.')[0:-1])
        desc['ownedby'] = ownedby
        desc['dictionary_id'] = 'default' #ds_dictionary
        desc['course_name'] = a_course
        desc['assignment_name'] = a_name
        desc['instructor_name'] = a_instructor
        info[doc_id] = desc
    return DataFrame(data=docs, dtype="Int64"), DataFrame(data=info)
