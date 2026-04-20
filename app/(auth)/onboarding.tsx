import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/lib/auth-store'

export default function OnboardingScreen() {
  const { profile } = useAuth()

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎓</Text>
      <Text style={styles.title}>Welcome, {profile?.display_name ?? 'Learner'}!</Text>
      <Text style={styles.subtitle}>
        LIS will learn how you study and personalise every session to help you perform your best.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your profile</Text>
        <Text style={styles.cardItem}>📍 {profile?.country}</Text>
        <Text style={styles.cardItem}>🎒 {profile?.education_system} · {profile?.form_year}</Text>
      </View>

      <Text style={styles.hint}>
        Complete at least 5 sessions and LIS will generate your Learning DNA — a personalised map of how you learn best.
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => router.replace('/(app)/dashboard')}>
        <Text style={styles.buttonText}>Start Learning</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  emoji: { fontSize: 56, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', color: '#1a1a2e', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 24, marginBottom: 28 },
  card: { backgroundColor: '#f5f3ff', borderRadius: 12, padding: 16, marginBottom: 24 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#4f46e5', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardItem: { fontSize: 15, color: '#1a1a2e', marginBottom: 4 },
  hint: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  button: { backgroundColor: '#4f46e5', borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
