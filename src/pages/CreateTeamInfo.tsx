import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { searchEvents, type EventItem } from '../api/event'
import { useCreateTeamStore } from '../context/CreateTeam'

const steps = ['팀 기본 정보', '모집 포지션', '미리보기']

export default function CreateTeamInfo() {
  const navigate = useNavigate()
  const location = useLocation()
  const preselectedEvent = (location.state as { event?: EventItem } | null)?.event ?? null
  const {
    title,
    promotionText,
    recruitmentStartDate,
    recruitmentEndDate,
    setField,
  } = useCreateTeamStore()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<EventItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(preselectedEvent)

  useEffect(() => {
    if (!preselectedEvent) return
    setSelectedEvent(preselectedEvent)
    setField('eventId', preselectedEvent.id)
  }, [preselectedEvent, setField])

  const dateError =
    recruitmentStartDate && recruitmentEndDate && recruitmentStartDate > recruitmentEndDate
      ? '마감일은 시작일보다 이후여야 해요'
      : ''

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return

    setIsSearching(true)
    setShowResults(true)
    try {
      setSearchResults(await searchEvents({ keyword: searchKeyword }))
    } catch (error) {
      console.error('공모전 검색 실패:', error)
      alert('검색 중 오류가 발생했습니다.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const handleSelectEvent = (event: EventItem) => {
    setSelectedEvent(event)
    setField('eventId', event.id)
    setShowResults(false)
    setSearchKeyword('')
  }

  const inputClassName =
    'h-12 w-full rounded-lg border border-[#E1E2EA] bg-white px-4 text-sm text-[#1B1B33] placeholder:text-[#B4B5C6] focus:border-[#4D4DF1] focus:outline-none'

  return (
    <div className="min-h-full bg-[#F7F7F9]">
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_232px] lg:gap-[72px]">
          <div className="min-w-0">
            <header>
              <h1 className="text-[32px] font-extrabold tracking-tight text-[#1B1B33]">팀 만들기</h1>
              <p className="mt-3 text-base text-[#1B1B33]">
                함께할 팀원을 모아보세요. 만들고 나면 팀원을 추천해 드려요.
              </p>
            </header>

            <ol className="mt-10 flex items-center gap-4 sm:gap-6">
              {steps.map((stepLabel, index) => {
                const stepNumber = index + 1
                const isCurrent = stepNumber === 1
                return (
                  <li key={stepLabel} className={`flex items-center gap-4 sm:gap-6 ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          isCurrent
                            ? 'bg-[#4D4DF1] text-white'
                            : 'border-[1.5px] border-[#C9CAD6] bg-white text-[#A3A4B8]'
                        }`}
                      >
                        {stepNumber}
                      </span>
                      <span className={`text-sm ${isCurrent ? 'font-bold text-[#1B1B33]' : 'text-[#A3A4B8]'}`}>
                        {stepLabel}
                      </span>
                    </div>
                    {index < steps.length - 1 && <span className="h-0.5 flex-1 rounded-full bg-[#E1E2EA]" />}
                  </li>
                )
              })}
            </ol>

            <section className="mt-8 rounded-2xl border border-[#E8E8EF] bg-white p-6 sm:p-12">
              <h2 className="text-2xl font-bold text-[#1B1B33]">어떤 활동인가요?</h2>

              {selectedEvent ? (
                <div className="mt-6 flex items-center gap-4 rounded-xl bg-[#F5F5F9] p-4">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md border border-[#E8E8EF] bg-white">
                    {selectedEvent.imageUrl ? (
                      <img src={selectedEvent.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="block h-full w-full bg-[#EEF0FC]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1B1B33]">{selectedEvent.title}</p>
                    {selectedEvent.organizer && (
                      <p className="mt-1 text-xs text-[#6F7095]">{selectedEvent.organizer}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEvent(null)
                      setField('eventId', null)
                    }}
                    className="h-12 shrink-0 rounded-lg border border-[#E1E2EA] bg-white px-5 text-sm font-semibold text-[#1B1B33] hover:bg-[#F5F5F9]"
                  >
                    변경
                  </button>
                </div>
              ) : (
                <div className="relative mt-6">
                  <div className="flex gap-3">
                    <input
                      value={searchKeyword}
                      onChange={(e) => {
                        setSearchKeyword(e.target.value)
                        if (!e.target.value) setShowResults(false)
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="참여할 공모전 또는 대외활동을 검색하세요"
                      className={inputClassName}
                    />
                    <button
                      type="button"
                      onClick={handleSearch}
                      className="h-12 rounded-lg bg-[#4D4DF1] px-6 text-sm font-semibold text-white hover:bg-[#3D3DD9]"
                    >
                      검색
                    </button>
                  </div>
                  {showResults && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-[#E1E2EA] bg-white py-1 shadow-lg">
                      {isSearching ? (
                        <div className="p-4 text-center text-sm text-[#6F7095]">검색 중...</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((event) => (
                          <button
                            type="button"
                            key={event.id}
                            onClick={() => handleSelectEvent(event)}
                            className="w-full px-4 py-2.5 text-left hover:bg-[#F5F5F9]"
                          >
                            <p className="truncate text-sm font-medium text-[#1B1B33]">{event.title}</p>
                            <p className="mt-0.5 text-xs text-[#6F7095]">주최 {event.organizer} · 마감일 {event.endDate}</p>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-[#6F7095]">검색 결과가 없습니다.</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-10 flex flex-col gap-7 border-t border-[#F0F0F5] pt-10">
                <h2 className="text-2xl font-bold text-[#1B1B33]">팀을 소개해 주세요</h2>

                <div>
                  <label htmlFor="team-title" className="text-[15px] font-semibold text-[#1B1B33]">
                    팀 이름<span className="ml-0.5 text-[#FF5A5A]">*</span>
                  </label>
                  <div className="relative mt-2.5">
                    <input
                      id="team-title"
                      value={title}
                      maxLength={30}
                      onChange={(e) => setField('title', e.target.value)}
                      placeholder="예: 코드램프, 아이디어 윙스"
                      className={`${inputClassName} pr-14`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#A3A4B8]">{title.length}/30</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="team-promotion" className="text-[15px] font-semibold text-[#1B1B33]">모집글</label>
                  <div className="relative mt-2.5">
                    <textarea
                      id="team-promotion"
                      value={promotionText}
                      maxLength={60}
                      onChange={(e) => setField('promotionText', e.target.value)}
                      placeholder="어떤 팀인지 소개해주세요"
                      rows={3}
                      className="h-[82px] w-full resize-y rounded-lg border border-[#E1E2EA] px-4 py-3 text-sm text-[#1B1B33] placeholder:text-[#B4B5C6] focus:border-[#4D4DF1] focus:outline-none"
                    />
                    <span className="absolute bottom-3 right-4 text-xs text-[#A3A4B8]">{promotionText.length}/60</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-7 border-t border-[#F0F0F5] pt-10">
                <h2 className="text-2xl font-bold text-[#1B1B33]">기간</h2>
                <div className="flex items-end gap-3 sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <label htmlFor="team-start-date" className="text-[15px] font-semibold text-[#1B1B33]">
                      시작일<span className="ml-0.5 text-[#FF5A5A]">*</span>
                    </label>
                    <input
                      id="team-start-date"
                      type="date"
                      value={recruitmentStartDate}
                      onChange={(e) => setField('recruitmentStartDate', e.target.value)}
                      className={`${inputClassName} mt-2.5`}
                    />
                  </div>
                  <span className="mb-3.5 h-5 shrink-0 text-[#B4B5C6]">~</span>
                  <div className="min-w-0 flex-1">
                    <label htmlFor="team-end-date" className="text-[15px] font-semibold text-[#1B1B33]">
                      마감일<span className="ml-0.5 text-[#FF5A5A]">*</span>
                    </label>
                    <input
                      id="team-end-date"
                      type="date"
                      value={recruitmentEndDate}
                      min={recruitmentStartDate || undefined}
                      onChange={(e) => setField('recruitmentEndDate', e.target.value)}
                      className={`${inputClassName} mt-2.5 ${dateError ? 'border-red-300' : ''}`}
                    />
                  </div>
                </div>
                {dateError && <p className="-mt-4 text-sm font-medium text-rose-500">{dateError}</p>}
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  disabled={!!dateError || !title || !recruitmentStartDate || !recruitmentEndDate}
                  onClick={() => navigate('/teams/new/position')}
                  className="h-12 w-full rounded-lg bg-[#4D4DF1] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#3D3DD9] disabled:cursor-not-allowed disabled:bg-[#E8E8EE] disabled:text-[#A3A4B8]"
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
