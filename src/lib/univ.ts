import univInfo from '../univInfo.json'

const UNIV_INFO: Record<string, string> = univInfo

export function getUnivByEmail(email: string | null | undefined): string | null {
  if (!email) return null

  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null

  return UNIV_INFO[domain] ?? null
}
