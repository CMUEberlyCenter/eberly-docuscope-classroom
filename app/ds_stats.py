"""Calculates various statistics for documents that were tagged with DocuScope."""
import json
import logging
import re
from flask_restful import abort
import pandas as pd

from ds_tones import DocuScopeTones
import ds_groups
from ds_db import Filesystem

def get_ds_stats(documents):
    """Retrieve tagger statistics for the given documents."""
    stats = {}
    ds_dictionaries = set()
    for document in Filesystem.query.filter(Filesystem.id.in_([d['id'] for d in documents])):
        if document.processed:
            doc = document.processed
            # TODO: if ds stuff not there, start tagging/wait
            ser = pd.Series({key: val['num_tags'] for key, val in doc['ds_tag_dict'].items()})
            ser['total_words'] = doc['ds_num_word_tokens']
            ser['title'] = document.fullname if document.ownedby is '0' else \
                         '.'.join(document.name.split('.')[0:-1])
            stats[document.id] = ser
            ds_dictionaries.add(doc['ds_dictionary'])
    if not stats:
        abort(500, message="ERROR: No tagged documents were submitted, please close this window and wait until all of the selected documents are tagged before submitting again.")
    ds_dictionary = 'default'
    if len(ds_dictionaries) == 1:
        ds_dictionary = list(ds_dictionaries)[0]
    else:
        logging.error("Inconsistant dictionaries in corpus!!!")
        #TODO: throw error

    return pd.DataFrame(data=stats).transpose(), ds_dictionary

def get_level_frame(stats_frame, level, tones):
    """Accumulate statistics at the given granularity."""
    data = {}
    if level == 'Dimension':
        for dim, lats in tones.map_dimension_to_lats().items():
            sumframe = stats_frame.filter(lats)
            if not sumframe.empty:
                data[dim] = sumframe.transpose().sum()
                logging.debug("get_level_frame dimension: {}, sum:".format(dim))
                logging.debug(data[dim])
    elif level == 'Cluster':
        for cluster, clats in tones.map_cluster_to_lats().items():
            sumframe = stats_frame.filter(clats)
            if not sumframe.empty:
                data[cluster] = sumframe.transpose().sum()
                logging.debug("get_level_frame cluster: {}, sum:".format(cluster))
                logging.debug(data[cluster])
    frame = pd.DataFrame(data)

    logging.debug(frame)
    frame['total_words'] = stats_frame['total_words']
    frame['title'] = stats_frame['title']
    logging.debug(frame)
    return frame.transpose()

def get_boxplot_data(corpus, level, tones=None):
    """Given a corpus and level, generate the box plots."""
    logging.info("get_boxplot_data({}, {})".format(corpus, level))
    stat_frame, ds_dictionary = get_ds_stats(corpus)
    logging.info(" get_ds_stats =>")
    logging.info(stat_frame)
    if not tones:
        tones = DocuScopeTones(ds_dictionary)
    logging.info(" number of tones: {}".format(len(tones.tones)))
    frame = get_level_frame(stat_frame, level, tones)
    logging.info(frame)
    frame = frame.drop('title')
    frame = frame.apply(lambda x: x.divide(x['total_words'])) # frequencies
    frame = frame.drop('total_words')
    frame = frame.drop('Other', errors='ignore')
    frame = frame.transpose()

    frame = frame.fillna(0)
    logging.info("get_boxplot_data dataframe =>")
    logging.info(frame)

    categories = [c for c in frame][::-1] # list of categories (headers)
    logging.info("get_boxplot_data categories")
    logging.info(categories)

    q1 = frame.quantile(q=0.25)[::-1]
    q2 = frame.quantile(q=0.5)[::-1]
    q3 = frame.quantile(q=0.75)[::-1]
    qmin = frame.quantile(q=0)[::-1]
    qmax = frame.quantile(q=1)[::-1]
    iqr = q3 - q1
    upper_inner_fence = q2 + 1.5 * iqr
    #upper_outer_fence = q2 + 3.0 * iqr
    lower_inner_fence = (q2 - 1.5 * iqr).apply(lambda x: 0 if x < 0 else x)
    #lower_outer_fence = (q2 - 3.0 * iqr).apply(lambda x: 0 if x < 0 else x)

    outliers = []
    for category in frame:
        for point_title, value in frame[category].iteritems():
            if value > upper_inner_fence[category] or value < lower_inner_fence[category]:
                outliers.append({
                    'pointtitle': point_title,
                    'value': value,
                    'category': category
                })

    res = {
        "q1": q1,
        "q2": q2,
        "q3": q3,
        "min": qmin,
        "max": qmax,
        "uifence": upper_inner_fence,
        "lifence": lower_inner_fence
    }
    res_df = pd.DataFrame(res).fillna(0)
    res_df['category'] = categories
    bpdata = res_df.to_dict('records')
    bpdata.reverse()
    return {"bpdata": bpdata, "outliers": outliers}

def get_rank_data(corpus, level, sortby):
    """Generate the rankings of documents at the given granularity by the given dimension."""
    logging.info("get_rank_data({}, {}, {})".format(corpus, level, sortby))
    stat_frame, ds_dictionary = get_ds_stats(corpus)
    logging.info(" get_ds_stats =>")
    logging.info(stat_frame)
    tones = DocuScopeTones(ds_dictionary)
    logging.info(" number of tones: {}".format(len(tones.tones)))
    frame = get_level_frame(stat_frame, level, tones)
    logging.info(frame)

    title_row = frame.loc['title':]
    frame = frame.drop('title')

    frame = frame.apply(lambda x: x.divide(x['total_words'])) # frequencies
    frame = frame.drop('total_words')
    frame = frame.drop('Other', errors='ignore')
    frame = frame.append(title_row)
    frame = frame.transpose()
    frame = frame.fillna(0)

    if sortby not in frame:
        logging.error("{} is not in {}".format(sortby, frame.columns))
        abort(422, message="{} is not in {}".format(sortby, frame.columns.values))
    frame = frame.loc[:, ['title', sortby]]
    #logging.debug(frame)
    #cols_to_delete = list(frame.columns.values)

    #cols_to_delete.remove(sortby)
    #cols_to_delete.remove('title')

    #frame.drop(cols_to_delete, axis=1, inplace=True)
    frame.reset_index(inplace=True)
    frame.rename(columns={'title': 'text', sortby: 'value'}, inplace=True)

    frame.sort_values('value', ascending=False, inplace=True)

    frame = frame.head(50)
    frame = frame[frame.value != 0]
    logging.info(frame)
    return {'result': frame.to_dict('records')}

def get_scatter_data(corpus, level, cat_x, cat_y):
    """Generate the scatterplot data for the given documents."""
    logging.info("get_scatter_data({}, {}, {}, {})".format(corpus, level, cat_x, cat_y))
    stat_frame, ds_dictionary = get_ds_stats(corpus)
    logging.info(" get_ds_stats =>")
    logging.info(stat_frame)
    tones = DocuScopeTones(ds_dictionary)
    logging.info(" number of tones: {}".format(len(tones.tones)))
    frame = get_level_frame(stat_frame, level, tones)
    logging.info(frame)

    title_row = frame.loc['title']
    frame = frame.drop('title')
    frame = frame.drop('Other', errors='ignore')
    frame = frame.fillna(0)
    frame = frame.apply(lambda x: x.divide(x['total_words'])*100)
    frame = frame.drop('total_words')
    frame = frame.append(title_row)
    frame = frame.transpose()
    if cat_x not in frame or cat_y not in frame:
        abort(422, message="Either '{}' or '{}' is not in {}."\
              .format(cat_x, cat_y, frame.columns.values))
    frame = frame[[cat_x, cat_y, 'title']]
    frame['text_id'] = frame.index
    frame = frame.rename(columns={cat_x: 'catX', cat_y: 'catY'})
    return {'spdata': frame.to_dict('records')}

def get_pairings(corpus, level, group_size):
    """Generate the pairing of documents."""
    logging.info("get_pairings({}, {}, {})".format(corpus, level, group_size))
    stat_frame, ds_dictionary = get_ds_stats(corpus)
    logging.info(" get_ds_stats =>")
    logging.info(stat_frame)
    tones = DocuScopeTones(ds_dictionary)
    logging.info(" number of tones: {}".format(len(tones.tones)))
    frame = get_level_frame(stat_frame, level, tones)
    logging.info(frame)

    title_row = frame.loc['title':]
    frame = frame.drop('title')
    frame = frame.apply(lambda x: x.divide(x['total_words']))
    frame = frame.drop('total_words')
    frame = frame.drop('Other', errors='ignore')
    frame = frame.append(title_row)
    frame = frame.transpose().fillna(0).set_index('title')
    return ds_groups.get_best_groups(frame, group_size=group_size)

def get_html_string(text_id, format_paragraph=True):
    """Retrieve the html formatted string of the given document."""
    tags_dicts = {}
    html_content = ""
    res = {
        "text_id": text_id,
        "word_count": 0,
        "html_content": "",
        "dict": {}
    }
    ds_dictionary = 'default'
    document = Filesystem.query.filter_by(id=text_id).first()
    doc = document.processed #json.loads(document.processed)
    html_content = doc['ds_output']
    tags_dicts = doc['ds_tag_dict']
    res['word_count'] = doc['ds_num_word_tokens']
    res['text_id'] = document.name
    ds_dictionary = doc['ds_dictionary']
    html_content = re.sub(r'(\n|\s)+', ' ', html_content)
    if format_paragraph:
        html_content = "<p>" + html_content.replace("PZPZPZ", "</p><p>") + "</p>"
    res['html_content'] = html_content
    if tags_dicts:
        logging.info("Retrieving tones for {}".format(ds_dictionary))
        tones = DocuScopeTones(ds_dictionary)
        cats = {}
        for lat in tags_dicts.keys():
            cats[lat] = {"dimension": tones.get_dimension(lat),
                         "cluster": tones.get_lat_cluster(lat)}
        res['dict'] = cats
    return res
