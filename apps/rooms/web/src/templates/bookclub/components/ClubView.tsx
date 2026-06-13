"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/templates/choreboard/lib/format";
import { TopbarPersona } from "@/shell/TopbarPersona";
import { AppTabBar } from "@/shell/AppTabBar";
import { SyncBadge } from "@/shell/SyncBadge";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { RoomLocalStorage } from "@/shell/RoomLocalStorage";
import { RoomCodeShare } from "@/shell/RoomCodeShare";
import { RoomInviteSettings } from "@/shell/RoomInviteSettings";
import { SwitchProfile } from "@/shell/SwitchProfile";
import type { Book } from "../lib/types";
import { useBookClubStore } from "../lib/useBookClubStore";
import { AddBook } from "./AddBook";
import { EmptyState, Avatar } from "@/components/kit";

type Tab = "reading" | "queue" | "archive";

function BookRow({
  book,
  addedByName,
  actions,
}: {
  book: Book;
  addedByName?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="card stack-sm">
      <div className="row gap-sm">
        <div style={{ fontSize: 28 }}>📖</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>{book.title}</strong>
          <div className="meta-line">
            {book.author}
            {addedByName ? ` · suggested by ${addedByName}` : ""}
          </div>
          {book.meetingDate && (
            <div className="meta-line" style={{ marginTop: 4 }}>
              Meeting {formatDate(book.meetingDate)}
            </div>
          )}
        </div>
      </div>
      {actions}
    </div>
  );
}

export function ClubView({ memberId }: { memberId: string }) {
  const { sync, leaveRoom, roomCode, hasAdminAccess, version } = useRoomSession();
  const store = useBookClubStore();
  const [tab, setTab] = useState<Tab>("reading");
  const [adding, setAdding] = useState<"queue" | "current" | null>(null);
  const [noteText, setNoteText] = useState("");
  void version;

  if (!store) return null;

  const club = store.getClub()!;
  const members = store.listMembers();
  const me = store.getMember(memberId);
  const byId = new Map(members.map((m) => [m.id, m]));
  const current = store.getCurrentBook();
  const queue = store.listBooks("queued");
  const archive = store.listBooks("done");
  const notes = current ? store.listNotes(current.id) : [];

  const addNote = () => {
    if (!current || !noteText.trim()) return;
    store.addNote({ bookId: current.id, authorId: memberId, body: noteText });
    setNoteText("");
  };

  return (
    <div className="app">
      <TopbarPersona
        title={club.name}
        subtitle={me?.name ?? "Member"}
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <AppTabBar>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "reading"}
          className={tab === "reading" ? "active" : ""}
          onClick={() => setTab("reading")}
        >
          Reading
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "queue"}
          className={tab === "queue" ? "active" : ""}
          onClick={() => setTab("queue")}
        >
          Queue ({queue.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "archive"}
          className={tab === "archive" ? "active" : ""}
          onClick={() => setTab("archive")}
        >
          Archive
        </button>
      </AppTabBar>

      <div className="app-main stack">
        {tab === "reading" && (
          <>
            {adding === "current" ? (
              <AddBook memberId={memberId} startAsCurrent onDone={() => setAdding(null)} />
            ) : !current ? (
              <div className="stack">
                <EmptyState>No book picked yet. Start one or promote from the queue.</EmptyState>
                <button className="btn btn-primary btn-block" onClick={() => setAdding("current")}>
                  + Pick a book to read
                </button>
              </div>
            ) : (
              <>
                <BookRow
                  book={current}
                  addedByName={byId.get(current.addedById)?.name}
                  actions={
                    <div className="row gap-sm">
                      <input
                        className="input"
                        type="date"
                        value={current.meetingDate ?? ""}
                        onChange={(e) => store.updateMeetingDate(current.id, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => store.markDone(current.id)}
                      >
                        Mark finished
                      </button>
                    </div>
                  }
                />

                <div className="section-title">Discussion notes</div>
                <div className="card stack-sm">
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Thoughts, quotes, questions for the group…"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <button
                    className="btn btn-primary"
                    disabled={!noteText.trim()}
                    onClick={addNote}
                  >
                    Add note
                  </button>
                </div>
                {notes.length === 0 ? (
                  <p className="meta-line">
                    No notes yet — drop spoilers, favorite lines, or debate topics.
                  </p>
                ) : (
                  <div className="stack-sm">
                    {notes.map((n) => {
                      const author = byId.get(n.authorId);
                      return (
                        <div key={n.id} className="card row gap-sm">
                          {author && <Avatar person={author} />}
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: 13 }}>{author?.name ?? "Someone"}</strong>
                            <p style={{ margin: "4px 0 0", fontSize: 14, whiteSpace: "pre-wrap" }}>
                              {n.body}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === "queue" && (
          <>
            {adding === "queue" ? (
              <AddBook memberId={memberId} onDone={() => setAdding(null)} />
            ) : (
              <button className="btn btn-primary btn-block" onClick={() => setAdding("queue")}>
                + Suggest a book
              </button>
            )}
            {queue.length === 0 ? (
              <EmptyState>Queue is empty. Anyone can suggest the next read.</EmptyState>
            ) : (
              <div className="stack-sm">
                {queue.map((book) => (
                  <BookRow
                    key={book.id}
                    book={book}
                    addedByName={byId.get(book.addedById)?.name}
                    actions={
                      <button
                        className="btn btn-block"
                        onClick={() => store.startReading(book.id)}
                      >
                        Start reading this
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "archive" && (
          <>
            {archive.length === 0 ? (
              <EmptyState>Finished books will show up here.</EmptyState>
            ) : (
              <div className="stack-sm">
                {archive.map((book) => (
                  <BookRow
                    key={book.id}
                    book={book}
                    addedByName={byId.get(book.addedById)?.name}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <div className="card stack" style={{ marginTop: 8 }}>
          <RoomLocalStorage roomCode={roomCode} includeAdmin={hasAdminAccess} />
          <RoomInviteSettings
            title="Invite members"
            hint="Invite readers from your contacts — they accept from their home screen."
            onReserveMembers={(slots) => {
              for (const slot of slots) {
                store.addMember({
                  id: slot.slotId,
                  name: slot.name,
                  color: slot.color,
                });
              }
            }}
          />
          <RoomCodeShare
            roomCode={roomCode}
            hint="Or share the code so members can join from their own devices."
          />
          <Link className="btn btn-ghost btn-block" href="/">
            Home
          </Link>
          <SwitchProfile currentName={me?.name} />
          <button className="btn btn-ghost btn-block" onClick={leaveRoom}>
            Leave room
          </button>
        </div>
      </div>
    </div>
  );
}
