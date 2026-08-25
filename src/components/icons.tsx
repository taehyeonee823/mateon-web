type IconProps = {
  className?: string
}

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  )
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M15.5 5.3a3.2 3.2 0 0 1 0 6" />
      <path d="M17 14.3c2.4.5 3.5 2.2 3.5 4.7" />
    </svg>
  )
}

export function PlusSquareIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 12a8 8 0 1 1 3.3 6.4L4 20l1.3-3.5A7.96 7.96 0 0 1 4 12Z" />
    </svg>
  )
}

export function UserCircleIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="10" r="2.8" />
      <path d="M6.3 18.2a6.2 6.2 0 0 1 11.4 0" />
    </svg>
  )
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 10a6 6 0 1 1 12 0c0 4 1.3 5.3 1.3 5.3H4.7S6 14 6 10Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  )
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

export function HashIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 4 7 20M17 4l-2 16M4 9h16M3 15h16" />
    </svg>
  )
}

export function SendIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 4 10.5 13.5M20 4 13.5 20l-3-6.5L4 10.5 20 4Z" />
    </svg>
  )
}

export function BoltIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} fill="currentColor" stroke="none">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  )
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function BookmarkIcon({ className, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base} className={className} fill={filled ? 'currentColor' : 'none'}>
      <path d="M6 4h12v16l-6-4-6 4V4z" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  )
}
