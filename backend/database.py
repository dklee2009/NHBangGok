import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# 로컬 개발: SQLite 파일 사용 / 배포: DATABASE_URL 환경변수로 Postgres 연결 문자열 지정
# (Render 무료 플랜은 영구 디스크를 지원하지 않아 SQLite는 재배포 시 초기화되므로 배포 환경에서는 Postgres 사용)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./stamps.db")
# SQLAlchemy는 "postgresql://" 스킴만 인식하므로 옛 "postgres://" 형식(Render가 종종 내려줌)을 보정
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()