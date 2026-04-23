import { getDb } from './db'
import { api } from './api'

/**
 * Saves a session to SQLite when offline.
 * Called by useSession when the API call fails.
 */
export async function saveSessionLocally(session: {
  id: string
  subject_id: string
  mode: string
  path_type: string
  started_at: string
  ended_at?: string
  completed: boolean
  duration_seconds?: number
  explanation_level: number
  feedback?: string
}) {
  const db = await getDb()
  await db.runAsync(
    `INSERT OR REPLACE INTO local_sessions 
     (id, subject_id, mode, path_type, started_at, ended_at, completed, duration_seconds, explanation_level, feedback, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
    [
      session.id, session.subject_id, session.mode, session.path_type,
      new Date(session.started_at).getTime(),
      session.ended_at ? new Date(session.ended_at).getTime() : null,
      session.completed ? 1 : 0,
      session.duration_seconds ?? null,
      session.explanation_level,
      session.feedback ?? null,
    ]
  )
}

export async function saveEventLocally(event: {
  id: string
  session_id: string
  event_type: string
  content_item_id?: string
  value?: object
  occurred_at: string
}) {
  const db = await getDb()
  await db.runAsync(
    `INSERT OR REPLACE INTO local_behavior_events 
     (id, session_id, event_type, content_item_id, value, occurred_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
    [
      event.id, event.session_id, event.event_type,
      event.content_item_id ?? null,
      event.value ? JSON.stringify(event.value) : null,
      new Date(event.occurred_at).getTime(),
    ]
  )
}

/**
 * Syncs all pending local data to the server.
 * Call this when connectivity is restored.
 */
export async function syncPendingData(): Promise<{ synced: number; failed: number }> {
  const db = await getDb()
  let synced = 0
  let failed = 0

  // Sync sessions
  const pendingSessions = await db.getAllAsync<any>(
    `SELECT * FROM local_sessions WHERE sync_status = 'PENDING'`
  )

  if (pendingSessions.length > 0) {
    try {
      await api.post('/api/v1/sync', {
        sessions: pendingSessions.map(s => ({
          id: s.id,
          subject_id: s.subject_id,
          mode: s.mode,
          path_type: s.path_type,
          started_at: new Date(s.started_at).toISOString(),
          ended_at: s.ended_at ? new Date(s.ended_at).toISOString() : undefined,
          completed: s.completed === 1,
          duration_seconds: s.duration_seconds,
          difficulty_start: 'THREE', // legacy field, kept for compat
        })),
        behavior_events: [],
        quiz_responses: [],
      })
      await db.runAsync(
        `UPDATE local_sessions SET sync_status = 'SYNCED' WHERE sync_status = 'PENDING'`
      )
      synced += pendingSessions.length
    } catch {
      failed += pendingSessions.length
    }
  }

  // Sync behavior events
  const pendingEvents = await db.getAllAsync<any>(
    `SELECT * FROM local_behavior_events WHERE sync_status = 'PENDING'`
  )

  if (pendingEvents.length > 0) {
    try {
      await api.post('/api/v1/behavior/events', {
        events: pendingEvents.map(e => ({
          id: e.id,
          session_id: e.session_id,
          event_type: e.event_type,
          content_item_id: e.content_item_id,
          value: e.value ? JSON.parse(e.value) : undefined,
          occurred_at: new Date(e.occurred_at).toISOString(),
        })),
      })
      await db.runAsync(
        `UPDATE local_behavior_events SET sync_status = 'SYNCED' WHERE sync_status = 'PENDING'`
      )
      synced += pendingEvents.length
    } catch {
      failed += pendingEvents.length
    }
  }

  return { synced, failed }
}

/** Returns count of unsynced records */
export async function getPendingCount(): Promise<number> {
  const db = await getDb()
  const sessions = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM local_sessions WHERE sync_status = 'PENDING'`
  )
  const events = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM local_behavior_events WHERE sync_status = 'PENDING'`
  )
  return (sessions?.count ?? 0) + (events?.count ?? 0)
}
