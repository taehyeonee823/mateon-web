import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import {
  getMyApplications,
  getReceivedOffers,
  respondToOffer,
  cancelApplication,
  type Application,
  type TeamOffer,
} from '../api/activity'

const APPLICATION_STATUS_LABEL: Record<Application['status'], { label: string; className: string }> = {
  PENDING: { label: '심사중', className: 'bg-brand-50 text-brand-600' },
  APPROVED: { label: '합격', className: 'bg-emerald-50 text-emerald-600' },
  REJECTED: { label: '불합격', className: 'bg-rose-50 text-rose-500' },
}

const OFFER_STATUS_LABEL: Record<TeamOffer['status'], { label: string; className: string }> = {
  PENDING: { label: '응답 대기', className: 'bg-brand-50 text-brand-600' },
  ACCEPTED: { label: '수락함', className: 'bg-emerald-50 text-emerald-600' },
  REJECTED: { label: '거절함', className: 'bg-rose-50 text-rose-500' },
  CANCELED: { label: '취소됨', className: 'bg-brand-50 text-brand-300' },
}

export default function MyApplications() {
  const { isLoggedIn } = useAuth()
  const [tab, setTab] = useState<'applications' | 'offers'>('applications')
  const [applications, setApplications] = useState<Application[]>([])
  const [offers, setOffers] = useState<TeamOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn) return
    setLoading(true)
    setError(null)

    Promise.all([getMyApplications(), getReceivedOffers()])
      .then(([apps, offerList]) => {
        setApplications([...apps].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
        setOffers([...offerList].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '목록을 불러오지 못했어요.')
      })
      .finally(() => setLoading(false))
  }, [isLoggedIn])

  async function handleCancelApplication(applicationId: number) {
    if (!window.confirm('지원을 취소하시겠어요?')) return
    try {
      await cancelApplication(applicationId)
      setApplications((prev) => prev.filter((a) => a.applicationId !== applicationId))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '지원 취소에 실패했어요.')
    }
  }

  async function handleRespondOffer(offerId: number, accepted: boolean) {
    try {
      const updated = await respondToOffer(offerId, accepted)
      setOffers((prev) => prev.map((o) => (o.offerId === offerId ? updated : o)))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '응답 처리에 실패했어요.')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="md:pl-64">
        <Topbar />

        <main className="mx-auto max-w-3xl px-6 py-12">
          <div className="mb-8 flex items-center gap-2 text-sm text-brand-400">
            <Link to="/my" className="hover:text-brand-600">
              내 활동
            </Link>
            <span>/</span>
            <span className="text-brand-700">지원 및 제안</span>
          </div>

          <h1 className="mb-6 text-2xl font-bold text-brand-900">지원 및 제안</h1>

          <div className="mb-6 flex gap-1 rounded-full bg-brand-50 p-1">
            <button
              type="button"
              onClick={() => setTab('applications')}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                tab === 'applications' ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-400'
              }`}
            >
              지원한 활동 ({applications.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('offers')}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                tab === 'offers' ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-400'
              }`}
            >
              받은 제안 ({offers.length})
            </button>
          </div>

          {!isLoggedIn ? (
            <p className="py-16 text-center text-sm text-brand-400">로그인이 필요해요.</p>
          ) : loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-brand-50" />
              ))}
            </div>
          ) : error ? (
            <p className="py-16 text-center text-sm text-rose-500">{error}</p>
          ) : tab === 'applications' ? (
            applications.length > 0 ? (
              <div className="flex flex-col gap-3">
                {applications.map((a) => (
                  <div key={a.applicationId} className="rounded-2xl border border-brand-100 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-bold text-brand-900">{a.teamTitle}</p>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${APPLICATION_STATUS_LABEL[a.status].className}`}
                      >
                        {APPLICATION_STATUS_LABEL[a.status].label}
                      </span>
                    </div>
                    {a.message && <p className="mt-2 text-sm text-brand-600">{a.message}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-brand-400">
                        {a.createdAt.slice(0, 10).replaceAll('-', '.')} 지원
                      </p>
                      {a.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handleCancelApplication(a.applicationId)}
                          className="rounded-full border border-rose-500 bg-white px-5 py-2 text-sm font-semibold text-rose-500 transition-colors hover:bg-rose-50"
                        >
                          지원 취소
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-brand-100 py-16 text-center text-sm text-brand-400">
                지원한 팀이 없어요.
              </p>
            )
          ) : offers.length > 0 ? (
            <div className="flex flex-col gap-3">
              {offers.map((o) => (
                <div key={o.offerId} className="rounded-2xl border border-brand-100 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold text-brand-900">{o.teamTitle}</p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${OFFER_STATUS_LABEL[o.status].className}`}
                    >
                      {OFFER_STATUS_LABEL[o.status].label}
                    </span>
                  </div>
                  {o.message && <p className="mt-2 text-sm text-brand-600">{o.message}</p>}
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-brand-400">
                      {o.createdAt.slice(0, 10).replaceAll('-', '.')} 제안받음
                    </p>
                    {o.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleRespondOffer(o.offerId, false)}
                          className="rounded-full border border-rose-500 bg-white px-5 py-2 text-sm font-semibold text-rose-500 transition-colors hover:bg-rose-50"
                        >
                          거절
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespondOffer(o.offerId, true)}
                          className="rounded-full border border-emerald-500 bg-white px-5 py-2 text-sm font-semibold text-emerald-500 transition-colors hover:bg-emerald-50"
                        >
                          수락
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-brand-100 py-16 text-center text-sm text-brand-400">
              받은 제안이 없어요.
            </p>
          )}
        </main>

        <Footer />
      </div>
    </div>
  )
}
