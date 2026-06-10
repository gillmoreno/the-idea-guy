import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import StoryPage from "./pages/StoryPage";
import SharedBookPage from "./pages/SharedBookPage";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <div className="text-4xl animate-pulse">✨</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* public: anyone with a share link can read the book, no login */}
      <Route path="/libro/:token" element={<SharedBookPage />} />
      {user ? (
        <>
          <Route path="/" element={<HomePage />} />
          <Route path="/storia/:storyId" element={<StoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <Route path="*" element={<LoginPage />} />
      )}
    </Routes>
  );
}
