/**
 * 자산(Asset) 관련 유틸리티 함수
 *
 * 백엔드 API 응답을 프론트엔드 컴포넌트에서 사용하기 쉽게 변환
 */

import type { AssetSummaryDto } from "../api/assets_types";

/**
 * 파일 출처 타입
 * - upload: 사용자가 직접 업로드한 파일
 * - ai_generated: AI가 생성한 파일
 */
export type AssetSourceType = "upload" | "ai";

/**
 * 파일 카테고리 타입
 * - document: 문서 (PDF 등)
 * - image: 이미지 (PNG, JPEG, WEBP 등)
 */
export type AssetCategoryType = "document" | "image";

/**
 * OCR 처리 상태
 */
export type OcrStatusType = "pending" | "processing" | "completed" | "failed";

/**
 * NoteCard 컴포넌트에서 사용할 자산 정보
 */
export interface AssetCardInfo {
  assetId: number;
  fileName: string;
  fileSize: number;
  sourceType: AssetSourceType;
  category: AssetCategoryType;
  ocrStatus: OcrStatusType;
  thumbnailUrl: string | null;
  mimeType: string;
  createdAt: string;
}

/**
 * 백엔드 source 값을 프론트엔드 타입으로 매핑
 *
 * @param source - 백엔드 API의 source 값 ("upload" | "ai_generated")
 * @returns AssetSourceType ("upload" | "ai")
 */
export const mapAssetSource = (source: string): AssetSourceType => {
  return source === "ai_generated" ? "ai" : "upload";
};

/**
 * 파일 카테고리 매핑
 *
 * @param category - 백엔드 API의 fileCategory 값
 * @returns AssetCategoryType
 */
export const mapAssetCategory = (category: string): AssetCategoryType => {
  return category === "image" ? "image" : "document";
};

/**
 * OCR 상태 매핑
 *
 * @param status - 백엔드 API의 ocrStatus 값
 * @returns OcrStatusType
 */
export const mapOcrStatus = (status: string): OcrStatusType => {
  const validStatuses: OcrStatusType[] = [
    "pending",
    "processing",
    "completed",
    "failed",
  ];
  return validStatuses.includes(status as OcrStatusType)
    ? (status as OcrStatusType)
    : "pending";
};

/**
 * AssetSummaryDto를 AssetCardInfo로 변환
 *
 * 백엔드 API 응답을 프론트엔드 컴포넌트에서 사용하기 쉬운 형태로 변환
 *
 * @param asset - 백엔드 API의 AssetSummaryDto
 * @returns AssetCardInfo
 */
export const mapAssetToCardInfo = (asset: AssetSummaryDto): AssetCardInfo => {
  return {
    assetId: asset.assetId,
    fileName: asset.fileName,
    fileSize: asset.fileSize,
    sourceType: mapAssetSource(asset.source),
    category: mapAssetCategory(asset.fileCategory),
    ocrStatus: mapOcrStatus(asset.ocrStatus),
    thumbnailUrl: asset.thumbnailUrl,
    mimeType: asset.mimeType,
    createdAt: asset.createdAt,
  };
};

/**
 * 파일 크기를 사람이 읽기 쉬운 형식으로 변환
 *
 * @param bytes - 바이트 단위 파일 크기
 * @returns 포맷팅된 문자열 (예: "1.5MB", "120KB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))}${sizes[i]}`;
};

/**
 * 배지 색상 가져오기
 *
 * @param sourceType - 파일 출처 타입
 * @returns 배지 배경색 (HEX)
 */
export const getBadgeColor = (sourceType: AssetSourceType): string => {
  return sourceType === "upload" ? "#003880" : "#E2A242";
};

/**
 * 배지 텍스트 가져오기
 *
 * @param sourceType - 파일 출처 타입
 * @returns 배지 표시 텍스트
 */
export const getBadgeText = (sourceType: AssetSourceType): string => {
  return sourceType === "upload" ? "업로드" : "AI 생성";
};
