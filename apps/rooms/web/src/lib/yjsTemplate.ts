import { Y, isYMap } from "@the-idea-guy/room-kit";

/** Read-only — safe during React render. Never mutates the doc. */
export function readTemplateBranch(doc: Y.Doc, templateId: string): Y.Map<unknown> | null {
  const branch = doc.getMap("template").get(templateId);
  return isYMap(branch) ? (branch as Y.Map<unknown>) : null;
}

/** Read-only — safe during React render. */
export function readNestedMap<T>(parent: Y.Map<unknown>, key: string): Y.Map<T> | null {
  const m = parent.get(key);
  return isYMap(m) ? (m as Y.Map<T>) : null;
}

/** Call only inside `doc.transact()`. Creates template branch if missing. */
export function ensureTemplateBranch(doc: Y.Doc, templateId: string): Y.Map<unknown> {
  const root = doc.getMap("template");
  let branch = root.get(templateId);
  if (!isYMap(branch)) {
    branch = new Y.Map();
    root.set(templateId, branch);
  }
  return branch as Y.Map<unknown>;
}

/** Call only inside `doc.transact()`. Creates nested map if missing. */
export function ensureNestedMap<T>(parent: Y.Map<unknown>, key: string): Y.Map<T> {
  let m = parent.get(key);
  if (!isYMap(m)) {
    m = new Y.Map();
    parent.set(key, m);
  }
  return m as Y.Map<T>;
}
