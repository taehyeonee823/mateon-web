// 회원가입 약관 동의 내역 관리
// 카카오 OAuth는 페이지를 벗어났다가 돌아오므로 sessionStorage에 보관한다.

export type ConsentKey = 'terms' | 'privacy' | 'age' | 'marketing'

export type ConsentResult = Record<ConsentKey, boolean>

// 백엔드로 전송하는 동의 필드
export type ConsentPayload = {
  agreeTerms: boolean
  agreePrivacy: boolean
  agreeAge: boolean
  agreeMarketing: boolean
  agreedAt: string
}

const SIGNUP_CONSENT_STORAGE_KEY = 'mateon.signupConsent'

export function toConsentPayload(result: ConsentResult, agreedAt = new Date().toISOString()): ConsentPayload {
  return {
    agreeTerms: result.terms,
    agreePrivacy: result.privacy,
    agreeAge: result.age,
    agreeMarketing: result.marketing,
    agreedAt,
  }
}

// 필수 항목에 모두 동의했는지
export function isRequiredConsentGiven(payload: ConsentPayload | null): payload is ConsentPayload {
  return !!payload && payload.agreeTerms && payload.agreePrivacy && payload.agreeAge
}

export function saveSignupConsent(payload: ConsentPayload) {
  try {
    sessionStorage.setItem(SIGNUP_CONSENT_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // 저장 실패(프라이빗 모드 등)는 가입 진행에 영향 없음
  }
}

export function readSignupConsent(): ConsentPayload | null {
  try {
    const raw = sessionStorage.getItem(SIGNUP_CONSENT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ConsentPayload>
    if (
      typeof parsed.agreeTerms !== 'boolean' ||
      typeof parsed.agreePrivacy !== 'boolean' ||
      typeof parsed.agreeAge !== 'boolean' ||
      typeof parsed.agreeMarketing !== 'boolean' ||
      typeof parsed.agreedAt !== 'string'
    ) {
      return null
    }
    return parsed as ConsentPayload
  } catch {
    return null
  }
}

export function clearSignupConsent() {
  try {
    sessionStorage.removeItem(SIGNUP_CONSENT_STORAGE_KEY)
  } catch {
    // 무시
  }
}