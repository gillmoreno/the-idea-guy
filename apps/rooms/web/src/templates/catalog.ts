import type { CatalogTemplateDef } from "./registry";
import { validateRoomSchema } from "@/schema/validate";

export interface CatalogFile {
  version: number;
  templates: CatalogTemplateDef[];
}

let cache: CatalogTemplateDef[] | null = null;

export async function loadOfficialCatalog(): Promise<CatalogTemplateDef[]> {
  if (cache) return cache;
  try {
    const res = await fetch("/catalog/v1.json");
    if (!res.ok) return [];
    const data = (await res.json()) as CatalogFile;
    const valid: CatalogTemplateDef[] = [];
    for (const entry of data.templates ?? []) {
      const result = validateRoomSchema(entry.schema);
      if (result.ok && result.schema) {
        valid.push({
          kind: "declarative",
          id: entry.id,
          name: entry.name,
          description: entry.description,
          emoji: entry.emoji,
          accent: entry.accent,
          schema: result.schema,
        });
      }
    }
    cache = valid;
    return valid;
  } catch {
    return [];
  }
}
