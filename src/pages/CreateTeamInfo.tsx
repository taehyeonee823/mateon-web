import { useState } from 'react'
import { ChevronRightIcon } from '../components/icons'
import { useNavigate } from 'react-router-dom'
import { searchEvents, type EventItem } from '../api/event'
import { useCreateTeamStore } from '../context/CreateTeam' 

const steps = ['팀 기본 정보', '모집 포지션', '미리보기']

export default function CreateTeamInfo() {
  const navigate = useNavigate()
  const {
    title,
    promotionText,
    recruitmentStartDate,
    recruitmentEndDate,
    setField
  } = useCreateTeamStore()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<EventItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)

  const dateError =
    recruitmentStartDate && recruitmentEndDate && recruitmentStartDate > recruitmentEndDate
      ? '마감일은 시작일보다 이후여야 해요'
      : ''

  
  const handleSearch = async () => {
    if (!searchKeyword.trim()) return

    setIsSearching(true)
    setShowResults(true)
    try {
      const results = await searchEvents({ keyword: searchKeyword })
      setSearchResults(results)
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

  
  const handleNextStep = () => {
    navigate('/teams/new/position')
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-6 pb-10 pt-4">
            <h1 className="text-2xl font-extrabold text-neutral-900 mb-1">팀 만들기</h1>
            <p className="text-sm text-neutral-500 mb-6">공모전/대외활동을 함께할 팀원을 모집해보세요!</p>

            {/* Stepper */}
            <div className="flex items-center mb-8">
              {steps.map((s, i) => {
                const stepNum = i + 1
                const active = stepNum === 1
                return (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          active ? 'bg-[#4D4DF1] text-white' : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        {stepNum}
                      </span>
                      <span className={`text-sm ${active ? 'font-bold text-neutral-900' : 'text-neutral-400'}`}>
                        {s}
                      </span>
                    </div>
                    {i < steps.length - 1 && <div className="flex-1 h-px bg-neutral-100 mx-3" />}
                  </div>
                )
              })}
            </div>

            {/* 01. 공모전 선택 영역 */}
            <section className="rounded-2xl border border-neutral-100 p-6 mb-6">
              <h2 className="text-base font-bold text-neutral-900 mb-4">
                <span className="text-[#4D4DF1]">01.</span> 어떤 공모전/활동 팀인가요?
              </h2>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                공모전/대외활동 선택 <span className="text-neutral-400 font-normal">(선택)</span>
              </label>

              {/* 검색창 */}
              <div className="flex gap-2 mb-4 relative">
                <div className="relative flex-1">
                  <input
                    value={searchKeyword}
                    onChange={(e) => {
                      setSearchKeyword(e.target.value)
                      if (!e.target.value) setShowResults(false)
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="참여할 공모전 또는 대외활동을 검색하고 선택하세요"
                    className="w-full rounded-xl border border-neutral-200 pl-4 pr-4 py-3 text-sm outline-none focus:border-[#4D4DF1]"
                  />

                  {/* 검색 결과 드롭다운 */}
                  {showResults && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 text-center text-sm text-neutral-500">검색 중...</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => handleSelectEvent(event)}
                            className="p-3 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-0"
                          >
                            <p className="font-bold text-sm text-neutral-900 truncate">{event.title}</p>
                            <p className="text-xs text-neutral-500 mt-1">
                              주최 {event.organizer} · 마감일 {event.endDate}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-neutral-500">검색 결과가 없습니다.</div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  className="rounded-xl bg-neutral-900 px-5 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  검색
                </button>
              </div>

              {/* 선택된 공모전 카드 */}
              {selectedEvent && (
                <div className="flex items-center gap-4 rounded-xl border border-[#4D4DF1] bg-[#EEF0FF]/30 p-4">
                  <div className="h-16 w-20 shrink-0 rounded-lg bg-white border border-neutral-100 flex items-center justify-center overflow-hidden">
                    {selectedEvent.imageUrl ? (
                      <img src={selectedEvent.imageUrl} alt="공모전 썸네일" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-neutral-300 text-xs">NO IMG</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {selectedEvent.fieldLabel && (
                      <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 mb-1.5">
                        {selectedEvent.fieldLabel}
                      </span>
                    )}
                    <p className="font-bold text-neutral-900 truncate">{selectedEvent.title}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      주최 {selectedEvent.organizer} · 마감 {selectedEvent.endDate}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEvent(null)
                      setField('eventId', null) 
                    }}
                    className="text-sm font-medium text-neutral-400 hover:text-neutral-600 px-2"
                  >
                    취소
                  </button>
                </div>
              )}
            </section>

            {/* 02. 팀 기본 정보 */}
            <section className="rounded-2xl border border-neutral-100 p-6">
              <h2 className="text-base font-bold text-neutral-900 mb-5">
                <span className="text-[#4D4DF1]">02.</span> 팀 기본 정보를 입력해주세요
              </h2>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">제목</label>
                <div className="relative">
                  <input
                    value={title} 
                    maxLength={30}
                    onChange={(e) => setField('title', e.target.value)} 
                    placeholder="예) 코드램프, 아이디어 윙스 등"
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-[#4D4DF1]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                    {title.length}/30
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">진행 방식 및 한 줄 소개</label>
                <div className="relative">
                  <textarea
                    value={promotionText} 
                    maxLength={60}
                    onChange={(e) => setField('promotionText', e.target.value)} 
                    placeholder="어떤 팀인지 한줄로 소개해주세요!"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-[#4D4DF1]"
                  />
                  <span className="absolute right-4 bottom-3 text-xs text-neutral-400">{promotionText.length}/60</span>
                </div>
              </div>           

              <div className="mb-6">
                <label className="block text-sm font-semibold text-neutral-700 mb-3">모집 기간</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-neutral-500 mb-1.5">모집 시작일</label>
                    <input
                      type="date"
                      value={recruitmentStartDate} 
                      onChange={(e) => setField('recruitmentStartDate', e.target.value)} 
                      className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 outline-none focus:border-[#4D4DF1]"
                    />
                  </div>
                  <span className="mt-6 text-neutral-300">~</span>
                  <div className="flex-1">
                    <label className="block text-xs text-neutral-500 mb-1.5">모집 마감일</label>
                    <input
                      type="date"
                      value={recruitmentEndDate} 
                      min={recruitmentStartDate || undefined}
                      onChange={(e) => setField('recruitmentEndDate', e.target.value)} 
                      className={`w-full rounded-xl border px-4 py-3 text-sm text-neutral-700 outline-none focus:border-[#4D4DF1] ${
                        dateError ? 'border-red-300' : 'border-neutral-200'
                      }`}
                    />
                  </div>
                </div>
                {dateError && <p className="mt-2 text-xs text-red-500">{dateError}</p>}
              </div>
            </section>

            <button
              disabled={!!dateError || !title || !recruitmentStartDate || !recruitmentEndDate}
              onClick={handleNextStep}
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
