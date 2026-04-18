import json
import os
import psycopg2

SCHEMA = "t_p40838292_cyberbullying_workbo"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def resp(cors, status, data):
    return {"statusCode": status, "headers": cors, "body": json.dumps(data)}

def handler(event: dict, context) -> dict:
    """Сохранение и загрузка прогресса пользователя по session_id."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    raw_body = event.get("body") or "{}"
    body = json.loads(raw_body) if isinstance(raw_body, str) else raw_body
    action = body.get("action", "load")
    session_id = body.get("session_id", "")

    if not session_id:
        return resp(cors, 400, {"error": "session_id required"})

    conn = get_conn()
    cur = conn.cursor()

    if action == "load":
        cur.execute(
            f"SELECT xp, level, completed_sections, achievements FROM {SCHEMA}.user_progress WHERE session_id = %s",
            (session_id,)
        )
        row = cur.fetchone()
        conn.close()
        if row:
            return resp(cors, 200, {
                "xp": row[0], "level": row[1],
                "completed_sections": list(row[2]),
                "achievements": list(row[3]),
            })
        return resp(cors, 200, {"xp": 0, "level": 1, "completed_sections": [], "achievements": []})

    if action == "save":
        xp = body.get("xp", 0)
        level = body.get("level", 1)
        completed_sections = body.get("completed_sections", [])
        achievements = body.get("achievements", [])

        cur.execute(
            f"""INSERT INTO {SCHEMA}.user_progress (session_id, xp, level, completed_sections, achievements, updated_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                ON CONFLICT (session_id) DO UPDATE SET
                  xp = EXCLUDED.xp,
                  level = EXCLUDED.level,
                  completed_sections = EXCLUDED.completed_sections,
                  achievements = EXCLUDED.achievements,
                  updated_at = NOW()""",
            (session_id, xp, level, completed_sections, achievements)
        )
        conn.commit()
        conn.close()
        return resp(cors, 200, {"ok": True})

    conn.close()
    return resp(cors, 400, {"error": "unknown action"})
