import os
import sqlite3
from pathlib import Path


DEFAULT_DATABASE_PATH = Path(__file__).resolve().parents[1] / "qa_smart_ai.db"


def get_connection() -> sqlite3.Connection:
    database_path = Path(
        os.environ.get("QA_SMART_AI_DATABASE_PATH", str(DEFAULT_DATABASE_PATH))
    ).expanduser()
    database_path.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(database_path, timeout=5)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection
