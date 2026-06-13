import type { RoomSchema } from "./types";

/** Load into paste box for quick testing without AI. */
export const EXAMPLE_SCHEMAS: { id: string; label: string; schema: RoomSchema }[] = [
  {
    id: "watch-club",
    label: "Watch Club — series queue",
    schema: {
      schemaVersion: 1,
      engineVersion: 1,
      id: "watch-club",
      name: "Watch Club",
      description: "Queue shows and movies — vote on what to watch next.",
      emoji: "🍿",
      accent: "#e11d48",
      collections: [
        {
          id: "shows",
          label: "Watchlist",
          singular: "show",
          fields: [
            { key: "title", label: "Title", type: "text", required: true },
            { key: "emoji", label: "Emoji", type: "emoji" },
            { key: "pitch", label: "Why watch?", type: "textarea" },
            { key: "platform", label: "Where", type: "tags" },
          ],
          views: ["list", "add"],
          permissions: { create: "member" },
        },
      ],
      features: [
        { type: "votes", collection: "shows", onePerMember: true },
        {
          type: "status",
          collection: "shows",
          values: [
            { id: "queued", label: "Queued" },
            { id: "watching", label: "Watching" },
            { id: "finished", label: "Finished" },
          ],
          setBy: "owner",
        },
      ],
    },
  },
  {
    id: "brick-fixture",
    label: "Brick fixture — test every v1 element",
    schema: {
      schemaVersion: 1,
      engineVersion: 1,
      id: "brick-fixture",
      name: "Brick Fixture",
      description: "QA room — one record should exercise text, textarea, tags, emoji, votes, and status.",
      emoji: "🧪",
      accent: "#7c3aed",
      collections: [
        {
          id: "items",
          label: "Test items",
          singular: "item",
          fields: [
            { key: "title", label: "Title (text)", type: "text", required: true },
            { key: "emoji", label: "Emoji", type: "emoji" },
            { key: "notes", label: "Notes (textarea)", type: "textarea" },
            { key: "labels", label: "Labels (tags)", type: "tags" },
            { key: "photo", label: "Photo (image)", type: "image" },
            { key: "cost", label: "Cost (money)", type: "money" },
            { key: "due", label: "Due (date)", type: "date" },
            { key: "people", label: "People (person-list)", type: "person-list" },
          ],
          views: ["list", "add"],
          permissions: { create: "member" },
        },
      ],
      features: [
        { type: "votes", collection: "items", onePerMember: true },
        {
          type: "status",
          collection: "items",
          values: [
            { id: "open", label: "Open" },
            { id: "done", label: "Done" },
          ],
          setBy: "owner",
        },
      ],
    },
  },
  {
    id: "weekend-plans",
    label: "Weekend Plans — group poll",
    schema: {
      schemaVersion: 1,
      engineVersion: 1,
      id: "weekend-plans",
      name: "Weekend Plans",
      description: "Friends propose ideas and vote on the plan.",
      emoji: "🎉",
      accent: "#06b6d4",
      collections: [
        {
          id: "plans",
          label: "Ideas",
          singular: "idea",
          fields: [
            { key: "title", label: "Plan", type: "text", required: true },
            { key: "details", label: "Details", type: "textarea" },
          ],
          views: ["list", "add"],
          permissions: { create: "member" },
        },
      ],
      features: [{ type: "votes", collection: "plans", onePerMember: true }],
    },
  },
];
