export type FileType = "pdf" | "docx" | "image" | "code" | string;

export type AssetSource = "upload" | "generated";

export type OcrStatus = "pending" | "processing" | "completed" | "failed";

export interface ChatAssetDto {
  assetId: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileType: FileType;
  source: AssetSource;
  ocrStatus: OcrStatus;
  thumbnailUrl: string | null;
  createdAt: string;
}

export interface CanvasImageUploadRequest {
  noteId: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface CanvasImageUploadResponse {
  assetId: number;
  source: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  uploadUrl: string;
  createdAt: string;
}
