import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface Subject {
  id: string
  name: string
}

interface Props {
  subjects: Subject[]
  onSelect: (subject: Subject) => void
}

export function SubjectList({ subjects, onSelect }: Props) {
  if (subjects.length === 0) {
    return <Text style={styles.empty}>No subjects enrolled yet.</Text>
  }

  return (
    <View>
      {subjects.map(subject => (
        <TouchableOpacity
          key={subject.id}
          style={styles.card}
          onPress={() => onSelect(subject)}
        >
          <Text style={styles.name}>{subject.name}</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  name: { fontSize: 16, color: '#1a1a2e', fontWeight: '500' },
  arrow: { fontSize: 18, color: '#4f46e5' },
  empty: { color: '#888', fontSize: 14 },
})
