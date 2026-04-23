import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native'
import { router } from 'expo-router'

interface Subject {
  id: string
  name: string
}

interface Props {
  subjects: Subject[]
  onSelect?: (subject: Subject) => void // optional override
}

export function SubjectList({ subjects, onSelect }: Props) {
  const [selected, setSelected] = useState<Subject | null>(null)

  function handleSelect(subject: Subject) {
    if (onSelect) { onSelect(subject); return }
    setSelected(subject)
  }

  function startSession(mode: 'read' | 'audio' | 'voice') {
    if (!selected) return
    const params = { subject_id: selected.id, subject_name: selected.name }
    setSelected(null)
    if (mode === 'audio') {
      router.push({ pathname: '/(app)/audio-session', params })
    } else if (mode === 'voice') {
      router.push({ pathname: '/(app)/voice-tutor', params })
    } else {
      router.push({ pathname: '/(app)/session', params })
    }
  }

  if (subjects.length === 0) {
    return <Text style={styles.empty}>No subjects enrolled yet.</Text>
  }

  return (
    <>
      <View>
        {subjects.map(subject => (
          <TouchableOpacity key={subject.id} style={styles.card} onPress={() => handleSelect(subject)}>
            <Text style={styles.name}>{subject.name}</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mode picker modal */}
      <Modal visible={!!selected} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => setSelected(null)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{selected?.name}</Text>
          <Text style={styles.sheetSubtitle}>How do you want to study?</Text>

          <TouchableOpacity style={styles.modeBtn} onPress={() => startSession('read')}>
            <Text style={styles.modeIcon}>📖</Text>
            <View>
              <Text style={styles.modeName}>Read Mode</Text>
              <Text style={styles.modeDesc}>Text + quizzes · Works offline</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modeBtn} onPress={() => startSession('audio')}>
            <Text style={styles.modeIcon}>🔊</Text>
            <View>
              <Text style={styles.modeName}>Audio Lesson</Text>
              <Text style={styles.modeDesc}>Listen + tap answers · Works offline</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modeBtn} onPress={() => startSession('voice')}>
            <Text style={styles.modeIcon}>🎙️</Text>
            <View>
              <Text style={styles.modeName}>Voice Tutor</Text>
              <Text style={styles.modeDesc}>Conversational AI tutor · Requires internet</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  name: { fontSize: 16, color: '#1a1a2e', fontWeight: '500' },
  arrow: { fontSize: 18, color: '#4f46e5' },
  empty: { color: '#888', fontSize: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  sheetSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: '#f8f8fc', borderRadius: 12, marginBottom: 10 },
  modeIcon: { fontSize: 28 },
  modeName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  modeDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
})
