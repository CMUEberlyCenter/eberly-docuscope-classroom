from marshmallow import Schema, fields, post_load, ValidationError
import urllib3
import logging

from flask import current_app

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

def get_tones(dictionary_name="default"):
    """Retrieve the DocuScope tones data for a dictionary."""
    req = HTTP.request('GET',
                       "{}/dictionary/{}/tones".format(
                           current_app.config['DICTIONARY_SERVER'], dictionary_name))
    logging.info(req.data.decode('utf-8'))
    try:
        tones, _errors = DST_SCHEMA.loads(req.data.decode('utf-8'))
    except ValidationError as err:
        logging.error(err.messages)
        tones = err.valid_data
    return tones

class DocuScopeTones():
    def __init__(self, dictionary_name="default"):
        self.dictionary_name = dictionary_name
        self._tones = None
        self._lat_to_dim = None

    @property
    def tones(self):
        if not self._tones:
            self._tones = get_tones(self.dictionary_name)
        return self._tones

    def map_dimension_to_lats(self):
        dim_dict = {}
        for tone in self.tones:
            if tone.dimension not in dim_dict:
                dim_dict[tone.dimension] = set()
            dim_dict[tone.dimension].update(tone.lats)
        return dim_dict

    def map_lats_to_dimension(self):
        lat_dict = {}
        for tone in self.tones:
            for lat in tone.lats:
                lat_dict[lat] = tone.dimension # Should this clobber?
        return lat_dict

    def map_cluster_to_dimension(self):
        clust_dict = {}
        for tone in self.tones:
            clust_dict[tone.cluster] = clust_dict.get(tone.cluster, set()).update(tone.dimension)
        return clust_dict

    def map_dimension_to_cluster(self):
        dim_dict = {}
        for tone in self.tones:
            dim_dict[tone.dimension] = tone.cluster # clobbering?
        return dim_dict

    def get_dimension(self, lat):
        if not self._lat_to_dim:
            self._lat_to_dim = self.map_lats_to_dimension()
        return self._lat_to_dim[lat]

    def get_cluster(self, dimension):
        if not self._dim_to_clust:
            self._dim_to_clust = self.map_dimension_to_cluster()
        return self._dim_to_clust[dimension]
