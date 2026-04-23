import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/lib/auth-store'

const SETTINGS_ITEMS = [
  { icon: '👤', label: 'Profile', desc: 'Name, education level', route: '/(app)/edit-profile' },
  { icon: '🔊', label: 'Speech', desc: 'Voice speed, pitch, language', route: '/(app)/settings/speech' },
  { icon: '📥', label: 'Downloads', desc: 'Manage offline content', route: '/(app)/settings/downloads' },
  { icon: '📋', label: 'Session History', desc: 'Past sessions and scores', route: '/(app)/settings/history' },
  { icon: '🔐', label: 'Account', desc: 'Password, delete account', route: '/(app)/settings/account' },
]

export default function SettingsScreen() {
  const { profile } = useAuth()

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Profile summary */}
      <View style={styles.profileCard}>
        <Text style={styles.profileName}>{profile?.display_name}</Text>
        <Text style={styles.profileSub}>{profile?.education_system} · {profile?.form_year} · {profile?.country}</Text>
      </View>

      {/* Settings items */}
      {SETTINGS_ITEMS.map(item => (
        <TouchableOpacity key={item.route} style={styles.item} onPress={() => router.push(item.route as any)}>
          <Text style={styles.itemIcon}>{item.icon}</Text>
          <View style={styles.itemText}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            <Text style={styles.itemDesc}>{item.desc}</Text>
          </View>
          <Text style={styles.itemArrow}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8fc' },
  content: { padding: 20, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  back: { color: '#4f46e5', fontSize: 15 },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  profileCard: { backgroundColor: '#4f46e5', borderRadius: 14, padding: 20, marginBottom: 24 },
  profileName: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  profileSub: { fontSize: 13, color: '#c7d2fe' },
  item: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  itemIcon: { fontSize: 24, marginRight: 14 },
  itemText: { flex: 1 },
  itemLabel: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  itemDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  itemArrow: { fontSize: 20, color: '#9ca3af' },
})
