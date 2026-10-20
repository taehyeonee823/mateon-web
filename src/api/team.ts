import type { ApiResponse } from "../types/api"
import { getAccessToken } from "./tokenStorage";
import { TeamDetail, TeamPost, TeamRequestPayload } from "../types/team";
import { 
  MatchingIntentRequiredError, 
  AiServerError, 
  OfferAlreadyRespondedError, 
  OfferForbiddenError,
  ProposalNotFoundError,
  TeamRecruitmentClosedError,
 } from "../lib/error";
import { Application } from "../types/team";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export type TeamApplicationRequest = {
  introduction?: string;
  message: string;
  contactNumber: string;
  portfolioUrl?: string;
};


async function authenticatedFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await response.text();
  let result: ApiResponse<T> | null = null;

  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      // JSON 파싱 실패 시 (502 HTML 에러 등)
      throw new Error(`서버 응답 오류가 발생했습니다. (${response.status})`);
    }
  }

  if (!response.ok || !result?.success) {
    const message = result?.message || `요청 실패: ${response.status}`;

    // 커스텀 에러 분류
    if (response.status === 400 && (message.includes('MATCHING_INTENT_REQUIRED') || message.includes('매칭 의도'))) {
      throw new MatchingIntentRequiredError(message);
    }
    if (
      response.status === 404 &&
      (message.includes('RECOMMENDATION_NOT_FOUND') || message.includes('RESOURCE_NOT_FOUND'))
    ) {
      throw new ProposalNotFoundError(message);
    }
    if (response.status === 502 || response.status === 503 || message.includes('AI_SERVER')) {
      throw new AiServerError(message);
    }
    // 역제안 관련 에러 분류
    if (response.status === 400 && message.includes('OFFER_ALREADY_RESPONDED')) {
      throw new OfferAlreadyRespondedError(message);
    }
    if (response.status === 400 && message.includes('SCHOOL_NOT_VERIFIED')) {
      throw new SchoolNotVerifiedError(message);
    }
    if (response.status === 400 && message.includes('TEAM_RECRUITMENT_CLOSED')) {
      throw new TeamRecruitmentClosedError(message);
    }
    if (response.status === 403 && message.includes('FORBIDDEN_ACCESS')) {
      throw new OfferForbiddenError(message);
    }
    throw new Error(message);
  }
  return result;
}

export class SchoolNotVerifiedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchoolNotVerifiedError';
  }
}

export class ResourceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceNotFoundError';
  }
}

export class ForbiddenAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenAccessError';
  }
}

// ── API 함수 목록 ──────────────────────────────

// 1. 팀 모집글 상세 조회
export async function getTeamDetail(teamId: number) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await response.text();
  const result: ApiResponse<TeamDetail> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `팀 상세 조회 실패: ${response.status}`);
  }

  return result.data;
}


// 2. 내가 리더로 모집한(작성한) 팀 목록 — myPosts=true로 리더 소유 게시글만 필터링
export async function getMyTeams(signal?: AbortSignal): Promise<TeamPost[]> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams?myPosts=true`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });

  const text = await response.text();
  const result: ApiResponse<TeamPost[]> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `모집한 팀 조회 실패: ${response.status}`);
  }

  console.log('[getMyTeams]', text);

  return result.data;
}

// 3. 팀 모집글 작성
export async function createTeamRecruitment(payload: TeamRequestPayload) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const result: ApiResponse<TeamDetail> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    const message = result?.message || `팀 모집글 등록 실패: ${response.status}`;

    if (message.includes('SCHOOL_NOT_VERIFIED')) {
      throw new SchoolNotVerifiedError(message);
    }

    throw new Error(message);
  }

  return result.data;
}

// 4. 팀 모집글 수정
export async function updateTeamRecruitment(
  teamId: number,
  payload: TeamRequestPayload
): Promise<TeamDetail> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const result: ApiResponse<TeamDetail> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    const message = result?.message || `팀 모집글 수정 실패: ${response.status}`;

    if (response.status === 403 && message.includes('FORBIDDEN_ACCESS')) {
      throw new ForbiddenAccessError(message);
    }
    if (response.status === 404) {
      throw new ResourceNotFoundError(message);
    }

    throw new Error(message);
  }

  return result.data;
}

// 5. 팀 모집글 삭제
export async function deleteTeam(teamId: number): Promise<void> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await response.text();
  const result: ApiResponse<null> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    const message = result?.message || `팀 모집글 삭제 실패: ${response.status}`;

    if (response.status === 403 && message.includes('FORBIDDEN_ACCESS')) {
      throw new ForbiddenAccessError(message);
    }
    if (response.status === 404) {
      throw new ResourceNotFoundError(message);
    }

    throw new Error(message);
  }
}

// 6. 내 팀에 온 지원서 목록 (팀장용)
export async function getTeamApplications(teamId: number) {
  const result = await authenticatedFetch<Application[]>(
    `/api/teams/${teamId}/applications`
  );
  return result.data;
}

// 7. 지원서 승인/거절 (팀장용)
export async function respondToApplication(applicationId: number, isApproved: boolean) {
  const result = await authenticatedFetch<null>(
    `/api/teams/applications/${applicationId}?isApproved=${isApproved}`,
    {
      method: 'PATCH',
    }
  );
  return result.message;
}

// 8. 팀 모집글 목록 조회 (로그인 불필요, 필터는 myPosts > eventId > category 순으로 하나만 적용)
export async function getTeams(
  params: { myPosts?: boolean; eventId?: number; category?: string } = {},
  signal?: AbortSignal
): Promise<TeamPost[]> {
  const query = new URLSearchParams();
  if (params.myPosts) query.set('myPosts', 'true');
  else if (params.eventId != null) query.set('eventId', String(params.eventId));
  else if (params.category) query.set('category', params.category);

  // 비로그인도 조회 가능하므로 토큰이 있을 때만 헤더에 붙임
  const accessToken = await getAccessToken();
  const qs = query.toString();

  const response = await fetch(`${API_BASE_URL}/api/teams${qs ? `?${qs}` : ''}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    signal,
  });

  const text = await response.text();
  let result: ApiResponse<TeamPost[]> | null = null;
  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(`서버 응답 오류가 발생했습니다. (${response.status})`);
    }
  }

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `팀 목록 조회 실패: ${response.status}`);
  }
  return result.data;
}

// 2. 지원서 제출
export async function submitTeamApplication(
  teamId: number,
  body: TeamApplicationRequest
) {
  const result = await authenticatedFetch<{ applicationId: number }>(
    `/api/teams/${teamId}/apply`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
  return result.data;
}
