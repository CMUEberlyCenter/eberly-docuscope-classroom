"""Generate printable reports based on a tagged set of files."""
# coding: utf-8
# PDF REPORT

# system
from collections import defaultdict, Counter
import copy
import html
import io
import json
import logging
import math
import os
import time
import zipfile

# reportlab
from reportlab.platypus.flowables import Flowable
from reportlab.lib.colors import black, red
from reportlab.lib.units import inch, pica

from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.platypus import BaseDocTemplate, PageTemplate,\
    NextPageTemplate, FrameBreak
from reportlab.platypus import Frame, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from bs4 import BeautifulSoup as bs

from default_settings import Config

class Divider(Flowable):
    """A Divider."""
    def __init__(self, wd, wt=0.5, col=black):
        super().__init__()
        self.width = wd
        self.weight = wt
        self.color = col

    def draw(self):
        """Draw the divider."""
        self.canv.setLineWidth(self.weight)
        self.canv.setStrokeColor(self.color)
        self.canv.line(0, 0, self.width, 0)

class Boxplot(Flowable): #pylint: disable=too-many-instance-attributes
    """
    Line flowable --- draws a line in a flowable
    http://two.pairlist.net/pipermail/reportlab-users/2005-February/003695.html
    """
    def __init__(self, data=None, outliers=None, #pylint: disable=too-many-arguments
                 val=-1, max_val=1.0,
                 wd=5.0*inch, ht=0.6*inch,
                 ml=1*pica, mr=1*pica, mt=1*pica, mb=1*pica,
                 rh=1.10*pica,
                 whisker=.125*inch, radius=2):
        super().__init__()
        self.data = data or {}
        self.outliers = outliers or []
        self.value = val
        self.max_val = max_val
        self.measurements = {'ruler_height': rh,
                             'whisker': whisker, 'radius': radius}
        self.width = wd
        self.height = ht
        self.margins = {'left': ml, 'right': mr, 'top': mt, 'bottom': mb}
        #self.ruler_ht = rh
        #self.whisker = whisker
        #self.radius = radius

    def draw(self):
        """
        draw the line
        """
        scale = (self.width - self.margins['left']
                 - self.margins['right'])/self.max_val

        box_height = self.height-(self.margins['top']+
                                  self.margins['bottom']+
                                  self.measurements['ruler_height'])
        box_v_center = box_height/2 + self.margins['bottom'] + self.measurements['ruler_height']

        box_left = self.margins['left'] + (self.data['q1'] * scale)
        box_h_center = self.margins['left'] + (self.data['q2'] * scale)
        box_right = self.margins['left'] + (self.data['q3'] * scale)
        line_left = self.margins['left'] + (self.data['min'] * scale)
        line_right = self.margins['left'] + (self.data['max'] * scale)
        uifence_x = self.margins['left'] + (self.data['uifence'] * scale)
        lifence_x = self.margins['left'] + (self.data['lifence'] * scale)
        dot_x = self.margins['left'] + (self.value * scale)

        self.canv.setLineWidth(0.2)
        self.canv.setFillColorRGB(0.8, 0.8, 0.8)
        self.canv.setStrokeColor(black)

        # q1-q3 box
        self.canv.line(line_left, box_v_center, line_right, box_v_center)
        self.canv.rect(box_left, box_v_center-box_height/2,
                       box_right - box_left,
                       box_height, stroke=True, fill=True)
        self.canv.setFillColor(black)

        # q2 vertical line
        self.canv.line(box_h_center, box_v_center-box_height/2-3, box_h_center,
                       box_v_center+box_height/2+3)

        # min/max
        self.canv.line(line_left, box_v_center-self.measurements['whisker']/2,
                       line_left, box_v_center+self.measurements['whisker']/2)
        self.canv.line(line_right, box_v_center-self.measurements['whisker']/2,
                       line_right, box_v_center+self.measurements['whisker']/2)

        # inner fences
        self.canv.setStrokeColor(red)
        self.canv.line(uifence_x, box_v_center-self.measurements['whisker']/4,
                       uifence_x, box_v_center+self.measurements['whisker']/4)
        self.canv.line(lifence_x, box_v_center-self.measurements['whisker']/4,
                       lifence_x, box_v_center+self.measurements['whisker']/4)

        self.canv.setStrokeColor(black)
        if self.value >= 0.0:
            self.canv.circle(dot_x, box_v_center, self.measurements['radius'], fill=1)

        # The following draws outliers; but we don't use them. So, let's comment them out.
        # We draw fences, so students can tell if they are outliers or not :-)
        # for o in self.outliers:
        #     x = self.margins['left'] + (o['value'] * scale)
        #     self.canv.circle(x, box_v_center, self.measurements['radius'], fill=0)

        self.canv.setStrokeColor(black)

        # draw a ruler
        self.canv.setFont("Helvetica", 6)
        msg = "=Your Frequency. On average, {:.2f} patterns are used per 1,000 words"\
                 .format(self.value*1000)
        self.canv.circle(self.margins['left'], self.margins['bottom']-6,
                         self.measurements['radius'], fill=1)
        self.canv.drawString(self.margins['left']+3, self.margins['bottom']-8,
                             msg)
        for tick in range(0, math.ceil(self.max_val*1000), 10):
            self.canv.line(self.margins['left'] + tick*scale/1000,
                           self.margins['bottom'],
                           self.margins['left'] + tick*scale/1000,
                           self.margins['bottom']+3)
            self.canv.drawCentredString(self.margins['left'] + tick*scale/1000,
                                        self.margins['bottom']+5,
                                        "{0:.1f}".format(tick))

def get_cat_descriptions(cats, dict_name):
    """ From the dictionary 'dict_name', returns a set of cluster
        definitions for the clusters included in the list 'cats'
        """
    try:
        with open(os.path.join(Config.DICTIONARY_HOME,
                               "{}_clusters.json".format(dict_name))) as cin:
            clusters = json.load(cin)
    except OSError as err:
        logging.error("While loading %s clusters: %s", dict_name, err)
        raise
    return {k:v for (k, v) in clusters.items() if k in cats}

def find_bp(category, bp_data):
    """ Returns the boxplot data. """
    return next((bp for bp in bp_data['bpdata'] if bp['category'] == category),
                None)

def find_outliers(category, bp_data):
    """ Return a list of outliers for the boxplot of the given category. """
    return list(filter(lambda outl: outl['category'] == category,
                       bp_data['outliers']))

def sort_patterns(unsorted_patterns):
    """ Sort a list of dictionaries that contain count-pattern pairs by frequency.
        The list is sorted by the frequency first, then patterns (alphabtically)
        """
    return {key: sorted([(count, word) for (word, count) in val.items()],
                        key=lambda sl: (-sl[0], sl[1]))
            for (key, val) in unsorted_patterns.items()}

def html_to_report_string(node, ds_dict, patterns_all):
    """ Returns a HTML version of the text with tags. """
    paragraphs = ""
    patterns = defaultdict(Counter)
    for child in node.children:
        name = getattr(child, "name", None)

        if name:
            if 'class' in child.attrs and 'tag' in child.attrs['class']:
                words, _ = html_to_report_string(child, ds_dict, patterns_all)
                inner_str = ' '.join(words)
                cluster = ds_dict[child.attrs['data-key']].get('cluster', "?")
                if cluster != "Other":
                    paragraphs += "<u>{}</u><font face=Helvetica size=7> [{}]</font>"\
                        .format(inner_str.strip(), cluster)

                    # collect all the patterns
                    key = inner_str.lower()
                    patterns[cluster].update([key])
                    patterns_all[cluster].update([key])
                else:
                    paragraphs += inner_str

            elif 'token' in child.attrs['class']:
                if child.text == " ":
                    paragraphs += child.text
                else:
                    paragraphs += html.escape(child.text.strip())
        else:
            try:
                if not child.isspace():
                    paragraphs += child
            except (AttributeError, TypeError) as exc:
                logging.error(
                    "html_to_report_string(). name = %s, type = %s, error = %s",
                    name, type(child), exc)

    return paragraphs.split('PZPZPZ'), patterns

MARGINS = {
    "left": 1.5*inch,
    "right": 0.75*inch,
    "top": 0.5*inch,
    "bottom": 0.5*inch
}
def generate_paragraph_styles():
    """Generate the styles object used for paragraphs in the report."""
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='DS_MetaData',
                              fontSize=9, fontName='Helvetica',
                              leading=12, alignment=TA_LEFT))
    styles.add(ParagraphStyle(name='DS_Intro',
                              fontSize=9, fontName='Helvetica',
                              leading=16, alignment=TA_LEFT, spaceBefore=9))
    styles.add(ParagraphStyle(name='DS_Body',
                              fontSize=10, fontName='Times-Roman',
                              leading=16, alignment=TA_LEFT, spaceAfter=6))
    styles.add(ParagraphStyle(name='DS_Pattern',
                              fontSize=10, fontName='Times-Roman',
                              leading=12, alignment=TA_LEFT, spaceAfter=6))
    styles.add(ParagraphStyle(name='DS_Help',
                              fontSize=9, fontName='Helvetica',
                              leading=12, alignment=TA_LEFT))
    styles.add(ParagraphStyle(name='DS_Heading1',
                              fontSize=10, fontName='Helvetica-Bold',
                              leading=16, alignment=TA_LEFT, spaceBefore=16))
    styles.add(ParagraphStyle(name='DS_Title',
                              fontSize=16, fontName='Times-Bold',
                              leading=16, alignment=TA_LEFT, spaceAfter=2*pica))
    styles.add(ParagraphStyle(name='DS_Student',
                              fontSize=14, fontName='Times-Italic',
                              leading=16, alignment=TA_LEFT, spaceAfter=pica))
    styles.add(ParagraphStyle(name='DS_Date',
                              fontSize=8, fontName='Helvetica',
                              spaceAfter=0, leading=12, alignment=TA_LEFT))
    styles.add(ParagraphStyle(name='DS_CoverText',
                              fontSize=10, fontName='Helvetica',
                              spaceAfter=0, leading=12, alignment=TA_LEFT))
    return styles

#pylint: disable=too-many-locals, too-many-statements
def generate_pdf_reports(dframe, corpus, dict_name, bp_data, descriptions):
    """Generate all of the pdf reports.

    @param dframe - the data frame for the corpus.
    @param corpus - a dictionary of {uuid*: {'html_content': str,
                                             'dict': {lat*: {'dimension': str,
                                                             'cluster': str}}}}
    @param dict_name - the name of the DocuScope dictionary used.
    @param bp_data - the data frame of the box plot data.
    @param descriptions - a dictionary of {'course': str, 'assignment': str,
                                           'instructor': str, 'intro': str,
                                           'stv_intro': str}
    """
    logging.info("%s", descriptions)

    patterns_all = defaultdict(Counter)

    # save the title row (it'll be removed, and will be put back in later.)
    title_row = dframe.loc['title':]

    # make 2 copies of the dataframe
    df1 = dframe.copy()
    df2 = dframe.copy()

    # prepare the dataframe 'df2' which will be used later.
    df2 = df2.drop('title').drop('ownedby')
    df2 = df2.fillna(0)
    df2 = df2.apply(lambda x: x.divide(x['total_words']))  # calculate frequencies
    df2 = df2.drop('total_words')
    df2 = df2.drop('Other', errors='ignore')
    df2 = df2.append(title_row)

    # use df1 to get the boxplot data for this corpus
    df1 = df1.drop('title').drop('ownedby')
    df1 = df1.fillna(0)
    df1 = df1.apply(lambda x: x.divide(x['total_words']))  # calculate frequencies
    df1 = df1.drop('total_words')
    df1 = df1.drop('Other', errors='ignore')
    df1 = df1.transpose()

    # calculate the max value for the box-plot. It will be used to determine
    # the scale factor by Boxplot class.
    max_val = max(0.0,
                  max([d['max'] for d in bp_data['bpdata']], default=0.0),
                  max([o['value'] for o in bp_data['outliers']], default=0.0))

    # let's extract the cluster names (i.e., categories)
    categories = list(df1)[::-1]

    # load human-readable names and descriptions for each category (cluster) from _help.txt
    cat_descriptions = get_cat_descriptions(categories, dict_name)

    # create a document with 3 templates
    zip_stream = io.BytesIO()
    with zipfile.ZipFile(zip_stream, 'w') as zip_file, \
         io.BytesIO() as all_reports:
        doc = BaseDocTemplate(all_reports, pagesize=letter,
                              rightMargin=MARGINS["right"],
                              leftMargin=MARGINS["left"],
                              topMargin=MARGINS["top"],
                              bottomMargin=MARGINS["bottom"])

        gutter = 1*pica
        one_column_template = PageTemplate(
            id='one_column',
            frames=[
                Frame(
                    MARGINS["left"],
                    MARGINS["bottom"],
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
                    MARGINS["left"],
                    MARGINS["bottom"] + doc.height - title_ht,
                    doc.width,
                    title_ht,
                    id='title_area',
                    showBoundary=0
                ),
                Frame(
                    MARGINS["left"],
                    MARGINS["bottom"],
                    (doc.width - gutter*2) / 3,
                    doc.height - (title_ht+gutter),
                    id='left',
                    showBoundary=0
                ),
                Frame(
                    MARGINS["left"] + gutter + (doc.width - gutter*2) / 3,
                    MARGINS["bottom"],
                    (doc.width - gutter*2) / 3,
                    doc.height - (title_ht+gutter),
                    id='middle',
                    showBoundary=0
                ),
                Frame(
                    MARGINS["left"] + gutter*2 + 2 * (doc.width - gutter*2) / 3,
                    MARGINS["bottom"],
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
                    MARGINS["left"],
                    MARGINS["bottom"],
                    (doc.width - gutter*2) / 3,
                    doc.height,
                    id='left',
                    showBoundary=0
                ),
                Frame(
                    MARGINS["left"] + gutter + (doc.width - gutter*2) / 3,
                    MARGINS["bottom"],
                    (doc.width - gutter*2) / 3,
                    doc.height,
                    id='middle',
                    showBoundary=0
                ),
                Frame(
                    MARGINS["left"] + gutter*2 + 2 * (doc.width - gutter*2) / 3,
                    MARGINS["bottom"],
                    (doc.width - gutter*2) / 3,
                    doc.height,
                    id='right',
                    showBoundary=0
                ),
            ]
        )

        doc.addPageTemplates([one_column_template, three_column_template,
                              three_column_hd_template])

        styles = generate_paragraph_styles()

        combined_content = []   # list of flowables
        # we'll use the one column layout first.
        combined_content.append(NextPageTemplate('one_column'))

        # COVER PAGE
        combined_content.append(Paragraph(
            "created:       {}".format(time.ctime()), styles["DS_Date"]))
        combined_content.append(Spacer(1, pica))
        combined_content.append(Paragraph(
            "<b>DocuScope Report</b>", styles["DS_CoverText"]))
        combined_content.append(Spacer(1, 6))
        if descriptions['instructor']:
            combined_content.append(Paragraph(
                "<b>Instructor:</b>    {}".format(descriptions['instructor']),
                styles["DS_CoverText"]))
        if descriptions['course']:
            combined_content.append(Paragraph(
                "<b>Course:</b>        {}".format(descriptions['course']),
                styles["DS_CoverText"]))
        if descriptions['assignment']:
            combined_content.append(Paragraph(
                "<b>Assignment:</b>    {}".format(descriptions['assignment']),
                styles["DS_CoverText"]))

        combined_content.append(PageBreak())

        # ########################################
        # Create reports for individual students
        # ########################################

        text_ids = df1.index.values.tolist() # get a list of IDs from the dataframe (id = student)
        #num_ids = len(text_ids)              # how many students?

        for text_id in text_ids:       # for each student's data
            title = df2[text_id]['title']

            # create a new document
            with io.BytesIO() as fpath:
                #fpath = os.path.join(report_dir, "{}.pdf".format(title))
                individual_doc = BaseDocTemplate(fpath, pagesize=letter,
                                                 rightMargin=MARGINS["right"],
                                                 leftMargin=MARGINS["left"],
                                                 topMargin=MARGINS["top"],
                                                 bottomMargin=MARGINS["bottom"])
                individual_doc.addPageTemplates([one_column_template,
                                                 three_column_template,
                                                 three_column_hd_template])
                content = []

                # header area (course name, assignment name, and the student's name)
                content.append(Paragraph(
                    "<b>{}</b>".format(descriptions['course']),
                    styles['DS_MetaData']))
                content.append(Paragraph(
                    "Assignment: {}".format(descriptions['assignment']),
                    styles['DS_MetaData']))
                content.append(Spacer(1, pica))
                content.append(Paragraph("Report for {}".format(title),
                                         styles['DS_Student']))  # just for a demo
                content.append(Divider(doc.width))

                # introduction to the report
                content.append(Paragraph(descriptions['intro'],
                                         styles['DS_Intro']))
                content.append(Spacer(1, pica))

                # draw boxplots for each category (cluster)
                for cat in categories:
                    bp_item = Boxplot(find_bp(cat, bp_data),
                                      outliers=find_outliers(cat, bp_data),
                                      val=df2[text_id][cat], max_val=max_val)
                    content.append(Paragraph(cat_descriptions[cat]['name'],
                                             styles["DS_Heading1"]))
                    content.append(Paragraph(
                        cat_descriptions[cat]['description'],
                        styles["DS_Help"]))
                    content.append(bp_item)
                content.append(PageBreak())

                # STV (annotated text)
                content.append(Paragraph("Your Text", styles['DS_Title']))
                content.append(Paragraph(descriptions['stv_intro'],
                                         styles['DS_Intro']))
                content.append(Spacer(1, 2*pica))

                # get the text with docuscope tags, and reformat the text for the report.
                tagged_str = corpus[text_id]

                soup = bs(tagged_str['html_content'], "html.parser")

                para_list, patterns = html_to_report_string(soup, tagged_str['dict'], patterns_all)
                for para in para_list:
                    try:
                        content.append(Paragraph(para, styles['DS_Body']))
                    except ValueError as v_err:
                        logging.error(v_err)
                        content.append(Paragraph("ERROR: ILLEGAL CHARACTERS DETECTED IN TEXT. The text will not display properly, however the analysis is not affected.", styles['DS_Body']))

                content.append(NextPageTemplate('three_column_w_header'))
                content.append(PageBreak())
                content.append(Paragraph("Patterns Used in Your Document", styles['DS_Title']))
                content.append(NextPageTemplate('one_column'))
                ranked_patterns = sort_patterns(patterns)
                for cat in categories:
                    lst = ranked_patterns.get(cat, [])
                    content.append(Paragraph(cat, styles['DS_Heading1']))
                    for pat in lst:
                        pat_ln = "{} ({})".format(pat[1], pat[0])
                        content.append(Paragraph(pat_ln, styles['DS_Pattern']))

                content.append(PageBreak())
                # add the content for each file to the large file.
                combined_content += copy.deepcopy(content)
                # create an individual PDF (pe student)
                individual_doc.build(content)
                # Uses the fullname or the filename as the name to use,
                # add and increment a postfix to prevent collisions.
                zip_file_name = f"{title}.pdf"
                i = 0
                while zip_file_name in zip_file.namelist():
                    zip_file_name = f"{title}_{i}.pdf"
                    i += 1
                zip_file.writestr(zip_file_name, fpath.getvalue())

        # ########################################
        # Create a PDF that includes all the PDF reports.
        # ########################################

        doc.build(combined_content)
        zip_file.writestr(f"_all.pdf", all_reports.getvalue())

        # ########################################
        # Create a summary of patterns in a separate PDF.
        # ########################################

        ranked_patterns = sort_patterns(patterns_all)
        #fpath = os.path.join(report_dir, "_patterns.pdf")
        with io.BytesIO() as fpath:
            patterns_doc = BaseDocTemplate(fpath, pagesize=letter,
                                           rightMargin=MARGINS["right"],
                                           leftMargin=MARGINS["left"],
                                           topMargin=MARGINS["top"],
                                           bottomMargin=MARGINS["bottom"])
            patterns_doc.addPageTemplates([three_column_hd_template, three_column_template])
            content = []
            content.append(NextPageTemplate('three_column'))
            content.append(Paragraph("Patterns Used in the Corpus", styles['DS_Title']))
            content.append(FrameBreak())
            for cat in categories:
                lst = ranked_patterns.get(cat, [])
                content.append(Paragraph(cat, styles['DS_Heading1']))
                for pat in lst:
                    pat_ln = "{} ({})".format(pat[1], pat[0])
                    content.append(Paragraph(pat_ln, styles['DS_Pattern']))

            patterns_doc.build(content)
            zip_file.writestr("_patterns.pdf", fpath.getvalue())
    zip_stream.seek(0)
    return zip_stream
