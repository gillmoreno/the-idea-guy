"use client";

import { useState } from "react";
import { useBookClubStore } from "../lib/useBookClubStore";

export function AddBook({
  memberId,
  startAsCurrent,
  onDone,
}: {
  memberId: string;
  startAsCurrent?: boolean;
  onDone: () => void;
}) {
  const store = useBookClubStore();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [meetingDate, setMeetingDate] = useState("");

  const canSave = !!store && title.trim() && author.trim();

  const save = () => {
    if (!store || !canSave) return;
    const book = store.addBook({
      title,
      author,
      status: startAsCurrent ? "reading" : "queued",
      meetingDate: startAsCurrent && meetingDate ? meetingDate : undefined,
      addedById: memberId,
    });
    if (startAsCurrent) {
      store.startReading(book.id, meetingDate || undefined);
    }
    onDone();
  };

  return (
    <div className="card stack">
      <div className="section-title">{startAsCurrent ? "Start reading" : "Suggest a book"}</div>
      <div className="field">
        <label>Title</label>
        <input
          className="input"
          placeholder="The Midnight Library"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Author</label>
        <input
          className="input"
          placeholder="Matt Haig"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
      </div>
      {startAsCurrent && (
        <div className="field">
          <label>Next meeting (optional)</label>
          <input
            className="input"
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
          />
        </div>
      )}
      <div className="row gap-sm">
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={!canSave} onClick={save}>
          {startAsCurrent ? "Start this book" : "Add to queue"}
        </button>
        <button className="btn btn-ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}
