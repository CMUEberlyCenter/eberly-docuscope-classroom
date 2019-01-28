"""The database schemas for the docuscope database."""
#from sqlalchemy.orm import relationship, backref
from create_app import db

#db = SQLAlchemy(current_app)
#db.Model.metadata.reflect(db.get_engine(app=current_app))

Base = db.Model
TinyText = db.String(255)
UUID = db.BINARY(16)

class Filesystem(Base):
    """The filesystem table in the docuscope database."""
    __tablename__ = 'filesystem'
    id = db.Column(UUID, primary_key=True)
    name = db.Column(TinyText)
    assignment = db.Column(UUID)
    owner = db.Column(TinyText)
    created = db.Column(db.TIMESTAMP)
    fullname = db.Column(TinyText)
    state = db.Column(db.Enum('pending', 'subitted', 'tagged', 'error'))
    ownedby = db.Column(db.Enum('student', 'instructor'))
    content = db.Column(db.LargeBinary)
    processed = db.Column(db.JSON)
    pdf = db.Column(db.LargeBinary)

    def __repr__(self):
        return "<File(id='{}', state='{}', assignment='{}'>"\
            .format(self.id, self.state, self.assignment)

class DSDictionary(Base):
    """The valid dictionaries in the docuscope database."""
    __tablename__ = 'dictionaries'
    id = db.Column(db.SmallInteger, primary_key=True)
    name = db.Column(TinyText)
    def __repr__(self):
        return "<DS_Dictionary(name='{}')>".format(self.name)

class Assignment(Base):
    """The assignments table in the docuscope database."""
    __tablename__ = 'assignments'
    id = db.Column(UUID, primary_key=True)
    dictionary = db.Column(db.SmallInteger)
    name = db.Column(TinyText)
    course = db.Column(TinyText)
    instructor = db.Column(TinyText)
    def __repr__(self):
        return "<Assignment(id='{}', name='{}', dictionary='{}', "\
            .format(self.id, self.name, self.dictionary)
