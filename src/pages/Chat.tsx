import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';
import { Composer, MessageList, RoomAvatar, RoomList } from '../components/chat/ChatParts';
import { getPublicUserProfile, type PublicUserProfile } from '../api/user';

export default function ChatPage() {
  const location = useLocation();
  const { profile } = useAuth();
  const currentUserId = profile?.id;
  const chat = useChat();
  const { selectedRoom } = chat;
  const requestedRoomId = (location.state as { roomId?: number } | null)?.roomId;

  // 채팅 말풍선 글자 크기 조절 (기본 14px = text-sm)
  const [chatFontSize, setChatFontSize] = useState(14);

  useEffect(() => {
    if (typeof requestedRoomId === 'number' && Number.isInteger(requestedRoomId)) {
      chat.setSelectedRoomId(requestedRoomId);
    }
  }, [chat.setSelectedRoomId, requestedRoomId]);

  // 프로필 팝업: 버튼을 누르면 대화 상대의 공개 프로필을 불러와 띄운다
  const [profileOpen, setProfileOpen] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<PublicUserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const partnerId = selectedRoom?.partnerId ?? null;

  // 다른 대화방으로 바뀌면 이전 팝업 상태를 지운다
  useEffect(() => {
    setProfileOpen(false);
    setPartnerProfile(null);
    setProfileError(null);
  }, [partnerId]);

  const openPartnerProfile = async () => {
    if (partnerId == null) return;
    setProfileOpen(true);
    setProfileLoading(true);
    setProfileError(null);
    try {
      setPartnerProfile(await getPublicUserProfile(partnerId));
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : '프로필을 불러오지 못했어요.');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    // 좌우 여백을 두고 채팅 영역을 카드로 감싼다 (화면이 좁아지면 여백을 줄임)
    <div className="h-full px-20 pb-8 text-slate-900 max-xl:px-10 max-lg:px-6 max-sm:px-4 max-sm:pb-4">
      <div className="mx-auto flex h-full max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* 채팅방 목록 — 창이 좁아질 때 가장 마지막에 여백을 줄인다 */}
        <aside className="flex w-[340px] shrink-0 flex-col border-r border-slate-200 bg-white max-md:w-[280px] max-sm:w-[220px]">
          <div className="border-b border-slate-100 px-6 pt-6 pb-4 max-md:px-4 max-md:pt-4 max-md:pb-3">
            <h1 className="text-xl font-bold max-sm:text-lg">채팅</h1>
          </div>

          <div className="flex-1 overflow-y-auto">
            <RoomList
              rooms={chat.rooms}
              loading={chat.roomsLoading}
              selectedRoomId={chat.selectedRoomId}
              partnerAvatars={chat.partnerAvatars}
              onSelect={chat.setSelectedRoomId}
            />
          </div>
        </aside>

        {/* 채팅 상세 */}
        <section className="flex min-w-0 flex-1 flex-col bg-slate-50">
          {!selectedRoom ? (
            <div className="flex flex-1 items-center justify-center text-slate-400">
              채팅방을 선택해주세요
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 max-xl:px-4 max-xl:py-3">
                <div className="flex items-center gap-3">
                  <RoomAvatar
                    src={selectedRoom.partnerId != null ? chat.partnerAvatars[selectedRoom.partnerId] : null}
                    className="h-10 w-10"
                  />
                  <p className="font-semibold">{selectedRoom.title}</p>
                </div>

                <div className="flex items-center gap-3 max-xl:gap-2">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 max-xl:hidden">
                    <span className="text-xs text-slate-400">가</span>
                    <input
                      type="range"
                      min={9}
                      max={22}
                      step={1}
                      value={chatFontSize}
                      onChange={(e) => setChatFontSize(Number(e.target.value))}
                      aria-label="채팅 글자 크기 조절"
                      className="h-1 w-24 cursor-pointer accent-indigo-600"
                    />
                    <span className="text-base text-slate-400">가</span>
                  </div>
                  <button
                    type="button"
                    onClick={openPartnerProfile}
                    disabled={partnerId == null}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                  >
                    프로필 보기
                  </button>
                </div>
              </header>

              <MessageList
                messages={chat.messages}
                loading={chat.messagesLoading}
                currentUserId={currentUserId}
                fontSize={chatFontSize}
                className="px-6 py-6 max-xl:px-4 max-xl:py-4"
              />

              <footer className="border-t border-slate-200 bg-white px-6 py-4 max-lg:px-3 max-lg:py-3">
                <Composer onSend={chat.sendMessage} />
              </footer>
            </>
          )}
        </section>
      </div>

      {profileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
          onClick={() => setProfileOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="partner-profile-title"
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-sm flex-col items-center overflow-hidden rounded-2xl bg-white px-6 pb-6 pt-8 shadow-xl"
          >
            <h2 id="partner-profile-title" className="sr-only">
              대화 상대 프로필
            </h2>

            {profileLoading ? (
              <p className="py-10 text-sm text-slate-400">불러오는 중이에요…</p>
            ) : profileError ? (
              <p role="alert" className="py-10 text-sm text-rose-500">{profileError}</p>
            ) : partnerProfile ? (
              <>
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                  {partnerProfile.profileImageUrl ? (
                    <img src={partnerProfile.profileImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <img src="/landing_img/myPage/user.svg" alt="" className="h-10 w-10 opacity-50" />
                  )}
                </div>
                <p className="mt-4 text-lg font-bold text-slate-900">{partnerProfile.name}</p>

                <dl className="mt-5 w-full divide-y divide-slate-100 text-sm">
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-slate-400">학교</dt>
                    <dd className="text-right font-medium text-slate-900">{partnerProfile.school ?? '정보 없음'}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-slate-400">계열</dt>
                    <dd className="text-right font-medium text-slate-900">{partnerProfile.college ?? '정보 없음'}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-slate-400">전공</dt>
                    <dd className="text-right font-medium text-slate-900">{partnerProfile.major ?? '정보 없음'}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-slate-400">관심 분야</dt>
                    <dd className="text-right font-medium text-slate-900">
                      {[partnerProfile.interestJobPrimary]
                        .filter(Boolean)
                        .join(' · ') || '-'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-slate-400">협업 온도</dt>
                    <dd className="text-right font-medium text-slate-900">
                      {partnerProfile.collaborationTemperature != null
                        ? `${partnerProfile.collaborationTemperature}°C (리뷰 ${partnerProfile.collaborationReviewCount ?? 0}개)`
                        : '-'}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 w-full text-left">
                  <p className="text-xs font-semibold text-slate-400">활동 기록</p>
                  {partnerProfile.participatedActivities && partnerProfile.participatedActivities.length > 0 ? (
                    <ul className="mt-2 flex max-h-40 flex-col gap-1.5 overflow-y-auto">
                      {partnerProfile.participatedActivities.map((act) => (
                        <li key={act.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                          <span className="shrink-0 rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-600">
                            {act.category === 'EXTERNAL' ? '대외활동' : '공모전'}
                          </span>
                          <span className="min-w-0 truncate text-slate-900">{act.title}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">아직 활동 기록이 없어요.</p>
                  )}
                </div>
              </>
            ) : null}

            <button
              type="button"
              onClick={() => setProfileOpen(false)}
              className="mt-6 h-12 w-full rounded-xl bg-[#2554F0] text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              닫기
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
