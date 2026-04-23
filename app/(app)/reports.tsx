import { useCallback, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { api } from '@/lib/api'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'

interface DNAProfile {
  is_ready: boolean
  preferred_mode: string | null
  optimal_hour_start: number | null
  optimal_hour_end: number | null
  avg_attention_span_mins: number
  persistence_score: number
  sessions_analyzed: number
  weak_area_flags: { section: { name: string }; accuracy_score: number }[]
}

interface WeeklyReport {
  data: {
    sessions_completed: number
    total_study_time_mins: number
    avg_session_length_mins: number
    strongest_topic: string | null
    most_improved: string | null
    needs_attention: { topic: string; accuracy: number }[]
    recommendations: string[]
  }
  generated_at: string
}

function formatHour(h: number) {
  return `${h % 12 || 12}${h >= 12 ? 'PM' : 'AM'}`
}

function ScoreBar({ label, value, max = 1 }: { label: string; value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%` as any }]} />
      </View>
      <Text style={styles.scoreValue}>{Math.round(pct)}%</Text>
    </View>
  )
}

export default function ReportsScreen() {
  const [dna, setDna] = useState<DNAProfile | null>(null)
  const [weekly, setWeekly] = useState<WeeklyReport | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [dnaRes, weeklyRes] = await Promise.allSettled([
      api.get<{ dna: DNAProfile | null }>('/api/v1/dna'),
      api.get<{ report: WeeklyReport }>('/api/v1/reports/weekly'),
    ])
    if (dnaRes.status === 'fulfilled') setDna(dnaRes.value.dna)
    if (weeklyRes.status === 'fulfilled') setWeekly(weeklyRes.value.report)
  }, [])

  useFocusEffect(useCallback(() => { load().finally(() => setLoading(false)) }, [load]))
  const { refreshControl } = usePullToRefresh(load)

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={refreshControl}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Reports</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Learning DNA */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧬 Learning DNA</Text>
        {!dna?.is_ready ? (
          <View style={styles.notReady}>
            <Text style={styles.notReadyText}>Complete {5 - (dna?.sessions_analyzed ?? 0)} more sessions to unlock your Learning DNA.</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((dna?.sessions_analyzed ?? 0) / 5) * 100}%` as any }]} />
            </View>
            <Text style={styles.progressLabel}>{dna?.sessions_analyzed ?? 0} / 5 sessions</Text>
          </View>
        ) : (
          <>
            <View style={styles.dnaGrid}>
              {dna.preferred_mode && (
                <View style={styles.dnaChip}>
                  <Text style={styles.dnaChipLabel}>Best Mode</Text>
                  <Text style={styles.dnaChipValue}>{dna.preferred_mode}</Text>
                </View>
              )}
              {dna.optimal_hour_start != null && (
                <View style={styles.dnaChip}>
                  <Text style={styles.dnaChipLabel}>Peak Time</Text>
                  <Text style={styles.dnaChipValue}>{formatHour(dna.optimal_hour_start)}–{formatHour(dna.optimal_hour_end ?? dna.optimal_hour_start + 2)}</Text>
                </View>
              )}
              {dna.avg_attention_span_mins > 0 && (
                <View style={styles.dnaChip}>
                  <Text style={styles.dnaChipLabel}>Attention</Text>
                  <Text style={styles.dnaChipValue}>{Math.round(dna.avg_attention_span_mins)}m</Text>
                </View>
              )}
              <View style={styles.dnaChip}>
                <Text style={styles.dnaChipLabel}>Sessions</Text>
                <Text style={styles.dnaChipValue}>{dna.sessions_analyzed}</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Learning Scores</Text>
            <ScoreBar label="Persistence" value={dna.persistence_score} />

            {dna.weak_area_flags.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Needs Attention</Text>
                {dna.weak_area_flags.map((f, i) => (
                  <View key={i} style={styles.weakItem}>
                    <Text style={styles.weakName}>⚠️ {f.section.name}</Text>
                    <Text style={styles.weakScore}>{Math.round(f.accuracy_score * 100)}%</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </View>

      {/* Weekly Report */}
      {weekly && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 This Week</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{weekly.data.sessions_completed}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{weekly.data.total_study_time_mins}m</Text>
              <Text style={styles.statLabel}>Study Time</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{weekly.data.avg_session_length_mins}m</Text>
              <Text style={styles.statLabel}>Avg Session</Text>
            </View>
          </View>

          {weekly.data.strongest_topic && (
            <View style={styles.highlight}>
              <Text style={styles.highlightIcon}>🏆</Text>
              <Text style={styles.highlightText}>Strongest: <Text style={styles.bold}>{weekly.data.strongest_topic}</Text></Text>
            </View>
          )}

          {weekly.data.needs_attention.length > 0 && (
            <View style={styles.highlight}>
              <Text style={styles.highlightIcon}>📌</Text>
              <Text style={styles.highlightText}>Focus on: <Text style={styles.bold}>{weekly.data.needs_attention[0].topic}</Text></Text>
            </View>
          )}

          {weekly.data.recommendations.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Recommendations</Text>
              {weekly.data.recommendations.map((r, i) => (
                <Text key={i} style={styles.recommendation}>• {r}</Text>
              ))}
            </>
          )}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8fc' },
  content: { padding: 20, paddingTop: 56 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  back: { color: '#4f46e5', fontSize: 15 },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
  notReady: { alignItems: 'center', paddingVertical: 8 },
  notReadyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 16, lineHeight: 22 },
  progressBar: { width: '100%', height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 8 },
  progressFill: { height: 8, backgroundColor: '#4f46e5', borderRadius: 4 },
  progressLabel: { fontSize: 13, color: '#6b7280' },
  dnaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  dnaChip: { backgroundColor: '#f5f3ff', borderRadius: 10, padding: 12, minWidth: '45%', flex: 1 },
  dnaChipLabel: { fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  dnaChipValue: { fontSize: 16, fontWeight: '700', color: '#4f46e5' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  scoreLabel: { fontSize: 13, color: '#374151', width: 90 },
  barBg: { flex: 1, height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, marginHorizontal: 8 },
  barFill: { height: 8, backgroundColor: '#4f46e5', borderRadius: 4 },
  scoreValue: { fontSize: 12, color: '#6b7280', width: 36, textAlign: 'right' },
  weakItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  weakName: { fontSize: 14, color: '#374151' },
  weakScore: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#4f46e5' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  highlight: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8fc', borderRadius: 8, padding: 10, marginBottom: 8 },
  highlightIcon: { fontSize: 18, marginRight: 10 },
  highlightText: { fontSize: 14, color: '#374151', flex: 1 },
  bold: { fontWeight: '700', color: '#1a1a2e' },
  recommendation: { fontSize: 13, color: '#4b5563', lineHeight: 22, marginBottom: 4 },
})
