"use client";

import { useEffect, useState } from "react";
import { getBuiltinTemplate } from "@/templates/registry";

const SEEN_PREFIX = "rooms.howItWorksSeen.";

/** Three lines per room: first action · what the room gives you · how others come in. */
const HOW_IT_WORKS: Record<string, string[]> = {
  choreboard: [
    "Set up chores and allowance values, and add each kid by name — kids don't need their own device.",
    "Kids tick chores off on any device in the room; parents approve them.",
    "Allowance totals add up automatically from approved chores.",
  ],
  tripsplit: [
    "Log an expense whenever someone pays — pick who paid and who it covers.",
    "Balances shows who owes whom and the simplest way to settle up.",
    "Add travelers by name even if they never install the app — anyone here can log what they paid.",
  ],
  bookclub: [
    "Propose books and vote on what to read next.",
    "Set meetups and share discussion notes as you read.",
    "New members see the whole shelf and history the moment they join.",
  ],
  backlog: [
    "Add ideas to the shared pool as they come to you.",
    "Vote to surface what to build next.",
    "Works solo as your idea inbox — voting kicks in when others join.",
  ],
  roomledger: [
    "Log bills and shared purchases — pick who paid.",
    "The ledger tracks who owes whom; settling up clears it.",
    "Add flatmates by name — no app needed — and pick who paid; they claim their name if they join later.",
  ],
  whosin: [
    "Set up the recurring event and its capacity.",
    "Everyone RSVPs per date; overflow lands on the waitlist.",
    "Add the regulars by name now — they claim their name when they join with the room code.",
  ],
  doselog: [
    "Log each dose right when it's given — who gave what, when.",
    "The latest dose is always visible, so no accidental double doses.",
    "Add caregivers by name — they claim it when they join and see the same log.",
  ],
  carpool: [
    "Log each drive as it happens.",
    "The fairness counter shows whose turn is next; swaps even out over time.",
    "Invite the other parents — everyone sees the same tally.",
  ],
  gamenight: [
    "Record results after each game — wins, streaks, and the scoreboard update live.",
    "The board carries across nights, so rivalries accumulate.",
    "Add players by name right from the log form — nobody needs the app to be on the scoreboard.",
  ],
  carecircle: [
    "Log visits — yours or on someone's behalf — and updates so the family stays in sync.",
    "See who's up next and what the doctor said.",
    "Add the circle by name; everyone claims their name when they join.",
  ],
  cabincal: [
    "Claim the dates you want — clashes are flagged immediately.",
    "Fair-nights tracking shows who's had the most time.",
    "Add co-owners by name and claim dates for them — they claim their name when they join.",
  ],
  bracket: [
    "Add players by name — nobody needs the app to be in the bracket.",
    "Shuffle & start, then tap the winner of each match; the bracket advances itself.",
    "Players who join later tap their name to claim it and report their own results.",
  ],
  carlog: [
    "Log fill-ups, odometer readings, and who has the car.",
    "Service history lives in one place for everyone who drives it.",
    "Invite the other drivers with the room code.",
  ],
  coparent: [
    "Add your co-parent by name and plan whose house the kids are at — overlaps get flagged.",
    "Share updates in the feed instead of scattered texts.",
    "The Money tab tracks kid expenses and closes each month to one transfer.",
  ],
  groupfund: [
    "Set the target — what you're saving for and how much it costs.",
    "Anyone chips in — log cash someone hands you under their name; the bar fills per person.",
    "The room tracks pledges — actual money moves wherever you normally move it.",
  ],
  sitcoop: [
    "Earn hours by sitting for other families; spend them going out.",
    "Every sit is logged, so balances stay fair.",
    "Add the other families by name to start logging sits — they claim their family when they join.",
  ],
  supperclub: [
    "Plan the next dinner — fair hosting picks who's up.",
    "Propose themes and vote on them.",
    "Add members by name — the hosting rotation works right away; dinner history keeps the record.",
  ],
  symptomdiary: [
    "Log symptoms as they happen — severity 1–5 and who noticed.",
    "History groups by day, ready to show the doctor.",
    "Anyone caring for the same person can join and add what they see.",
  ],
  fitcrew: [
    "Log workouts as you do them — streaks and the weekly board update live.",
    "Silly prizes keep it competitive.",
    "Friends join with the room code and log from their own phones.",
  ],
  scorepad: [
    "Add players by name and start a game — nobody else needs the app.",
    "Score each round from one phone; totals and the leader update live.",
    "Finished games land in History with their champions; joiners claim their name.",
  ],
};

const GENERIC: string[] = [
  "Add entries — everything saves on this device first, then syncs to the room.",
  "Everyone who joins sees the same data, live.",
  "Share the invite link from room settings to bring people in.",
];

/**
 * "How this room works" in three lines: auto-opens the first time a device
 * opens a room of this type, and stays reachable via the floating "?" button.
 */
export function RoomExplainer({ templateId }: { templateId: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_PREFIX + templateId)) setOpen(true);
    } catch {
      // storage unavailable — stay closed, the "?" button still works
    }
  }, [templateId]);

  const dismiss = () => {
    try {
      localStorage.setItem(SEEN_PREFIX + templateId, "1");
    } catch {
      // best effort
    }
    setOpen(false);
  };

  const def = getBuiltinTemplate(templateId);
  const bullets = HOW_IT_WORKS[templateId] ?? GENERIC;

  return (
    <>
      {open && (
        <div className="modal-overlay" role="presentation" onClick={dismiss}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="room-explainer-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon">{def?.emoji ?? "🏠"}</div>
            <h2 id="room-explainer-title" className="modal-title">
              How {def?.name ?? "this room"} works
            </h2>
            <div className="modal-message">
              {def?.description && (
                <p className="muted" style={{ marginTop: 0 }}>
                  {def.description}
                </p>
              )}
              <ul style={{ margin: 0, paddingLeft: 18, textAlign: "left" }} className="stack-sm">
                {bullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
                🔒 End-to-end encrypted — only people in this room can read any of it.
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary btn-block" onClick={dismiss}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        type="button"
        className="room-help-fab"
        aria-label="How this room works"
        title="How this room works"
        onClick={() => setOpen(true)}
      >
        ?
      </button>
    </>
  );
}
