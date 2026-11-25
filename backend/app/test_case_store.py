import sqlite3
from datetime import datetime, timezone

from backend.app.database import get_connection
from backend.app.test_case_schemas import GeneratedTestCase


TEST_CASE_COLUMNS = (
    "test_case_id",
    "module_name",
    "test_scenario",
    "test_case_title",
    "preconditions",
    "test_steps",
    "test_data",
    "expected_result",
    "actual_result",
    "priority",
    "status",
)


def _connect():
    connection = get_connection()
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS test_cases (
            test_case_id TEXT PRIMARY KEY,
            module_name TEXT NOT NULL,
            test_scenario TEXT NOT NULL,
            test_case_title TEXT NOT NULL,
            preconditions TEXT NOT NULL,
            test_steps TEXT NOT NULL,
            test_data TEXT NOT NULL,
            expected_result TEXT NOT NULL,
            actual_result TEXT NOT NULL DEFAULT '',
            priority TEXT NOT NULL CHECK (
                priority IN ('Critical', 'High', 'Medium', 'Low')
            ),
            status TEXT NOT NULL DEFAULT 'Not Executed'
                CHECK (status = 'Not Executed'),
            created_at TEXT NOT NULL
        )
        """
    )
    connection.commit()
    return connection


def _row_to_test_case(row: sqlite3.Row) -> dict[str, str]:
    return {column: row[column] for column in TEST_CASE_COLUMNS}


def save_test_cases(
    test_cases: list[GeneratedTestCase],
) -> list[dict[str, str]]:
    connection = _connect()
    placeholders = ", ".join("?" for _ in TEST_CASE_COLUMNS)
    columns = ", ".join(TEST_CASE_COLUMNS)
    update_fields = ", ".join(
        f"{column} = excluded.{column}"
        for column in TEST_CASE_COLUMNS
        if column != "test_case_id"
    )
    sql = f"""
        INSERT INTO test_cases ({columns}, created_at)
        VALUES ({placeholders}, ?)
        ON CONFLICT(test_case_id) DO UPDATE SET {update_fields}
    """
    now = datetime.now(timezone.utc).isoformat()

    try:
        with connection:
            for test_case in test_cases:
                values = test_case.model_dump()
                connection.execute(
                    sql,
                    [values[column] for column in TEST_CASE_COLUMNS] + [now],
                )
            ids = [test_case.test_case_id for test_case in test_cases]
            saved_rows = connection.execute(
                f"""
                SELECT {columns}
                FROM test_cases
                WHERE test_case_id IN ({", ".join("?" for _ in ids)})
                """,
                ids,
            ).fetchall()
        rows_by_id = {row["test_case_id"]: _row_to_test_case(row) for row in saved_rows}
        return [rows_by_id[test_case_id] for test_case_id in ids]
    finally:
        connection.close()


def list_test_cases() -> list[dict[str, str]]:
    connection = _connect()
    columns = ", ".join(TEST_CASE_COLUMNS)
    try:
        rows = connection.execute(
            f"""
            SELECT {columns}
            FROM test_cases
            ORDER BY created_at DESC, test_case_id ASC
            """
        ).fetchall()
        return [_row_to_test_case(row) for row in rows]
    finally:
        connection.close()
