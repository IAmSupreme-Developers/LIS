import * as SecureStore from 'expo-secure-store'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:3000'

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('access_token')
  } catch {
    return null
  }
}

async function refreshTokens(): Promise<boolean> {
  try {
    const refresh_token = await SecureStore.getItemAsync('refresh_token')
    if (!refresh_token) return false

    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    })

    if (!res.ok) return false

    const data = await res.json()
    await SecureStore.setItemAsync('access_token', data.access_token)
    await SecureStore.setItemAsync('refresh_token', data.refresh_token)
    return true
  } catch {
    return false
  }
}

async function request<T>(path: string, options: RequestInit = {}, skipAuth = false): Promise<T> {
  const token = skipAuth ? null : await getToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401 && !skipAuth) {
    const refreshed = await refreshTokens()
    if (refreshed) {
      const newToken = await getToken()
      const retry = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...options.headers,
        },
      })
      if (!retry.ok) throw await retry.json()
      return retry.json()
    }
    throw { error: { code: 'UNAUTHORIZED' } }
  }

  if (!res.ok) throw await res.json()
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  // For public endpoints that don't need auth (called before login)
  publicGet: <T>(path: string) => request<T>(path, {}, true),
  publicPost: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, true),
}
