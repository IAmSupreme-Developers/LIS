import * as SQLite from 'expo-sqlite'

let db: SQLite.SQLiteDatabase | null = null

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db
  db = await SQLite.openDatabaseAsync('lis.db')
  await initSchema(db)
  return db
}

async function initSchema(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS local_subjects (
      id TEXT PRIMARY KEY,
      form_level_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      syllabus_version TEXT,
      cached_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_sections (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      parent_id TEXT,
      name TEXT NOT NULL,
      level INTEGER NOT NULL,
      order_index INTEGER NOT NULL,
      exam_relevance INTEGER DEFAULT 3
    );

    CREATE TABLE IF NOT EXISTS local_content_items (
      id TEXT PRIMARY KEY,
      section_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      media_url TEXT,
      quiz_questions TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS local_sessions (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      path_type TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      completed INTEGER DEFAULT 0,
      duration_seconds INTEGER,
      explanation_level INTEGER DEFAULT 3,
      feedback TEXT,
      sync_status TEXT DEFAULT 'PENDING'
    );

    CREATE TABLE IF NOT EXISTS local_behavior_events (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      content_item_id TEXT,
      value TEXT,
      occurred_at INTEGER NOT NULL,
      sync_status TEXT DEFAULT 'PENDING'
    );

    CREATE TABLE IF NOT EXISTS local_quiz_responses (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      selected_option_id TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      response_time_ms INTEGER NOT NULL,
      attempt_number INTEGER DEFAULT 1,
      occurred_at INTEGER NOT NULL,
      sync_status TEXT DEFAULT 'PENDING'
    );

    CREATE INDEX IF NOT EXISTS idx_sections_subject ON local_sections(subject_id);
    CREATE INDEX IF NOT EXISTS idx_sections_parent ON local_sections(parent_id);
    CREATE INDEX IF NOT EXISTS idx_content_section ON local_content_items(section_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_sync ON local_sessions(sync_status);
    CREATE INDEX IF NOT EXISTS idx_events_sync ON local_behavior_events(sync_status);
    CREATE INDEX IF NOT EXISTS idx_responses_sync ON local_quiz_responses(sync_status);
  `)
}
