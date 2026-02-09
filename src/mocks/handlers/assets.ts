import { http, HttpResponse, delay } from "msw";
import type {
  UploadUrlResponse,
  UploadConfirmResponse,
  AssetDetailResponse,
  DownloadUrlResponse,
  UploadUrlRequest,
  BulkDeleteRequest,
} from "../../features/storage/api/assets_types";
import { mockNoteAssets } from "./editor";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ============================================================
// 목 데이터
// ============================================================

/** presigned URL 발급 시 정보를 임시 저장 → confirm 시 mockNoteAssets에 반영 */
const pendingUploads = new Map<
  number,
  { noteId: number; fileName: string; mimeType: string; fileSize: number }
>();

/** 업로드된 파일 바이너리를 저장 (assetId → ArrayBuffer + mimeType) */
const uploadedFiles = new Map<
  number,
  { buffer: ArrayBuffer; mimeType: string }
>();

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
  // 전체 저장소 사용량 및 현황 조회
  http.get(`${BASE_URL}/api/storage`, async ({ request }) => {
    await delay(400);

    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword");
    console.log("[MSW] 저장소 현황 조회, keyword:", keyword);

    // 검색 키워드 필터 (노트 제목 기준)
    const allNotes = [
      {
        noteId: 1,
        title: "이산수학 (MATH261)",
        storageUsed: 125829120,
        storageLimit: 262144000,
        storageUsedDisplay: "120MB",
        storageLimitDisplay: "250MB",
        assets:
          mockNoteAssets[1]?.map((a) => ({
            assetId: a.assetId,
            source: a.source as "upload" | "ai_generated",
            fileName: a.fileName,
            fileSize: a.fileSize,
            mimeType: a.mimeType,
            ocrStatus: a.ocrStatus as
              | "pending"
              | "processing"
              | "completed"
              | "failed",
            createdAt: a.createdAt,
            thumbnailUrl: a.thumbnailUrl ?? null,
            fileCategory: a.mimeType.startsWith("image/")
              ? ("image" as const)
              : ("document" as const),
          })) ?? [],
      },
      {
        noteId: 2,
        title: "미적분학 (MATH101)",
        storageUsed: 52428800,
        storageLimit: 262144000,
        storageUsedDisplay: "50MB",
        storageLimitDisplay: "250MB",
        assets:
          mockNoteAssets[2]?.map((a) => ({
            assetId: a.assetId,
            source: a.source as "upload" | "ai_generated",
            fileName: a.fileName,
            fileSize: a.fileSize,
            mimeType: a.mimeType,
            ocrStatus: a.ocrStatus as
              | "pending"
              | "processing"
              | "completed"
              | "failed",
            createdAt: a.createdAt,
            thumbnailUrl: a.thumbnailUrl ?? null,
            fileCategory: a.mimeType.startsWith("image/")
              ? ("image" as const)
              : ("document" as const),
          })) ?? [],
      },
      {
        noteId: 3,
        title: "선형대수학 (MATH203)",
        storageUsed: 18874368,
        storageLimit: 262144000,
        storageUsedDisplay: "18MB",
        storageLimitDisplay: "250MB",
        assets:
          mockNoteAssets[3]?.map((a) => ({
            assetId: a.assetId,
            source: a.source as "upload" | "ai_generated",
            fileName: a.fileName,
            fileSize: a.fileSize,
            mimeType: a.mimeType,
            ocrStatus: a.ocrStatus as
              | "pending"
              | "processing"
              | "completed"
              | "failed",
            createdAt: a.createdAt,
            thumbnailUrl: a.thumbnailUrl ?? null,
            fileCategory: a.mimeType.startsWith("image/")
              ? ("image" as const)
              : ("document" as const),
          })) ?? [],
      },
    ];

    const filteredNotes =
      keyword && keyword.length >= 2
        ? allNotes.filter(
            (n) =>
              n.title.includes(keyword) ||
              n.assets.some((a) => a.fileName.includes(keyword)),
          )
        : allNotes;

    const totalUsed = filteredNotes.reduce((sum, n) => sum + n.storageUsed, 0);
    const totalLimit = 524288000; // 500MB
    const usagePercent = Math.round((totalUsed / totalLimit) * 100);

    return HttpResponse.json({
      isSuccess: true,
      code: "STORAGE2000",
      message: "조회 성공",
      result: {
        totalUsed,
        totalLimit,
        totalUsedDisplay: `${Math.round(totalUsed / 1048576)}MB`,
        totalLimitDisplay: "500MB",
        usagePercent,
        plan: {
          planType: "free",
          isActive: true,
        },
        notes: filteredNotes,
      },
    });
  }),

  http.put(
    "https://proovy-bucket.s3.ap-northeast-2.amazonaws.com/*",
    async ({ request }) => {
      await delay(500);

      // URL에서 assetId 추출: /uploads/{assetId}/...
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/");
      const uploadsIdx = pathParts.indexOf("uploads");
      if (uploadsIdx !== -1 && pathParts[uploadsIdx + 1]) {
        const assetId = Number(pathParts[uploadsIdx + 1]);
        const buffer = await request.arrayBuffer();
        const mimeType =
          request.headers.get("Content-Type") || "application/octet-stream";
        uploadedFiles.set(assetId, { buffer, mimeType });
        console.log(
          `[MSW] S3 업로드 저장 완료: assetId=${assetId}, size=${buffer.byteLength}, type=${mimeType}`,
        );
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

      // confirm 시 mockNoteAssets에 반영하기 위해 정보 저장
      pendingUploads.set(newAssetId, {
        noteId: body.noteId,
        fileName: body.fileName,
        mimeType: body.mimeType,
        fileSize: body.fileSize,
      });

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
  http.post(`${BASE_URL}/api/assets/:assetId/confirm`, async ({ params }) => {
    await delay(500);

    const { assetId } = params;
    const assetIdNum = Number(assetId);
    console.log("[MSW] 업로드 완료 확인:", assetId);

    // pendingUploads에서 업로드 정보 조회 → mockNoteAssets에 추가
    const uploadInfo = pendingUploads.get(assetIdNum);
    const fileName = uploadInfo?.fileName ?? "uploaded_file.pdf";
    const fileSize = uploadInfo?.fileSize ?? 1048576;
    const mimeType = uploadInfo?.mimeType ?? "application/pdf";

    if (uploadInfo) {
      const { noteId } = uploadInfo;
      if (!mockNoteAssets[noteId]) {
        mockNoteAssets[noteId] = [];
      }
      // 파일 타입 추론 (서버 응답과 동일하게 소문자)
      const fileType = mimeType.startsWith("image/")
        ? "image"
        : mimeType === "application/pdf"
          ? "pdf"
          : "docx";
      mockNoteAssets[noteId].push({
        assetId: assetIdNum,
        fileName,
        fileSize,
        mimeType,
        fileType,
        source: "upload",
        ocrStatus: "processing",
        thumbnailUrl: null,
        createdAt: new Date().toISOString(),
      });
      pendingUploads.delete(assetIdNum);
      console.log(
        `[MSW] 에셋 등록 완료: noteId=${noteId}, assetId=${assetIdNum}, fileName=${fileName}`,
      );
    }

    const response: UploadConfirmResponse = {
      assetId: assetIdNum,
      fileName,
      fileSize,
      mimeType,
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

  // 다운로드용 - 파일 바이너리 직접 반환
  http.get(`${BASE_URL}/api/assets/:assetId/download`, async ({ params }) => {
    await delay(300);

    const { assetId } = params;
    const assetIdNum = Number(assetId);
    console.log("[MSW] 다운로드 요청:", assetId);

    // 업로드된 파일이 저장되어 있으면 바이너리 직접 반환
    const stored = uploadedFiles.get(assetIdNum);
    if (stored) {
      console.log(
        `[MSW] 저장된 파일 반환: assetId=${assetIdNum}, size=${stored.buffer.byteLength}`,
      );

      // pendingUploads에서 파일명 조회
      let fileName = "file";
      // mockNoteAssets에서 파일명 찾기
      for (const assets of Object.values(mockNoteAssets)) {
        const found = assets.find(
          (a: { assetId: number }) => a.assetId === assetIdNum,
        );
        if (found) {
          fileName = (found as { fileName: string }).fileName;
          break;
        }
      }

      return HttpResponse.json({
        isSuccess: true,
        code: "ASSET2000",
        message: "다운로드 URL 발급 성공",
        result: {
          assetId: assetIdNum,
          fileName,
          downloadUrl: `${BASE_URL}/api/mock-files/${assetIdNum}`,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        } as DownloadUrlResponse,
      });
    }

    // 저장된 파일이 없으면 기존 S3 URL 반환 (fallback)
    return HttpResponse.json({
      isSuccess: true,
      code: "ASSET2000",
      message: "다운로드 URL 발급 성공",
      result: {
        assetId: assetIdNum,
        fileName: "discrete_math_HW2.pdf",
        downloadUrl: `${BASE_URL}/api/mock-files/${assetIdNum}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      } as DownloadUrlResponse,
    });
  }),

  // Mock 파일 직접 서빙 (MSW가 가로채서 바이너리 반환)
  http.get(`${BASE_URL}/api/mock-files/:assetId`, async ({ params }) => {
    const { assetId } = params;
    const assetIdNum = Number(assetId);

    const stored = uploadedFiles.get(assetIdNum);
    if (stored) {
      return new HttpResponse(stored.buffer, {
        status: 200,
        headers: {
          "Content-Type": stored.mimeType,
          "Content-Length": stored.buffer.byteLength.toString(),
        },
      });
    }

    // fallback: 샘플 PDF
    return HttpResponse.json(
      {
        isSuccess: false,
        code: "ASSET4004",
        message: "파일을 찾을 수 없습니다.",
      },
      { status: 404 },
    );
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
