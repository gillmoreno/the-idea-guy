import { migrateRoomSchema, parseRoomSchema } from "./migrate";
import {
  CURRENT_ENGINE_VERSION,
  type CollectionDef,
  type FeatureDef,
  type RoomSchema,
  type ValidationIssue,
  type ValidationResult,
} from "./types";

const SLUG_RE = /^[a-z][a-z0-9-]{0,47}$/;

function issue(path: string, message: string): ValidationIssue {
  return { path, message };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function validateCollection(c: unknown, index: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isRecord(c)) return [issue(`collections[${index}]`, "Must be an object")];
  if (typeof c.id !== "string" || !SLUG_RE.test(c.id)) {
    issues.push(issue(`collections[${index}].id`, "Required slug (a-z, 0-9, hyphen)"));
  }
  if (typeof c.label !== "string" || !c.label.trim()) {
    issues.push(issue(`collections[${index}].label`, "Required label"));
  }
  if (!Array.isArray(c.fields) || c.fields.length === 0) {
    issues.push(issue(`collections[${index}].fields`, "At least one field required"));
  } else {
    const keys = new Set<string>();
    c.fields.forEach((f, fi) => {
      if (!isRecord(f)) {
        issues.push(issue(`collections[${index}].fields[${fi}]`, "Must be an object"));
        return;
      }
      if (typeof f.key !== "string" || !f.key.trim()) {
        issues.push(issue(`collections[${index}].fields[${fi}].key`, "Field key required"));
      } else if (keys.has(f.key)) {
        issues.push(issue(`collections[${index}].fields[${fi}].key`, "Duplicate field key"));
      } else {
        keys.add(f.key);
      }
      if (typeof f.label !== "string" || !f.label.trim()) {
        issues.push(issue(`collections[${index}].fields[${fi}].label`, "Field label required"));
      }
      if (typeof f.type !== "string" || !f.type.trim()) {
        issues.push(issue(`collections[${index}].fields[${fi}].type`, "Field type required"));
      }
    });
  }
  return issues;
}

function validateFeature(
  f: unknown,
  index: number,
  collectionIds: Set<string>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isRecord(f) || typeof f.type !== "string") {
    return [issue(`features[${index}]`, "Feature must have a type")];
  }
  if (f.type === "votes" || f.type === "status") {
    if (typeof f.collection !== "string" || !collectionIds.has(f.collection)) {
      issues.push(issue(`features[${index}].collection`, "Must reference an existing collection id"));
    }
  }
  if (f.type === "status") {
    if (!Array.isArray(f.values) || f.values.length === 0) {
      issues.push(issue(`features[${index}].values`, "Status feature needs at least one value"));
    }
    if (f.setBy !== "owner" && f.setBy !== "member") {
      issues.push(issue(`features[${index}].setBy`, 'Must be "owner" or "member"'));
    }
  }
  return issues;
}

export function validateRoomSchema(input: unknown): ValidationResult {
  const parsed = parseRoomSchema(input);
  if (!parsed) {
    return { ok: false, issues: [issue("$", "Schema must be a JSON object")] };
  }

  const issues: ValidationIssue[] = [];

  if (typeof parsed.id !== "string" || !SLUG_RE.test(parsed.id)) {
    issues.push(issue("id", "Required slug id (a-z, 0-9, hyphen)"));
  }
  if (typeof parsed.name !== "string" || !parsed.name.trim()) {
    issues.push(issue("name", "Required display name"));
  }
  if (typeof parsed.emoji !== "string" || !parsed.emoji.trim()) {
    issues.push(issue("emoji", "Required emoji"));
  }
  if (!Array.isArray(parsed.collections) || parsed.collections.length === 0) {
    issues.push(issue("collections", "At least one collection required"));
  }

  const collectionIds = new Set<string>();
  parsed.collections?.forEach((c, i) => {
    issues.push(...validateCollection(c, i));
    if (isRecord(c) && typeof c.id === "string") collectionIds.add(c.id);
  });

  parsed.features?.forEach((f, i) => {
    issues.push(...validateFeature(f, i, collectionIds));
  });

  const migrated = migrateRoomSchema(parsed);
  if (!migrated) {
    return { ok: false, issues: [issue("$", "Could not parse schema")] };
  }

  if (!engineSupports(migrated)) {
    issues.push(
      issue(
        "engineVersion",
        `This schema needs engine v${migrated.engineVersion ?? 1}; app is v${CURRENT_ENGINE_VERSION}`,
      ),
    );
  }

  if (issues.length > 0) return { ok: false, issues };

  return { ok: true, schema: migrated, issues: [] };
}

function engineSupports(schema: RoomSchema): boolean {
  return CURRENT_ENGINE_VERSION >= (schema.engineVersion ?? 1);
}

export function parseAndValidateJson(text: string): ValidationResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, issues: [issue("$", "Invalid JSON — check commas and quotes")] };
  }
  return validateRoomSchema(raw);
}

export function getCollection(schema: RoomSchema, id: string): CollectionDef | undefined {
  return schema.collections.find((c) => c.id === id);
}

export function getFeatures(schema: RoomSchema, type: string): FeatureDef[] {
  return (schema.features ?? []).filter(
    (f): f is FeatureDef => typeof f === "object" && f !== null && (f as FeatureDef).type === type,
  );
}
