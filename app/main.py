"""DocuScope Classroom analysis tools interface."""
from enum import Enum
try:
    import ujson as json
except ImportError:
    import json
import logging
import re
import traceback
from typing import Dict, List
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import Response, StreamingResponse, FileResponse
from starlette.staticfiles import StaticFiles
from starlette.status import HTTP_204_NO_CONTENT, HTTP_400_BAD_REQUEST, \
    HTTP_422_UNPROCESSABLE_ENTITY, HTTP_500_INTERNAL_SERVER_ERROR, \
    HTTP_503_SERVICE_UNAVAILABLE
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pandas import DataFrame, Series
import memcache
from default_settings import Config
from ds_db import Assignment, DSDictionary, Filesystem
from ds_groups import get_best_groups
from ds_report import generate_pdf_reports
from ds_tones import DocuScopeTones

ENGINE = create_engine(Config.SQLALCHEMY_DATABASE_URI)
SESSION = sessionmaker(autocommit=False, autoflush=False, bind=ENGINE)

CLIENT = memcache.Client(['memcached:11211'])

app = FastAPI( #pylint: disable=invalid-name
    title="DocuScope Classroom Analysis Tools",
    description="Collection of corpus analysis tools to be used in a classroom.",
    version="2.1.0")

#python -c 'import os; print(os.urandom(16))' =>
#secret_key = b'\xf7i\x0b\xb5[)C\x0b\x15\xf0T\x13\xe1\xd2\x9e\x8a'

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['GET', 'POST'],
    allow_headers=['*'])

@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    """Middleware for adding database sessions to a request."""
    response = Response("Internal server error",
                        status_code=HTTP_500_INTERNAL_SERVER_ERROR)
    try:
        request.state.db = SESSION()
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

class LevelEnum(str, Enum):
    """Enumeration of the possible analysis levels."""
    dimension = "Dimension"
    cluster = "Cluster"

class LevelFrame(BaseModel):
    """Schema for an analysis level data frame."""
    corpus: List[UUID]
    level: LevelEnum
    ds_dictionary: str
    frame: dict

class DocumentSchema(BaseModel):
    """Schema for a document."""
    id: UUID = ...
    data: str = None

class CorpusSchema(BaseModel):
    """Schema for '/boxplot_data' requests."""
    corpus: List[DocumentSchema] = ...
    level: LevelEnum = LevelEnum.cluster

    def documents(self):
        """Gets a list of document ids for this corpus."""
        return [d.id for d in self.corpus]
    def corpus_index(self):
        """Generate the id for this corpus."""
        # key limit of 250 characters for memcached
        key = [str(self.level)]
        key.extend(sorted([str(d.id) for d in self.corpus]))
        return str(hash(tuple(key)))
    def get_stats(self, db_session: Session): #pylint: disable=too-many-locals
        """Retrieve or generate the basic statistics for this corpus."""
        try:
            indx = self.corpus_index()
            level_frame = CLIENT.get(indx)
            if not level_frame:
                logging.info('Generating Level Frame')
                logging.info('Retrieving stats from database')
                stats = {}
                ds_dictionaries = set()
                for doc, fullname, ownedby, filename, doc_id, state, ds_dictionary in \
                    db_session.query(Filesystem.processed,
                                     Filesystem.fullname,
                                     Filesystem.ownedby,
                                     Filesystem.name,
                                     Filesystem.id,
                                     Filesystem.state,
                                     DSDictionary.name)\
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
                        ser['title'] = fullname if ownedby == 'student' else \
                            '.'.join(filename.split('.')[0:-1])
                        ser['ownedby'] = ownedby
                        stats[str(doc_id)] = ser
                        ds_dictionaries.add(ds_dictionary)
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
                    if not sumframe.empty:
                        data[category] = sumframe.transpose().sum()
                frame = DataFrame(data)
                frame['total_words'] = ds_stats['total_words']
                frame['title'] = ds_stats['title']
                frame['ownedby'] = ds_stats['ownedby']
                logging.debug(frame)
                lframe = frame.transpose()
                level_frame = LevelFrame(ds_dictionary=ds_dictionary,
                                         corpus=self.documents(),
                                         frame=lframe.to_dict(),
                                         level=self.level).json()
                CLIENT.set(indx, level_frame)#, expire=4*60*60)
            logging.info(level_frame)
            return DataFrame.from_dict(json.loads(level_frame)['frame'])
        except Exception as exp:
            traceback.print_exc()
            raise exp

class BoxplotSchema(CorpusSchema):
    """Schema for 'boxplot_data' requests."""
    def get_bp_data(self, db_session: Session):
        """Generate the boxplot data for this request."""
        frame = self.get_stats(db_session)
        frame = frame.drop('title').drop('ownedby', errors='ignore')
        frame = frame.apply(lambda x: x.divide(x['total_words'])) # frequencies
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
        quants['category'] = categories
        bpdata = quants.to_dict('records')
        bpdata.reverse()
        logging.info(bpdata)
        logging.info(outliers)
        return {"bpdata": bpdata, "outliers": outliers}

class BoxplotDataEntry(BaseModel):
    """Schema for a boxplot data point."""
    q1: float = ...
    q2: float = ...
    q3: float = ...
    min: float = ...
    max: float = ...
    uifence: float = ...
    lifence: float = ...
    category: str = ...
class BoxplotDataOutlier(BaseModel):
    """Schema for boxplot outliers."""
    pointtitle: str = ...
    value: float = ...
    category: str = ...
class BoxplotData(BaseModel):
    """Schema for 'boxplot_data' responses."""
    bpdata: List[BoxplotDataEntry] = ...
    outliers: List[BoxplotDataOutlier] = None

@app.post('/boxplot_data', response_model=BoxplotData)
def get_boxplot_data(corpus: BoxplotSchema, db_session: Session = Depends(get_db_session)):
    """Responds to "boxplot_data" requests."""
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    return corpus.get_bp_data(db_session)

class RankListSchema(CorpusSchema):
    """Schema for '/ranked_list' requests."""
    sortby: str = ...

    def get_rank_data(self, request: Request):
        """Generate the rank data for this RankList request."""
        frame = self.get_stats(request)
        logging.info(frame)
        title_row = frame.loc['title']
        owner_row = frame.loc['ownedby']
        frame = frame.drop('title').drop('ownedby', errors='ignore').drop('Other', errors='ignore')
        frame = frame.apply(lambda x: x.divide(x['total_words']))
        frame = frame.drop('total_words').append(title_row).append(owner_row)
        frame = frame.transpose()
        frame = frame.fillna(0)
        if self.sortby not in frame:
            logging.error("%s is not in %s", self.sortby, frame.columns)
            raise HTTPException(detail="{} is not in {}".format(self.sortby, frame.columns.values),
                                status_code=HTTP_422_UNPROCESSABLE_ENTITY)
        frame = frame.loc[:, ['title', self.sortby, 'ownedby']]
        frame.reset_index(inplace=True)
        frame.rename(columns={'title': 'text', self.sortby: 'value'}, inplace=True)
        frame.sort_values('value', ascending=False, inplace=True)
        frame = frame.head(50)
        frame = frame[frame.value != 0]
        logging.info(frame.to_dict('records'))
        return {'category': self.sortby, 'result': frame.to_dict('records')}

class RankDataEntry(BaseModel):
    """Schema for each entry in RankData."""
    index: str = ...
    text: str = ...
    value: float = ...
    ownedby: str = ...

class RankData(BaseModel):
    """Schema for "ranked_list" responses."""
    category: str
    result: List[RankDataEntry]

@app.post('/ranked_list') # , response_model=RankDataEntry) # pydantic rejects
def get_rank_list(corpus: RankListSchema, db_session: Session = Depends(get_db_session)):
    """Responds to "ranked_list" requests."""
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    return corpus.get_rank_data(db_session)

class ScatterplotSchema(CorpusSchema):
    """Schema for '/scatterplot_data' requests."""
    catX: str = ...
    catY: str = ...

    def get_plot_data(self, db_session: Session):
        """Generate the scatterplot data for this corpus."""
        frame = self.get_stats(db_session)
        title_row = frame.loc['title']
        owner_row = frame.loc['ownedby']
        frame = frame.drop('title').drop('ownedby').drop('Other', errors='ignore')
        frame = frame.fillna(0)
        frame = frame.apply(lambda x: x.divide(x['total_words'])*100)
        frame = frame.drop('total_words')
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
        return { 'axisX': self.catX, 'axisY': self.catY,
                 'spdata': frame.to_dict('records') }

class ScatterplotDataPoint(BaseModel):
    """Schema for a point in the ScatterplotData."""
    catX: float
    catY: float
    title: str
    text_id: str
    ownedby: str

class ScatterplotData(BaseModel):
    """Schema for "scatterplot_data" response."""
    axisX: str
    axisY: str
    spdata: List[ScatterplotDataPoint] = ...

@app.post('/scatterplot_data', response_model=ScatterplotData)
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
        frame = self.get_stats(db_session)#.transpose()
        logging.info(frame)
        frame = frame.loc[:, list(frame.loc['ownedby'] == 'student')]
        title_row = frame.loc['title':]
        frame = frame.drop('title').drop('ownedby')
        frame = frame.apply(lambda x: x.divide(x['total_words']))
        frame = frame.drop('total_words')
        frame = frame.drop('Other', errors='ignore')
        frame = frame.append(title_row)
        frame = frame.transpose().fillna(0).set_index('title')
        return get_best_groups(frame, group_size=self.group_size)

class GroupsData(BaseModel):
    """Schema for "groups" data."""
    groups: List[List[str]] = ...
    grp_qualities: List[float]
    quality: float

@app.post('/groups', response_model=GroupsData)
def generate_groups(corpus: GroupsSchema, db_session: Session = Depends(get_db_session)):
    """Responds to requests to generate groups."""
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    if len(corpus.corpus) < corpus.group_size:
        raise HTTPException(detail="Not enough documents to do grouping.",
                            status_code=HTTP_400_BAD_REQUEST)
    return corpus.get_pairings(db_session)

class PatternData(BaseModel):
    pattern: str = ...
    count: int = 0

class CategoryPatternData(BaseModel):
    category: str = ...
    description: str = None
    patterns: List[PatternData] = None
    
@app.post('/patterns', response_model=List[CategoryPatternData])
def patterns(corpus:  CorpusSchema,
             db_session: Session = Depends(get_db_session)):
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    patterns = defaultdict(Counter)
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
                status_code=HTTP_204_NO_CONTENT)


class ReportsSchema(BoxplotSchema):
    """Schema for '/report' requests."""
    intro: str
    stv_intro: str

    def get_reports(self, db_session: Session):
        """Generate the report for this corpus."""
        ds_dictionary = json.loads(CLIENT.get(self.corpus_index()))['ds_dictionary']
        tones = DocuScopeTones(ds_dictionary)
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
                    status_code=HTTP_204_NO_CONTENT)
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
        return generate_pdf_reports(self.get_stats(db_session),
                                    documents,
                                    ds_dictionary,
                                    self.get_bp_data(db_session),
                                    descriptions)

@app.post('/generate_reports')
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
        raise HTTPException(detail={"message": "ERROR in report generation.",
                                    "error": "{}".format(excp)},
                            status_code=HTTP_500_INTERNAL_SERVER_ERROR)
    return StreamingResponse(zip_buffer, media_type='application/zip',
                             headers={'Content-Disposition':
                                      "attachment; filename='report.zip'"})

class DictionaryEntry(BaseModel):
    """Schema for dimension->cluster mapping."""
    dimension: str
    cluster: str

class DictionaryInformation(BaseModel):
    """Schema for dictionary help."""
    id: str = ...
    name: str = ...
    description: str = ...

class DictInfo(BaseModel):
    """Schema for dictionary information."""
    cluster: List[DictionaryInformation] = None
    dimension: List[DictionaryInformation] = None

class TextContent(BaseModel):
    """Schema for text_content data."""
    text_id: str = ...
    word_count: int = 0
    html_content: str = ""
    dictionary: Dict[str, DictionaryEntry] = {}
    dict_info: DictInfo = ...

@app.get('/text_content/{file_id}', response_model=TextContent)
def get_tagged_text(file_id: UUID,
                    db_session: Session = Depends(get_db_session)):
    """Get the tagged text information for the given file."""
    if not file_id:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    doc, filename, state = db_session.query(Filesystem.processed,
                                            Filesystem.name, Filesystem.state)\
                                     .filter_by(id=file_id).first()
    if state in ('pending', 'submitted'):
        logging.error("%s has state %s", file_id, state)
        raise HTTPException(detail="Document is still being processed, try again later.",
                            status_code=HTTP_204_NO_CONTENT)
    if state == 'error':
        logging.error("Error while tagging: %s", doc)
        raise HTTPException(detail="Error while tagging document.",
                            status_code=HTTP_500_INTERNAL_SERVER_ERROR)
    if not doc:
        logging.error("File not found %s", file_id.text_id)
        raise HTTPException(detail="File not found %s" % file_id.text_id,
                            status_code=HTTP_400_BAD_REQUEST)
    ds_info = db_session\
        .query(DSDictionary.class_info)\
        .filter(DSDictionary.name == doc['ds_dictionary']).first()[0]
    res = TextContent(text_id=filename or file_id.text_id,
                      word_count=doc['ds_num_word_tokens'],
                      dict_info=ds_info)
    html_content = doc['ds_output']
    html_content = re.sub(r'(\n|\s)+', ' ', html_content)
    res.html_content = "<p>" + html_content.replace("PZPZPZ", "</p><p>") + "</p"
    tag_dict = doc['ds_tag_dict']
    if tag_dict:
        tones = DocuScopeTones(doc['ds_dictionary'])
        for lat in tag_dict.keys():
            res.dictionary[lat] = {"dimension": tones.get_dimension(lat),
                                   "cluster": tones.get_lat_cluster(lat)}
    return res

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
