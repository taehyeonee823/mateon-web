import type { EventItem } from '../api/event'

// 제목/주최 비교용 정규화: 공백·특수문자 제거 + 소문자
function normalize(text: string | null | undefined): string {
  return (text ?? '').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '')
}

function groupKey(event: EventItem): string {
  return [event.category, normalize(event.title), normalize(event.organizer), event.endDate].join('|')
}

export function isSameEvent(a: EventItem, b: EventItem): boolean {
  return groupKey(a) === groupKey(b)
}

export function getFieldLabels(event: EventItem): string[] {
  if (event.fieldLabels && event.fieldLabels.length > 0) return event.fieldLabels
  return event.fieldLabel ? [event.fieldLabel] : []
}

// 상세 페이지 직접 진입처럼 단일 항목만 있을 때, 후보 목록에서 동일 공모전을 찾아 분야를 합쳐준다.
export function mergeSameEventFields(event: EventItem, candidates: EventItem[]): EventItem {
  const key = groupKey(event)
  const labels = [...getFieldLabels(event)]
  for (const candidate of candidates) {
    if (groupKey(candidate) !== key) continue
    for (const label of getFieldLabels(candidate)) {
      if (!labels.includes(label)) labels.push(label)
    }
  }
  return { ...event, fieldLabels: labels }
}

// 분야별로 중복 등록된 동일 공모전을 하나로 합친다.
// - 대표 항목: 북마크된 항목이 있으면 그것, 없으면 가장 먼저 나온 항목
// - fieldLabels: 묶인 항목들의 분야를 중복 없이 합친 목록
// 입력 순서(정렬)는 대표 항목의 첫 등장 위치를 기준으로 유지된다.
export function groupDuplicateEvents(events: EventItem[]): EventItem[] {
  const groups = new Map<string, EventItem[]>()
  for (const event of events) {
    const key = groupKey(event)
    const bucket = groups.get(key)
    if (bucket) bucket.push(event)
    else groups.set(key, [event])
  }

  return Array.from(groups.values()).map((bucket) => {
    const representative = bucket.find((e) => e.bookmarked) ?? bucket[0]
    const labels: string[] = []
    for (const e of bucket) {
      for (const label of getFieldLabels(e)) {
        if (!labels.includes(label)) labels.push(label)
      }
    }
    return { ...representative, fieldLabels: labels }
  })
}