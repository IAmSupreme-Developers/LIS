import { useCallback, useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Modal, FlatList } from 'react-native'
import { router } from 'expo-router'
import { api } from '@/lib/api'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { DatePicker } from '@/components/date-picker'

// Minimal inline dropdown — same as register screen
interface Option { id: string; name: string }

function Dropdown({ label, value, options, onSelect, disabled, loading }: {
  label: string; value: Option | null; options: Option[]
  onSelect: (o: Option) => void; disabled?: boolean; loading?: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <TouchableOpacity style={[styles.dropdown, disabled && styles.dropdownDisabled]} onPress={() => !disabled && setOpen(true)} disabled={disabled}>
        <Text style={[styles.dropdownText, !value && styles.placeholder]}>{loading ? 'Loading...' : value ? value.name : label}</Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <FlatList data={options} keyExtractor={o => o.id} renderItem={({ item }) => (
            <TouchableOpacity style={styles.sheetItem} onPress={() => { onSelect(item); setOpen(false) }}>
              <Text style={[styles.sheetItemText, value?.id === item.id && styles.selected]}>{item.name}</Text>
            </TouchableOpacity>
          )} />
        </View>
      </Modal>
    </>
  )
}

export default function RegisterProfileScreen() {
  const [displayName, setDisplayName] = useState('')
  const [dob, setDob] = useState<Date | null>(null)
  const [countries, setCountries] = useState<Option[]>([])
  const [systems, setSystems] = useState<Option[]>([])
  const [levels, setLevels] = useState<Option[]>([])
  const [country, setCountry] = useState<Option | null>(null)
  const [system, setSystem] = useState<Option | null>(null)
  const [level, setLevel] = useState<Option | null>(null)
  const [loadingSystems, setLoadingSystems] = useState(false)
  const [loadingLevels, setLoadingLevels] = useState(false)
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchCountries = useCallback(async () => {
    setLoadingCountries(true)
    await api.get<{ countries: Option[] }>('/api/v1/curriculum/countries')
      .then(d => setCountries(d.countries))
      .catch(() => Alert.alert('Error', 'Could not load countries'))
      .finally(() => setLoadingCountries(false))
  }, [])

  useEffect(() => { fetchCountries() }, [fetchCountries])
  const { refreshControl } = usePullToRefresh(fetchCountries)

  async function handleCountrySelect(c: Option) {
    setCountry(c); setSystem(null); setLevel(null); setSystems([]); setLevels([])
    setLoadingSystems(true)
    await api.get<{ systems: Option[] }>(`/api/v1/curriculum/education-systems?country_id=${c.id}`)
      .then(d => setSystems(d.systems)).catch(() => Alert.alert('Error', 'Could not load systems'))
    setLoadingSystems(false)
  }

  async function handleSystemSelect(s: Option) {
    setSystem(s); setLevel(null); setLevels([])
    setLoadingLevels(true)
    await api.get<{ levels: Option[] }>(`/api/v1/curriculum/form-levels?system_id=${s.id}`)
      .then(d => setLevels(d.levels)).catch(() => Alert.alert('Error', 'Could not load levels'))
    setLoadingLevels(false)
  }

  async function handleSubmit() {
    if (!displayName || !dob || !country || !system || !level) {
      Alert.alert('Missing fields', 'Please complete all fields')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/api/v1/auth/setup', {
        display_name: displayName,
        date_of_birth: dob.toISOString().split('T')[0],
        country_id: country.id,
        education_system_id: system.id,
        form_level_id: level.id,
      })
      router.replace('/(auth)/onboarding')
    } catch (e: any) {
      Alert.alert('Error', e?.error?.message ?? 'Please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={refreshControl}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>Your account exists but your profile needs to be set up again.</Text>

      <TextInput style={styles.input} placeholder="Your name" value={displayName}
        onChangeText={setDisplayName} autoCapitalize="words" placeholderTextColor="#999" />
      <DatePicker value={dob} onChange={setDob} />

      <Text style={styles.sectionLabel}>Where are you studying?</Text>
      <Dropdown label="Select country" value={country} options={countries} onSelect={handleCountrySelect} loading={loadingCountries} disabled={loadingCountries} />
      <Dropdown label={country ? `Education system in ${country.name}` : 'Select country first'} value={system} options={systems} onSelect={handleSystemSelect} disabled={!country || loadingSystems} loading={loadingSystems} />
      <Dropdown label={system ? `Form / Year in ${country?.name} ${system.name}` : 'Select system first'} value={level} options={levels} onSelect={setLevel} disabled={!system || loadingLevels} loading={loadingLevels} />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Profile</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8, color: '#1a1a2e' },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 28, lineHeight: 22 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16, color: '#1a1a2e' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 10 },
  dropdown: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownDisabled: { backgroundColor: '#f9f9f9', borderColor: '#eee' },
  dropdownText: { fontSize: 16, color: '#1a1a2e', flex: 1 },
  placeholder: { color: '#999' },
  chevron: { color: '#888', fontSize: 14 },
  button: { backgroundColor: '#4f46e5', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
  sheetItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sheetItemText: { fontSize: 16, color: '#333' },
  selected: { color: '#4f46e5', fontWeight: '700' },
})
