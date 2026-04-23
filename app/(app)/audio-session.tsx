import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useSession } from '@/hooks/use-session'
import { useAudioSession } from '@/hooks/use-audio-session'
import { useComprehensionCheck } from '@/hooks/use-comprehension-check'
import { SessionHeader } from '@/components/session-header'
import { CheckRenderer } from '@/components/check-renderer'
import { isOnline } from '@/lib/network'

export default function AudioSessionScreen() {
  const { subject_id, subject_name } = useLocalSearchParams<{ subject_id: string; subject_name: string }>()
  const {
    loading, error, items, currentIndex, currentItem,
    selectedOption, showAnswer,
    handleAnswer, handleNext, endSession,
  } = useSession(subject_id)

  const { speaking, paused, speakItem, speakFeedback, replay, pause, resume, stop } = useAudioSession()
  const { checkState, triggerCheck, clearCheck } = useComprehensionCheck()
  const [quizSelected, setQuizSelected] = useState<string | null>(null)
  const [quizShowAnswer, setQuizShowAnswer] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(false)

  const question = currentItem?.quiz_questions?.[0]
  const isLastItem = currentIndex >= items.length - 1

  // Speak current item when it changes
  useEffect(() => {
    if (!currentItem || loading) return
    speakItem(currentItem, async () => {
      if (currentItem.type !== 'QUIZ') {
        // Check online status and trigger comprehension check
        const isOnlineNow = await isOnline()
        const triggered = await triggerCheck(currentItem, isOnlineNow)
        if (!triggered) setAutoAdvance(true)
      }
    })
  }, [currentItem?.id, loading])

  // Auto-advance after content is spoken
  useEffect(() => {
    if (!autoAdvance) return
    setAutoAdvance(false)
    const t = setTimeout(() => handleNext(), 1500)
    return () => clearTimeout(t)
  }, [autoAdvance])

  function onSelectAnswer(optionId: string) {
    handleAnswer(optionId)
    const correct = optionId === question?.correct_option_id
    speakFeedback(correct, question?.explanation ?? null, () => {
      setTimeout(() => handleNext(), 800)
    })
  }

  function onCheckComplete() {
    clearCheck()
    setQuizSelected(null)
    setQuizShowAnswer(false)
    handleNext()
  }

  function onQuizSelect(optionId: string) {
    setQuizSelected(optionId)
    setQuizShowAnswer(true)
    const correct = optionId === checkState?.quizQuestion?.correct_option_id
    speakFeedback(correct, checkState?.quizQuestion?.explanation ?? null, () => {})
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => endSession(false)}>
          <Text style={styles.btnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SessionHeader
        subjectName={subject_name}
        current={currentIndex + 1}
        total={items.length}
        onExit={() => { stop(); endSession(false) }}
      />

      <View style={styles.content}>
        {/* Speaking indicator */}
        <View style={styles.speakerBox}>
          <Text style={styles.speakerIcon}>
            {paused ? '⏸️' : speaking ? '🔊' : '🔈'}
          </Text>
          <Text style={styles.speakerLabel}>
            {paused ? 'Paused — tap Resume' : speaking ? 'Speaking...' : 'Tap to replay'}
          </Text>
        </View>

        {/* Comprehension check overlay */}
        {checkState && (
          <CheckRenderer
            checkState={checkState}
            onComplete={onCheckComplete}
            onSkip={() => { clearCheck(); handleNext() }}
            selectedOption={quizSelected}
            showAnswer={quizShowAnswer}
            onSelectOption={onQuizSelect}
          />
        )}

        {/* Content title */}
        {!checkState && currentItem && (
          <Text style={styles.contentTitle}>{currentItem.title}</Text>
        )}

        {/* Quiz options — shown when current item is a quiz */}
        {currentItem?.type === 'QUIZ' && question && !showAnswer && (
          <View style={styles.optionsContainer}>
            <Text style={styles.optionsLabel}>Tap your answer:</Text>
            <View style={styles.optionsGrid}>
              {question.options.map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  style={styles.optionBtn}
                  onPress={() => onSelectAnswer(opt.id)}
                >
                  <Text style={styles.optionId}>{opt.id.toUpperCase()}</Text>
                  <Text style={styles.optionText}>{opt.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Answer result */}
        {showAnswer && question && (
          <View style={[styles.resultBox, selectedOption === question.correct_option_id ? styles.correct : styles.incorrect]}>
            <Text style={styles.resultText}>
              {selectedOption === question.correct_option_id ? '✓ Correct!' : '✗ Incorrect'}
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.replayBtn} onPress={() => replay()}>
          <Text style={styles.replayText}>↺ Replay</Text>
        </TouchableOpacity>

        {speaking && (
          <TouchableOpacity style={styles.pauseBtn} onPress={pause}>
            <Text style={styles.pauseText}>⏸ Pause</Text>
          </TouchableOpacity>
        )}

        {paused && (
          <TouchableOpacity style={styles.pauseBtn} onPress={resume}>
            <Text style={styles.pauseText}>▶ Resume</Text>
          </TouchableOpacity>
        )}

        {currentItem?.type !== 'QUIZ' && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextText}>{isLastItem ? 'Finish ✓' : 'Next →'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  speakerBox: { alignItems: 'center', marginBottom: 32 },
  speakerIcon: { fontSize: 56 },
  speakerLabel: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  contentTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', marginBottom: 24 },
  optionsContainer: { width: '100%' },
  optionsLabel: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 12 },
  optionsGrid: { gap: 10 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8fc', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  optionId: { fontSize: 16, fontWeight: '700', color: '#4f46e5', width: 28 },
  optionText: { fontSize: 15, color: '#1a1a2e', flex: 1 },
  resultBox: { padding: 16, borderRadius: 12, marginTop: 16, width: '100%', alignItems: 'center' },
  correct: { backgroundColor: '#d1fae5' },
  incorrect: { backgroundColor: '#fee2e2' },
  resultText: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  controls: { flexDirection: 'row', padding: 16, gap: 12 },
  replayBtn: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, padding: 14, alignItems: 'center' },
  replayText: { fontSize: 15, color: '#374151', fontWeight: '600' },
  pauseBtn: { flex: 1, backgroundColor: '#fef3c7', borderRadius: 12, padding: 14, alignItems: 'center' },
  pauseText: { fontSize: 15, color: '#92400e', fontWeight: '600' },
  nextBtn: { flex: 2, backgroundColor: '#4f46e5', borderRadius: 12, padding: 14, alignItems: 'center' },
  nextText: { fontSize: 15, color: '#fff', fontWeight: '600' },
  btn: { backgroundColor: '#4f46e5', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  errorText: { fontSize: 16, color: '#555', textAlign: 'center', lineHeight: 24 },
})
