"""
Defines class DocuScopeTones which is used to retrieve and parse tones
for a dictionary.
"""
import gzip
import json
import logging
import os
from typing import List
from fastapi import HTTPException
#from marshmallow import Schema, fields, post_load, ValidationError
from pydantic import BaseModel, ValidationError
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY
from default_settings import Config

class DocuScopeTone(BaseModel): #pylint: disable=R0903
    """A DocuScope Tone entry."""
    cluster: str = '***NO CLUSTER***'
    dimension: str = '***NO DIMENSION***'
    lats: List[str] = ['***NO CLASS***']

    @property
    def lat(self):
        """Returns the index lat (first one) in the lats."""
        return self.lats[0]

#class DocuScopeToneSchema(Schema):
#    """A Schema for validating tones."""
#    cluster = fields.String()
#    dimension = fields.String()
#    lats = fields.List(fields.String())

#    @post_load
#    def make_lat(self, data): #pylint: disable=R0201
#        """Convert json data to a DocuScopeTone object."""
#        return DocuScopeTone(**data)
#DST_SCHEMA = DocuScopeToneSchema(many=True)

def get_local_tones(dictionary_name="default"):
    """Retrieve the DocuScope tones data for a dictionary from a local file."""
    try:
        tone_path = os.path.join(Config.DICTIONARY_HOME,
                                 "{}_tones.json.gz".format(dictionary_name))
        with gzip.open(tone_path, 'rt') as jin:
            data = json.loads(jin.read())
    except ValueError as enc_error:
        logging.error("Error reading %s tones: %s", dictionary_name, enc_error)
        raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="Error reading {}_tones.json.gz: {}".format(
                                dictionary_name, enc_error))
    except OSError as os_error:
        logging.error("Error reading %s tones: %s", dictionary_name, os_error)
        raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="Error reading {}_tones.json.gz: {}".format(
                                dictionary_name, os_error))
    try:
        tones = [DocuScopeTone(**d) for d in data]
    except ValidationError as err:
        logging.error("Validation Error parsing tones for %s", dictionary_name)
        raise HTTPException(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Errors in parsing tones for {}: {}".format(dictionary_name,
                                                               err))
    except ValueError as v_err:
        logging.error("Invalid JSON returned for %s", dictionary_name)
        logging.error("%s", v_err)
        raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="Errors decoding tones for {}: {}".format(
                                dictionary_name, v_err))
    if not tones:
        logging.error("No tones were retrieved for %s.", dictionary_name)
        raise HTTPException(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No tones were retrieved for {}.".format(dictionary_name))
    return tones

class DocuScopeTones():
    """A collection of DocuScope tones/lats."""
    def __init__(self, dictionary_name="default"):
        self.dictionary_name = dictionary_name
        self._tones = None
        self._lats = None

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
