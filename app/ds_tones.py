"""
Defines class DocuScopeTones which is used to retrieve and parse tones
for a dictionary.
"""
import gzip
import json
import logging
from flask import current_app
from flask_restful import abort
from marshmallow import Schema, fields, post_load, ValidationError
import requests

class DocuScopeTone(): #pylint: disable=R0903
    """A DocuScope Tone entry."""
    def __init__(self, cluster, dimension, lats):
        self.cluster = cluster or '***NO CLUSTER***'
        self.dimension = dimension or '***NO DIMENSION***'
        self.lats = lats or ['***NO CLASS***']
    @property
    def lat(self):
        """Returns the index lat (first one) in the lats."""
        return self.lats[0]

class DocuScopeToneSchema(Schema):
    """A Schema for validating tones."""
    cluster = fields.String()
    dimension = fields.String()
    lats = fields.List(fields.String())

    @post_load
    def make_lat(self, data): #pylint: disable=R0201
        """Convert json data to a DocuScopeTone object."""
        return DocuScopeTone(**data)
DST_SCHEMA = DocuScopeToneSchema(many=True)

def get_local_tones(dictionary_name="default"):
    """Retrieve the DocuScope tones data for a dictionary from a local file."""
    #TODO: add checks for file existance and valid tones file.
    #TODO: parameterize dictionary directory.
    try:
        tone_path = os.path.join(current_app.config.get('DICTIONARY_HOME'),
                                 "{}_tones.json.gz".format(dictionary_name))
        with gzip.open(tone_path, 'rt') as jin:
            data = json.loads(jin.read())
    except ValueError as enc_error:
        logging.error("Error reading %s tones: %s", dictionary_name, enc_error)
        abort(422, message="Error reading {}_tones.json.gz: {}".format(dictionary_name, enc_error))
    except OSError as os_error:
        logging.error("Error reading %s tones: %s", dictionary_name, os_error)
        abort(422, message="Error reading {}_tones.json.gz: {}".format(dictionary_name, os_error))
    try:
        tones, val_errors = DST_SCHEMA.load(data)
        if val_errors:
            logging.warning("Parsing errors: %s", val_errors)
    except ValidationError as err:
        logging.error("Validation Error rparsing tones for %s", dictionary_name)
        logging.error(err.messages)
        tones = err.valid_data
        abort(422, message="Errors in parsing tones for {}: {}".format(
            dictionary_name, err.messages))
    except ValueError as v_err:
        logging.error("Invalid JSON returned for %s", dictionary_name)
        logging.error("%s", v_err)
        tones = None
        abort(422, message="Errors decoding tones for {}: {}".format(dictionary_name, v_err))
    if not tones:
        logging.error("No tones were retrieved for %s.", dictionary_name)
        abort(422,
              message="No tones were retrieved for {}.".format(dictionary_name))
    return tones

class DocuScopeTones():
    """A collection of DocuScope tones/lats."""
    def __init__(self, dictionary_name="default"):
        self.dictionary_name = dictionary_name
        self._tones = None
        self._lats = None
        #self._dim_to_clust = None # TODO: remove as currently unused

    @property
    def tones(self):
        """Retrieve the tones."""
        if not self._tones:
            self._tones = get_local_tones(self.dictionary_name)
        return self._tones

    @property
    def lats(self):
        """Return dictionary of lat -> tone."""
        if not self._lats:
            self._lats = {tone.lat: tone for tone in self.tones}
        return self._lats

    def map_dimension_to_lats(self):
        """Return dictionary of dimention -> lat."""
        dim_dict = {}
        for tone in self.tones:
            if tone.dimension not in dim_dict:
                dim_dict[tone.dimension] = set()
            dim_dict[tone.dimension].update(tone.lats)
        return dim_dict

    def map_cluster_to_lats(self):
        """Return dictionary of cluster -> lat."""
        clust_dict = {}
        for tone in self.tones:
            if tone.cluster not in clust_dict:
                clust_dict[tone.cluster] = set()
            clust_dict[tone.cluster].update(tone.lats)
        return clust_dict

    def map_lats_to_dimension(self):
        """Maps lat -> dimension."""
        return {lat: tone.dimension for (lat, tone) in self.lats.items()}

    def map_cluster_to_dimension(self):
        """Maps cluster -> dimension."""
        clust_dict = {}
        for tone in self.tones:
            if tone.cluster not in clust_dict:
                clust_dict[tone.cluster] = set()
            clust_dict[tone.cluster].update(tone.dimension)
        return clust_dict

    #def map_dimension_to_cluster(self):
    #    """Maps dimension -> cluster."""
    #    return {tone.dimension: tone.cluster for tone in self.tones}

    def get_lat_cluster(self, lat):
        """Returns the cluster for the given lat."""
        cluster = ""
        try:
            cluster = self.lats[lat].cluster
        except KeyError:
            logging.error("Cluster lookup: %s is not in LATS", lat)
        return cluster

    def get_dimension(self, lat):
        """Returns the dimension for the given lat."""
        dim = ""
        try:
            dim = self.lats[lat].dimension
        except KeyError:
            logging.error("Dimension lookup: %s is not in LATS", lat)
        return dim

#    def get_cluster(self, dimension):
#        """Returns the cluster for the given dimension."""
#        if not self._dim_to_clust:
#            self._dim_to_clust = self.map_dimension_to_cluster()
#        return self._dim_to_clust[dimension]
