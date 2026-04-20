import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/lib/auth-store'
import { useDashboard } from '@/hooks/use-dashboard'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { ProfileBadge } from '@/components/profile-badge'
import { DNACard } from '@/components/dna-card'
import { SubjectList } from '@/components/subject-list'

export default function DashboardScreen() {
  const { profile, logout } = useAuth()
  const { dna, subjects, loading, reload } = useDashboard(profile?.form_level_id ?? '')
  const { refreshControl } = usePullToRefresh(reload)

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
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <ProfileBadge
        country={profile?.country ?? ''}
        educationSystem={profile?.education_system ?? ''}
        formYear={profile?.form_year ?? ''}
      />

      <DNACard dna={dna} />

      <Text style={styles.sectionTitle}>Your Subjects</Text>
      <SubjectList
        subjects={subjects}
        onSelect={subject =>
          router.push({ pathname: '/(app)/session', params: { subject_id: subject.id, subject_name: subject.name } })
        }
      />
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
})
