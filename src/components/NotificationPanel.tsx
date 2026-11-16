import { useState } from 'react'
import SlideInPanel from './SlideInPanel'
import NotificationRow from './NotificationRow'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/Notifications'
import { useSidePanel } from '../context/SidePanel'
import { formatRelativeTime, getNotificationIcon, type GroupedNotification } from '../lib/notifications'

function CloseIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

// 탑바 알림 버튼으로 여는 오른쪽 알림 패널. 채팅 패널과 같은 자리·같은 애니메이션을 쓴다.
export default function NotificationPanel() {
  const { active, close } = useSidePanel()
  const { isLoggedIn } = useAuth()
  const { grouped } = useNotifications()
  const [selected, setSelected] = useState<GroupedNotification | null>(null)

  return (
    <>
      <SlideInPanel open={active === 'notifications' && isLoggedIn} onClose={close} label="알림">
        <div className="flex h-full flex-col bg-white text-slate-900">
          <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-100 px-4">
            <h2 className="text-lg font-bold">알림</h2>
            <button
              type="button"
              onClick={close}
              aria-label="알림 닫기"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-3">
            {grouped.length > 0 ? (
              grouped.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSelected(n)}
                  className="flex w-full items-start gap-2.5 rounded-xl px-3 py-3 text-left hover:bg-brand-50/60"
                >
                  <NotificationRow notification={n} />
                </button>
              ))
            ) : (
              <p className="px-3 py-8 text-center text-sm text-brand-400">알림이 없어요.</p>
            )}
          </div>
        </div>
      </SlideInPanel>

      {selected && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-6 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-xl shadow-black/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full p-2 ${getNotificationIcon(selected).bg}`}
                >
                  <img src={getNotificationIcon(selected).icon} alt="" className="h-full w-full object-contain" />
                </span>
                <div>
                  <p className="text-lg font-bold text-brand-900">{selected.title}</p>
                  <p className="text-sm text-brand-400">{formatRelativeTime(selected.createdAt)}</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setSelected(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-brand-400 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                ✕
              </button>
            </div>

            <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-brand-700">{selected.content}</p>
          </div>
        </div>
      )}
    </>
  )
}
