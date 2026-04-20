import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface DNAProfile {
  is_ready: boolean
  preferred_mode: string | null
  optimal_hour_start: number | null
  optimal_hour_end: number | null
  avg_attention_span_mins: number
  weak_area_flags: { topic: { name: string }; accuracy_score: number }[]
}

interface Subject {
  id: string
  name: string
  code: string
}

export function useDashboard(formLevelId: string) {
  const [dna, setDna] = useState<DNAProfile | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [dnaRes, subjectsRes] = await Promise.allSettled([
      api.get<{ dna: DNAProfile | null }>('/api/v1/dna'),
      api.get<{ subjects: Subject[] }>(`/api/v1/curriculum/subjects?form_level_id=${formLevelId}`),
    ])
    if (dnaRes.status === 'fulfilled') setDna(dnaRes.value.dna)
    if (subjectsRes.status === 'fulfilled') setSubjects(subjectsRes.value.subjects ?? [])
  }, [formLevelId])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  return { dna, subjects, loading, reload: load }
}
