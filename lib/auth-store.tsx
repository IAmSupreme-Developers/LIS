import * as SecureStore from 'expo-secure-store'
import { api } from './api'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface Profile {
  id: string
  display_name: string
  country: string
  education_system: string
  form_year: string
  form_level_id: string
  onboarding_complete: boolean
}

interface AuthUser {
  id: string
  email: string
  is_under_15: boolean
}

interface AuthState {
  user: AuthUser | null
  profile: Profile | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<{ requires_parental_setup: boolean }>
  parentalSetup: (parent_name: string, passcode: string) => Promise<void>
  logout: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  display_name: string
  date_of_birth: string
  country_id: string
  education_system_id: string
  form_level_id: string
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Restore session on app start
    ;(async () => {
      try {
        const token = await SecureStore.getItemAsync('access_token')
        const stored = await SecureStore.getItemAsync('lis_user')
        const storedProfile = await SecureStore.getItemAsync('lis_profile')
        if (token && stored) {
          setUser(JSON.parse(stored))
          if (storedProfile) setProfile(JSON.parse(storedProfile))
        }
      } catch {}
      setIsLoading(false)
    })()
  }, [])

  async function login(email: string, password: string) {
    const data = await api.publicPost<{
      access_token: string
      refresh_token: string
      user?: AuthUser
      profile?: Profile
      error?: { code: string }
    }>('/api/v1/auth/login', { email, password })

    // Store tokens regardless — needed for profile setup if PROFILE_MISSING
    await SecureStore.setItemAsync('access_token', data.access_token)
    await SecureStore.setItemAsync('refresh_token', data.refresh_token)

    if (data.error?.code === 'PROFILE_MISSING') {
      // Auth succeeded but no DB profile — signal app to complete setup
      throw { error: { code: 'PROFILE_MISSING' } }
    }

    await SecureStore.setItemAsync('lis_user', JSON.stringify(data.user))
    await SecureStore.setItemAsync('lis_profile', JSON.stringify(data.profile))
    setUser(data.user!)
    setProfile(data.profile!)
  }

  async function register(registerData: RegisterData) {
    const data = await api.publicPost<{
      user: AuthUser
      profile: Profile
      requires_parental_setup: boolean
    }>('/api/v1/auth/register', registerData)

    await SecureStore.setItemAsync('lis_user', JSON.stringify(data.user))
    await SecureStore.setItemAsync('lis_profile', JSON.stringify(data.profile))
    setUser(data.user)
    setProfile(data.profile)
    return { requires_parental_setup: data.requires_parental_setup }
  }

  async function parentalSetup(parent_name: string, passcode: string) {
    await api.post('/api/v1/auth/parental-setup', { parent_name, passcode })
    if (profile) {
      const updated = { ...profile, onboarding_complete: true }
      await SecureStore.setItemAsync('lis_profile', JSON.stringify(updated))
      setProfile(updated)
    }
  }

  async function logout() {
    await SecureStore.deleteItemAsync('access_token')
    await SecureStore.deleteItemAsync('refresh_token')
    await SecureStore.deleteItemAsync('lis_user')
    await SecureStore.deleteItemAsync('lis_profile')
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, login, register, parentalSetup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
