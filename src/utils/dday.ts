import { computeDDay } from '../api/event'

export type PeriodPreset = 'today' | 'week' | 'month'
export type PeriodFilter =
  | { type: 'preset'; preset: PeriodPreset }
  | { type: 'custom'; start: string; end: string }
  | null

// 백엔드 computeDDay('마감' | 'D-DAY' | 'D-n')를 카드 스타일 결정에 필요한 형태로 감싼 헬퍼
export function dDayInfo(endDate: string) {
  const label = computeDDay(endDate)
  if (label === '마감') return { label, urgent: false, closed: true }
  if (label === 'D-DAY') return { label, urgent: true, closed: false }
  const diff = Number(label.slice(2))
  return { label, urgent: diff <= 7, closed: false }
}

export function presetRange(preset: PeriodPreset): { start: Date; end: Date } {
  const start = new Date()
  const end = new Date()
  if (preset === 'week') {
    end.setDate(end.getDate() + (7 - end.getDay()))
  } else if (preset === 'month') {
    end.setMonth(end.getMonth() + 1, 0)
  }
  return { start, end }
}

export function isWithinPeriod(endDate: string, filter: PeriodFilter) {
  if (!filter) return true
  const target = new Date(endDate)
  const range =
    filter.type === 'preset' ? presetRange(filter.preset) : { start: new Date(filter.start), end: new Date(filter.end) }
  return target >= range.start && target <= range.end
}