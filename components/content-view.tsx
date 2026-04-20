import { Text, StyleSheet } from 'react-native'

interface Props {
  title: string
  body: string | null
}

export function ContentView({ title, body }: Props) {
  return (
    <>
      <Text style={styles.title}>{title}</Text>
      {body && <Text style={styles.body}>{body}</Text>}
    </>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
  body: { fontSize: 16, color: '#333', lineHeight: 26 },
})
