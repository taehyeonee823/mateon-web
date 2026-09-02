import { useEffect, useRef, useState } from 'react'
import { sendChatbotMessage } from '../api/chatbot'
import { useAuth } from '../context/AuthContext'

type DreamyMessage = {
  id: string
  role: 'user' | 'bot'
  text: string
}

export default function DreamyWidget() {
  const { isLoggedIn } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<DreamyMessage[]>([
    { id: 'welcome', role: 'bot', text: '안녕? 오늘은 어떤 걸 도와줄까?' },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, isOpen])

  if (!isLoggedIn) return null

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return

    setMessages((prev) => [...prev, { id: `${Date.now()}-user`, role: 'user', text }])
    setInput('')
    setSending(true)

    try {
      const result = await sendChatbotMessage(text)
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-bot`, role: 'bot', text: result.assistantMessage },
      ])
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

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-44 left-6 z-50 flex h-[480px] w-80 flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <img src="/landing_img/dreamy.svg" alt="" className="h-7 w-7" />
              <p className="font-semibold text-slate-900">드림이 챗봇</p>
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
            {messages.map((msg) =>
              msg.role === 'bot' ? (
                <div key={msg.id} className="flex justify-start">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-slate-100 px-3 py-2 text-sm leading-relaxed text-slate-800">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-indigo-600 px-3 py-2 text-sm leading-relaxed text-white">
                    {msg.text}
                  </div>
                </div>
              ),
            )}
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
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-40"
              aria-label="메시지 보내기"
            >
              ↑
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-14 left-0 z-50 hidden w-64 justify-center md:flex">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-label="드림이와 대화하기"
          className="flex h-28 w-28 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-indigo-600 bg-white shadow-lg transition-transform hover:scale-105"
        >
          <span className="relative">
            <img src="/landing_img/dreamy.svg" alt="" className="h-14 w-14" />
            <span className="absolute -right-2 -top-1 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              AI
            </span>
          </span>
          <span className="text-sm font-bold text-indigo-600">드림이 챗봇</span>
        </button>
      </div>
    </>
  )
}
