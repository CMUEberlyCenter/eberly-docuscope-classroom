from create_app import db
from sqlalchemy.orm import relationship, backref

#db = SQLAlchemy(current_app)
#db.Model.metadata.reflect(db.get_engine(app=current_app))

Base = db.Model

class Filesystem(Base):
    __tablename__ = 'filesystem'
    id = db.Column(db.String(40), primary_key=True)
    name = db.Column(db.String(200))
    assignment = db.Column(db.String(50))
    owner = db.Column(db.String(100))
    created = db.Column(db.String(50))
    createdraw = db.Column(db.String(50))
    size = db.Column(db.String(50))
    type = db.Column(db.String(50))
    course = db.Column(db.String(100))
    fullname = db.Column(db.String(100))
    state = db.Column(db.String(5))
    ownedby = db.Column(db.String(5))
    json = db.Column(db.String)
    processed = db.Column(db.String)
    pdf = db.Column(db.String)

    def __repr__(self):
        return "<File(id='{}', state='{}', assignment='{}'>".format(self.id, self.state, self.assignment)

class DSDictionary(Base):
    __tablename__ = 'dictionaries'
    name = db.Column(db.String(50), primary_key=True)
    def __repr__(self):
        return "<DS_Dictionary(name='{}')>".format(self.name)

class Assignment(Base):
    __tablename__ = 'assignments'
    id = db.Column(db.String(50), primary_key=True)
    dictionary = db.Column(db.String(50))
    name = db.Column(db.String(150))
    course = db.Column(db.String(150))
    instructor = db.Column(db.String(150))
    def __repr__(self):
        return "<Assignment(id='{}', name='{}', dictionary='{}', ".format(self.id, self.name, self.dictionary)
