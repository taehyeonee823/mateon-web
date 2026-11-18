import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { deleteProfileImage, profileToUpdatePayload, updateProfile, uploadProfileImage } from '../api/user'
import { summarizePortfolio } from '../api/portfolio'
import { getUnivByEmail } from '../utils/univ'

const TRACKS = [
  '인문과학계열',
  '사회과학계열',
  '자연과학계열',
  '공학계열',
  '예체능계열',
  '사범·교육학계열',
  '의약학계열',
]

const MAX_PORTFOLIO_SIZE = 20 * 1024 * 1024

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}

function CameraIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}

function CapIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2.5 9.5 12 5l9.5 4.5L12 14z" />
      <path d="M6.5 11.5v4.5c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4.5" />
      <path d="M21.5 9.5v5" />
    </svg>
  )
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m5 12 5 5 9-10" />
    </svg>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-[#1B1B33]">
        {label}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  )
}

const inputClass =
  'h-11 w-full rounded-lg border border-[#E1E2EA] bg-white px-3.5 text-sm text-[#1B1B33] placeholder:text-[#B4B5C6] focus:border-[#4D4DF1] focus:outline-none disabled:bg-[#F5F5F9]'

export default function EditProfile() {
  const navigate = useNavigate()
  const { profile, isLoggedIn, refresh } = useAuth()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const portfolioInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [track, setTrack] = useState('')
  const [major, setMajor] = useState('')
  const [jobs, setJobs] = useState(['', '', ''])
  const [portfolio, setPortfolio] = useState('')
  // 이번 세션에서 고른 포트폴리오 파일 정보 (서버는 요약 텍스트만 저장해서 파일명·용량은 내려오지 않는다)
  const [portfolioFile, setPortfolioFile] = useState<{ name: string; size: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSummarizingPortfolio, setIsSummarizingPortfolio] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  useEffect(() => {
    if (!profile) return
    setName(profile.name ?? '')
    setTagline(profile.tagline ?? '')
    setTrack(profile.college ?? '')
    setMajor(profile.major ?? '')
    setJobs([profile.interestJobPrimary ?? '', profile.interestJobSecondary ?? '', profile.interestJobTertiary ?? ''])
    setPortfolio(profile.portfolio ?? '')
  }, [profile])

  const univ = profile?.schoolVerified ? getUnivByEmail(profile.schoolEmail ?? profile.email) : null
  const isComplete = !!(name.trim() && track && major.trim() && jobs.every((j) => j.trim()))

  const setJob = (index: number, value: string) =>
    setJobs((prev) => prev.map((j, i) => (i === index ? value : j)))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile || !isComplete || isSubmitting || isSummarizingPortfolio) return

    setError(null)
    setIsSubmitting(true)
    try {
      await updateProfile({
        ...profileToUpdatePayload(profile),
        name: name.trim(),
        college: track,
        major: major.trim(),
        interestJobPrimary: jobs[0].trim(),
        interestJobSecondary: jobs[1].trim(),
        interestJobTertiary: jobs[2].trim(),
        tagline: tagline.trim() || null,
        portfolio,
      })
      await refresh()
      window.alert('회원정보가 수정되었습니다.')
      navigate('/my')
    } catch (err) {
      setError(err instanceof Error ? err.message : '잠시 후 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePortfolioChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || isSummarizingPortfolio) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('PDF 파일만 업로드할 수 있어요.')
      return
    }
    if (file.size > MAX_PORTFOLIO_SIZE) {
      setError('포트폴리오는 20MB 이하 파일만 업로드할 수 있어요.')
      return
    }

    setError(null)
    setIsSummarizingPortfolio(true)
    try {
      const result = await summarizePortfolio(file)
      setPortfolio(result.summary)
      setPortfolioFile({ name: file.name, size: file.size })
      // 사진처럼 고르는 즉시 프로필에 반영한다. 다른 입력란의 미저장 수정은 그대로 두고 포트폴리오만 저장.
      if (profile) {
        await updateProfile({ ...profileToUpdatePayload(profile), portfolio: result.summary })
        await refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '포트폴리오 업로드에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsSummarizingPortfolio(false)
    }
  }

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || isUploadingPhoto) return

    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)
    setIsUploadingPhoto(true)
    try {
      await uploadProfileImage(file)
      await refresh()
    } catch (err) {
      setPreviewUrl(null)
      window.alert(err instanceof Error ? err.message : '업로드에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      URL.revokeObjectURL(localPreview)
      setIsUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (isUploadingPhoto) return
    if (!window.confirm('기본 이미지로 변경할까요?')) return

    setIsUploadingPhoto(true)
    try {
      await deleteProfileImage()
      setPreviewUrl(null)
      await refresh()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '삭제에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  if (!isLoggedIn || !profile) {
    return (
      <div className="min-h-screen bg-white">
        <Topbar />
        <main className="flex min-h-[60vh] items-center justify-center text-brand-500">로그인이 필요해요.</main>
        <Footer />
      </div>
    )
  }

  const photoUrl = previewUrl ?? profile.profileImageUrl
  const hasPortfolio = !!portfolio || !!portfolioFile

  return (
    <div className="min-h-screen bg-white">
      <Topbar />

      <main className="mx-auto w-full max-w-[600px] px-6 pb-24 pt-16">
        <h1 className="text-2xl font-bold text-[#1B1B33]">회원정보 수정</h1>

        <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col">
          {/* 사진 · 이름 · 한 줄 소개 */}
          <section className="flex gap-5 rounded-xl bg-[#F5F6FB] p-5">
            <div className="flex shrink-0 flex-col items-center gap-2 pt-6">
              <div className="relative">
                <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full bg-[#E4E5EE]">
                  {photoUrl ? (
                    <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <img src="/landing_img/myPage/user.svg" alt="" className="h-8 w-8 opacity-50" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  aria-label="프로필 사진 변경"
                  className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#4D4DF1] text-white ring-2 ring-[#F5F6FB] transition-colors hover:bg-[#3D3DD9] disabled:opacity-60"
                >
                  <CameraIcon className="h-3.5 w-3.5" />
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>
              {profile.profileImageUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={isUploadingPhoto}
                  className="text-[11px] text-[#8B8CA3] underline underline-offset-2 hover:text-[#6F7095]"
                >
                  기본 이미지로
                </button>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <Field label="이름" htmlFor="profile-name">
                <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </Field>
              <Field label="한 줄 소개" htmlFor="profile-tagline">
                <input
                  id="profile-tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="안녕하세요, 반갑습니다"
                  maxLength={60}
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          {/* 학교 · 계열 · 학과 */}
          <section className="mt-8 border-t border-[#ECECF2] pt-8">
            <p className="text-sm font-semibold text-[#1B1B33]">학교</p>
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-[#E1E2EA] bg-[#F8F8FB] px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#45465C]">
                <CapIcon className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1B1B33]">
                  {univ ?? (profile.schoolVerified ? profile.schoolEmail : '학교 미인증')}
                </p>
                <p className="mt-0.5 text-[11px] text-[#8B8CA3]">
                  {profile.schoolVerified ? '학교 인증으로 확인된 학교예요' : '계정 설정에서 학교 이메일로 인증할 수 있어요'}
                </p>
              </div>
              {profile.schoolVerified ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#E6F6EC] px-2 py-1 text-[11px] font-semibold text-[#1E9E52]">
                  <CheckIcon className="h-3 w-3" /> 인증됨
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center rounded-md bg-[#F0F0F5] px-2 py-1 text-[11px] font-semibold text-[#8B8CA3]">
                  미인증
                </span>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Field label="계열" htmlFor="profile-track">
                <select id="profile-track" value={track} onChange={(e) => setTrack(e.target.value)} className={inputClass}>
                  <option value="" disabled>
                    계열 선택
                  </option>
                  {TRACKS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="학과" htmlFor="profile-major">
                <input
                  id="profile-major"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="학과 입력"
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          {/* 희망 직무 */}
          <section className="mt-8 border-t border-[#ECECF2] pt-8">
            <p className="text-sm font-semibold text-[#1B1B33]">희망 직무</p>
            <div className="mt-2 flex flex-col gap-2">
              {jobs.map((job, index) => (
                <label
                  key={index}
                  className={`flex h-11 items-center gap-3 rounded-lg border px-3 transition-colors focus-within:border-[#4D4DF1] ${
                    index === 0 && job ? 'border-[#D9DBFC] bg-[#F5F6FF]' : 'border-[#E1E2EA] bg-white'
                  }`}
                >
                  <span className="shrink-0 rounded bg-[#4D4DF1] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {index + 1}순위
                  </span>
                  <input
                    value={job}
                    onChange={(e) => setJob(index, e.target.value)}
                    placeholder={`${index + 1}순위 희망 직무`}
                    aria-label={`희망 직무 ${index + 1}순위`}
                    className="min-w-0 flex-1 bg-transparent text-sm text-[#1B1B33] placeholder:text-[#B4B5C6] focus:outline-none"
                  />
                </label>
              ))}
            </div>
          </section>

          {/* 포트폴리오 */}
          <section className="mt-8 border-t border-[#ECECF2] pt-8">
            <p className="text-sm font-semibold text-[#1B1B33]">포트폴리오</p>
            <input
              ref={portfolioInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handlePortfolioChange}
              disabled={isSummarizingPortfolio}
              className="hidden"
            />
            {hasPortfolio ? (
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-[#E1E2EA] bg-[#F8F8FB] px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#FFE4E1] text-[10px] font-extrabold text-[#E5484D]">
                  PDF
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#1B1B33]">
                    {portfolioFile ? portfolioFile.name : '포트폴리오 등록됨'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#8B8CA3]">
                    {isSummarizingPortfolio
                      ? '분석 중...'
                      : portfolioFile
                        ? formatFileSize(portfolioFile.size)
                        : '요약이 프로필에 저장돼 있어요'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => portfolioInputRef.current?.click()}
                  disabled={isSummarizingPortfolio}
                  className="h-7 shrink-0 rounded-md border border-[#D5D6E0] bg-white px-2.5 text-[11px] font-medium text-[#1B1B33] transition-colors hover:bg-[#F5F5F9] disabled:opacity-60"
                >
                  변경
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => portfolioInputRef.current?.click()}
                disabled={isSummarizingPortfolio}
                className="mt-2 flex h-20 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#C9CAD6] bg-[#F8F8FB] text-center transition-colors hover:bg-[#F0F0F5] disabled:cursor-wait disabled:opacity-60"
              >
                <span className="text-sm font-semibold text-[#45465C]">
                  {isSummarizingPortfolio ? '포트폴리오 분석 중...' : 'PDF 포트폴리오 올리기'}
                </span>
                <span className="text-[11px] text-[#8B8CA3]">최대 20MB · 내용을 요약해 프로필에 저장해요</span>
              </button>
            )}
          </section>

          {error && (
            <p role="alert" className="mt-6 text-sm font-medium text-rose-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!isComplete || isSubmitting || isSummarizingPortfolio}
            className="mt-8 h-12 rounded-lg bg-[#4D4DF1] text-base font-semibold text-white transition-colors hover:bg-[#3D3DD9] disabled:cursor-not-allowed disabled:bg-[#E8E8EE] disabled:text-[#A3A4B8]"
          >
            {isSubmitting ? '저장 중...' : '저장하기'}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  )
}
