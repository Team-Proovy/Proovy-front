/**
 * Sort options for notes list
 */

export type SortOrder = "lastUsedAt,desc" | "createdAt,desc" | "title,asc";

export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "lastUsedAt,desc", label: "최근 사용 순" },
  { value: "createdAt,desc", label: "최신 생성 순" },
  { value: "title,asc", label: "이름 순" },
];
