from datetime import datetime, timezone

from backend.app.bug_report_schemas import BugReport
from backend.app.database import get_connection


BUG_REPORT_COLUMNS = (
    "bug_id",
    "project_name",
    "bug_title",
    "module",
    "environment",
    "bug_description",
    "preconditions",
    "steps_to_reproduce",
    "expected_result",
    "actual_result",
    "severity",
    "priority",
    "reproducibility",
    "status",
    "evidence",
    "business_impact",
    "load_id",
    "campaign_id",
)


def _connect():
    connection = get_connection()
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS bug_reports (
            bug_id TEXT PRIMARY KEY,
            project_name TEXT NOT NULL,
            bug_title TEXT NOT NULL,
            module TEXT NOT NULL,
            environment TEXT NOT NULL CHECK (
                environment IN ('Development', 'QA', 'UAT', 'Production')
            ),
            bug_description TEXT NOT NULL,
            preconditions TEXT NOT NULL,
            steps_to_reproduce TEXT NOT NULL,
            expected_result TEXT NOT NULL,
            actual_result TEXT NOT NULL,
            severity TEXT NOT NULL CHECK (
                severity IN ('Critical', 'High', 'Medium', 'Low')
            ),
            priority TEXT NOT NULL CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),
            reproducibility TEXT NOT NULL CHECK (
                reproducibility IN ('Reproducible', 'Not Reproducible', 'Not Verified')
            ),
            status TEXT NOT NULL CHECK (
                status IN ('Draft', 'Open', 'In Progress', 'Resolved', 'Closed')
            ),
            evidence TEXT NOT NULL DEFAULT '',
            business_impact TEXT NOT NULL,
            load_id TEXT,
            campaign_id TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    connection.commit()
    return connection


def _row_to_report(row) -> dict[str, str | None]:
    return {column: row[column] for column in BUG_REPORT_COLUMNS}


def save_bug_report(report: BugReport) -> dict[str, str | None]:
    connection = _connect()
    columns = ", ".join(BUG_REPORT_COLUMNS)
    placeholders = ", ".join("?" for _ in BUG_REPORT_COLUMNS)
    update_fields = ", ".join(
        f"{column} = excluded.{column}"
        for column in BUG_REPORT_COLUMNS
        if column != "bug_id"
    )
    sql = f"""
        INSERT INTO bug_reports ({columns}, created_at)
        VALUES ({placeholders}, ?)
        ON CONFLICT(bug_id) DO UPDATE SET {update_fields}
    """
    values = report.model_dump()
    try:
        with connection:
            connection.execute(
                sql,
                [values[column] for column in BUG_REPORT_COLUMNS]
                + [datetime.now(timezone.utc).isoformat()],
            )
            row = connection.execute(
                f"SELECT {columns} FROM bug_reports WHERE bug_id = ?",
                (report.bug_id,),
            ).fetchone()
        return _row_to_report(row)
    finally:
        connection.close()


def list_bug_reports() -> list[dict[str, str | None]]:
    connection = _connect()
    columns = ", ".join(BUG_REPORT_COLUMNS)
    try:
        rows = connection.execute(
            f"""
            SELECT {columns}
            FROM bug_reports
            ORDER BY created_at DESC, bug_id ASC
            """
        ).fetchall()
        return [_row_to_report(row) for row in rows]
    finally:
        connection.close()
