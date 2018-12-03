"""DocuScope Classroom analysis tools interface."""
import logging
import os
import requests

#from cloudant import couchdb
from flask import Flask, request, make_response, send_file, g
from flask_restful import Resource, Api, abort
from marshmallow import Schema, fields, ValidationError

from create_app import create_flask_app, db
import schema

#logging.basicConfig(level=logging.DEBUG)
#logger = logging.getLogger(__name__)

app = create_flask_app()
API = Api(app)

from ds_stats import *
from ds_report import get_reports
from ds_db import Filesystem

#python -c 'import os; print(os.urandom(16))' =>
app.secret_key = b'\xf7i\x0b\xb5[)C\x0b\x15\xf0T\x13\xe1\xd2\x9e\x8a'

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers',
                         'Access-Control-Allow-Headers,Access-Control-Allow-Origin,Access-Control-Allow-Methods,Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST')
    return response

#def available_dictionaries():
#    """Retrieve the list of available DocuScope dictionaries."""
    #TODO: add staleness check/timeout
#    if 'ds_dictionaries' not in g:
#        req = requests.get("{}/dictionary".format(app.config['DICTIONARY_SERVER']))
#        if req.status_code >= 400:
#            abort(req.status_code, message = req.text())
#        g.ds_dictionaries = req.json()
#    return g.ds_dictionaries

#class DSDictionaries(Resource):
#    def get(self):
#        return available_dictionaries()
#    def post(self):
#        return available_dictionaries()
#API.add_resource(DSDictionaries, '/_dictionary')

class DSDocs(Resource):
    def get(self):
        return [doc.id for doc in Filesystem.query.with_entities(Filesystem.id)]
API.add_resource(DSDocs, '/_documents')

#def get_docs():
#    json_data = request.get_json()
#    if not json_data:
#        abort(400, message='No input data provided, probably not JSON')
#    try:
#        data, val_errors = DOC_SCHEMA.load(json_data)
#    except ValidationError as err:
#        abort(422, message="{}".format(err))
#    except Exception as gen_err:
#        abort(422, message="{}".format(gen_err))
#    if val_errors:
#        logging.warning("Parsing errors: {}".format(val_errors))
#    return data

class BoxplotData(Resource):
    def post(self):
        json_data = request.get_json()
        if not json_data:
            abort(404, message="No input data provided.")
        try:
            data, _errors = schema.BOXPLOT_SCHEMA.load(json_data)
        except ValidationError as err:
            abort(422, message="{}".format(err))
        corpus = data['corpus']
        if not corpus:
            abort(404, message="No documents specified.")
        return get_boxplot_data(corpus, data['level'])
API.add_resource(BoxplotData, '/boxplot_data')

class RankedList(Resource):
    def post(self):
        json_data = request.get_json()
        if not json_data:
            abort(404, message="No input data provided, requires JSON.")
        try:
            data, _errors = schema.RANK_SCHEMA.load(json_data)
        except ValidationError as err:
            abort(422, message="{}".format(err))
        corpus = data['corpus']
        if not corpus:
            abort(404, message="No documents specified.")
        return get_rank_data(corpus, data['level'], data['sortby'])
API.add_resource(RankedList, '/ranked_list')

class ScatterplotData(Resource):
    def post(self):
        json_data = request.get_json()
        if not json_data:
            abort(404, message="No input data provided, requires JSON.")
        try:
            data, _errors = schema.SCATTER_PLOT_SCHEMA.load(json_data)
        except ValidationError as err:
            abort(422, message="{}".format(err))
        corpus = data['corpus']
        if not corpus:
            abort(404, message="No documents specified.")
        return get_scatter_data(corpus, data['level'], data['catX'], data['catY'])

API.add_resource(ScatterplotData, '/scatterplot_data')

class Groups(Resource):
    def post(self):
        json_data = request.get_json()
        if not json_data:
            abort(404, message="No input data provided, requires JSON.")
        try:
            data, _errors = schema.GROUP_SCHEMA.load(json_data)
        except ValidationError as err:
            abort(422, message="{}".format(err))
        corpus = data['corpus']
        if not corpus:
            abort(404, message="No documents specified.")
        return get_pairings(corpus, data['level'], data['group_size'])
API.add_resource(Groups, '/groups')

class Reports(Resource):
    def post(self):
        json_data = request.get_json()
        if not json_data:
            abort(404, message="No input data provided, requires JSON.")
        try:
            data, _errors = schema.REPORT_SCHEMA.load(json_data)
        except ValidationError as err:
            abort(422, message="{}".format(err))
        corpus = data['corpus']
        if not corpus:
            abort(404, message="No documents specified.")
        zip_buffer = get_reports(corpus,
                                 course=data['course'],
                                 assignment=data['assignment'],
                                 intro=data['intro'],
                                 stv_intro=data['stv_intro'])
        # https://gist.github.com/widoyo/3897853
        response = make_response(zip_buffer)
        response.headers['Content-Disposition'] = "attachment; filename='report.zip'"
        response.mimetype = 'application/zip'
        return response
API.add_resource(Reports, '/generate_reports')

class TextContent(Resource):
    def post(self):
        logging.debug('Recieved /text_content request')
        json_data = request.get_json()
        if not json_data:
            abort(404, message="No input data provided, requires JSON.")
        try:
            data, _errors = schema.TEXT_SCHEMA.load(json_data)
        except ValidationError as err:
            abort(422, message="{}".format(err))
        file_id = data['text_id']
        logging.debug("/text_request/{}".format(file_id))
        if not file_id:
            abort(404, message="No document specified.")
        return get_html_string(file_id)
API.add_resource(TextContent, '/text_content')

# Statically serve the web interface
@app.route('/')
def classroom():
    index_path = os.path.join(app.static_folder, 'index.html')
    return send_file(index_path)
@app.route('/<path:path>')
def route_frontend(path):
    file_path = os.path.join(app.static_folder, path)
    if os.path.isfile(file_path):
        return send_file(file_path)
    else:
        index_path = os.path.join(app.static_folder, 'index.html')
        return send_file(index_path)

if __name__ == '__main__':
    app.run(debug=True)
