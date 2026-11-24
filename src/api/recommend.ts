import { requestJson, type JsonResult } from "../lib/apiClient";
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

function throwMapped(result: JsonResult<unknown>, map: (status: number, message: string) => Error | null): never {
  throw map(result.status, result.message) ?? new Error(result.message);
}

export async function getRecommendedUsers(params: GetRecommendedUsersParams) {
  const query = new URLSearchParams();
  query.set('teamId', String(params.teamId));
  if (params.limit !== undefined) query.set('limit', String(params.limit));

  const result = await requestJson<UserRecommendation[]>(
    `/api/matching/recommendations/team-to-user?${query.toString()}`,
    { fallbackMessage: '유저 추천 조회 실패' },
  );
  if (!result.success || !result.data) {
    throwMapped(result, (status, message) => {
      if (status !== 400) return null;
      if (matchTeamEmbeddingNotReady(message)) return new TeamEmbeddingNotReadyError(message);
      if (matchMatchingIntentRequired(message)) return new MatchingIntentRequiredError(message);
      if (matchForbiddenAccess(message)) return new ForbiddenAccessError(message);
      if (matchResourceNotFound(message)) return new ResourceNotFoundError(message);
      return null;
    });
  }
  return result.data;
}

export async function getRecommendedTeams(params?: GetRecommendedTeamsParams) {
  const query = new URLSearchParams();
  if (params?.eventId !== undefined) query.set('eventId', String(params.eventId));
  if (params?.limit !== undefined) query.set('limit', String(params.limit));
  const queryString = query.toString();

  const result = await requestJson<TeamRecommendation[]>(
    `/api/matching/recommendations/user-to-team${queryString ? `?${queryString}` : ''}`,
    { fallbackMessage: '팀 추천 조회 실패' },
  );
  if (!result.success || !result.data) {
    throwMapped(result, (status, message) => {
      if (status === 400 && matchMatchingIntentRequired(message)) return new MatchingIntentRequiredError(message);
      return null;
    });
  }
  return result.data;
}

export async function getUserRecommendationReason(
  params: GetUserRecommendationReasonParams
): Promise<string> {
  const result = await requestJson<{ reason: string }>(
    '/api/matching/recommendations/reason/team-to-user',
    {
      method: 'POST',
      json: { teamId: params.teamId, userId: params.userId },
      fallbackMessage: '추천 상세 이유 조회 실패',
    },
  );
  if (!result.success || !result.data) {
    throwMapped(result, (status, message) => {
      if (status === 400 && matchForbiddenAccess(message)) return new ForbiddenAccessError(message);
      if (status === 400 && matchMatchingIntentRequired(message)) return new MatchingIntentRequiredError(message);
      if (status === 400 && matchResourceNotFound(message)) return new ResourceNotFoundError(message);
      if (status === 404 && matchRecommendationNotFound(message)) return new RecommendationNotFoundError(message);
      return null;
    });
  }
  return result.data.reason;
}

export async function getUserToTeamRecommendationReason(
  params: GetUserToTeamRecommendationReasonParams
): Promise<string> {
  const result = await requestJson<{ reason: string }>(
    '/api/matching/recommendations/reason/user-to-team',
    {
      method: 'POST',
      json: { teamId: params.teamId },
      fallbackMessage: '추천 상세 이유 조회 실패',
    },
  );
  if (!result.success || !result.data) {
    throwMapped(result, (status, message) => {
      if (status === 400 && matchMatchingIntentRequired(message)) return new MatchingIntentRequiredError(message);
      if (status === 400 && matchResourceNotFound(message)) return new ResourceNotFoundError(message);
      if (status === 404 && matchRecommendationNotFound(message)) return new RecommendationNotFoundError(message);
      return null;
    });
  }
  return result.data.reason;
}
