import axios from "axios";
import { useState } from "react";
import apiClient from "@/shared/api/client";
import type {
  UploadUrlRequest,
  UploadUrlResponse,
  ConfirmUploadResponse,
} from "../types/asset";

export const useAssetUpload = () => {
  const [isUploading, setIsUploading] = useState(false); // 업로드 여부
  const [progress, setProgress] = useState(0); // 업로드 진해률(퍼센트로 나타남)

  // 파일을 업로드 시키는 함수!
  const uploadAsset = async (noteId: number, file: File) => {
    setIsUploading(true);
    setProgress(0);
    const token = localStorage.getItem("accessToken");
    console.log("🚀 1단계 시작: URL 발급 요청", { fileName: file.name });

    try {
      // 1. Url 요청
      const res1 = await apiClient.post<UploadUrlResponse>(
        "/api/assets/upload-url",
        {
          noteId: noteId,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        } as UploadUrlRequest,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const { uploadUrl, assetId } = res1.data.result;
      console.log("✅ 1단계 완료: 발급된 ID", res1.data.result.assetId);
      console.log("🚀 2단계 시작: S3 직접 업로드 중...");

      // 2. S3 업로드 -> 여기서는 일반 axios 사용해야 함! (apiClient는 토큰을 넣어서 보내기 때문에 안됨)
      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100),
          );
          setProgress(percentCompleted);
        },
      });
      console.log("✅ 2단계 완료: S3 업로드 완료");

      // Step 3: 서버 업로드 완료 알림 (apiClient 사용)
      const res2 = await apiClient.post<ConfirmUploadResponse>(
        `/api/assets/${assetId}/confirm`,
      );

      console.log("업로드 최종 성공:", res2.data.result.fileName);
      return res2.data.result;
    } catch (error) {
      console.error("업로드 중 오류 발생:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadAsset, isUploading, progress };
};
