import type { ApiResponse } from "@/shared/api/shared_types";

export type ToolIconType = "chart_line" | "file_text" | "copy_plus" | string;

export interface ToolDto {
  toolId: number;
  toolCode: string;
  name: string;
  description: string;
  iconType: ToolIconType;
  isActive: boolean;
  displayOrder: number;
}

export interface ToolListResult {
  tools: ToolDto[];
}

export interface ToolListParams {
  query?: string;
}

export type ToolListResponse = ApiResponse<ToolListResult>;
