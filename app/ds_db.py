"""The database schemas for the docuscope database."""
#from sqlalchemy.orm import relationship, backref
#from create_app import db
from contextlib import contextmanager
from flask import current_app
from sqlalchemy import Column, String
from sqlalchemy.ext.declarative import declarative_base

#db = SQLAlchemy(current_app)
#db.Model.metadata.reflect(db.get_engine(app=current_app))

BASE = declarative_base()

class Filesystem(BASE): #pylint: disable=R0903
    """The filesystem table in the docuscope database."""
    __tablename__ = 'filesystem'
    id = Column(String(40), primary_key=True)
    name = Column(String(200))
    assignment = Column(String(50))
    owner = Column(String(100))
    created = Column(String(50))
    createdraw = Column(String(50))
    size = Column(String(50))
    type = Column(String(50))
    course = Column(String(100))
    fullname = Column(String(100))
    state = Column(String(5)) #ENUM
    ownedby = Column(String(5))
    json = Column(String) #BLOB
    processed = Column(String) #JSON
    pdf = Column(String) #BLOB

    def __repr__(self):
        return "<File(id='{}', state='{}', assignment='{}'>"\
            .format(self.id, self.state, self.assignment)

class DSDictionary(BASE): #pylint: disable=R0903
    """The valid dictionaries in the docuscope database."""
    __tablename__ = 'dictionaries'
    name = Column(String(50), primary_key=True)
    def __repr__(self):
        return "<DS_Dictionary(name='{}')>".format(self.name)

class Assignment(BASE): #pylint: disable=R0903
    """The assignments table in the docuscope database."""
    __tablename__ = 'assignments'
    id = Column(String(50), primary_key=True)
    dictionary = Column(String(50))
    name = Column(String(150))
    course = Column(String(150))
    instructor = Column(String(150))
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
