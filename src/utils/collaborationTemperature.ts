export const DEFAULT_TEMPERATURE = 36.5

export const TEMPERATURE_LEVELS = [
  { label: '불씨', min: 0, icon: '/landing_img/myPage/smflame.svg', bar: 'bg-[#F5B544]', text: 'text-[#D9822B]' },
  { label: '불꽃', min: 40, icon: '/landing_img/myPage/flame.svg', bar: 'bg-[#EE9240]', text: 'text-[#D9622B]' },
  { label: '모닥불', min: 55, icon: '/landing_img/myPage/bonfire.svg', bar: 'bg-[#E56C3A]', text: 'text-[#D2502A]' },
  { label: '캠프파이어', min: 70, icon: '/landing_img/myPage/campfire.svg', bar: 'bg-[#D94B2B]', text: 'text-[#C93A1F]' },
] as const

export function getTemperatureLevelIndex(temperature: number) {
  return TEMPERATURE_LEVELS.reduce(
    (found, level, index) => (temperature >= level.min ? index : found),
    0,
  )
}
