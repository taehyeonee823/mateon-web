export default function Pagination({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  // 페이지가 많아질 때를 대비해 현재 페이지 주변만 보여주고 나머지는 '...' 처리
  const pages: (number | 'ellipsis')[] = []
  const windowStart = Math.max(2, currentPage - 1)
  const windowEnd = Math.min(totalPages - 1, currentPage + 1)

  pages.push(1)
  if (windowStart > 2) pages.push('ellipsis')
  for (let p = windowStart; p <= windowEnd; p++) pages.push(p)
  if (windowEnd < totalPages - 1) pages.push('ellipsis')
  if (totalPages > 1) pages.push(totalPages)

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="페이지네이션">
      <button
        type="button"
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-[#6F7095] transition-colors hover:bg-[#F3F3FA] disabled:opacity-30"
        aria-label="이전 페이지"
      >
        ‹
      </button>

      {pages.map((p, idx) =>
        p === 'ellipsis' ? (
          <span key={`e-${idx}`} className="flex h-8 w-8 items-center justify-center text-sm text-[#8C8DAE]">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === currentPage ? 'page' : undefined}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
              p === currentPage ? 'bg-[#4D4DF1] text-white' : 'text-[#6F7095] hover:bg-[#F3F3FA]'
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-[#6F7095] transition-colors hover:bg-[#F3F3FA] disabled:opacity-30"
        aria-label="다음 페이지"
      >
        ›
      </button>
    </nav>
  )
}