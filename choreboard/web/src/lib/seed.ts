import { ChoreStore } from "./store";
import { Category, Difficulty, Recurrence } from "./types";

interface SeedChore {
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  reward: number;
  recurrence: Recurrence;
  requiresApproval: boolean;
}

// Sensible defaults parents can edit. Prices are placeholders (USD).
export const SEED_CHORES: SeedChore[] = [
  { title: "Make your bed", description: "Tidy sheets and pillows.", category: "bedroom", difficulty: "very-easy", reward: 0.5, recurrence: "daily", requiresApproval: false },
  { title: "Feed the pet", description: "Food and fresh water.", category: "general", difficulty: "very-easy", reward: 0.5, recurrence: "daily", requiresApproval: false },
  { title: "Set the table", description: "Plates, cutlery, glasses.", category: "kitchen", difficulty: "easy", reward: 1, recurrence: "daily", requiresApproval: false },
  { title: "Clear & wipe the table", description: "After a meal.", category: "kitchen", difficulty: "easy", reward: 1, recurrence: "daily", requiresApproval: false },
  { title: "Tidy your room", description: "Toys away, floor clear.", category: "bedroom", difficulty: "easy", reward: 1, recurrence: "anytime", requiresApproval: false },
  { title: "Tidy the living room", description: "Cushions, clutter, surfaces.", category: "living-room", difficulty: "medium", reward: 2, recurrence: "anytime", requiresApproval: true },
  { title: "Clean the bathroom", description: "Sink, toilet, mirror, floor.", category: "bathroom", difficulty: "medium", reward: 3, recurrence: "weekly", requiresApproval: true },
  { title: "Vacuum a room", description: "Whole floor, edges included.", category: "general", difficulty: "medium", reward: 2, recurrence: "anytime", requiresApproval: true },
  { title: "Full laundry cycle", description: "Wash, hang/dry, fold, put away.", category: "laundry", difficulty: "hard", reward: 4, recurrence: "weekly", requiresApproval: true },
  { title: "Take out trash & recycling", description: "All bins, replace liners.", category: "general", difficulty: "easy", reward: 1, recurrence: "anytime", requiresApproval: false },
];

export function seedChores(store: ChoreStore) {
  for (const c of SEED_CHORES) store.addChore(c);
}
