"""The database schemas for the docuscope database."""
#from sqlalchemy.orm import relationship, backref
#from create_app import db
from contextlib import contextmanager
from flask import current_app
from sqlalchemy import VARBINARY, Column, Enum, Integer, JSON, \
    LargeBinary, SmallInteger, String, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base

#db = SQLAlchemy(current_app)
#db.Model.metadata.reflect(db.get_engine(app=current_app))

TINY_TEXT = String(255)
UUID = VARBINARY(16)
BASE = declarative_base()

class Filesystem(BASE): #pylint: disable=R0903
    """The filesystem table in the docuscope database."""
    __tablename__ = 'filesystem'

    id = Column(UUID, primary_key=True)
    name = Column(TINY_TEXT)
    assignment = Column(Integer)
    owner = Column(TINY_TEXT)
    created = Column(TIMESTAMP)
    fullname = Column(TINY_TEXT)
    state = Column(Enum('pending', 'subitted', 'tagged', 'error'))
    ownedby = Column(Enum('student', 'instructor'))
    content = Column(LargeBinary)
    processed = Column(JSON)
    pdf = Column(LargeBinary)

    def __repr__(self):
        return "<File(id='{}', state='{}', assignment='{}'>"\
            .format(self.id, self.state, self.assignment)

class DSDictionary(BASE): #pylint: disable=R0903
    """The valid dictionaries in the docuscope database."""
    __tablename__ = 'dictionaries'
    id = Column(SmallInteger, primary_key=True)
    name = Column(TINY_TEXT)
    class_info = Column(JSON)

    def __repr__(self):
        return "<DS_Dictionary(name='{}')>".format(self.name)

class Assignment(BASE): #pylint: disable=R0903
    """The assignments table in the docuscope database."""
    __tablename__ = 'assignments'

    id = Column(Integer, primary_key=True)
    oli_id = Column(VARBINARY(20))
    dictionary = Column(SmallInteger)
    name = Column(TINY_TEXT)
    course = Column(TINY_TEXT)
    instructor = Column(TINY_TEXT)

    def __repr__(self):
        return "<Assignment(id='{}', name='{}', dictionary='{}', "\
            .format(self.id, self.name, self.dictionary)

@contextmanager
def session_scope():
    """Provide a transactional scope around a series of operations."""
    session = current_app.Session()
    try:
        yield session
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()
