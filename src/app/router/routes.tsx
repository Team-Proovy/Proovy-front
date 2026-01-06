import { createBrowserRouter } from "react-router-dom";
import HomePage from "../../pages/home_page";
import { MathChatInput } from "../../features/canvas/components/MathChatInput";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/canvas",
    element: (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 p-10">
        <MathChatInput />
      </div>
    ),
  },
]);
