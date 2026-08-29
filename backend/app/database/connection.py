"""SQLAlchemy engine and session factory."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

def create_database_if_not_exists() -> None:
    """Parse DATABASE_URL, connect to MySQL server, and create database if missing."""
    import pymysql
    from urllib.parse import urlparse
    
    try:
        # Handle connection URL format
        db_url = settings.DATABASE_URL
        if "sqlite" in db_url:
            return
            
        # Parse connection URL
        # mysql+pymysql://user:pass@host:port/db
        prefix, rest = db_url.split("://", 1)
        if "@" in rest:
            auth, host_port_db = rest.split("@", 1)
            user, password = auth.split(":", 1) if ":" in auth else (auth, "")
        else:
            user, password = "", ""
            host_port_db = rest
            
        if "/" in host_port_db:
            host_port, db_name = host_port_db.split("/", 1)
        else:
            host_port, db_name = host_port_db, "smart_events_db"
            
        if ":" in host_port:
            host, port_str = host_port.split(":", 1)
            port = int(port_str)
        else:
            host, port = host_port, 3306

        conn = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
        )
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}`")
        conn.close()
    except Exception:
        # Pass silently and let SQLAlchemy handle the operational error if connection fails
        pass

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
