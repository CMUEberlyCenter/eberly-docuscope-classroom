""" Handles /generate_reports requests. """
import copy
import io
import logging
import re
import time
import traceback
import zipfile
from collections import Counter, defaultdict
from typing import List
from uuid import UUID

from common_dictionary import COMMON_DICITONARY
from count_patterns import sort_patterns
from ds_db import Assignment, Filesystem
from ds_report import Boxplot, Divider, addPageNumber, generate_paragraph_styles
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from lat_frame import LAT_FRAME, LAT_MAP
from lxml import etree
from pandas import DataFrame, Series, concat, merge
from pydantic import BaseModel
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import pica
from reportlab.platypus import (FrameBreak, KeepTogether, PageBreak, Paragraph,
                                SimpleDocTemplate, Spacer)
from reportlab.platypus.flowables import BalancedColumns
from response import ERROR_RESPONSES
from sqlalchemy.orm import Session
from starlette.status import (HTTP_200_OK, HTTP_400_BAD_REQUEST,
                              HTTP_500_INTERNAL_SERVER_ERROR)
from util import document_state_check, get_db_session

router = APIRouter()

class ReportsSchema(BaseModel):
    """Schema for '/report' requests."""
    #pylint: disable=too-few-public-methods
    corpus: List[UUID] = ...
    intro: str = None
    stv_intro: str = None

def get_reports(ids: List[UUID], gintro, sintro, db_session: Session):
    """Generate the report for this corpus."""
    logging.info("Generate reports for %s", ids)
    course = set()
    assignment = set()
    instructor = set()
    all_pats = defaultdict(Counter)
    documents = {}
    doc_data = {}
    doc_info = {}
    for doc, fullname, ownedby, filename, doc_id, state, a_name, a_course, a_instructor in \
        db_session.query(Filesystem.processed,
                         Filesystem.fullname,
                         Filesystem.ownedby,
                         Filesystem.name,
                         Filesystem.id,
                         Filesystem.state,
                         Assignment.name,
                         Assignment.course,
                         Assignment.instructor)\
                  .filter(Filesystem.id.in_(ids))\
                  .filter(Assignment.id == Filesystem.assignment):
        document_state_check(state, doc_id, filename, doc, db_session)
        course.add(a_course)
        instructor.add(a_instructor)
        assignment.add(a_name)
        doc_data[doc_id] = Series({key: val['num_tags'] for key, val in
                                   doc['ds_tag_dict'].items()})
        desc = Series()
        desc['total_words'] = doc['ds_num_word_tokens']
        desc['doc_id'] = doc_id
        desc['title'] = fullname if ownedby == 'student' and fullname \
            else '.'.join(filename.split('.')[0:-1])
        desc['ownedby'] = ownedby
        desc['dictionary_id'] = 'default' #ds_dictionary
        desc['course_name'] = a_course
        desc['assignment_name'] = a_name
        desc['instructor_name'] = a_instructor
        doc_info[doc_id] = desc
        html_content = re.sub(r'(\n|\s)+', ' ', doc['ds_output'])
        html = '<body><para>' + re.sub(r"<span[^>]*>\s*PZPZPZ\s*</span>",
                                       "</para><para>", html_content) + "</para></body>"
        pats = defaultdict(Counter)
        try:
            etr = etree.fromstring(html)
        except Exception as exp:
            logging.error(html)
            raise exp
        for tag in etr.iterfind(".//*[@data-key]"):
            lat = tag.get('data-key')
            categories = LAT_MAP[lat]
            if categories:
                if categories['cluster'] != 'Other':
                    cat = categories['category_label']
                    key = ' '.join(tag.xpath('string()').split()).lower()
                    #tag.text = key
                    tag.attrib.clear()
                    #for child in list(tag):
                    #    tag.remove(child)
                    pats[cat].update([key])
                    all_pats[cat].update([key])
                    parent = tag.getparent()
                    tag.tag = 'u' # underline text
                    # add category label
                    parent.insert(parent.index(tag)+1,
                                  etree.XML(f'<font face="Helvetica" size="7"> [{cat}]</font>'))
        for span in etr.iter("span"):
            span.attrib.clear()
        #all_pats.update(pats)
        documents[doc_id] = {
            'course': a_course,
            'instructor': a_instructor,
            'assignment': a_name,
            'patterns': sort_patterns(pats) if pats else [],
            'html': etr,
            'filename': filename,
            'fullname': fullname,
            'title': 'Instructor' if ownedby=='instructor' else fullname,
            'stats': {}
        }
    stats = DataFrame(data=doc_data, dtype="Int64")
    info = DataFrame(data=doc_info)
    hdata = merge(LAT_FRAME, stats, left_on="lat", right_index=True, how="outer")
    hdata['lat'] = hdata['lat'].astype("string") # fix typeing from merge
    docs = range(8, len(hdata.columns))
    cstats = hdata.iloc[:, [1, *docs]].groupby('category_label').sum()
    nstats = cstats / info.loc['total_words'].astype('Int64')
    nstats = nstats.fillna(0)
    for key, val in nstats.to_dict().items():
        documents[key]['stats'] = val
    quants = nstats.transpose().quantile(q=[0, 0.25, 0.5, 0.75, 1])
    mins = quants.loc[0]
    q1s = quants.loc[0.25]
    q2s = quants.loc[0.5]
    q3s = quants.loc[0.75]
    maxs = quants.loc[1]
    iqr = quants.loc[0.75] - quants.loc[0.25]
    upper_inner_fence = quants.loc[0.75] + 1.5 * iqr
    upper_inner_fence = upper_inner_fence.clip(lower=mins, upper=maxs)
    lower_inner_fence = quants.loc[0.25] - 1.5 * iqr
    lower_inner_fence = lower_inner_fence.clip(lower=mins, upper=maxs)

    max_val = maxs.max()

    styles = generate_paragraph_styles()
    zip_stream = io.BytesIO()
    with zipfile.ZipFile(zip_stream, 'w') as zip_file, \
         io.BytesIO() as all_reports:
        combined_content = [
            Paragraph(f"created:       {time.ctime()}", styles['DS_Date']),
            Spacer(1, pica),
            Paragraph("<b>DocuScope Report</b>", styles['DS_CoverText']),
            Spacer(1, 6)
        ]
        if len(instructor) > 0:
            combined_content.append(Paragraph(
                f"<b>Instructor:</b>    {', '.join(instructor)}",
                styles['DS_CoverText']))
        if len(course) > 0:
            combined_content.append(Paragraph(
                f"<b>Course:</b>        {', '.join(course)}",
                styles['DS_CoverText']))
        if len(assignment) > 0:
            combined_content.append(Paragraph(
                f"<b>Assignment:</b>    {', '.join(assignment)}",
                styles['DS_CoverText']))
        combined_content.append(PageBreak())

        for docu in documents.values():
            with io.BytesIO() as fpath:
                idoc = SimpleDocTemplate(fpath, pagesize=letter,
                                         title=f"Report for {docu['fullname']}",
                                         creator='DocuScope@CMU')
                content = [
                    Paragraph(f"<b>{docu['course']}</b>", styles['DS_MetaData']),
                    Paragraph(f"Assignment: {docu['assignment']}", styles['DS_MetaData']),
                    Spacer(1, pica),
                    Paragraph(f"Report for {docu['fullname']}", styles['DS_Student']),
                    Divider(idoc.width),
                    Paragraph(gintro, styles['DS_Intro']),
                    Spacer(1, pica)
                ]

                # for each category: category_label, description, boxplot
                for category in COMMON_DICITONARY.categories:
                    category_name = category.name or category.label
                    content.extend([
                        Paragraph(category.label, styles['DS_Heading1']),
                        Paragraph(category.help, styles['DS_Help']),
                        Boxplot({
                            'q1': q1s.at[category_name],
                            'q2': q2s.at[category_name],
                            'q3': q3s.at[category_name],
                            'min': mins.at[category_name],
                            'max': maxs.at[category_name],
                            'uifence': upper_inner_fence.at[category_name],
                            'lifence': lower_inner_fence.at[category_name]
                        },
                        val=docu['stats'][category_name],
                        max_val=max_val)
                    ])

                # Tagged text
                content.extend([
                    PageBreak(),
                    Paragraph(f"Your Text ({docu['filename']})", styles['DS_Title']),
                    Paragraph(sintro, styles['DS_Intro']),
                    Spacer(1, 2*pica)
                ])
                for para in docu['html']:
                    # could do it all at once, but looping prints more text.
                    try:
                        content.append(Paragraph(etree.tostring(para), styles['DS_Body']))
                    except ValueError as v_err:
                        logging.error(v_err)
                        content.append(Paragraph("""ERROR: ILLEGAL CHARACTERS DETECTED IN TEXT.
The text will not display properly, however the analysis is not affected.""",
                                                 styles['DS_Body']))
                pattern_content = []
                for category in docu['patterns']:
                    pattern_content.append(Paragraph(category['category'], styles['DS_Heading1']))
                    pattern_content.extend([Paragraph(f"{pat['pattern']} ({pat['count']})", styles['DS_Pattern']) for pat in category['patterns']])
                content.extend([
                    PageBreak(),
                    Paragraph("Patterns Used in Your Document",
                              styles['DS_Title']),
                    BalancedColumns(pattern_content, nCols=3, endSlack=0.5),
                ])
                combined_content += copy.deepcopy(content)
                idoc.build(content)
                title = docu['title'] + '-' + '_'.join(docu['filename'].split('.')[0:-1])
                title = re.sub(r'[/\.]', '_', title.strip())
                zip_file_name = f"{title}.pdf"
                i = 0
                while zip_file_name in zip_file.namelist():
                    zip_file_name = f"{title}_{i}.pdf"
                    i += 1
                zip_file.writestr(zip_file_name, fpath.getvalue())
        # Combined pdf
        all_docs = SimpleDocTemplate(all_reports, pagesize=letter,
                                     title='Reports',
                                     creator='DocuScope@CMU')
        all_docs.build(combined_content)
        zip_file.writestr("_all.pdf", all_reports.getvalue())
        # Patterns summary file
        with io.BytesIO() as patfile:
            patterns_doc = SimpleDocTemplate(patfile, pagesize=letter,
                                             title='Patterns Used in the Corpus',
                                             create='DocuScope@CMU')
            pattern_content = []
            for category in sort_patterns(all_pats):
                pattern_content.append(Paragraph(category['category'], styles['DS_Heading1']))
                pattern_content.extend([Paragraph(f"{pat['pattern']} ({pat['count']})",
                                                  styles['DS_Pattern'])
                                        for pat in category['patterns']])
            patterns_doc.build([
                Paragraph('Patterns Used in the Corpus',
                          styles['DS_Title']),
                BalancedColumns(pattern_content, nCols=3, endSlack=0.5)
            ], onFirstPage=addPageNumber, onLaterPages=addPageNumber)
            zip_file.writestr("_patterns.pdf", patfile.getvalue())
    zip_stream.seek(0)
    return zip_stream

@router.post('/generate_reports',
             #response_class=StreamingResponse,
             responses={
                 **ERROR_RESPONSES,
                 HTTP_200_OK: {
                     "content": {"application/zip": {}},
                     "description": "Return the zip archive of reports."
                 }
             })
async def generate_reports(corpus: ReportsSchema,
                           db_session: Session = Depends(get_db_session)):
    """Responds to generate_reports requests by streaming the report zipfile."""
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    #if corpus.level is not LevelEnum.cluster:
    #    logging.warning("Level is not Cluster, resetting.")
    #    corpus.level = LevelEnum.cluster
    try:
        zip_buffer = get_reports(corpus.corpus,
                                 corpus.intro,
                                 corpus.stv_intro,
                                 db_session)
    except Exception as excp:
        logging.error("%s\n%s", corpus.corpus, excp)
        traceback.print_exc()
        raise HTTPException(
            detail="ERROR in report generation.",
            status_code=HTTP_500_INTERNAL_SERVER_ERROR) from excp
    return StreamingResponse(zip_buffer, media_type='application/zip',
                             headers={'Content-Disposition':
                                      "attachment; filename='report.zip'"})
