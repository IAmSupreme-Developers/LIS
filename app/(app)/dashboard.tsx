import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useCallback } from 'react'
import { router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '@/lib/auth-store'
import { useDashboard } from '@/hooks/use-dashboard'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { ProfileBadge } from '@/components/profile-badge'
import { DNACard } from '@/components/dna-card'
import { SubjectList } from '@/components/subject-list'

export default function DashboardScreen() {
  const { profile, logout } = useAuth()
  const { dna, subjects, loading, offline, reload } = useDashboard(profile?.form_level_id ?? '')
  const { refreshControl } = usePullToRefresh(reload)

  // Reload subjects when returning from edit profile
  useFocusEffect(useCallback(() => { reload() }, [profile?.form_level_id]))

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={refreshControl}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{profile?.display_name}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(app)/settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ProfileBadge
        country={profile?.country ?? ''}
        educationSystem={profile?.education_system ?? ''}
        formYear={profile?.form_year ?? ''}
      />

      {offline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📶 Offline — showing cached content</Text>
        </View>
      )}

      <DNACard dna={dna} />

      <TouchableOpacity style={styles.reportsBtn} onPress={() => router.push('/(app)/reports')}>
        <Text style={styles.reportsBtnText}>📊 View Full Reports →</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Your Subjects</Text>
      <SubjectList subjects={subjects} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8fc' },
  content: { padding: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  greeting: { fontSize: 14, color: '#888' },
  name: { fontSize: 24, fontWeight: '700', color: '#1a1a2e' },
  logout: { color: '#4f46e5', fontSize: 14, marginTop: 4 },
  settingsIcon: { fontSize: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  reportsBtn: { backgroundColor: '#ede9fe', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 20 },
  reportsBtnText: { color: '#4f46e5', fontSize: 14, fontWeight: '600' },
  offlineBanner: { backgroundColor: '#fef3c7', borderRadius: 8, padding: 10, marginBottom: 12 },
  offlineText: { fontSize: 13, color: '#92400e', textAlign: 'center' },
  offlineBanner: { backgroundColor: '#fef3c7', borderRadius: 8, padding: 10, marginBottom: 12 },
  offlineText: { fontSize: 13, color: '#92400e', textAlign: 'center' },
})
