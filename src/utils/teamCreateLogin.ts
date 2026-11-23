import { EVENT_FIELD_LABELS, type EventItem } from '../api/event'

const TEAM_CREATE_EVENT_KEY = 'mateon.teamCreateEventAfterLogin'

export type TeamCreateLoginState = {
  returnTo: '/teams/new'
  event?: EventItem
}

export function rememberTeamCreateEvent(event?: EventItem) {
  if (event) {
    sessionStorage.setItem(TEAM_CREATE_EVENT_KEY, JSON.stringify(event))
  } else {
    sessionStorage.removeItem(TEAM_CREATE_EVENT_KEY)
  }
}

export function consumeTeamCreateEvent(): EventItem | null {
  const storedEvent = sessionStorage.getItem(TEAM_CREATE_EVENT_KEY)
  sessionStorage.removeItem(TEAM_CREATE_EVENT_KEY)
  if (!storedEvent) return null

  try {
    const value: unknown = JSON.parse(storedEvent)
    if (!isEventItem(value)) {
      console.error('로그인 후 팀 생성 활동 정보의 형식이 올바르지 않습니다.')
      return null
    }
    return value
  } catch (error) {
    console.error('로그인 후 팀 생성 활동 정보를 복원하지 못했습니다.', error)
    return null
  }
}

function isEventItem(value: unknown): value is EventItem {
  if (typeof value !== 'object' || value === null) return false
  const event = value as Record<string, unknown>

  return (
    typeof event.id === 'number' &&
    typeof event.title === 'string' &&
    (event.category === 'CONTEST' || event.category === 'EXTERNAL') &&
    (event.field === null ||
      (typeof event.field === 'string' && Object.hasOwn(EVENT_FIELD_LABELS, event.field))) &&
    (typeof event.fieldLabel === 'string' || event.fieldLabel === null) &&
    typeof event.organizer === 'string' &&
    (typeof event.description === 'string' || event.description === null) &&
    (typeof event.summarizedDescription === 'string' || event.summarizedDescription === null) &&
    typeof event.detailUrl === 'string' &&
    (typeof event.imageUrl === 'string' || event.imageUrl === null) &&
    typeof event.startDate === 'string' &&
    typeof event.endDate === 'string' &&
    (typeof event.recommendedTargets === 'string' || event.recommendedTargets === null) &&
    (typeof event.targetSchool === 'string' || event.targetSchool === null) &&
    typeof event.bookmarked === 'boolean'
  )
}
