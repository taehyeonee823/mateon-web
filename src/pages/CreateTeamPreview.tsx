import { useState } from 'react'
import { useCreateTeamStore } from '../context/CreateTeam'
import { useNavigate } from 'react-router-dom'
import { createTeamRecruitment} from '../api/team'
import { TeamRequestPayload } from '../types/team'

const steps = ['팀 기본 정보', '모집 포지션', '미리보기']

export default function CreateTeamPreview() {
  const navigate = useNavigate()
  
  const { 
    eventId,
    selectedEvent,
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
                const isCurrent = stepNumber === 3
                const isDone = stepNumber < 3
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
                            : 'bg-[#EEF0FC] text-[#4D4DF1]'
                        }`}
                      >
                        {isDone ? '✓' : stepNumber}
                      </span>
                      <span
                        className={`whitespace-nowrap text-xs sm:text-sm ${
                          isCurrent ? 'font-bold text-[#1B1B33]' : 'text-[#1B1B33]'
                        }`}
                      >
                        {stepLabel}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <span className="h-0.5 min-w-2 flex-1 rounded-full bg-[#4D4DF1]" />
                    )}
                  </li>
                )
              })}
            </ol>

            <section className="mt-7 rounded-2xl border border-[#E8E8EF] bg-white p-6 sm:mt-8 sm:p-8">
              <h2 className="text-xl font-bold text-[#1B1B33]">마지막으로 확인해주세요</h2>

              <section className="mt-6 rounded-xl bg-[#F7F8FA] p-5 sm:p-6">
                <h3 className="text-base font-bold text-[#1B1B33]">
                  <span className="text-[#4D4DF1]">01.</span> 팀 기본 정보
                </h3>
                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-[#A3A4B8]">활동</p>
                    {selectedEvent ? (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#E8E8EF] bg-white">
                          {selectedEvent.imageUrl ? (
                            <img
                              src={selectedEvent.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="block h-full w-full bg-[#EEF0FC]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#1B1B33]">{selectedEvent.title}</p>
                          <p className="mt-1 text-xs text-[#6F7095]">
                            {[selectedEvent.organizer, selectedEvent.fieldLabel]
                              .filter(Boolean)
                              .join(' · ') || '상세 정보 없음'}
                          </p>
                        </div>
                      </div>
                    ) : eventId !== null ? (
                      <p role="status" className="mt-1 text-sm text-[#6F7095]">
                        활동 정보를 찾을 수 없어요. 이전 단계에서 다시 선택해주세요.
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-[#6F7095]">선택한 활동이 없어요.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#A3A4B8]">팀 이름</p>
                    <p className="mt-1 text-sm font-medium text-[#1B1B33]">{title || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#A3A4B8]">진행 방식 및 한 줄 소개</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-[#1B1B33]">
                      {promotionText || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#A3A4B8]">모집 기간</p>
                    <p className="mt-1 text-sm text-[#1B1B33]">
                      {recruitmentStartDate || '-'} ~ {recruitmentEndDate || '-'}
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-5 rounded-xl bg-[#F7F8FA] p-5 sm:p-6">
                <h3 className="text-base font-bold text-[#1B1B33]">
                  <span className="text-[#4D4DF1]">02.</span> 모집 포지션
                </h3>
                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-[#A3A4B8]">모집 역할</p>
                    {role.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {role.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-[#C7CEFF] bg-[#F5F7FF] px-3 py-1 text-xs font-medium text-[#1B2A78]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-[#1B1B33]">-</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#A3A4B8]">팀 인원</p>
                    <p className="mt-1 text-sm font-medium text-[#1B1B33]">{capacity}명</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#A3A4B8]">우대 역량</p>
                    {requiredSkills.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {requiredSkills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-[#EEF0FC] px-3 py-1 text-xs font-medium text-[#4D4DF1]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-[#1B1B33]">-</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#A3A4B8]">원하는 팀 분위기</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-[#1B1B33]">
                      {characteristic || '-'}
                    </p>
                  </div>
                </div>
              </section>

              <div className="mt-6 flex gap-4 border-t border-[#F0F0F5] pt-6">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={isSubmitting}
                  className="h-12 w-28 shrink-0 rounded-lg border border-[#E1E2EA] bg-white text-sm font-semibold text-[#1B1B33] transition-colors hover:bg-[#F5F5F9] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-12 flex-1 rounded-lg bg-[#4D4DF1] text-sm font-semibold text-white transition-colors hover:bg-[#3D3DD9] disabled:cursor-not-allowed disabled:bg-[#E8E8EE] disabled:text-[#A3A4B8]"
                >
                  {isSubmitting ? '등록 중...' : '등록하기'}
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
