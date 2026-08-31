import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatRoom, StompChatMessage } from '../types/chat';
import {
  fetchChatRooms,
  fetchChatMessages,
  markChatAsRead,
} from '../api/chat';
import { sendChatbotMessage } from '../api/chatbot';
import { getPublicUserProfile } from '../api/user';
import { useAuth } from '../context/AuthContext';
import {
  connectStomp,
  subscribeToRoom,
  unsubscribeFromRoom,
  sendChatMessage,
} from '../lib/stompClient';

type DreamyMessage = {
  id: string;
  role: 'user' | 'bot';
  text: string;
};

// "YYYY-MM-DDTHH:mm:ss" -> 채팅방 목록용 짧은 표시 (오늘이면 시:분, 아니면 M/D)
function formatRoomTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  return isToday
    ? date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : `${date.getMonth() + 1}/${date.getDate()}`;
}

// "YYYY-MM-DDTHH:mm:ss" -> 메시지 말풍선용 시:분
function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// "YYYY-MM-DDTHH:mm:ss" -> 날짜 변경선 문구 ("2026년 8월 31일 월요일")
function formatChatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${DAY_LABELS[date.getDay()]}요일`;
}

function isSameDay(a: string, b: string): boolean {
  const dateA = new Date(a);
  const dateB = new Date(b);
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function ChatDateSeparator({ date }: { date: string }) {
  return (
    <div className="my-3 flex items-center px-2">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="mx-3 text-xs font-medium text-slate-400">{formatChatDate(date)}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

export default function ChatPage() {
  const { profile } = useAuth();
  const currentUserId = profile?.id;

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [partnerAvatars, setPartnerAvatars] = useState<Record<number, string | null>>({});

  const [messages, setMessages] = useState<StompChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');

  // 채팅 말풍선 글자 크기 조절 (기본 14px = text-sm)
  const [chatFontSize, setChatFontSize] = useState(14);

  // 드림이(AI 챗봇) - 일반 채팅방과 달리 STOMP가 아니라 매칭 의도 대화 API를 그대로 씀
  const [isDreamySelected, setIsDreamySelected] = useState(false);
  const [dreamyMessages, setDreamyMessages] = useState<DreamyMessage[]>([
    { id: 'welcome', role: 'bot', text: '안녕? 오늘은 어떤 걸 도와줄까?' },
  ]);
  const [dreamyInput, setDreamyInput] = useState('');
  const [dreamySending, setDreamySending] = useState(false);
  const dreamyScrollRef = useRef<HTMLDivElement>(null);

  const listAbort = useRef<AbortController | null>(null);
  const msgAbort = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 현재 보고 있는 방을 구독 콜백(클로저) 안에서 최신값으로 참조하기 위한 ref
  // (selectedRoomId를 effect 의존성에 넣으면 방을 바꿀 때마다 전체 재구독이 필요해져서 비효율적)
  const selectedRoomIdRef = useRef<number | null>(null);
  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  // 0) STOMP 연결 (앱 전역에서 공유하는 구조라면 AuthProvider 등 더 상위로 옮기는 게 낫습니다)
  useEffect(() => {
    connectStomp();
  }, []);

  // 1) 채팅방 목록 로드
  useEffect(() => {
    listAbort.current?.abort();
    const controller = new AbortController();
    listAbort.current = controller;

    setRoomsLoading(true);
    fetchChatRooms(controller.signal)
      .then((data) => {
        const list = data as ChatRoom[];
        setRooms(list);
        if (!selectedRoomId && list.length > 0) {
          setSelectedRoomId(list[0].roomId);
        }
      })
      .catch((e) => {
        if (e.name !== 'AbortError') console.error(e);
      })
      .finally(() => setRoomsLoading(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1-1) DM 상대방 프로필 사진 로드 — ChatRoom 목록 응답 자체엔 사진이 없어서
  //      partnerId별로 공개 프로필을 따로 조회한다 (모바일 앱과 동일한 방식).
  useEffect(() => {
    const partnerIds = Array.from(
      new Set(
        rooms
          .map((r) => r.partnerId)
          .filter((id): id is number => id != null && !(id in partnerAvatars)),
      ),
    );
    if (partnerIds.length === 0) return;

    partnerIds.forEach((id) => {
      getPublicUserProfile(id)
        .then((p) => setPartnerAvatars((prev) => ({ ...prev, [id]: p.profileImageUrl })))
        .catch(() => setPartnerAvatars((prev) => ({ ...prev, [id]: null })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms]);

  // 2) 선택된 방의 메시지 이력 로드 + 읽음 처리
  useEffect(() => {
    if (selectedRoomId == null) return;

    msgAbort.current?.abort();
    const controller = new AbortController();
    msgAbort.current = controller;

    setMessagesLoading(true);
    fetchChatMessages(selectedRoomId, { size: 50 }, controller.signal)
      .then((data) => {
        const list = data as StompChatMessage[];
        setMessages(list);

        const lastMessage = list[list.length - 1];
        if (lastMessage) {
          markChatAsRead(selectedRoomId, lastMessage.messageId);
          setRooms((prev) =>
            prev.map((r) => (r.roomId === selectedRoomId ? { ...r, unreadCount: 0 } : r))
          );
        }
      })
      .catch((e) => {
        if (e.name !== 'AbortError') console.error(e);
      })
      .finally(() => setMessagesLoading(false));

    return () => controller.abort();
  }, [selectedRoomId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    dreamyScrollRef.current?.scrollTo({ top: dreamyScrollRef.current.scrollHeight });
  }, [dreamyMessages]);

  // 3) 전체 방 실시간 구독
  //    - 지금 보고 있는 방 -> 메시지 목록에 붙이고 읽음 처리
  //    - 보고 있지 않은 방 -> unreadCount만 올리고 미리보기 갱신
  //    선택된 방이 바뀌어도 재구독하지 않도록, "지금 보고 있는 방이 어디인지"는
  //    selectedRoomIdRef를 통해 최신값을 읽는다.
  const roomIdsKey = useMemo(() => rooms.map((r) => r.roomId).join(','), [rooms]);

  useEffect(() => {
    if (rooms.length === 0) return;

    const handleIncoming = (message: StompChatMessage) => {
      const isViewingThisRoom = selectedRoomIdRef.current === message.roomId;

      if (isViewingThisRoom) {
        setMessages((prev) => [...prev, message]);
        markChatAsRead(message.roomId, message.messageId);
      }

      setRooms((prev) =>
        prev.map((r) =>
          r.roomId === message.roomId
            ? {
                ...r,
                lastMessage: message.content,
                lastMessageAt: message.createdAt,
                unreadCount: isViewingThisRoom ? 0 : r.unreadCount + 1,
              }
            : r
        )
      );
    };

    const roomIds = roomIdsKey ? roomIdsKey.split(',').map(Number) : [];
    roomIds.forEach((id) => subscribeToRoom(id, handleIncoming));

    return () => {
      roomIds.forEach((id) => unsubscribeFromRoom(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomIdsKey]);

  const selectedRoom = rooms.find((r) => r.roomId === selectedRoomId) ?? null;

  const [isComposing, setIsComposing] = useState(false);
  const handleSend = () => {
    if (!draft.trim() || selectedRoomId == null) return;
    sendChatMessage(selectedRoomId, draft.trim());
    setDraft('');
  };

  const handleSelectDreamy = () => {
    setIsDreamySelected(true);
  };

  const handleSelectRoom = (roomId: number) => {
    setIsDreamySelected(false);
    setSelectedRoomId(roomId);
  };

  const handleDreamySend = async () => {
    const text = dreamyInput.trim();
    if (!text || dreamySending) return;

    setDreamyMessages((prev) => [...prev, { id: `${Date.now()}-user`, role: 'user', text }]);
    setDreamyInput('');
    setDreamySending(true);

    try {
      const result = await sendChatbotMessage(text);
      setDreamyMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-bot`, role: 'bot', text: result.assistantMessage },
      ]);
    } catch (err) {
      setDreamyMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-bot-error`,
          role: 'bot',
          text: err instanceof Error ? err.message : '응답을 받지 못했어요. 잠시 후 다시 시도해주세요.',
        },
      ]);
    } finally {
      setDreamySending(false);
    }
  };

  return (
    <div className="flex h-full bg-slate-50 text-slate-900">
      {/* 채팅방 목록 */}
      <aside className="flex w-[380px] shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-2xl font-bold">채팅</h1>
        </div>

        {/* 드림이는 항상 목록 맨 위에 고정 (스크롤 영역 밖) */}
        <button
          onClick={handleSelectDreamy}
          className={`flex w-full shrink-0 items-center gap-3 border-b border-slate-200 px-6 py-4 text-left transition-colors ${
            isDreamySelected ? 'bg-slate-200' : 'bg-slate-100 hover:bg-slate-200'
          }`}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
            <img src="/landing_img/dreamy.svg" alt="" className="h-11 w-11" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">드림이</span>
            </div>
            <p className="truncate text-sm text-slate-500">궁금한 걸 물어보세요</p>
          </div>
        </button>

        <div className="flex-1 overflow-y-auto">
          {roomsLoading && (
            <p className="px-6 py-8 text-center text-sm text-slate-400">불러오는 중…</p>
          )}

          {!roomsLoading && rooms.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-slate-400">채팅방이 없어요.</p>
          )}

          {rooms.map((room) => (
            <button
              key={room.roomId}
              onClick={() => handleSelectRoom(room.roomId)}
              className={`flex w-full items-start gap-3 border-b border-slate-100 px-6 py-4 text-left transition-colors ${
                !isDreamySelected && room.roomId === selectedRoomId ? 'bg-indigo-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                {room.partnerId != null && partnerAvatars[room.partnerId] ? (
                  <img
                    src={partnerAvatars[room.partnerId]!}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img src="/landing_img/myPage/user.svg" alt="" className="h-7 w-7 opacity-40" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate font-semibold">{room.title}</span>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatRoomTime(room.lastMessageAt)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-slate-500">{room.lastMessage}</p>
                  {room.unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-semibold text-white">
                      {room.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* 채팅 상세 */}
      <section className="flex flex-1 flex-col">
        {isDreamySelected ? (
          <>
            <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-indigo-50">
                <img src="/landing_img/dreamy.svg" alt="" className="h-10 w-10" />
              </div>
              <p className="font-semibold">드림이</p>
            </header>

            <div ref={dreamyScrollRef} className="flex-1 space-y-2 overflow-y-auto px-6 py-6">
              {dreamyMessages.map((msg) =>
                msg.role === 'bot' ? (
                  <div key={msg.id} className="flex justify-start">
                    <div className="max-w-[70%]">
                      <p className="mb-1 text-xs font-medium text-slate-500">드림이</p>
                      <div className="whitespace-pre-wrap rounded-2xl bg-white px-3 py-2 text-sm leading-relaxed text-slate-800 shadow-sm ring-1 ring-slate-100">
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[70%] whitespace-pre-wrap rounded-2xl bg-indigo-600 px-3 py-2 text-sm leading-relaxed text-white">
                      {msg.text}
                    </div>
                  </div>
                ),
              )}
              {dreamySending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-400 shadow-sm ring-1 ring-slate-100">
                    입력 중…
                  </div>
                </div>
              )}
            </div>

            <footer className="border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex items-end gap-3">
                <textarea
                  value={dreamyInput}
                  onChange={(e) => setDreamyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      handleDreamySend();
                    }
                  }}
                  placeholder="메시지를 입력하세요..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400"
                />
                <button
                  onClick={handleDreamySend}
                  disabled={!dreamyInput.trim() || dreamySending}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-40"
                  aria-label="메시지 보내기"
                >
                  ↑
                </button>
              </div>
            </footer>
          </>
        ) : !selectedRoom ? (
          <div className="flex flex-1 items-center justify-center text-slate-400">
            채팅방을 선택해주세요
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                  {selectedRoom.partnerId != null && partnerAvatars[selectedRoom.partnerId] ? (
                    <img
                      src={partnerAvatars[selectedRoom.partnerId]!}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img src="/landing_img/myPage/user.svg" alt="" className="h-7 w-7 opacity-40" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{selectedRoom.title}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5">
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

            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-6 py-6">
              {messagesLoading && (
                <p className="text-center text-sm text-slate-400">메시지를 불러오는 중…</p>
              )}

              {messages.map((msg, idx) => {
                const senderIsMe = msg.senderId === currentUserId;
                const prevMsg = messages[idx - 1];
                const showDateSeparator = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);
                return (
                  <div key={msg.messageId}>
                    {showDateSeparator && <ChatDateSeparator date={msg.createdAt} />}
                    <div className={`flex ${senderIsMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${senderIsMe ? 'items-end' : 'items-start'}`}>
                      {!senderIsMe && (
                        <p className="mb-1 text-xs font-medium text-slate-500">{msg.senderName}</p>
                      )}
                      <div
                        style={{ fontSize: chatFontSize }}
                        className={`whitespace-pre-wrap rounded-2xl px-3 py-2 leading-relaxed ${
                          senderIsMe
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-100'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <p
                        className={`mt-1 text-[11px] text-slate-400 ${
                          senderIsMe ? 'text-right' : 'text-left'
                        }`}
                      >
                        {formatMessageTime(msg.createdAt)}
                      </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <footer className="border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex items-end gap-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isComposing && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="메시지를 입력하세요..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400"
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-40"
                  aria-label="메시지 보내기"
                >
                  ↑
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}