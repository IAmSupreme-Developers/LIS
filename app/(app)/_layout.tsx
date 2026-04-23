import { Stack } from 'expo-router'

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="session" />
      <Stack.Screen name="audio-session" />
      <Stack.Screen name="voice-tutor" />
      <Stack.Screen name="session-summary" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="settings" />
    </Stack>
  )
}
