import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createEvent,
  EVENT_FIELD_LABELS,
  extractEventImage,
  type EventCategory,
  type EventField,
} from '../api/event'
import { ChevronRightIcon, PencilIcon, SearchIcon } from '../components/icons'
import univInfo from '../univInfo.json'

// 디자인 시안의 칩 노출 순서
const FIELD_ORDER: EventField[] = [
  'SCIENCE_ENGINEERING_TECH_IT',
  'PLANNING_IDEA',
  'DESIGN_PHOTO_ART_VIDEO',
  'MANAGEMENT_CONSULTING_MARKETING',
  'ECONOMY_FINANCE',
  'STARTUP_SELF_DEVELOPMENT',
  'CONTENTS',
  'PRESS_MEDIA',
  'SOCIAL_CONTRIBUTION_EXCHANGE',
  'POLITICS_SOCIETY_LAW',
  'EDUCATION',
  'CULTURE_HISTORY',
  'EVENT_FESTIVAL',
  'ENVIRONMENT_ENERGY',
  'MEDICAL_HEALTH',
  'SPORTS_FITNESS',
  'TRAVEL_HOTEL_AIRLINE',
  'BEAUTY_COSMETICS',
  'COOKING_FOOD',
  'DISTRIBUTION_LOGISTICS',
  'ETC',
]

const SCHOOL_NAMES = Array.from(new Set(Object.values(univInfo as Record<string, string>))).sort(
  (a, b) => a.localeCompare(b, 'ko')
)

const MAX_POSTER_SIZE = 10 * 1024 * 1024
const ACCEPTED_POSTER_TYPES = ['image/jpeg', 'image/png']

type Step = 1 | 2 | 3

const STEPS: { step: Step; label: string }[] = [
  { step: 1, label: '포스터' },
  { step: 2, label: '정보 입력' },
  { step: 3, label: '확인 · 등록' },
]

const TIPS = [
  { title: '포스터만 올려도 돼요', body: '이름, 주최, 기간, 분야를 읽어서 채워드려요.' },
  { title: '정확한 정보로 올려주세요', body: '사실과 다른 내용은 신고되면 숨겨질 수 있어요.' },
  { title: '마감되면 자동으로 내려가요', body: '마감일이 지나면 목록에서 빠져요.' },
]

function normalizeWebUrl(value: string): string | undefined {
  const trimmedValue = value.trim()
  if (!trimmedValue) return undefined

  const normalizedValue = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`
  const url = new URL(normalizedValue)

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('http 또는 https 주소를 입력해주세요.')
  }

  return url.toString()
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 15V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m5 12 5 5 9-10" />
    </svg>
  )
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function Stepper({ current }: { current: Step }) {
  return (
    <ol className="flex items-center gap-4 sm:gap-6">
      {STEPS.map(({ step, label }, index) => {
        const done = step < current
        const isCurrent = step === current
        return (
          <li key={step} className={`flex items-center gap-4 sm:gap-6 ${index < STEPS.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex shrink-0 items-center gap-2.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  isCurrent
                    ? 'bg-[#4D4DF1] text-white'
                    : done
                      ? 'bg-[#EEF0FC] text-[#4D4DF1]'
                      : 'border-[1.5px] border-[#C9CAD6] bg-white text-[#A3A4B8]'
                }`}
              >
                {done ? <CheckIcon className="h-3.5 w-3.5" /> : step}
              </span>
              <span
                className={`text-sm ${
                  isCurrent ? 'font-bold text-[#1B1B33]' : done ? 'font-medium text-[#1B1B33]' : 'text-[#A3A4B8]'
                }`}
              >
                {label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span className={`h-0.5 flex-1 rounded-full ${done ? 'bg-[#4D4DF1]' : 'bg-[#E1E2EA]'}`} />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-[15px] font-semibold text-[#1B1B33]">
        {label}
        {required && <span className="ml-0.5 text-[#FF5A5A]">*</span>}
      </label>
      <div className="mt-2.5">{children}</div>
    </div>
  )
}

function ReviewSection({
  number,
  title,
  skipped = [],
  aside,
  children,
}: {
  number: string
  title: string
  skipped?: string[]
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-xl bg-[#F7F7F9] p-6">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-bold text-[#1B1B33]">
          <span className="text-[#4D4DF1]">{number}.</span> {title}
        </h3>
        {aside}
      </div>
      <div className="mt-5 flex flex-col gap-5">{children}</div>
      {skipped.length > 0 && (
        <p className="mt-6 text-xs text-[#A3A4B8]">
          입력하지 않은 항목 <span className="font-medium text-[#6F7095]">{skipped.join(', ')}</span>
        </p>
      )}
    </section>
  )
}

function ReviewItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-[#8B8CA3]">{label}</p>
      <div className="mt-1.5 whitespace-pre-wrap break-words text-sm font-medium text-[#1B1B33]">{children}</div>
    </div>
  )
}

function Chip({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded px-2 text-[11px] font-semibold ${
        accent ? 'bg-[#EEF0FC] text-[#4D4DF1]' : 'bg-white text-[#1B1B33] ring-1 ring-[#E1E2EA]'
      }`}
    >
      {children}
    </span>
  )
}

type CreateContestProps = {
  category: EventCategory
}

export default function CreateContest({ category }: CreateContestProps) {
  const navigate = useNavigate()
  const eventName = category === 'CONTEST' ? '공모전' : '대외활동'
  const listPath = category === 'CONTEST' ? '/contest' : '/external'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>(1)
  const [title, setTitle] = useState('')
  const [field, setField] = useState<EventField | ''>('')
  const [organizer, setOrganizer] = useState('')
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [detailUrl, setDetailUrl] = useState('')
  const [recommendedTargets, setRecommendedTargets] = useState('')
  const [schoolOnly, setSchoolOnly] = useState(false)
  const [targetSchool, setTargetSchool] = useState('')
  const [schoolQuery, setSchoolQuery] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (posterPreview) URL.revokeObjectURL(posterPreview)
    }
  }, [posterPreview])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  const schoolResults = useMemo(() => {
    const query = schoolQuery.trim()
    if (!query) return []
    return SCHOOL_NAMES.filter((name) => name.includes(query)).slice(0, 8)
  }, [schoolQuery])

  const isInfoComplete =
    !!title.trim() && !!field && !!startDate && !!endDate && (!schoolOnly || !!targetSchool)

  const handlePosterFile = async (file: File | undefined) => {
    if (!file || isExtracting) return
    if (!ACCEPTED_POSTER_TYPES.includes(file.type)) {
      setError('JPG 또는 PNG 이미지만 올릴 수 있어요.')
      return
    }
    if (file.size > MAX_POSTER_SIZE) {
      setError('10MB 이하의 이미지만 올릴 수 있어요.')
      return
    }

    setError(null)
    setPosterPreview(URL.createObjectURL(file))
    setIsExtracting(true)
    try {
      const draft = await extractEventImage(file)
      setTitle(draft.title ?? '')
      setField(draft.field ?? '')
      setOrganizer(draft.organizer ?? '')
      setSummary(draft.summarizedDescription ?? '')
      setDescription(draft.description ?? '')
      setStartDate(draft.startDate ?? '')
      setEndDate(draft.endDate ?? '')
      setDetailUrl(draft.detailUrl ?? '')
      setRecommendedTargets(draft.recommendedTargets ?? '')
      setSchoolOnly(!!draft.targetSchool)
      setTargetSchool(draft.targetSchool ?? '')
      setImageUrl(draft.imageUrl ?? '')
      setStep(2)
    } catch (err) {
      setPosterPreview(null)
      setError(err instanceof Error ? err.message : '이미지 정보를 추출하지 못했어요.')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    void handlePosterFile(file)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    void handlePosterFile(event.dataTransfer.files?.[0])
  }

  const goToManualInput = () => {
    setError(null)
    setStep(2)
  }

  const validateInfo = (): boolean => {
    if (!title.trim() || !field) {
      setError(`${eventName} 이름과 분야를 입력해주세요.`)
      return false
    }
    if (!startDate || !endDate) {
      setError('시작일과 마감일을 입력해주세요.')
      return false
    }
    if (endDate < startDate) {
      setError('마감일은 시작일 이후여야 해요.')
      return false
    }
    if (schoolOnly && !targetSchool) {
      setError('지원할 수 있는 학교를 선택해주세요.')
      return false
    }
    try {
      normalizeWebUrl(detailUrl)
    } catch {
      setError('올바른 원문 공고 링크를 입력해주세요.')
      return false
    }
    return true
  }

  const goToConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validateInfo()) return
    setError(null)
    setStep(3)
  }

  const handleSubmit = async () => {
    if (isSubmitting || isExtracting || !field) return
    if (!validateInfo()) {
      setStep(2)
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await createEvent({
        category,
        title: title.trim(),
        field,
        organizer: organizer.trim() || undefined,
        summarizedDescription: summary.trim() || undefined,
        description: description.trim() || undefined,
        startDate,
        endDate,
        detailUrl: normalizeWebUrl(detailUrl),
        recommendedTargets: recommendedTargets.trim() || undefined,
        targetSchool: schoolOnly ? targetSchool : undefined,
        imageUrl: imageUrl.trim() || undefined,
      })
      navigate(listPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : `${eventName}을 등록하지 못했어요.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClassName =
    'h-12 w-full rounded-lg border border-[#E1E2EA] bg-white px-4 text-sm text-[#1B1B33] placeholder:text-[#B4B5C6] focus:border-[#4D4DF1] focus:outline-none'
  const secondaryButton =
    'h-12 rounded-lg border border-[#E1E2EA] bg-white px-5 text-sm font-semibold text-[#1B1B33] transition-colors hover:bg-[#F5F5F9] disabled:opacity-50'
  const primaryButton =
    'h-12 rounded-lg bg-[#4D4DF1] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#3D3DD9] disabled:cursor-not-allowed disabled:bg-[#E8E8EE] disabled:text-[#A3A4B8]'
  const posterSrc = posterPreview ?? (imageUrl || null)

  return (
    <div className="min-h-full bg-[#F7F7F9]">
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_232px] lg:gap-[72px]">
          <div className="min-w-0">
            <header>
              <h1 className="text-[32px] font-extrabold tracking-tight text-[#1B1B33]">{eventName} 등록</h1>
              <p className="mt-3 text-base text-[#1B1B33] sm:text-base">
                찾는 {eventName}이 없다면 직접 올려보세요. 포스터 한 장이면 대부분 채워드려요.
              </p>
            </header>

            <div className="mt-10">
              <Stepper current={step} />
            </div>

            <section className="mt-8 rounded-2xl border border-[#E8E8EF] bg-white p-6 sm:p-12">
              {step === 1 && (
                <>
                  <h2 className="text-2xl font-bold text-[#1B1B33]">{eventName} 포스터가 있나요?</h2>
                  <p className="mt-3 text-[11px] text-[#1B1B33] sm:text-base">
                    포스터를 올리면 이름, 주최, 접수 기간, 분야를 알아서 채워드려요.
                  </p>

                  <div
                    role="button"
                    tabIndex={0}
                    aria-disabled={isExtracting}
                    onClick={() => !isExtracting && fileInputRef.current?.click()}
                    onKeyDown={(event) => {
                      if ((event.key === 'Enter' || event.key === ' ') && !isExtracting) {
                        event.preventDefault()
                        fileInputRef.current?.click()
                      }
                    }}
                    onDragOver={(event) => {
                      event.preventDefault()
                      if (!isExtracting) setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`mt-10 flex min-h-[232px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                      isDragging
                        ? 'border-[#4D4DF1] bg-[#E3E5FC]'
                        : 'border-[#8E8FF5] bg-[#EEF0FC] hover:bg-[#E7E9FB]'
                    } ${isExtracting ? 'cursor-wait' : 'cursor-pointer'}`}
                  >
                    {isExtracting ? (
                      <>
                        {posterPreview && (
                          <img src={posterPreview} alt="" className="h-24 w-auto rounded-lg object-cover shadow-sm" />
                        )}
                        <span className="mt-5 h-6 w-6 animate-spin rounded-full border-2 border-[#4D4DF1] border-t-transparent" />
                        <p className="mt-3 text-base font-bold text-[#1B1B33]">포스터를 읽고 있어요</p>
                        <p className="mt-1.5 text-sm text-[#6F7095]">잠시만 기다려주세요</p>
                      </>
                    ) : (
                      <>
                        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-[#4D4DF1] shadow-sm">
                          <UploadIcon className="h-6 w-6" />
                        </span>
                        <p className="mt-5 text-lg font-bold text-[#1B1B33]">포스터 올리기</p>
                        <p className="mt-2 text-sm text-[#6F7095]">
                          이미지를 끌어다 놓거나 눌러서 선택 · JPG, PNG · 10MB 이하
                        </p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleInputChange}
                      className="hidden"
                    />
                  </div>

                  {error && <p role="alert" className="mt-4 text-sm font-medium text-rose-500">{error}</p>}

                  <button
                    type="button"
                    onClick={goToManualInput}
                    disabled={isExtracting}
                    className="mt-9 flex w-full items-center gap-4 rounded-xl border border-[#E8E8EF] bg-white px-5 py-4 text-left transition-colors hover:bg-[#F8F8FB] disabled:opacity-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EFEFF3] text-[#45465C]">
                      <PencilIcon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-[#1B1B33]">포스터 없이 직접 입력할게요</span>
                      <span className="mt-0.5 block text-xs text-[#6F7095]">포스터는 나중에 추가할 수 있어요</span>
                    </span>
                    <ChevronRightIcon className="h-5 w-5 shrink-0 text-[#1B1B33]" />
                  </button>
                </>
              )}

              {step === 2 && (
                <form onSubmit={goToConfirm} noValidate>
                  {/* 기본 정보 */}
                  <div className="flex flex-col gap-7">
                    <h2 className="text-2xl font-bold text-[#1B1B33]">어떤 {eventName}인가요?</h2>

                    {posterSrc && (
                      <div className="flex items-center gap-4 rounded-xl bg-[#F5F5F9] p-4">
                        <img src={posterSrc} alt={`${eventName} 포스터`} className="h-20 w-16 shrink-0 rounded-md object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#1B1B33]">포스터에서 읽어온 내용이에요</p>
                          <p className="mt-0.5 text-xs text-[#6F7095]">틀린 부분이 있으면 고쳐주세요.</p>
                        </div>
                      </div>
                    )}

                    <Field label={`${eventName} 이름`} htmlFor="contest-title" required>
                      <input
                        id="contest-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="예: 캠퍼스 챌린지 해커톤"
                        className={inputClassName}
                      />
                    </Field>

                    <Field label="주최 기관" htmlFor="contest-organizer">
                      <input
                        id="contest-organizer"
                        value={organizer}
                        onChange={(event) => setOrganizer(event.target.value)}
                        placeholder="예: ○○대학교 산학협력단"
                        className={inputClassName}
                      />
                    </Field>

                    <Field label="분야" required>
                      <div role="radiogroup" aria-label="분야" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {FIELD_ORDER.map((eventField) => {
                          const selected = field === eventField
                          return (
                            <button
                              key={eventField}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() => setField(eventField)}
                              className={`h-10 rounded-lg border px-2 text-xs font-medium transition-colors ${
                                selected
                                  ? 'border-[#4D4DF1] bg-[#EEF0FC] font-semibold text-[#4D4DF1]'
                                  : 'border-[#E1E2EA] bg-white text-[#45465C] hover:border-[#C9CAD6]'
                              }`}
                            >
                              {EVENT_FIELD_LABELS[eventField]}
                            </button>
                          )
                        })}
                      </div>
                    </Field>

                    <Field label="한 줄 요약" htmlFor="contest-summary">
                      <input
                        id="contest-summary"
                        value={summary}
                        onChange={(event) => setSummary(event.target.value)}
                        placeholder="예: 대학생이 AI로 재무설계 아이디어를 겨루는 공모전"
                        className={inputClassName}
                      />
                    </Field>

                    <Field label="상세 설명" htmlFor="contest-description">
                      <textarea
                        id="contest-description"
                        rows={4}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder={'○ 공모개요\n- 참가 대상:'}
                        className="w-full resize-y rounded-lg border border-[#E1E2EA] px-4 py-3 text-sm text-[#1B1B33] placeholder:text-[#B4B5C6] focus:border-[#4D4DF1] focus:outline-none"
                      />
                    </Field>
                  </div>

                  {/* 기간 · 링크 */}
                  <div className="mt-10 flex flex-col gap-7 border-t border-[#F0F0F5] pt-10">
                    <h2 className="text-2xl font-bold text-[#1B1B33]">기간 · 링크</h2>

                    <div className="flex items-end gap-3 sm:gap-6">
                      <div className="min-w-0 flex-1">
                        <Field label="시작일" htmlFor="contest-start-date" required>
                          <input
                            id="contest-start-date"
                            type="date"
                            value={startDate}
                            onChange={(event) => setStartDate(event.target.value)}
                            className={inputClassName}
                          />
                        </Field>
                      </div>
                      <ArrowRightIcon className="mb-3.5 h-5 w-5 shrink-0 text-[#B4B5C6]" />
                      <div className="min-w-0 flex-1">
                        <Field label="마감일" htmlFor="contest-end-date" required>
                          <input
                            id="contest-end-date"
                            type="date"
                            min={startDate || undefined}
                            value={endDate}
                            onChange={(event) => setEndDate(event.target.value)}
                            className={inputClassName}
                          />
                        </Field>
                      </div>
                    </div>

                    <Field label="원문 공고 링크" htmlFor="contest-url">
                      <input
                        id="contest-url"
                        type="text"
                        inputMode="url"
                        value={detailUrl}
                        onChange={(event) => setDetailUrl(event.target.value)}
                        placeholder="https://"
                        className={inputClassName}
                      />
                    </Field>
                  </div>

                  {/* 대상 */}
                  <div className="mt-10 flex flex-col gap-7 border-t border-[#F0F0F5] pt-10">
                    <h2 className="text-2xl font-bold text-[#1B1B33]">누구를 위한 활동인가요?</h2>

                    <Field label="추천 대상" htmlFor="contest-targets">
                      <input
                        id="contest-targets"
                        value={recommendedTargets}
                        onChange={(event) => setRecommendedTargets(event.target.value)}
                        placeholder="예: 데이터 분석에 관심 있는 대학생"
                        className={inputClassName}
                      />
                    </Field>

                    <div className="border-b border-[#F0F0F5] pb-7">
                      <div className="flex items-center justify-between gap-4">
                        <span id="school-only-label" className="text-[15px] font-semibold text-[#1B1B33]">
                          특정 학교 학생만 지원할 수 있어요
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={schoolOnly}
                          aria-labelledby="school-only-label"
                          onClick={() => {
                            setSchoolOnly((prev) => !prev)
                            setTargetSchool('')
                            setSchoolQuery('')
                          }}
                          className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
                            schoolOnly ? 'bg-[#4D4DF1]' : 'bg-[#E1E2EA]'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                              schoolOnly ? 'translate-x-[18px]' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>

                      {schoolOnly && (
                        <div className="mt-4">
                          {targetSchool ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#EEF0FC] px-2.5 py-1.5 text-xs font-semibold text-[#4D4DF1]">
                              {targetSchool}
                              <button
                                type="button"
                                aria-label={`${targetSchool} 선택 해제`}
                                onClick={() => setTargetSchool('')}
                                className="text-[#1B1B33]"
                              >
                                <XIcon className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ) : (
                            <div className="relative">
                              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A3A4B8]" />
                              <input
                                value={schoolQuery}
                                onChange={(event) => setSchoolQuery(event.target.value)}
                                placeholder="학교 이름으로 검색"
                                aria-label="학교 이름으로 검색"
                                className={`${inputClassName} pl-10`}
                              />
                              {schoolResults.length > 0 && (
                                <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-auto rounded-lg border border-[#E1E2EA] bg-white py-1 shadow-lg">
                                  {schoolResults.map((name) => (
                                    <li key={name}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setTargetSchool(name)
                                          setSchoolQuery('')
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-[#1B1B33] hover:bg-[#F5F5F9]"
                                      >
                                        {name}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {error && <p role="alert" className="mt-6 text-sm font-medium text-rose-500">{error}</p>}

                  <div className="mt-8 flex gap-4 sm:gap-14">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null)
                        setStep(1)
                      }}
                      className={`${secondaryButton} w-24 sm:w-[104px]`}
                    >
                      이전
                    </button>
                    <button type="submit" disabled={!isInfoComplete} className={`${primaryButton} flex-1`}>
                      다음
                    </button>
                  </div>
                </form>
              )}

              {step === 3 && field && (
                <div>
                  <h2 className="text-2xl font-bold text-[#1B1B33]">마지막으로 확인해주세요</h2>

                  <div className="mt-6 flex flex-col gap-4">
                    <ReviewSection
                      number="01"
                      title="기본 정보"
                      skipped={[
                        ...(organizer.trim() ? [] : ['주최 기관']),
                        ...(summary.trim() ? [] : ['한 줄 요약']),
                        ...(description.trim() ? [] : ['상세 설명']),
                      ]}
                      aside={
                        posterSrc ? (
                          <img src={posterSrc} alt={`${eventName} 포스터`} className="h-16 w-12 rounded-md object-cover" />
                        ) : null
                      }
                    >
                      <div className="grid gap-5 sm:grid-cols-2">
                        <ReviewItem label="활동 종류 · 분야">
                          <div className="flex flex-wrap gap-1.5">
                            <Chip>{eventName}</Chip>
                            <Chip accent>{EVENT_FIELD_LABELS[field]}</Chip>
                          </div>
                        </ReviewItem>
                        {organizer.trim() && <ReviewItem label="주최 기관">{organizer.trim()}</ReviewItem>}
                      </div>
                      <ReviewItem label={`${eventName} 이름`}>{title.trim()}</ReviewItem>
                      {summary.trim() && <ReviewItem label="한 줄 요약">{summary.trim()}</ReviewItem>}
                      {description.trim() && <ReviewItem label="상세 설명">{description.trim()}</ReviewItem>}
                    </ReviewSection>

                    <ReviewSection
                      number="02"
                      title="기간 · 링크"
                      skipped={detailUrl.trim() ? [] : ['원문 공고 링크']}
                    >
                      <ReviewItem label="접수 기간">
                        {startDate.replaceAll('-', '. ')} ~ {endDate.replaceAll('-', '. ')}
                      </ReviewItem>
                      {detailUrl.trim() && <ReviewItem label="원문 공고 링크">{detailUrl.trim()}</ReviewItem>}
                    </ReviewSection>

                    <ReviewSection
                      number="03"
                      title="대상"
                      skipped={recommendedTargets.trim() ? [] : ['추천 대상']}
                    >
                      <ReviewItem label="지원 대상">
                        {schoolOnly && targetSchool ? `${targetSchool} 학생` : '전국 대학생'}
                      </ReviewItem>
                      {recommendedTargets.trim() && (
                        <ReviewItem label="추천 대상">{recommendedTargets.trim()}</ReviewItem>
                      )}
                    </ReviewSection>
                  </div>

                  {error && <p role="alert" className="mt-6 text-sm font-medium text-rose-500">{error}</p>}

                  <div className="mt-8 flex gap-4 sm:gap-14">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null)
                        setStep(2)
                      }}
                      disabled={isSubmitting}
                      className={`${secondaryButton} w-24 sm:w-[104px]`}
                    >
                      이전
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={isSubmitting} className={`${primaryButton} flex-1`}>
                      {isSubmitting ? '등록 중...' : '등록하기'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="lg:pt-[196px]">
            <div className="rounded-2xl border border-[#E8E8EF] bg-white p-6 lg:sticky lg:top-6">
              <h3 className="text-[15px] font-bold text-[#1B1B33]">등록 전에 알아두세요</h3>
              <ol className="mt-5 flex flex-col gap-6">
                {TIPS.map((tip, index) => (
                  <li key={tip.title} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EEF0FC] text-xs font-semibold text-[#4D4DF1]">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#1B1B33]">{tip.title}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#6F7095]">{tip.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
