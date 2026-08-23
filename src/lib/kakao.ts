type KakaoSDK = {
  init: (jsKey: string) => void
  isInitialized: () => boolean
  Auth: {
    authorize: (options: { redirectUri: string }) => void
  }
}

declare global {
  interface Window {
    Kakao?: KakaoSDK
  }
}

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined

export function isKakaoConfigured() {
  return !!KAKAO_JS_KEY
}

export function redirectToKakaoLogin(redirectUri: string) {
  if (!KAKAO_JS_KEY) {
    throw new Error('카카오 로그인이 아직 설정되지 않았어요.')
  }

  if (!window.Kakao) {
    throw new Error('카카오 SDK를 불러오지 못했어요. 잠시 후 다시 시도해주세요.')
  }

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(KAKAO_JS_KEY)
  }

  window.Kakao.Auth.authorize({ redirectUri })
}
