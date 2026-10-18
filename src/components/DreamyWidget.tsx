import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { sendChatbotMessage } from '../api/chatbot'
import { getRecommendedTeams } from '../api/recommend'
import type { TeamRecommendation } from '../types/recommend'
import { useAuth } from '../context/AuthContext'

type RecommendationState = 'loading' | 'loaded' | 'error'

type DreamyMessage = {
  id: string
  role: 'user' | 'bot'
  text: string
  recommendationState?: RecommendationState
  recommendations?: TeamRecommendation[]
  recommendationError?: string
}

export default function DreamyWidget() {
  const { isLoggedIn } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<DreamyMessage[]>([
    { id: 'welcome', role: 'bot', text: '안녕? 오늘은 어떤 걸 도와줄까?' },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isTeamDiscoveryPage =
    pathname === '/contest' ||
    pathname.startsWith('/contest/') ||
    pathname === '/external' ||
    pathname.startsWith('/external/') ||
    pathname.startsWith('/teams/new')

  useEffect(() => {
    if (!isOpen) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isOpen])

  if (!isLoggedIn || !isTeamDiscoveryPage) return null

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
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-bot-error`,
          role: 'bot',
          text: err instanceof Error ? err.message : '응답을 받지 못했어요. 잠시 후 다시 시도해주세요.',
        },
      ])
    } finally {
      setSending(false)
    }
  }

  const loadRecommendations = async (messageId: string) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? {
              ...message,
              recommendationState: 'loading',
              recommendationError: undefined,
            }
          : message,
      ),
    )
    try {
      const recommendations = await getRecommendedTeams({ limit: 3 })
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? { ...message, recommendationState: 'loaded', recommendations }
            : message,
        ),
      )
    } catch (err) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? {
                ...message,
                recommendationState: 'error',
                recommendationError:
                  err instanceof Error ? err.message : '팀 추천을 불러오지 못했어요.',
              }
            : message,
        ),
      )
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[min(640px,calc(100dvh-7rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 sm:bottom-28 sm:right-6">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <img src="/landing_img/dreamy.svg" alt="" className="h-7 w-7" />
              <div>
                <p className="text-sm font-semibold text-slate-900">팀 추천</p>
                <p className="text-[11px] text-slate-500">드림이와 함께 팀을 찾아봐요</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="닫기"
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
            {messages.length === 1 && (
              <div className="mb-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
                <p className="text-xs leading-5 text-indigo-900">
                  하고 싶은 역할이나 관심 있는 활동을 알려주면 조건에 맞는 팀을 찾아볼게요.
                </p>
                <button
                  type="button"
                  onClick={() => void handleSend('내 조건에 맞는 팀을 찾고 싶어')}
                  disabled={sending}
                  className="mt-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  팀 추천 시작하기
                </button>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={msg.role === 'bot' ? '' : 'flex justify-end'}>
                {msg.role === 'bot' ? (
                  <div className="flex flex-col items-start gap-2">
                    <div className="max-w-[95%] whitespace-pre-wrap rounded-2xl bg-slate-100 px-3 py-2 text-sm leading-relaxed text-slate-800">
                      {msg.text}
                    </div>
                    {msg.recommendationState === 'loading' && (
                      <div className="w-full rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                        <p className="text-xs font-semibold text-indigo-700">맞춤 팀을 찾고 있어요</p>
                        <div className="mt-2 space-y-2" aria-label="추천 팀 불러오는 중">
                          <div className="h-3 w-full animate-pulse rounded bg-indigo-100" />
                          <div className="h-3 w-2/3 animate-pulse rounded bg-indigo-100" />
                        </div>
                      </div>
                    )}
                    {msg.recommendationState === 'error' && (
                      <div className="w-full rounded-xl border border-rose-100 bg-rose-50 p-3">
                        <p role="alert" className="text-xs leading-5 text-rose-600">
                          팀 추천을 불러오지 못했어요. {msg.recommendationError}
                        </p>
                        <button
                          type="button"
                          onClick={() => void loadRecommendations(msg.id)}
                          className="mt-2 text-xs font-semibold text-indigo-700 hover:underline"
                        >
                          다시 시도
                        </button>
                      </div>
                    )}
                    {msg.recommendationState === 'loaded' && (
                      <div className="w-full space-y-2">
                        <p className="px-1 text-xs font-semibold text-slate-600">
                          {msg.recommendations?.length
                            ? `대화 내용을 바탕으로 팀 ${msg.recommendations.length}곳을 추천해요`
                            : '조건에 맞는 추천 팀이 아직 없어요'}
                        </p>
                        {msg.recommendations?.map((team) => (
                          <RecommendedTeamCard
                            key={team.teamId}
                            team={team}
                            onClick={() => {
                              setIsOpen(false)
                              navigate(`/my/teams/${team.teamId}`, {
                                state: { fromTeamRecommendations: true },
                              })
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-indigo-600 px-3 py-2 text-sm leading-relaxed text-white">
                    {msg.text}
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-400">
                  입력 중…
                </div>
              </div>
            )}
          </div>

          <div className="flex items-end gap-2 border-t border-slate-200 bg-white px-3 py-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="메시지를 입력하세요..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || sending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-40"
              aria-label="메시지 보내기"
            >
              ↑
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? '팀 찾기 도우미 닫기' : '조건에 맞는 팀 찾기'}
          aria-expanded={isOpen}
          className="flex items-center gap-2 rounded-full border border-indigo-200 bg-white py-2 pl-2 pr-4 text-left shadow-lg transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-xl"
        >
          <img src="/landing_img/dreamy.svg" alt="" className="h-10 w-10" />
          <span>
            <span className="block text-sm font-bold text-slate-900">팀 추천</span>
            <span className="block text-[11px] text-slate-500">드림이와 팀 찾기</span>
          </span>
        </button>
      </div>
    </>
  )
}

function RecommendedTeamCard({
  team,
  onClick,
}: {
  team: TeamRecommendation
  onClick: () => void
}) {
  const score =
    Number.isFinite(team.score)
      ? `${Math.round(Math.min(Math.max(team.score, 0), 1) * 100)}%`
      : null
  const skills = (team.requiredSkills ?? []).slice(0, 3)
  const roles = team.role.slice(0, 3)

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 text-sm font-bold leading-5 text-slate-900">{team.title}</h3>
        {score && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            {team.label ? `${team.label} · ` : ''}{score}
          </span>
        )}
      </div>
      {team.connectedActivityTitle && (
        <p className="mt-1 truncate text-[11px] text-slate-500">{team.connectedActivityTitle}</p>
      )}
      {team.promotionText && (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{team.promotionText}</p>
      )}
      {(roles.length > 0 || skills.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {[...roles, ...skills].map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700"
            >
              {item}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500">
          {team.currentMemberCount}/{team.capacity}명
          {team.recruitmentEndDate && ` · ${team.recruitmentEndDate.replaceAll('-', '.')} 마감`}
        </span>
        <button
          type="button"
          onClick={onClick}
          className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          팀 보기
        </button>
      </div>
    </article>
  )
}
