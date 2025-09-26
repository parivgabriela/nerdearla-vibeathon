from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(settings.database_url, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def init_db():
    # Import models to register metadata
    from . import models  # noqa: F401
    Base.metadata.create_all(bind=engine)


def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
