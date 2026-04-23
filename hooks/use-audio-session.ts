import { useEffect, useRef, useState, useCallback } from 'react'
import * as Speech from 'expo-speech'
import { getSpeechPrefs } from '@/lib/speech-prefs'

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

/**
 * Strips markdown syntax for clean TTS output.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')          // headings
    .replace(/\*\*(.*?)\*\*/g, '$1')   // bold
    .replace(/\*(.*?)\*/g, '$1')       // italic
    .replace(/`(.*?)`/g, '$1')         // inline code
    .replace(/```[\s\S]*?```/g, '')    // code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^[-*+]\s/gm, '')         // list bullets
    .replace(/^\d+\.\s/gm, '')         // numbered lists
    .replace(/\n{2,}/g, '. ')          // paragraph breaks
    .replace(/\n/g, ' ')               // line breaks
    .trim()
}

/**
 * Builds the spoken text for a content item.
 * For TEXT/SUMMARY_CARD: reads title then body.
 * For QUIZ: reads the question and options.
 */
function buildSpeechText(item: ContentItem, questionIndex = 0): string {
  if (item.type === 'QUIZ') {
    const q = item.quiz_questions?.[questionIndex]
    if (!q) return ''
    const options = q.options.map(o => `${o.id.toUpperCase()}: ${o.text}`).join('. ')
    return `Question. ${q.question_text}. ${options}`
  }
  const title = item.title ? `${item.title}. ` : ''
  const body = item.body ? stripMarkdown(item.body) : ''
  return `${title}${body}`
}

export function useAudioSession() {
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const currentText = useRef('')
  const onDoneRef = useRef<(() => void) | undefined>(undefined)

  useEffect(() => {
    return () => { Speech.stop() }
  }, [])

  const speak = useCallback(async (text: string, onDone?: () => void) => {
    Speech.stop()
    currentText.current = text
    onDoneRef.current = onDone
    setSpeaking(true)
    setPaused(false)
    const prefs = await getSpeechPrefs()
    console.log('[audio] speaking with prefs:', JSON.stringify(prefs))
    Speech.speak(text, {
      language: prefs.language,
      rate: prefs.rate,
      pitch: prefs.pitch,
      ...(prefs.voiceIdentifier ? { voice: prefs.voiceIdentifier } : {}),
      onDone: () => { setSpeaking(false); setPaused(false); onDone?.() },
      onStopped: () => { setSpeaking(false) },
      onError: () => { setSpeaking(false); onDone?.() },
    })
  }, [])

  const pause = useCallback(() => {
    Speech.stop()
    setSpeaking(false)
    setPaused(true)
  }, [])

  const resume = useCallback(() => {
    if (currentText.current) speak(currentText.current, onDoneRef.current)
  }, [speak])

  const stop = useCallback(() => {
    Speech.stop()
    setSpeaking(false)
    setPaused(false)
  }, [])

  const replay = useCallback((onDone?: () => void) => {
    if (currentText.current) speak(currentText.current, onDone)
  }, [speak])

  function speakItem(item: ContentItem, onDone?: () => void) {
    const text = buildSpeechText(item)
    if (text) speak(text, onDone)
    else onDone?.()
  }

  function speakFeedback(correct: boolean, explanation: string | null, onDone?: () => void) {
    const text = correct
      ? `Correct! ${explanation ? stripMarkdown(explanation) : ''}`
      : `Not quite. ${explanation ? stripMarkdown(explanation) : 'Try again next time.'}`
    speak(text, onDone)
  }

  return { speaking, paused, speak, pause, resume, stop, replay, speakItem, speakFeedback }
}
