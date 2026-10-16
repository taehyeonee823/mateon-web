export type TeamMember = {
  userId: number;
  major: string;
  name: string;
  isLeader: boolean;
}

export type ApplicationStatus = "PENDING" | "ACCEPTED" | "APPROVED" | "REJECTED";

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

export type TeamOfferResponseDTO = {
  offerId: number;
  teamId: number;
  teamTitle: string;
  promotionText: string;
  role: string[];
  requiredSkills: string[];
  capacity: number;
  eventId: number | null;
  leaderId: number;
  leaderName: string | null;
  targetUserId: number;
  targetUserName: string;
  targetUserSchool: string;
  targetUserMajor: string;
  message: string | null;
  aiScore: number | null;
  aiLabel: string | null;
  status: OfferStatus;
  createdAt: string;
  respondedAt: string | null;
};

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';

export type Application = {
  applicationId: number;
  teamId: number;
  teamTitle: string;
  applicant: UserProfile;
  introduction: string;
  message: string;
  contactNumber: string;
  portfolioUrl: string;
  isMine: boolean;
  status: ApplicationStatus;
  createdAt: string;
};

export type UserProfile = {
  id: number;
  email: string;
  schoolEmail: string | null;
  schoolVerified: boolean;
  name: string;
  campus: string | null;
  college: string | null;
  major: string | null;
  grade: string | null;
  interestJobPrimary: string | null;
  interestJobSecondary: string | null;
  interestJobTertiary: string | null;
  tagline: string | null;
  portfolio: string | null;
  profileImageUrl: string | null;
  collaborationTemperature: number | null;
  collaborationReviewCount: number;
  participatedActivities: ParticipatedActivity[];
};

export type ParticipatedActivity = {
  id: number;
  title: string;
  category: string;
};