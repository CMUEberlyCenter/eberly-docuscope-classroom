"""DocuScope Classroom analysis tools interface."""
from enum import Enum
import logging
import re
from typing import Dict, List
import os
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
from starlette.responses import Response, StreamingResponse
from starlette.staticfiles import StaticFiles
from starlette.status import HTTP_400_BAD_REQUEST, HTTP_422_UNPROCESSABLE_ENTITY, HTTP_500_INTERNAL_SERVER_ERROR, HTTP_503_SERVICE_UNAVAILABLE
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pandas import DataFrame, Series
from default_settings import Config
from ds_db import Assignment, DSDictionary, Filesystem
from ds_groups import get_best_groups
from ds_report import generate_pdf_reports
from ds_tones import DocuScopeTones

ENGINE = create_engine(Config.SQLALCHEMY_DATABASE_URI)
SESSION = sessionmaker(autocommit=False, autoflush=False, bind=ENGINE)
#import schema

#import ds_stats
#from ds_stats import get_boxplot_data, get_rank_data, get_scatter_data, \
#    get_pairings, get_html_string

#logging.basicConfig(level=logging.DEBUG)
#logger = logging.getLogger(__name__)

app = FastAPI( #pylint: disable=C0103
    title="DocuScope Classroom Analysis Tools",
    description="Collection of corpus analysis tools to be used in a classroom.",
    version="2.1.0")

#python -c 'import os; print(os.urandom(16))' =>
#app.secret_key = b'\xf7i\x0b\xb5[)C\x0b\x15\xf0T\x13\xe1\xd2\x9e\x8a'

app.add_middleware(SessionMiddleware, secret_key=os.urandom(16))
app.add_middleware(CORSMiddleware, allow_origins=['*'],
                   allow_methods=['GET', 'POST'])

@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    response = Response("Internal server error", status_code=HTTP_500_INTERNAL_SERVER_ERROR)
    try:
        request.state.db = SESSION()
        response = await call_next(request)
        request.state.db.commit()
    except Exception as exp: #pylint: disable=W0703
        logging.error(exp)
        request.state.db.rollback()
    finally:
        request.state.db.close()
    return response

def get_request(request: Request) -> Request:
    return request
def get_db(request: Request) -> Session:
    return request.state.db
def get_session(request: Request) -> Dict:
    return request.session

#@app.after_request
#def after_request(response):
#    """Adds extra headers to deal with cross-origin issues."""
#    response.headers.add('Access-Control-Allow-Origin', '*')
#    response.headers.add('Access-Control-Allow-Headers',
#                         ','.join(['Access-Control-Allow-Headers',
#                                   'Access-Control-Allow-Origin',
#                                   'Access-Control-Allow-Methods',
#                                   'Content-Type']))
#    response.headers.add('Access-Control-Allow-Methods', 'GET,POST')
#    return response

class DocumentSchema(BaseModel):
    id: UUID = ...
    data: str = None
class LevelEnum(str, Enum):
    dimension = "Dimension"
    cluster = "Cluster"
class CorpusSchema(BaseModel):
    """Schema for '/boxplot_data' requests."""
    corpus: List[DocumentSchema] = ...
    level: LevelEnum = LevelEnum.cluster

    def documents(self):
        return [d['id'] for d in self.corpus]
    def get_stats(self, request: Request):
        if self.level not in request.session:
            logging.info('Retrieving stats from database')
            stats = {}
            ds_dictionaries = set()
            for doc, fullname, ownedby, filename, doc_id, ds_dictionary in \
                request.state.db.query(\
                                       Filesystem.processed,
                                       Filesystem.fullname,
                                       Filesystem.ownedby,
                                       Filesystem.name,
                                       Filesystem.id,
                                       DSDictionary.name)\
                                .filter(Filesystem.id.in_(self.documents()))\
                                .filter(Filesystem.state == 'tagged')\
                                .filter(Assignment.id == Filesystem.assignment)\
                                .filter(DSDictionary.id == Assignment.dictionary):
                if doc:
                    ser = Series({key: val['num_tags'] for key, val in doc['ds_tag_dict'].items()})
                    ser['total_words'] = doc['ds_num_word_tokens']
                    ser['title'] = fullname if ownedby is 'student' else \
                        '.'.join(filename.split('.')[0:-1])
                    ser['ownedby'] = ownedby
                    stats[str(doc_id)] = ser
                    ds_dictionaries.add(ds_dictionary)
            if not stats:
                logging.error("Failed to retrieve stats for corpus: %s", self.documents())
                raise HTTPException(detail="Document(s) submitted for analysis are not tagged, please close this window and wait a couple of minutes. If problem persists, please contact technical support.",
                                    status_code=HTTP_503_SERVICE_UNAVAILABLE)
            if len(ds_dictionaries) != 1:
                logging.error("Inconsistant dictioaries in corpus %s", self.documents())
                raise HTTPException(detail="Inconsistant dictionaries used in tagging this corpus, documents are not compairable.",
                                    status_code=HTTP_400_BAD_REQUEST)
            request.session['ds_dictionary'] = list(ds_dictionaries)[0]
            ds_stats = DataFrame(data=stats).transpose()
            tones = DocuScopeTones(request.session['ds_dictionary'])
            request.session['tones'] = tones
            data = {}
            if self.level == LevelEnum.dimension:
                for dim, lats in tones.map_dimension_to_lats().items():
                    sumframe = ds_stats.filter(lats)
                    if not sumframe.empty:
                        data[dim] = sumframe.transpose().sum()
            elif self.level == LevelEnum.cluster:
                for cluster, clats in tones.map_cluster_to_lats().items():
                    sumframe = ds_stats.filter(clats)
                    if not sumframe.empty:
                        data[cluster] = sumframe.transpose().sum()
            frame = DataFrame(data)
            frame['total_words'] = ds_stats['total_words']
            frame['title'] = ds_stats['title']
            frame['ownedby'] = ds_stats['ownedby']
            logging.debug(frame)
            request.session[self.level] = frame.transpose()
        return request.session[self.level].copy()

class BoxplotSchema(CorpusSchema):
    def get_bp_data(self, request: Request):
        frame = self.get_stats(request)
        frame = frame.drop('title').drop('ownedby', errors='ignore')
        frame = frame.apply(lambda x: x.divide(x['total_words'])) # frequencies
        frame = frame.drop('total_words').drop('Other', errors='ignore')
        frame = frame.transpose()
        frame = frame.fillna(0)
        categories = [c for c in frame][::-1]
        quantiles = frame.quantile(q=[0, 0.25, 0.5, 0.75, 1])[::-1]
        iqr = quantiles.loc(0.75) - quantiles.loc(0.25)
        upper_inner_fence = quantiles.loc(0.5) + 1.5 * iqr
        lower_inner_fence = (quantiles.loc(0.5) - 1.5 * iqr).apply(lambda x: 0 if x < 0 else x)
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
            "q1": quantiles.loc(0.25),
            "q2": quantiles.loc(0.5),
            "q3": quantiles.loc(0.75),
            "min": quantiles.loc(0),
            "max": quantiles.loc(1),
            "uifence": upper_inner_fence,
            "lifence": lower_inner_fence
        }).fillna(0)
        quants['category'] = categories
        bpdata = quants.to_dict('records')
        bpdata.reverse()
        return {"bpdata": bpdata, "outliers": outliers}


class BoxplotDataEntry(BaseModel):
    q1: float = ...
    q2: float = ...
    q2: float = ...
    min: float = ...
    max: float = ...
    uifence: float = ...
    lifence: float = ...
    category: str = ...
class BoxplotDataOutlier(BaseModel):
    pointtitle: str = ...
    value: float = ...
    category: str = ...
class BoxplotData(BaseModel):
    bpdata: List[BoxplotDataEntry] = ...
    outliers: List[BoxplotDataOutlier] = None

@app.post('/boxplot_data', response_model=BoxplotData)
def get_boxplot_data(corpus: BoxplotSchema, request: Request = Depends(get_request)):
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    return corpus.get_bp_data(request)

class RankListSchema(CorpusSchema):
    """Schema for '/ranked_list' requests."""
    sortby: str = ...

    def get_rank_data(self, request: Request):
        frame = self.get_stats(request)
        title_row = frame.loc['title':]
        owner_row = frame.loc['ownedby':]
        frame = frame.drop('title').drop('ownedby', errors='ignore').drop('Other', errors='ignore')
        frame = frame.apply(lambda x: x.divide(x['total_words']))
        frame = frame.drop('total_words').append(title_row).append(owner_row)
        frame = frame.transpose()
        frame = frame.fillna(0)
        if self.sortby not in frame:
            logging.error("%s is not in %s", self.sortby, frame.columns)
            raise HTTPException(detail="{} is not in {}".format(self.sortby, frame.columns.values),
                                status_code=HTTP_422_UNPROCESSABLE_ENTITY)
        frame = frame.log[:, ['title', self.sortby, 'ownedby']]
        frame.reset_index(inplace=True)
        frame.rename(columns={'title': 'text', self.sortby: 'value'}, inplace=True)
        frame = frame.head(50)
        frame = frame[frame.value != 0]
        return {'result': frame.to_dict('records')}
class RankDataEntry(BaseModel):
    index: str = ...
    text: str = ...
    value: float = ...
    ownedby: str = ...
class RankData(BaseModel):
    result: List[RankDataEntry] = ...
@app.post('/ranked_list', response_model=RankData)
def get_rank_list(corpus: RankListSchema, request: Request = Depends(get_request)):
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    return corpus.get_rank_data(request)

class ScatterplotSchema(CorpusSchema):
    """Schema for '/scatterplot_data' requests."""
    catX: str = ...
    catY: str = ...

    def get_plot_data(self, request: Request):
        frame = self.get_stats(request)
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
                                detail="Either '{}' or '{}' is not in {}.".format(self.catX, self.catY, frame.columns.values))
        frame = frame[[self.catX, self.catY, 'title', 'ownedby']]
        frame['text_id'] = frame.index
        frame = frame.rename(columns={self.catX: 'catX', self.catY: 'catY'})
        return {'spdata': frame.to_dict('records')}
class ScatterplotDataPoint(BaseModel):
    catX: float
    catY: float
    title: str
    text_id: str
    ownedby: str
class ScatterplotData(BaseModel):
    spdata: List[ScatterplotDataPoint] = ...
@app.post('/scatterplot_data', response_model=ScatterplotData)
def get_scatterplot_data(corpus: ScatterplotSchema, request: Request = Depends(get_request)):
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    return corpus.get_plot_data(request)

class GroupsSchema(CorpusSchema):
    """Schema for '/groups' requests."""
    group_size: int = 2

    def get_pairings(self, request: Request):
        frame = self.get_stats(request)
        frame = frame.loc[lambda frame: frame['ownedby'] is 'student']
        title_row = frame.loc['title':]
        frame = frame.drop('title').drop('ownedby')
        frame = frame.apply(lambda x: x.divide(x['total_words']))
        frame = frame.drop('total_words')
        frame = frame.drop('Other', errors='ignore')
        frame = frame.append(title_row)
        frame = frame.transpose().fillna(0).set_index('title')
        return get_best_groups(frame, group_size=self.group_size)

class GroupsData(BaseModel):
    groups: List[List[str]] = ...
    grp_qualities: List[float]
    quality: float
@app.post('/groups', response_model=GroupsData)
def generate_groups(corpus: GroupsSchema, request: Request = Depends(get_request)):
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    if len(corpus.corpus) < corpus.group_size:
        raise HTTPException(detail="Not enough documents to do grouping.",
                            status_code=HTTP_400_BAD_REQUEST)
    return corpus.get_pairings(request)

class ReportsSchema(BoxplotSchema):
    """Schema for '/report' requests."""
    intro: str
    stv_intro: str

    def get_reports(self, request: Request):
        frame = self.get_stats(request)
        bp_data = self.get_bp_data(request)
        tones = request.session['tones']
        ds_dictionary = request.session['ds_dictionary']
        assignment_course, assignment_name, assignment_instructor = request.state.db.query(Assignment.course, Assignment.name, Assignment.instructor).filter(Assignment.id == Filesystem.assignment).filter(Filesystem.id.in_(self.documents())).first()
        if not assignment_course:
            logging.error("Could not retrieve Assignment for corpus: %s", self.documents())
            raise HTTPException(detail="Could not retrieve Assignment.",
                                status_code=HTTP_422_UNPROCESSABLE_ENTITY)
        descriptions = {
            'course': assignment_course,
            'assignment': assignment_name,
            'instructor': assignment_instructor,
            'intro': self.intro,
            'stv_intro': self.stv_intro
        }
        return generate_pdf_reports(frame, self.corpus, ds_dictionary, tones, bp_data, descriptions)
@app.post('/generate_reports')
def generate_reports(corpus: ReportsSchema, request: Request = Depends(get_request)):
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    if corpus.level is not LevelEnum.cluster:
        logging.warning("Level is not Cluster, resetting.")
        corpus.level = LevelEnum.cluster
    try:
        zip_buffer = corpus.get_reports(request)
    except Exception as excp: #pylint: disable=W0703
        logging.error("%s\n%s", corpus.corpus, excp)
        raise HTTPException(detail={"message": "ERROR in report generation.",
                                    "error": "{}".format(excp)},
                            status_code=HTTP_500_INTERNAL_SERVER_ERROR)
    return StreamingResponse(zip_buffer, media_type='application/zip',
                             headers={'Content-Disposition':
                                      "attachment; filename='report.zip'"})

class TextSchema(BaseModel):
    """Schema for '/stv' requests."""
    text_id: UUID = ...
class DictionaryEntry(BaseModel):
    dimension: str
    cluster: str
class TextContent(BaseModel):
    text_id: UUID = ...
    word_count: int = 0
    html_content: str = ""
    dict: Dict[str, DictionaryEntry] = {}
@app.post('/text_content', response_model=TextContent)
def get_tagged_text(file_id: TextSchema, request: Request = Depends(get_request)):
    if not file_id.text_id:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    doc, filename = request.state.db.query(Filesystem.processed, Filesystem.name).filter_by(id=file_id.text_id).first()
    if not doc:
        raise HTTPException(detail="File not found %s" % file_id.text_id,
                            status_code=HTTP_400_BAD_REQUEST)
    res = TextContent(
        text_id=filename or file_id.text_id,
        word_count=doc['ds_num_word_tokens'])
    html_content = doc['ds_output']
    html_content = re.sub(r'(\n|\s)+', ' ', html_content)
    res.html_content = "<p>" + html_content.replace("PZPZPZ", "</p><p>") + "</p"
    tag_dict = doc['ds_tag_dict']
    if tag_dict:
        #Test if this can possibly get stale dictionary
        if 'tones' not in request.session:
            request.session['tones'] = DocuScopeTones(doc['ds_dictionary'])
        tones = request.session['tones']
        for lat in tag_dict.keys():
            res.dict[lat] = {"dimension": tones.get_dimension(lat),
                             "cluster": tones.get_lat_cluster(lat)}
    return res

# Statically serve the web interface
app.mount("/", StaticFiles(directory="static"), name="static")

#if __name__ == '__main__':
#    app.run(debug=True)
