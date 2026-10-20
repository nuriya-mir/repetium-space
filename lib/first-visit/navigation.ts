const DEFAULT_DESTINATION = '/home'

export function getSafeInternalPath(
  value: string | null | undefined,
  fallback = DEFAULT_DESTINATION
): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
  if (value.includes('\\') || /[\u0000-\u001F]/.test(value)) return fallback

  try {
    const url = new URL(value, 'https://repetium.local')
    if (url.origin !== 'https://repetium.local') return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}
