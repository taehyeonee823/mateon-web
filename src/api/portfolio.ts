import type { ApiResponse } from '../types/api';
import { getAccessToken } from './tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type PortfolioSummary = {
  summary: string;
};

export async function summarizePortfolio(file: File): Promise<PortfolioSummary> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const formData = new FormData();
  formData.append('pdf_file', file, file.name);

  const response = await fetch(`${API_BASE_URL}/api/portfolios/summarize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  const text = await response.text();
  let result: ApiResponse<PortfolioSummary> | null;

  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`포트폴리오 요약 응답을 확인할 수 없습니다: ${response.status}`);
  }

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `포트폴리오 요약 실패: ${response.status}`);
  }

  return result.data;
}
