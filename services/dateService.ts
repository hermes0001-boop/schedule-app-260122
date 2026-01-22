
/**
 * 사용자의 지역 시간대(Local Time)를 기준으로 YYYY-MM-DD 형식의 날짜 문자열을 반환합니다.
 * toISOString()의 UTC 시간차 문제를 해결합니다.
 */
export const getTodayStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 특정 날짜 객체로부터 YYYY-MM-DD 문자열을 생성합니다.
 */
export const formatDateToKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
