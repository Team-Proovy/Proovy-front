import { useState } from "react";
import { getUploadUrl, uploadToS3, confirmUpload } from "../api/assetApi";
import { validateFile } from "../utils/fileValidation";
import type { ConfirmUploadResponseData } from "../types/asset";

export const useAssetUpload = () => {
  // 업로드 진행 상태 관리
  const [isUploading, setIsUploading] = useState(false);
  // S3 업로드 퍼센트(0~100) 관리
  const [progress, setProgress] = useState(0);
  // 업로드 성공 후 받은 자산 정보 저장 
  const [uploadedAsset, setUploadedAsset] = useState<ConfirmUploadResponseData | null>(null);

  /**
   * 자산 업로드 메인 함수 (3단계 프로세스)
   * @param noteId 파일이 속할 노트의 ID 
   * @param file 사용자가 선택한 File 객체
   */
  const uploadAsset = async (noteId: number, file: File) => {
    try {
      setIsUploading(true);
      setProgress(0);

      // [Step 0] 클라이언트 측 파일 검증 (30MB, 확장자 등)
      validateFile(file);

      // [Step 1] Presigned URL 발급 요청
      // 서버에 파일 메타데이터를 보내고 S3 주소와 assetId를 받아옴
      const { result: urlConfig } = await getUploadUrl({
        noteId,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });

      // [Step 2] S3 저장소에 직접 파일 전송 (PUT)
      // 서버를 거치지 않고 S3로 바로 쏘기 때문에 서버 부하가 없음
      await uploadToS3(urlConfig.uploadUrl, file, (percentage) => {
        setProgress(percentage); // 실시간 진행률 업데이트
      });

      // [Step 3] S3 업로드 완료 알림 (서버에 확인 요청)
      // 이 호출이 성공해야 서버에서 OCR 분석을 시작함 (ocrStatus: processing)
      const { result: assetInfo } = await confirmUpload(urlConfig.assetId);
      
      setUploadedAsset(assetInfo);
      alert("파일 업로드 및 검사가 성공적으로 시작되었습니다!");
      
      return assetInfo; // 최종 성공 데이터 반환        

    } catch (error: any) {
      // 명세서에 정의된 에러 메시지 처리 (400, 401, 403, 404, 409 등)
      const errorMessage = error.response?.data?.message || error.message;
      alert(`업로드 실패: ${errorMessage}`);
      console.error("Upload Error Details:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { 
    uploadAsset, 
    isUploading, 
    progress, 
    uploadedAsset 
  };
};