// src/pages/MyTeamEdit.tsx
import { FormEvent, KeyboardEvent, ReactNode, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import {
  deleteTeam,
  getTeamDetail,
  updateTeamRecruitment,
  ForbiddenAccessError,
  ResourceNotFoundError,
} from '../api/team'
import type { TeamDetail, TeamRequestPayload } from '../types/team'

/* -----------------------------
   폼 상태 <-> API 변환
----------------------------- */

type FormState = {
  title: string
  promotionText: string
  characteristic: string
  role: string[]
  requiredSkills: string[]
  capacity: number
  recruitmentStartDate: string
  recruitmentEndDate: string
}

const toDateInput = (value: string | null | undefined) => (value ? value.slice(0, 10) : '')

function toForm(team: TeamDetail): FormState {
  return {
    title: team.title ?? '',
    promotionText: team.promotionText ?? '',
    characteristic: team.characteristic ?? '',
    role: team.role ?? [],
    requiredSkills: team.requiredSkills ?? [],
    capacity: team.capacity,
    recruitmentStartDate: toDateInput(team.recruitmentStartDate),
    recruitmentEndDate: toDateInput(team.recruitmentEndDate),
  }
}

function toPayload(form: FormState, eventId: number | null): TeamRequestPayload {
  return {
    ...(eventId != null ? { eventId } : {}),
    title: form.title.trim(),
    promotionText: form.promotionText.trim(),
    characteristic: form.characteristic.trim(),
    role: form.role,
    requiredSkills: form.requiredSkills,
    capacity: form.capacity,
    recruitmentStartDate: form.recruitmentStartDate,
    recruitmentEndDate: form.recruitmentEndDate,
  }
}

/* -----------------------------
   공통 레이아웃
----------------------------- */

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="md:pl-64">
        <Topbar />
        {children}
        <Footer />
      </div>
    </div>
  )
}

/* -----------------------------
   폼 UI 조각
----------------------------- */

const inputClass =
  'w-full rounded-lg border border-brand-100 px-3 py-2.5 text-sm text-brand-900 placeholder:text-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100'

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-brand-900">
        {label}
        {required && <span className="ml-0.5 text-brand-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-brand-400">{hint}</span>}
    </div>
  )
}

function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')

  const commit = () => {
    const tag = draft.trim()
    if (tag && !values.includes(tag)) onChange([...values, tag])
    setDraft('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 한글 IME 조합 중 Enter 중복 입력 방지
    if (e.nativeEvent.isComposing) return

    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !draft && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 rounded-lg border border-brand-100 px-2.5 py-2 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
      {values.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600"
        >
          {v}
          <button
            type="button"
            aria-label={`${v} 삭제`}
            onClick={() => onChange(values.filter((x) => x !== v))}
            className="text-brand-400 hover:text-brand-700"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={values.length === 0 ? placeholder : ''}
        className="min-w-[120px] flex-1 border-0 bg-transparent p-0.5 text-sm text-brand-900 outline-none placeholder:text-brand-300"
      />
    </div>
  )
}

/* -----------------------------
   페이지
----------------------------- */

export default function MyTeamEdit() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const id = Number(idParam)

  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError('잘못된 접근입니다.')
      setLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const data = await getTeamDetail(id)
        if (cancelled) return

        if (!data.leader) {
          setError('팀장만 팀 정보를 수정할 수 있어요.')
          return
        }

        setTeam(data)
        setForm(toForm(data))
      } catch (e) {
        if (cancelled) return
        setError(
          e instanceof ResourceNotFoundError
            ? '존재하지 않거나 삭제된 팀이에요.'
            : e instanceof Error
              ? e.message
              : '팀 정보를 불러오지 못했어요.'
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))

  const validate = (f: FormState, t: TeamDetail): string | null => {
    if (!f.title.trim()) return '제목을 입력해주세요.'
    if (f.role.length === 0) return '모집 포지션을 한 개 이상 입력해주세요.'
    if (!Number.isInteger(f.capacity) || f.capacity < 1) return '모집 인원은 1명 이상이어야 해요.'
    if (f.capacity < t.currentMemberCount)
      return `현재 팀원이 ${t.currentMemberCount}명이라 그보다 적게 설정할 수 없어요.`
    if (!f.recruitmentStartDate || !f.recruitmentEndDate) return '모집 기간을 입력해주세요.'
    if (f.recruitmentEndDate < f.recruitmentStartDate)
      return '모집 종료일은 시작일 이후여야 해요.'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form || !team || submitting || deleting) return

    const message = validate(form, team)
    if (message) {
      setError(message)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await updateTeamRecruitment(id, toPayload(form, team.eventId))
      navigate(`/my/teams/${id}`, { replace: true })
    } catch (e) {
      if (e instanceof ForbiddenAccessError) setError('수정 권한이 없어요.')
      else if (e instanceof ResourceNotFoundError) setError('존재하지 않거나 삭제된 팀이에요.')
      else setError(e instanceof Error ? e.message : '수정 중 오류가 발생했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (submitting || deleting) return
    if (!window.confirm('팀 모집글을 삭제하시겠어요? 삭제한 모집글은 복구할 수 없어요.')) return

    setDeleting(true)
    setError(null)

    try {
      await deleteTeam(id)
      navigate('/my/teams', { replace: true })
    } catch (e) {
      if (e instanceof ForbiddenAccessError) setError('삭제 권한이 없어요.')
      else if (e instanceof ResourceNotFoundError) setError('존재하지 않거나 이미 삭제된 팀이에요.')
      else setError(e instanceof Error ? e.message : '삭제 중 오류가 발생했어요.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-6 py-12">
          <div className="h-5 w-24 animate-pulse rounded bg-brand-50" />
          <div className="mt-6 h-96 animate-pulse rounded-2xl bg-brand-50" />
        </main>
      </Shell>
    )
  }

  if (!form || !team) {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-sm text-brand-400">{error || '팀 정보를 찾을 수 없어요.'}</p>
          <Link
            to="/my/teams"
            className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-800"
          >
            모집한 팀으로 돌아가기
          </Link>
        </main>
      </Shell>
    )
  }

  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-6 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-brand-400">
          <Link to="/my" className="hover:text-brand-600">내 활동</Link>
          <span>/</span>
          <Link to="/my/teams" className="hover:text-brand-600">모집한 팀</Link>
          <span>/</span>
          <Link to={`/my/teams/${id}`} className="hover:text-brand-600">팀 상세</Link>
          <span>/</span>
          <span className="text-brand-700">팀 정보 수정</span>
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-brand-900">팀 정보 수정</h1>
        <p className="mt-1 text-sm text-brand-400">모집글에 표시되는 정보를 수정할 수 있어요.</p>

        {team.eventId != null && team.connectedActivityTitle && (
          <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 px-5 py-4">
            <p className="text-xs text-brand-400">연결된 공모전</p>
            <p className="mt-0.5 text-sm font-semibold text-brand-900">
              {team.connectedActivityTitle}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <section className="space-y-5 rounded-2xl border border-brand-100 p-6">
            <h2 className="text-base font-bold text-brand-900">기본 정보</h2>

            <Field label="팀 이름" required>
              <input
                className={inputClass}
                value={form.title}
                maxLength={100}
                onChange={(e) => update('title', e.target.value)}
                placeholder="팀 모집글 제목"
              />
            </Field>

            <Field label="팀 소개">
              <textarea
                className={`${inputClass} min-h-[140px] resize-y`}
                value={form.promotionText}
                onChange={(e) => update('promotionText', e.target.value)}
                placeholder="팀과 프로젝트를 소개해주세요"
              />
            </Field>

            <Field label="팀 성향" hint="팀이 일하는 방식이나 분위기를 적어주세요.">
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                value={form.characteristic}
                onChange={(e) => update('characteristic', e.target.value)}
                placeholder="예: 주 2회 정기 회의, 의견을 적극적으로 나누는 분위기"
              />
            </Field>
          </section>

          <section className="space-y-5 rounded-2xl border border-brand-100 p-6">
            <h2 className="text-base font-bold text-brand-900">모집 조건</h2>

            <Field label="모집 포지션" required hint="Enter 또는 쉼표(,)로 추가해요.">
              <TagInput
                values={form.role}
                onChange={(next) => update('role', next)}
                placeholder="예: 프론트엔드"
              />
            </Field>

            <Field label="요구 스킬" hint="Enter 또는 쉼표(,)로 추가해요.">
              <TagInput
                values={form.requiredSkills}
                onChange={(next) => update('requiredSkills', next)}
                placeholder="예: React, Spring"
              />
            </Field>

            <Field
              label="모집 인원"
              required
              hint={`현재 ${team.currentMemberCount}명이 참여 중이에요.`}
            >
              <input
                type="number"
                min={Math.max(1, team.currentMemberCount)}
                className={inputClass}
                value={form.capacity}
                onChange={(e) => update('capacity', Number(e.target.value))}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="모집 시작일" required>
                <input
                  type="date"
                  className={inputClass}
                  value={form.recruitmentStartDate}
                  onChange={(e) => update('recruitmentStartDate', e.target.value)}
                />
              </Field>
              <Field label="모집 종료일" required>
                <input
                  type="date"
                  className={inputClass}
                  min={form.recruitmentStartDate || undefined}
                  value={form.recruitmentEndDate}
                  onChange={(e) => update('recruitmentEndDate', e.target.value)}
                />
              </Field>
            </div>
          </section>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting || deleting}
              className="rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? '삭제 중...' : '삭제하기'}
            </button>
            <div className="flex gap-2">
              <Link
                to={`/my/teams/${id}`}
                aria-disabled={deleting}
                tabIndex={deleting ? -1 : undefined}
                className="rounded-lg border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={submitting || deleting}
                className="rounded-lg bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </Shell>
  )
}