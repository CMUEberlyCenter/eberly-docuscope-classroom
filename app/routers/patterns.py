""" Handles /patterns requests. """
from collections import Counter, defaultdict
import logging
from uuid import UUID

from bs4 import BeautifulSoup

from count_patterns import CategoryPatternData, count_patterns, sort_patterns
from database import Submission, document_state_check, session
from fastapi import APIRouter, Depends, HTTPException
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
    result = await sql.stream(
        select(Submission.id,
               Submission.processed,
               Submission.name,
               Submission.state))
    async for (uuid, doc, filename, status) in result:
        await document_state_check(status, uuid, filename, doc, sql)
        if doc and doc['ds_tag_dict']:
            try:
                soup = BeautifulSoup(
                    f"<body>{doc['ds_output']}</body>", features="lxml")
            except Exception as exp:
                logging.error("%s (%s): %s", uuid, filename, doc['ds_output'])
                logging.error(exp)
                raise HTTPException(detail="Unparsable tagged text.",
                                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR) from exp
            count_patterns(soup, pats)
    return sort_patterns(pats)
