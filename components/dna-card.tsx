import { View, Text, StyleSheet } from 'react-native'

interface WeakFlag {
  topic: { name: string }
  accuracy_score: number
}

interface DNAProfile {
  is_ready: boolean
  preferred_mode: string | null
  optimal_hour_start: number | null
  optimal_hour_end: number | null
  avg_attention_span_mins: number
  weak_area_flags: WeakFlag[]
}

interface Props {
  dna: DNAProfile | null
}

function formatHour(hour: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM'
  return `${hour % 12 || 12}${suffix}`
}

export function DNACard({ dna }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Learning DNA</Text>

      {!dna?.is_ready ? (
        <Text style={styles.hint}>
          Complete 5 sessions to unlock your personalised Learning DNA profile.
        </Text>
      ) : (
        <>
          {dna.preferred_mode && (
            <Text style={styles.item}>🎯 Best mode: <Text style={styles.bold}>{dna.preferred_mode}</Text></Text>
          )}
          {dna.optimal_hour_start != null && (
            <Text style={styles.item}>
              ⏰ Peak time: <Text style={styles.bold}>
                {formatHour(dna.optimal_hour_start)}–{formatHour(dna.optimal_hour_end ?? dna.optimal_hour_start + 2)}
              </Text>
            </Text>
          )}
          {dna.avg_attention_span_mins > 0 && (
            <Text style={styles.item}>
              🧠 Attention span: <Text style={styles.bold}>{Math.round(dna.avg_attention_span_mins)} mins</Text>
            </Text>
          )}
          {dna.weak_area_flags.length > 0 && (
            <Text style={styles.item}>
              ⚠️ Needs work: <Text style={styles.bold}>{dna.weak_area_flags[0].topic.name}</Text>
            </Text>
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f46e5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  item: { fontSize: 15, color: '#333', marginBottom: 6 },
  bold: { fontWeight: '700', color: '#1a1a2e' },
  hint: { fontSize: 14, color: '#888', lineHeight: 22 },
})
