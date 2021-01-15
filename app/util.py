""" General utility functions for DocuScope classroom """
import logging
from typing import List
from uuid import UUID

from fastapi import HTTPException
from pandas import DataFrame, Series
from starlette.requests import Request
from starlette.status import \
    HTTP_400_BAD_REQUEST, \
    HTTP_500_INTERNAL_SERVER_ERROR, \
    HTTP_503_SERVICE_UNAVAILABLE
from sqlalchemy.orm import Session

from ds_db import Assignment, DSDictionary, Filesystem
from ds_tones import DocuScopeTones
from response import LevelEnum, LevelFrame

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
    logging.warning('%s, %s, %s', status, uuid, filename)
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

def get_documents(documents: List[UUID], db_session: Session) -> DataFrame:
    """ Retrieve the documents and preprocess each one. """
    docs = {}
    for doc, fullname, ownedby, filename, doc_id, state, ds_dictionary, \
        a_name, a_course, a_instructor in \
        db_session.query(Filesystem.processed,
                         Filesystem.fullname,
                         Filesystem.ownedby,
                         Filesystem.name,
                         Filesystem.id,
                         Filesystem.state,
                         DSDictionary.name,
                         Assignment.name,
                         Assignment.course,
                         Assignment.instructor)\
                  .filter(Filesystem.id.in_(documents))\
                  .filter(Assignment.id == Filesystem.assignment)\
                  .filter(DSDictionary.id == Assignment.dictionary):
        document_state_check(state, doc_id, filename, doc, db_session)
        ser = Series({key: val['num_tags'] for key, val in
                      doc['ds_tag_dict'].items()})
        ser['total_words'] = doc['ds_num_word_tokens']
        #ser['doc_id'] = doc_id
        ser['title'] = fullname if ownedby == 'student' and fullname \
            else '.'.join(filename.split('.')[0:-1])
        ser['ownedby'] = ownedby
        ser['dictionary_id'] = ds_dictionary
        ser['course_name'] = a_course
        ser['assignment_name'] = a_name
        ser['instructor_name'] = a_instructor
        docs[doc_id] = ser
    return DataFrame(data=docs)

def get_stats(documents: List[UUID], db_session: Session) -> LevelFrame:
    """Retrieve the tagging statistics for the given set of documents."""
    logging.info("Generating Frame for %s", documents)
    frame = LevelFrame(corpus=documents)
    ds_stats = get_documents(documents, db_session)
    if ds_stats.empty:
        logging.error("Failed to retrieve stats for corpus: %s", documents)
        raise HTTPException(
            detail=(f"Document(s) submitted for analysis are not tagged, "
                    f"please close this window and wait a couple of minutes. "
                    f"If problem persists, please contact technical support."),
            status_code=HTTP_503_SERVICE_UNAVAILABLE)
    ds_dictionaries = ds_stats.loc['dictionary_id'].unique()
    if len(ds_dictionaries) != 1:
        logging.error("Inconsistant dictionaries in corpus %s", documents)
        raise HTTPException(
            detail=(f"Inconsistant dictionaries specified for tagging "
                    f"this corpus, documents are not comparable "
                    f"({', '.join(ds_dictionaries)})."),
            status_code=HTTP_400_BAD_REQUEST)
    frame.ds_dictionary = ds_dictionaries[0]
    frame.courses = list(ds_stats.loc['course_name'].unique())
    frame.assignments = list(ds_stats.loc['assignment_name'].unique())
    frame.instructors = list(ds_stats.loc['instructor_name'].unique())
    ds_info = get_ds_info(frame.ds_dictionary, db_session)
    frame.categories = ds_info['cluster']
    ds_stats = ds_stats.transpose()
    tones = DocuScopeTones(frame.ds_dictionary)
    data = {}
    tone_lats = []
    # TODO: add leveled stats
    # TODO: move this analysis to tagging
    # TODO: read leveled JSON common dictionary
    if frame.level == LevelEnum.dimension:
        tone_lats = tones.map_dimension_to_lats().items()
    elif frame.level == LevelEnum.cluster:
        tone_lats = tones.map_cluster_to_lats().items()
    for category, lats in tone_lats:
        sumframe = ds_stats.filter(lats)
        data[category] = sumframe.transpose().sum()
    logging.debug(data)
    dframe = DataFrame(data)
    dframe['total_words'] = ds_stats['total_words']
    dframe['title'] = ds_stats['title']
    dframe['ownedby'] = ds_stats['ownedby']
    logging.debug(dframe)
    frame.frame = dframe.transpose().to_dict()
    return frame
