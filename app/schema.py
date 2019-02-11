"""Defines Marshmallow schemas for validating JSON."""
from marshmallow import Schema, fields

class DocSchema(Schema):
    """Schema for a document entry: {"id": "%id%"}"""
    id = fields.String(required=True) # fields.UUID()?
    data = fields.String()
DOC_SCHEMA = DocSchema(many=True)

class CorpusSchema(Schema):
    """Schema for a corpus or collection of documents:
       {
         "corpus": [DocSchema*],
         "level" "Dimension|Cluster"
       }
    """
    corpus = fields.Nested(DocSchema, many=True)
    level = fields.String(required=True,
                          validate=lambda x: x in ('Dimension', 'Cluster'))
BOXPLOT_SCHEMA = CorpusSchema()

class BoxplotDataEntrySchema(Schema):
    """Schema for a Boxplot Data point:
    {
      "q1": <number>,
      "q2": <number>,
      "q3": <number>,
      "min": <number>,
      "max": <number>,
      "uifence": <number>,
      "lifence": <number>,
      "category": <string>
    }
    """
    q1 = fields.Number()
    q2 = fields.Number()
    q3 = fields.Number()
    min = fields.Number()
    max = fields.Number()
    uifence = fields.Number()
    lifence = fields.Number()
    category = fields.String()

class OutlierDataSchema(Schema):
    """Schema for an Outlier Data point."""
    pointtitle = fields.String()
    value = fields.Number()
    category = fields.String()

class BoxplotDataSchema(Schema):
    """Schema for returned Boxplot data."""
    bpdata = fields.Nested(BoxplotDataEntrySchema, many=True)
    outliers = fields.Nested(OutlierDataSchema, many=True)

class RankedListSchema(CorpusSchema):
    """Schema for Ranked List requests."""
    sortby = fields.String(required=True)
RANK_SCHEMA = RankedListSchema()

class ScatterplotSchema(CorpusSchema):
    """Schema for Scatterplot requests."""
    catX = fields.String(required=True)
    catY = fields.String(required=True)
SCATTER_PLOT_SCHEMA = ScatterplotSchema()

class GroupsSchema(CorpusSchema):
    """Schema for Grouping requests."""
    group_size = fields.Integer(required=True, default=2)
    #absent_list = fields.Nested(DocSchema, many=True)
GROUP_SCHEMA = GroupsSchema()

class ReportsSchema(Schema):
    """Schema for Report generation requests."""
    corpus = fields.Nested(DocSchema, many=True)
    intro = fields.String()
    stv_intro = fields.String()
REPORT_SCHEMA = ReportsSchema()

class TextSchema(Schema):
    """Schema for mtv requests."""
    text_id = fields.String()
TEXT_SCHEMA = TextSchema()

#class DictionaryDataSchema(Schema):

#class TextDataSchema(Schema):
#    text_id = fields.String()
#    word_count = fields.Number()
#    html_content = fields.String()
#    dict = fields... {%word%: {"dimension": string, "cluster": string}}
