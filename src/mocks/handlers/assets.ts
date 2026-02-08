import { http, HttpResponse, delay } from "msw";
import type {
  UploadUrlResponseData,
  AssetDetailResponseData, // Used for both AssetDetailResponse and UploadConfirmResponse
  DownloadUrlResponseData,
  UploadUrlRequest,
  BulkDeleteRequest,
} from "../../features/assets/types/asset";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ============================================================
// 목 데이터
// ============================================================

/** 자산 상세 정보 목 데이터 */
const mockAssetDetail: AssetDetailResponseData = {
  assetId: 1,
  noteId: 1,
  source: "upload",
  fileName: "discrete_math_HW2.pdf",
  fileSize: 1048576,
  mimeType: "application/pdf",
  totalPages: 12,
  ocrStatus: "completed",
  ocrText: {
    pages: [
      {
        page: 1,
        text: "이산수학 과제 #2\n\n문제 1. 다음 명제의 진리표를 작성하시오...",
      },
      {
        page: 2,
        text: "문제 2. 집합 A = {1, 2, 3}과 B = {2, 3, 4}에 대하여...",
      },
    ],
    fullText:
      "이산수학 과제 #2\n\n문제 1. 다음 명제의 진리표를 작성하시오...\n\n문제 2. 집합 A = {1, 2, 3}과 B = {2, 3, 4}에 대하여...",
    model: "PaddleOCR-VL",
  },
  ocrProcessedAt: "2025-01-05T10:01:00",
  createdAt: "2025-01-05T10:00:00",
};

// ============================================================
// Assets API 핸들러
// ============================================================

// 메모리 내 파일 저장소 (새로고침 전까지 유지)
const uploadedFiles = new Map<number, Blob>();

export const assetsHandlers = [
  // S3 버킷 업로드 핸들러
  http.put(
    "https://proovy-bucket.s3.ap-northeast-2.amazonaws.com/uploads/*",
    async ({ request }) => {
      await delay(500);

      // URL에서 assetId 추출 로직
      // URL 구조: .../uploads/{assetId}/{fileName}?query...
      const url = new URL(request.url);
      const parts = url.pathname.split("/");
      // parts 예시: ["", "uploads", "123", "filename.pdf"]
      const assetIdIndex = parts.indexOf("uploads") + 1;
      const assetId = parts[assetIdIndex]; // "123"

      if (assetId) {
        const fileBlob = await request.blob();
        uploadedFiles.set(Number(assetId), fileBlob);
        console.log(`[MSW] S3 가짜 업로드 및 저장 완료 (ID: ${assetId})`);
      } else {
        console.warn("[MSW] S3 업로드 중 assetId 추출 실패:", request.url);
      }

      return new HttpResponse(null, { status: 200 });
    },
  ),

  // 업로드용 Presigned URL 발급
  http.post<never, UploadUrlRequest>(
    `${BASE_URL}/api/assets/upload-url`,
    async ({ request }) => {
      await delay(300);

      const body = await request.json();
      console.log("[MSW] 업로드 URL 발급 요청:", body);

      // ... (검증 로직 생략, 기존 코드 유지하되 assetId 생성 로직 위치 확인 필요)
      // 기존 로직 복사해야 함. 여기서는 간략히 핵심만 변경하고 나머지는 유지.
      // 실제로는 replace_file_content니까 전체 블록을 교체해야 함.

      // 파일 크기 검증
      if (body.fileSize > 31457280) {
        return HttpResponse.json(
          {
            isSuccess: false,
            code: "ASSET4002",
            message: "파일 크기가 30MB를 초과합니다.",
            result: null,
          },
          { status: 400 },
        );
      }

      // 지원 형식 검증
      const allowedMimeTypes = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/webp",
      ];
      if (!allowedMimeTypes.includes(body.mimeType)) {
        return HttpResponse.json(
          {
            isSuccess: false,
            code: "ASSET4001",
            message: "지원하지 않는 파일 형식입니다.",
            result: null,
          },
          { status: 400 },
        );
      }

      const newAssetId = Math.floor(Math.random() * 1000) + 100;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const response: UploadUrlResponseData = {
        assetId: newAssetId,
        // URL 패턴을 PUT 핸들러와 일치시킴
        uploadUrl: `https://proovy-bucket.s3.ap-northeast-2.amazonaws.com/uploads/${newAssetId}/${body.fileName}`,
        expiresAt,
      };

      return HttpResponse.json({
        isSuccess: true,
        code: "ASSET2000",
        message: "URL 발급 성공",
        result: response,
      });
    },
  ),

  // ... (confirmUpload 핸들러 - 그대로 유지) ...
  // 기존 코드의 confirmUpload 부분은 이 범위 밖이면 건드리지 않음.
  // 이 replace 블록은 PUT 핸들러 + POST upload-url 핸들러 커버.

  // S3 업로드 완료 알림
  http.post(`${BASE_URL}/api/assets/:assetId/confirm`, async ({ params }) => {
    await delay(500);

    const { assetId } = params;

    // 저장된 파일이 있으면 그 정보를 사용, 없으면 더미 데이터
    const storedFile = uploadedFiles.get(Number(assetId));

    // 파일명과 타입은 저장된 Blob에서 완벽히 알 수 없으니(name prop 없음),
    // 여기서는 단순히 성공 응답만 줌.
    // 실제 구현에서는 upload-url 요청 시 저장해둔 메타데이터를 쓰거나 해야 함.
    // 일단 간단히 처리.

    const response: AssetDetailResponseData = {
      assetId: Number(assetId),
      fileName: storedFile ? "uploaded_file" : "uploaded_file.pdf", // 단순화
      fileSize: storedFile?.size ?? 1048576,
      mimeType: storedFile?.type ?? "application/pdf",
      source: "upload",
      ocrStatus: "processing",
      createdAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      isSuccess: true,
      code: "ASSET2000",
      message: "업로드 확인 완료, OCR 처리 시작",
      result: response,
    });
  }),

  // 자산 상세 정보 + OCR 결과 조회
  http.get(`${BASE_URL}/api/assets/:assetId`, async ({ params }) => {
    await delay(400);

    const { assetId } = params;
    const storedFile = uploadedFiles.get(Number(assetId));

    return HttpResponse.json({
      isSuccess: true,
      code: "ASSET2000",
      message: "조회 성공",
      result: {
        ...mockAssetDetail,
        assetId: Number(assetId),
        // 저장된 파일이 있으면 해당 정보 반영
        mimeType: storedFile?.type ?? mockAssetDetail.mimeType,
        fileSize: storedFile?.size ?? mockAssetDetail.fileSize,
      },
    });
  }),

  // 다운로드용 Presigned URL 발급
  http.get(`${BASE_URL}/api/assets/:assetId/download`, async ({ params }) => {
    await delay(300);

    const { assetId } = params;
    const id = Number(assetId);
    console.log("[MSW] 다운로드 URL 발급:", id);

    // 메모리에 저장된 파일이 있다면 Blob URL 생성하여 반환
    let downloadUrl =
      "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";
    let fileName = "discrete_math_HW2.pdf";

    const storedFile = uploadedFiles.get(id);
    if (storedFile) {
      // Blob URL 생성 (브라우저 메모리상 URL)
      downloadUrl = URL.createObjectURL(storedFile);
      // 파일명 추론 (타입 기반)
      const ext = storedFile.type.split("/")[1] || "pdf";
      fileName = `uploaded_file.${ext}`;
      console.log(`[MSW] 메모리된 파일 반환: ${fileName}, ${downloadUrl}`);
    }

    const response: DownloadUrlResponseData = {
      assetId: id,
      fileName: fileName,
      downloadUrl: downloadUrl,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };

    return HttpResponse.json({
      isSuccess: true,
      code: "ASSET2000",
      message: "다운로드 URL 발급 성공",
      result: response,
    });
  }),

  // 자산 삭제
  http.delete(`${BASE_URL}/api/assets/:assetId`, async ({ params }) => {
    await delay(400);

    const { assetId } = params;
    console.log("[MSW] 자산 삭제:", assetId);

    return HttpResponse.json({
      isSuccess: true,
      code: "ASSET2000",
      message: "삭제 성공",
      result: null,
    });
  }),

  // 자산 일괄 삭제
  http.delete<never, BulkDeleteRequest>(
    `${BASE_URL}/api/storage/assets`,
    async ({ request }) => {
      await delay(500);

      const body = await request.json();
      console.log("[MSW] 자산 일괄 삭제:", body);

      if (body.assetIds.length > 30) {
        return HttpResponse.json(
          {
            isSuccess: false,
            code: "COMMON400",
            message: "최대 30개까지 삭제 가능합니다.",
            result: null,
          },
          { status: 400 },
        );
      }

      const response = {
        deletedCount: body.assetIds.length,
      };

      return HttpResponse.json({
        isSuccess: true,
        code: "STORAGE2000",
        message: "일괄 삭제 성공",
        result: response,
      });
    },
  ),
];
