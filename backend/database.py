"""
Database connection and session management using SQLAlchemy.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session

Base = declarative_base()

class Database:
    def __init__(self, database_uri=None):
        self.engine = None
        self.session_factory = None
        self.Session = None
        if database_uri:
            self.init_db(database_uri)

    def init_db(self, database_uri):
        # Configure SQLite with multi-thread support
        connect_args = {"check_same_thread": False} if database_uri.startswith("sqlite") else {}
        self.engine = create_engine(database_uri, connect_args=connect_args)
        self.session_factory = sessionmaker(bind=self.engine)
        self.Session = scoped_session(self.session_factory)
        Base.metadata.create_all(bind=self.engine)

    def get_session(self):
        if not self.Session:
            raise RuntimeError("Database has not been initialized. Call init_db() first.")
        return self.Session()

    def close(self):
        if self.Session:
            self.Session.remove()

db = Database()

