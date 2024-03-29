""" Handles /generate_reports requests. """
import copy
import io
import logging
import re
import time
import traceback
from typing import Optional
import zipfile
from collections import Counter, defaultdict
from uuid import UUID

from bs4 import BeautifulSoup

from bounded_fences import bounded_fences
from common_dictionary import COMMON_DICITONARY
from count_patterns import sort_patterns
from database import DOCUMENTS_QUERY, Submission, document_state_check, session
from ds_report import (Boxplot, Divider, add_page_number,
                       generate_paragraph_styles)
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from lat_frame import LAT_FRAME, LAT_MAP
from pandas import DataFrame, Series, merge
from pydantic import BaseModel
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import pica
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer
from reportlab.platypus.flowables import BalancedColumns
from response import ERROR_RESPONSES
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.status import (HTTP_200_OK, HTTP_400_BAD_REQUEST,
                              HTTP_500_INTERNAL_SERVER_ERROR)

router = APIRouter()


class ReportsSchema(BaseModel):
    """Schema for '/report' requests."""
    #pylint: disable=too-few-public-methods
    corpus: list[UUID]
    intro: Optional[str] = None
    stv_intro: Optional[str] = None


async def get_reports(ids: list[UUID], gintro, sintro, sql: AsyncSession):
    """Generate the report for this corpus."""
    #pylint: disable=too-many-locals,too-many-branches,too-many-statements
    course = set()
    assignment = set()
    instructor = set()
    all_pats = defaultdict(Counter)
    documents = {}
    doc_data = {}
    doc_info = {}
    result = await sql.stream(DOCUMENTS_QUERY.where(Submission.id.in_(ids)))
    async for (doc, fullname, ownedby, filename, doc_id, state,
               a_name, a_course, a_instructor) in result:
        await document_state_check(state, doc_id, filename, doc, session)
        course.add(a_course)
        instructor.add(a_instructor)
        assignment.add(a_name)
        doc_data[doc_id] = Series({key: val['num_tags'] for key, val in
                                   doc['ds_tag_dict'].items()})
        descr = Series(dtype=str)
        descr['total_words'] = doc['ds_num_word_tokens']
        descr['doc_id'] = doc_id
        descr['title'] = fullname if ownedby == 'student' and fullname \
            else '.'.join(filename.split('.')[0:-1])
        descr['ownedby'] = ownedby
        descr['dictionary_id'] = 'default'  # ds_dictionary
        descr['course_name'] = a_course
        descr['assignment_name'] = a_name
        descr['instructor_name'] = a_instructor
        doc_info[doc_id] = descr
        pats = defaultdict(Counter)
        try:
            soup = BeautifulSoup(doc['ds_output'], features="lxml")
        except Exception as exp:
            logging.error(doc['ds_output'])
            raise exp
        for tag in soup.find_all(attrs={"data-key": True}):
            lat = tag.get('data-key', None)
            categories = LAT_MAP.get(lat, None)
            if categories and categories['cluster'] != 'Other':
                cat = f"{categories['category_label']} > {categories['subcategory_label']}"
                key = ' '.join(tag.stripped_strings).lower()
                tag.attrs.clear()
                pats[cat].update([key])
                all_pats[cat].update([key])
                tag.name = 'u'  # underline text
                # add category label
                label = soup.new_tag("font", face="Helvetica", size=7)
                label.string = f" [{cat}]"
                tag.insert_after(label)
        # Clear all attributes from span's as they confuse reportlab
        for span in soup.find_all("span"):
            span.attrs.clear()
        documents[doc_id] = {
            'course': a_course,
            'instructor': a_instructor,
            'assignment': a_name,
            'patterns': sort_patterns(pats) if pats else [],
            'html': copy.copy(soup),
            'filename': filename,
            'fullname': fullname,
            'title': 'Instructor' if ownedby == 'instructor' else fullname,
            'stats': {}
        }
    stats = DataFrame(data=doc_data, dtype="Int64")
    info = DataFrame(data=doc_info)
    hdata = merge(LAT_FRAME, stats, left_on="lat",
                  right_index=True, how="outer")
    hdata['lat'] = hdata['lat'].astype("string")  # fix typeing from merge
    docs = range(8, len(hdata.columns))
    cstats = hdata.iloc[:, [2, *docs]].groupby('subcategory').sum()
    nstats = cstats / info.loc['total_words'].astype('Int64')
    nstats = nstats.fillna(0)
    for key, val in nstats.to_dict().items():
        documents[key]['stats'] = val
    quants = nstats.transpose().quantile(q=[0, 0.25, 0.5, 0.75, 1])
    upper_inner_fence, lower_inner_fence = bounded_fences(quants)
    mins = quants.loc[0]
    q1s = quants.loc[0.25]
    q2s = quants.loc[0.5]
    q3s = quants.loc[0.75]
    maxs = quants.loc[1]
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
                    Paragraph(f"<b>{docu['course']}</b>",
                              styles['DS_MetaData']),
                    Paragraph(
                        f"Assignment: {docu['assignment']}", styles['DS_MetaData']),
                    Spacer(1, pica),
                    Paragraph(
                        f"Report for {docu['fullname']}", styles['DS_Student']),
                    Divider(idoc.width),
                    Paragraph(gintro, styles['DS_Intro']),
                    Spacer(1, pica)
                ]

                # for each category: category_label, description, boxplot
                for category in COMMON_DICITONARY.categories:
                    for subcategory in category.subcategories:
                        index_name = subcategory.name or subcategory.label
                        content.extend([
                            Paragraph(f"{category.label} > {subcategory.label}",
                                      styles['DS_Heading1']),
                            Paragraph(category.help, styles['DS_Help']),
                            Boxplot({
                                'q1': q1s.at[index_name],
                                'q2': q2s.at[index_name],
                                'q3': q3s.at[index_name],
                                'min': mins.at[index_name],
                                'max': maxs.at[index_name],
                                'uifence': upper_inner_fence.at[index_name],
                                'lifence': lower_inner_fence.at[index_name]},
                                val=docu['stats'][index_name],
                                max_val=max_val)
                        ])

                # Tagged text
                content.extend([
                    PageBreak(),
                    Paragraph(
                        f"Your Text ({docu['filename']})", styles['DS_Title']),
                    Paragraph(sintro, styles['DS_Intro']),
                    Spacer(1, 2*pica)
                ])
                for para in docu['html'].find_all("p"):
                    # could do it all at once, but looping prints more text.
                    try:
                        content.append(
                            Paragraph(str(para), styles['DS_Body']))
                    except ValueError as v_err:
                        logging.error(v_err)
                        content.append(Paragraph("""ERROR: ILLEGAL CHARACTERS DETECTED IN TEXT.
The text will not display properly, however the analysis is not affected.""",
                                                 styles['DS_Body']))
                pattern_content = []
                for category in docu['patterns']:
                    pattern_content.append(Paragraph(category['category'],
                                                     styles['DS_Heading1']))
                    pattern_content.extend([
                        Paragraph(f"{pat['pattern']} ({pat['count']})",
                                  styles['DS_Pattern'])
                        for pat in category['patterns']])
                content.extend([
                    PageBreak(),
                    Paragraph("Patterns Used in Your Document",
                              styles['DS_Title']),
                    BalancedColumns(pattern_content, nCols=3, endSlack=0.5),
                ])
                combined_content += copy.deepcopy(content)
                combined_content.append(PageBreak())
                idoc.build(content)
                title = docu['title'] + '-' + \
                    '_'.join(docu['filename'].split('.')[0:-1])
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
                pattern_content.append(
                    Paragraph(category['category'], styles['DS_Heading1']))
                pattern_content.extend([Paragraph(f"{pat['pattern']} ({pat['count']})",
                                                  styles['DS_Pattern'])
                                        for pat in category['patterns']])
            patterns_doc.build([
                Paragraph('Patterns Used in the Corpus',
                          styles['DS_Title']),
                BalancedColumns(pattern_content, nCols=3, endSlack=0.5)
            ], onFirstPage=add_page_number, onLaterPages=add_page_number)
            zip_file.writestr("_patterns.pdf", patfile.getvalue())
    zip_stream.seek(0)
    return zip_stream


@router.post('/generate_reports',
             # response_class=StreamingResponse,
             responses={
                 **ERROR_RESPONSES,
                 HTTP_200_OK: {
                     "content": {"application/zip": {}},
                     "description": "Return the zip archive of reports."
                 }
             })
async def generate_reports(corpus: ReportsSchema,
                           db_session: AsyncSession = Depends(session)):
    """Responds to generate_reports requests by streaming the report zipfile."""
    if not corpus.corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    logging.info("Generate reports for %s", corpus.corpus)
    try:
        zip_buffer = await get_reports(corpus.corpus,
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
