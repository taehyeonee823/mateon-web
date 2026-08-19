const IMAGES = [
  '/landing_img/testimg1.jpeg',
  '/landing_img/testimg2.jpeg',
  '/landing_img/testimg3.jpeg',
  '/landing_img/testimg4.jpeg',
  '/landing_img/testimg5.jpeg',
]

const COLUMNS = [
  [0, 1, 2, 3],
  [0, 1, 2, 3],
]

export default function FloatingImages() {
  return (
    <div className="relative hidden h-[480px] w-full max-w-xs shrink-0 overflow-hidden lg:block">
      <div className="grid h-full grid-cols-2 gap-4">
        {COLUMNS.map((items, col) => (
          <div key={col} className="relative h-full">
            {items.map((i) => {
              const duration = 18
              const step = duration / items.length
              const phase = col === 1 ? step / 2 : 0
              const delay = -(i * step + phase)
              const src = IMAGES[(col * items.length + i) % IMAGES.length]

              return (
                <div
                  key={i}
                  className="absolute inset-x-0 top-full aspect-[3/4] rounded-2xl bg-white p-1.5 shadow-lg shadow-brand-900/10"
                  style={{
                    animation: `rise-loop ${duration}s linear infinite`,
                    animationDelay: `${delay}s`,
                  }}
                >
                  <img src={src} alt="" className="h-full w-full rounded-lg object-cover" />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
