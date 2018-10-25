from marshmallow import Schema, fields, post_load, ValidationError
import urllib3
import logging
from functools import lru_cache

from flask import current_app
from flask_restful import abort

HTTP = urllib3.PoolManager()

class DocuScopeTone():
    def __init__(self, cluster, dimension, lats):
        self.cluster = cluster or '***NO CLUSTER***'
        self.dimension = dimension or '***NO DIMENSION***'
        self.lats = lats or ['***NO CLASS***']
    @property
    def lat(self):
        return self.lats[0]

class DocuScopeToneSchema(Schema):
    cluster = fields.String()
    dimension = fields.String()
    lats = fields.List(fields.String())

    @post_load
    def make_lat(self, data):
        return DocuScopeTone(**data)
DST_SCHEMA = DocuScopeToneSchema(many=True)

@lru_cache(maxsize=16)
def get_tones(dictionary_name="default"):
    """Retrieve the DocuScope tones data for a dictionary."""
    req = HTTP.request('GET',
                       "{}/dictionary/{}/tones".format(
                           current_app.config['DICTIONARY_SERVER'], dictionary_name))
    #logging.info(req.data.decode('utf-8'))
    try:
        tones, val_errors = DST_SCHEMA.loads(req.data.decode('utf-8'))
        if val_errors:
            logging.warning("Parsing errors: {}".format(val_errors))
    except ValidationError as err:
        logging.error(err.messages)
        tones = err.valid_data
        abort(422, message="Errors in parsing tones: {}".format(err.messages))
    if not tones:
        abort(422,
              message="No tones were retrieved for {}.".format(dictionary_name))
    return tones

class DocuScopeTones():
    def __init__(self, dictionary_name="default"):
        self.dictionary_name = dictionary_name
        self._tones = None
        self._lats = None
        self._dim_to_clust = None # TODO: remove as unused

    @property
    def tones(self):
        if not self._tones:
            self._tones = get_tones(self.dictionary_name)
        return self._tones

    @property
    def lats(self):
        if not self._lats:
            self._lats = {tone.lat: tone for tone in self.tones}
        return self._lats

    def map_dimension_to_lats(self):
        dim_dict = {}
        for tone in self.tones:
            if tone.dimension not in dim_dict:
                dim_dict[tone.dimension] = set()
            dim_dict[tone.dimension].update(tone.lats)
        return dim_dict

    def map_cluster_to_lats(self):
        clust_dict = {}
        for tone in self.tones:
            if tone.cluster not in clust_dict:
                clust_dict[tone.cluster] = set()
            clust_dict[tone.cluster].update(tone.lats)
        return clust_dict

    def map_lats_to_dimension(self):
        return {lat: tone.dimension for (lat, tone) in self.lats.items()}

    def map_cluster_to_dimension(self):
        clust_dict = {}
        for tone in self.tones:
            if tone.cluster not in clust_dict:
                clust_dict[tone.cluster] = set()
            clust_dict[tone.cluster].update(tone.dimension)
        return clust_dict

    def map_dimension_to_cluster(self):
        return {tone.dimension: tone.cluster for tone in self.tones}

    def get_lat_cluster(self, lat):
        return self.lats[lat].cluster

    def get_dimension(self, lat):
        return self.lats[lat].dimension

    def get_cluster(self, dimension):
        if not self._dim_to_clust:
            self._dim_to_clust = self.map_dimension_to_cluster()
        return self._dim_to_clust[dimension]
