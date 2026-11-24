import type { ChatRoom, StompChatMessage } from '../types/chat';
import { requestJson } from '../lib/apiClient';

export type DmRoom = {
  roomId: number;
};

// 1. DM 방 조회 및 생성
export async function createOrGetDmRoom(
  targetUserId: number,
  signal?: AbortSignal
): Promise<DmRoom> {
  const result = await requestJson<DmRoom>('/api/chat/rooms/dm', {
    method: 'POST',
    json: { targetUserId },
    signal,
    fallbackMessage: 'DM 방 조회/생성 실패',
  });
  if (!result.success || !result.data) throw new Error(result.message);
  return result.data;
}

// 2. 채팅방 목록 조회
export async function fetchChatRooms(signal?: AbortSignal): Promise<ChatRoom[]> {
  const result = await requestJson<ChatRoom[]>('/api/chat/rooms', {
    cache: 'no-store',
    signal,
    fallbackMessage: '채팅방 목록 조회 실패',
  });
  if (!result.success || !result.data) throw new Error(result.message);
  return result.data;
}

// 3. 채팅방 메시지 이력 조회
export async function fetchChatMessages(
  roomId: number,
  options?: { before?: number; size?: number },
  signal?: AbortSignal
): Promise<StompChatMessage[]> {
  const params = new URLSearchParams();
  if (options?.before !== undefined) params.append('before', String(options.before));
  if (options?.size !== undefined) params.append('size', String(options.size));
  const queryString = params.toString();

  const result = await requestJson<StompChatMessage[]>(
    `/api/chat/rooms/${roomId}/messages${queryString ? `?${queryString}` : ''}`,
    {
      cache: 'no-store',
      signal,
      fallbackMessage: '메시지 이력 조회 실패',
    },
  );
  if (!result.success || !result.data) throw new Error(result.message);
  return result.data;
}

// 4. 채팅방 메시지 읽음 처리
export async function markChatAsRead(
  roomId: number,
  lastReadMessageId: number,
  signal?: AbortSignal
): Promise<boolean> {
  try {
    const result = await requestJson<null>(`/api/chat/rooms/${roomId}/read`, {
      method: 'POST',
      json: { lastReadMessageId },
      signal,
      fallbackMessage: '읽음 처리 실패',
    });
    return result.success;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return false;
    return false;
  }
}
