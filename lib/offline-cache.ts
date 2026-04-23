import { getDb } from './db'
import { api } from './api'

export interface LocalSubject {
  id: string
  form_level_id: string
  name: string
  code: string
  syllabus_version: string
}

export interface LocalSection {
  id: string
  subject_id: string
  parent_id: string | null
  name: string
  level: number
  order_index: number
  exam_relevance: number
}

export interface LocalContentItem {
  id: string
  section_id: string
  type: string
  title: string
  body: string | null
  media_url: string | null
  quiz_questions: any[] | null
}

// ─── Subjects ────────────────────────────────────────────────────────────────

export async function getSubjects(formLevelId: string): Promise<LocalSubject[]> {
  // Try API first
  try {
    const data = await api.get<{ subjects: any[] }>(`/api/v1/curriculum/subjects?form_level_id=${formLevelId}`)
    const subjects = data.subjects ?? []
    // Cache to SQLite
    await cacheSubjects(subjects, formLevelId)
    return subjects
  } catch {
    // Fall back to SQLite
    return getSubjectsFromCache(formLevelId)
  }
}

async function cacheSubjects(subjects: any[], formLevelId: string) {
  const db = await getDb()
  const now = Date.now()
  for (const s of subjects) {
    await db.runAsync(
      `INSERT OR REPLACE INTO local_subjects (id, form_level_id, name, code, syllabus_version, cached_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [s.id, formLevelId, s.name, s.code, s.syllabus_version ?? '', now]
    )
  }
}

async function getSubjectsFromCache(formLevelId: string): Promise<LocalSubject[]> {
  const db = await getDb()
  return db.getAllAsync<LocalSubject>(
    `SELECT * FROM local_subjects WHERE form_level_id = ?`,
    [formLevelId]
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

export async function getSections(subjectId: string, parentId: string | null = null): Promise<LocalSection[]> {
  try {
    const param = parentId === null ? 'null' : parentId
    const data = await api.get<{ sections: any[] }>(`/api/admin/sections?subject_id=${subjectId}&parent_id=${param}`)
    const sections = data.sections ?? []
    await cacheSections(sections)
    return sections
  } catch {
    return getSectionsFromCache(subjectId, parentId)
  }
}

async function cacheSections(sections: any[]) {
  const db = await getDb()
  for (const s of sections) {
    await db.runAsync(
      `INSERT OR REPLACE INTO local_sections (id, subject_id, parent_id, name, level, order_index, exam_relevance) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.subject_id, s.parent_id ?? null, s.name, s.level, s.order_index, s.exam_relevance ?? 3]
    )
  }
}

async function getSectionsFromCache(subjectId: string, parentId: string | null): Promise<LocalSection[]> {
  const db = await getDb()
  if (parentId === null) {
    return db.getAllAsync<LocalSection>(
      `SELECT * FROM local_sections WHERE subject_id = ? AND parent_id IS NULL ORDER BY order_index`,
      [subjectId]
    )
  }
  return db.getAllAsync<LocalSection>(
    `SELECT * FROM local_sections WHERE subject_id = ? AND parent_id = ? ORDER BY order_index`,
    [subjectId, parentId]
  )
}

// ─── Content ──────────────────────────────────────────────────────────────────

export async function getContentItem(contentItemId: string): Promise<LocalContentItem | null> {
  try {
    const data = await api.get<{ topic: any }>(`/api/v1/content/topic/${contentItemId}`)
    const items = data.topic?.subtopics?.[0]?.content_items ?? []
    const item = items[0]
    if (item) await cacheContentItem(item)
    return item ?? null
  } catch {
    return getContentItemFromCache(contentItemId)
  }
}

async function cacheContentItem(item: any) {
  const db = await getDb()
  await db.runAsync(
    `INSERT OR REPLACE INTO local_content_items (id, section_id, type, title, body, media_url, quiz_questions, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id, item.section_id ?? item.subtopic_id, item.type, item.title,
      item.body ?? null, item.media_url ?? null,
      item.quiz_questions ? JSON.stringify(item.quiz_questions) : null,
      item.is_active ? 1 : 0,
    ]
  )
}

async function getContentItemFromCache(id: string): Promise<LocalContentItem | null> {
  const db = await getDb()
  const row = await db.getFirstAsync<any>(
    `SELECT * FROM local_content_items WHERE id = ?`, [id]
  )
  if (!row) return null
  return {
    ...row,
    quiz_questions: row.quiz_questions ? JSON.parse(row.quiz_questions) : null,
  }
}

// ─── Prefetch subject content (call on enrollment) ────────────────────────────

export async function prefetchSubjectContent(subjectId: string) {
  const db = await getDb()
  try {
    // Fetch full subject tree from the public subjects endpoint
    const data = await api.get<{ subject: any }>(`/api/v1/curriculum/subjects/${subjectId}`)
    const subject = data.subject
    if (!subject) throw new Error('Subject not found')

    // Cache all sections recursively from the subject tree
    async function cacheSectionTree(sections: any[]) {
      for (const section of sections) {
        await db.runAsync(
          `INSERT OR REPLACE INTO local_sections (id, subject_id, parent_id, name, level, order_index, exam_relevance) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [section.id, subjectId, section.parent_id ?? null, section.name, section.level ?? 1, section.order_index ?? 1, section.exam_relevance ?? 3]
        )
        // Fetch content for this section
        try {
          const contentData = await api.get<{ items: any[] }>(`/api/admin/content-items?section_id=${section.id}`)
          for (const item of contentData.items ?? []) {
            await cacheContentItem(item)
          }
        } catch {}
        // Recurse into children
        if (section.children?.length > 0) {
          await cacheSectionTree(section.children)
        }
      }
    }

    await cacheSectionTree(subject.sections ?? [])

    // Update cached_at on the subject
    await db.runAsync(
      `UPDATE local_subjects SET cached_at = ? WHERE id = ?`,
      [Date.now(), subjectId]
    )
  } catch (e) {
    console.warn('[offline] prefetch failed:', e)
    throw e // re-throw so the UI can show the error
  }
}

// ─── Download status ──────────────────────────────────────────────────────────

export interface DownloadStatus {
  subject_id: string
  cached_sections: number
  cached_content_items: number
  last_updated: number | null
}

export async function getDownloadStatus(subjectId: string): Promise<DownloadStatus> {
  const db = await getDb()
  const sections = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM local_sections WHERE subject_id = ?`, [subjectId]
  )
  const items = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM local_content_items ci
     JOIN local_sections s ON ci.section_id = s.id
     WHERE s.subject_id = ?`, [subjectId]
  )
  const subject = await db.getFirstAsync<{ cached_at: number }>(
    `SELECT cached_at FROM local_subjects WHERE id = ?`, [subjectId]
  )
  return {
    subject_id: subjectId,
    cached_sections: sections?.count ?? 0,
    cached_content_items: items?.count ?? 0,
    last_updated: subject?.cached_at ?? null,
  }
}
