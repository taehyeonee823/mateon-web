import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatRoom, RoomType, StompChatMessage } from '../types/chat';
import {
  fetchChatRooms,
  fetchChatMessages,
  markChatAsRead,
} from '../api/chat'; 
import { useAuth } from '../context/AuthContext'; 
import {
  connectStomp,
  subscribeToRoom,
  unsubscribeFromRoom,
  sendChatMessage,
} from '../lib/stompClient'; 

type RoomTab = 'ALL' | RoomType;

const TAB_LABEL: Record<RoomTab, string> = {
  ALL: '전체',
  DM: '개인 채팅',
  GROUP: '팀 채팅',
};

const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  DM: '개인',
  GROUP: '팀',
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

export default function ChatPage() {
  const { profile } = useAuth();
  const currentUserId = profile?.id;

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RoomTab>('ALL');
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const [messages, setMessages] = useState<StompChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');

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

  const filteredRooms = useMemo(() => {
    if (activeTab === 'ALL') return rooms;
    return rooms.filter((r) => r.type === activeTab);
  }, [rooms, activeTab]);

  const selectedRoom = rooms.find((r) => r.roomId === selectedRoomId) ?? null;

  const [isComposing, setIsComposing] = useState(false);
  const handleSend = () => {
    if (!draft.trim() || selectedRoomId == null) return;
    sendChatMessage(selectedRoomId, draft.trim());
    setDraft('');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      {/* 채팅방 목록 */}
      <aside className="flex w-[380px] shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-2xl font-bold">채팅</h1>
        </div>

        <div className="flex gap-2 px-6 pb-4">
          {(Object.keys(TAB_LABEL) as RoomTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {TAB_LABEL[tab]}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {roomsLoading && (
            <p className="px-6 py-8 text-center text-sm text-slate-400">불러오는 중…</p>
          )}

          {!roomsLoading && filteredRooms.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-slate-400">채팅방이 없어요.</p>
          )}

          {filteredRooms.map((room) => (
            <button
              key={room.roomId}
              onClick={() => setSelectedRoomId(room.roomId)}
              className={`flex w-full items-start gap-3 border-b border-slate-100 px-6 py-4 text-left transition-colors ${
                room.roomId === selectedRoomId ? 'bg-indigo-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                <span className="text-sm font-semibold text-slate-400">{room.title?.[0]}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate font-semibold">{room.title}</span>
                    <span className="shrink-0 rounded bg-indigo-100 px-1.5 py-0.5 text-[11px] font-medium text-indigo-600">
                      {ROOM_TYPE_LABEL[room.type]}
                    </span>
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
        {!selectedRoom ? (
          <div className="flex flex-1 items-center justify-center text-slate-400">
            채팅방을 선택해주세요
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                  <span className="text-sm font-semibold text-slate-400">
                    {selectedRoom.title?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{selectedRoom.title}</p>
                  <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[11px] font-medium text-indigo-600">
                    {ROOM_TYPE_LABEL[selectedRoom.type]}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
                  팀 정보 보기
                </button>
                <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
                  지원서 보기
                </button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              {messagesLoading && (
                <p className="text-center text-sm text-slate-400">메시지를 불러오는 중…</p>
              )}

              {messages.map((msg) => {
                const senderIsMe = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.messageId}
                    className={`flex ${senderIsMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${senderIsMe ? 'items-end' : 'items-start'}`}>
                      {!senderIsMe && (
                        <p className="mb-1 text-xs font-medium text-slate-500">{msg.senderName}</p>
                      )}
                      <div
                        className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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