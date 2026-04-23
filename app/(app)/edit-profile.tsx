'use client'
import { useCallback, useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/lib/auth-store'
import { api } from '@/lib/api'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { getErrorMessage } from '@/lib/errors'

interface Option { id: string; name: string }

function Dropdown({ label, value, options, onSelect, disabled }: {
  label: string; value: Option | null; options: Option[]
  onSelect: (o: Option) => void; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const { Modal, FlatList } = require('react-native')
  return (
    <>
      <TouchableOpacity style={[styles.dropdown, disabled && styles.dropdownDisabled]} onPress={() => !disabled && setOpen(true)} disabled={disabled}>
        <Text style={[styles.dropdownText, !value && styles.placeholder]}>{value ? value.name : label}</Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <FlatList data={options} keyExtractor={(o: Option) => o.id} renderItem={({ item }: { item: Option }) => (
            <TouchableOpacity style={styles.sheetItem} onPress={() => { onSelect(item); setOpen(false) }}>
              <Text style={[styles.sheetItemText, value?.id === item.id && styles.selected]}>{item.name}</Text>
            </TouchableOpacity>
          )} />
        </View>
      </Modal>
    </>
  )
}

export default function EditProfileScreen() {
  const { profile, refreshProfile, logout } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [countries, setCountries] = useState<Option[]>([])
  const [systems, setSystems] = useState<Option[]>([])
  const [levels, setLevels] = useState<Option[]>([])
  const [country, setCountry] = useState<Option | null>(null)
  const [system, setSystem] = useState<Option | null>(null)
  const [level, setLevel] = useState<Option | null>(null)
  const [loadingSystems, setLoadingSystems] = useState(false)
  const [loadingLevels, setLoadingLevels] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchCountries = useCallback(async () => {
    const d = await api.publicGet<{ countries: Option[] }>('/api/v1/curriculum/countries')
    setCountries(d.countries)
  }, [])

  useEffect(() => { fetchCountries() }, [fetchCountries])
  const { refreshControl } = usePullToRefresh(fetchCountries)

  async function handleCountrySelect(c: Option) {
    setCountry(c); setSystem(null); setLevel(null); setSystems([]); setLevels([])
    setLoadingSystems(true)
    const d = await api.publicGet<{ systems: Option[] }>(`/api/v1/curriculum/education-systems?country_id=${c.id}`)
    setSystems(d.systems)
    setLoadingSystems(false)
  }

  async function handleSystemSelect(s: Option) {
    setSystem(s); setLevel(null); setLevels([])
    setLoadingLevels(true)
    const d = await api.publicGet<{ levels: Option[] }>(`/api/v1/curriculum/form-levels?system_id=${s.id}`)
    setLevels(d.levels)
    setLoadingLevels(false)
  }

  async function handleSave() {
    if (!displayName.trim()) { Alert.alert('Missing', 'Name is required'); return }
    setSaving(true)
    try {
      await api.post('/api/v1/auth/setup', {
        display_name: displayName,
        date_of_birth: '2000-01-01', // placeholder — not changing DOB here
        country_id: country?.id,
        education_system_id: system?.id,
        form_level_id: level?.id,
      })
      Alert.alert('Saved', 'Profile updated successfully')
      router.back()
    } catch (e) {
      Alert.alert('Error', getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={refreshControl}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.label}>Display Name</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName}
        placeholder="Your name" placeholderTextColor="#999" />

      <Text style={styles.label}>Current</Text>
      <View style={styles.currentBadge}>
        <Text style={styles.currentText}>{profile?.education_system} · {profile?.form_year} · {profile?.country}</Text>
      </View>

      <Text style={styles.label}>Change Education Level (optional)</Text>
      <Dropdown label="Select country" value={country} options={countries} onSelect={handleCountrySelect} />
      <Dropdown label={country ? `System in ${country.name}` : 'Select country first'} value={system} options={systems} onSelect={handleSystemSelect} disabled={!country || loadingSystems} />
      <Dropdown label={system ? `Form in ${country?.name} ${system.name}` : 'Select system first'} value={level} options={levels} onSelect={setLevel} disabled={!system || loadingLevels} />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Changes</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 56, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  back: { color: '#4f46e5', fontSize: 15 },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  label: { fontSize: 12, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 16, color: '#1a1a2e', marginBottom: 4 },
  currentBadge: { backgroundColor: '#ede9fe', borderRadius: 8, padding: 10, marginBottom: 4 },
  currentText: { color: '#4f46e5', fontSize: 13, fontWeight: '600' },
  dropdown: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownDisabled: { backgroundColor: '#f9f9f9', borderColor: '#eee' },
  dropdownText: { fontSize: 16, color: '#1a1a2e', flex: 1 },
  placeholder: { color: '#999' },
  chevron: { color: '#888', fontSize: 14 },
  saveButton: { backgroundColor: '#4f46e5', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutButton: { borderWidth: 1, borderColor: '#fca5a5', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 12 },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
  sheetItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sheetItemText: { fontSize: 16, color: '#333' },
  selected: { color: '#4f46e5', fontWeight: '700' },
})
