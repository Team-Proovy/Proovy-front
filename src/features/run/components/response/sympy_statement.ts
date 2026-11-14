import type { SympyStatement } from "@/shared/contracts/browser_run_v1";

/**
 * 검산기가 확인한 식을 한 줄로 적는다(SymPy 문법 그대로, 계산하지 않는다).
 * 단계 종류별로 쓰는 필드: define name=value, given·case cond(+covers), claim lhs=rhs, choose value(+choice).
 */
export const formatSympyStatement = (
  statement: SympyStatement | null,
): string | null => {
  if (!statement) return null;
  const { name, value, cond, covers, lhs, rhs, choice } = statement;
  if (lhs && rhs) return `${name ? `${name} := ` : ""}${lhs} = ${rhs}`;
  if (cond) return covers ? `${cond}  (${covers})` : cond;
  if (value) {
    const head = name ? `${name} = ${value}` : value;
    return choice != null ? `${head}  → 보기 ${choice}` : head;
  }
  if (choice != null) return `보기 ${choice}`;
  return lhs ?? rhs ?? name ?? null;
};
