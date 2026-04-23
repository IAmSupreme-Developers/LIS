import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, Modal, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import Slider from '@react-native-community/slider'
import * as Speech from 'expo-speech'
import { useSpeechPrefs } from '@/lib/speech-prefs'

interface Voice {
  identifier: string
  name: string
  language: string
  quality?: string
}

export default function SpeechSettingsScreen() {
  const { prefs, loading, update } = useSpeechPrefs()
  const [voices, setVoices] = useState<Voice[]>([])
  const [loadingVoices, setLoadingVoices] = useState(true)
  const [showVoicePicker, setShowVoicePicker] = useState(false)

  useEffect(() => {
    Speech.getAvailableVoicesAsync()
      .then(v => {
        // Filter to English voices and sort by name
        const english = v
          .filter(voice => voice.language.startsWith('en'))
          .sort((a, b) => a.name.localeCompare(b.name))
        setVoices(english)
      })
      .catch(() => setVoices([]))
      .finally(() => setLoadingVoices(false))
  }, [])

  const selectedVoice = voices.find(v => v.identifier === prefs.voiceIdentifier)

  function testVoice() {
    Speech.stop()
    Speech.speak('This is how I will sound during audio lessons.', {
      language: prefs.language,
      rate: prefs.rate,
      pitch: prefs.pitch,
      ...(prefs.voiceIdentifier ? { voice: prefs.voiceIdentifier } : {}),
    })
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#4f46e5" /></View>

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Speech Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Voice picker */}
      <View style={styles.card}>
        <Text style={styles.label}>Voice</Text>
        <TouchableOpacity style={styles.voiceSelector} onPress={() => setShowVoicePicker(true)}>
          <View>
            <Text style={styles.voiceName}>{selectedVoice?.name ?? 'Default'}</Text>
            <Text style={styles.voiceLang}>{selectedVoice?.language ?? 'System default'}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Speed */}
      <View style={styles.card}>
        <Text style={styles.label}>Speed</Text>
        <Text style={styles.value}>{prefs.rate.toFixed(1)}x</Text>
        <Slider
          style={styles.slider}
          minimumValue={0.5}
          maximumValue={1.5}
          step={0.1}
          value={prefs.rate}
          onValueChange={v => update({ rate: parseFloat(v.toFixed(1)) })}
          minimumTrackTintColor="#4f46e5"
          maximumTrackTintColor="#e5e7eb"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderHint}>Slow</Text>
          <Text style={styles.sliderHint}>Normal</Text>
          <Text style={styles.sliderHint}>Fast</Text>
        </View>
      </View>

      {/* Pitch */}
      <View style={styles.card}>
        <Text style={styles.label}>Pitch</Text>
        <Text style={styles.value}>{prefs.pitch.toFixed(1)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0.7}
          maximumValue={1.3}
          step={0.1}
          value={prefs.pitch}
          onValueChange={v => update({ pitch: parseFloat(v.toFixed(1)) })}
          minimumTrackTintColor="#4f46e5"
          maximumTrackTintColor="#e5e7eb"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderHint}>Lower</Text>
          <Text style={styles.sliderHint}>Normal</Text>
          <Text style={styles.sliderHint}>Higher</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.testBtn} onPress={testVoice}>
        <Text style={styles.testText}>🔊 Test Voice</Text>
      </TouchableOpacity>

      {/* Voice picker modal */}
      <Modal visible={showVoicePicker} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => setShowVoicePicker(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Select Voice</Text>
          {loadingVoices ? (
            <ActivityIndicator color="#4f46e5" style={{ marginVertical: 20 }} />
          ) : voices.length === 0 ? (
            <Text style={styles.noVoices}>No English voices found on this device.</Text>
          ) : (
            <FlatList
              data={[{ identifier: null, name: 'Default', language: 'System default' } as any, ...voices]}
              keyExtractor={v => v.identifier ?? 'default'}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.voiceItem, prefs.voiceIdentifier === item.identifier && styles.voiceItemSelected]}
                  onPress={() => { update({ voiceIdentifier: item.identifier, language: item.language ?? prefs.language }); setShowVoicePicker(false) }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.voiceItemName, prefs.voiceIdentifier === item.identifier && styles.voiceItemNameSelected]}>
                      {item.name}
                    </Text>
                    <Text style={styles.voiceItemLang}>{item.language}</Text>
                  </View>
                  {prefs.voiceIdentifier === item.identifier && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8fc' },
  content: { padding: 20, paddingTop: 56 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  back: { color: '#4f46e5', fontSize: 15 },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  label: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  value: { fontSize: 22, fontWeight: '700', color: '#4f46e5', marginBottom: 4 },
  slider: { width: '100%', height: 40 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderHint: { fontSize: 11, color: '#9ca3af' },
  voiceSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f8fc', borderRadius: 10, padding: 14 },
  voiceName: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  voiceLang: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  chevron: { fontSize: 20, color: '#9ca3af' },
  testBtn: { backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  testText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
  noVoices: { color: '#6b7280', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  voiceItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  voiceItemSelected: { backgroundColor: '#f5f3ff' },
  voiceItemName: { fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
  voiceItemNameSelected: { color: '#4f46e5', fontWeight: '700' },
  voiceItemLang: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  checkmark: { color: '#4f46e5', fontSize: 16, fontWeight: '700' },
})
