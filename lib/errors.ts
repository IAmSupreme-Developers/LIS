/**
 * Extracts a human-readable string from any API error shape.
 * Handles: string messages, Zod flatten objects, unknown errors.
 */
export function getErrorMessage(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!e || typeof e !== 'object') return fallback

  const err = (e as any)?.error

  if (typeof err?.message === 'string') return err.message

  // Zod flatten: { fieldErrors: { field: [msg] }, formErrors: [msg] }
  if (err?.message?.fieldErrors) {
    const fields = err.message.fieldErrors as Record<string, string[]>
    const first = Object.entries(fields).find(([, v]) => v.length > 0)
    if (first) return `${first[0]}: ${first[1][0]}`
  }

  if (err?.message?.formErrors?.length) {
    return err.message.formErrors[0]
  }

  if (typeof (e as any)?.message === 'string') return (e as any).message

  return fallback
}
