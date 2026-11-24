import type { ApiResponse } from "./auth";
import { requestJson, type JsonResult } from "../lib/apiClient";
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

export type TeamApplicationRequest = {
  introduction?: string;
  message: string;
  contactNumber: string;
  portfolioUrl?: string;
};

function throwTeamError(result: JsonResult<unknown>): never {
  const message = result.message;
  if (result.status === 400 && (message.includes('MATCHING_INTENT_REQUIRED') || message.includes('매칭 의도'))) {
    throw new MatchingIntentRequiredError(message);
  }
  if (
    result.status === 404 &&
    (message.includes('RECOMMENDATION_NOT_FOUND') || message.includes('RESOURCE_NOT_FOUND'))
  ) {
    throw new ProposalNotFoundError(message);
  }
  if (result.status === 502 || result.status === 503 || message.includes('AI_SERVER')) {
    throw new AiServerError(message);
  }
  if (result.status === 400 && message.includes('OFFER_ALREADY_RESPONDED')) {
    throw new OfferAlreadyRespondedError(message);
  }
  if (result.status === 400 && message.includes('SCHOOL_NOT_VERIFIED')) {
    throw new SchoolNotVerifiedError(message);
  }
  if (result.status === 400 && message.includes('TEAM_RECRUITMENT_CLOSED')) {
    throw new TeamRecruitmentClosedError(message);
  }
  if (result.status === 403 && message.includes('FORBIDDEN_ACCESS')) {
    throw new OfferForbiddenError(message);
  }
  throw new Error(message);
}

async function authenticatedFetch<T>(
  endpoint: string,
  options: { method?: string; json?: unknown } = {}
): Promise<ApiResponse<T>> {
  const result = await requestJson<T>(endpoint, {
    method: options.method,
    json: options.json,
    fallbackMessage: '요청 실패',
  });
  if (!result.success) throwTeamError(result);
  return { success: true, message: result.message, data: result.data as T };
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
  const result = await requestJson<TeamDetail>(`/api/teams/${teamId}`, {
    fallbackMessage: '팀 상세 조회 실패',
  });
  if (!result.success || !result.data) throw new Error(result.message);
  return result.data;
}


// 2. 내가 리더로 모집한(작성한) 팀 목록 — myPosts=true로 리더 소유 게시글만 필터링
export async function getMyTeams(signal?: AbortSignal): Promise<TeamPost[]> {
  const result = await requestJson<TeamPost[]>('/api/teams?myPosts=true', {
    signal,
    fallbackMessage: '모집한 팀 조회 실패',
  });
  if (!result.success || !result.data) throw new Error(result.message);
  return result.data;
}

// 3. 팀 모집글 작성
export async function createTeamRecruitment(payload: TeamRequestPayload) {
  const result = await requestJson<TeamDetail>('/api/teams', {
    method: 'POST',
    json: payload,
    fallbackMessage: '팀 모집글 등록 실패',
  });
  if (!result.success || !result.data) {
    if (result.message.includes('SCHOOL_NOT_VERIFIED')) throw new SchoolNotVerifiedError(result.message);
    throw new Error(result.message);
  }
  return result.data;
}

// 4. 팀 모집글 수정
export async function updateTeamRecruitment(
  teamId: number,
  payload: TeamRequestPayload
): Promise<TeamDetail> {
  const result = await requestJson<TeamDetail>(`/api/teams/${teamId}`, {
    method: 'PUT',
    json: payload,
    fallbackMessage: '팀 모집글 수정 실패',
  });
  if (!result.success || !result.data) {
    if (result.status === 403 && result.message.includes('FORBIDDEN_ACCESS')) {
      throw new ForbiddenAccessError(result.message);
    }
    if (result.status === 404) throw new ResourceNotFoundError(result.message);
    throw new Error(result.message);
  }
  return result.data;
}

// 5. 팀 모집글 삭제
export async function deleteTeam(teamId: number): Promise<void> {
  const result = await requestJson<null>(`/api/teams/${teamId}`, {
    method: 'DELETE',
    fallbackMessage: '팀 모집글 삭제 실패',
  });
  if (!result.success) {
    if (result.status === 403 && result.message.includes('FORBIDDEN_ACCESS')) {
      throw new ForbiddenAccessError(result.message);
    }
    if (result.status === 404) throw new ResourceNotFoundError(result.message);
    throw new Error(result.message);
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
    { method: 'PATCH' }
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

  const qs = query.toString();
  const result = await requestJson<TeamPost[]>(`/api/teams${qs ? `?${qs}` : ''}`, {
    auth: 'optional',
    signal,
    fallbackMessage: '팀 목록 조회 실패',
  });
  if (!result.success || !result.data) throw new Error(result.message);
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
      json: body,
    }
  );
  return result.data;
}
