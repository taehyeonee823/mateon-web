import type { ApiResponse } from "./auth";
import { getAccessToken } from "./tokenStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export type TeamMember = {
  userId: number;
  major: string;
  name: string;
  isLeader: boolean;
}

export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type TeamDetail = {
  id: number;
  title: string;
  role: string[];
  requiredSkills: string[];
  promotionText: string;
  characteristic: string;
  capacity: number;
  currentMemberCount: number;
  eventId: number | null;
  connectedActivityTitle: string | null;
  connectedActivitySummary: string | null;
  leaderId: number;
  leaderName: string;
  leaderEmail?: string;
  leaderCollege: string;
  leaderGrade: string;
  leaderMajor: string;
  leaderCollaborationTemperature: number | null;
  recruiting: boolean;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
  hasApplied: boolean;
  leader: boolean;
  members: TeamMember[];
  myApplicationStatus: ApplicationStatus | null;
};

export type TeamPost = {
  id: number;
  title: string;
  role: string[];
  requiredSkills: string[];
  promotionText: string;
  characteristic: string;
  capacity: number;
  currentMemberCount: number;
  eventId: number | null;
  connectedActivityTitle: string | null;
  recruiting: boolean;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
};

export type TeamRequestPayload = {
  eventId?: number;
  title: string;
  promotionText?: string;
  role: string[];
  characteristic?: string;
  requiredSkills?: string[];
  capacity: number;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
};

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
