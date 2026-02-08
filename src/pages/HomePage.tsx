import { ChevronDown, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFileUpload } from "../shared/hooks/useFileUpload";
import { PdfIcon } from "../shared/components/icons/HomepageInputIcons";
import { ChatInput } from "../features/editor/components/ChatInput";
import type { ChatSendData } from "../features/editor/components/ChatInput";
import type { MessageAttachment } from "@/features/chat/types/chat_types";
import { useEffect, useRef, useState } from "react";
import { PdfPreview } from "../shared/components/pdf-preview/PdfPreview";
import { uploadAttachments } from "@/features/assets/utils/upload_attachments";
import {
  isFileAllowed,
  FILE_ACCEPT,
} from "@/features/assets/utils/fileValidation";
import { useCreateNote } from "@/features/notes/hooks/useNotes";
import {
  getUploadUrl,
  uploadToS3,
  confirmUpload,
} from "@/features/assets/api/assetApi";
/**
 * HomePage - 새 노트 시작점
 *
 * URL: /app/home
 * 레이아웃: AppLayout (Outlet)에서 렌더링됨
 *
 * 기능:
 * - 파일 업로드 또는 텍스트 입력으로 새 노트 생성
 * - 첫 메시지 전송 시 노트 자동 생성 → /app/chat/:chatId 로 이동
 * - 뷰어 파일은 로컬 미리보기만 표시, 노트 생성 후에 업로드
 */
export const HomePage = () => {
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const { mutate: createNote, isPending: isCreatingNote } = useCreateNote();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 뷰어용 파일 참조 (노트 생성 후 업로드하기 위해 File 객체 보관)
  const viewerFileRef = useRef<File | null>(null);

  // Blob URL 메모리 누수 방지: pdfUrl 변경 시 이전 URL revoke + 언마운트 시 cleanup
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  // 파일 업로드 훅 사용 — 로컬 미리보기만 설정, S3 업로드는 하지 않음
  const { fileInputRef, openFileExplorer, handleFileChange } = useFileUpload(
    (file) => {
      if (file && isFileAllowed(file)) {
        setFileName(file.name);
        viewerFileRef.current = file;
        const url = URL.createObjectURL(file);
        setPdfUrl(url);
      }
    },
  );

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setFileName("");
    viewerFileRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 첫 메시지 전송 → 노트 생성 → (뷰어 파일 + 첨부 업로드) → 채팅 페이지 이동
  const handleSend = (data: ChatSendData) => {
    createNote(
      {
        firstMessage: data.message,
        mentionedAssetIds:
          data.mentionedAssetIds.length > 0
            ? data.mentionedAssetIds
            : undefined,
        mentionedToolCodes:
          data.mentionedToolCodes.length > 0
            ? data.mentionedToolCodes
            : undefined,
      },
      {
        onSuccess: async (response) => {
          const newNoteId = response.result.noteId;
          setIsUploading(true);

          let uploadFailed = false;
          setUploadError(null);

          try {
            // ── 1. 뷰어 파일 업로드 (노트 생성 후 noteId 확보) ──
            if (viewerFileRef.current) {
              const file = viewerFileRef.current;
              try {
                const { result } = await getUploadUrl({
                  noteId: newNoteId,
                  fileName: file.name,
                  mimeType: file.type,
                  fileSize: file.size,
                });
                await uploadToS3(result.uploadUrl, file);
                await confirmUpload(result.assetId);
                console.log("[HomePage] 뷰어 파일 업로드 성공:", file.name);
              } catch (error) {
                console.error("[HomePage] 뷰어 파일 업로드 실패:", error);
                setUploadError(
                  "파일 업로드에 실패했습니다. 다시 시도해주세요.",
                );
                uploadFailed = true;
              }
            }

            // ── 2. ChatInput 첨부 파일 업로드 ──
            if (!uploadFailed && data.attachments.length > 0) {
              try {
                await uploadAttachments(newNoteId, data.attachments);
              } catch (error) {
                console.error("[HomePage] 첨부 파일 업로드 실패:", error);
                setUploadError(
                  "첨부 파일 업로드에 실패했습니다. 다시 시도해주세요.",
                );
                uploadFailed = true;
              }
            }
          } finally {
            setIsUploading(false);
          }

          if (uploadFailed) return;

          // 첨부파일 정보를 ChatPage로 전달 (미리보기용)
          const attachmentInfos: MessageAttachment[] = data.attachments.map(
            (a) => ({
              name: a.name,
              mimeType: a.mimeType,
              size: a.size,
              previewUrl: a.previewUrl,
            }),
          );

          // 뷰어 파일 정보 (ChatPage에서 뷰어 패널 자동 열기용)
          const viewerFileInfo = viewerFileRef.current
            ? {
                name: viewerFileRef.current.name,
                mimeType: viewerFileRef.current.type,
                size: viewerFileRef.current.size,
              }
            : undefined;

          // 채팅 페이지로 이동 (첫 대화 데이터 + 첨부 정보를 state로 전달)
          navigate(`/app/chat/${newNoteId}`, {
            state: {
              createNoteResponse: response.result,
              attachments: attachmentInfos,
              viewerFile: viewerFileInfo,
            },
          });
        },
        onError: (error) => {
          console.error("노트 생성 실패:", error);
          setUploadError("노트 생성에 실패했습니다. 다시 시도해주세요.");
        },
      },
    );
  };

  return (
    // AppLayout의 Outlet에서 렌더링됨 - 정중앙 배치
    <div className="flex h-full w-full flex-col bg-white">
      {/* 업로드/생성 에러 배너 */}
      {uploadError && (
        <div className="flex items-center justify-between bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="ml-4 font-medium text-red-700 underline"
          >
            닫기
          </button>
        </div>
      )}
      {/* 메인 컨텐츠 영역 - 정중앙 배치 */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 pt-[100px]">
        {/* 컨텐츠 너비는 내부 요소에 맞게 자동 계산 */}
        <div className="flex w-fit flex-col">
          {/* 상단 타이틀 영역 */}
          <div className="mb-8">
            <h1 className="text-[40px] leading-[52px] font-semibold tracking-[-0.008px] text-black">
              파일을 업로드하고 완벽한 해설을,
            </h1>
          </div>

          {/* 메인 입력 카드 */}
          <div className="mb-10 flex gap-6">
            {/* hidden input for file upload */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept={FILE_ACCEPT}
            />

            {pdfUrl ? (
              /* PDF 업로드 완료 시: 카드 형태 UI */
              <div className="group relative flex h-[160px] w-[220px] flex-col items-center overflow-hidden rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white shadow-[4px_4px_20px_5px_rgba(0,0,0,0.05)] transition-all">
                {/* 닫기 버튼: 우상단 고정 */}
                <button
                  onClick={handleRemove}
                  className="absolute top-[12px] right-[12px] z-10 flex cursor-pointer items-center justify-center"
                >
                  <X
                    size={20}
                    color="#000000"
                  />
                </button>

                {/* 상단: PDF 썸네일 영역 (세로 고정, 위아래 잘림 처리) */}
                <div className="relative flex h-[140px] w-[160px] items-start justify-center overflow-hidden">
                  <div className="flex h-full w-full items-center justify-center">
                    {/* 이미지 파일이면 img 태그, PDF면 PdfPreview */}
                    {fileName.toLowerCase().endsWith(".pdf") ? (
                      <PdfPreview
                        key={pdfUrl}
                        fileUrl={pdfUrl}
                        width={160}
                      />
                    ) : (
                      <img
                        src={pdfUrl}
                        alt="preview"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                </div>

                {/* 하단: 파일명 영역 */}
                <div className="flex h-[50px] w-full items-center justify-center border-t-[0.5px] border-[#C6C6C6] bg-white px-3">
                  <p className="truncate text-[13px] font-medium text-[#333333]">
                    {fileName}
                  </p>
                </div>

                {/* Hover Overlay: 전체 영역 어둡게 처리 */}
                <div className="pointer-events-none absolute inset-0 z-0 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            ) : (
              /* 기본 상태: 업로드 버튼 */
              <button
                onClick={openFileExplorer}
                className="group flex h-[160px] w-[220px] cursor-pointer flex-col items-center justify-center gap-[16px] rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white/40 px-[20px] py-[36px] shadow-[4px_4px_20px_5px_rgba(0,0,0,0.05)] transition-colors duration-700 hover:bg-[#2A6AFF33] active:bg-[#2A6AFF33]"
              >
                <div>
                  <PdfIcon size={56} />
                </div>
                <p className="text-[18px] font-normal text-[#666666] transition-colors duration-700 group-hover:text-[#2542F0]">
                  뷰어로 파일 업로드
                </p>
              </button>
            )}

            {/* 오른쪽: 텍스트 입력 섹션 */}
            <ChatInput
              onSend={handleSend}
              isSending={isCreatingNote || isUploading}
            />
          </div>

          {/* 하단 예시 섹션 */}
          <div className="space-y-4">
            <p className="text-[18px] font-semibold text-[#6B6B6B]">
              또는 다음 예시로 시작해 보세요.
            </p>
          </div>
        </div>
      </div>

      {/* 맨 하단 스크롤 안내 - 항상 하단 고정 */}
      <div className="flex w-full flex-col items-center justify-center pb-8 text-[#666666]">
        <p className="mb-2 text-[18px] font-semibold">
          내려서 다양한 예시 확인하기
        </p>
        <ChevronDown size={50} />
      </div>
    </div>
  );
};
