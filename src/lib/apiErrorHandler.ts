import { ApiResponse } from "../api/auth";
import {
  UnauthorizedError,
  NetworkError,
  MalformedResponseError,
  AiServerUnavailableError,
  AiServerError,
  InternalServerError,
} from "./error";

// fetch 자체를 감싸서 네트워크 레벨 실패를 별도 에러로 통일
export async function safeFetch(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    // DNS 실패, 오프라인, CORS 등 - 서버에 도달조차 못한 경우
    throw new NetworkError();
  }
}

export async function parseApiResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  if (response.status === 403) {
    throw new UnauthorizedError();
  }

  const text = await response.text();

  let result: ApiResponse<T> | null = null;
  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      throw new MalformedResponseError(`${fallbackMessage}: 응답 형식 오류 (${response.status})`);
    }
  }

  const message = result?.message || `${fallbackMessage}: ${response.status}`;

  // response.ok부터 먼저 체크 (2xx가 아니면 무조건 에러)
  if (!response.ok) {
    if (response.status === 502) throw new AiServerError(message);
    if (response.status === 503) throw new AiServerUnavailableError(message);
    if (response.status === 500) throw new InternalServerError(message);

    throw { status: response.status, message, result } as ApiErrorPayload<T>;
  }

  // 여기 도달했으면 2xx인데, success:false로 오는 이상 케이스 대비
  if (!result?.success) {
    throw new MalformedResponseError(`${fallbackMessage}: 정상 응답이나 데이터 형식이 올바르지 않습니다.`);
  }

  return result.data;
}

export type ApiErrorPayload<T> = {
  status: number;
  message: string;
  result: ApiResponse<T> | null;
};

export function isApiErrorPayload<T = unknown>(
  e: unknown
): e is ApiErrorPayload<T> {
  return (
    typeof e === 'object' &&
    e !== null &&
    'status' in e &&
    'message' in e
  );
}