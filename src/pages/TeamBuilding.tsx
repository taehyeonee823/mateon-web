
import { Fragment } from 'react'
import type { CSSProperties } from 'react'

export default function TeamBuilding() {
  return (
    <Fragment>
      <style>{`
        @keyframes tb-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .tb-mascot { animation: none !important; }
        }
      `}</style>

      <main style={styles.main}>
        <div style={styles.glow} aria-hidden />
        <section style={styles.intro}>
          <img
            className="tb-mascot"
            src="/landing_img/dreamy.png"
            alt="드림이 마스코트"
            style={styles.mascot}
          />
          <h1 style={styles.title}>안녕하세요, 드림이에요!</h1>
          <p style={styles.desc}>나랑 딱 맞는 팀, 같이 찾아볼까요?</p>
        </section>
      </main>
    </Fragment>
  )
}

const styles: Record<string, CSSProperties> = {
  main: {
    position: 'relative',
    minHeight: 'calc(100vh - 72px)',
    display: 'grid',
    placeItems: 'center',
    background: '#f7f8fa',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: '50%',
    left: 'calc(50% + (100vw - 100%) / 2)',
    width: 680,
    height: 480,
    transform: 'translate(-50%, -50%)',
    background:
      'radial-gradient(ellipse at center, rgba(214,218,255,0.85) 0%, rgba(228,231,255,0.5) 40%, rgba(247,248,250,0) 72%)',
    pointerEvents: 'none',
  },
  intro: {
    position: 'relative',
    left: 'calc((100vw - 100%) / 2)',
    textAlign: 'center',
    transform: 'translateY(-12px)',
  },
  mascot: {
    width: 150,
    height: 'auto',
    marginBottom: 16,
    animation: 'tb-float 3s ease-in-out infinite',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#111',
    letterSpacing: -0.4,
    margin: '0 0 8px',
  },
  desc: {
    fontSize: 14,
    fontWeight: 500,
    color: '#666a73',
    margin: 0,
  },
}
