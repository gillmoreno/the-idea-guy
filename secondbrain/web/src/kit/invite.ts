// Human-friendly invite codes: a few easy words families can read to each
// other or scan. The code is the only secret needed to join a family's data.
const WORDS = [
  "apple", "river", "tiger", "cloud", "maple", "ocean", "amber", "comet",
  "lemon", "pixel", "raven", "willow", "cedar", "coral", "ember", "ivory",
  "mango", "nova", "olive", "pearl", "quartz", "robin", "sage", "topaz",
  "violet", "wave", "zephyr", "breeze", "flint", "glow", "honey", "jade",
];

function rand(max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}

/** e.g. "amber-tiger-maple-river" */
export function generateInviteCode(words = 4): string {
  return Array.from({ length: words }, () => WORDS[rand(WORDS.length)]).join("-");
}
