import type { ChatRoom, StompChatMessage } from '../types/chat';
import { getAccessToken } from './tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// 1. DM 방 조회 및 생성
export type DmRoom = {
  roomId: number;
};

export async function createOrGetDmRoom(
  targetUserId: number,
  signal?: AbortSignal
): Promise<DmRoom> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/chat/rooms/dm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ targetUserId }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`DM 방 조회/생성 실패: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

// 2. 채팅방 목록 조회
export async function fetchChatRooms(signal?: AbortSignal): Promise<ChatRoom[]> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/chat/rooms`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store', // 로그인 유저에 따라 응답이 달라지므로 앱 과는 달리 브라우저 캐시 금지
    signal,
  });

  if (!response.ok) {
    throw new Error(`채팅방 목록 조회 실패: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

// 3. 채팅방 메시지 이력 조회
export async function fetchChatMessages(
  roomId: number,
  options?: { before?: number; size?: number },
  signal?: AbortSignal
): Promise<StompChatMessage[]> {
  const accessToken = await getAccessToken();

  const params = new URLSearchParams();
  if (options?.before !== undefined) {
    params.append('before', String(options.before));
  }
  if (options?.size !== undefined) {
    params.append('size', String(options.size));
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/chat/rooms/${roomId}/messages${
    queryString ? `?${queryString}` : ''
  }`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store', // 로그인 유저에 따라 응답이 달라지므로 앱 과는 달리 브라우저 캐시 금지

    signal,
  });

  if (!response.ok) {
    throw new Error(`메시지 이력 조회 실패: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

// 4. 채팅방 메시지 읽음 처리
export async function markChatAsRead(
  roomId: number,
  lastReadMessageId: number,
  signal?: AbortSignal
): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}/read`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lastReadMessageId }),
      signal,
    });

    if (!response.ok) {
      console.warn(`[markChatAsRead] 읽음 처리 실패: ${response.status}`);
      return false;
    }
    return true;
  } catch (e) {
    // AbortController로 취소된 요청은 에러로 취급하지 않음
    if (e instanceof Error && e.name === 'AbortError') {
      return false;
    }
    console.warn('[markChatAsRead] 네트워크 오류', e);
    return false;
  }
}
