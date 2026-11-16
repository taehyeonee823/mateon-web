import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getMyNotifications, type NotificationResponseDTO } from '../api/notification'
import { useAuth } from './AuthContext'
import { groupConsecutiveNotifications, type GroupedNotification } from '../lib/notifications'

type NotificationsContextValue = {
  notifications: NotificationResponseDTO[]
  grouped: GroupedNotification[]
  hasUnread: boolean
  reload: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

// 내 알림 목록. 탑바(미리보기·안 읽음 표시)와 알림 패널이 같은 데이터를 본다.
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth()
  const [notifications, setNotifications] = useState<NotificationResponseDTO[]>([])

  const reload = useCallback(async () => {
    try {
      const list = await getMyNotifications()
      setNotifications(
        [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      )
    } catch {
      setNotifications([])
    }
  }, [])

  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([])
      return
    }
    void reload()
  }, [isLoggedIn, reload])

  const grouped = useMemo(() => groupConsecutiveNotifications(notifications), [notifications])
  const hasUnread = useMemo(() => notifications.some((n) => !n.isRead), [notifications])

  const value = useMemo(
    () => ({ notifications, grouped, hasUnread, reload }),
    [notifications, grouped, hasUnread, reload],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications는 NotificationsProvider 안에서만 쓸 수 있어요.')
  return ctx
}
