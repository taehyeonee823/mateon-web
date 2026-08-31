import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRightIcon } from '../components/icons'
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

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-6 pb-10 pt-4">
            <h1 className="text-2xl font-extrabold text-neutral-900 mb-1">팀 만들기</h1>
            <p className="text-sm text-neutral-500 mb-6">공모전/대외활동을 함께할 팀원을 모집해보세요!</p>

            
            <div className="flex items-center mb-8">
              {steps.map((s, i) => {
                const stepNum = i + 1
                const active = stepNum === 2
                const done = stepNum < 2
                return (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          active
                            ? 'bg-[#4D4DF1] text-white'
                            : done
                              ? 'bg-[#EEF0FF] text-[#4D4DF1]'
                              : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        {stepNum}
                      </span>
                      <span
                        className={`text-sm ${
                          active ? 'font-bold text-neutral-900' : done ? 'text-neutral-500' : 'text-neutral-400'
                        }`}
                      >
                        {s}
                      </span>
                    </div>
                    {i < steps.length - 1 && <div className="flex-1 h-px bg-neutral-100 mx-3" />}
                  </div>
                )
              })}
            </div>

            <section className="rounded-2xl border border-neutral-100 p-6">
              <h2 className="text-base font-bold text-neutral-900 mb-5">
                <span className="text-[#4D4DF1]">02.</span> 어떤 포지션을 모집하나요?
              </h2>

              <div className="mb-6 grid grid-cols-1 md:grid-cols-[1fr_140px] gap-6 md:gap-3">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    역할 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, addRole)}
                      placeholder="예) 프론트엔드, AI 기획"
                      className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[#4D4DF1]"
                    />
                    <button
                      type="button"
                      onClick={addRole}
                      className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    >
                      +
                    </button>
                  </div>
                  {role.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {role.map((r: string) => (
                        <div key={r} className="flex items-center gap-1 rounded-full bg-[#EEF0FF] px-3 py-1.5 border border-[#4D4DF1]/20">
                          <span className="text-sm font-medium text-[#4D4DF1]">{r}</span>
                          <button onClick={() => removeRole(r)} className="text-[#4D4DF1] hover:text-indigo-800 ml-1">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    모집 인원 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-neutral-200 px-2 h-[42px]">
                    <button
                      type="button"
                      onClick={() => setCapacity(Math.max(1, capacity - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-sm font-semibold text-neutral-900">
                      {capacity}명
                    </span>
                    <button
                      type="button"
                      onClick={() => setCapacity(capacity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

           
              <div className="mb-6">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  우대 역량 <span className="text-xs font-normal text-neutral-400">(선택)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, addSkill)}
                    placeholder="예) React 사용 경험, Figma 능숙 등"
                    className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[#4D4DF1]"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  >
                    +
                  </button>
                </div>
                {requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {requiredSkills.map((s: string) => (
                      <div key={s} className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1.5 border border-neutral-200">
                        <span className="text-sm font-medium text-neutral-700">{s}</span>
                        <button onClick={() => removeSkill(s)} className="text-neutral-400 hover:text-neutral-600 ml-1">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  원하는 팀 특성 <span className="text-xs font-normal text-neutral-400">(선택)</span>
                </label>
                <input
                  value={characteristic}
                  onChange={(e) => setField('characteristic', e.target.value)}
                  placeholder="예) 오프라인 모임 선호, 꼼꼼하고 책임감 있는 분 등"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[#4D4DF1]"
                />
              </div>
            </section>

            <button
              disabled={!isValid}
              onClick={() => navigate('/teams/new/preview')}
              className="mt-6 w-full rounded-xl bg-[#4D4DF1] py-3.5 text-sm font-bold text-white hover:bg-[#3d3de0] flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              다음으로 <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
