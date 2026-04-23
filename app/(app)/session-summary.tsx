import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { api } from '@/lib/api'

interface SessionSummary {
  session_id: string
  completed: boolean
  duration_seconds: number
  quiz_accuracy: number | null
  explanation_level: number
  streak: number
  weak_areas: { name: string; accuracy: number }[]
}

type Feedback = 'TOO_HARD' | 'JUST_RIGHT' | 'TOO_EASY'

const FEEDBACK_OPTIONS: { value: Feedback; emoji: string; label: string; color: string; border: string }[] = [
  { value: 'TOO_HARD', emoji: '😓', label: 'Too Hard', color: '#fef2f2', border: '#fca5a5' },
  { value: 'JUST_RIGHT', emoji: '😊', label: 'Just Right', color: '#f0fdf4', border: '#86efac' },
  { value: 'TOO_EASY', emoji: '😎', label: 'Too Easy', color: '#eff6ff', border: '#93c5fd' },
]

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function SessionSummaryScreen() {
  const { summary: summaryStr } = useLocalSearchParams<{ summary: string }>()
  const summary: SessionSummary = summaryStr ? JSON.parse(summaryStr) : {}

  const [selected, setSelected] = useState<Feedback | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submitFeedback(feedback: Feedback) {
    setSelected(feedback)
    setSubmitting(true)
    try {
      await api.post('/api/v1/session/feedback', { session_id: summary.session_id, feedback })
    } catch {}
    setSubmitting(false)
    router.replace('/(app)/dashboard')
  }

  const accuracy = summary.quiz_accuracy != null
    ? `${Math.round(summary.quiz_accuracy * 100)}%`
    : '—'

  const accuracyColor = summary.quiz_accuracy == null ? '#6b7280'
    : summary.quiz_accuracy >= 0.7 ? '#16a34a'
    : summary.quiz_accuracy >= 0.5 ? '#d97706'
    : '#dc2626'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Session Complete! 🎉</Text>

      {/* Streak */}
      {summary.streak > 0 && (
        <View style={styles.streakBanner}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>
            {summary.streak} day streak{summary.streak === 1 ? '' : 's'}!
            {summary.streak >= 7 ? ' Amazing consistency!' : summary.streak >= 3 ? ' Keep it up!' : ' Good start!'}
          </Text>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDuration(summary.duration_seconds ?? 0)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: accuracyColor }]}>{accuracy}</Text>
          <Text style={styles.statLabel}>Quiz Score</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{summary.explanation_level ?? 3}/5</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
      </View>

      {/* Weak areas */}
      {summary.weak_areas?.length > 0 && (
        <View style={styles.weakCard}>
          <Text style={styles.weakTitle}>📌 Areas to revisit</Text>
          {summary.weak_areas.map((w, i) => (
            <View key={i} style={styles.weakRow}>
              <Text style={styles.weakName}>{w.name}</Text>
              <Text style={styles.weakScore}>{w.accuracy}%</Text>
            </View>
          ))}
        </View>
      )}

      {/* Feedback */}
      <Text style={styles.feedbackTitle}>How was this session?</Text>
      <Text style={styles.feedbackSubtitle}>Your answer adjusts how the AI explains content next time.</Text>

      <View style={styles.feedbackRow}>
        {FEEDBACK_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.feedbackBtn, { backgroundColor: opt.color, borderColor: selected === opt.value ? opt.border : 'transparent' }]}
            onPress={() => !submitting && submitFeedback(opt.value)}
            disabled={submitting}
          >
            <Text style={styles.feedbackEmoji}>{opt.emoji}</Text>
            <Text style={styles.feedbackLabel}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {submitting && <ActivityIndicator color="#4f46e5" style={{ marginTop: 16 }} />}

      <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/(app)/dashboard')} disabled={submitting}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 60, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', marginBottom: 20 },
  streakBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7ed', borderRadius: 12, padding: 14, marginBottom: 20, width: '100%', borderWidth: 1, borderColor: '#fed7aa' },
  streakEmoji: { fontSize: 24, marginRight: 10 },
  streakText: { fontSize: 15, fontWeight: '600', color: '#c2410c', flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#4f46e5' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  weakCard: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, width: '100%', marginBottom: 24 },
  weakTitle: { fontSize: 13, fontWeight: '700', color: '#dc2626', marginBottom: 10 },
  weakRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  weakName: { fontSize: 14, color: '#374151' },
  weakScore: { fontSize: 14, fontWeight: '600', color: '#dc2626' },
  feedbackTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', marginBottom: 6 },
  feedbackSubtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  feedbackRow: { flexDirection: 'row', gap: 10, width: '100%' },
  feedbackBtn: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 2 },
  feedbackEmoji: { fontSize: 30, marginBottom: 6 },
  feedbackLabel: { fontSize: 12, fontWeight: '600', color: '#374151' },
  skipBtn: { marginTop: 20, alignItems: 'center' },
  skipText: { color: '#9ca3af', fontSize: 14 },
})
