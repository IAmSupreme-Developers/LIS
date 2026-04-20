import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface Props {
  subjectName: string
  current: number
  total: number
  onExit: () => void
}

export function SessionHeader({ subjectName, current, total, onExit }: Props) {
  const progress = total > 0 ? (current / total) * 100 : 0

  return (
    <>
      <View style={styles.row}>
        <TouchableOpacity onPress={onExit}>
          <Text style={styles.exit}>✕ Exit</Text>
        </TouchableOpacity>
        <Text style={styles.progress}>{current} / {total}</Text>
        <Text style={styles.subject}>{subjectName}</Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${progress}%` }]} />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 56,
  },
  exit: { color: '#888', fontSize: 16 },
  progress: { fontSize: 14, color: '#888' },
  subject: { fontSize: 13, color: '#4f46e5', fontWeight: '600' },
  bar: { height: 4, backgroundColor: '#ede9fe', marginHorizontal: 16 },
  fill: { height: 4, backgroundColor: '#4f46e5', borderRadius: 2 },
})
