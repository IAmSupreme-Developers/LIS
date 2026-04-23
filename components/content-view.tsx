import { ScrollView, StyleSheet } from 'react-native'
import Markdown from 'react-native-markdown-display'

interface Props {
  title: string
  body: string | null
}

export function ContentView({ title, body }: Props) {
  const content = body ? `# ${title}\n\n${body}` : `# ${title}`

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Markdown style={markdownStyles}>{content}</Markdown>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})

const markdownStyles = {
  body: { fontSize: 16, color: '#1a1a2e', lineHeight: 26 },
  heading1: { fontSize: 22, fontWeight: '700' as const, color: '#1a1a2e', marginBottom: 12, marginTop: 4 },
  heading2: { fontSize: 18, fontWeight: '700' as const, color: '#1a1a2e', marginBottom: 8, marginTop: 16 },
  heading3: { fontSize: 16, fontWeight: '700' as const, color: '#4f46e5', marginBottom: 6, marginTop: 12 },
  paragraph: { marginBottom: 12 },
  strong: { fontWeight: '700' as const, color: '#1a1a2e' },
  em: { fontStyle: 'italic' as const },
  bullet_list: { marginBottom: 12 },
  ordered_list: { marginBottom: 12 },
  list_item: { marginBottom: 4 },
  blockquote: { backgroundColor: '#f5f3ff', borderLeftWidth: 4, borderLeftColor: '#4f46e5', paddingLeft: 12, paddingVertical: 8, marginBottom: 12 },
  code_inline: { backgroundColor: '#f3f4f6', color: '#4f46e5', fontFamily: 'monospace', paddingHorizontal: 4, borderRadius: 4 },
  fence: { backgroundColor: '#1e1e2e', padding: 12, borderRadius: 8, marginBottom: 12 },
  code_block: { color: '#e2e8f0', fontFamily: 'monospace', fontSize: 13 },
  hr: { backgroundColor: '#e5e7eb', height: 1, marginVertical: 16 },
  link: { color: '#4f46e5', textDecorationLine: 'underline' as const },
}
