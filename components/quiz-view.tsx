import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface Option {
  id: string
  text: string
}

interface Props {
  questionText: string
  options: Option[]
  selectedOption: string | null
  showAnswer: boolean
  correctOptionId: string
  explanation: string | null
  onSelect: (optionId: string) => void
}

function optionBackground(optionId: string, selectedOption: string | null, showAnswer: boolean, correctOptionId: string) {
  if (!showAnswer) return '#fff'
  if (optionId === correctOptionId) return '#d1fae5'
  if (optionId === selectedOption) return '#fee2e2'
  return '#fff'
}

export function QuizView({ questionText, options, selectedOption, showAnswer, correctOptionId, explanation, onSelect }: Props) {
  return (
    <View>
      <Text style={styles.question}>{questionText}</Text>

      {options.map(opt => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.option, { backgroundColor: optionBackground(opt.id, selectedOption, showAnswer, correctOptionId) }]}
          onPress={() => onSelect(opt.id)}
          disabled={showAnswer}
        >
          <Text style={styles.optionText}>{opt.text}</Text>
        </TouchableOpacity>
      ))}

      {showAnswer && explanation && (
        <View style={styles.explanation}>
          <Text style={styles.explanationText}>{explanation}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  question: { fontSize: 18, fontWeight: '600', color: '#1a1a2e', marginBottom: 20, lineHeight: 26 },
  option: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, marginBottom: 10 },
  optionText: { fontSize: 15, color: '#1a1a2e' },
  explanation: { backgroundColor: '#f0fdf4', borderRadius: 10, padding: 14, marginTop: 8 },
  explanationText: { fontSize: 14, color: '#166534', lineHeight: 22 },
})
