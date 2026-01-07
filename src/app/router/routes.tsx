import { createBrowserRouter } from "react-router-dom";
import { MathChatInput } from "../../features/editor/components/MathChatInput";

export const router = createBrowserRouter([
  {
    path: "/editor",
    element: (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 p-10">
        <MathChatInput />
      </div>
    ),
  },
]);
