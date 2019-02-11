"""DocuScope Classroom analysis tools interface."""
import logging
import os

from flask import request, make_response, send_file
from flask_restful import Resource, Api, abort
from marshmallow import ValidationError

from create_app import create_flask_app
import schema

from ds_stats import get_boxplot_data, get_rank_data, get_scatter_data, \
    get_pairings, get_html_string
from ds_report import get_reports

#logging.basicConfig(level=logging.DEBUG)
#logger = logging.getLogger(__name__)

app = create_flask_app() #pylint: disable=C0103
API = Api(app)

#python -c 'import os; print(os.urandom(16))' =>
app.secret_key = b'\xf7i\x0b\xb5[)C\x0b\x15\xf0T\x13\xe1\xd2\x9e\x8a'

@app.after_request
def after_request(response):
    """Adds extra headers to deal with cross-origin issues."""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers',
                         ','.join(['Access-Control-Allow-Headers',
                                   'Access-Control-Allow-Origin',
                                   'Access-Control-Allow-Methods',
                                   'Content-Type']))
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST')
    return response

class BoxplotData(Resource):
    """Resource for handling requests for box plot data."""
    def post(self): #pylint: disable=R0201
        """Respond to POST requests."""
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
    """Resource for handling requests for ranking data."""
    def post(self): #pylint: disable=R0201
        """Respond to POST requests."""
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
    """Resource for handling requests for scatterplot data."""
    def post(self): #pylint: disable=R0201
        """Respond to POST requests."""
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
    """Resource for handling requests for grouping documents."""
    def post(self): #pylint: disable=R0201
        """Respond to POST requests."""
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
    """Resource for handling requests for report generation."""
    def post(self): #pylint: disable=R0201
        """Respond to POST requests."""
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
        try:
            zip_buffer = get_reports(corpus,
                                     intro=data['intro'],
                                     stv_intro=data['stv_intro'])
        except Exception as excp: #pylint: disable=W0703
            logging.error("%s\n%s", corpus, excp)
            abort(500, message="ERROR in report generation.")
        # https://gist.github.com/widoyo/3897853
        response = make_response(zip_buffer)
        response.headers['Content-Disposition'] = "attachment; filename='report.zip'"
        response.mimetype = 'application/zip'
        return response
API.add_resource(Reports, '/generate_reports')

class TextContent(Resource):
    """Resource for handling requests for tagged text data."""
    def post(self): #pylint: disable=R0201
        """Respond to POST requests."""
        logging.debug('Recieved /text_content request')
        json_data = request.get_json()
        if not json_data:
            abort(404, message="No input data provided, requires JSON.")
        try:
            data, _errors = schema.TEXT_SCHEMA.load(json_data)
        except ValidationError as err:
            abort(422, message="{}".format(err))
        file_id = data['text_id']
        logging.debug("/text_request/%s", file_id)
        if not file_id:
            abort(404, message="No document specified.")
        return get_html_string(file_id)
API.add_resource(TextContent, '/text_content')

# Statically serve the web interface
@app.route('/')
def classroom():
    """Returns top level application interface."""
    index_path = os.path.join(app.static_folder, 'index.html')
    return send_file(index_path)

@app.route('/<path:path>')
def route_frontend(path):
    """Routes for static files."""
    file_path = os.path.join(app.static_folder, path)
    if os.path.isfile(file_path):
        return send_file(file_path)
    index_path = os.path.join(app.static_folder, 'index.html')
    return send_file(index_path)

if __name__ == '__main__':
    app.run(debug=True)
