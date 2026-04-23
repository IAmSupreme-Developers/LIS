import { CheckState } from '@/hooks/use-comprehension-check'
import { ComprehensionCheck } from './comprehension-check'
import { QuizView } from './quiz-view'
import { SelfAssessCheck } from './self-assess-check'
import { View, Text, StyleSheet } from 'react-native'

interface Props {
  checkState: CheckState
  onComplete: (score?: number, verdict?: string) => void
  onSkip: () => void
  // For quiz type
  selectedOption?: string | null
  showAnswer?: boolean
  onSelectOption?: (id: string) => void
}

export function CheckRenderer({ checkState, onComplete, onSkip, selectedOption, showAnswer, onSelectOption }: Props) {
  if (checkState.type === 'ai') {
    return (
      <ComprehensionCheck
        question={checkState.question!}
        sectionName={checkState.sectionName!}
        contentContext={checkState.contentContext!}
        onComplete={onComplete}
        onSkip={onSkip}
      />
    )
  }

  if (checkState.type === 'quiz' && checkState.quizQuestion) {
    const q = checkState.quizQuestion
    return (
      <View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>📝 Quick Quiz (Offline)</Text>
        </View>
        <QuizView
          questionText={q.question_text}
          options={q.options}
          selectedOption={selectedOption ?? null}
          showAnswer={showAnswer ?? false}
          correctOptionId={q.correct_option_id}
          explanation={q.explanation}
          onSelect={id => onSelectOption?.(id)}
        />
        {showAnswer && (
          <View style={styles.continueRow}>
            <Text
              style={styles.continueBtn}
              onPress={() => onComplete(selectedOption === q.correct_option_id ? 100 : 30, selectedOption === q.correct_option_id ? 'correct' : 'incorrect')}
            >
              Continue →
            </Text>
          </View>
        )}
      </View>
    )
  }

  if (checkState.type === 'self_assess') {
    return (
      <SelfAssessCheck
        onComplete={understood => onComplete(understood ? 100 : 30, understood ? 'correct' : 'incorrect')}
      />
    )
  }

  return null
}

const styles = StyleSheet.create({
  badge: { backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 14 },
  badgeText: { color: '#92400e', fontSize: 12, fontWeight: '600' },
  continueRow: { marginTop: 12, alignItems: 'flex-end' },
  continueBtn: { color: '#4f46e5', fontSize: 15, fontWeight: '700', padding: 8 },
})
