from marshmallow import Schema, fields

class DocSchema(Schema):
    """A document entry: {"id": "%id%"}"""
    id = fields.String(required=True) # fields.UUID()?
    data = fields.String()
DOC_SCHEMA = DocSchema(many=True)

class CorpusSchema(Schema):
    """A corpus or collection of documents:
       {
         "corpus": [DocSchema*],
         "level" "Dimension|Cluster"
       }
    """
    corpus = fields.Nested(DocSchema, many=True)
    level = fields.String(required=True,
                          validate=lambda x: x in ('Dimension', 'Cluster'))
    #dictionary = fields.String(
    #    default='default',
    #    validate=lambda d: d in available_dictionaries())
BOXPLOT_SCHEMA = CorpusSchema()

class BoxplotDataEntrySchema(Schema):
    q1 = fields.Number()
    q2 = fields.Number()
    q3 = fields.Number()
    min = fields.Number()
    max = fields.Number()
    uifence = fields.Number()
    lifence = fields.Number()
    category = fields.String()

class OutlierDataSchema(Schema):
    pointtitle = fields.String()
    value = fields.Number()
    category = fields.String()

class BoxplotDataSchema(Schema):
    bpdata = fields.Nested(BoxplotDataEntrySchema, many=True)
    outliers = fields.Nested(OutlierDataSchema, many=True)

class RankedListSchema(CorpusSchema):
    sortby = fields.String(required=True)
RANK_SCHEMA = RankedListSchema()

class ScatterplotSchema(CorpusSchema):
    catX = fields.String(required=True)
    catY = fields.String(required=True)
SCATTER_PLOT_SCHEMA = ScatterplotSchema()

class GroupsSchema(CorpusSchema):
    group_size = fields.Integer(required=True, default=2)
    #absent_list = fields.Nested(DocSchema, many=True)
GROUP_SCHEMA = GroupsSchema()

class ReportsSchema(Schema):
    corpus = fields.Nested(DocSchema, many=True)
    #dictionary = fields.String(
    #    default='default',
    #    validate=lambda d: d in available_dictionaries())
    #course = fields.String()
    #assignment = fields.String()
    intro = fields.String()
    stv_intro = fields.String()
REPORT_SCHEMA = ReportsSchema()

class TextSchema(Schema):
    text_id = fields.String()
TEXT_SCHEMA = TextSchema()

#class DictionaryDataSchema(Schema):
    
#class TextDataSchema(Schema):
#    text_id = fields.String()
#    word_count = fields.Number()
#    html_content = fields.String()
#    dict = fields... {%word%: {"dimension": string, "cluster": string}}
