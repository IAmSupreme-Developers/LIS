import { useState } from 'react'
import { api } from '@/lib/api'

export type CheckType = 'ai' | 'quiz' | 'self_assess' | null

export interface CheckState {
  type: CheckType
  // AI check
  question?: string
  sectionName?: string
  contentContext?: string
  // Quiz check (offline fallback)
  quizQuestion?: {
    id: string
    question_text: string
    options: { id: string; text: string }[]
    correct_option_id: string
    explanation: string | null
  }
}

interface ContentItem {
  id: string
  body: string | null
  section_id?: string
  quiz_questions?: {
    id: string
    question_text: string
    options: { id: string; text: string }[]
    correct_option_id: string
    explanation: string | null
  }[]
}

/**
 * Determines and fetches the appropriate comprehension check for a content item.
 * Returns null if no check should be shown (low importance section or quiz type).
 */
export async function getComprehensionCheck(
  item: ContentItem,
  isOnline: boolean
): Promise<CheckState | null> {
  // Never check quiz items — they are already assessments
  if (item.type === 'QUIZ') return null

  if (isOnline && item.section_id && item.body) {
    try {
      const res = await api.post<{ ask: boolean; question?: string; section_name?: string }>(
        '/api/v1/session/comprehension-check',
        { section_id: item.section_id, content_summary: item.body }
      )
      if (res.ask && res.question) {
        return {
          type: 'ai',
          question: res.question,
          sectionName: res.section_name ?? '',
          contentContext: item.body,
        }
      }
      return null // server said don't ask (low relevance)
    } catch {
      // Fall through to offline logic
    }
  }

  // Offline fallback — use a quiz question if available
  const quizQ = item.quiz_questions?.[0]
  if (quizQ) {
    return { type: 'quiz', quizQuestion: quizQ }
  }

  // Last resort — self-assessment prompt
  // Only show if item has meaningful content
  if (item.body && item.body.length > 100) {
    return { type: 'self_assess' }
  }

  return null
}

/**
 * Hook that manages comprehension check state for a session.
 */
export function useComprehensionCheck() {
  const [checkState, setCheckState] = useState<CheckState | null>(null)
  const [loadingCheck, setLoadingCheck] = useState(false)

  async function triggerCheck(item: ContentItem, isOnline: boolean): Promise<boolean> {
    setLoadingCheck(true)
    const check = await getComprehensionCheck(item, isOnline)
    setLoadingCheck(false)
    if (check) {
      setCheckState(check)
      return true // check was triggered, don't advance yet
    }
    return false // no check, advance immediately
  }

  function clearCheck() {
    setCheckState(null)
  }

  return { checkState, loadingCheck, triggerCheck, clearCheck }
}
