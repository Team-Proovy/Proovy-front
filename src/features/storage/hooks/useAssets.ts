import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUploadUrl,
  confirmUpload,
  getAssetDetail,
  getDownloadUrl,
  deleteAsset,
  deleteAssetsBulk,
} from "../api/assets_api";
import type { BulkDeleteRequest } from "../api/types";

// Query Keys
export const assetKeys = {
  all: ["assets"] as const,
  details: () => [...assetKeys.all, "detail"] as const,
  detail: (id: number) => [...assetKeys.details(), id] as const,
};

// 에셋 상세 조회 Hook
export const useAssetDetail = (assetId: number, enabled = true) => {
  return useQuery({
    queryKey: assetKeys.detail(assetId),
    queryFn: async () => {
      const response = await getAssetDetail(assetId);
      return response.result;
    },
    enabled: enabled && !!assetId,
    staleTime: 1000 * 60 * 10, // 10분
  });
};

// 파일 업로드 Hook (presigned URL 방식)
export const useUploadAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      file,
      onProgress,
    }: {
      noteId: number;
      file: File;
      onProgress?: (progress: number) => void;
    }) => {
      // 1. presigned URL 발급
      const urlResponse = await getUploadUrl({
        noteId,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });
      const { uploadUrl, assetId } = urlResponse.result;

      // 2. S3에 직접 업로드
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // 3. 업로드 완료 확인
      const confirmResponse = await confirmUpload(assetId);
      return confirmResponse.result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
};

// 다운로드 URL 조회 Hook
export const useDownloadUrl = (assetId: number, enabled = false) => {
  return useQuery({
    queryKey: [...assetKeys.detail(assetId), "download"],
    queryFn: async () => {
      const response = await getDownloadUrl(assetId);
      return response.result;
    },
    enabled: enabled && !!assetId,
    staleTime: 1000 * 60 * 5, // 5분 (presigned URL 유효시간 고려)
  });
};

// 에셋 삭제 Hook (단일)
export const useDeleteAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetId: number) => deleteAsset(assetId),
    onSuccess: (_, assetId) => {
      queryClient.removeQueries({ queryKey: assetKeys.detail(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
};

// 에셋 삭제 Hook (벌크)
export const useDeleteAssetsBulk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkDeleteRequest) => deleteAssetsBulk(data),
    onSuccess: (_, data) => {
      // 삭제된 에셋들의 캐시 제거
      data.assetIds.forEach((id) => {
        queryClient.removeQueries({ queryKey: assetKeys.detail(id) });
      });
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
};
