import { useState } from 'react'
import { TouchableOpacity, Text, View, Modal, StyleSheet, Platform, Button } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'

interface Props {
  value: Date | null
  onChange: (date: Date) => void
  maximumDate?: Date
  minimumDate?: Date
  placeholder?: string
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function DatePicker({ value, onChange, maximumDate, minimumDate, placeholder = 'Select date of birth' }: Props) {
  const [show, setShow] = useState(false)
  const [tempDate, setTempDate] = useState<Date>(value ?? new Date(2005, 0, 1))

  function open() {
    setTempDate(value ?? new Date(2005, 0, 1))
    setShow(true)
  }

  function confirm() {
    onChange(tempDate)
    setShow(false)
  }

  function cancel() {
    setShow(false)
  }

  // Android: picker handles its own open/close natively
  if (Platform.OS === 'android') {
    return (
      <>
        <TouchableOpacity style={styles.input} onPress={open}>
          <Text style={[styles.text, !value && styles.placeholder]}>
            {value ? formatDate(value) : placeholder}
          </Text>
        </TouchableOpacity>

        {show && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            maximumDate={maximumDate ?? new Date()}
            minimumDate={minimumDate ?? new Date(1950, 0, 1)}
            onChange={(_, selected) => {
              setShow(false)
              if (selected) onChange(selected)
            }}
          />
        )}
      </>
    )
  }

  // iOS: wrap in Modal for clean show/hide
  return (
    <>
      <TouchableOpacity style={styles.input} onPress={open}>
        <Text style={[styles.text, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={show} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={cancel} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Button title="Cancel" onPress={cancel} color="#888" />
            <Button title="Done" onPress={confirm} color="#4f46e5" />
          </View>
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="spinner"
            maximumDate={maximumDate ?? new Date()}
            minimumDate={minimumDate ?? new Date(1950, 0, 1)}
            onChange={(_, selected) => { if (selected) setTempDate(selected) }}
          />
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    justifyContent: 'center',
  },
  text: { fontSize: 16, color: '#1a1a2e' },
  placeholder: { color: '#999' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
})
