import type { ChangeEvent } from 'react'

type ProfileIdentityCardProps = {
  photoUrl: string | null
  isUploadingPhoto: boolean
  onPhotoChange: (e: ChangeEvent<HTMLInputElement>) => void
  onRemovePhoto: () => void
  name: string
  onNameChange: (value: string) => void
  school: string | null
}

export default function ProfileIdentityCard({
  photoUrl,
  isUploadingPhoto,
  onPhotoChange,
  onRemovePhoto,
  name,
  onNameChange,
  school,
}: ProfileIdentityCardProps) {
  return (
    <div className="mb-8 flex items-center gap-6 rounded-2xl border border-brand-100 p-6 bg-gray-50">
      <div className="flex shrink-0 flex-col items-center ml-16">
        <div className="relative h-24 w-24">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-brand-50">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <span className="text-3xl">🙂</span>
            )}
          </div>

          <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-brand-100 bg-white p-1.5 shadow-sm shadow-black/10 transition-colors hover:bg-brand-50">
            <img src="/landing_img/myPage/camera.svg" alt="" className="h-full w-full object-contain" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPhotoChange}
              disabled={isUploadingPhoto}
            />
          </label>
        </div>

        {photoUrl && (
          <button
            type="button"
            onClick={onRemovePhoto}
            disabled={isUploadingPhoto}
            className="mt-3 text-xs font-medium text-rose-500 underline"
          >
            기본 이미지로 변경
          </button>
        )}
      </div>

      <div className="min-w-1 flex-1 ml-16">
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold text-brand-900">이름</label>
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="이름을 입력해주세요"
            className="h-9 w-full border-b border-brand-900 px-1 text-brand-900 placeholder:text-brand-400 focus:outline-none bg-gray-50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-900">학교</label>
          <input
            value={school ?? '재학생 인증이 필요합니다.'}
            disabled
            className="h-9 w-full border-b border-brand-100 px-1 text-brand-400 bg-gray-50"
          />
        </div>
      </div>
    </div>
  )
}
