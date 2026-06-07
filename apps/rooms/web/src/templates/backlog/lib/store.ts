import { Y, isYMap } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import type { BacklogIdea, BoardSettings, IdeaStatus, Member } from "./types";
import { SEED_BACKLOG_IDEAS } from "./seed";

export const BACKLOG_TEMPLATE_ID = "backlog";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export class BacklogStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
  }

  private readBoardMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, BACKLOG_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "board") : null;
  }

  private readMembersMap(): Y.Map<Member> | null {
    const pub = readTemplateBranch(this.publicDoc, BACKLOG_TEMPLATE_ID);
    return pub ? readNestedMap<Member>(pub, "members") : null;
  }

  private readIdeasMap(): Y.Map<BacklogIdea> | null {
    const pub = readTemplateBranch(this.publicDoc, BACKLOG_TEMPLATE_ID);
    return pub ? readNestedMap<BacklogIdea>(pub, "ideas") : null;
  }

  private readVotesMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, BACKLOG_TEMPLATE_ID);
    return pub ? readNestedMap(pub, "votes") : null;
  }

  isInitialized(): boolean {
    const board = this.readBoardMap();
    return typeof board?.get("name") === "string";
  }

  getBoard(): BoardSettings | null {
    const board = this.readBoardMap();
    const name = board?.get("name");
    if (typeof name !== "string") return null;
    return {
      name,
      createdAt: (board?.get("createdAt") as number) ?? Date.now(),
    };
  }

  initBoard(settings: { name: string }, organizerId: string) {
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, BACKLOG_TEMPLATE_ID);
      const board = ensureNestedMap(pub, "board");
      board.set("name", settings.name.trim());
      board.set("createdAt", Date.now());
      ensureNestedMap(pub, "ideas");
      ensureNestedMap(pub, "votes");
      ensureNestedMap(pub, "members");
    });
    for (const seed of SEED_BACKLOG_IDEAS) {
      this.addIdea({
        title: seed.title,
        description: seed.description,
        emoji: seed.emoji,
        proposedById: organizerId,
        status: "proposed",
      });
    }
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
      const pub = ensureTemplateBranch(this.publicDoc, BACKLOG_TEMPLATE_ID);
      const members = ensureNestedMap<Member>(pub, "members");
      members.set(member.id, member);
    });
    return member;
  }

  private readIdeaVotes(ideaId: string): Y.Map<number> | null {
    const votes = this.readVotesMap();
    if (!votes) return null;
    const bucket = votes.get(ideaId);
    return isYMap(bucket) ? (bucket as Y.Map<number>) : null;
  }

  getVoteCount(ideaId: string): number {
    return this.readIdeaVotes(ideaId)?.size ?? 0;
  }

  hasVoted(ideaId: string, memberId: string): boolean {
    return this.readIdeaVotes(ideaId)?.has(memberId) ?? false;
  }

  toggleVote(ideaId: string, memberId: string): boolean {
    let voted = false;
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, BACKLOG_TEMPLATE_ID);
      const votes = ensureNestedMap(pub, "votes");
      let bucket = votes.get(ideaId);
      if (!isYMap(bucket)) {
        bucket = new Y.Map();
        votes.set(ideaId, bucket);
      }
      const b = bucket as Y.Map<number>;
      if (b.has(memberId)) {
        b.delete(memberId);
        voted = false;
      } else {
        b.set(memberId, Date.now());
        voted = true;
      }
    });
    return voted;
  }

  listIdeas(): BacklogIdea[] {
    const ideas = this.readIdeasMap();
    if (!ideas) return [];
    return [...ideas.values()].sort((a, b) => {
      const diff = this.getVoteCount(b.id) - this.getVoteCount(a.id);
      return diff !== 0 ? diff : b.proposedAt - a.proposedAt;
    });
  }

  addIdea(input: {
    title: string;
    description: string;
    emoji: string;
    proposedById: string;
    status?: IdeaStatus;
  }): BacklogIdea {
    const idea: BacklogIdea = {
      id: uid("i_"),
      title: input.title.trim(),
      description: input.description.trim(),
      emoji: input.emoji.trim() || "💡",
      status: input.status ?? "proposed",
      proposedById: input.proposedById,
      proposedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, BACKLOG_TEMPLATE_ID);
      const ideas = ensureNestedMap<BacklogIdea>(pub, "ideas");
      ideas.set(idea.id, idea);
    });
    return idea;
  }

  setStatus(ideaId: string, status: IdeaStatus) {
    const idea = this.readIdeasMap()?.get(ideaId);
    if (!idea) return;
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, BACKLOG_TEMPLATE_ID);
      const ideas = ensureNestedMap<BacklogIdea>(pub, "ideas");
      ideas.set(ideaId, { ...idea, status });
    });
  }
}
