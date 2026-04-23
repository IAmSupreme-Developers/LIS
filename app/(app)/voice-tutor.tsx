import { useEffect, useRef, useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Audio } from 'expo-av'
import * as SecureStore from 'expo-secure-store'
import * as Speech from 'expo-speech'
import { useSession } from '@/hooks/use-session'
import { SessionHeader } from '@/components/session-header'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:3000'
const SILENCE_THRESHOLD_DB = -35  // dB below this = silence (less sensitive)
const SILENCE_DURATION_MS = 2500  // wait 3.5s of silence before sending

interface Turn { role: 'tutor' | 'learner'; text: string }
type State = 'loading' | 'tutor_speaking' | 'listening' | 'processing' | 'error'

async function getToken() { return SecureStore.getItemAsync('access_token') }

async function playAudio(base64: string | null, text: string): Promise<void> {
  if (base64) {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: `data:audio/mp3;base64,${base64}` })
      await sound.playAsync()
      return new Promise(resolve => {
        sound.setOnPlaybackStatusUpdate(s => {
          if (s.isLoaded && s.didJustFinish) { sound.unloadAsync(); resolve() }
        })
      })
    } catch {}
  }
  return new Promise(resolve => {
    Speech.speak(text, { rate: 0.9, onDone: resolve, onError: () => resolve(), onStopped: () => resolve() })
  })
}

export default function VoiceTutorScreen() {
  const { subject_id, subject_name } = useLocalSearchParams<{ subject_id: string; subject_name: string }>()
  const { loading, error, items, currentIndex, currentItem, handleNext, endSession, sessionId } = useSession(subject_id)

  const [state, setState] = useState<State>('loading')
  const [turns, setTurns] = useState<Turn[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [listeningLabel, setListeningLabel] = useState('Listening...')

  const sessionContext = useRef<object | null>(null)
  const conversationHistory = useRef<{ role: string; content: string }[]>([])
  const recording = useRef<Audio.Recording | null>(null)
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasSpeech = useRef(false) // only auto-send after user has actually spoken
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    if (!loading && currentItem && sessionId) startTutorTurn()
  }, [loading, currentItem?.id, sessionId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Speech.stop()
      if (recording.current) recording.current.stopAndUnloadAsync().catch(() => {})
      if (silenceTimer.current) clearTimeout(silenceTimer.current)
    }
  }, [])

  function addTurn(role: 'tutor' | 'learner', text: string) {
    setTurns(prev => [...prev, { role, text }])
    conversationHistory.current.push({ role: role === 'tutor' ? 'assistant' : 'user', content: text })
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }

  async function startTutorTurn() {
    if (!currentItem || !sessionId) return
    setState('loading')
    try {
      const token = await getToken()
      const res = await fetch(`${BASE_URL}/api/v1/voice/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          session_id: sessionId,
          content_item_id: currentItem.id,
          previous_turns: conversationHistory.current.slice(-6),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? 'Failed')

      sessionContext.current = { ...sessionContext.current, ...data.context }
      addTurn('tutor', data.text)
      setState('tutor_speaking')
      await playAudio(data.audio_base64, data.text)
      // Auto-start listening after AI finishes
      await startListening()
    } catch (e: any) {
      setErrorMsg(e.message)
      setState('error')
    }
  }

  async function startListening() {
    try {
      await Audio.requestPermissionsAsync()
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
      const { recording: rec } = await Audio.Recording.createAsync(
        { ...Audio.RecordingOptionsPresets.HIGH_QUALITY, isMeteringEnabled: true }
      )
      recording.current = rec
      setState('listening')
      setListeningLabel('Listening...')
      hasSpeech.current = false // reset for new recording

      // Monitor audio levels for silence detection
      rec.setOnRecordingStatusUpdate(status => {
        if (!status.isRecording) return
        const db = status.metering ?? -160

        if (db > SILENCE_THRESHOLD_DB) {
          // Sound detected — mark that user has spoken, reset silence timer
          hasSpeech.current = true
          setListeningLabel('Hearing you...')
          if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null }
        } else if (hasSpeech.current) {
          // Silence AFTER speech — start timer
          if (!silenceTimer.current) {
            silenceTimer.current = setTimeout(() => {
              silenceTimer.current = null
              stopAndSend()
            }, SILENCE_DURATION_MS)
          }
        }
        // If no speech detected yet, ignore silence entirely
      })
    } catch (e: any) {
      setErrorMsg('Microphone error: ' + e.message)
      setState('error')
    }
  }

  async function stopAndSend() {
    if (!recording.current) return
    if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null }
    setState('processing')
    try {
      await recording.current.stopAndUnloadAsync()
      const uri = recording.current.getURI()
      recording.current = null
      if (!uri) { await startListening(); return } // nothing recorded, listen again

      const token = await getToken()
      const form = new FormData()
      form.append('audio', { uri, type: 'audio/m4a', name: 'audio.m4a' } as any)
      form.append('context', JSON.stringify(sessionContext.current))
      form.append('history', JSON.stringify(conversationHistory.current.slice(-10)))

      const res = await fetch(`${BASE_URL}/api/v1/voice/turn`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const data = await res.json()

      if (!res.ok || data.error?.code === 'EMPTY_AUDIO') {
        // Nothing meaningful said — listen again
        await startListening()
        return
      }

      addTurn('learner', data.learner_text)
      addTurn('tutor', data.ai_text)
      setState('tutor_speaking')
      await playAudio(data.audio_base64, data.ai_text)
      // Auto-listen again after AI responds
      await startListening()
    } catch (e: any) {
      setErrorMsg(e.message)
      setState('error')
    }
  }

  // Interrupt AI and start listening immediately
  function interrupt() {
    Speech.stop()
    if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null }
    startListening()
  }

  function handleNextItem() {
    Speech.stop()
    if (recording.current) { recording.current.stopAndUnloadAsync().catch(() => {}); recording.current = null }
    conversationHistory.current.push({ role: 'system', content: `[Moving to next section]` })
    handleNext()
  }

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#4f46e5" /></View>
  if (error) return <View style={s.center}><Text style={s.err}>{error}</Text></View>

  return (
    <View style={s.container}>
      <SessionHeader subjectName={subject_name} current={currentIndex + 1} total={items.length}
        onExit={() => { Speech.stop(); endSession(false) }} />

      {/* Tap anywhere to interrupt AI */}
      <ScrollView ref={scrollRef} style={s.chat} contentContainerStyle={s.chatContent}
        onTouchStart={() => { return; /* if (state === 'tutor_speaking') interrupt() */ }}>
        {turns.map((t, i) => (
          <View key={i} style={[s.bubble, t.role === 'tutor' ? s.tutorBubble : s.learnerBubble]}>
            <Text style={s.bubbleRole}>{t.role === 'tutor' ? '🤖 Tutor' : '👤 You'}</Text>
            <Text style={s.bubbleText}>{t.text}</Text>
          </View>
        ))}
        {state === 'processing' && (
          <View style={[s.bubble, s.tutorBubble]}><ActivityIndicator color="#4f46e5" size="small" /></View>
        )}
      </ScrollView>

      {/* Status bar */}
      <View style={s.controls}>
        {state === 'error' && (
          <View>
            <Text style={s.err}>{errorMsg}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => startTutorTurn()}>
              <Text style={s.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {state === 'loading' && (
          <View style={s.statusRow}><ActivityIndicator color="#4f46e5" size="small" /><Text style={s.statusText}>Preparing lesson...</Text></View>
        )}

        {state === 'tutor_speaking' && (
          <TouchableOpacity style={s.interruptBtn} onPress={interrupt}>
            <Text style={s.interruptIcon}>✋</Text>
            <Text style={s.interruptLabel}>Tap to interrupt</Text>
          </TouchableOpacity>
        )}

        {state === 'listening' && (
          <View style={s.listeningRow}>
            <View style={s.listeningDot} />
            <Text style={s.statusText}>{listeningLabel}</Text>
            <TouchableOpacity onPress={stopAndSend} style={s.sendNowBtn}>
              <Text style={s.sendNowText}>Send now</Text>
            </TouchableOpacity>
          </View>
        )}

        {state === 'processing' && (
          <View style={s.statusRow}><ActivityIndicator color="#4f46e5" size="small" /><Text style={s.statusText}>Processing...</Text></View>
        )}

        {(state === 'listening') && (
          <TouchableOpacity style={s.nextBtn} onPress={handleNextItem}>
            <Text style={s.nextText}>Next section →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chat: { flex: 1 },
  chatContent: { padding: 16, gap: 12, paddingBottom: 8 },
  bubble: { borderRadius: 14, padding: 14, maxWidth: '88%' },
  tutorBubble: { backgroundColor: '#f5f3ff', alignSelf: 'flex-start' },
  learnerBubble: { backgroundColor: '#eff6ff', alignSelf: 'flex-end' },
  bubbleRole: { fontSize: 11, fontWeight: '700', color: '#6b7280', marginBottom: 4 },
  bubbleText: { fontSize: 15, color: '#1a1a2e', lineHeight: 24 },
  controls: { padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  statusText: { fontSize: 14, color: '#6b7280' },
  interruptBtn: { backgroundColor: '#fef3c7', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  interruptIcon: { fontSize: 20 },
  interruptLabel: { fontSize: 14, fontWeight: '600', color: '#92400e' },
  listeningRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  listeningDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' },
  sendNowBtn: { marginLeft: 'auto' as any, backgroundColor: '#4f46e5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  sendNowText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  nextBtn: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 12, alignItems: 'center' },
  nextText: { color: '#374151', fontSize: 14, fontWeight: '600' },
  retryBtn: { backgroundColor: '#4f46e5', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 8 },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  err: { color: '#dc2626', fontSize: 14, textAlign: 'center' },
})
