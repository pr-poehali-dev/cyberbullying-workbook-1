CREATE TABLE IF NOT EXISTS t_p40838292_cyberbullying_workbo.user_progress (
  session_id TEXT PRIMARY KEY,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  completed_sections TEXT[] NOT NULL DEFAULT '{}',
  achievements TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW()
);