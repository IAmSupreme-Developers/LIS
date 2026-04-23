import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface Props {
  onComplete: (understood: boolean) => void
}

export function SelfAssessCheck({ onComplete }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>💭 Quick Check</Text>
      </View>
      <Text style={styles.question}>Did you understand this section?</Text>
      <Text style={styles.hint}>Be honest — it helps the system adjust for you.</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, styles.noBtn]} onPress={() => onComplete(false)}>
          <Text style={styles.noText}>😕 Not really</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.yesBtn]} onPress={() => onComplete(true)}>
          <Text style={styles.yesText}>✓ Got it!</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 4 },
  badge: { backgroundColor: '#ede9fe', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 14 },
  badgeText: { color: '#4f46e5', fontSize: 12, fontWeight: '600' },
  question: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  hint: { fontSize: 13, color: '#6b7280', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  noBtn: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5' },
  yesBtn: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac' },
  noText: { fontSize: 15, fontWeight: '600', color: '#dc2626' },
  yesText: { fontSize: 15, fontWeight: '600', color: '#16a34a' },
})
