"""DocuScope Classroom analysis tools interface."""
from collections import defaultdict, Counter
from enum import Enum
from functools import partial
import logging
from operator import itemgetter
import re
import traceback
from typing import Dict, List
from uuid import UUID

from bs4 import BeautifulSoup as bs
from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import Response, StreamingResponse, FileResponse
from starlette.staticfiles import StaticFiles
from starlette.status import HTTP_400_BAD_REQUEST, \
    HTTP_422_UNPROCESSABLE_ENTITY, HTTP_500_INTERNAL_SERVER_ERROR, \
    HTTP_503_SERVICE_UNAVAILABLE
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pandas import DataFrame, Series
from default_settings import Config
from ds_db import Assignment, DSDictionary, Filesystem
from ds_groups import get_best_groups
from ds_report import generate_pdf_reports
from ds_tones import DocuScopeTones

# Setup database sesson manager
ENGINE = create_engine(
    Config.SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=True,
    pool_recycle=3600)
SESSION = sessionmaker(autocommit=False, autoflush=False, bind=ENGINE)

# Setup API service.
app = FastAPI( #pylint: disable=invalid-name
    title="DocuScope Classroom Analysis Tools",
    description="Collection of corpus analysis tools to be used in a classroom.",
    version="3.0.0",
    license={
        'name': 'CC BY-NC-SA 4.0',
        'url': 'https://creativecommons.org/licenses/by-nc-sa/4.0/'
    })

#python -c 'import os; print(os.urandom(16))' =>
#secret_key = b'\xf7i\x0b\xb5[)C\x0b\x15\xf0T\x13\xe1\xd2\x9e\x8a'

## Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['GET', 'POST'],
    allow_headers=['*'])

## Add custom middleware for database connection.
@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    """Middleware for adding database sessions to a request."""
    response = Response("Internal server error",
                        status_code=HTTP_500_INTERNAL_SERVER_ERROR)
    try:
        request.state.db = SESSION()
        request.state.db.flush()
        response = await call_next(request)
        request.state.db.commit()
    except Exception as exp: #pylint: disable=broad-except
        traceback.print_exc()
        logging.error(exp)
        response = Response("Internal server error: %s" % exp,
                            status_code=HTTP_500_INTERNAL_SERVER_ERROR)
        request.state.db.rollback()
    finally:
        request.state.db.close()
    return response

def get_db_session(request: Request) -> Session:
    """Get the database session from the given request."""
    return request.state.db

def get_request(request: Request) -> Request:
    """Get the Request."""
    return request

def get_ds_info(ds_dict: str, db_session: Session):
    """Get the dictionary of DocuScope Dictionary information."""
    return db_session\
        .query(DSDictionary.class_info)\
        .filter(DSDictionary.name == ds_dict, DSDictionary.enabled)\
        .one_or_none()[0]

def get_ds_info_map(ds_info) -> dict:
    """Transforms ds_info into a simple id->name map."""
    return {i['id']: i['name'] for i in ds_info['cluster'] + ds_info['dimension']}

class ErrorResponse(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for error response."""
    detail: str

class LevelEnum(str, Enum):
    """Enumeration of the possible analysis levels."""
    dimension = "Dimension"
    cluster = "Cluster"

class LevelFrame(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for an analysis level data frame."""
    corpus: List[UUID] = []
    level: LevelEnum = LevelEnum.cluster
    ds_dictionary: str = ...
    assignments: List[str] = []
    courses: List[str] = []
    instructors: List[str] = []
    frame: dict = None

class DocumentSchema(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for a document."""
    id: UUID = ...
    data: str = None

class CorpusSchema(BaseModel):
    """Schema for '/boxplot_data' requests."""
    corpus: List[DocumentSchema] = ...
    level: LevelEnum = LevelEnum.cluster

    def documents(self):
        """Gets a list of document ids for this corpus."""
        return [d.id for d in self.corpus]  #pylint: disable=not-an-iterable
    def corpus_index(self) -> str:
        """Generate the id for this corpus."""
        # key limit of 250 characters for memcached
        key = [str(self.level)]
        key.extend(sorted([str(d.id) for d in self.corpus])) #pylint: disable=not-an-iterable
        return str(hash(tuple(key)))
    def make_level_frame(self, db_session: Session) -> LevelFrame:  #pylint: disable=too-many-locals
        """Make the LevelFrame for the corpus."""
        logging.info('Generating Level Frame')
        logging.info('Retrieving stats from database')
        stats = {}
        ds_dictionaries = set()
        courses = set()
        assignments = set()
        instructors = set()
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
                      .filter(Filesystem.id.in_(self.documents()))\
                      .filter(Filesystem.state == 'tagged')\
                      .filter(Assignment.id == Filesystem.assignment)\
                      .filter(DSDictionary.id == Assignment.dictionary):
            if state == 'error':
                raise HTTPException(
                    detail="There was an error tagging %s" % filename,
                    status_code=HTTP_500_INTERNAL_SERVER_ERROR)
            if state != 'tagged':
                raise HTTPException(
                    detail="Some of the documents are not yet tagged,"
                    + " please try again in a couple of minutes.",
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
        if not stats:
            logging.error("Failed to retrieve stats for corpus: %s",
                          self.documents())
            raise HTTPException(
                detail="Document(s) submitted for analysis are " +
                "not tagged, please close this window and wait " +
                "a couple of minutes. " +
                "If problem persists, please contact technical support.",
                status_code=HTTP_503_SERVICE_UNAVAILABLE)
        if len(ds_dictionaries) != 1:
            logging.error("Inconsistant dictionaries in corpus %s",
                          self.documents())
            raise HTTPException(
                detail="Inconsistant dictionaries used in tagging " +
                "this corpus, documents are not comparable.",
                status_code=HTTP_400_BAD_REQUEST)
        ds_dictionary = list(ds_dictionaries)[0]
        ds_stats = DataFrame(data=stats).transpose()
        tones = DocuScopeTones(ds_dictionary)
        data = {}
        tone_lats = []
        if self.level == LevelEnum.dimension:
            tone_lats = tones.map_dimension_to_lats().items()
        elif self.level == LevelEnum.cluster:
            tone_lats = tones.map_cluster_to_lats().items()
        for category, lats in tone_lats:
            sumframe = ds_stats.filter(lats)
            data[category] = sumframe.transpose().sum()
        logging.debug(data)
        frame = DataFrame(data)
        frame['total_words'] = ds_stats['total_words']
        frame['title'] = ds_stats['title']
        frame['ownedby'] = ds_stats['ownedby']
        logging.debug(frame)
        lframe = frame.transpose()
        return LevelFrame(ds_dictionary=ds_dictionary,
                          corpus=self.documents(),
                          frame=lframe.to_dict(),
                          level=self.level,
                          courses=list(courses),
                          assignments=list(assignments),
                          instructors=list(instructors))
    def get_stats(self, db_session: Session):
        """Retrieve or generate the basic statistics for this corpus."""
        try:
            level_frame = self.make_level_frame(db_session)
            if level_frame:
                level_frame = dict(level_frame)
            logging.info(level_frame)
            return LevelFrame(**level_frame)
        except Exception as exp:
            traceback.print_exc()
            raise exp
    def get_frame(self, db_session: Session) -> DataFrame:
        """Get the dataframe for the corpus."""
        stats = self.get_stats(db_session)
        return DataFrame.from_dict(stats.frame)

class BoxplotSchema(CorpusSchema):
    """Schema for 'boxplot_data' requests."""
    def get_bp_data(self, db_session: Session): #pylint: disable=too-many-locals
        """Generate the boxplot data for this request."""
        stats = self.get_stats(db_session)
        frame = DataFrame.from_dict(stats.frame)
        logging.warning(stats.frame)
        #logging.warning(frame)
        frame = frame.drop('title').drop('ownedby', errors='ignore')
        frame = frame.apply(lambda x: x.divide(x['total_words'])
                            if x['total_words'] else Series(0, index=x.index))
        logging.warning(frame)
        frame = frame.drop('total_words').drop('Other', errors='ignore')
        frame = frame.transpose()
        frame = frame.fillna(0)
        categories = frame.columns
        quantiles = frame.quantile(q=[0, 0.25, 0.5, 0.75, 1])
        iqr = quantiles.loc[0.75] - quantiles.loc[0.25]
        upper_inner_fence = quantiles.loc[0.75] + 1.5 * iqr
        lower_inner_fence = (quantiles.loc[0.25] - 1.5 * iqr).apply(lambda x: 0 if x < 0 else x)
        outliers = []
        for category in frame:
            for point_title, value in frame[category].iteritems():
                if value > upper_inner_fence[category] or value < lower_inner_fence[category]:
                    outliers.append({
                        'pointtitle': point_title,
                        'value': value,
                        'category': category
                    })
        quants = DataFrame({
            "q1": quantiles.loc[0.25],
            "q2": quantiles.loc[0.5],
            "q3": quantiles.loc[0.75],
            "min": quantiles.loc[0],
            "max": quantiles.loc[1],
            "uifence": upper_inner_fence,
            "lifence": lower_inner_fence
        }).fillna(0)
        quants['category_label'] = categories
        quants.replace(get_ds_info_map(get_ds_info(stats.ds_dictionary,
                                                   db_session)), inplace=True)
        quants['category'] = categories
        bpdata = quants.to_dict('records')
        bpdata.reverse()
        logging.info(bpdata)
        logging.info(outliers)
        data = {"bpdata": bpdata, "outliers": outliers}
        if 'assignments' in stats.__fields_set__ and len(stats.assignments) == 1:
            data['assignment'] = stats.assignments[0]
        if 'courses' in stats.__fields_set__ and len(stats.courses) == 1:
            data['course'] = stats.courses[0]
        if 'instructors' in stats.__fields_set__ and len(stats.instructors) == 1:
            data['instructor'] = stats.instructors[0]
        return data

class BoxplotDataEntry(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for a boxplot data point."""
    q1: float = ...
    q2: float = ...
    q3: float = ...
    min: float = ...
    max: float = ...
    uifence: float = ...
    lifence: float = ...
    category: str = ...
    category_label: str = None
class BoxplotDataOutlier(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for boxplot outliers."""
    pointtitle: str = ...
    value: float = ...
    category: str = ...

class AssignmentData(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for information about the assignment."""
    assignment: str = None
    course: str = None
    instructor: str = None

class BoxplotData(AssignmentData): #pylint: disable=too-few-public-methods
    """Schema for 'boxplot_data' responses."""
    bpdata: List[BoxplotDataEntry] = ...
    outliers: List[BoxplotDataOutlier] = None

@app.post('/boxplot_data', response_model=BoxplotData,
          responses={
              HTTP_400_BAD_REQUEST: {
                  "model": ErrorResponse,
                  "description": "Bad Request"},
              HTTP_500_INTERNAL_SERVER_ERROR: {
                  "model": ErrorResponse,
                  "description": "Internal Server Error"},
              HTTP_503_SERVICE_UNAVAILABLE: {
                  "model": ErrorResponse,
                  "description": "Service Unavailable (untagged documents)"}
          })
def get_boxplot_data(corpus: BoxplotSchema,
                     # session: dict = Depends(get_http_session),
                     # request: Request = Depends(get_request),
                     db_session: Session = Depends(get_db_session)):
    """Responds to "boxplot_data" requests."""
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    # logging.warning("session: %s", request.session)
    # request.session.update({'corpus': corpus.corpus_index()})
    # logging.warning("session: %s", request.session)
    return corpus.get_bp_data(db_session)

class RankListSchema(CorpusSchema):
    """Schema for '/ranked_list' requests."""
    sortby: str = ...

class RankDataEntry(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for each entry in RankData."""
    index: str = ... # internal document id
    text: str = ... # reference id (student name or document name)
    value: float = ... # instances/words
    ownedby: str = ... # 'student' or 'instructor'

class RankData(AssignmentData): #pylint: disable=too-few-public-methods
    """Schema for "ranked_list" responses."""
    category: str = None
    category_name: str = None
    median: float = None
    result: List[RankDataEntry] = ...

@app.post('/ranked_list', response_model=RankData,
          responses={
              HTTP_400_BAD_REQUEST: {
                  "model": ErrorResponse,
                  "description": "Bad Request"},
              HTTP_500_INTERNAL_SERVER_ERROR: {
                  "model": ErrorResponse,
                  "description": "Internal Server Error"
              },
              HTTP_503_SERVICE_UNAVAILABLE: {
                  "model": ErrorResponse,
                  "description": "Service Unavailable (untagged documents)"
              }
          })
def get_rank_list(corpus: RankListSchema,
                  # session: dict = Depends(get_http_session),
                  # request: Request = Depends(get_request),
                  db_session: Session = Depends(get_db_session)):
    """Responds to "ranked_list" requests.

    This constructs the rankings of the documents in the given corpus by
    comparing the frequencies of the corpus.sortby category/dimension
    limited to the first 50 documents.
    """
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    # logging.warning("session %s", request.session)
    stats = corpus.get_stats(db_session)
    frame = DataFrame.from_dict(stats.frame)
    logging.info(frame)
    title_row = frame.loc['title']
    owner_row = frame.loc['ownedby']
    frame = frame.drop('title').drop('ownedby', errors='ignore').drop('Other', errors='ignore')
    frame = frame.apply(lambda x: x.divide(x['total_words'])
                        if x['total_words'] else Series(0, index=x.index))
    frame = frame.drop('total_words').append(title_row).append(owner_row)
    frame = frame.transpose()
    frame = frame.fillna(0)
    if corpus.sortby not in frame:
        logging.error("%s is not in %s", corpus.sortby, frame.columns)
        raise HTTPException(
            detail="{} is not in {}".format(corpus.sortby,
                                            frame.columns.values),
            status_code=HTTP_422_UNPROCESSABLE_ENTITY)
    frame = frame.loc[:, ['title', corpus.sortby, 'ownedby']]
    frame.reset_index(inplace=True)
    frame.rename(columns={'title': 'text', corpus.sortby: 'value'},
                 inplace=True)
    frame.sort_values('value', ascending=False, inplace=True)
    v_avg = frame['value'].quantile()
    frame = frame.head(50)
    frame = frame[frame.value != 0]
    #logging.info(frame.to_dict('records'))
    ds_map = get_ds_info_map(get_ds_info(stats.ds_dictionary, db_session))
    data = {'category': corpus.sortby,
            'category_name': ds_map[corpus.sortby],
            'median': v_avg,
            'result': frame.to_dict('records')}
    if 'assignments' in stats.__fields_set__ and len(stats.assignments) == 1:
        data['assignment'] = stats.assignments[0]
    if 'courses' in stats.__fields_set__ and len(stats.courses) == 1:
        data['course'] = stats.courses[0]
    if 'instructors' in stats.__fields_set__ and len(stats.instructors) == 1:
        data['instructor'] = stats.instructors[0]
    return data

class ScatterplotSchema(CorpusSchema):
    """Schema for '/scatterplot_data' requests."""
    catX: str = ...
    catY: str = ...

    def get_plot_data(self, db_session: Session):
        """Generate the scatterplot data for this corpus."""
        stats = self.get_stats(db_session)
        frame = DataFrame.from_dict(stats.frame)
        title_row = frame.loc['title']
        owner_row = frame.loc['ownedby']
        frame = frame.drop('title').drop('ownedby').drop('Other', errors='ignore')
        frame = frame.fillna(0)
        logging.debug(frame)
        frame = frame.apply(lambda x: x.divide(x['total_words'])*100
                            if x['total_words'] else Series(0, index=x.index))
        frame = frame.drop('total_words').fillna(0)
        frame = frame.append(title_row).append(owner_row)
        frame = frame.transpose()
        if self.catX not in frame or self.catY not in frame:
            logging.error("Either '%s' or '%s' is not in %s.",
                          self.catX, self.catY, frame.columns.values)
            raise HTTPException(status_code=HTTP_400_BAD_REQUEST,
                                detail="Either '{}' or '{}' is not in {}.".format(
                                    self.catX, self.catY, frame.columns.values))
        frame = frame[[self.catX, self.catY, 'title', 'ownedby']]
        frame['text_id'] = frame.index
        frame = frame.rename(columns={self.catX: 'catX', self.catY: 'catY'})
        data = {'axisX': self.catX,
                'axisY': self.catY,
                'spdata': frame.to_dict('records')}
        if 'assignments' in stats.__fields_set__ and len(stats.assignments) == 1:
            data['assignment'] = stats.assignments[0]
        if 'courses' in stats.__fields_set__ and len(stats.courses) == 1:
            data['course'] = stats.courses[0]
        if 'instructors' in stats.__fields_set__ and len(stats.instructors) == 1:
            data['instructor'] = stats.instructors[0]
        return data

class ScatterplotDataPoint(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for a point in the ScatterplotData."""
    catX: float = ...
    catY: float = ...
    title: str = ...
    text_id: str = ...
    ownedby: str = ...

class ScatterplotData(AssignmentData): #pylint: disable=too-few-public-methods
    """Schema for "scatterplot_data" response."""
    axisX: str = None
    axisY: str = None
    spdata: List[ScatterplotDataPoint] = []

@app.post('/scatterplot_data', response_model=ScatterplotData,
          responses={
              HTTP_400_BAD_REQUEST: {
                  "model": ErrorResponse,
                  "description": "Bad Request"},
              HTTP_500_INTERNAL_SERVER_ERROR: {
                  "model": ErrorResponse,
                  "description": "Internal Server Error"
              },
              HTTP_503_SERVICE_UNAVAILABLE: {
                  "model": ErrorResponse,
                  "description": "Service Unavailable (untagged documents)"
              }
          })
def get_scatterplot_data(corpus: ScatterplotSchema, db_session: Session = Depends(get_db_session)):
    """Responds to requests to generate the scatterplot data for a given corpus."""
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    return corpus.get_plot_data(db_session)

class GroupsSchema(CorpusSchema):
    """Schema for '/groups' requests."""
    group_size: int = 2

    def get_pairings(self, db_session: Session):
        """Generate the groups for this corpus."""
        stats = self.get_stats(db_session)
        frame = DataFrame.from_dict(stats.frame)
        # logging.warning(frame)
        frame = frame.loc[:, list(frame.loc['ownedby'] == 'student')]
        title_row = frame.loc['title']
        frame = frame.drop('title')
        frame = frame.drop('ownedby')
        frame = frame.apply(lambda x: x.divide(x['total_words'])
                            if x['total_words'] else Series(0, index=x.index))
        frame = frame.drop('total_words')
        frame = frame.drop('Other', errors='ignore')
        frame = frame.append(title_row)
        frame = frame.transpose().fillna(0).set_index('title')
        # logging.warning(frame)
        data = get_best_groups(frame, group_size=self.group_size)
        if 'assignments' in stats.__fields_set__ and len(stats.assignments) == 1:
            data['assignment'] = stats.assignments[0]
        if 'courses' in stats.__fields_set__ and len(stats.courses) == 1:
            data['course'] = stats.courses[0]
        if 'instructors' in stats.__fields_set__ and len(stats.instructors) == 1:
            data['instructor'] = stats.instructors[0]
        return data

class GroupsData(AssignmentData): #pylint: disable=too-few-public-methods
    """Schema for "groups" data."""
    groups: List[List[str]] = ...
    grp_qualities: List[float] = None
    quality: float = None

@app.post('/groups', response_model=GroupsData,
          responses={
              HTTP_400_BAD_REQUEST: {
                  "model": ErrorResponse,
                  "description": "Bad Request"},
              HTTP_500_INTERNAL_SERVER_ERROR: {
                  "model": ErrorResponse,
                  "description": "Internal Server Error"
              },
              HTTP_503_SERVICE_UNAVAILABLE: {
                  "model": ErrorResponse,
                  "description": "Service Unavailable (untagged documents)"
              }
          })
def generate_groups(corpus: GroupsSchema, db_session: Session = Depends(get_db_session)):
    """Responds to requests to generate groups."""
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    if len(corpus.corpus) < corpus.group_size:
        raise HTTPException(
            detail="Not enough documents to make groups of size {}.".format(corpus.group_size),
            status_code=HTTP_400_BAD_REQUEST)
    try:
        return corpus.get_pairings(db_session)
    except Exception as excp:
        raise HTTPException(detail=excp.args[0],
                            status_code=HTTP_500_INTERNAL_SERVER_ERROR)


class DictionaryInformation(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for dictionary help."""
    id: str = ...
    name: str = ...
    description: str = None

class PatternData(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for pattern data."""
    pattern: str = ...
    count: int = 0

class CategoryPatternData(BaseModel): #pylint: disable=too-few-public-methods
    """Schema for pattern data for each category."""
    category: DictionaryInformation = ...
    patterns: List[PatternData] = []

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

@app.post('/patterns', response_model=List[CategoryPatternData],
          responses={
              HTTP_400_BAD_REQUEST: {
                  "model": ErrorResponse,
                  "description": "Bad Request"},
              HTTP_500_INTERNAL_SERVER_ERROR: {
                  "model": ErrorResponse,
                  "description": "Internal Server Error"},
              HTTP_503_SERVICE_UNAVAILABLE: {
                  "model": ErrorResponse,
                  "description": "Service Unavailable (untagged documents)"}
          })
def patterns(corpus: CorpusSchema,
             db_session: Session = Depends(get_db_session)):
    """Generate the list of categorized patterns in the given corpus."""
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    pats = defaultdict(Counter)
    tones = None
    ds_dictionary = ''
    for (uuid, doc, filename, status) in db_session.query(
            Filesystem.id, Filesystem.processed, Filesystem.name,
            Filesystem.state).filter(Filesystem.id.in_(corpus.documents())):
        if status == 'error':
            logging.error("Aborting: error in %s (%s): %s", uuid, filename, doc)
            raise HTTPException(
                detail="Aborting: there was an error while tagging {}".format(filename),
                status_code=HTTP_500_INTERNAL_SERVER_ERROR)
        if status != 'tagged':
            logging.error("Aborting: %s (%s) has state %s", uuid, filename, status)
            raise HTTPException(
                detail="Aborting because {} is not tagged (state: {})".format(filename, status),
                status_code=HTTP_503_SERVICE_UNAVAILABLE)
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

class ReportsSchema(BoxplotSchema):
    """Schema for '/report' requests."""
    intro: str = None
    stv_intro: str = None

    def get_reports(self, db_session: Session):
        """Generate the report for this corpus."""
        stats = self.get_stats(db_session)
        tones = DocuScopeTones(stats.ds_dictionary)
        documents = {}
        for (uuid, doc, filename, status) in db_session.query(
                Filesystem.id, Filesystem.processed, Filesystem.name,
                Filesystem.state).filter(Filesystem.id.in_(self.documents())):
            if status == 'error':
                logging.error("Aborting: error in %s (%s): %s", uuid, filename, doc)
                raise HTTPException(
                    detail="Aborting: there was an error while tagging {}".format(filename),
                    status_code=HTTP_500_INTERNAL_SERVER_ERROR)
            if status != 'tagged':
                logging.error("Aborting: %s (%s) has state %s", uuid, filename, status)
                raise HTTPException(
                    detail="Aborting because {} is not tagged (state: {})".format(filename, status),
                    status_code=HTTP_503_SERVICE_UNAVAILABLE)
            tagged = {
                'html_content': re.sub(r'(\n|\s)+', ' ', doc['ds_output']),
                'dict': {}
            }
            if doc['ds_tag_dict']:
                tagged['dict'] = {
                    lat: {"dimension": tones.get_dimension(lat),
                          "cluster": tones.get_lat_cluster(lat)}
                    for lat in doc['ds_tag_dict'].keys()
                }
            documents[str(uuid)] = tagged

        assignment_course, assignment_name, assignment_instructor = \
            db_session.query(Assignment.course, Assignment.name,
                             Assignment.instructor)\
                      .filter(Assignment.id == Filesystem.assignment)\
                      .filter(Filesystem.id.in_(self.documents())).first()
        if not assignment_course:
            logging.error("Could not retrieve Assignment for corpus: %s",
                          self.documents())
            raise HTTPException(detail="Could not retrieve Assignment.",
                                status_code=HTTP_422_UNPROCESSABLE_ENTITY)
        descriptions = {
            'course': assignment_course,
            'assignment': assignment_name,
            'instructor': assignment_instructor,
            'intro': self.intro,
            'stv_intro': self.stv_intro
        }
        return generate_pdf_reports(DataFrame.from_dict(stats.frame),
                                    documents,
                                    stats.ds_dictionary,
                                    self.get_bp_data(db_session),
                                    descriptions)

@app.post('/generate_reports',
          responses={
              HTTP_400_BAD_REQUEST: {
                  "model": ErrorResponse,
                  "description": "Bad Request"},
              HTTP_500_INTERNAL_SERVER_ERROR: {
                  "model": ErrorResponse,
                  "description": "Internal Server Error"},
              HTTP_503_SERVICE_UNAVAILABLE: {
                  "model": ErrorResponse,
                  "description": "Service Unavailable (untagged documents)"}
          })
def generate_reports(corpus: ReportsSchema,
                     db_session: Session = Depends(get_db_session)):
    """Responds to generate_reports requests by streaming the report zipfile."""
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    if corpus.level is not LevelEnum.cluster:
        logging.warning("Level is not Cluster, resetting.")
        corpus.level = LevelEnum.cluster
    try:
        zip_buffer = corpus.get_reports(db_session)
    except Exception as excp:
        logging.error("%s\n%s", corpus.corpus, excp)
        traceback.print_exc()
        raise HTTPException(detail="ERROR in report generation.",
                            status_code=HTTP_500_INTERNAL_SERVER_ERROR)
    return StreamingResponse(zip_buffer, media_type='application/zip',
                             headers={'Content-Disposition':
                                      "attachment; filename='report.zip'"})

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
    dictionary: Dict[str, DictionaryEntry] = {}
    dict_info: DictInfo = ...

@app.get('/text_content/{file_id}', response_model=TextContent,
         responses={
             HTTP_400_BAD_REQUEST: {
                 "model": ErrorResponse,
                 "description": "Bad Request"},
             HTTP_500_INTERNAL_SERVER_ERROR: {
                 "model": ErrorResponse,
                 "description": "Internal Server Error"},
             HTTP_503_SERVICE_UNAVAILABLE: {
                 "model": ErrorResponse,
                 "description": "Service Unavailable (untagged documents)"}
         })
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
                      dict_info=ds_info,
                      course=a_course,
                      instructor=a_instructor,
                      assignment=a_name)
    html_content = doc['ds_output']
    html_content = re.sub(r'(\n|\s)+', ' ', html_content)
    res.html_content = "<p>" + html_content.replace("PZPZPZ", "</p><p>") + "</p"
    tag_dict = doc['ds_tag_dict']
    res.course = a_course
    res.assignment = a_name
    res.instructor = a_instructor
    if tag_dict:
        tones = DocuScopeTones(doc['ds_dictionary'])
        for lat in tag_dict.keys():
            res.dictionary[lat] = {"dimension": tones.get_dimension(lat),
                                   "cluster": tones.get_lat_cluster(lat)}
    return res

## Serve static files.
@app.middleware("http")
async def add_custom_header(request, call_next):
    """Serve the classroom web application from static."""
    response = await call_next(request)
    if response.status_code == 404:
        return FileResponse('static/index.html')
    return response
@app.exception_handler(404)
def not_found(_request, _exc):
    """Handler for 404 error which instead returns index.html"""
    return FileResponse('static/index.html')
app.mount("/classroom", StaticFiles(directory="static", html=True), name="static")

#if __name__ == '__main__':
#    app.run(debug=True)
