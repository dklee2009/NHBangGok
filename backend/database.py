import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# 배포 시 DATABASE_URL 환경변수로 영구 디스크 경로 지정 (예: sqlite:////var/data/stamps.db)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./stamps.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()