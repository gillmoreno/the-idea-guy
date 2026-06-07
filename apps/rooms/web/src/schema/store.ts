import { Y, isYMap } from "@the-idea-guy/room-kit";
import {
  ensureNestedMap,
  ensureTemplateBranch,
  readNestedMap,
  readTemplateBranch,
} from "@/lib/yjsTemplate";
import { DECLARATIVE_TEMPLATE_ID } from "@the-idea-guy/room-kit";
import { writeRoomMeta } from "@/shell/roomMeta";
import type { RoomSchema, SchemaMember, SchemaRecord } from "./types";

export const SCHEMA_BRANCH_ID = DECLARATIVE_TEMPLATE_ID;

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export class SchemaStore {
  readonly publicDoc: Y.Doc;
  readonly adminDoc: Y.Doc | null;
  readonly schema: RoomSchema;

  constructor(publicDoc: Y.Doc, adminDoc: Y.Doc | null, schema: RoomSchema) {
    this.publicDoc = publicDoc;
    this.adminDoc = adminDoc;
    this.schema = schema;
  }

  private readBoardMap(): Y.Map<unknown> | null {
    const pub = readTemplateBranch(this.publicDoc, SCHEMA_BRANCH_ID);
    return pub ? readNestedMap(pub, "board") : null;
  }

  private readMembersMap(): Y.Map<SchemaMember> | null {
    const pub = readTemplateBranch(this.publicDoc, SCHEMA_BRANCH_ID);
    return pub ? readNestedMap<SchemaMember>(pub, "members") : null;
  }

  private readRecordsMap(collectionId: string): Y.Map<SchemaRecord> | null {
    const pub = readTemplateBranch(this.publicDoc, SCHEMA_BRANCH_ID);
    if (!pub) return null;
    const data = readNestedMap(pub, "data");
    if (!data) return null;
    const bucket = data.get(collectionId);
    return isYMap(bucket) ? (bucket as Y.Map<SchemaRecord>) : null;
  }

  private readVotesBucket(collectionId: string, recordId: string): Y.Map<number> | null {
    const pub = readTemplateBranch(this.publicDoc, SCHEMA_BRANCH_ID);
    if (!pub) return null;
    const votes = readNestedMap(pub, "votes");
    if (!votes) return null;
    const col = votes.get(collectionId);
    if (!isYMap(col)) return null;
    const bucket = (col as Y.Map<unknown>).get(recordId);
    return isYMap(bucket) ? (bucket as Y.Map<number>) : null;
  }

  isInitialized(): boolean {
    const board = this.readBoardMap();
    return typeof board?.get("name") === "string";
  }

  getBoardName(): string | null {
    const name = this.readBoardMap()?.get("name");
    return typeof name === "string" ? name : null;
  }

  initRoom(input: { roomName: string; schema: RoomSchema }, organizerId: string) {
    this.publicDoc.transact(() => {
      writeRoomMeta(this.publicDoc, {
        templateKind: "declarative",
        templateId: DECLARATIVE_TEMPLATE_ID,
        roomName: input.roomName,
        schema: input.schema,
      });
      const pub = ensureTemplateBranch(this.publicDoc, SCHEMA_BRANCH_ID);
      const board = ensureNestedMap(pub, "board");
      board.set("name", input.roomName.trim());
      board.set("createdAt", Date.now());
      board.set("schemaId", input.schema.id);
      ensureNestedMap<SchemaMember>(pub, "members");
      const data = ensureNestedMap(pub, "data");
      for (const col of input.schema.collections) {
        ensureNestedMap<SchemaRecord>(data, col.id);
      }
      ensureNestedMap(pub, "votes");
    });
    if (this.adminDoc) {
      this.adminDoc.transact(() => {
        writeRoomMeta(this.adminDoc!, {
          templateKind: "declarative",
          templateId: DECLARATIVE_TEMPLATE_ID,
          roomName: input.roomName,
          schema: input.schema,
        });
      });
    }
    void organizerId;
  }

  listMembers(): SchemaMember[] {
    const members = this.readMembersMap();
    if (!members) return [];
    return [...members.values()].sort((a, b) => a.joinedAt - b.joinedAt);
  }

  getMember(id: string): SchemaMember | null {
    return this.readMembersMap()?.get(id) ?? null;
  }

  addMember(input: { name: string; color: string; id?: string }): SchemaMember {
    const member: SchemaMember = {
      id: input.id ?? uid("m_"),
      name: input.name.trim(),
      color: input.color,
      joinedAt: Date.now(),
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, SCHEMA_BRANCH_ID);
      const members = ensureNestedMap<SchemaMember>(pub, "members");
      members.set(member.id, member);
    });
    return member;
  }

  listRecords(collectionId: string): SchemaRecord[] {
    const records = this.readRecordsMap(collectionId);
    if (!records) return [];
    return [...records.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  addRecord(
    collectionId: string,
    input: { fields: Record<string, string | string[]>; createdById: string; status?: string },
  ): SchemaRecord {
    const record: SchemaRecord = {
      id: uid("r_"),
      collectionId,
      createdAt: Date.now(),
      createdById: input.createdById,
      fields: input.fields,
      status: input.status,
    };
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, SCHEMA_BRANCH_ID);
      const data = ensureNestedMap(pub, "data");
      let bucket = data.get(collectionId);
      if (!isYMap(bucket)) {
        bucket = new Y.Map();
        data.set(collectionId, bucket);
      }
      (bucket as Y.Map<SchemaRecord>).set(record.id, record);
    });
    return record;
  }

  setRecordStatus(collectionId: string, recordId: string, status: string) {
    const record = this.readRecordsMap(collectionId)?.get(recordId);
    if (!record) return;
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, SCHEMA_BRANCH_ID);
      const data = ensureNestedMap(pub, "data");
      const bucket = ensureNestedMap<SchemaRecord>(data, collectionId);
      bucket.set(recordId, { ...record, status });
    });
  }

  getVoteCount(collectionId: string, recordId: string): number {
    return this.readVotesBucket(collectionId, recordId)?.size ?? 0;
  }

  hasVoted(collectionId: string, recordId: string, memberId: string): boolean {
    return this.readVotesBucket(collectionId, recordId)?.has(memberId) ?? false;
  }

  toggleVote(collectionId: string, recordId: string, memberId: string): boolean {
    let voted = false;
    this.publicDoc.transact(() => {
      const pub = ensureTemplateBranch(this.publicDoc, SCHEMA_BRANCH_ID);
      const votes = ensureNestedMap(pub, "votes");
      let col = votes.get(collectionId);
      if (!isYMap(col)) {
        col = new Y.Map();
        votes.set(collectionId, col);
      }
      let bucket = (col as Y.Map<unknown>).get(recordId);
      if (!isYMap(bucket)) {
        bucket = new Y.Map();
        (col as Y.Map<unknown>).set(recordId, bucket);
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

  listRecordsSortedByVotes(collectionId: string): SchemaRecord[] {
    return this.listRecords(collectionId).sort((a, b) => {
      const diff =
        this.getVoteCount(collectionId, b.id) - this.getVoteCount(collectionId, a.id);
      return diff !== 0 ? diff : b.createdAt - a.createdAt;
    });
  }
}
