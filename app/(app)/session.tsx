import { useState } from 'react'
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useSession } from '@/hooks/use-session'
import { useComprehensionCheck } from '@/hooks/use-comprehension-check'
import { SessionHeader } from '@/components/session-header'
import { QuizView } from '@/components/quiz-view'
import { ContentView } from '@/components/content-view'
import { CheckRenderer } from '@/components/check-renderer'
import { api } from '@/lib/api'
import { isOnline } from '@/lib/network'

export default function SessionScreen() {
  const { subject_id, subject_name } = useLocalSearchParams<{ subject_id: string; subject_name: string }>()
  const {
    loading, error, items, currentIndex, currentItem,
    selectedOption, showAnswer,
    handleAnswer, handleNext, endSession,
  } = useSession(subject_id)

  const { checkState, loadingCheck, triggerCheck, clearCheck } = useComprehensionCheck()

  // Quiz check state (for offline MCQ fallback)
  const [quizSelected, setQuizSelected] = useState<string | null>(null)
  const [quizShowAnswer, setQuizShowAnswer] = useState(false)

  async function handleNextWithCheck() {
    if (!currentItem || currentItem.type === 'QUIZ') {
      handleNext()
      return
    }
    // Determine online status by attempting a lightweight check
    const online = await isOnline()
    const triggered = await triggerCheck(currentItem, online)
    if (!triggered) handleNext()
  }

  function onCheckComplete(_score?: number, _verdict?: string) {
    clearCheck()
    setQuizSelected(null)
    setQuizShowAnswer(false)
    handleNext()
  }

  function onQuizSelect(optionId: string) {
    setQuizSelected(optionId)
    setQuizShowAnswer(true)
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => endSession(false)}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const question = currentItem?.quiz_questions?.[0]
  const isLastItem = currentIndex >= items.length - 1
  const showNext = currentItem?.type !== 'QUIZ' || showAnswer

  return (
    <View style={styles.container}>
      <SessionHeader
        subjectName={subject_name}
        current={currentIndex + 1}
        total={items.length}
        onExit={() => endSession(false)}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentPad}>
        {!currentItem ? (
          <Text style={styles.empty}>Loading content...</Text>
        ) : checkState ? (
          <CheckRenderer
            checkState={checkState}
            onComplete={onCheckComplete}
            onSkip={() => { clearCheck(); handleNext() }}
            selectedOption={quizSelected}
            showAnswer={quizShowAnswer}
            onSelectOption={onQuizSelect}
          />
        ) : currentItem.type === 'QUIZ' && question ? (
          <QuizView
            questionText={question.question_text}
            options={question.options}
            selectedOption={selectedOption}
            showAnswer={showAnswer}
            correctOptionId={question.correct_option_id}
            explanation={question.explanation}
            onSelect={handleAnswer}
          />
        ) : (
          <ContentView title={currentItem.title} body={currentItem.body} />
        )}
      </ScrollView>

      {!checkState && showNext && (
        <TouchableOpacity style={styles.nextButton} onPress={handleNextWithCheck} disabled={loadingCheck}>
          {loadingCheck
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.nextText}>{isLastItem ? 'Finish Session ✓' : 'Next →'}</Text>
          }
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { flex: 1 },
  contentPad: { padding: 20 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
  errorText: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 24, lineHeight: 24 },
  errorButton: { backgroundColor: '#4f46e5', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  errorButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  nextButton: { backgroundColor: '#4f46e5', margin: 16, borderRadius: 12, padding: 16, alignItems: 'center' },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
