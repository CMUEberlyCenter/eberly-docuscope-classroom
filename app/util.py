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

#def get_ds_info_map(ds_info) -> dict:
#    """Transforms ds_info into a simple id->name map."""
#    return {i['id']: i['name'] for i in ds_info}

def get_stats(documents: List[UUID], db_session: Session) -> LevelFrame:
    """Retrieve the tagging statistics for the given set of documents."""
    logging.info("Generating Frame for %s", documents)
    frame = LevelFrame(corpus=documents)
    stats = {}
    ds_dictionaries = set()
    courses = set()
    assignments = set()
    instructors = set()
    tones = None
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
                  .filter(Filesystem.state == 'tagged')\
                  .filter(Assignment.id == Filesystem.assignment)\
                  .filter(DSDictionary.id == Assignment.dictionary):
        if state == 'error':
            logging.error("Tagging error for %s: %s", doc_id, doc)
            raise HTTPException(
                detail="There was an error tagging %s" % filename,
                status_code=HTTP_500_INTERNAL_SERVER_ERROR)
        if state != 'tagged':
            #TODO: test following...
            proc = db_session.query(Filesystem.id, Filesystem.state)\
                             .filter(Filesystem.id.in_(documents))\
                             .filter(Filesystem.state == 'processing')\
                             .count()
            logging.error("Trying to process untagged entry %s", doc_id)
            raise HTTPException(
                detail="At least %s documents are still being tagged, please try again in a couple of minutes." % proc,
                status_code=HTTP_503_SERVICE_UNAVAILABLE)
        if doc:
            ser = Series({key: val['num_tags'] for key, val in
                          doc['ds_tag_dict'].items()})
            ser['total_words'] = doc['ds_num_word_tokens']
            ser['title'] = fullname if ownedby == 'student' and fullname \
                else '.'.join(filename.split('.')[0:-1])
            ser['ownedby'] = ownedby
            stats[str(doc_id)] = ser
            ds_dictionaries.add(ds_dictionary)
            courses.add(a_course)
            assignments.add(a_name)
            instructors.add(a_instructor)
        else:
            logging.error("No tagging data for %s in %s", filename, documents)
            raise HTTPException(
                detail="No tagging data for %s" % filename,
                status_code=HTTP_500_INTERNAL_SERVER_ERROR)
        if not stats:
            logging.error("Failed to retrieve stats for corpus: %s", documents)
            raise HTTPException(
                detail="Document(s) submitted for analysis are " +
                "not tagged, please close this window and wait " +
                "a couple of minutes. " +
                "If problem persists, please contact technical support.",
                status_code=HTTP_503_SERVICE_UNAVAILABLE)
        if len(ds_dictionaries) != 1:
            logging.error("Inconsistant dictionaries in corpus %s", documents)
            raise HTTPException(
                detail="Inconsistant dictionaries specified for tagging " +
                "this corpus, documents are not comparable.",
                status_code=HTTP_400_BAD_REQUEST)
        frame.ds_dictionary = list(ds_dictionaries)[0]
        frame.courses = list(courses)
        frame.assignments = list(assignments)
        frame.instructors = list(instructors)
        ds_info = get_ds_info(frame.ds_dictionary, db_session)
        frame.categories = ds_info['cluster']
        ds_stats = DataFrame(data=stats).transpose()
        tones = tones if tones else DocuScopeTones(frame.ds_dictionary)
        data = {}
        tone_lats = []
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
