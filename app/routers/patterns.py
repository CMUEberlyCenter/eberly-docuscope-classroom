""" Handles /patterns requests. """
from collections import Counter, defaultdict
from uuid import UUID

from count_patterns import CategoryPatternData, count_patterns, sort_patterns
from database import Submission, document_state_check, session
from fastapi import APIRouter, Depends, HTTPException
from lxml import etree  # nosec
from response import ERROR_RESPONSES
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.status import HTTP_400_BAD_REQUEST

router = APIRouter()

@router.post('/patterns', response_model=list[CategoryPatternData],
             responses=ERROR_RESPONSES)
async def patterns(corpus: list[UUID],
             sql: AsyncSession = Depends(session)):
    """Generate the list of categorized patterns in the given corpus."""
    if not corpus:
        raise HTTPException(detail="No documents specified.",
                            status_code=HTTP_400_BAD_REQUEST)
    pats = defaultdict(Counter)
    parser = etree.XMLParser(load_dtd=False, no_network=True, remove_pis=True,
                             resolve_entities=False)
    result = await sql.stream(
        select(Submission.id,
               Submission.processed,
               Submission.name,
               Submission.state))
    async for (uuid, doc, filename, status) in result:
        await document_state_check(status, uuid, filename, doc, sql)
        if doc and doc['ds_tag_dict']:
            etr = etree.fromstring(f"<body>{doc['ds_output']}</body>", parser) # nosec
            count_patterns(etr, pats)
    return sort_patterns(pats)
