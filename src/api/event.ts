import type { ApiResponse } from './auth';
import { getAccessToken } from './tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 로그인 없이도 쓸 수 있는 엔드포인트(활동 목록/검색/상세)용 헤더.
// 토큰이 있으면 실어 보내서 bookmarked를 채워 받고, 없으면 헤더 자체를 생략한다.
async function optionalAuthHeader(): Promise<HeadersInit> {
  const accessToken = await getAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export type EventCategory = 'CONTEST' | 'EXTERNAL';

export type EventField =
  | 'TRAVEL_HOTEL_AIRLINE'
  | 'PRESS_MEDIA'
  | 'CULTURE_HISTORY'
  | 'EVENT_FESTIVAL'
  | 'EDUCATION'
  | 'DESIGN_PHOTO_ART_VIDEO'
  | 'ECONOMY_FINANCE'
  | 'MANAGEMENT_CONSULTING_MARKETING'
  | 'POLITICS_SOCIETY_LAW'
  | 'SPORTS_FITNESS'
  | 'MEDICAL_HEALTH'
  | 'BEAUTY_COSMETICS'
  | 'SCIENCE_ENGINEERING_TECH_IT'
  | 'COOKING_FOOD'
  | 'STARTUP_SELF_DEVELOPMENT'
  | 'ENVIRONMENT_ENERGY'
  | 'CONTENTS'
  | 'SOCIAL_CONTRIBUTION_EXCHANGE'
  | 'DISTRIBUTION_LOGISTICS'
  | 'PLANNING_IDEA'
  | 'ETC';

export const EVENT_FIELD_LABELS: Record<EventField, string> = {
  TRAVEL_HOTEL_AIRLINE: '여행/호텔/항공',
  PRESS_MEDIA: '언론/미디어',
  CULTURE_HISTORY: '문화/역사',
  EVENT_FESTIVAL: '행사/페스티벌',
  EDUCATION: '교육',
  DESIGN_PHOTO_ART_VIDEO: '디자인/사진/예술/영상',
  ECONOMY_FINANCE: '경제/금융',
  MANAGEMENT_CONSULTING_MARKETING: '경영/컨설팅/마케팅',
  POLITICS_SOCIETY_LAW: '정치/사회/법률',
  SPORTS_FITNESS: '체육/헬스',
  MEDICAL_HEALTH: '의료/보건',
  BEAUTY_COSMETICS: '뷰티/미용/화장품',
  SCIENCE_ENGINEERING_TECH_IT: '과학/공학/기술/IT',
  COOKING_FOOD: '요리/식품',
  STARTUP_SELF_DEVELOPMENT: '창업/자기계발',
  ENVIRONMENT_ENERGY: '환경/에너지',
  CONTENTS: '콘텐츠',
  SOCIAL_CONTRIBUTION_EXCHANGE: '사회공헌/교류',
  DISTRIBUTION_LOGISTICS: '유통/물류',
  PLANNING_IDEA: '기획/아이디어',
  ETC: '기타',
};

// 백엔드가 목록/상세 조회 시 항목별로 bookmarked를 내려주므로,
// 별도로 북마크 ID 목록을 받아와 클라이언트에서 매칭할 필요 없음.
export type EventItem = {
  id: number;
  title: string;
  category: EventCategory;
  field: EventField | null;
  fieldLabel: string | null;
  organizer: string;
  description: string | null;
  summarizedDescription: string | null;
  detailUrl: string;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  recommendedTargets: string | null;
  targetSchool: string | null;
  bookmarked: boolean;
};

export type EventRegisterPayload = {
  category: EventCategory;
  title: string;
  field: EventField;
  description?: string;
  imageUrl?: string;
  detailUrl?: string;
  startDate?: string;
  endDate?: string;
  organizer?: string;
  targetSchool?: string;
  summarizedDescription?: string;
  recommendedTargets?: string;
  externalId?: string;
};

export type EventExtractionDraft = {
  category: EventCategory;
  field: EventField;
  title: string;
  description: string | null;
  imageUrl: string | null;
  detailUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  organizer: string | null;
  targetSchool: string | null;
  summarizedDescription: string | null;
  recommendedTargets: string | null;
};

export function computeDDay(endDate: string): string {
  const end = new Date(`${endDate}T23:59:59`);
  const now = new Date();
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return '마감';
  if (diffDays === 0) return 'D-DAY';
  return `D-${diffDays}`;
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${startDate.replaceAll('-', '.')}-${endDate.replaceAll('-', '.')}`;
}

export async function fetchEvents(category: EventCategory, signal?: AbortSignal): Promise<EventItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/events?category=${category}`, {
    headers: await optionalAuthHeader(),
    signal,
  });

  const text = await response.text();
  const result: ApiResponse<EventItem[]> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `공모전 목록 조회 실패: ${response.status}`);
  }

  return result.data;
}

export type EventSearchParams = {
  keyword?: string;
  school?: string;
  field?: EventField;
  category?: EventCategory;
  page?: number;
  size?: number;
};

export async function searchEvents(params: EventSearchParams, signal?: AbortSignal): Promise<EventItem[]> {
  const query = new URLSearchParams();
  if (params.keyword && params.keyword !== '전체') query.set('keyword', params.keyword);
  if (params.school && params.school !== '전체') query.set('school', params.school);
  if (params.field) query.set('field', params.field);
  if (params.category) query.set('category', params.category);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));

  const response = await fetch(`${API_BASE_URL}/api/events/search?${query.toString()}`, {
    headers: await optionalAuthHeader(),
    signal,
  });

  const text = await response.text();
  const result: ApiResponse<EventItem[]> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `활동 검색 실패: ${response.status}`);
  }

  return result.data;
}

// searchEvents는 page/size 기반이라 한 번 호출로는 최대 100개(상한)까지만 온다.
// 전체 목록이 100개를 넘을 수도 있으니, 반환 길이가 size보다 작아질 때까지 순회해서 다 모은다.
export async function searchAllEvents(
  params: Omit<EventSearchParams, 'page' | 'size'>,
  signal?: AbortSignal
): Promise<EventItem[]> {
  const size = 100;
  const all: EventItem[] = [];
  let page = 0;

  while (true) {
    const batch = await searchEvents({ ...params, page, size }, signal);
    all.push(...batch);
    if (batch.length < size) break;
    page += 1;
  }

  return all;
}

export async function createEvent(payload: EventRegisterPayload): Promise<EventItem> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const result: ApiResponse<EventItem> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `활동 등록 실패: ${response.status}`);
  }

  return result.data;
}

export async function fetchRecommendedEvents(signal?: AbortSignal): Promise<EventItem[]> {
  // TODO: 백엔드 휴리스틱 추천 API 나오면 아래 임시 로직 제거 (/api/event/recommended deprecated)
  const categories: EventCategory[] = ['CONTEST', 'EXTERNAL'];
  const results = await Promise.all(
    categories.map((category) => fetchEvents(category, signal).catch(() => []))
  );
  const all = results.flat();
  const unique = Array.from(new Map(all.map((event) => [event.id, event])).values());

  return unique
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 3);
}

export async function bookmarkEvent(eventId: number): Promise<void> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/bookmarks/events/${eventId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await response.text();
  const result: ApiResponse<null> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `북마크 등록 실패: ${response.status}`);
  }
}

export async function unbookmarkEvent(eventId: number): Promise<void> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/bookmarks/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await response.text();
  const result: ApiResponse<null> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `북마크 해제 실패: ${response.status}`);
  }
}

export type FetchBookmarkedEventsParams = {
  page?: number;
  size?: number;
};

// "내 북마크" 페이지 전용 (실제 데이터가 필요할 때)
export async function fetchBookmarkedEvents(
  params?: FetchBookmarkedEventsParams,
  signal?: AbortSignal
): Promise<EventItem[]> {
  const accessToken = await getAccessToken();

  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.size !== undefined) query.set('size', String(params.size));

  const response = await fetch(`${API_BASE_URL}/api/bookmarks/events?${query.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });

  const text = await response.text();
  const result: ApiResponse<EventItem[]> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `북마크 목록 조회 실패: ${response.status}`);
  }

  return result.data;
}

export async function fetchEventDetail(id: number, signal?: AbortSignal): Promise<EventItem> {
  const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
    headers: await optionalAuthHeader(),
    signal,
  });

  const text = await response.text();
  const result: ApiResponse<EventItem> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `활동 상세 조회 실패: ${response.status}`);
  }

  return result.data;
}

// 웹에서는 <input type="file"> onChange로 받은 브라우저 기본 File을 그대로 넘기면 됨
export async function extractEventImage(
  image: File,
  signal?: AbortSignal
): Promise<EventExtractionDraft> {
  const accessToken = await getAccessToken();

  const formData = new FormData();
  formData.append('image', image, image.name);

  const response = await fetch(`${API_BASE_URL}/api/events/extract-image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
    signal,
  });

  if (response.status === 413) {
    throw new Error('이미지 용량이 너무 커요. 1MB 이하로 줄여서 다시 시도해주세요.');
  }

  const text = await response.text();

  let result: ApiResponse<EventExtractionDraft> | null = null;
  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`이미지 분석 중 오류가 발생했어요. (status: ${response.status})`);
  }

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `이미지 추출 실패: ${response.status}`);
  }

  return result.data;
}