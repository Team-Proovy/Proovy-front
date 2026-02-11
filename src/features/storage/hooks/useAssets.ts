import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUploadUrl,
  confirmUpload,
  getAssetDetail,
  getDownloadUrl,
  deleteAsset,
  deleteAssetsBulk,
  getStorageUsage,
} from "../api/assets_api";
import type { UploadUrlRequest, StorageResponse } from "../api/assets_types";

// Query Keys
export const assetKeys = {
  all: ["assets"] as const,
  storage: ["storage"] as const,
  storageList: (keyword?: string) =>
    keyword
      ? [...assetKeys.storage, "list", keyword]
      : ([...assetKeys.storage, "list"] as const),
  details: () => [...assetKeys.all, "detail"] as const,
  detail: (id: number) => [...assetKeys.details(), id] as const,
};

/**
 * 스토리지 사용량 조회 Hook
 *
 * TanStack Query 캐싱 전략:
 * - staleTime: 5분 - 데이터가 5분간 fresh 상태 유지 (재요청 없음)
 * - gcTime: 10분 - 사용하지 않는 데이터는 10분 후 가비지 컬렉션
 * - refetchOnWindowFocus: false - 탭 이동 시 재요청 방지
 * - refetchOnMount: false - 컴포넌트 재마운트 시 캐시된 데이터 사용
 */
export const useStorageInfo = (keyword?: string) => {
  return useQuery<StorageResponse>({
    queryKey: assetKeys.storageList(keyword),
    queryFn: async () => {
      const response = await getStorageUsage(keyword);
      return response.result;
    },
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
    gcTime: 1000 * 60 * 10, // 10분간 캐시 보관
    refetchOnWindowFocus: false, // 탭 이동 시 재요청 방지
    refetchOnMount: false, // 마운트 시 캐시 우선 사용
    retry: 2, // 실패 시 2회 재시도
  });
};

/**
 * 에셋 상세 조회 Hook
 *
 * OCR 결과 등 상세 정보는 자주 변경되지 않으므로 긴 캐시 시간 사용
 */
export const useAssetDetail = (assetId: number, enabled = true) => {
  return useQuery({
    queryKey: assetKeys.detail(assetId),
    queryFn: async () => {
      const response = await getAssetDetail(assetId);
      return response.result;
    },
    enabled: enabled && !!assetId,
    staleTime: 1000 * 60 * 10, // 10분
    gcTime: 1000 * 60 * 15, // 15분간 캐시 보관
    refetchOnWindowFocus: false,
  });
};

// S3 직접 업로드 함수
const uploadToS3 = async (
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
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
      const requestParams: UploadUrlRequest = {
        noteId,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      };
      const urlResponse = await getUploadUrl(requestParams);
      const { uploadUrl, assetId } = urlResponse.result;

      // 2. S3에 직접 업로드
      await uploadToS3(uploadUrl, file, onProgress);

      // 3. 업로드 완료 확인
      const confirmResponse = await confirmUpload(assetId);
      return confirmResponse.result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
      queryClient.invalidateQueries({ queryKey: assetKeys.storage });
    },
  });
};

/**
 * 다운로드 URL 조회 Hook
 *
 * Presigned URL은 15분간 유효하므로, 10분 캐시로 안전하게 사용
 */
export const useDownloadUrl = (assetId: number, enabled = false) => {
  return useQuery({
    queryKey: [...assetKeys.detail(assetId), "download"],
    queryFn: async () => {
      const response = await getDownloadUrl(assetId);
      return response.result;
    },
    enabled: enabled && !!assetId,
    staleTime: 1000 * 60 * 10, // 10분 (presigned URL 15분 유효)
    gcTime: 1000 * 60 * 12, // 12분간 캐시 보관
    refetchOnWindowFocus: false,
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
      queryClient.invalidateQueries({ queryKey: assetKeys.storage });
    },
  });
};

// 에셋 삭제 Hook (벌크)
export const useDeleteAssetsBulk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetIds: number[]) => deleteAssetsBulk({ assetIds }),
    onSuccess: (_, assetIds) => {
      assetIds.forEach((id) => {
        queryClient.removeQueries({ queryKey: assetKeys.detail(id) });
      });
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
      queryClient.invalidateQueries({ queryKey: assetKeys.storage });
    },
  });
};
