import { getAccessToken } from "./tokenStorage";
import { safeFetch, parseApiResponse, isApiErrorPayload } from "../lib/apiErrorHandler";
import {
  MatchingIntentRequiredError,
  TeamEmbeddingNotReadyError,
  ForbiddenAccessError,
  ResourceNotFoundError,
  RecommendationNotFoundError
} from "../lib/error";
import {
  GetRecommendedTeamsParams,
  TeamRecommendation,
  GetRecommendedUsersParams,
  UserRecommendation,
  GetUserRecommendationReasonParams,
  GetUserToTeamRecommendationReasonParams
} from "../types/recommend";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 문자열 매칭으로 400 에러 분기
function matchTeamEmbeddingNotReady(message: string) {
  return message.includes('팀 정보 분석이 아직 완료되지');
}
function matchMatchingIntentRequired(message: string) {
  return message.includes('매칭 의도 추출을 완료');
}
function matchForbiddenAccess(message: string) {
  return message.includes('팀장만 호출할 수');
}
function matchResourceNotFound(message: string) {
  return message.includes('팀을 찾을 수 없습니다');
}
function matchRecommendationNotFound(message: string) {
  return message.includes('추천 이력을 찾을 수 없습니다');
}

// 1. 팀에 맞는 유저 추천(팀장 전용)
export async function getRecommendedUsers(params: GetRecommendedUsersParams) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const query = new URLSearchParams();
  query.set('teamId', String(params.teamId));
  if (params.limit !== undefined) query.set('limit', String(params.limit));

  const response = await safeFetch(
    `${API_BASE_URL}/api/matching/recommendations/team-to-user?${query.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  try {
    return await parseApiResponse<UserRecommendation[]>(response, '유저 추천 조회 실패');
  } catch (e) {
    if (isApiErrorPayload(e)) {
      const { status, message } = e;
      if (status === 400 && matchTeamEmbeddingNotReady(message)) {
        throw new TeamEmbeddingNotReadyError(message);
      }
      if (status === 400 && matchMatchingIntentRequired(message)) {
        throw new MatchingIntentRequiredError(message);
      }
      if (status === 400 && matchForbiddenAccess(message)) {
        throw new ForbiddenAccessError(message);
      }
      if (status === 400 && matchResourceNotFound(message)) {
        throw new ResourceNotFoundError(message);
      }
      throw new Error(message);
    }
    throw e;
  }
}

// 2. 지원할 만한 팀 추천
export async function getRecommendedTeams(params?: GetRecommendedTeamsParams) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const query = new URLSearchParams();
  if (params?.eventId !== undefined) query.set('eventId', String(params.eventId));
  if (params?.limit !== undefined) query.set('limit', String(params.limit));
  const queryString = query.toString();

  const response = await safeFetch(
    `${API_BASE_URL}/api/matching/recommendations/user-to-team${queryString ? `?${queryString}` : ''}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  try {
    return await parseApiResponse<TeamRecommendation[]>(response, '팀 추천 조회 실패');
  } catch (e) {
    if (isApiErrorPayload(e)) {
      const { status, message } = e;
      if (status === 400 && matchMatchingIntentRequired(message)) {
        throw new MatchingIntentRequiredError(message);
      }
      throw new Error(message);
    }
    throw e;
  }
}

// 3. 역제안으로 추천받은 유저의 상세 이유
export async function getUserRecommendationReason(
  params: GetUserRecommendationReasonParams
): Promise<string> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await safeFetch(
    `${API_BASE_URL}/api/matching/recommendations/reason/team-to-user`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ teamId: params.teamId, userId: params.userId }),
    }
  );

  try {
    const result = await parseApiResponse<{ reason: string }>(response, '추천 상세 이유 조회 실패');
    return result.reason;
  } catch (e) {
    if (isApiErrorPayload(e)) {
      const { status, message } = e;
      if (status === 400 && matchForbiddenAccess(message)) {
        throw new ForbiddenAccessError(message);
      }
      if (status === 400 && matchMatchingIntentRequired(message)) {
        throw new MatchingIntentRequiredError(message);
      }
      if (status === 400 && matchResourceNotFound(message)) {
        throw new ResourceNotFoundError(message);
      }
      if (status === 404 && matchRecommendationNotFound(message)) {
        throw new RecommendationNotFoundError(message);
      }
      throw new Error(message);
    }
    throw e;
  }
}

// 4. 추천받은 팀의 상세 이유
export async function getUserToTeamRecommendationReason(
  params: GetUserToTeamRecommendationReasonParams
): Promise<string> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await safeFetch(
    `${API_BASE_URL}/api/matching/recommendations/reason/user-to-team`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ teamId: params.teamId }),
    }
  );

  try {
    const result = await parseApiResponse<{ reason: string }>(response, '추천 상세 이유 조회 실패');
    return result.reason;
  } catch (e) {
    if (isApiErrorPayload(e)) {
      const { status, message } = e;
      if (status === 400 && matchMatchingIntentRequired(message)) {
        throw new MatchingIntentRequiredError(message);
      }
      if (status === 400 && matchResourceNotFound(message)) {
        throw new ResourceNotFoundError(message);
      }
      if (status === 404 && matchRecommendationNotFound(message)) {
        throw new RecommendationNotFoundError(message);
      }
      throw new Error(message);
    }
    throw e;
  }
}