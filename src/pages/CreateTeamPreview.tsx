import { useState } from 'react'
import { useCreateTeamStore } from '../context/CreateTeam'
import { useNavigate } from 'react-router-dom'
import { ChevronRightIcon } from '../components/icons'
import { createTeamRecruitment, type TeamRequestPayload } from '../api/team'

const steps = ['팀 기본 정보', '모집 포지션', '미리보기']

export default function CreateTeamPreview() {
  const navigate = useNavigate()
  
  const { 
    eventId,
    title, 
    promotionText, 
    recruitmentStartDate, 
    recruitmentEndDate, 
    role, 
    capacity, 
    requiredSkills, 
    characteristic,
    reset 
  } = useCreateTeamStore()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      
      const payload: TeamRequestPayload = {
        eventId: eventId || undefined,
        title,
        promotionText: promotionText || undefined,
        role,
        characteristic: characteristic || undefined,
        requiredSkills: requiredSkills.length > 0 ? requiredSkills : undefined,
        capacity: capacity + 1, // 💡 팀장(본인)을 포함한 총원 계산을 위해 +1 추가
        recruitmentStartDate,
        recruitmentEndDate,
      }

     
      await createTeamRecruitment(payload)
      
      alert('팀 모집글이 성공적으로 등록되었습니다!')
      reset() 
      navigate('/contest') 
      
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : '등록 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-6 pb-10 pt-4">
            <h1 className="text-2xl font-extrabold text-neutral-900 mb-1">팀 만들기</h1>
            <p className="text-sm text-neutral-500 mb-6">입력하신 내용을 확인하고 제출해주세요!</p>

            {/* Stepper (진행바) */}
            <div className="flex items-center mb-8">
              {steps.map((s, i) => {
                const stepNum = i + 1
                const active = stepNum === 3
                const done = stepNum < 3
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

            {/* 01. 팀 기본 정보 요약 */}
            <section className="rounded-2xl border border-neutral-100 p-6 mb-6">
              <h2 className="text-base font-bold text-neutral-900 mb-5">
                <span className="text-[#4D4DF1]">01.</span> 팀 기본 정보
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-neutral-400 mb-1">제목</p>
                  <p className="text-sm text-neutral-900">{title || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-400 mb-1">진행 방식 및 한 줄 소개</p>
                  <p className="text-sm text-neutral-900 whitespace-pre-wrap">{promotionText || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-400 mb-1">모집 기간</p>
                  <p className="text-sm text-neutral-900">
                    {recruitmentStartDate || '-'} ~ {recruitmentEndDate || '-'}
                  </p>
                </div>
              </div>
            </section>

            {/* 02. 모집 포지션 요약 */}
            <section className="rounded-2xl border border-neutral-100 p-6 mb-6">
              <h2 className="text-base font-bold text-neutral-900 mb-5">
                <span className="text-[#4D4DF1]">02.</span> 모집 포지션
              </h2>

              <div className="rounded-xl border border-neutral-100 p-4">
                <div className="space-y-4">
                  {/* 역할 및 인원 */}
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs font-semibold text-neutral-400 mb-2">모집 역할</p>
                      {role.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {role.map((r) => (
                            <span key={r} className="rounded-full bg-[#EEF0FF] px-2.5 py-1 text-xs font-medium text-[#4D4DF1]">
                              {r}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-700">-</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-400 mb-2">모집 인원</p>
                      <p className="text-sm font-semibold text-neutral-900 pl-1">{capacity}명</p>
                    </div>
                  </div>

                  {/* 우대 역량 */}
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 mb-2">우대 역량</p>
                    {requiredSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {requiredSkills.map((s) => (
                          <span key={s} className="rounded-full bg-neutral-100 border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-700">-</p>
                    )}
                  </div>

                  {/* 특성 */}
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 mb-1">원하는 팀 특성</p>
                    <p className="text-sm text-neutral-700">{characteristic || '-'}</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
                className="mt-6 w-1/3 rounded-xl border border-neutral-200 py-3.5 text-sm font-bold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                이전으로
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="mt-6 flex-1 rounded-xl bg-[#4D4DF1] py-3.5 text-sm font-bold text-white hover:bg-[#3d3de0] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '제출 중...' : '제출하기'} <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
