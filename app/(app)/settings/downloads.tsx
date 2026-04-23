import { useEffect, useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/lib/auth-store'
import { getSubjects, prefetchSubjectContent, getDownloadStatus, DownloadStatus } from '@/lib/offline-cache'

interface SubjectWithStatus {
  id: string
  name: string
  status: DownloadStatus | null
  downloading: boolean
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function DownloadsScreen() {
  const { profile } = useAuth()
  const [subjects, setSubjects] = useState<SubjectWithStatus[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!profile?.form_level_id) return
    const subs = await getSubjects(profile.form_level_id)
    const withStatus = await Promise.all(
      subs.map(async s => ({
        id: s.id,
        name: s.name,
        status: await getDownloadStatus(s.id),
        downloading: false,
      }))
    )
    setSubjects(withStatus)
    setLoading(false)
  }, [profile?.form_level_id])

  useEffect(() => { load() }, [load])

  async function download(subjectId: string) {
    setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, downloading: true } : s))
    try {
      await prefetchSubjectContent(subjectId)
      // Refresh status after download
      const status = await getDownloadStatus(subjectId)
      setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, downloading: false, status } : s))
    } catch {
      Alert.alert('Download failed', 'Check your connection and try again.')
      setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, downloading: false } : s))
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Downloads</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.desc}>
        Download subjects for offline use. Already-viewed content is cached automatically.
        Use this to ensure full offline access.
      </Text>

      {loading ? (
        <ActivityIndicator color="#4f46e5" style={{ marginTop: 32 }} />
      ) : subjects.map(subject => {
        const hasData = (subject.status?.cached_sections ?? 0) > 0
        return (
          <View key={subject.id} style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.subjectName}>{subject.name}</Text>
              {hasData ? (
                <View>
                  <Text style={styles.statusText}>
                    ✓ {subject.status?.cached_sections} sections · {subject.status?.cached_content_items} items
                  </Text>
                  {subject.status?.last_updated && (
                    <Text style={styles.dateText}>Updated {formatDate(subject.status.last_updated)}</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.notDownloaded}>Not downloaded</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.btn, subject.downloading && styles.btnDisabled]}
              onPress={() => download(subject.id)}
              disabled={subject.downloading}
            >
              {subject.downloading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnText}>{hasData ? '↻ Update' : '↓ Download'}</Text>
              )}
            </TouchableOpacity>
          </View>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8fc' },
  content: { padding: 20, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  back: { color: '#4f46e5', fontSize: 15 },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  desc: { fontSize: 13, color: '#6b7280', lineHeight: 20, marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardInfo: { flex: 1 },
  subjectName: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 4 },
  statusText: { fontSize: 12, color: '#16a34a' },
  dateText: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  notDownloaded: { fontSize: 12, color: '#9ca3af' },
  btn: { backgroundColor: '#4f46e5', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, minWidth: 90, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#a5b4fc' },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
})
