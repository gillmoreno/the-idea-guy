import { t } from "../i18n";
import type { SharedBook } from "../types";

const KIND_EMOJI: Record<string, string> = { character: "🧑‍🎤", place: "🏰", object: "🗝️" };

export function wordCount(book: SharedBook): number {
  return book.chapters.reduce(
    (sum, c) => sum + c.content.split(/\s+/).filter(Boolean).length,
    0
  );
}

/** The typeset manuscript — used by the Libro tab and the public share page. */
export default function BookView({ book }: { book: SharedBook }) {
  const written = book.chapters.filter((c) => c.content.trim().length > 0);

  return (
    <div className="book-view">
      {/* cover */}
      <section className="book-cover">
        <div className="book-cover-rule" />
        <h1>{book.title}</h1>
        <p className="book-author">
          {t("book_by")} <strong>{book.author}</strong>
        </p>
        {book.idea && <p className="book-blurb">{book.idea}</p>}
        <p className="book-meta">
          {written.length} {t(written.length === 1 ? "chapter_one" : "chapters_many")} · {wordCount(book)} {t("words")}
        </p>
        <div className="book-cover-rule" />
      </section>

      {written.length === 0 && <p className="book-empty">{t("book_empty")}</p>}

      {/* chapters */}
      {written.map((c) => (
        <section key={c.id ?? c.position} className="book-chapter">
          <h2>
            <span className="book-chapter-number">{c.position + 1}</span>
            {c.title}
            {c.status !== "finito" && <em className="book-draft"> · {t("draft_badge")}</em>}
          </h2>
          <div className="book-prose">{c.content}</div>
        </section>
      ))}

      {/* story-world appendix */}
      {book.entities.length > 0 && written.length > 0 && (
        <section className="book-chapter book-appendix">
          <h2>{t("book_world")}</h2>
          <ul>
            {book.entities.map((e) => (
              <li key={e.id ?? e.name}>
                <span aria-hidden>{KIND_EMOJI[e.kind] ?? "✨"}</span> <strong>{e.name}</strong>
                {e.summary && <> — {e.summary}</>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="book-colophon">{t("made_with")}</p>
    </div>
  );
}
