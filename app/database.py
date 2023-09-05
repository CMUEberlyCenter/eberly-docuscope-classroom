"""Schemas for the SQL DocuScope sidecar database."""
from datetime import datetime
import logging
from typing import Annotated, Literal, Optional
import uuid
from fastapi import HTTPException
from pandas import DataFrame, Series

from sqlalchemy import (JSON, VARBINARY, ForeignKey,
                        SmallInteger, String, func, select)
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import (DeclarativeBase, relationship, sessionmaker,
                            MappedAsDataclass, Mapped, mapped_column)
from sqlalchemy.types import TypeDecorator
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR, HTTP_503_SERVICE_UNAVAILABLE

from default_settings import SQLALCHEMY_DATABASE_URI

# Setup database sesson manager
ENGINE = create_async_engine(SQLALCHEMY_DATABASE_URI)
# pool_pre_ping=True,
# pool_recycle=3600)
SESSION = sessionmaker(bind=ENGINE, expire_on_commit=False,
                       class_=AsyncSession, future=True)


async def session() -> AsyncSession:
    """Establish a scoped session for accessing the database."""
    my_session: AsyncSession = SESSION()
    try:
        yield my_session
        await my_session.commit()
    except:
        await my_session.rollback()
        raise
    finally:
        await my_session.close()

TINY_TEXT = String(255)
TinyText = Annotated[str, mapped_column(TINY_TEXT)]

class UUID(TypeDecorator): # pylint: disable=too-many-ancestors
    """A sqlalchemy type for handling UUIDs stored as bytes."""
    # pylint: disable=W0223
    impl = VARBINARY(16)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        """When binding the parameter, convert to bytes."""
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            if isinstance(value, str):
                return uuid.UUID(value).bytes
            if isinstance(value, bytes):
                return uuid.UUID(bytes=value).bytes
            return uuid.UUID(value).bytes
        return value.bytes

    def process_result_value(self, value, dialect):
        """When processing results, convert to UUID."""
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            value = uuid.UUID(bytes=value)
        return value

# pylint: disable=too-few-public-methods


class Base(MappedAsDataclass, DeclarativeBase):
    """Base declarative dataclass for database tables."""


SubmissionState = Literal['pending', 'submitted', 'tagged', 'error']
OwnerRole = Literal['student', 'instructor']


class Submission(Base):
    """The filesystem table in the docuscope database."""
    __tablename__ = 'filesystem'

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True)
    name: Mapped[TinyText]
    assignment: Mapped[int] = mapped_column(ForeignKey("assignments.id"))
    Assignment: Mapped["Assignment"] = relationship()
    owner: Mapped[TinyText]
    created: Mapped[datetime]  # = mapped_column(TIMESTAMP)
    fullname: Mapped[TinyText]
    state: Mapped[SubmissionState]
    ownedby: Mapped[OwnerRole]
    content: Mapped[bytes]  # = mapped_column(LargeBinary)
    processed = mapped_column(JSON)
    pdf: Mapped[bytes]  # = mapped_column(LargeBinary)

    def __repr__(self):
        return f"<File(id='{self.id}', state='{self.state}'>"

# depricate this
class DSDictionary(Base):  # pylint: disable=too-few-public-methods
    """A table of valid DocuScope dictionaries."""
    __tablename__ = 'dictionaries'

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    name: Mapped[TinyText]
    class_info = mapped_column(JSON)
    enabled: Mapped[bool]

    def __repr__(self):
        return f"<DS_Dictionary(name='{self.name}')>"


class Assignment(Base):  # pylint: disable=too-few-public-methods
    """The assignments table in the docuscope database."""
    __tablename__ = 'assignments'

    id: Mapped[int] = mapped_column(primary_key=True)
    oli_id = mapped_column(VARBINARY(20))
    dictionary: Mapped[Optional[int]] = mapped_column(
        ForeignKey("dictionaries.id"))
    Dictionary: Mapped[Optional["DSDictionary"]] = relationship()
    name: Mapped[TinyText]
    course: Mapped[TinyText]
    instructor: Mapped[TinyText]
    showmodel: Mapped[bool]
    showstudent: Mapped[bool]
    report_introduction: Mapped[str]
    report_stv_introduction: Mapped[str]

    def __repr__(self):
        return f"<Assignment(id='{self.id}', name='{self.name}', "\
            f"dictionary='{self.oli_id}', "


async def queue_length(sql: AsyncSession):
    """ Returns the number of documents that are yet to be tagged. """
    result = await sql.execute(
        select(func.count(Submission.id)) # pylint: disable=not-callable
        .execution_options(populate_existing=True)
        .where(Submission.state.in_(['pending', 'submitted'])))
    untagged = result.scalar_one_or_none() or 0
    return untagged


async def document_state_check(
        status: str, doc_id: UUID, filename: str, doc: str,
        db_session: AsyncSession):
    """ Raises HTTPExceptions when the status is problematic. """
    logging.debug('%s, %s, %s', status, doc_id, filename)
    if status == 'error':
        logging.error("Aborting: error in %s (%s): %s", doc_id, filename, doc)
        raise HTTPException(
            detail=f"There was an error while tagging {filename}",
            status_code=HTTP_500_INTERNAL_SERVER_ERROR)
    if status != 'tagged':
        queue = await queue_length(db_session)
        logging.error("Aborting: %s (%s) has state %s, queue: %s",
                      doc_id, filename, status, queue)
        raise HTTPException(
            detail=(f"{filename} is not yet tagged (state: {status})"
                    f" and should be available soon."
                    f" There are {queue} documents queued for tagging."
                    f" Try reloading this page after waiting a bit."
                    f" Contact technical support if this message persists"
                    f" for more than five minutes."),
            status_code=HTTP_503_SERVICE_UNAVAILABLE)
    if not doc:
        logging.error("No tagging data for %s (%s)", filename, doc_id)
        raise HTTPException(
            detail=f"No tagging data for {filename}",
            status_code=HTTP_500_INTERNAL_SERVER_ERROR)
    if doc['ds_num_word_tokens'] == 0:
        logging.error(
            "Invalid documenxt, no content for %s (%s)", filename, doc_id)
        raise HTTPException(
            detail=f"Tagger failed to parse {filename}",
            status_code=HTTP_500_INTERNAL_SERVER_ERROR)


DOCUMENTS_QUERY = select(Submission.processed,
                         Submission.fullname,
                         Submission.ownedby,
                         Submission.name,
                         Submission.id,
                         Submission.state,
                         Assignment.name,
                         Assignment.course,
                         Assignment.instructor)\
    .where(Assignment.id == Submission.assignment)


async def get_documents(
        documents: list[UUID],
        sql: AsyncSession) -> tuple[DataFrame, DataFrame]:
    """ Retrieve the documents and preprocess each one. """
    docs = {}
    info = {}
    result = await sql.stream(DOCUMENTS_QUERY.where(Submission.id.in_(documents)))
    async for (doc, fullname, ownedby, filename, doc_id,
               state, a_name, a_course, a_instructor) in result:
        await document_state_check(state, doc_id, filename, doc, sql)
        docs[doc_id] = Series({key: val['num_tags'] for key, val in
                               doc['ds_tag_dict'].items()})
        info[doc_id] = Series({
            'total_words': doc['ds_num_word_tokens'],
            'doc_id': doc_id,
            'title': fullname if ownedby == 'student' and fullname
            else '.'.join(filename.split('.')[0:-1]),
            'ownedby': ownedby,
            'dictionary_id': 'default',  # ds_dictionary
            'course_name': a_course,
            'assignment_name': a_name,
            'instructor_name': a_instructor
        })
    return DataFrame(data=docs, dtype="Int64"), DataFrame(data=info)
