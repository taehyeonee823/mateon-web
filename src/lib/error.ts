// ── 공통 에러 ──
export class UnauthorizedError extends Error {
  constructor(message = '로그인이 필요합니다. 토큰이 없거나 만료되었거나 형식이 올바르지 않습니다.') {
    super(message);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
export class NetworkError extends Error {
  constructor(message = '네트워크 연결을 확인해주세요.') {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}
export class MalformedResponseError extends Error {
  constructor(message = '서버 응답을 처리할 수 없습니다.') {
    super(message);
    this.name = 'MalformedResponseError';
    Object.setPrototypeOf(this, MalformedResponseError.prototype);
  }
}
export class AiServerUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiServerUnavailableError';
    Object.setPrototypeOf(this, AiServerUnavailableError.prototype);
  }
}
export class AiServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiServerError';
    Object.setPrototypeOf(this, AiServerError.prototype);
  }
}
export class InternalServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InternalServerError';
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

// ── 도메인(비즈니스 로직) 에러 ──
export class MatchingIntentRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MatchingIntentRequiredError';
    Object.setPrototypeOf(this, MatchingIntentRequiredError.prototype);
  }
}
export class TeamEmbeddingNotReadyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TeamEmbeddingNotReadyError';
    Object.setPrototypeOf(this, TeamEmbeddingNotReadyError.prototype);
  }
}
export class ForbiddenAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenAccessError';
    Object.setPrototypeOf(this, ForbiddenAccessError.prototype);
  }
}
export class ResourceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceNotFoundError';
    Object.setPrototypeOf(this, ResourceNotFoundError.prototype);
  }
}
export class RecommendationNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecommendationNotFoundError';
    Object.setPrototypeOf(this, RecommendationNotFoundError.prototype);
  }
}