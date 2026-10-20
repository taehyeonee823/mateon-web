// 백엔드 공통 응답 래퍼로 실제 데이터는 data에 담김
export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}