import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { api } from '@/lib/api'

interface Props {
  question: string
  sectionName: string
  contentContext: string
  onComplete: (score: number, verdict: string) => void
  onSkip: () => void
}

interface EvalResult {
  score: number
  verdict: 'correct' | 'partial' | 'incorrect'
  feedback: string
  key_point: string
}

const VERDICT_STYLE = {
  correct:   { bg: '#f0fdf4', border: '#86efac', icon: '✓', color: '#16a34a' },
  partial:   { bg: '#fffbeb', border: '#fcd34d', icon: '~', color: '#d97706' },
  incorrect: { bg: '#fef2f2', border: '#fca5a5', icon: '✗', color: '#dc2626' },
}

export function ComprehensionCheck({ question, sectionName, contentContext, onComplete, onSkip }: Props) {
  const [answer, setAnswer] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [result, setResult] = useState<EvalResult | null>(null)

  async function evaluate() {
    if (!answer.trim()) return
    setEvaluating(true)
    try {
      const res = await api.post<EvalResult>('/api/v1/session/evaluate-answer', {
        question,
        learner_answer: answer,
        content_context: contentContext,
        section_name: sectionName,
      })
      setResult(res)
    } catch {
      // If AI fails, just skip
      onSkip()
    } finally {
      setEvaluating(false)
    }
  }

  if (result) {
    const style = VERDICT_STYLE[result.verdict]
    return (
      <View style={[styles.resultCard, { backgroundColor: style.bg, borderColor: style.border }]}>
        <View style={styles.resultHeader}>
          <Text style={[styles.resultIcon, { color: style.color }]}>{style.icon}</Text>
          <Text style={[styles.resultScore, { color: style.color }]}>{result.score}/100</Text>
        </View>
        <Text style={styles.resultFeedback}>{result.feedback}</Text>
        {result.key_point ? (
          <View style={styles.keyPoint}>
            <Text style={styles.keyPointLabel}>Key point:</Text>
            <Text style={styles.keyPointText}>{result.key_point}</Text>
          </View>
        ) : null}
        <TouchableOpacity style={styles.continueBtn} onPress={() => onComplete(result.score, result.verdict)}>
          <Text style={styles.continueBtnText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>💡 Quick Check — {sectionName}</Text>
      </View>

      <Text style={styles.question}>{question}</Text>

      <TextInput
        style={styles.input}
        placeholder="Type your answer here..."
        placeholderTextColor="#9ca3af"
        value={answer}
        onChangeText={setAnswer}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitBtn, (!answer.trim() || evaluating) && styles.submitDisabled]}
          onPress={evaluate}
          disabled={!answer.trim() || evaluating}
        >
          {evaluating
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.submitText}>Submit Answer</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 4 },
  badge: { backgroundColor: '#ede9fe', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 14 },
  badgeText: { color: '#4f46e5', fontSize: 12, fontWeight: '600' },
  question: { fontSize: 17, fontWeight: '600', color: '#1a1a2e', lineHeight: 26, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 14, fontSize: 15, color: '#1a1a2e', backgroundColor: '#f9fafb', minHeight: 100, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  skipBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  skipText: { color: '#6b7280', fontSize: 14 },
  submitBtn: { flex: 2, backgroundColor: '#4f46e5', padding: 12, borderRadius: 10, alignItems: 'center' },
  submitDisabled: { backgroundColor: '#a5b4fc' },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  resultCard: { borderWidth: 2, borderRadius: 12, padding: 16 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  resultIcon: { fontSize: 22, fontWeight: '700', marginRight: 8 },
  resultScore: { fontSize: 20, fontWeight: '700' },
  resultFeedback: { fontSize: 15, color: '#374151', lineHeight: 24, marginBottom: 10 },
  keyPoint: { backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 8, padding: 10, marginBottom: 12 },
  keyPointLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 },
  keyPointText: { fontSize: 14, color: '#1a1a2e', lineHeight: 22 },
  continueBtn: { backgroundColor: '#4f46e5', borderRadius: 10, padding: 12, alignItems: 'center' },
  continueBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
})
