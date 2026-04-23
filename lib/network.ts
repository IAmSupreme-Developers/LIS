/**
 * Lightweight online check — attempts a HEAD request to a reliable endpoint.
 * Returns true if connected, false if offline or request fails.
 */
export async function isOnline(): Promise<boolean> {
  try {
    const res = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      cache: 'no-store',
    })
    return res.ok
  } catch {
    return false
  }
}
