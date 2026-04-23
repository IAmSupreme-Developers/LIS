import * as SecureStore from 'expo-secure-store'
import * as Speech from 'expo-speech'
import { useEffect, useState } from 'react'

export interface SpeechPrefs {
  rate: number
  pitch: number
  language: string
  voiceIdentifier: string | null // device voice identifier
}

const DEFAULT_PREFS: SpeechPrefs = { rate: 0.9, pitch: 1.0, language: 'en', voiceIdentifier: null }
const KEY = 'speech_prefs'

export async function getSpeechPrefs(): Promise<SpeechPrefs> {
  try {
    const stored = await SecureStore.getItemAsync(KEY)
    return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

export async function saveSpeechPrefs(prefs: SpeechPrefs): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(prefs))
}

export function useSpeechPrefs() {
  const [prefs, setPrefs] = useState<SpeechPrefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSpeechPrefs().then(p => { setPrefs(p); setLoading(false) })
  }, [])

  async function update(partial: Partial<SpeechPrefs>) {
    const updated = { ...prefs, ...partial }
    setPrefs(updated)
    await saveSpeechPrefs(updated)
  }

  return { prefs, loading, update }
}
