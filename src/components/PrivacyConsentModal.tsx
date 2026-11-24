import { useEffect, useId, useState } from 'react'
import type { ConsentKey, ConsentResult } from '../lib/consent'

export type { ConsentKey, ConsentResult }

type ConsentItem = {
  key: ConsentKey
  label: string
  required: boolean
  detail?: string
}

// TODO: 실제 서비스 오픈 전 법무 검토를 거친 정식 약관/방침 문구로 교체하세요.
const CONSENT_ITEMS: ConsentItem[] = [
  {
    key: 'terms',
    label: '서비스 이용약관 동의',
    required: true,
    detail:
      'MateOn은 대학생 공모전 팀원 매칭 서비스입니다. 회원은 타인의 정보를 도용하거나 허위 정보를 등록해서는 안 되며, 서비스 내 채팅·제안 기능을 다른 회원에게 불쾌감을 주는 용도로 사용할 수 없습니다. 위반 시 서비스 이용이 제한될 수 있습니다.',
  },
  {
    key: 'privacy',
    label: '개인정보 수집 및 이용 동의',
    required: true,
    detail: [
      '[수집 항목]',
      '· 이메일 가입: 교육기관 이메일, 비밀번호, 이름, 학교, 계열, 학과, 희망 직무(1~3순위)',
      '· 카카오 가입: 카카오 계정 식별자, 이름, 학교, 계열, 학과, 희망 직무(1~3순위)',
      '',
      '[수집 목적]',
      '· 회원 식별 및 재학생 인증',
      '· 공모전 팀 구성, 팀원 추천 및 매칭',
      '· 채팅, 알림 등 서비스 제공',
      '',
      '[보유 및 이용 기간]',
      '· 회원 탈퇴 시까지. 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.',
      '',
      '동의를 거부할 권리가 있으나, 거부 시 회원가입이 제한됩니다.',
    ].join('\n'),
  },
  {
    key: 'age',
    label: '만 14세 이상입니다',
    required: true,
  },
  {
    key: 'marketing',
    label: '마케팅 정보 수신 동의',
    required: false,
    detail:
      '신규 공모전 소식, 이벤트 및 혜택 정보를 이메일이나 알림으로 받아볼 수 있습니다. 동의하지 않아도 서비스 이용에는 제한이 없으며, 언제든지 철회할 수 있습니다.',
  },
]

const INITIAL_STATE: ConsentResult = {
  terms: false,
  privacy: false,
  age: false,
  marketing: false,
}

export default function PrivacyConsentModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (result: ConsentResult) => void
}) {
  const titleId = useId()
  const [checked, setChecked] = useState<ConsentResult>(INITIAL_STATE)
  const [expanded, setExpanded] = useState<ConsentKey | null>(null)

  // 열릴 때마다 상태 초기화
  useEffect(() => {
    if (open) {
      setChecked(INITIAL_STATE)
      setExpanded(null)
    }
  }, [open])

  // ESC 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const isAllChecked = CONSENT_ITEMS.every((item) => checked[item.key])
  const isRequiredChecked = CONSENT_ITEMS.filter((item) => item.required).every(
    (item) => checked[item.key],
  )

  const toggleAll = () => {
    const next = !isAllChecked
    setChecked({ terms: next, privacy: next, age: next, marketing: next })
  }

  const toggleItem = (key: ConsentKey) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <header className="flex items-start justify-between px-6 pb-4 pt-6">
          <div>
            <h2 id={titleId} className="text-xl font-bold text-brand-900">
              약관 동의
            </h2>
            <p className="mt-1 text-sm text-[#6F7095]">
              MateOn 서비스 이용을 위해 약관에 동의해주세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="-mr-2 -mt-1 rounded-lg p-2 text-brand-400 hover:bg-slate-100"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#D8E1FD] bg-[#F5F7FF] px-4 py-4">
            <input
              type="checkbox"
              checked={isAllChecked}
              onChange={toggleAll}
              className="h-5 w-5 shrink-0 accent-[#2554F0]"
            />
            <span className="text-base font-semibold text-brand-900">전체 동의</span>
          </label>

          <ul className="mt-2 divide-y divide-slate-100">
            {CONSENT_ITEMS.map((item) => {
              const isExpanded = expanded === item.key
              return (
                <li key={item.key} className="py-3">
                  <div className="flex items-center gap-3 px-1">
                    <label className="flex flex-1 cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked[item.key]}
                        onChange={() => toggleItem(item.key)}
                        className="h-5 w-5 shrink-0 accent-[#2554F0]"
                      />
                      <span className="text-sm text-brand-900">
                        <span className={item.required ? 'font-semibold text-[#2554F0]' : 'text-brand-400'}>
                          [{item.required ? '필수' : '선택'}]
                        </span>{' '}
                        {item.label}
                      </span>
                    </label>
                    {item.detail && (
                      <button
                        type="button"
                        onClick={() => setExpanded(isExpanded ? null : item.key)}
                        aria-expanded={isExpanded}
                        className="shrink-0 text-xs font-medium text-brand-400 underline"
                      >
                        {isExpanded ? '접기' : '보기'}
                      </button>
                    )}
                  </div>
                  {item.detail && isExpanded && (
                    <p className="mt-3 max-h-48 overflow-y-auto whitespace-pre-line rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-[#6F7095]">
                      {item.detail}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        <footer className="px-6 pb-6 pt-4">
          <button
            type="button"
            disabled={!isRequiredChecked}
            onClick={() => onConfirm(checked)}
            className="h-14 w-full rounded-xl bg-[#2554F0] text-lg font-semibold text-white transition-opacity disabled:opacity-40"
          >
            동의하고 계속하기
          </button>
        </footer>
      </section>
    </div>
  )
}