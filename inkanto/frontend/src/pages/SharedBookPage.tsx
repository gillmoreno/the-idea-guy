import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { t } from "../i18n";
import type { SharedBook } from "../types";
import BookView from "../components/BookView";

/** Public, read-only book page — reachable without login via the share link. */
export default function SharedBookPage() {
  const { token } = useParams();
  const [book, setBook] = useState<SharedBook | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api<SharedBook>(`/share/${token}`)
      .then(setBook)
      .catch(() => setError(true));
  }, [token]);

  if (error) {
    return (
      <div className="min-h-dvh grid place-items-center p-6 text-center">
        <div>
          <div className="text-5xl mb-3">📕</div>
          <p className="text-muted">{t("book_not_found")}</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return <div className="min-h-dvh grid place-items-center text-4xl animate-pulse">📖</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 py-8">
      <div className="card p-6 sm:p-10">
        <BookView book={book} />
      </div>
      <div className="no-print flex justify-center mt-4">
        <button className="btn-ghost text-sm" onClick={() => window.print()}>
          🖨 {t("print_pdf")}
        </button>
      </div>
    </div>
  );
}
