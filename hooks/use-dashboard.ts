import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getSubjects, LocalSubject } from '@/lib/offline-cache'

interface DNAProfile {
  is_ready: boolean
  preferred_mode: string | null
  optimal_hour_start: number | null
  optimal_hour_end: number | null
  avg_attention_span_mins: number
  weak_area_flags: { section: { name: string }; accuracy_score: number }[]
}

export function useDashboard(formLevelId: string) {
  const [dna, setDna] = useState<DNAProfile | null>(null)
  const [subjects, setSubjects] = useState<LocalSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)

  const load = useCallback(async () => {
    if (!formLevelId) return

    // DNA — API only (no offline cache needed, just skip if unavailable)
    api.get<{ dna: DNAProfile | null }>('/api/v1/dna')
      .then(d => setDna(d.dna))
      .catch(() => {}) // silent fail

    // Subjects — API first, SQLite fallback
    try {
      const result = await getSubjects(formLevelId)
      setSubjects(result)
      setOffline(false)
    } catch {
      setOffline(true)
    }
  }, [formLevelId])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  return { dna, subjects, loading, offline, reload: load }
}
