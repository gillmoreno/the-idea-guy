import { useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { t } from "../i18n";
import type { StoryDetail } from "../types";
import BookView from "./BookView";

export default function BookTab({ story, onChanged }: { story: StoryDetail; onChanged: () => void }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const book = {
    title: story.title,
    idea: story.idea,
    author: user?.display_name ?? "",
    chapters: story.chapters,
    entities: story.entities,
  };

  const shareUrl = story.share_token ? `${location.origin}/libro/${story.share_token}` : null;

  const share = async () => {
    const { share_token } = await api<{ share_token: string }>(`/stories/${story.id}/share`, { method: "POST" });
    const url = `${location.origin}/libro/${share_token}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: story.title, url });
      } catch {
        /* user cancelled the share sheet */
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    onChanged();
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stopSharing = async () => {
    await api(`/stories/${story.id}/share`, { method: "DELETE" });
    onChanged();
  };

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3 no-print">
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost text-sm" onClick={() => window.print()}>
            🖨 {t("print_pdf")}
          </button>
          <button className="btn-spark text-sm" onClick={share}>
            {copied ? t("share_copied") : `🔗 ${t("share")}`}
          </button>
          {shareUrl && (
            <button className="btn-ghost text-sm" onClick={stopSharing}>
              🚫 {t("share_stop")}
            </button>
          )}
        </div>
        {shareUrl && (
          <div className="space-y-1">
            <button onClick={copyLink} className="text-link text-sm underline decoration-dotted break-all text-left">
              {shareUrl}
            </button>
            <p className="text-muted text-xs">{t("share_hint")}</p>
          </div>
        )}
      </div>

      <div className="card p-6 sm:p-8">
        <BookView book={book} />
      </div>
    </div>
  );
}
