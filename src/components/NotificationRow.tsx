import { formatRelativeTime, getNotificationIcon, type GroupedNotification } from '../lib/notifications'

// 알림 한 줄 (아이콘 · 제목 · +N · 시간 · 안 읽음 점 · 내용). 탑바 미리보기와 알림 패널이 공유.
export default function NotificationRow({
  notification: n,
  iconSize = 'h-8 w-8',
}: {
  notification: GroupedNotification
  iconSize?: string
}) {
  const { icon, bg } = getNotificationIcon(n)
  return (
    <>
      <span className={`flex ${iconSize} shrink-0 items-center justify-center rounded-full p-1.5 ${bg}`}>
        <img src={icon} alt="" className="h-full w-full object-contain" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1">
            <p className="truncate text-sm font-semibold text-brand-900">{n.title}</p>
            {n.count > 1 && (
              <span className="shrink-0 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-600">
                +{n.count - 1}
              </span>
            )}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="text-[10px] text-brand-400">{formatRelativeTime(n.createdAt)}</span>
            {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-brand-500">{n.content}</p>
      </div>
    </>
  )
}
