import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';
import { Composer, MessageList, RoomAvatar, RoomList } from '../components/chat/ChatParts';

export default function ChatPage() {
  const { profile } = useAuth();
  const currentUserId = profile?.id;
  const chat = useChat();
  const { selectedRoom } = chat;

  // 채팅 말풍선 글자 크기 조절 (기본 14px = text-sm)
  const [chatFontSize, setChatFontSize] = useState(14);

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
                  <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
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
    </div>
  );
}
