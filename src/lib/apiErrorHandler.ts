// apiErrorHandler.ts
import { ApiResponse } from "../api/auth";
import {
  UnauthorizedError,
  AiServerUnavailableError,
  AiServerError,
  InternalServerError,
} from "./error";

export async function parseApiResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  if (response.status === 403) {
    throw new UnauthorizedError();
  }

  const text = await response.text();
  const result: ApiResponse<T> | null = text ? JSON.parse(text) : null;
  const message = result?.message || `${fallbackMessage}: ${response.status}`;

  if (!response.ok || !result?.success) {
    if (response.status === 502) throw new AiServerError(message);
    if (response.status === 503) throw new AiServerUnavailableError(message);
    if (response.status === 500) throw new InternalServerError(message);

    throw { status: response.status, message, result } as ApiErrorPayload<T>;
  }

  return result!.data;
}

export type ApiErrorPayload<T> = {
  status: number;
  message: string;
  result: ApiResponse<T> | null;
};

// ★ 추가: 타입가드 함수
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