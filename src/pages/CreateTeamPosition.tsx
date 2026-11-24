import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateTeamStore } from '../context/CreateTeam'

const steps = ['팀 기본 정보', '모집 포지션', '미리보기']

export default function CreateTeamPosition() {
  const navigate = useNavigate()
  
  const {
    role = [],
    capacity = 1,
    requiredSkills = [],
    characteristic = '',
    setCapacity,
    setField,
  } = useCreateTeamStore()

  const [roleInput, setRoleInput] = useState('')
  const [skillInput, setSkillInput] = useState('')

  const isValid = role.length > 0 && capacity > 0

  const addRole = () => {
    const value = roleInput.trim()
    if (!value) return
    if (!role.includes(value)) {
      setField('role', [...role, value])
    }
    setRoleInput('')
  }

  const removeRole = (target: string) => {
    setField('role', role.filter((r: string) => r !== target))
  }

  const addSkill = () => {
    const value = skillInput.trim()
    if (!value) return
    if (!requiredSkills.includes(value)) {
      setField('requiredSkills', [...requiredSkills, value])
    }
    setSkillInput('')
  }

  const removeSkill = (target: string) => {
    setField('requiredSkills', requiredSkills.filter((s: string) => s !== target))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, action: () => void) => {
    if (e.key !== 'Enter') return
    if (e.nativeEvent.isComposing) return
    e.preventDefault()
    action()
  }

  const inputClassName =
    'h-12 min-w-0 flex-1 rounded-lg border border-[#E1E2EA] bg-white px-4 text-sm text-[#1B1B33] placeholder:text-[#B4B5C6] focus:border-[#4D4DF1] focus:outline-none'

  return (
    <div className="min-h-full bg-[#F7F7F9]">
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_232px] lg:gap-[72px]">
          <div className="min-w-0">
            <header>
              <h1 className="text-[32px] font-extrabold tracking-tight text-[#1B1B33]">팀 만들기</h1>
              <p className="mt-3 text-base text-[#1B1B33]">
                함께할 팀원을 모아보세요. 만들고 나면 팀원을 추천해 드려요.
              </p>
            </header>

            <ol className="mt-8 flex items-center gap-3 sm:mt-10 sm:gap-6">
              {steps.map((stepLabel, index) => {
                const stepNumber = index + 1
                const isCurrent = stepNumber === 2
                const isDone = stepNumber < 2
                return (
                  <li
                    key={stepLabel}
                    className={`flex min-w-0 items-center gap-3 sm:gap-6 ${
                      index < steps.length - 1 ? 'flex-1' : ''
                    }`}
                  >
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          isCurrent
                            ? 'bg-[#4D4DF1] text-white'
                            : isDone
                              ? 'bg-[#EEF0FC] text-[#4D4DF1]'
                              : 'border border-[#C9CAD6] bg-white text-[#A3A4B8]'
                        }`}
                      >
                        {isDone ? '✓' : stepNumber}
                      </span>
                      <span
                        className={`whitespace-nowrap text-xs sm:text-sm ${
                          isCurrent
                            ? 'font-bold text-[#1B1B33]'
                            : isDone
                              ? 'text-[#1B1B33]'
                              : 'text-[#A3A4B8]'
                        }`}
                      >
                        {stepLabel}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <span
                        className={`h-0.5 min-w-2 flex-1 rounded-full ${
                          isDone ? 'bg-[#4D4DF1]' : 'bg-[#E1E2EA]'
                        }`}
                      />
                    )}
                  </li>
                )
              })}
            </ol>

            <section className="mt-7 rounded-2xl border border-[#E8E8EF] bg-white p-6 sm:mt-8 sm:p-8">
              <h2 className="text-xl font-bold text-[#1B1B33]">어떤 포지션을 모집하나요?</h2>

              <div className="mt-6">
                <label htmlFor="team-role" className="block text-[15px] font-semibold text-[#1B1B33]">
                  모집 역할<span className="ml-0.5 text-[#FF5A5A]">*</span>
                </label>
                <div className="mt-2.5 flex gap-3">
                  <input
                    id="team-role"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, addRole)}
                    placeholder="예: 백엔드, 프론트엔드"
                    className={inputClassName}
                  />
                  <button
                    type="button"
                    disabled={!roleInput.trim()}
                    onClick={addRole}
                    className={`h-12 w-[72px] shrink-0 rounded-lg text-sm font-semibold transition-colors ${
                      roleInput.trim()
                        ? 'bg-[#4D4DF1] text-white hover:bg-[#3D3DD9]'
                        : 'cursor-not-allowed bg-[#E8E8EE] text-[#8B8CA3]'
                    }`}
                  >
                    추가
                  </button>
                </div>
                {role.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {role.map((item: string) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-2 rounded-full border border-[#C7CEFF] bg-[#F5F7FF] px-3 py-1.5 text-xs font-medium text-[#1B2A78]"
                      >
                        {item}
                        <button
                          type="button"
                          aria-label={`${item} 역할 삭제`}
                          onClick={() => removeRole(item)}
                          className="text-[#707070] transition-colors hover:text-[#1B1B33]"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between border-b border-[#F0F0F5] pb-6">
                <span className="text-[15px] font-semibold text-[#1B1B33]">팀 인원</span>
                <div className="flex h-10 w-[144px] items-center rounded-lg border border-[#E1E2EA] px-1">
                  <button
                    type="button"
                    aria-label="팀 인원 줄이기"
                    onClick={() => setCapacity(Math.max(1, capacity - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-lg text-[#6F7095] transition-colors hover:bg-[#F5F5F9]"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center text-sm font-semibold text-[#1B1B33]">{capacity}명</span>
                  <button
                    type="button"
                    aria-label="팀 인원 늘리기"
                    onClick={() => setCapacity(capacity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-lg text-[#6F7095] transition-colors hover:bg-[#F5F5F9]"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-xl font-bold text-[#1B1B33]">이런 분이면 더 좋아요</h3>
                <label htmlFor="team-skills" className="mt-5 block text-[15px] font-semibold text-[#1B1B33]">
                  우대 역량
                </label>
                <div className="mt-2.5 flex gap-3">
                  <input
                    id="team-skills"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, addSkill)}
                    placeholder="예: React 사용 경험, Figma 사용 경험"
                    className={inputClassName}
                  />
                  <button
                    type="button"
                    disabled={!skillInput.trim()}
                    onClick={addSkill}
                    className={`h-12 w-[72px] shrink-0 rounded-lg text-sm font-semibold transition-colors ${
                      skillInput.trim()
                        ? 'bg-[#4D4DF1] text-white hover:bg-[#3D3DD9]'
                        : 'cursor-not-allowed bg-[#E8E8EE] text-[#8B8CA3]'
                    }`}
                  >
                    추가
                  </button>
                </div>
                {requiredSkills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {requiredSkills.map((item: string) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-2 rounded-full bg-[#EEF0FC] px-3 py-1.5 text-xs font-medium text-[#4D4DF1]"
                      >
                        {item}
                        <button
                          type="button"
                          aria-label={`${item} 역량 삭제`}
                          onClick={() => removeSkill(item)}
                          className="text-[#8B8CA3] transition-colors hover:text-[#4D4DF1]"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 border-b border-[#F0F0F5] pb-6">
                <label htmlFor="team-characteristic" className="block text-[15px] font-semibold text-[#1B1B33]">
                  원하는 팀 분위기
                </label>
                <textarea
                  id="team-characteristic"
                  value={characteristic}
                  onChange={(e) => setField('characteristic', e.target.value)}
                  placeholder="예: 오프라인 모임 선호, 꼼꼼하고 책임감 있는 분 등"
                  rows={3}
                  className="mt-2.5 min-h-[88px] w-full resize-y rounded-lg border border-[#E1E2EA] bg-white px-4 py-3 text-sm text-[#1B1B33] placeholder:text-[#B4B5C6] focus:border-[#4D4DF1] focus:outline-none"
                />
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/teams/new')}
                  className="h-12 w-28 shrink-0 rounded-lg border border-[#E1E2EA] bg-white text-sm font-semibold text-[#1B1B33] transition-colors hover:bg-[#F5F5F9]"
                >
                  이전
                </button>
                <button
                  type="button"
                  disabled={!isValid}
                  onClick={() => navigate('/teams/new/preview')}
                  className="h-12 flex-1 rounded-lg bg-[#4D4DF1] text-sm font-semibold text-white transition-colors hover:bg-[#3D3DD9] disabled:cursor-not-allowed disabled:bg-[#E8E8EE] disabled:text-[#A3A4B8]"
                >
                  다음
                </button>
              </div>
            </section>
          </div>

          <aside className="lg:pt-[196px]">
            <div className="rounded-2xl border border-[#E8E8EF] bg-white p-6 lg:sticky lg:top-6">
              <h3 className="text-[15px] font-bold text-[#1B1B33]">만들기 전에 알아두세요</h3>
              <ol className="mt-5 flex flex-col gap-6">
                {[
                  ['활동 하나에 팀 하나', '같은 활동으로는 팀을 하나만 만들 수 있어요.'],
                  ['드림이가 팀을 추천해줘요', '자세히 쓸수록 드림이가 더 잘 맞는 팀원을 찾아드려요.'],
                  ['마감되면 모집이 끝나요', '모집 마감일이 지나면 팀 목록에서 자동으로 빠져요.'],
                ].map(([tipTitle, description], index) => (
                  <li key={tipTitle} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EEF0FC] text-xs font-semibold text-[#4D4DF1]">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#1B1B33]">{tipTitle}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#6F7095]">{description}</p>
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
