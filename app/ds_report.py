# coding: utf-8
# PDF REPORT

# system
import time
import copy
import math
import os
import io

# reportlab
from reportlab.platypus.flowables import Flowable
from reportlab.lib.colors import black, red
from reportlab.lib.units import inch, pica

from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, BaseDocTemplate, PageTemplate, NextPageTemplate, FrameBreak
from reportlab.platypus import Frame, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

import tempfile
import requests

import json
import zipfile
import itertools
import re

#from cloudant import couchdb
import pandas as pd

from flask import current_app

from bs4 import BeautifulSoup as bs

from ds_stats import get_boxplot_data, get_html_string, get_ds_stats, get_level_frame
from ds_tones import DocuScopeTones
import logging

# debug
# import pprint
# pp = pprint.PrettyPrinter(indent=4)

# units
#point = 1 #inch/72.0

def get_reports(corpus,
                course="", assignment="", intro="", stv_intro=""):
    logging.info("get_reports({}, {}, {}, {}, {})".format(corpus, course, assignment, intro, stv_intro))
    stat_frame, ds_dictionary = get_ds_stats(corpus)
    logging.info(" get_ds_stats =>")
    logging.info(stat_frame)
    tones = DocuScopeTones(ds_dictionary)
    logging.info(" number of tones: {}".format(len(tones.tones)))
    bp_data = get_boxplot_data(corpus, 'Cluster', tones=tones);
    frame = get_level_frame(stat_frame, 'Cluster', tones)
    logging.info(frame)
    return generate_pdf_reports(frame, corpus, ds_dictionary, tones, course, assignment, intro, stv_intro, bp_data)


class Divider(Flowable):
    def __init__(self, wd, wt=0.5, col=black):
        super().__init__()
        self.width  = wd
        self.weight = wt
        self.color  = col

    def draw(self):
        c = self.canv
        c.setLineWidth(self.weight)
        c.setStrokeColor(self.color)
        c.line(0,0,self.width,0)


class Boxplot(Flowable):
    """
    Line flowable --- draws a line in a flowable
    http://two.pairlist.net/pipermail/reportlab-users/2005-February/003695.html
    """
    def __init__(self, data={}, outliers=[],
                       val=-1, max_val=1.0,
                       wd=5.0*inch, ht=0.6*inch,
                       ml=1*pica, mr=1*pica, mt=1*pica, mb=1*pica,
                       rh=1.10*pica,
                       whisker=.125*inch, radius=2):

        super().__init__()
        self.data     = data
        self.outliers = outliers
        self.value    = val
        self.max_val  = max_val
        self.width    = wd
        self.height   = ht
        self.margins  = {'left': ml, 'right': mr, 'top': mt, 'bottom': mb}
        self.ruler_ht = rh
        self.whisker  = whisker
        self.radius   = radius

    def draw(self):
        """
        draw the line
        """
        c = self.canv
        #scale = (self.width - self.margins['left'] - self.margins['right'])/math.ceil(self.max_val)
        scale = (self.width - self.margins['left'] - self.margins['right'])/self.max_val

        box_height = self.height-(self.margins['top']+self.margins['bottom']+self.ruler_ht)
        box_v_center = box_height/2 + self.margins['bottom']+self.ruler_ht

        box_left     = self.margins['left'] + (self.data['q1'] * scale)
        box_h_center = self.margins['left'] + (self.data['q2'] * scale)
        box_right    = self.margins['left'] + (self.data['q3'] * scale)
        box_width    = box_right - box_left
        whisker      = self.whisker
        line_left    = self.margins['left'] + (self.data['min'] * scale)
        line_right   = self.margins['left'] + (self.data['max'] * scale)
        uifence_x    = self.margins['left'] + (self.data['uifence'] * scale)
        lifence_x    = self.margins['left'] + (self.data['lifence'] * scale)
        dot_x        = self.margins['left'] + (self.value * scale)

        c.setLineWidth(0.2)
        c.setFillColorRGB(0.8,0.8,0.8)
        c.setStrokeColor(black)

        # q1-q3 box
        c.line(line_left,  box_v_center, line_right, box_v_center)
        c.rect(box_left,   box_v_center-box_height/2 , box_width, box_height, stroke=True, fill=True)
        c.setFillColor(black)

        # q2 vertical line
        c.line(box_h_center, box_v_center-box_height/2-3, box_h_center, box_v_center+box_height/2+3)

        # min/max
        c.line(line_left,  box_v_center-whisker/2, line_left, box_v_center+whisker/2)
        c.line(line_right, box_v_center-whisker/2, line_right, box_v_center+whisker/2)

        # inner fences
        c.setStrokeColor(red)
        c.line(uifence_x, box_v_center-whisker/4, uifence_x, box_v_center+whisker/4)
        c.line(lifence_x, box_v_center-whisker/4, lifence_x, box_v_center+whisker/4)

        c.setStrokeColor(black)
        if self.value >= 0.0:
            c.circle(dot_x, box_v_center, self.radius, fill=1)

        # The following draws outliers; but we don't use them. So, let's comment them out.
        # We draw fences, so students can tell if they are outliers or not :-)
        # for o in self.outliers:
        #     x = self.margins['left'] + (o['value'] * scale)
        #     c.circle(x, box_v_center, self.radius, fill=0)

        c.setStrokeColor(black)

        # draw a ruler
        c.setFont("Helvetica", 6)
        msg = "=Your Frequency. On average, {:.2f} patterns are used per 1,000 words".format(self.value*1000)
        c.circle(self.margins['left'], self.margins['bottom']-6, self.radius, fill=1)
        c.drawString(self.margins['left']+3, self.margins['bottom']-8, msg)
        #for x in range(math.ceil(self.max_val)+1):
        for x in range(0, math.ceil(self.max_val*1000),10):
            c.line(self.margins['left'] + x*scale/1000, self.margins['bottom'], self.margins['left'] + x*scale/1000, self.margins['bottom']+3)
            c.drawCentredString(self.margins['left'] + x*scale/1000, self.margins['bottom']+5, "{0:.1f}".format(x))

#
# zip reports
#
# src_dir:    This directory should contain all the pdf reports.
# dst_fpath:  The path to the zip file that will be created.
#
def zip_reports(corpus_id, src_dir, dst_dir, dst_file):
    zipf = zipfile.ZipFile(os.path.join(dst_dir, dst_file), 'w', zipfile.ZIP_DEFLATED)

    # for root, dirs, files in os.walk(src_dir):
    #     for file in files:
    #         if not file.startswith("."):
    #             # zipf.write(os.path.join(root, file))  # original
    #             zipf.write(os.path.relpath(f, root))
    #             zipf.write(os.path.join(root, file), start=dst_dir)

    #cmd = "chmod 644 {}".format(os.path.join(dst_dir, dst_file))
    #os.system("echo {} |sudo -S {}".format('MdiH123.', cmd))

    for dirname, subdirs, files in os.walk(src_dir):
        for filename in files:
            absname = os.path.join(src_dir, filename)
            arcname = os.path.join(corpus_id, filename)
            zipf.write(absname, arcname)
    zipf.close()

#
# generate_pdf_reports
#
# df:           The data frame for the corpus.
# corpus_id:    The name/id of the corpus.
# dict_name:    The name of the custom docuscope dictionary (= assignment name)
# tones:        The tones object.
# dst_dir:      The directory in which all the PDF reports will be generated.
#
def generate_pdf_reports(df, corpus, dict_name, tones, course, assignment, intro, stv_intro, bp_data):
    descriptions = {'course': course, 'assignment': assignment, 'intro': intro, 'stv_intro': stv_intro}

    def get_cat_descriptions(cats, dict_name):
        """ From the dictionary 'dict_name', returns a set of cluster definitions for the
            clusters included in the list 'cats'
        """
        req = requests.get("{}/dictionary/{}/clusters".format(
            current_app.config.get('DICTIONARY_SERVER'),
            dict_name))
        clusters = req.json() #json.loads(req.data.decode('utf-8'))
        return {k:v for (k, v) in clusters.items() if k in cats}

    def find_bp(category, bp_data):
        """ Returns the boxplot data. """
        for bp in bp_data['bpdata']:
            if bp['category'] == category:
                return bp
        return None

    def find_outliers(category, bp_data):
        """ Return a list of outliers for the boxplot. """
        res = []
        for o in bp_data['outliers']:
            if o['category'] == category:
                res.append(o)
        return res

    #def get_html_string(text_id, dict_name, tones_):
    #    """This is identical to ds_utils.get_html_string, except that it does not convert
    #       paragraph break symbols with the <p> tags.
    #    """
    #    html_content = ""
    #    tags_dicts = {}
    #    res = {}
    #    word_count = 0

    #    with couchdb(current_app.config['COUCHDB_USER'],
    #                 current_app.config['COUCHDB_PASSWORD'],
    #                 url=current_app.config['COUCHDB_URL']) as cserv:
    #        corpus_db = cserv["corpus"]

    #        if text_id not in corpus_db:
    #            return res
    #        with corpus_db[text_id] as doc:
    #            html_content = doc['ds_output']
    #            tags_dicts = doc['ds_tag_dict']
    #            word_count = doc['ds_num_word_tokens']
    #            title = doc['_id'] # TODO: get student name

    #        html_content = re.sub('\n', ' ', html_content)
    #        html_content = re.sub(' +', ' ', html_content)

    #        cats = {}
    #        if (tags_dicts):
    #            for lat in tags_dicts.keys():    # for lat in the list of lats found in a particular text.
                    # could use tones_.tones directly?
    #                dim = tones_.get_dimension(lat)
    #                cluster = tones_.get_cluster(dim)
    #                cats[lat] = {"dimension": dim, "cluster": cluster}    # cats = categories

    #        res = {"text_id": title, "word_count": word_count, "html_content": html_content, "dict": cats}

    #    return res

    patterns_all = {}
    def html_to_report_string(node, d):
        """ Returns a HTML version of the text with tags. """
        s = ""
        patterns = {}
        for child in node.children:
            name = getattr(child, "name",  None)

            if name:
                if 'class' in child.attrs and 'tag' in child.attrs['class']:
                    words, _ = html_to_report_string(child, d)
                    inner_str = ' '.join(words)
                    cluster = d[child.attrs['data-key']].get('cluster', "?")
                    if cluster != "Other":
                        s += "<u>{}</u><font face=Helvetica size=7> [{}]</font>".format(inner_str.strip(), cluster)

                        # collect all the patterns
                        if patterns.get(cluster, None) == None:
                            patterns[cluster] = {}

                        key = inner_str.lower()
                        if patterns[cluster].get(key, None) != None:
                            patterns[cluster][key] += 1
                        else:
                            patterns[cluster][key] = 1

                        if patterns_all.get(cluster, None) == None:
                            patterns_all[cluster] = {}

                        key = inner_str.lower()
                        if patterns_all[cluster].get(key, None) != None:
                            patterns_all[cluster][key] += 1
                        else:
                            patterns_all[cluster][key] = 1

                    else:
                        s += inner_str

                elif 'token' in child.attrs['class']:
                    if child.text == " ":
                        s +="{}".format(child.text)
                    else:
                        tmp = child.text.strip()
                        s += "{}".format(tmp)
            # elif not child.isspace():
            #     s += child
            else:
                try:
                    if not child.isspace():
                        s += child
                except:
                    current_app.logger.debug("debug: html_to_report_string(). name = {}, type = {}".format(name, type(child)))


        paragraphs = s.split('PZPZPZ')
        return paragraphs, patterns

    def sort_patterns(unsorted_patterns):
        """ Sort a list of dictionaries that contain count-pattern pairs by frequency.
            The list is sorted by the frequency first, then patterns (alphabtically)
        """
        res = {}
        for key, val in list(unsorted_patterns.items()):
            lst = list()
            for word, count in list(val.items()):
                lst.append((count, word))
            lst.sort(key=lambda sl: (-sl[0],sl[1]))
            res[key] = lst
        return res

    # save the title row (it'll be removed, and will be put back in later.)
    title_row = df.loc['title':]

    # make 2 copies of the dataframe
    df1 = df.copy()
    df2 = df.copy()

    # prepare the dataframe 'df2' which will be used later.
    df2 = df2.drop('title')
    df2 = df2.fillna(0)
    df2 = df2.apply(lambda x: x.divide(x['total_words']))  # calculate frequencies
    df2 = df2.drop('total_words')
    df2 = df2.drop('Other')
    df2 = df2.append(title_row)

    # use df1 to get the boxplot data for this corpus
    df1 = df1.drop('title')
    df1 = df1.fillna(0)
    df1 = df1.apply(lambda x: x.divide(x['total_words']))  # calculate frequencies
    df1 = df1.drop('total_words')
    df1 = df1.drop('Other')
    df1 = df1.transpose()

    # calculate the max value for the box-plot. It will be used to deermine
    # the scale factor by Boxplot class.
    max_val = 0.0
    for d in bp_data['bpdata']: # for each category
        if max_val < d['max']:
            max_val = d['max']
    for o in bp_data['outliers']:
        if max_val < o['value']:
            max_val = o['value']

    # let's extract the cluster names (i.e., categories)
    categories = [c for c in df1][::-1]

    # load human-readable names and descriptions for each category (cluster) from _help.txt
    cat_descriptions = get_cat_descriptions(categories, dict_name)

    # create a document with 3 templates
    # report_dir = os.path.join(dst_dir, "{}_reports".format(corpus_id))
    #report_dir = tempfile.TemporaryDirectory()
    #if not os.path.exists(report_dir):
    #    os.makedirs(report_dir)
    zip_stream = io.BytesIO()
    with zipfile.ZipFile(zip_stream, 'w') as zip_file, \
         io.BytesIO() as all_reports:
        # tempfile.TemporaryDirectory() as report_dir, \
        # tempfile.NamedTemporaryFile(suffix='_all.pdf') as allfpath:
        #fpath = os.path.join(report_dir, "_{}_all.pdf".format(corpus_id))
        doc = BaseDocTemplate(all_reports, pagesize=letter,
                              rightMargin=0.75*inch, leftMargin=1.5*inch,
                              topMargin=0.5*inch, bottomMargin=0.5*inch)

        gutter = 1*pica
        one_column_template = PageTemplate(
            id='one_column',
            frames=[
                Frame(
                    doc.leftMargin,
                    doc.bottomMargin,
                    doc.width,
                    doc.height,
                    id='left',
                    showBoundary=0
                )
            ]
        )
        title_ht = 0.5*inch
        three_column_hd_template = PageTemplate(
            id='three_column_w_header',
            frames=[
                Frame(
                    doc.leftMargin,
                    doc.bottomMargin + doc.height - title_ht,
                    doc.width,
                    title_ht,
                    id='title_area',
                    showBoundary=0
                ),
                Frame(
                    doc.leftMargin,
                    doc.bottomMargin,
                    (doc.width - gutter*2) / 3,
                    doc.height - (title_ht+gutter),
                    id='left',
                    showBoundary=0
                ),
                Frame(
                    doc.leftMargin + gutter + (doc.width - gutter*2) / 3,
                    doc.bottomMargin,
                    (doc.width - gutter*2) / 3,
                    doc.height - (title_ht+gutter),
                    id='middle',
                    showBoundary=0
                ),
                Frame(
                    doc.leftMargin + gutter*2 + 2 * (doc.width - gutter*2) / 3,
                    doc.bottomMargin,
                    (doc.width - gutter*2) / 3,
                    doc.height - (title_ht+gutter),
                    id='right',
                    showBoundary=0
                ),
            ]
        )

        three_column_template = PageTemplate(
            id='three_column',
            frames=[
                Frame(
                    doc.leftMargin,
                    doc.bottomMargin,
                    (doc.width - gutter*2) / 3,
                    doc.height,
                    id='left',
                    showBoundary=0
                ),
                Frame(
                    doc.leftMargin + gutter + (doc.width - gutter*2) / 3,
                    doc.bottomMargin,
                    (doc.width - gutter*2) / 3,
                    doc.height,
                    id='middle',
                    showBoundary=0
                ),
                Frame(
                    doc.leftMargin + gutter*2 + 2 * (doc.width - gutter*2) / 3,
                    doc.bottomMargin,
                    (doc.width - gutter*2) / 3,
                    doc.height,
                    id='right',
                    showBoundary=0
                ),
            ]
        )

        doc.addPageTemplates([one_column_template, three_column_template, three_column_hd_template])

        # define paragraph styles
        styles=getSampleStyleSheet()
        styles.add(ParagraphStyle(name='DS_MetaData',  fontSize=9, fontName='Helvetica',
                                  leading=12, alignment=TA_LEFT))
        styles.add(ParagraphStyle(name='DS_Intro',  fontSize=9, fontName='Helvetica',
                                  leading=16, alignment=TA_LEFT, spaceBefore=9))
        styles.add(ParagraphStyle(name='DS_Body',  fontSize=10, fontName='Times-Roman',
                                  leading=16, alignment=TA_LEFT, spaceAfter=6))
        styles.add(ParagraphStyle(name='DS_Pattern',  fontSize=10, fontName='Times-Roman',
                                  leading=12, alignment=TA_LEFT, spaceAfter=6))
        styles.add(ParagraphStyle(name='DS_Help',  fontSize=9, fontName='Helvetica',
                                  leading=12, alignment=TA_LEFT))
        styles.add(ParagraphStyle(name='DS_Heading1',  fontSize=10, fontName='Helvetica-Bold',
                                  leading=16, alignment=TA_LEFT, spaceBefore=16))
        styles.add(ParagraphStyle(name='DS_Title', fontSize=16, fontName='Times-Bold',
                                  leading=16, alignment=TA_LEFT, spaceAfter=2*pica))
        styles.add(ParagraphStyle(name='DS_Student', fontSize=14, fontName='Times-Italic',
                                  leading=16, alignment=TA_LEFT, spaceAfter=pica))
        styles.add(ParagraphStyle(name='DS_Date', fontSize=8, fontName='Helvetica',
                                  spaceAfter=0, leading=12, alignment=TA_LEFT))
        styles.add(ParagraphStyle(name='DS_CoverText', fontSize=10, fontName='Helvetica',
                                  spaceAfter=0, leading=12, alignment=TA_LEFT))

        combined_content=[]   # list of flowables
        combined_content.append(NextPageTemplate('one_column'))  # we'll use the one column layout first.

        # COVER PAGE
        combined_content.append(Paragraph("created:       {}".format(time.ctime()), styles["DS_Date"]))
        combined_content.append(Spacer(1, pica))
        combined_content.append(Paragraph("<b>DocuScope Report</b>", styles["DS_CoverText"]))
        combined_content.append(Spacer(1, 6))
        combined_content.append(Paragraph("<b>Instructor:</b>    suguru@cmu.edu", styles["DS_CoverText"]))
        combined_content.append(Paragraph("<b>Course:</b>        76-101", styles["DS_CoverText"]))
        combined_content.append(Paragraph("<b>Assignment:</b>    CGA", styles["DS_CoverText"]))

        combined_content.append(PageBreak())

        # ########################################
        # Create reports for individual students
        # ########################################

        text_ids = df1.index.values.tolist() # get a list of IDs from the dataframe (id = student)
        num_ids = len(text_ids)              # how many students?

        for i in range(len(text_ids)):       # for each student's data
            text_id = text_ids[i]            # unique id for each student
            title = df2[text_id]['title']

            # create a new document
            with io.BytesIO() as fpath:
                #fpath = os.path.join(report_dir, "{}.pdf".format(title))
                individual_doc = BaseDocTemplate(fpath, pagesize=letter,
                                                 rightMargin=0.75*inch,
                                                 leftMargin=1.5*inch,
                                                 topMargin=0.5*inch,
                                                 bottomMargin=0.5*inch)
                individual_doc.addPageTemplates([one_column_template, three_column_template, three_column_hd_template])
                content = []

                # header area (course name, assignment name, and the student's name)
                content.append(Paragraph("<b>{}</b>".format(descriptions['course']), styles['DS_MetaData']))
                content.append(Paragraph("Assignment: {}".format(descriptions['assignment']), styles['DS_MetaData']))
                content.append(Spacer(1, pica))
                content.append(Paragraph("Report for {}".format(title), styles['DS_Student']))  # just for a demo
                content.append(Divider(doc.width))

                # introduction to the report
                content.append(Paragraph(descriptions['intro'], styles['DS_Intro']))
                content.append(Spacer(1, pica))

                # draw boxplots for each category (cluster)
                for c in categories:
                    bp = find_bp(c, bp_data)
                    o = find_outliers(c, bp_data)
                    v = df2[text_id][c]

                    bp_item = Boxplot(bp, outliers=o, val=v, max_val=max_val)
                    content.append(Paragraph(cat_descriptions[c]['name'], styles["DS_Heading1"]))
                    content.append(Paragraph(cat_descriptions[c]['description'], styles["DS_Help"]))
                    content.append(bp_item)
                content.append(PageBreak())

                # STV (annotated text)
                content.append(Paragraph("Your Text", styles['DS_Title']))
                content.append(Paragraph(descriptions['stv_intro'], styles['DS_Intro']))
                content.append(Spacer(1, 2*pica))

                # get the text with docuscope tags, and reformat the text for the report.
                tagged_str = get_html_string(text_id, format_paragraph=False)
            #with couchdb(current_app.config.get("COUCHDB_USER"),
            #             current_app.config.get("COUCHDB_PASSWORD"),
            #             url=current_app.config.get("COUCHDB_URL")) as server:
            #    tagged_str = get_html_string(server['corpus'], text_id, tones)

                # current_app.logger.debug("debug: generate_pdf_reports(). tagged_str['html_content'] = {}\n".format(tagged_str['html_content']))

                soup = bs(tagged_str['html_content'], "html.parser")

                para_list, patterns = html_to_report_string(soup, tagged_str['dict'])
                for p in para_list:
                    content.append(Paragraph(p, styles['DS_Body']))

                content.append(NextPageTemplate('three_column_w_header'))
                content.append(PageBreak())
                content.append(Paragraph("Patterns Used in Your Document", styles['DS_Title']))
                content.append(NextPageTemplate('one_column'))
                ranked_patterns = sort_patterns(patterns)
                for c in categories:
                    lst = ranked_patterns.get(c, [])
                    content.append(Paragraph(c, styles['DS_Heading1']))
                    for p in lst:
                        ln = "{} ({})".format(p[1], p[0])
                        content.append(Paragraph(ln, styles['DS_Pattern']))

                content.append(PageBreak())
                combined_content += copy.deepcopy(content)  # add the content for each file to the large file.
                individual_doc.build(content)    # create an individual PDF (pe student)
                zip_file.writestr(f"{title}.pdf", fpath.getvalue())

        # ########################################
        # Create a PDF that includes all the PDF reports.
        # ########################################

        res = doc.build(combined_content)
        zip_file.writestr(f"_all.pdf", all_reports.getvalue())

        # ########################################
        # Create a summary of patterns in a separate PDF.
        # ########################################

        ranked_patterns = sort_patterns(patterns_all)
        #fpath = os.path.join(report_dir, "_patterns.pdf")
        with io.BytesIO() as fpath:
            patterns_doc = BaseDocTemplate(fpath, pagesize=letter,
                                           rightMargin=0.75*inch,
                                           leftMargin=1.5*inch,
                                           topMargin=0.5*inch,
                                           bottomMargin=0.5*inch)
            patterns_doc.addPageTemplates([three_column_hd_template, three_column_template])
            conent = []
            content.append(NextPageTemplate('three_column'))
            content.append(Paragraph("Patterns Used in the Corpus", styles['DS_Title']))
            content.append(FrameBreak())
            for c in categories:
                lst = ranked_patterns.get(c, [])
                content.append(Paragraph(c, styles['DS_Heading1']))
                for p in lst:
                    ln = "{} ({})".format(p[1], p[0])
                    content.append(Paragraph(ln, styles['DS_Pattern']))

            patterns_doc.build(content)
            zip_file.writestr("_patterns.pdf", fpath.getvalue())
    return zip_stream.getvalue()
