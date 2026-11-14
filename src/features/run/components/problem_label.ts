/**
 * 문제 이름(Read-back과 단계 검산 공용). 번호가 있으면 "15번 문제", 없으면(텍스트 입력) 순서로 "문제 2".
 * 같은 문제가 두 곳에서 같은 이름으로 보이게 한 곳에서만 정한다.
 */
export const getProblemTitle = (
  problemNumber: string | null | undefined,
  index: number,
) => (problemNumber ? `${problemNumber}번 문제` : `문제 ${index + 1}`);
