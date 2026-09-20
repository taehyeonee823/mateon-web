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