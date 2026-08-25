import { Fragment, useEffect, useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import { requestEmailCode, verifyEmailCode, signUp } from '../api/auth'
import { getUnivByEmail } from '../lib/univ'
import { redirectToKakaoLogin } from '../lib/kakao'
import { useAuth } from '../context/AuthContext'

const RESEND_COOLDOWN_SECONDS = 60
const TRACKS = [
  '인문과학계열',
  '사회과학계열',
  '자연과학계열',
  '공학계열',
  '예체능계열',
  '사범·교육학계열',
  '의약학계열',
]

type Step = 'credentials' | 'info' | 'complete'

const SIGNUP_STEPS: { key: Step; label: string }[] = [
  { key: 'credentials', label: '재학생 인증' },
  { key: 'info', label: '정보 입력' },
  { key: 'complete', label: '가입 완료' },
]

export default function Signup() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [step, setStep] = useState<Step>('credentials')

  // step 1: credentials
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [isCodeVerified, setIsCodeVerified] = useState(false)
  const [verificationToken, setVerificationToken] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [kakaoError, setKakaoError] = useState<string | null>(null)

  // step 2: info
  const [name, setName] = useState('')
  const [track, setTrack] = useState<string | null>(null)
  const [major, setMajor] = useState('')
  const [job1, setJob1] = useState('')
  const [job2, setJob2] = useState('')
  const [job3, setJob3] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (cooldown === 0) return
    const timer = setInterval(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const isCredentialsNextEnabled =
    !!email &&
    isCodeVerified &&
    !!verificationToken &&
    password.length >= 10 &&
    password.length <= 20 &&
    password === passwordConfirm

  const isInfoComplete = !!(name && track && major && job1 && job2 && job3)
  const currentStepIndex = SIGNUP_STEPS.findIndex((s) => s.key === step)
  const inferredSchool = getUnivByEmail(email)

  const handleSendCode = async () => {
    if (!email) {
      setEmailError('이메일을 입력해주세요.')
      return
    }
    if (isSendingCode || cooldown > 0) return

    setIsSendingCode(true)
    setEmailError(null)
    try {
      await requestEmailCode(email)
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : '인증코드 발송에 실패했습니다.')
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!code) {
      setCodeError('인증번호를 입력해주세요.')
      return
    }
    if (isVerifyingCode || isCodeVerified) return

    setIsVerifyingCode(true)
    setCodeError(null)
    try {
      const token = await verifyEmailCode(email, code)
      setVerificationToken(token)
      setIsCodeVerified(true)
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : '인증코드 검증에 실패했습니다.')
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const handleCredentialsSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!isCredentialsNextEnabled) return
    setStep('info')
  }

  const handleKakaoLogin = () => {
    setKakaoError(null)
    try {
      redirectToKakaoLogin(`${window.location.origin}/oauth/kakao/callback`)
    } catch (err) {
      setKakaoError(err instanceof Error ? err.message : '잠시 후 다시 시도해주세요.')
    }
  }

  const handleInfoSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isInfoComplete || isSubmitting || !verificationToken) return

    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await signUp({
        email,
        password,
        passwordConfirm,
        verificationToken,
        provider: 'LOCAL',
        providerId: null,
        schoolEmail: null,
        school: inferredSchool ?? undefined,
        name,
        college: track!,
        major,
        interestJobPrimary: job1,
        interestJobSecondary: job2,
        interestJobTertiary: job3,
        tagline: null,
      })
      await refresh()
      setStep('complete')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '잠시 후 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="md:pl-64">
        <Topbar />

        <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16">
          <div className="mb-12 flex w-full max-w-lg items-start">
            {SIGNUP_STEPS.map((s, index) => {
              const isDone = index < currentStepIndex
              const isActive = index === currentStepIndex
              const isLast = index === SIGNUP_STEPS.length - 1

              return (
                <Fragment key={s.key}>
                  <div className="flex w-24 shrink-0 flex-col items-center">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold ${
                        isDone
                          ? 'bg-[#2554F0] text-white'
                          : isActive
                            ? 'border-[3px] border-[#2554F0] text-[#2554F0]'
                            : 'border-2 border-brand-200 text-brand-300'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={`mt-3 whitespace-nowrap text-sm font-medium ${
                        isDone || isActive ? 'text-brand-700' : 'text-brand-300'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>

                  {!isLast && (
                    <div
                      className={`mt-6 h-[3px] flex-1 ${isDone ? 'bg-[#2554F0]' : 'bg-brand-100'}`}
                    />
                  )}
                </Fragment>
              )
            })}
          </div>

          {step === 'credentials' && (
            <div className="w-full max-w-sm">
              <div className="mb-8 flex flex-col items-center text-center">
                <img src="/landing_img/logo.svg" alt="" className="h-12 w-auto" />
                <h1 className="mt-3 text-2xl font-bold text-brand-900">
                  MateOn
                  <br />
                  회원가입을 위해
                  <br />
                  교육기관 이메일을 입력해 주세요.
                </h1>
              </div>

              <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-brand-100">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일 주소"
                    autoComplete="email"
                    className="h-12 flex-1 text-sm text-brand-900 placeholder:text-brand-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isSendingCode || cooldown > 0}
                    className={`shrink-0 text-sm font-semibold ${
                      cooldown > 0 ? 'text-brand-300' : 'text-brand-700'
                    }`}
                  >
                    {isSendingCode ? '전송 중...' : cooldown > 0 ? `재요청 (${cooldown}초)` : '인증요청'}
                  </button>
                </div>
                {emailError && <p className="-mt-2 text-xs font-medium text-rose-500">{emailError}</p>}

                <div className="flex items-center gap-2 border-b border-brand-100">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value)
                      setIsCodeVerified(false)
                      setVerificationToken(null)
                    }}
                    disabled={isCodeVerified}
                    placeholder="인증번호 6자리"
                    className="h-12 flex-1 text-sm text-brand-900 placeholder:text-brand-400 focus:outline-none disabled:bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={isVerifyingCode || isCodeVerified}
                    className={`shrink-0 text-sm font-semibold ${
                      isCodeVerified ? 'text-brand-300' : 'text-brand-700'
                    }`}
                  >
                    {isCodeVerified ? '인증완료' : isVerifyingCode ? '확인 중...' : '확인'}
                  </button>
                </div>
                {codeError && <p className="-mt-2 text-xs font-medium text-rose-500">{codeError}</p>}

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="새 비밀번호 (10~20자리 이내)"
                  autoComplete="new-password"
                  className="h-12 border-b border-brand-100 text-sm text-brand-900 placeholder:text-brand-400 focus:border-brand-300 focus:outline-none"
                />

                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="새 비밀번호 확인"
                  autoComplete="new-password"
                  className="h-12 border-b border-brand-100 text-sm text-brand-900 placeholder:text-brand-400 focus:border-brand-300 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={!isCredentialsNextEnabled}
                  className="mt-4 h-14 rounded-xl bg-[#2554F0] text-lg font-semibold text-white transition-opacity disabled:opacity-40"
                >
                  다음
                </button>
              </form>

              <div className="mt-8 flex justify-center gap-2 text-sm text-brand-500">
                <span>이미 계정이 있으신가요?</span>
                <Link to="/login" className="font-semibold text-brand-700 underline">
                  로그인하기
                </Link>
                <span>또는</span>
                <button
                  type="button"
                  onClick={handleKakaoLogin}
                  className="font-semibold text-brand-700 underline"
                >
                  카카오 계정으로 시작하기
                </button>
              </div>
              {kakaoError && (
                <p className="mt-2 text-center text-xs font-medium text-rose-500">{kakaoError}</p>
              )}
            </div>
          )}

          {step === 'info' && (
            <div className="w-full max-w-md">
              <h1 className="mb-8 text-2xl font-bold text-brand-900">회원 정보를 입력해주세요</h1>

              <form onSubmit={handleInfoSubmit} className="flex flex-col gap-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-brand-900">이름</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름을 입력해주세요"
                    className="h-12 w-full border-b border-brand-900 text-base text-brand-900 placeholder:text-brand-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-brand-900">학교</label>
                  <input
                    type="text"
                    value={inferredSchool ?? '인증된 학교 이메일이 없습니다'}
                    readOnly
                    disabled
                    className="h-12 w-full border-b border-brand-100 bg-transparent text-base text-brand-500 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-brand-900">계열</label>
                    <select
                      value={track ?? ''}
                      onChange={(e) => setTrack(e.target.value || null)}
                      className="h-14 w-full rounded-xl border border-[#D8E1FD] bg-white px-3 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
                    >
                      <option value="" disabled>
                        계열 선택
                      </option>
                      {TRACKS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-brand-900">학과</label>
                    <input
                      type="text"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder="학과 입력"
                      className="h-14 w-full rounded-xl border border-[#D8E1FD] px-4 text-sm text-brand-900 placeholder:text-brand-400 focus:border-brand-300 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-brand-900">희망 직무 1순위</label>
                  <input
                    type="text"
                    value={job1}
                    onChange={(e) => setJob1(e.target.value)}
                    placeholder="1순위 희망직무를 입력해주세요"
                    className="h-12 w-full border-b border-brand-900 text-base text-brand-900 placeholder:text-brand-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-brand-900">희망 직무 2순위</label>
                  <input
                    type="text"
                    value={job2}
                    onChange={(e) => setJob2(e.target.value)}
                    placeholder="2순위 희망직무를 입력해주세요"
                    className="h-12 w-full border-b border-brand-900 text-base text-brand-900 placeholder:text-brand-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-brand-900">희망 직무 3순위</label>
                  <input
                    type="text"
                    value={job3}
                    onChange={(e) => setJob3(e.target.value)}
                    placeholder="3순위 희망직무를 입력해주세요"
                    className="h-12 w-full border-b border-brand-900 text-base text-brand-900 placeholder:text-brand-400 focus:outline-none"
                  />
                </div>

                {submitError && <p className="text-sm font-medium text-rose-500">{submitError}</p>}

                <button
                  type="submit"
                  disabled={!isInfoComplete || isSubmitting}
                  className="h-14 rounded-xl bg-[#2554F0] text-lg font-semibold text-white transition-opacity disabled:opacity-40"
                >
                  {isSubmitting ? '처리 중...' : '완료'}
                </button>
              </form>
            </div>
          )}

          {step === 'complete' && (
            <div className="flex w-full max-w-sm flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-50">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-12 w-12 text-brand-500"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="mt-6 text-2xl font-bold text-brand-900">
                MateOn 회원가입이
                <br />
                완료되었습니다.
              </h1>
              <p className="mt-4 text-base text-brand-500">{name}님의 회원가입을 축하합니다.</p>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="mt-10 h-14 w-full rounded-xl bg-[#2554F0] text-lg font-semibold text-white"
              >
                시작하기
              </button>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  )
}
