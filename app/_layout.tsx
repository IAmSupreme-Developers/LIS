import { useEffect } from 'react'
import { AppState } from 'react-native'
import { Stack, router, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '@/lib/auth-store'
import { syncPendingData } from '@/lib/sync-queue'

function AuthGate() {
  const { user, profile, isLoading } = useAuth()
  const segments = useSegments()

  // Sync pending data when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        syncPendingData().catch(() => {})
      }
    })
    return () => sub.remove()
  }, [])

  useEffect(() => {
    if (isLoading) return

    const inAuth = segments[0] === '(auth)'
    const inApp = segments[0] === '(app)'

    if (!user) {
      if (!inAuth) router.replace('/(auth)/login')
      return
    }

    // Logged in but onboarding not complete
    if (user && profile && !profile.onboarding_complete) {
      if (user.is_under_15 && !inAuth) {
        router.replace('/(auth)/parental-setup')
      } else if (!inAuth) {
        router.replace('/(auth)/onboarding')
      }
      return
    }

    // Logged in and complete — go to app
    if (user && profile?.onboarding_complete && !inApp) {
      router.replace('/(app)/dashboard')
    }
  }, [user, profile, isLoading, segments])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />
      <StatusBar style="auto" />
    </AuthProvider>
  )
}
