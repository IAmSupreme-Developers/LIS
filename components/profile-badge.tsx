import { View, Text, StyleSheet } from 'react-native'

interface Props {
  country: string
  educationSystem: string
  formYear: string
}

export function ProfileBadge({ country, educationSystem, formYear }: Props) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{educationSystem} · {formYear} · {country}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#ede9fe',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  text: { color: '#4f46e5', fontSize: 12, fontWeight: '600' },
})
