"""Calculates various statistics for documents that were tagged with DocuScope."""
import json
import logging
import re
from fastapi import HTTPException
import pandas as pd

from ds_tones import DocuScopeTones
from ds_groups import *
from ds_db import Assignment, DSDictionary, Filesystem
from db import SESSION
from contextlib import contextmanager
@contextmanager
def session_scope():
    """Provide a transactional scope around a series of operations."""
    session = SESSION()
    try:
        yield session
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()

def get_ds_stats(documents):
    """Retrieve tagger statistics for the given documents."""
    stats = {}
    ds_dictionaries = set()
    with session_scope() as session:
        for doc, fullname, ownedby, filename, doc_id, ds_dic in \
            session.query(Filesystem.processed, Filesystem.fullname,
                          Filesystem.ownedby, Filesystem.name, Filesystem.id,
                          DSDictionary.name)\
                   .filter(Filesystem.id.in_([d['id'] for d in documents]))\
                   .filter(Assignment.id == Filesystem.assignment)\
                   .filter(DSDictionary.id == Assignment.dictionary):
            if doc:
                # TODO: if ds stuff not there, start tagging/wait
                ser = pd.Series({key: val['num_tags'] for key, val in doc['ds_tag_dict'].items()})
                ser['total_words'] = doc['ds_num_word_tokens']
                ser['title'] = fullname if ownedby is 'student' else \
                               '.'.join(filename.split('.')[0:-1])
                ser['ownedby'] = ownedby
                stats[str(doc_id)] = ser
                ds_dictionaries.add(ds_dic)
    if not stats:
        raise HTTPException(
            status_code=500,
            detail="ERROR: No tagged documents were submitted, "
            + "please close this window and wait until all of the selected "
            + "documents are tagged before submitting again.")
    ds_dictionary = 'default'
    if len(ds_dictionaries) == 1:
        ds_dictionary = list(ds_dictionaries)[0]
    else:
        logging.error("Inconsistant dictionaries in corpus!!!")
        raise HTTPException(
            status_code=500,
            detail="ERROR: Inconsistant dictionaries used in corpus, "
            + "documents are not compairable.")

    return pd.DataFrame(data=stats).transpose(), ds_dictionary

def get_level_frame(stats_frame, level, tones):
    """Accumulate statistics at the given granularity."""
    data = {}
    if level == 'Dimension':
        for dim, lats in tones.map_dimension_to_lats().items():
            sumframe = stats_frame.filter(lats)
            if not sumframe.empty:
                data[dim] = sumframe.transpose().sum()
                logging.debug("get_level_frame dimension: %s, sum:", dim)
                logging.debug(data[dim])
    elif level == 'Cluster':
        for cluster, clats in tones.map_cluster_to_lats().items():
            sumframe = stats_frame.filter(clats)
            if not sumframe.empty:
                data[cluster] = sumframe.transpose().sum()
                logging.debug("get_level_frame cluster: %s, sum:", cluster)
                logging.debug(data[cluster])
    frame = pd.DataFrame(data)

    logging.debug(frame)
    frame['total_words'] = stats_frame['total_words']
    frame['title'] = stats_frame['title']
    frame['ownedby'] = stats_frame['ownedby']
    logging.debug(frame)
    return frame.transpose()

def get_boxplot_data(corpus, level, tones=None):
    """Given a corpus and level, generate the box plots."""
    logging.info("get_boxplot_data(%s, %s)", corpus, level)
    stat_frame, ds_dictionary = get_ds_stats(corpus)
    logging.info(" get_ds_stats =>")
    logging.info(stat_frame)
    if not tones:
        tones = DocuScopeTones(ds_dictionary)
    logging.info(" number of tones: %d", len(tones.tones))
    frame = get_level_frame(stat_frame, level, tones)
    logging.info(frame)
    frame = frame.drop('title').drop('ownedby', errors='ignore')
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

    quant1 = frame.quantile(q=0.25)[::-1]
    quant2 = frame.quantile(q=0.5)[::-1]
    quant3 = frame.quantile(q=0.75)[::-1]
    qmin = frame.quantile(q=0)[::-1]
    qmax = frame.quantile(q=1)[::-1]
    iqr = quant3 - quant1
    upper_inner_fence = quant2 + 1.5 * iqr
    #upper_outer_fence = quant2 + 3.0 * iqr
    lower_inner_fence = (quant2 - 1.5 * iqr).apply(lambda x: 0 if x < 0 else x)
    #lower_outer_fence = (quant2 - 3.0 * iqr).apply(lambda x: 0 if x < 0 else x)

    outliers = [] # ownedby is not needed
    for category in frame:
        for point_title, value in frame[category].iteritems():
            if value > upper_inner_fence[category] or value < lower_inner_fence[category]:
                outliers.append({
                    'pointtitle': point_title,
                    'value': value,
                    'category': category
                })

    res = {
        "q1": quant1,
        "q2": quant2,
        "q3": quant3,
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
    logging.info("get_rank_data(%s, %s, %s)", corpus, level, sortby)
    stat_frame, ds_dictionary = get_ds_stats(corpus)
    logging.info(" get_ds_stats =>")
    logging.info(stat_frame)
    tones = DocuScopeTones(ds_dictionary)
    logging.info(" number of tones: %d", len(tones.tones))
    frame = get_level_frame(stat_frame, level, tones)
    logging.info(frame)

    title_row = frame.loc['title':]
    owner_row = frame.loc['ownedby':]
    frame = frame.drop('title').drop('ownedby', errors='ignore')

    frame = frame.apply(lambda x: x.divide(x['total_words'])) # frequencies
    frame = frame.drop('total_words')
    frame = frame.drop('Other', errors='ignore')
    frame = frame.append(title_row)
    frame = frame.append(owner_row)
    frame = frame.transpose()
    frame = frame.fillna(0)

    if sortby not in frame:
        logging.error("%s is not in %s", sortby, frame.columns)
        raise HTTPException(status_code=422, detail="{} is not in {}".format(sortby, frame.columns.values))
    frame = frame.loc[:, ['title', sortby, 'ownedby']]

    frame.reset_index(inplace=True)
    frame.rename(columns={'title': 'text', sortby: 'value'}, inplace=True)

    frame.sort_values('value', ascending=False, inplace=True)

    frame = frame.head(50)
    frame = frame[frame.value != 0]
    logging.info(frame)
    return {'result': frame.to_dict('records')}

def get_scatter_data(corpus, level, cat_x, cat_y):
    """Generate the scatterplot data for the given documents."""
    logging.info("get_scatter_data(%s, %s, %s, %s)", corpus, level, cat_x, cat_y)
    stat_frame, ds_dictionary = get_ds_stats(corpus)
    logging.info(" get_ds_stats =>")
    logging.info(stat_frame)
    tones = DocuScopeTones(ds_dictionary)
    logging.info(" number of tones: %d", len(tones.tones))
    frame = get_level_frame(stat_frame, level, tones)
    logging.info(frame)

    title_row = frame.loc['title']
    owner_row = frame.loc['ownedby']
    frame = frame.drop('title').drop('ownedby')
    frame = frame.drop('Other', errors='ignore')
    frame = frame.fillna(0)
    frame = frame.apply(lambda x: x.divide(x['total_words'])*100)
    frame = frame.drop('total_words')
    frame = frame.append(title_row).append(owner_row)
    frame = frame.transpose()
    if cat_x not in frame or cat_y not in frame:
        raise HTTPException(
            status_code=422,
            detail="Either '{}' or '{}' is not in {}.".format(cat_x, cat_y, frame.columns.values))
    frame = frame[[cat_x, cat_y, 'title', 'ownedby']]
    frame['text_id'] = frame.index
    frame = frame.rename(columns={cat_x: 'catX', cat_y: 'catY'})
    return {'spdata': frame.to_dict('records')}

def get_pairings(corpus, level, group_size):
    """Generate the pairing of documents."""
    logging.info("get_pairings(%s, %s, %s)", corpus, level, group_size)
    stat_frame, ds_dictionary = get_ds_stats(corpus)
    logging.info(" get_ds_stats =>")
    logging.info(stat_frame)
    tones = DocuScopeTones(ds_dictionary)
    logging.info(" number of tones: %d", len(tones.tones))
    frame = get_level_frame(stat_frame, level, tones)
    logging.info(frame)

    # Use only student files.
    frame = frame.loc[lambda frame: frame['ownedby'] is 'student']
    title_row = frame.loc['title':]
    frame = frame.drop('title').drop('ownedby')
    frame = frame.apply(lambda x: x.divide(x['total_words']))
    frame = frame.drop('total_words')
    frame = frame.drop('Other', errors='ignore')
    frame = frame.append(title_row)
    frame = frame.transpose().fillna(0).set_index('title')
    return ds_groups.get_best_groups(frame, group_size=group_size)

def get_html_string(text_id, format_paragraph=True, tones=None):
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
    doc = None
    with session_scope() as session:
        doc, filename = session.query(Filesystem.processed, Filesystem.name).filter_by(id=text_id).first()
    if not doc:
        raise Exception('File record not found for {}'.format(text_id))
    html_content = doc['ds_output']
    tags_dicts = doc['ds_tag_dict']
    res['word_count'] = doc['ds_num_word_tokens']
    res['text_id'] = filename
    ds_dictionary = doc['ds_dictionary']
    html_content = re.sub(r'(\n|\s)+', ' ', html_content)
    if format_paragraph:
        html_content = "<p>" + html_content.replace("PZPZPZ", "</p><p>") + "</p>"
    res['html_content'] = html_content
    if tags_dicts:
        if not tones:
            logging.info("Retrieving tones for %s", ds_dictionary)
            tones = DocuScopeTones(ds_dictionary)
        cats = {}
        for lat in tags_dicts.keys():
            cats[lat] = {"dimension": tones.get_dimension(lat),
                         "cluster": tones.get_lat_cluster(lat)}
        res['dict'] = cats
    return res
