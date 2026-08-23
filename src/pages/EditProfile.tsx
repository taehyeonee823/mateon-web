import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { deleteProfileImage, updateProfile, uploadProfileImage } from '../api/user'
import { getUnivByEmail } from '../utils/univ'
import ProfileIdentityCard from '../components/ProfileIdentityCard'

const TRACKS = [
  '인문과학계열',
  '사회과학계열',
  '자연과학계열',
  '공학계열',
  '예체능계열',
  '사범·교육학계열',
  '의약학계열',
]

export default function EditProfile() {
  const navigate = useNavigate()
  const { profile, isLoggedIn, refresh } = useAuth()

  const [name, setName] = useState('')
  const [track, setTrack] = useState('')
  const [major, setMajor] = useState('')
  const [job1, setJob1] = useState('')
  const [job2, setJob2] = useState('')
  const [job3, setJob3] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  useEffect(() => {
    if (!profile) return
    setName(profile.name ?? '')
    setTrack(profile.college ?? '')
    setMajor(profile.major ?? '')
    setJob1(profile.interestJobPrimary ?? '')
    setJob2(profile.interestJobSecondary ?? '')
    setJob3(profile.interestJobTertiary ?? '')
  }, [profile])

  const univ = profile?.schoolVerified ? getUnivByEmail(profile.schoolEmail ?? profile.email) : null
  const isComplete = !!(name && track && major && job1 && job2 && job3)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile || !isComplete || isSubmitting) return

    setError(null)
    setIsSubmitting(true)
    try {
      await updateProfile({
        name,
        college: track,
        major,
        interestJobPrimary: job1,
        interestJobSecondary: job2,
        interestJobTertiary: job3,
        schoolEmail: profile.schoolEmail,
        schoolVerified: profile.schoolVerified,
        profileImageUrl: profile.profileImageUrl,
        portfolio: profile.portfolio,
      })
      await refresh()
      window.alert('회원정보가 수정되었습니다.')
      navigate('/my')
    } catch (err) {
      setError(err instanceof Error ? err.message : '잠시 후 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || isUploadingPhoto) return

    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)
    setIsUploadingPhoto(true)
    try {
      await uploadProfileImage(file)
      await refresh()
    } catch (err) {
      setPreviewUrl(null)
      window.alert(err instanceof Error ? err.message : '업로드에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      URL.revokeObjectURL(localPreview)
      setIsUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (isUploadingPhoto) return
    if (!window.confirm('기본 이미지로 변경할까요?')) return

    setIsUploadingPhoto(true)
    try {
      await deleteProfileImage()
      setPreviewUrl(null)
      await refresh()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '삭제에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  if (!isLoggedIn || !profile) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar />
        <div className="md:pl-64">
          <Topbar />
          <main className="flex min-h-[60vh] items-center justify-center text-brand-500">
            로그인이 필요해요.
          </main>
          <Footer />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="md:pl-64">
        <Topbar />

        <main className="mx-auto max-w-xl px-6 py-12">
          <h1 className="mb-8 text-center text-2xl font-bold text-brand-900">회원정보 수정</h1>

          <ProfileIdentityCard
            photoUrl={previewUrl ?? profile.profileImageUrl}
            isUploadingPhoto={isUploadingPhoto}
            onPhotoChange={handlePhotoChange}
            onRemovePhoto={handleRemovePhoto}
            name={name}
            onNameChange={setName}
            school={univ}
          />

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-brand-900">계열</label>
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  className="h-14 w-full rounded-xl border border-[#D8E1FD] bg-white px-4 text-brand-900 focus:outline-none"
                >
                  <option value="" disabled>
                    계열 선택
                  </option>
                  {TRACKS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-brand-900">학과</label>
                <input
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="학과 입력"
                  className="h-14 w-full rounded-xl border border-[#D8E1FD] px-4 text-brand-900 placeholder:text-brand-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-brand-900">희망 직무 1순위</label>
              <input
                value={job1}
                onChange={(e) => setJob1(e.target.value)}
                placeholder="1순위 희망직무를 입력해주세요"
                className="h-9 w-full border-b border-brand-900 px-1 text-brand-900 placeholder:text-brand-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-brand-900">희망 직무 2순위</label>
              <input
                value={job2}
                onChange={(e) => setJob2(e.target.value)}
                placeholder="2순위 희망직무를 입력해주세요"
                className="h-9 w-full border-b border-brand-900 px-1 text-brand-900 placeholder:text-brand-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-brand-900">희망 직무 3순위</label>
              <input
                value={job3}
                onChange={(e) => setJob3(e.target.value)}
                placeholder="3순위 희망직무를 입력해주세요"
                className="h-9 w-full border-b border-brand-900 px-1 text-brand-900 placeholder:text-brand-400 focus:outline-none"
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-brand-900">포트폴리오</p>
              <button
                type="button"
                onClick={() => window.alert('웹에서는 아직 지원하지 않아요. 앱에서 업로드해주세요.')}
                className="flex h-32 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#2554F0]/50 bg-brand-50/40 text-center"
              >
                <span className="text-2xl">📄</span>
                <span className="text-sm font-semibold text-brand-700">
                  {profile.portfolio ? '포트폴리오 등록됨' : 'PDF 포트폴리오를 선택해주세요'}
                </span>
                <span className="text-xs text-brand-400">최대 20MB</span>
              </button>
            </div>

            {error && <p className="text-sm font-medium text-rose-500">{error}</p>}

            <button
              type="submit"
              disabled={!isComplete || isSubmitting}
              className="h-14 rounded-xl bg-[#2554F0] text-lg font-semibold text-white transition-opacity disabled:opacity-40"
            >
              {isSubmitting ? '저장 중...' : '저장하기'}
            </button>
          </form>
        </main>

        <Footer />
      </div>
    </div>
  )
}
