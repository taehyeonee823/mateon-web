export type TeamMember = {
  userId: number;
  major: string;
  name: string;
  isLeader: boolean;
}

export type TeamRecommendation = {
  teamId: number;
  title: string;
  role: string[];
  requiredSkills: string[] | null;
  promotionText: string;
  characteristic: string;
  capacity: number;
  currentMemberCount: number;
  eventId: number | null;
  connectedActivityTitle: string | null;
  connectedActivitySummary: string | null;
  leaderId: number;
  recruitmentEndDate: string;
  score: number;
  label: string;
};

export type GetRecommendedTeamsParams = {
  eventId?: number;
  limit?: number;
};

export type GetRecommendedUsersParams = {
  teamId: number;
  limit?: number;
};

export type UserRecommendation = {
  userId: number;
  name: string;
  school: string;
  college?: string;
  major: string;
  grade: string;
  tagline: string;
  desiredRoles: string[];
  skills: string[];
  experienceLevel: string;
  activityStyle: string;
  collaborationTemperature: number | null;
  score: number;
  label: string;
  members: TeamMember[];

};

export type GetUserRecommendationReasonParams = {
  teamId: number;
  userId: number;
};

export type GetUserToTeamRecommendationReasonParams = {
  teamId: number;
};