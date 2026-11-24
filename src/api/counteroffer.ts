import { requestJson } from '../lib/apiClient'
import { SchoolNotVerifiedError, ForbiddenAccessError, ResourceNotFoundError } from './team';
import { OfferAlreadyRespondedError, TeamRecruitmentClosedError, InvalidInputError, DuplicateResourceError } from '../lib/error';
import { TeamOfferResponseDTO } from '../types/team';

type CreateTeamOfferParams = {
  teamId: number;
  userId: number;
  message?: string;
};

// 1. 이 팀이 보낸 제안 목록(팀장용)
export async function getTeamOffers(teamId: number): Promise<TeamOfferResponseDTO[]> {
  const result = await requestJson<TeamOfferResponseDTO[]>(`/api/teams/${teamId}/offers`, {
    fallbackMessage: '보낸 제안 목록 조회 실패',
  });

  if (!result.success || !result.data) {
    if (result.status === 403 && result.message.includes('FORBIDDEN_ACCESS')) {
      throw new ForbiddenAccessError(result.message);
    }
    throw new Error(result.message);
  }

  return result.data;
}

// 2. 보낸 제안 회수 (팀장용)
export async function cancelTeamOffer(offerId: number): Promise<void> {
  const result = await requestJson<null>(`/api/teams/offers/${offerId}`, {
    method: 'DELETE',
    fallbackMessage: '제안 취소 실패',
  });

  if (!result.success) {
    if (result.status === 400 && result.message.includes('OFFER_ALREADY_RESPONDED')) {
      throw new OfferAlreadyRespondedError(result.message);
    }
    if (result.status === 403 && result.message.includes('FORBIDDEN_ACCESS')) {
      throw new ForbiddenAccessError(result.message);
    }
    if (result.status === 404) throw new ResourceNotFoundError(result.message);
    throw new Error(result.message);
  }
}

// 3. 유저에게 제안 발송(팀장용)
export async function createTeamOffer(
  params: CreateTeamOfferParams
): Promise<TeamOfferResponseDTO> {
  const result = await requestJson<TeamOfferResponseDTO>(`/api/teams/${params.teamId}/offers`, {
    method: 'POST',
    json: { userId: params.userId, message: params.message },
    fallbackMessage: '팀 제안 발송 실패',
  });

  if (!result.success || !result.data) {
    if (result.status === 400) {
      if (result.message.includes('SCHOOL_NOT_VERIFIED')) throw new SchoolNotVerifiedError(result.message);
      if (result.message.includes('TEAM_RECRUITMENT_CLOSED')) throw new TeamRecruitmentClosedError(result.message);
      if (result.message.includes('INVALID_INPUT')) throw new InvalidInputError(result.message);
      if (result.message.includes('DUPLICATE_RESOURCE')) throw new DuplicateResourceError(result.message);
    }
    if (result.status === 403 && result.message.includes('FORBIDDEN_ACCESS')) {
      throw new ForbiddenAccessError(result.message);
    }
    if (result.status === 404) throw new ResourceNotFoundError(result.message);
    throw new Error(result.message);
  }

  return result.data;
}
