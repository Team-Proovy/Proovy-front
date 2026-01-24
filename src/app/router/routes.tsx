import { createBrowserRouter } from "react-router-dom";

// Pages
import { LandingPage } from "../../pages/LandingPage";
import { LoginPage } from "../../pages/LoginPage";
import { HomePage } from "../../pages/HomePage";

// Layouts
import { AppLayout } from "../../shared/layout/AppLayout";

// Features - Note
import { NotePage } from "../../features/note/pages/NotePage";

// Features - Notes
import { NotesPage } from "../../features/notes/pages/NotesPage";

// Features - Storage
import { StoragePage } from "../../features/storage/pages/StoragePage";

export const router = createBrowserRouter([
  // ========================================
  // 🌐 Public Routes (인증 불필요)
  // ========================================
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },

  // ========================================
  // 🔒 Protected Routes (인증 필요)
  // ========================================
  {
    path: "/app",
    element: <AppLayout />,
    children: [
      // 홈 - 새 노트 시작점
      {
        path: "home",
        element: <HomePage />,
      },
      // 노트 목록 - 전체 노트 리스트
      {
        path: "notes",
        element: <NotesPage />,
      },
      // 저장소 - 전체 파일 리스트
      {
        path: "storage",
        element: <StoragePage />,
      },
      // 노트 대화방
      // ?panel=viewer|storage, ?file=fileId
      {
        path: "note/:noteId",
        element: <NotePage />,
      },
    ],
  },
]);
