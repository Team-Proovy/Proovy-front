import { http, HttpResponse, delay } from "msw";
import type {
  UploadUrlResponse,
  UploadConfirmResponse,
  AssetDetailResponse,
  DownloadUrlResponse,
  UploadUrlRequest,
  BulkDeleteRequest,
} from "../../features/storage/api/types";

const BASE_URL = "https://api.proovy.ai.kr";

// ============================================================
// 목 데이터
// ============================================================

/** 자산 상세 정보 목 데이터 */
const mockAssetDetail: AssetDetailResponse = {
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

export const assetsHandlers = [
  // 업로드용 Presigned URL 발급
  http.post<never, UploadUrlRequest>(
    `${BASE_URL}/api/assets/upload-url`,
    async ({ request }) => {
      await delay(300);

      const authHeader = request.headers.get("Authorization");
      if (!authHeader) {
        return HttpResponse.json(
          {
            isSuccess: false,
            code: "AUTH4010",
            message: "인증 토큰이 필요합니다.",
            result: null,
          },
          { status: 401 },
        );
      }

      const body = await request.json();
      console.log("[MSW] 업로드 URL 발급 요청:", body);

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

      const response: UploadUrlResponse = {
        assetId: newAssetId,
        uploadUrl: `https://proovy-bucket.s3.ap-northeast-2.amazonaws.com/uploads/${newAssetId}/${body.fileName}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=MOCK`,
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

  // S3 업로드 완료 알림
  http.post(
    `${BASE_URL}/api/assets/:assetId/confirm`,
    async ({ params, request }) => {
      await delay(500);

      const authHeader = request.headers.get("Authorization");
      if (!authHeader) {
        return HttpResponse.json(
          {
            isSuccess: false,
            code: "AUTH4010",
            message: "인증 토큰이 필요합니다.",
            result: null,
          },
          { status: 401 },
        );
      }

      const { assetId } = params;
      console.log("[MSW] 업로드 완료 확인:", assetId);

      const response: UploadConfirmResponse = {
        assetId: Number(assetId),
        fileName: "uploaded_file.pdf",
        fileSize: 1048576,
        mimeType: "application/pdf",
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
    },
  ),

  // 자산 상세 정보 + OCR 결과 조회
  http.get(`${BASE_URL}/api/assets/:assetId`, async ({ params, request }) => {
    await delay(400);

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return HttpResponse.json(
        {
          isSuccess: false,
          code: "AUTH4010",
          message: "인증 토큰이 필요합니다.",
          result: null,
        },
        { status: 401 },
      );
    }

    const { assetId } = params;
    console.log("[MSW] 자산 상세 조회:", assetId);

    return HttpResponse.json({
      isSuccess: true,
      code: "ASSET2000",
      message: "조회 성공",
      result: {
        ...mockAssetDetail,
        assetId: Number(assetId),
      },
    });
  }),

  // 다운로드용 Presigned URL 발급
  http.get(
    `${BASE_URL}/api/assets/:assetId/download-url`,
    async ({ params, request }) => {
      await delay(300);

      const authHeader = request.headers.get("Authorization");
      if (!authHeader) {
        return HttpResponse.json(
          {
            isSuccess: false,
            code: "AUTH4010",
            message: "인증 토큰이 필요합니다.",
            result: null,
          },
          { status: 401 },
        );
      }

      const { assetId } = params;
      console.log("[MSW] 다운로드 URL 발급:", assetId);

      const response: DownloadUrlResponse = {
        assetId: Number(assetId),
        fileName: "discrete_math_HW2.pdf",
        downloadUrl: `https://proovy-bucket.s3.ap-northeast-2.amazonaws.com/downloads/${assetId}/file.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };

      return HttpResponse.json({
        isSuccess: true,
        code: "ASSET2000",
        message: "다운로드 URL 발급 성공",
        result: response,
      });
    },
  ),

  // 자산 삭제
  http.delete(
    `${BASE_URL}/api/assets/:assetId`,
    async ({ params, request }) => {
      await delay(400);

      const authHeader = request.headers.get("Authorization");
      if (!authHeader) {
        return HttpResponse.json(
          {
            isSuccess: false,
            code: "AUTH4010",
            message: "인증 토큰이 필요합니다.",
            result: null,
          },
          { status: 401 },
        );
      }

      const { assetId } = params;
      console.log("[MSW] 자산 삭제:", assetId);

      return HttpResponse.json({
        isSuccess: true,
        code: "ASSET2000",
        message: "삭제 성공",
        result: null,
      });
    },
  ),

  // 자산 일괄 삭제
  http.delete<never, BulkDeleteRequest>(
    `${BASE_URL}/api/storage/assets`,
    async ({ request }) => {
      await delay(500);

      const authHeader = request.headers.get("Authorization");
      if (!authHeader) {
        return HttpResponse.json(
          {
            isSuccess: false,
            code: "AUTH4010",
            message: "인증 토큰이 필요합니다.",
            result: null,
          },
          { status: 401 },
        );
      }

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
