import { ChoreStore } from "./store";
import { Category, ChoreFrequencyLimit, Difficulty } from "./types";

interface SeedChore {
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  reward: number;
  frequencyLimit: ChoreFrequencyLimit;
  requiresApproval: boolean;
}

// Sensible defaults parents can edit. Prices are placeholders (USD).
export const SEED_CHORES: SeedChore[] = [
  { title: "Make your bed", description: "Tidy sheets and pillows.", category: "bedroom", difficulty: "very-easy", reward: 0.5, frequencyLimit: { maxCompletions: 1, period: "day" }, requiresApproval: false },
  { title: "Feed the pet", description: "Food and fresh water.", category: "general", difficulty: "very-easy", reward: 0.5, frequencyLimit: { maxCompletions: 1, period: "day" }, requiresApproval: false },
  { title: "Set the table", description: "Plates, cutlery, glasses.", category: "kitchen", difficulty: "easy", reward: 1, frequencyLimit: { maxCompletions: 1, period: "day" }, requiresApproval: false },
  { title: "Clear & wipe the table", description: "After a meal.", category: "kitchen", difficulty: "easy", reward: 1, frequencyLimit: { maxCompletions: 1, period: "day" }, requiresApproval: false },
  { title: "Tidy your room", description: "Toys away, floor clear.", category: "bedroom", difficulty: "easy", reward: 1, frequencyLimit: { maxCompletions: 0, period: "day" }, requiresApproval: false },
  { title: "Tidy the living room", description: "Cushions, clutter, surfaces.", category: "living-room", difficulty: "medium", reward: 2, frequencyLimit: { maxCompletions: 0, period: "day" }, requiresApproval: true },
  { title: "Clean the bathroom", description: "Sink, toilet, mirror, floor.", category: "bathroom", difficulty: "medium", reward: 3, frequencyLimit: { maxCompletions: 1, period: "week" }, requiresApproval: true },
  { title: "Vacuum a room", description: "Whole floor, edges included.", category: "general", difficulty: "medium", reward: 2, frequencyLimit: { maxCompletions: 0, period: "day" }, requiresApproval: true },
  { title: "Full laundry cycle", description: "Wash, hang/dry, fold, put away.", category: "laundry", difficulty: "hard", reward: 4, frequencyLimit: { maxCompletions: 1, period: "week" }, requiresApproval: true },
  { title: "Take out trash & recycling", description: "All bins, replace liners.", category: "general", difficulty: "easy", reward: 1, frequencyLimit: { maxCompletions: 0, period: "day" }, requiresApproval: false },
];

export function seedChores(store: ChoreStore) {
  for (const c of SEED_CHORES) store.addChore(c);
}
