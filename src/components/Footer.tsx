export default function Footer() {
  return (
    <footer id="contact" className="border-t border-brand-100 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="" className="h-6 w-auto" />
          <span className="text-lg font-bold text-brand-900">MateOn</span>
        </div>

        <p className="text-xs text-brand-500 text-right">
          주소: 경기도 용인시 수지구 죽전로 152 단국대학교 죽전캠퍼스 소프트웨어ICT관 1층
          <br />
          &copy; {new Date().getFullYear()} Copyright © MateOn Inc. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
