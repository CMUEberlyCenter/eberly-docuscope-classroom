"""Schemas for the SQL DocuScope sidecar database."""
import logging
import uuid
from fastapi import HTTPException
from pandas import DataFrame, Series

from sqlalchemy import (JSON, TIMESTAMP, VARBINARY, Boolean, Column, Enum,
                        ForeignKey, Integer, LargeBinary, SmallInteger, String, func, select)
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
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

BASE = declarative_base()
TINY_TEXT = String(255)


class UUID(TypeDecorator):
    """A sqlalchemy type for handling UUIDs stored as bytes."""
    #pylint: disable=W0223
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


class Submission(BASE):  # pylint: disable=R0903
    """The filesystem table in the docuscope database."""
    __tablename__ = 'filesystem'

    id = Column(UUID, primary_key=True)
    name = Column(TINY_TEXT)
    assignment = Column(Integer, ForeignKey("assignments.id"))
    Assignment = relationship("Assignment")
    owner = Column(TINY_TEXT)
    created = Column(TIMESTAMP)
    fullname = Column(TINY_TEXT)
    state = Column(Enum('pending', 'submitted', 'tagged', 'error'))
    ownedby = Column(Enum('student', 'instructor'))
    content = Column(LargeBinary)
    processed = Column(JSON)
    pdf = Column(LargeBinary)

    def __repr__(self):
        return f"<File(id='{self.id}', state='{self.state}'>"

# depricate this


class DSDictionary(BASE):  # pylint: disable=R0903
    """The valid dictionaries in the docuscope database."""
    __tablename__ = 'dictionaries'

    id = Column(SmallInteger, primary_key=True)
    name = Column(TINY_TEXT)
    class_info = Column(JSON)
    enabled = Column(Boolean)

    def __repr__(self):
        return f"<DS_Dictionary(name='{self.name}')>"


class Assignment(BASE):  # pylint: disable=R0903
    """The assignments table in the docuscope database."""
    __tablename__ = 'assignments'

    id = Column(Integer, primary_key=True)
    oli_id = Column(VARBINARY(20))
    #dictionary = Column(SmallInteger, ForeignKey("dictionaries.id"))
    #Dictionary = relationship("DSDictionary")
    name = Column(TINY_TEXT)
    course = Column(TINY_TEXT)
    instructor = Column(TINY_TEXT)
    showmodel = Column(Boolean)
    report_introduction = Column(String)
    report_stv_introduction = Column(String)

    def __repr__(self):
        return f"<Assignment(id='{self.id}', name='{self.name}', "\
            f"dictionary='{self.oli_id}', "


async def get_ds_info(ds_dict: str, session: AsyncSession):
    """Get the dictionary of DocuScope Dictionary information."""
    query = await session.execute(select(DSDictionary.class_info).where(DSDictionary.name == ds_dict, DSDictionary.enabled))
    return query.first()
    # return db_session\
    #    .query(DSDictionary.class_info)\
    #    .filter(DSDictionary.name == ds_dict, DSDictionary.enabled)\
    #    .one_or_none()[0]


async def queue_length(session: AsyncSession):
    """ Returns the number of documents that are yet to be tagged. """
    result = await session.execute(select(func.count(Submission.id)).execution_options(populate_existing=True).where(Submission.state.in_(['pending', 'submitted'])))
    (untagged,) = result.first() or (0,)
    return untagged

    # return db_session.query(Submission.id, Submission.state)\
    #                 .filter(Submission.state.in_(['pending', 'submitted']))\
    #                 .count()


async def document_state_check(status: str, uuid: UUID, filename: str, doc: str,
                               db_session: AsyncSession):
    """ Raises HTTPExceptions when the status is problematic. """
    logging.debug('%s, %s, %s', status, uuid, filename)
    if status == 'error':
        logging.error("Aborting: error in %s (%s): %s", uuid, filename, doc)
        raise HTTPException(
            detail=f"There was an error while tagging {filename}",
            status_code=HTTP_500_INTERNAL_SERVER_ERROR)
    if status != 'tagged':
        queue = await queue_length(db_session)
        logging.error("Aborting: %s (%s) has state %s, queue: %s",
                      uuid, filename, status, queue)
        raise HTTPException(
            detail=(f"{filename} is not yet tagged (state: {status})"
                    f" and should be available soon."
                    f" There are {queue} documents queued for tagging."
                    f" Try reloading this page after waiting a bit."
                    f" Contact technical support if this message persists"
                    f" for more than five minutes."),
            status_code=HTTP_503_SERVICE_UNAVAILABLE)
    if not doc:
        logging.error("No tagging data for %s (%s)", filename, uuid)
        raise HTTPException(
            detail=f"No tagging data for {filename}",
            status_code=HTTP_500_INTERNAL_SERVER_ERROR)
    if doc['ds_num_word_tokens'] == 0:
        logging.error(
            "Invalid documenxt, no content for %s (%s)", filename, uuid)
        raise HTTPException(
            detail=f"Tagger failed to parse {filename}",
            status_code=HTTP_500_INTERNAL_SERVER_ERROR)


async def get_documents(documents: list[UUID], session: AsyncSession) -> tuple[DataFrame, DataFrame]:
    """ Retrieve the documents and preprocess each one. """
    docs = {}
    info = {}
    result = await session.stream(
        select(Submission.processed,
               Submission.fullname,
               Submission.ownedby,
               Submission.name,
               Submission.id,
               Submission.state,
               Assignment.name,
               Assignment.course,
               Assignment.instructor)
        .where(Submission.id.in_(documents))
        .where(Assignment.id == Submission.assignment))
    async for row in result:
        (doc, fullname, ownedby, filename, doc_id,
         state, a_name, a_course, a_instructor) = row
        await document_state_check(state, doc_id, filename, doc, session)
        docs[doc_id] = Series({key: val['num_tags'] for key, val in
                               doc['ds_tag_dict'].items()})
        desc = Series(dtype='float64')
        desc['total_words'] = doc['ds_num_word_tokens']
        desc['doc_id'] = doc_id
        desc['title'] = fullname if ownedby == 'student' and fullname \
            else '.'.join(filename.split('.')[0:-1])
        desc['ownedby'] = ownedby
        desc['dictionary_id'] = 'default'  # ds_dictionary
        desc['course_name'] = a_course
        desc['assignment_name'] = a_name
        desc['instructor_name'] = a_instructor
        info[doc_id] = desc
    return DataFrame(data=docs, dtype="Int64"), DataFrame(data=info)
