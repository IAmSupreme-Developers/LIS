import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/lib/auth-store'

export default function ParentalSetupScreen() {
  const { parentalSetup } = useAuth()
  const [parentName, setParentName] = useState('')
  const [passcode, setPasscode] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSetup() {
    if (!parentName || !passcode) {
      Alert.alert('Missing fields', 'Please enter your name and a passcode')
      return
    }
    if (passcode.length < 4 || passcode.length > 6) {
      Alert.alert('Invalid passcode', 'Passcode must be 4–6 digits')
      return
    }
    if (passcode !== confirm) {
      Alert.alert('Passcode mismatch', 'Passcodes do not match')
      return
    }
    setLoading(true)
    try {
      await parentalSetup(parentName, passcode)
      router.replace('/(auth)/onboarding')
    } catch (e: any) {
      Alert.alert('Setup failed', e?.error?.message ?? 'Please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parent Setup</Text>
      <Text style={styles.subtitle}>
        Your child's account needs a parent passcode to protect settings.
        You'll need this to change subjects, export data, or delete the account.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Your name"
        value={parentName}
        onChangeText={setParentName}
        autoCapitalize="words"
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        placeholder="Set passcode (4–6 digits)"
        value={passcode}
        onChangeText={setPasscode}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm passcode"
        value={confirm}
        onChangeText={setConfirm}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        placeholderTextColor="#999"
      />

      <TouchableOpacity style={styles.button} onPress={handleSetup} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Set Passcode & Continue</Text>}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 12, color: '#1a1a2e' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 32, lineHeight: 22 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 16, color: '#1a1a2e' },
  button: { backgroundColor: '#4f46e5', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
