"""DocuScope Classroom analysis tools interface."""
from functools import lru_cache
import json
import urllib3

from flask import request, make_response
from flask_restful import Resource, Api, abort
from marshmallow import Schema, fields, ValidationError

from create_app import create_flask_app
from ds_stats import *

app = create_flask_app()
API = Api(app)
HTTP = urllib3.PoolManager()

@lru_cache(maxsize=1)
def available_dictionaries():
    """Retrieve the list of available DocuScope dictionaries."""
    req = HTTP.request('GET',
                       "{}/dictionary".format(app.config['DICTIONARY_SERVER']))
    return json.loads(req.data.decode('utf-8'))

class DocSchema(Schema):
    id = fields.String(required=True) # fields.UUID()?
    data = fields.String()
DOC_SCHEMA = DocSchema(many=True)

def get_docs():
    json_data = request.get_json()
    if not json_data:
        abort(400, message='No input data provided, probably not JSON')
    try:
        data = DOC_SCHEMA.load(json_data)
    except ValidationError as err:
        abort(422, message="{}".format(err))
    except Exception as gen_err:
        abort(422, message="{}".format(gen_err))
    return data[0]

class CorpusSchema(Schema):
    corpus = fields.Nested(DocSchema, many=True)
    level = fields.String(required=True,
                          validate=lambda x: x in ('Dimension', 'Cluster'))
    dictionary = fields.String(
        default='default',
        validate=lambda d: d in available_dictionaries())

BOXPLOT_SCHEMA = CorpusSchema()

class BoxplotData(Resource):
    def post(self):
        json_data = request.get_json()
        if not json_data:
            abort(404, message="No input data provided.")
        try:
            data = BOXPLOT_SCHEMA.load(json_data)
        except ValidationError as err:
            abort(422, message="{}".format(err))
        corpus = data[0]['corpus']
        if not corpus:
            abort(404, message="No documents specified.")
        return get_boxplot_data(corpus, data[0]['level'], data[0]['dictionary'])
API.add_resource(BoxplotData, '/boxplot_data')

class RankedListSchema(CorpusSchema):
    sortby = fields.String(required=True)
RANK_SCHEMA = RankedListSchema()

class RankedList(Resource):
    def post(self):
        json_data = request.get_json()
        if not json_data:
            abort(404, message="No input data provided, requires JSON.")
        try:
            data = RANK_SCHEMA.load(json_data)
        except ValidationError as err:
            abort(422, message="{}".format(err))
        corpus = data[0]['corpus']
        if not corpus:
            abort(404, message="No documents specified.")
        return get_rank_data(corpus, data[0]['level'], data[0]['dictionary'],
                             data[0]['sortby'])
API.add_resource(RankedList, '/ranked_list')

class ScatterplotSchema(CorpusSchema):
    catX = fields.String(required=True)
    catY = fields.String(required=True)
SCATTER_PLOT_SCHEMA = ScatterplotSchema()

class ScatterplotData(Resource):
    def post(self):
        json_data = request.get_json()
        if not json_data:
            abort(404, message="No input data provided, requires JSON.")
        try:
            data = SCATTER_PLOT_SCHEMA.load(json_data)
        except ValidationError as err:
            abort(422, message="{}".format(err))
        corpus = data[0]['corpus']
        if not corpus:
            abort(404, message="No documents specified.")
        return get_scatter_data(corpus, data[0]['level'], data[0]['dictionary'],
                                data[0]['catX'], data[0]['catY'])

API.add_resource(ScatterplotData, '/scatterplot_data')

class GroupsSchema(CorpusSchema):
    group_size = fields.Integer(required=True, default=2)
    #absent_list
GROUP_SCHEMA = GroupsSchema()

class Groups(Resource):
    def post(self):
        json_data = request.get_json()
        if not json_data:
            abort(404, message="No input data provided, requires JSON.")
        try:
            data = GROUP_SCHEMA.load(json_data)
        except ValidationError as err:
            abort(422, message="{}".format(err))
        corpus = data[0]['corpus']
        if not corpus:
            abort(404, message="No documents specified.")
        return get_pairings(corpus, data[0]['level'], data[0]['dictionary'],
                            data[0]['group_size'])
API.add_resource(Groups, '/groups')

class ReportsSchema(Schema):
    corpus = fields.Nested(DocSchema, many=True)
    dictionary = fields.String(
        default='default',
        validate=lambda d: d in available_dictionaries())
    course = fields.String()
    assignment = fields.String()
    intro = fields.String()
    stv_intro = fields.String()
REPORT_SCHEMA = ReportsSchema()

class Reports(Resource):
    def post(self):
        json_data = request.get_json()
        if not json_data:
            abort(404, message="No input data provided, requires JSON.")
        try:
            data = REPORT_SCHEMA.load(json_data)
        except ValidationError as err:
            abort(422, message="{}".format(err))
        corpus = data[0]['corpus']
        if not corpus:
            abort(404, message="No documents specified.")
        response = make_response(get_reports(corpus, data[0]['dictionary'],
                                             data[0]['course'],
                                             data[0]['assignment'],
                                             data[0]['intro'],
                                             data[0]['stv_intro']))
        response.headers['Content-Disposition'] = "attachment; filename='report.pdf'"
        response.mimetype = 'application/pdf'
        return response
API.add_resource(Reports, '/generate_reports')

if __name__ == '__main__':
    app.run(debug=True)
