import type { ApiResponse } from '../types/api'
import { getAccessToken } from './tokenStorage'
import { SchoolNotVerifiedError, ForbiddenAccessError, ResourceNotFoundError } from './team';
import { OfferAlreadyRespondedError, TeamRecruitmentClosedError, InvalidInputError, DuplicateResourceError } from '../lib/error';
import { TeamOfferResponseDTO } from '../types/team';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

type CreateTeamOfferParams = {
  teamId: number;
  userId: number;
  message?: string;
};

// 1. 이 팀이 보낸 제안 목록(팀장용)
export async function getTeamOffers(teamId: number): Promise<TeamOfferResponseDTO[]> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/offers`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await response.text();
  const result: ApiResponse<TeamOfferResponseDTO[]> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    const message = result?.message || `보낸 제안 목록 조회 실패: ${response.status}`;

    if (response.status === 403 && message.includes('FORBIDDEN_ACCESS')) {
      throw new ForbiddenAccessError(message);
    }

    throw new Error(message);
  }

  return result.data;
}

// 2. 보낸 제안 회수 (팀장용) 
export async function cancelTeamOffer(offerId: number): Promise<void> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams/offers/${offerId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await response.text();
  const result: ApiResponse<null> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    const message = result?.message || `제안 취소 실패: ${response.status}`;

    if (response.status === 400 && message.includes('OFFER_ALREADY_RESPONDED')) {
      throw new OfferAlreadyRespondedError(message);
    }
    if (response.status === 403 && message.includes('FORBIDDEN_ACCESS')) {
      throw new ForbiddenAccessError(message);
    }
    if (response.status === 404) {
      throw new ResourceNotFoundError(message);
    }

    throw new Error(message);
  }
}

// 3. 유저에게 제안 발송(팀장용)
export async function createTeamOffer(
  params: CreateTeamOfferParams
): Promise<TeamOfferResponseDTO> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams/${params.teamId}/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ userId: params.userId, message: params.message }),
  });

  const text = await response.text();
  const result: ApiResponse<TeamOfferResponseDTO> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    const message = result?.message || `팀 제안 발송 실패: ${response.status}`;

    if (response.status === 400) {
      if (message.includes('SCHOOL_NOT_VERIFIED')) {
        throw new SchoolNotVerifiedError(message);
      }
      if (message.includes('TEAM_RECRUITMENT_CLOSED')) {
        throw new TeamRecruitmentClosedError(message);
      }
      if (message.includes('INVALID_INPUT')) {
        throw new InvalidInputError(message);
      }
      if (message.includes('DUPLICATE_RESOURCE')) {
        throw new DuplicateResourceError(message);
      }
    }
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

