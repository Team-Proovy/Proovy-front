import { LoadingSpinner } from "@/shared/components/loading-spinner";
import {
  StorageCheckboxUncheckedIcon,
  StorageCheckboxCheckedIcon,
} from "../../../shared/components/icons/StorageIcons";
import { PdfPreview } from "@/shared/components/pdf-preview/PdfPreview";
import {
  getBadgeColor,
  getBadgeText,
  type AssetSourceType,
  type AssetCategoryType,
  type OcrStatusType,
} from "../utils/asset-mapper";

import { useState, useEffect } from "react";
import { getDownloadUrl } from "@/features/assets/api/assetApi";

interface NoteCardProps {
  id: number; // Asset ID required for fetching download URL
  label: string; // 파일명
  type: AssetSourceType; // 파일 출처 ("upload" | "ai")
  isSelected: boolean;
  isSelectMode: boolean;
  onSelect: () => void;
  thumbnailUrl?: string | null; // 썸네일 URL (백엔드 제공)
  mimeType?: string;
  fileCategory?: AssetCategoryType;
  ocrStatus?: OcrStatusType;
  onClick?: () => void;
}

export const NoteCard = ({
  id,
  label,
  type,
  isSelected,
  isSelectMode,
  onSelect,
  thumbnailUrl,
  mimeType,
  ocrStatus = "completed",
  onClick,
}: NoteCardProps) => {
  // 파일 출처에 따른 배지 정보
  const badgeText = getBadgeText(type);
  const badgeColor = getBadgeColor(type);

  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
  const [hasThumbnailError, setHasThumbnailError] = useState(false);
  const [prevThumbnailUrl, setPrevThumbnailUrl] = useState(thumbnailUrl);

  if (thumbnailUrl !== prevThumbnailUrl) {
    setPrevThumbnailUrl(thumbnailUrl);
    setHasThumbnailError(false);
  }

  // 업로드된 PDF의 경우, 썸네일 URL이 깨질 수 있으므로 원본 다운로드 URL을 받아와서 미리보기를 띄운다.
  useEffect(() => {
    if (type === "upload" && mimeType === "application/pdf") {
      const fetchUrl = async () => {
        try {
          const response = await getDownloadUrl(id);
          setPdfDownloadUrl(response.result.downloadUrl);
        } catch (error) {
          console.error("PDF 다운로드 URL 조회 실패:", error);
        }
      };
      fetchUrl();
    }
  }, [id, type, mimeType]);

  // 썸네일 렌더링 로직
  const renderThumbnail = () => {
    // OCR 처리 중일 때
    if (ocrStatus === "pending" || ocrStatus === "processing") {
      return (
        <div className="flex flex-col items-center gap-2">
          <LoadingSpinner size={40} />
          <p className="text-[12px] font-medium text-blue-600">로딩 중...</p>
        </div>
      );
    }

    // AI 생성 PDF 파일인 경우 (thumbnailUrl이 곧 파일 URL임)
    if (type === "ai" && mimeType === "application/pdf" && thumbnailUrl) {
      return (
        <PdfPreview
          fileUrl={thumbnailUrl}
          width={160}
          className="flex h-full w-full overflow-hidden"
        />
      );
    }

    // 업로드된 PDF 파일인 경우 (별도로 가져온 downloadUrl 사용)
    if (type === "upload" && mimeType === "application/pdf" && pdfDownloadUrl) {
      return (
        <PdfPreview
          fileUrl={pdfDownloadUrl}
          width={160}
          className="flex h-full w-full overflow-hidden"
        />
      );
    }

    // 썸네일 URL이 있을 때 (이미지 등)
    if (thumbnailUrl && !hasThumbnailError) {
      return (
        <img
          src={thumbnailUrl}
          alt={label}
          className="h-full w-full object-contain"
          onError={() => {
            setHasThumbnailError(true);
          }}
        />
      );
    }

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="90"
        height="90"
        viewBox="0 0 90 90"
        fill="none"
      >
        <path
          d="M66.5387 27.3425V73.2069H23.4614V17.1465H44.1357L54.5434 35.0689L59.4473 27.8011L66.5387 27.3425Z"
          fill="url(#paint0_linear_432_11017)"
        />
        <path
          d="M54.3317 38.8084L60.2588 29.2827H66.5387V25.3666H57.9655L54.3317 31.2584L45.2646 16.7935H23.4614V20.6743H43.0067L54.3317 38.8084Z"
          fill="#2A6AFF"
        />
        <path
          d="M62.6224 41.4189H27.3774V44.947H62.6224V41.4189Z"
          fill="#2A6AFF"
        />
        <path
          d="M62.6224 51.2974H27.3774V54.8254H62.6224V51.2974Z"
          fill="#2A6AFF"
        />
        <path
          d="M45.6879 66.1504H27.3774V73.2064H45.6879V66.1504Z"
          fill="#2A6AFF"
        />
        <defs>
          <linearGradient
            id="paint0_linear_432_11017"
            x1="45"
            y1="17.1465"
            x2="45"
            y2="73.2069"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop
              offset="1"
              stopColor="#2A6AFF"
              stopOpacity="0.5"
            />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div
      onClick={() => (isSelectMode ? onSelect() : onClick?.())}
      className="group relative cursor-pointer transition-transform hover:scale-[1.02]"
      style={{
        width: "240px",
        height: "180px",
        borderRadius: "12px",
        border: isSelected ? "1.5px solid #2A6AFF" : "0.5px solid #D1D6DE",
        background: isSelected
          ? "rgba(42, 106, 255, 0.1)"
          : "rgba(42, 106, 255, 0.05)",
        overflow: "hidden",
      }}
    >
      {/* 썸네일 영역: Figma 160×140px, x=37, y=1 */}
      <div
        className="absolute flex items-center justify-center overflow-hidden"
        style={{
          left: "37px",
          top: "1px",
          width: "160px",
          height: "140px",
          background: "#FFFFFF",
          boxShadow: "4px 4px 20px 0px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className="flex h-full w-full items-center justify-center">
          {renderThumbnail()}
        </div>
      </div>

      {/* 체크박스 (선택 모드) */}
      {isSelectMode && (
        <div className="absolute top-3 left-3 z-10 flex items-center justify-center">
          {isSelected ? (
            <StorageCheckboxCheckedIcon />
          ) : (
            <StorageCheckboxUncheckedIcon />
          )}
        </div>
      )}

      {/* 업로드/AI 생성 배지: Figma x=180, y=12 → right=12, top=12 */}
      <div
        className="absolute z-10"
        style={{
          top: "12px",
          right: "12px",
          display: "flex",
          height: "20px",
          padding: "0 8px",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "10px",
          background: badgeColor,
        }}
      >
        <span className="font-['Pretendard'] text-[10px] font-bold whitespace-nowrap text-white">
          {badgeText}
        </span>
      </div>

      {/* 파일명 영역: Figma x=0, y=140, 240×40px */}
      <div
        className="absolute bottom-0 left-0 flex items-center"
        style={{
          width: "100%",
          height: "40px",
          background: "#FFF",
          borderTop: "0.5px solid #D1D6DE",
          padding: "8px 12px",
        }}
      >
        <p className="truncate font-['Pretendard'] text-[14px] font-medium text-black">
          {label}
        </p>
      </div>
    </div>
  );
};
