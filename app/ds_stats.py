from cloudant import couchdb
from flask import current_app
from flask_restful import abort
import pandas as pd
import re
import logging
#from functools import lru_cache

from ds_tones import DocuScopeTones
import ds_groups
from ds_report import generate_pdf_reports

logging.basicConfig(level=logging.DEBUG)
#logger = logging.getLogger(__name__)

def get_ds_stats(documents):
    stats = {}
    with couchdb(current_app.config['COUCHDB_USER'],
                 current_app.config['COUCHDB_PASSWORD'],
                 url=current_app.config['COUCHDB_URL']) as cserv:
        try:
            corpus_db = cserv["corpus"]
        except KeyError:
            corpus_db = cserv.create_database('corpus')

        for document in documents:
            if document['id'] not in corpus_db:
                logging.warning("{} is not in db!".format(document['id']))
                break # TODO: tag and wait
            with corpus_db[document['id']] as doc:
                # TODO: if ds stuff not there, start tagging/wait
                s = pd.Series({key: val['num_tags'] for key, val in doc['ds_tag_dict'].items()})
                s['total_words'] = doc['ds_num_word_tokens']
                s['title'] = doc['_id'] # TODO: get student name
                stats[doc['_id']] = s # orig is 'key'... probably a view thing

    return pd.DataFrame(data=stats).transpose()

def get_level_frame(stats_frame, level, tones):
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

def get_boxplot_data(corpus, level, ds_dictionary):
    logging.info("get_boxplot_data({}, {}, {})".format(corpus, level, ds_dictionary))
    stat_frame = get_ds_stats(corpus)
    logging.info(" get_ds_stats =>")
    logging.info(stat_frame)
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
    upper_outer_fence = q2 + 3.0 * iqr
    lower_inner_fence = (q2 - 1.5 * iqr).apply(lambda x: 0 if x < 0 else x)
    lower_outer_fence = (q2 - 3.0 * iqr).apply(lambda x: 0 if x < 0 else x)

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

def get_rank_data(corpus, level, ds_dictionary, sortby):
    logging.info("get_rank_data({}, {}, {}, {})".format(corpus, level, ds_dictionary, sortby))
    stat_frame = get_ds_stats(corpus)
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
    if 'Other' in frame:
        frame = frame.drop('Other')
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

def get_scatter_data(corpus, level, ds_dictionary, cat_x, cat_y):
    logging.info("get_scatter_data({}, {}, {}, {}, {})".format(corpus, level, ds_dictionary, cat_x, cat_y))
    stat_frame = get_ds_stats(corpus)
    logging.info(" get_ds_stats =>")
    logging.info(stat_frame)
    tones = DocuScopeTones(ds_dictionary)
    logging.info(" number of tones: {}".format(len(tones.tones)))
    frame = get_level_frame(stat_frame, level, tones)
    logging.info(frame)

    title_row = frame.loc['title']
    frame = frame.drop('title')
    if 'Other' in frame:
        frame = frame.drop('Other')
    frame = frame.fillna(0)
    frame = frame.apply(lambda x: x.divide(x['total_words'])*100)
    frame = frame.drop('total_words')
    frame = frame.append(title_row)
    frame = frame.transpose()
    if cat_x not in frame or cat_y not in frame:
        abort(422, message="Either '{}' or '{}' is not in {}.".format(cat_x, cat_y, frame.columns.values))
    frame = frame[[cat_x, cat_y, 'title']]
    frame['text_id'] = frame.index
    frame = frame.rename(columns = {cat_x: 'catX', cat_y: 'catY'})
    return {'spdata': frame.to_dict('records')}

def get_pairings(corpus, level, ds_dictionary, group_size):
    logging.info("get_pairings({}, {}, {}, {})".format(corpus, level, ds_dictionary, group_size))
    stat_frame = get_ds_stats(corpus)
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
    if 'Other' in frame:
        frame = frame.drop('Other')
    frame = frame.append(title_row)
    frame = frame.transpose().fillna(0).set_index('title')
    return ds_groups.get_best_groups(frame, group_size=group_size)

def get_reports(corpus, ds_dictionary,
                course="", assignment="", intro="", stv_intro=""):
    logging.info("get_reports({}, {}, {}, {}, {}, {})".format(corpus, ds_dictionary, course, assignment, intro, stv_intro))
    stat_frame = get_ds_stats(corpus)
    logging.info(" get_ds_stats =>")
    logging.info(stat_frame)
    tones = DocuScopeTones(ds_dictionary)
    logging.info(" number of tones: {}".format(len(tones.tones)))
    frame = get_level_frame(stat_frame, 'Cluster', tones)
    logging.info(frame)

    generate_pdf_reports(frame, corpus, ds_dictionary, tones)
    return

def get_html_string(text_id, ds_dictionary):
    tones = DocuScopeTones(ds_dictionary)

    tags_dicts = {}
    html_content = ""
    res = {
        "text_id": text_id,
        "word_count": 0,
        "html_content": "",
        "dict": {}
    }
    with couchdb(current_app.config['COUCHDB_USER'],
                 current_app.config['COUCHDB_PASSWORD'],
                 url=current_app.config['COUCHDB_URL']) as cserv:
        corpus_db = cserv['corpus']
        with corpus_db[text_id] as doc:
            html_content = doc['ds_output']
            tags_dicts = doc['ds_tag_dict']
            res['word_count'] = doc['ds_num_word_tokens']
            res['text_id'] = doc['_id'] # TODO: get title
    html_content = re.sub('(\n|\s)+', ' ', html_content)
    html_content = "<p>" + html_content.replace("PZPZPZ", "</p><p>") + "</p>"
    res['html_content'] = html_content
    if (tags_dicts):
        cats = {}
        for lat in tags_dicts.keys():
            cats[lat] = {"dimension": tones.get_dimension(lat),
                         "cluster": tones.get_dimension(lat)}
        res['dict'] = cats
    return res
