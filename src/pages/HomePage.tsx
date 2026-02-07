<<<<<<< HEAD
import { ChevronDown } from "lucide-react";
=======
import { ChevronDown, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
>>>>>>> origin/feat/106-editor-feature
import { useFileUpload } from "../shared/hooks/useFileUpload";
import { useStorageStore } from "../features/storage/store/useStorageStore";
import { ChatInput } from "../features/editor/components/ChatInput";
import type { ChatSendData } from "../features/editor/components/ChatInput";
import { useState } from "react";
import { useAssetUpload } from "@/features/assets/hooks/useAssetUpload";
<<<<<<< HEAD
import { FileUploadCard } from "@/shared/components/pdf-preview/FileUploadCard";
=======
import { useCreateNote } from "@/features/notes/hooks/useNotes";
>>>>>>> origin/feat/106-editor-feature
/**
 * HomePage - 새 노트 시작점
 *
 * URL: /app/home
 * 레이아웃: AppLayout (Outlet)에서 렌더링됨
 *
 * 기능:
 * - 파일 업로드 또는 텍스트 입력으로 새 노트 생성
 * - 첫 메시지 전송 시 노트 자동 생성 → /app/chat/:chatId 로 이동
 */
export const HomePage = () => {
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const { uploadAsset } = useAssetUpload();
  const { mutate: createNote, isPending: isCreatingNote } = useCreateNote();
  // 파일 업로드 훅 사용
  const { fileInputRef, openFileExplorer, handleFileChange } = useFileUpload(
    async (file) => {
      if (
        file &&
        (file.type === "application/pdf" ||
          file.type === "image/jpeg" ||
          file.type === "image/png" ||
          file.type === "image/jpg")
      ) {
        setFileName(file.name);
        const url = URL.createObjectURL(file);
        setPdfUrl(url); // 변수명은 pdfUrl이지만 이제 이미지 url도 담길 수 있음
        try {
          // 이 부분이 진짜 파일 업로드 시작 부분 --> 유효한 noteId 를 넣어야 500 에러 안 남
          const VALID_NOTE_ID = 1;
          const result = await uploadAsset(VALID_NOTE_ID, file);
          console.log("파일 업로드 성공!");

          // 성공 시 StorageStore에 추가
          const { addNote } = useStorageStore.getState();
          addNote({
            id: result?.assetId ?? Date.now(), // assetId가 없으면 임시 ID 사용
            label: file.name,
            type: "upload",
            fileUrl: url, // 로컬 미리보기 URL 사용
            mimeType: file.type,
          });
        } catch (error) {
          console.error("파일 업로드 실패:", error);
        }
      }
    },
  );

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // 버튼 클릭 이벤트 전파 방지
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 첫 메시지 전송 → 노트 생성 → 채팅 페이지 이동
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
        onSuccess: (response) => {
          const noteId = response.result.noteId;
          // 채팅 페이지로 이동 (첫 대화 데이터를 state로 전달)
          navigate(`/app/chat/${noteId}`, {
            state: { createNoteResponse: response.result },
          });
        },
        onError: (error) => {
          console.error("노트 생성 실패:", error);
        },
      },
    );
  };

  return (
    // AppLayout의 Outlet에서 렌더링됨 - 정중앙 배치
    <div className="flex h-full w-full flex-col bg-white">
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
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
            />

            {/* File Upload Card Component */}
            <FileUploadCard
              fileUrl={pdfUrl}
              fileName={fileName}
              onRemove={handleRemove}
              onUploadClick={openFileExplorer}
            />

            {/* 오른쪽: 텍스트 입력 섹션 */}
            <ChatInput
              onSend={handleSend}
              isSending={isCreatingNote}
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
