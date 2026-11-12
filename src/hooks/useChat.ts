import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatRoom, StompChatMessage } from '../types/chat';
import { fetchChatRooms, fetchChatMessages, markChatAsRead } from '../api/chat';
import { getPublicUserProfile } from '../api/user';
import {
  connectStomp,
  subscribeToRoom,
  unsubscribeFromRoom,
  sendChatMessage,
} from '../lib/stompClient';

// 채팅 페이지(/chat)와 오른쪽 채팅 패널이 같은 로직을 쓰도록 분리한 훅.
// stompClient는 roomId당 핸들러를 하나만 들고 있으므로, 이 훅은 화면에 한 곳에서만 쓰여야 한다.
export function useChat({ autoSelectFirst = true }: { autoSelectFirst?: boolean } = {}) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [partnerAvatars, setPartnerAvatars] = useState<Record<number, string | null>>({});

  const [messages, setMessages] = useState<StompChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const msgAbort = useRef<AbortController | null>(null);

  // 현재 보고 있는 방을 구독 콜백(클로저) 안에서 최신값으로 참조하기 위한 ref
  // (selectedRoomId를 effect 의존성에 넣으면 방을 바꿀 때마다 전체 재구독이 필요해져서 비효율적)
  const selectedRoomIdRef = useRef<number | null>(null);
  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  // 0) STOMP 연결
  useEffect(() => {
    connectStomp();
  }, []);

  // 1) 채팅방 목록 로드
  useEffect(() => {
    const controller = new AbortController();

    setRoomsLoading(true);
    fetchChatRooms(controller.signal)
      .then((data) => {
        const list = data as ChatRoom[];
        setRooms(list);
        if (autoSelectFirst && list.length > 0) {
          setSelectedRoomId((prev) => prev ?? list[0].roomId);
        }
      })
      .catch((e) => {
        if (e.name !== 'AbortError') console.error(e);
      })
      .finally(() => {
        if (!controller.signal.aborted) setRoomsLoading(false);
      });

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
    if (selectedRoomId == null) {
      setMessages([]);
      return;
    }

    msgAbort.current?.abort();
    const controller = new AbortController();
    msgAbort.current = controller;

    setMessages([]);
    setMessagesLoading(true);
    fetchChatMessages(selectedRoomId, { size: 50 }, controller.signal)
      .then((data) => {
        const list = data as StompChatMessage[];
        setMessages(list);

        const lastMessage = list[list.length - 1];
        if (lastMessage) {
          markChatAsRead(selectedRoomId, lastMessage.messageId);
          setRooms((prev) =>
            prev.map((r) => (r.roomId === selectedRoomId ? { ...r, unreadCount: 0 } : r)),
          );
        }
      })
      .catch((e) => {
        if (e.name !== 'AbortError') console.error(e);
      })
      .finally(() => {
        if (!controller.signal.aborted) setMessagesLoading(false);
      });

    return () => controller.abort();
  }, [selectedRoomId]);

  // 3) 전체 방 실시간 구독
  //    - 지금 보고 있는 방 -> 메시지 목록에 붙이고 읽음 처리
  //    - 보고 있지 않은 방 -> unreadCount만 올리고 미리보기 갱신
  const roomIdsKey = useMemo(() => rooms.map((r) => r.roomId).join(','), [rooms]);

  useEffect(() => {
    if (!roomIdsKey) return;

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
            : r,
        ),
      );
    };

    const roomIds = roomIdsKey.split(',').map(Number);
    roomIds.forEach((id) => subscribeToRoom(id, handleIncoming));

    return () => {
      roomIds.forEach((id) => unsubscribeFromRoom(id));
    };
  }, [roomIdsKey]);

  const selectedRoom = rooms.find((r) => r.roomId === selectedRoomId) ?? null;

  const sendMessage = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || selectedRoomId == null) return false;
    sendChatMessage(selectedRoomId, trimmed);
    return true;
  };

  return {
    rooms,
    roomsLoading,
    selectedRoomId,
    setSelectedRoomId,
    selectedRoom,
    partnerAvatars,
    messages,
    messagesLoading,
    sendMessage,
  };
}
