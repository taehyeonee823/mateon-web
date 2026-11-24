import { requestJson } from '../lib/apiClient';

export type PortfolioSummary = {
  summary: string;
};

export async function summarizePortfolio(file: File): Promise<PortfolioSummary> {
  const formData = new FormData();
  formData.append('pdf_file', file, file.name);

  const result = await requestJson<PortfolioSummary>('/api/portfolios/summarize', {
    method: 'POST',
    body: formData,
    fallbackMessage: '포트폴리오 요약 실패',
  });

  if (!result.success || !result.data) {
    throw new Error(result.message);
  }

  return result.data;
}
