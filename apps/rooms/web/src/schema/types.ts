/**
 * Declarative room schema — versioned Lego bricks for SchemaEngine.
 *
 * - `schemaVersion`: shape of this JSON document (migrate on load).
 * - `engineVersion`: minimum SchemaEngine that understands all features used.
 * - Unknown field types / feature types are ignored by older engines (forward compat).
 */

export const CURRENT_SCHEMA_VERSION = 1;
// v2: adds money/date/person-list field types + the `balance` feature (TripSplit port).
export const CURRENT_ENGINE_VERSION = 2;

/** Built-in field bricks — extend over time; unknown types render as read-only text. */
export type KnownFieldType =
  | "text"
  | "textarea"
  | "tags"
  | "emoji"
  | "image"
  | "person"
  /** Decimal amount stored as a major-units string; rendered via kit MoneyAmount. */
  | "money"
  /** Calendar date stored as a `YYYY-MM-DD` string. */
  | "date"
  /** Multiple member ids (stored as string[]); rendered via kit SplitView. */
  | "person-list";

export interface FieldDef {
  key: string;
  label: string;
  type: KnownFieldType | string;
  required?: boolean;
}

export interface CollectionDef {
  id: string;
  label: string;
  singular?: string;
  fields: FieldDef[];
  /** View ids — extend over time (`list`, `add`, `detail`, …). */
  views?: string[];
  permissions?: {
    create?: "member" | "owner";
    edit?: "member" | "owner";
  };
}

export interface StatusValue {
  id: string;
  label: string;
}

/** Feature bricks — discriminated by `type`; unknown types are preserved but skipped. */
export type FeatureDef =
  | { type: "votes"; collection: string; onePerMember?: boolean }
  | {
      type: "status";
      collection: string;
      values: StatusValue[];
      setBy: "owner" | "member";
    }
  | {
      /**
       * Expense-splitting: computes who-owes-whom across a collection and renders
       * a balances/settle-up panel. `fields` maps to the record field keys that
       * hold the amount (money), payer (person) and participants (person-list).
       */
      type: "balance";
      collection: string;
      fields: {
        amount: string;
        paidBy: string;
        splitAmong: string;
        date?: string;
      };
    }
  | { type: string; [key: string]: unknown };

export interface RoomSchema {
  schemaVersion: number;
  /** Minimum engine build that must understand this schema's features. */
  engineVersion?: number;
  id: string;
  name: string;
  description?: string;
  emoji: string;
  accent?: string;
  collections: CollectionDef[];
  features?: FeatureDef[];
  /** Reserved — future user extensions without breaking older rooms. */
  extensions?: Record<string, unknown>;
}

export interface SchemaMember {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface SchemaRecord {
  id: string;
  collectionId: string;
  createdAt: number;
  createdById: string;
  fields: Record<string, string | string[]>;
  status?: string;
  /** Member who last set `status` (older records/engines: undefined). */
  statusById?: string;
  statusAt?: number;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  schema?: RoomSchema;
  issues: ValidationIssue[];
}
