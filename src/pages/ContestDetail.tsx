import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

/* ────────────────────────────────────────────────────────────────
 * Icons (inlined so this file has zero external icon dependency)
 * ──────────────────────────────────────────────────────────────── */
function ArrowLeftIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth={2} />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}

function UsersIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth={2} />
      <path d="M2.5 20c1-3.5 3.8-5.5 6.5-5.5s5.5 2 6.5 5.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <path d="M16 4.5c1.6.4 2.8 1.9 2.8 3.5s-1.2 3.1-2.8 3.5M21.5 20c-.6-2.2-1.9-3.8-3.5-4.7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}

function GiftIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="9" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth={2} />
      <path d="M3 9h18v0M12 9v12M7.5 9C6 9 4.8 7.8 4.8 6.3S6 3.5 7.5 3.5 10 5.8 12 9c2-3.2 3-5.5 4.5-5.5s2.7 1.3 2.7 2.8S18 9 16.5 9" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  )
}

function ShareIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth={2} />
      <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth={2} />
      <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth={2} />
      <path d="M8.2 10.8l7.6-4.2M8.2 13.2l7.6 4.2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}

function BookmarkIcon({ className = '', filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} className={className}>
      <path d="M6 4h12v16l-6-4-6 4V4z" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  )
}

/* ────────────────────────────────────────────────────────────────
 * Types & dummy data
 * ──────────────────────────────────────────────────────────────── */
type ContestDetail = {
  id: string
  title: string
  org: string
  category: string
  prize: string
  deadline: string
  startDate: string
  tags: string[]
  imageUrl: string
  recommendedTargets: string
  detailUrl: string
  description: { heading: string; body: string[] }[]
}

// 🔧 더미 데이터 — 실제 연결 시 상세 API 응답으로 교체
const CONTEST_DETAILS: Record<string, ContestDetail> = {
  c1: {
    id: 'c1',
    title: '2026 대학생 AI 서비스 아이디어 공모전',
    org: '과학기술정보통신부',
    category: '과학/공학/기술/IT',
    prize: '총상금 2,000만원',
    deadline: '2026-09-05',
    startDate: '2026-08-01',
    tags: ['대상 500만원', '전국 대학생'],
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop',
    recommendedTargets: '전국 대학(원)생, AI·서비스 기획에 관심 있는 개인 또는 팀(최대 4인)',
    detailUrl: 'https://example.com/apply/c1',
    description: [
      {
        heading: '공모전 소개',
        body: [
          '일상 속 문제를 AI로 해결하는 서비스 아이디어를 발굴하기 위한 전국 단위 공모전입니다.',
          '기획서 단계부터 프로토타입 제작까지, 아이디어를 실제로 검증해볼 수 있는 멘토링을 함께 제공합니다.',
        ],
      },
      {
        heading: '진행 방식',
        body: [
          '1차 서류심사 이후 통과 팀에 한해 2주간의 프로토타입 제작 기간이 주어집니다.',
          '최종 발표는 오프라인 데모데이 형식으로 진행되며, 현장 심사를 통해 수상팀이 결정됩니다.',
        ],
      },
      {
        heading: '혜택',
        body: ['대상 500만원 등 총상금 2,000만원 지급', '우수팀 대상 정부 지원사업 연계 컨설팅 제공', '전 참가팀 수료증 발급'],
      },
    ],
  },
  c2: {
    id: 'c2',
    title: '브랜드 리뉴얼 디자인 챌린지',
    org: '한국디자인진흥원',
    category: '디자인/사진/예술/영상',
    prize: '총상금 800만원',
    deadline: '2026-08-28',
    startDate: '2026-07-25',
    tags: ['포트폴리오 인정', '개인/팀'],
    imageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=1600&auto=format&fit=crop',
    recommendedTargets: '디자인 전공(예정)자 및 브랜딩에 관심 있는 대학생, 개인 또는 3인 이내 팀',
    detailUrl: 'https://example.com/apply/c2',
    description: [
      {
        heading: '공모전 소개',
        body: ['지역 소상공인 브랜드 3곳을 대상으로 실제 리뉴얼 디자인을 제안하는 실무형 챌린지입니다.'],
      },
      {
        heading: '진행 방식',
        body: ['참가 신청 시 브랜드 3곳 중 1곳을 선택해 로고·패키지·홍보물을 포함한 리뉴얼 시안을 제출합니다.'],
      },
      {
        heading: '혜택',
        body: ['수상작은 실제 브랜드에 적용 및 포트폴리오 활용 동의 후 지원 가능', '전문 디자이너 1:1 피드백 제공'],
      },
    ],
  },
}

const TODAY = new Date('2026-08-18')

function dDay(deadline: string) {
  const target = new Date(deadline)
  const diff = Math.ceil((target.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: '마감', urgent: false, closed: true }
  if (diff === 0) return { label: 'D-DAY', urgent: true, closed: false }
  return { label: `D-${diff}`, urgent: diff <= 7, closed: false }
}

function formatDate(date: string) {
  const d = new Date(date)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/* ────────────────────────────────────────────────────────────────
 * Page
 * ──────────────────────────────────────────────────────────────── */
export default function ContestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const onBack = () => navigate(-1)

  const contest = id ? CONTEST_DETAILS[id] : undefined
  const d = useMemo(() => (contest ? dDay(contest.deadline) : null), [contest])

  if (!contest) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-sm font-medium text-[#8C8DAE]">해당 공모전 정보를 찾을 수 없어요.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#F3F3FA] px-4 py-2 text-sm font-semibold text-[#6F7095] hover:bg-[#E9E9FB]"
        >
          <ArrowLeftIcon className="h-4 w-4" /> 목록으로
        </button>
      </div>
    )
  }

  return (
    <div className="pb-28 lg:pb-16">
      {/* Hero */}
      <div className="relative h-[42vh] min-h-[280px] w-full overflow-hidden bg-[#141A33] sm:h-[46vh]">
        <img src={contest.imageUrl} alt="" className="h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

        <button
          type="button"
          onClick={onBack}
          className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-sm font-semibold text-[#1B1B33] backdrop-blur-sm transition-colors hover:bg-white sm:left-6 sm:top-6"
        >
          <ArrowLeftIcon className="h-4 w-4" /> 목록
        </button>

        <div className="absolute right-4 top-4 flex gap-2 sm:right-6 sm:top-6">
          <button
            type="button"
            aria-label="북마크"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#1B1B33] backdrop-blur-sm transition-colors hover:bg-white"
          >
            <BookmarkIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="공유하기"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#1B1B33] backdrop-blur-sm transition-colors hover:bg-white"
          >
            <ShareIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-6 pb-6 sm:pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#4D4DF1]">
              {contest.category}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${
                d?.closed ? 'bg-white/25' : d?.urgent ? 'bg-[#FF6B57]' : 'bg-white/25'
              }`}
            >
              {d?.label}
            </span>
          </div>
          <h1 className="mt-3 max-w-2xl text-2xl font-extrabold leading-snug text-white sm:text-3xl">
            {contest.title}
          </h1>
          <p className="mt-1.5 text-sm font-medium text-white/80">{contest.org}</p>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 pt-8 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap gap-1.5">
            {contest.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-[#F3F3FA] px-2.5 py-1 text-[12px] font-medium text-[#6F7095]">
                {tag}
              </span>
            ))}
          </div>

          {contest.description.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-3 text-lg font-bold text-[#1B1B33]">{section.heading}</h2>
              <div className="flex flex-col gap-2">
                {section.body.map((line, i) => (
                  <p key={i} className="text-[14px] leading-relaxed text-[#4A4B63]">
                    {line}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1B1B33]">추천 대상</h2>
            <p className="rounded-xl bg-[#F8F8FD] px-4 py-3 text-[14px] leading-relaxed text-[#4A4B63]">
              {contest.recommendedTargets}
            </p>
          </section>
        </div>

        {/* Sticky info card (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 flex flex-col gap-4 rounded-2xl border border-[#ECECF5] bg-white p-5 shadow-sm shadow-black/[0.03]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF1EE] text-[#FF6B57]">
                <GiftIcon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#8C8DAE]">시상 규모</p>
                <p className="text-[14px] font-bold text-[#1B1B33]">{contest.prize}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-[#4D4DF1]">
                <CalendarIcon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#8C8DAE]">접수 기간</p>
                <p className="text-[14px] font-bold text-[#1B1B33]">
                  {formatDate(contest.startDate)} ~ {formatDate(contest.deadline)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF7F0] text-[#3FAE68]">
                <UsersIcon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#8C8DAE]">참가 대상</p>
                <p className="text-[14px] font-bold text-[#1B1B33]">{contest.recommendedTargets.split(',')[0]}</p>
              </div>
            </div>

            <a
              href={contest.detailUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-1 rounded-xl bg-[#4D4DF1] py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              지원하러 가기
            </a>
          </div>
        </aside>
      </div>

      {/* Sticky CTA (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ECECF5] bg-white/95 px-5 py-3 backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-[#8C8DAE]">{formatDate(contest.deadline)} 마감</p>
            <p className="truncate text-[13px] font-bold text-[#1B1B33]">{contest.prize}</p>
          </div>
          <a
            href={contest.detailUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="shrink-0 rounded-xl bg-[#4D4DF1] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            지원하러 가기
          </a>
        </div>
      </div>
    </div>
  )
}