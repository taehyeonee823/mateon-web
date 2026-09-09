// ── 공통 에러 ──
export class UnauthorizedError extends Error {
  constructor(message = '로그인이 필요합니다. 토큰이 없거나 만료되었거나 형식이 올바르지 않습니다.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
export class AiServerUnavailableError extends Error {
  constructor(message: string) { super(message); this.name = 'AiServerUnavailableError'; }
}
export class AiServerError extends Error {
  constructor(message: string) { super(message); this.name = 'AiServerError'; }
}
export class InternalServerError extends Error {
  constructor(message: string) { super(message); this.name = 'InternalServerError'; }
}

// ── 도메인(비즈니스 로직) 에러 ──
export class MatchingIntentRequiredError extends Error {
  constructor(message: string) { super(message); this.name = 'MatchingIntentRequiredError'; }
}
export class TeamEmbeddingNotReadyError extends Error {
  constructor(message: string) { super(message); this.name = 'TeamEmbeddingNotReadyError'; }
}
export class ForbiddenAccessError extends Error {
  constructor(message: string) { super(message); this.name = 'ForbiddenAccessError'; }
}
export class ResourceNotFoundError extends Error {
  constructor(message: string) { super(message); this.name = 'ResourceNotFoundError'; }
}
export class RecommendationNotFoundError extends Error {
  constructor(message: string) { super(message); this.name = 'RecommendationNotFoundError'; }
}
export class SchoolNotVerifiedError extends Error {
  constructor(message: string) { super(message); this.name = 'SchoolNotVerifiedError'; }
}
export class TeamRecruitmentClosedError extends Error {
  constructor(message: string) { super(message); this.name = 'TeamRecruitmentClosedError'; }
}
export class InvalidInputError extends Error {
  constructor(message: string) { super(message); this.name = 'InvalidInputError'; }
}
export class DuplicateResourceError extends Error {
  constructor(message: string) { super(message); this.name = 'DuplicateResourceError'; }
}