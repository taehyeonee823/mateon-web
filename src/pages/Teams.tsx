import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendChatbotMessage } from '../api/chatbot'
import { getRecommendedTeams, getUserToTeamRecommendationReason } from '../api/recommend'
import type { TeamRecommendation } from '../types/recommend'
import { dDayInfo } from '../utils/dday'
import { getTeamDetail } from '../api/team'
import { getPublicUserProfile } from '../api/user'

type RecommendationState = 'loading' | 'loaded' | 'error'

type DreamyMessage = {
  id: string
  role: 'user' | 'bot'
  text: string
  recommendationState?: RecommendationState
  recommendations?: TeamRecommendation[]
  recommendationError?: string
}

export default function Teams() {
  const navigate = useNavigate()
  const [started, setStarted] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [messages, setMessages] = useState<DreamyMessage[]>([
    { id: 'welcome', role: 'bot', text: '잘 맞는 팀을 찾아 줄게!\n먼저, 팀에서 어떤 역할을 맡고 싶어?' },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const startConversation = () => {
    if (started || isLeaving) return
    setIsLeaving(true)
    window.setTimeout(() => setStarted(true), 350)
  }

  useEffect(() => {
    if (!started) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending, started])

  const loadRecommendations = async (messageId: string) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? { ...message, recommendationState: 'loading', recommendationError: undefined }
          : message,
      ),
    )

    try {
      const recommendations = await getRecommendedTeams({ limit: 6 })
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? { ...message, recommendationState: 'loaded', recommendations }
            : message,
        ),
      )
    } catch (error) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? {
                ...message,
                recommendationState: 'error',
                recommendationError:
                  error instanceof Error ? error.message : '팀 추천을 불러오지 못했어요.',
              }
            : message,
        ),
      )
    }
  }

  const handleSend = async (suggestedText?: string) => {
    const text = (suggestedText ?? input).trim()
    if (!text || sending) return

    setMessages((prev) => [...prev, { id: `${Date.now()}-user`, role: 'user', text }])
    setInput('')
    setSending(true)

    try {
      const result = await sendChatbotMessage(text)
      const botMessageId = `${Date.now()}-bot`
      setMessages((prev) => [
        ...prev,
        {
          id: botMessageId,
          role: 'bot',
          text: result.assistantMessage,
          ...(result.completed ? { recommendationState: 'loading' as const } : {}),
        },
      ])
      if (result.completed) void loadRecommendations(botMessageId)
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-bot-error`,
          role: 'bot',
          text:
            error instanceof Error
              ? error.message
              : '응답을 받지 못했어요. 잠시 후 다시 시도해주세요.',
        },
      ])
    } finally {
      setSending(false)
    }
  }

  if (!started) {
    return (
      <div className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden bg-[#F7F7F9] px-6 pb-20">
        <style>{`
          @keyframes dreamyFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes dreamyWelcomeFade {
            to { opacity: 0; }
          }
          @keyframes dreamyCharacterLaunch {
            to { opacity: 0; transform: translateY(-32px) scale(1.12); }
          }
          .dreamy-character-float {
            animation: dreamyFloat 2.8s ease-in-out infinite;
          }
          .dreamy-welcome-leave {
            animation: dreamyWelcomeFade 350ms ease-out both;
          }
          .dreamy-character-leave {
            animation: dreamyCharacterLaunch 350ms ease-in both;
          }
          @media (prefers-reduced-motion: reduce) {
            .dreamy-character-float { animation: none; }
            .dreamy-welcome-leave, .dreamy-character-leave { animation-duration: 1ms; }
          }
        `}</style>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[46%] h-[460px] w-[min(760px,100vw)] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              'radial-gradient(ellipse at center, #E3E8FF 0%, rgba(227, 232, 255, 0) 70%)',
          }}
        />
        <div className={`relative z-10 -mt-10 text-center ${isLeaving ? 'dreamy-welcome-leave' : ''}`}>
          <button
            type="button"
            onClick={startConversation}
            aria-label="드림이를 눌러 팀 찾기 시작하기"
            className="mx-auto block rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4D4DF1]/20"
          >
            <img
              src="/landing_img/dreamy.svg"
              alt=""
              className={`mx-auto h-[180px] w-[224px] object-contain transition-transform duration-300 hover:scale-105 ${
                isLeaving ? 'dreamy-character-leave' : 'dreamy-character-float'
              }`}
            />
          </button>
          <h1 className="mt-5 text-xl font-extrabold tracking-tight text-[#1B1B33] sm:text-[22px]">
            안녕하세요, 드림이에요!
          </h1>
          <p className="mt-1.5 text-sm font-medium text-[#45465C]">
            나랑 딱 맞는 팀, 같이 찾아볼까요?
          </p>
          <p className="mt-5 text-xs font-medium text-[#8C8DAE]">
            드림이를 눌러 시작
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="dreamy-page-enter flex h-[calc(100vh-72px)] bg-[#F7F7F9]">
      <style>{`
        @keyframes dreamyPageEnter {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .dreamy-page-enter {
            animation: dreamyPageEnter 350ms ease-out both;
          }
        `}</style>
      <div className="mx-auto flex h-full w-full max-w-[720px] flex-col px-4 pb-5 pt-10 sm:px-0">
        <main ref={scrollRef} className="flex-1 space-y-7 overflow-y-auto px-1 pb-5 pt-1">
          {messages.map((message) => (
            <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              {message.role === 'bot' ? (
                <div className="flex max-w-[660px] items-start gap-2.5">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center">
                    <img src="/landing_img/dreamy.svg" alt="" className="h-8 w-8 object-contain" />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <span className="mb-1.5 block text-[10px] font-medium text-[#8C8DAE]">드림이</span>
                    <div className="inline-block whitespace-pre-wrap rounded-[22px] rounded-tl-[6px] bg-white px-4 py-3 text-sm font-medium leading-6 text-[#1B1B33] shadow-[0_2px_10px_rgba(27,27,51,0.06)]">
                      {message.text}
                    </div>

                    {message.recommendationState === 'loading' && (
                      <div className="mt-3 rounded-xl border border-[#DDE1FA] bg-white p-4">
                        <p className="text-sm font-semibold text-[#4D4DF1]">맞춤 팀을 찾고 있어요</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="h-32 animate-pulse rounded-xl bg-[#EEF0FC]" />
                          ))}
                        </div>
                      </div>
                    )}

                    {message.recommendationState === 'error' && (
                      <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 p-4">
                        <p className="text-sm text-rose-600">
                          팀 추천을 불러오지 못했어요. {message.recommendationError}
                        </p>
                        <button
                          type="button"
                          onClick={() => void loadRecommendations(message.id)}
                          className="mt-2 text-sm font-semibold text-[#4D4DF1]"
                        >
                          다시 시도
                        </button>
                      </div>
                    )}

                    {message.recommendationState === 'loaded' && (
                      <div className="mt-4 w-full max-w-[calc(100vw-80px)]">
                        <p className="mb-3 text-xs font-semibold text-[#45465C]">
                          {message.recommendations?.length
                            ? `대화 내용을 바탕으로 팀 ${message.recommendations.length}곳을 추천해요`
                            : '조건에 맞는 추천 팀이 아직 없어요'}
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {message.recommendations?.map((team) => (
                            <RecommendedTeamCard
                              key={team.teamId}
                              team={team}
                              onClick={() =>
                                navigate(`/my/teams/${team.teamId}`, {
                                  state: { fromTeamRecommendations: true },
                                })
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="ml-auto max-w-[75%] whitespace-pre-wrap rounded-[22px] rounded-tr-[6px] bg-[#4D4DF1] px-4 py-2.5 text-sm leading-5 text-white shadow-sm">
                  {message.text}
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex items-center gap-2 text-sm text-[#A3A4B8]">
              드림이가 생각하고 있어요<span className="animate-pulse">···</span>
            </div>
          )}
        </main>

        <div className="relative flex items-center px-1 pt-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault()
                void handleSend()
              }
            }}
            placeholder="하고 싶은 역할이나 관심 있는 활동을 입력하세요..."
            rows={1}
            className="h-12 w-full resize-none rounded-full border border-[#D6D7E1] bg-white py-3 pl-5 pr-[68px] text-sm text-[#1B1B33] outline-none placeholder:text-[#B4B5C6] focus:border-[#4D4DF1]"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!input.trim() || sending}
            className="absolute right-[13px] flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3F3F7] text-lg text-[#45465C] disabled:cursor-not-allowed disabled:text-[#A3A4B8]"
            aria-label="메시지 보내기"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}

function RecommendedTeamCard({
  team,
  onClick,
}: {
  team: TeamRecommendation
  onClick: () => void
}) {
  const [leaderName, setLeaderName] = useState('')
  const [leaderImageUrl, setLeaderImageUrl] = useState<string | null>(null)
  const [recommendationReason, setRecommendationReason] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([
      getTeamDetail(team.teamId),
      getUserToTeamRecommendationReason({ teamId: team.teamId }),
      getPublicUserProfile(team.leaderId),
    ]).then(([detailResult, reasonResult, profileResult]) => {
      if (cancelled) return
      if (detailResult.status === 'fulfilled') {
        setLeaderName(detailResult.value.leaderName || '')
      }
      if (reasonResult.status === 'fulfilled' && reasonResult.value.trim()) {
        setRecommendationReason(reasonResult.value.trim())
      }
      if (profileResult.status === 'fulfilled') {
        setLeaderName((current) => profileResult.value.name || current)
        setLeaderImageUrl(profileResult.value.profileImageUrl)
      }
    })
    return () => {
      cancelled = true
    }
  }, [team.teamId])

  const skills = (team.requiredSkills ?? []).slice(0, 3)
  const roles = team.role.slice(0, 3)
  const dDay = dDayInfo(team.recruitmentEndDate)
  const fallbackReason =
    team.label ||
    team.connectedActivitySummary ||
    team.promotionText ||
    '드림이가 조건에 맞는 팀을 추천해 드려요.'

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onClick()
      }}
      className="min-w-0 cursor-pointer rounded-xl border border-[#E8E8EF] bg-white p-3 shadow-[0_3px_12px_rgba(27,27,51,0.05)]"
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <p className="min-w-0 truncate text-[11px] font-extrabold leading-4 text-[#4D4DF1]">
          {team.connectedActivityTitle || '팀 빌딩 활동'}
        </p>
        <span className="shrink-0 rounded-full bg-[#FFF0DF] px-2 py-0.5 text-[9px] font-extrabold text-[#B86A22]">
          {dDay.label}
        </span>
      </div>

      <h2 className="mt-1 truncate text-base font-black leading-5 tracking-tight text-[#1B1B33]">
        {team.title}
      </h2>

      <div className="mt-2 rounded-lg bg-[#F2F3FC] px-2.5 py-2">
        <p className="flex items-center gap-1 text-[9px] font-bold text-[#4D4DF1]">
          <img src="/landing_img/dreamy.svg" alt="" className="h-4 w-4 shrink-0 object-contain" />
          드림이 추천 이유
        </p>
        <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-4 text-[#1B1B33]">
          {recommendationReason || fallbackReason}
        </p>
      </div>

      {(roles.length > 0 || skills.length > 0) && (
        <div className="mt-2 flex min-h-6 flex-wrap gap-1">
          {[...roles, ...skills].map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex max-w-full items-center justify-center truncate rounded-full border border-[#DFE0E8] bg-white px-2 py-0.5 text-center text-[9px] font-semibold text-[#45465C]"
            >
              {item}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center gap-2 border-t border-[#E8E8EF] pt-2">
        {leaderImageUrl ? (
          <img
            src={leaderImageUrl}
            alt=""
            className="h-6 w-6 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="h-6 w-6 shrink-0 rounded-full bg-[#E8E8EF]" />
        )}
        <p className="min-w-0 truncate text-[11px] font-bold text-[#1B1B33]">
          {leaderName || '팀장'}
        </p>
        <span className="ml-auto text-[10px] text-[#8C8DAE]">
          {team.currentMemberCount}/{team.capacity}명
        </span>
      </div>
    </article>
  )
}
