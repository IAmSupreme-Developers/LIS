import { useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'
import { api } from '@/lib/api'

interface ContentItem {
  id: string
  type: string
  title: string
  body: string | null
  quiz_questions?: {
    id: string
    question_text: string
    options: { id: string; text: string }[]
    correct_option_id: string
    explanation: string | null
  }[]
}

interface SessionItem {
  id: string
  content_item_id: string
  order_index: number
}

export function useSession(subjectId: string) {
  const [session, setSession] = useState<{ id: string; session_items: SessionItem[] } | null>(null)
  const [contentMap, setContentMap] = useState<Record<string, ContentItem>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const startTime = useRef(Date.now())
  const events = useRef<object[]>([])
  const isEnding = useRef(false) // prevent double-exit

  useEffect(() => {
    startSession()
  }, [])

  async function startSession() {
    setError(null)
    try {
      const data = await api.post<{ session: { id: string; session_items: SessionItem[] } }>(
        '/api/v1/session/start',
        { subject_id: subjectId, mode: 'READ', path_type: 'LINEAR' }
      )

      if (!data.session.session_items.length) {
        setError('No content available for this subject yet.')
        setLoading(false)
        return
      }

      setSession(data.session)

      // Load content — don't fail the whole session if one item fails
      const map: Record<string, ContentItem> = {}
      await Promise.allSettled(
        data.session.session_items.map(async item => {
          try {
            const res = await api.get<{ topic: { subtopics: { content_items: ContentItem[] }[] } }>(
              `/api/v1/content/topic/${item.content_item_id}`
            )
            res.topic.subtopics.flatMap(s => s.content_items).forEach(ci => { map[ci.id] = ci })
          } catch (e) {
            console.warn(`Failed to load content item ${item.content_item_id}:`, e)
          }
        })
      )

      if (Object.keys(map).length === 0) {
        setError('Could not load session content. Please try again.')
        setLoading(false)
        return
      }

      setContentMap(map)
    } catch (e: any) {
      const msg = e?.error?.message ?? 'Could not start session. Please try again.'
      setError(typeof msg === 'string' ? msg : 'Could not start session.')
    }
    setLoading(false)
  }

  function recordEvent(type: string, extra?: object) {
    events.current.push({
      event_type: type,
      session_id: session?.id,
      occurred_at: new Date().toISOString(),
      ...extra,
    })
  }

  async function endSession(completed: boolean) {
    if (isEnding.current) return // prevent double-exit
    isEnding.current = true

    if (session) {
      const duration = Math.round((Date.now() - startTime.current) / 1000)
      try {
        await api.post('/api/v1/session/end', {
          session_id: session.id,
          ended_at: new Date().toISOString(),
          completed,
          duration_seconds: duration,
        })
        if (events.current.length > 0) {
          await api.post('/api/v1/behavior/events', { events: events.current })
        }
      } catch (e) {
        console.warn('Failed to sync session end:', e)
        // Don't block navigation on sync failure
      }
    }

    router.back()
  }

  function handleAnswer(optionId: string) {
    if (showAnswer) return
    setSelectedOption(optionId)
    setShowAnswer(true)
    const item = currentItem
    const question = item?.quiz_questions?.[0]
    if (question) {
      recordEvent('quiz_response', {
        content_item_id: item?.id,
        value: { question_id: question.id, selected: optionId, correct: optionId === question.correct_option_id },
      })
    }
  }

  function handleNext() {
    if (!session) return
    recordEvent('content_complete', { content_item_id: currentItem?.id })
    setSelectedOption(null)
    setShowAnswer(false)
    if (currentIndex < session.session_items.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      endSession(true)
    }
  }

  const items = session?.session_items ?? []
  const currentSessionItem = items[currentIndex]
  const currentItem = currentSessionItem ? contentMap[currentSessionItem.content_item_id] : null

  return {
    loading,
    error,
    items,
    currentIndex,
    currentItem,
    selectedOption,
    showAnswer,
    handleAnswer,
    handleNext,
    endSession,
  }
}
