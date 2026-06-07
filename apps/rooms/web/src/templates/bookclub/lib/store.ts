import { Y } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import type { Book, BookStatus, ClubSettings, Member, Note } from "./types";

export const BOOKCLUB_TEMPLATE_ID = "bookclub";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export class BookClubStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private readClubMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, BOOKCLUB_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "club") : null;
  }

  private readMembersMap(): Y.Map<Member> | null {
    const pub = readTemplateBranch(this.publicDoc, BOOKCLUB_TEMPLATE_ID);
    return pub ? readNestedMap<Member>(pub, "members") : null;
  }

  private readBooksMap(): Y.Map<Book> | null {
    const pub = readTemplateBranch(this.publicDoc, BOOKCLUB_TEMPLATE_ID);
    return pub ? readNestedMap<Book>(pub, "books") : null;
  }

  private readNotesMap(): Y.Map<Note> | null {
    const pub = readTemplateBranch(this.publicDoc, BOOKCLUB_TEMPLATE_ID);
    return pub ? readNestedMap<Note>(pub, "notes") : null;
  }

  isInitialized(): boolean {
    const club = this.readClubMap();
    return typeof club?.get("name") === "string";
  }

  getClub(): ClubSettings | null {
    const club = this.readClubMap();
    const name = club?.get("name");
    if (typeof name !== "string") return null;
    return {
      name,
      createdAt: (club?.get("createdAt") as number) ?? Date.now(),
    };
  }

  initClub(settings: { name: string }) {
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, BOOKCLUB_TEMPLATE_ID);
      const club = ensureNestedMap(pub, "club");
      club.set("name", settings.name.trim());
      club.set("createdAt", Date.now());
      ensureNestedMap<Member>(pub, "members");
      ensureNestedMap<Book>(pub, "books");
      ensureNestedMap<Note>(pub, "notes");
    });
  }

  listMembers(): Member[] {
    const members = this.readMembersMap();
    if (!members) return [];
    return [...members.values()].sort((a, b) => a.joinedAt - b.joinedAt);
  }

  getMember(id: string): Member | null {
    return this.readMembersMap()?.get(id) ?? null;
  }

  addMember(input: { name: string; color: string; id?: string }): Member {
    const member: Member = {
      id: input.id ?? uid("m_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, BOOKCLUB_TEMPLATE_ID);
      const members = ensureNestedMap<Member>(pub, "members");
      members.set(member.id, member);
    });
    return member;
  }

  listBooks(status?: BookStatus): Book[] {
    const books = this.readBooksMap();
    if (!books) return [];
    const all = [...books.values()];
    const filtered = status ? all.filter((b) => b.status === status) : all;
    return filtered.sort((a, b) => {
      if (a.status === "reading" && b.status !== "reading") return -1;
      if (b.status === "reading" && a.status !== "reading") return 1;
      if (a.status === "queued" && b.status === "queued") return a.addedAt - b.addedAt;
      if (a.status === "done" && b.status === "done") {
        return (b.finishedAt ?? b.addedAt) - (a.finishedAt ?? a.addedAt);
      }
      return b.addedAt - a.addedAt;
    });
  }

  getCurrentBook(): Book | null {
    return this.listBooks("reading")[0] ?? null;
  }

  addBook(input: {
    title: string;
    author: string;
    status?: BookStatus;
    meetingDate?: string;
    addedById: string;
  }): Book {
    const book: Book = {
      id: uid("b_"),
      title: input.title.trim(),
      author: input.author.trim(),
      status: input.status ?? "queued",
      meetingDate: input.meetingDate,
      addedById: input.addedById,
      addedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, BOOKCLUB_TEMPLATE_ID);
      const books = ensureNestedMap<Book>(pub, "books");
      books.set(book.id, book);
    });
    return book;
  }

  startReading(bookId: string, meetingDate?: string) {
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, BOOKCLUB_TEMPLATE_ID);
      const books = ensureNestedMap<Book>(pub, "books");
      for (const [, book] of books) {
        if (book.status === "reading" && book.id !== bookId) {
          books.set(book.id, {
            ...book,
            status: "done",
            finishedAt: Date.now(),
            meetingDate: undefined,
          });
        }
      }
      const target = books.get(bookId);
      if (!target) return;
      books.set(bookId, {
        ...target,
        status: "reading",
        meetingDate: meetingDate ?? target.meetingDate,
      });
    });
  }

  markDone(bookId: string) {
    const book = this.readBooksMap()?.get(bookId);
    if (!book) return;
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, BOOKCLUB_TEMPLATE_ID);
      const books = ensureNestedMap<Book>(pub, "books");
      books.set(bookId, {
        ...book,
        status: "done",
        finishedAt: Date.now(),
        meetingDate: undefined,
      });
    });
  }

  updateMeetingDate(bookId: string, meetingDate: string) {
    const book = this.readBooksMap()?.get(bookId);
    if (!book) return;
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, BOOKCLUB_TEMPLATE_ID);
      const books = ensureNestedMap<Book>(pub, "books");
      books.set(bookId, { ...book, meetingDate });
    });
  }

  listNotes(bookId: string): Note[] {
    const notes = this.readNotesMap();
    if (!notes) return [];
    return [...notes.values()]
      .filter((n) => n.bookId === bookId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  addNote(input: { bookId: string; authorId: string; body: string }): Note {
    const note: Note = {
      id: uid("n_"),
      bookId: input.bookId,
      authorId: input.authorId,
      body: input.body.trim(),
      createdAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, BOOKCLUB_TEMPLATE_ID);
      const notes = ensureNestedMap<Note>(pub, "notes");
      notes.set(note.id, note);
    });
    return note;
  }
}
