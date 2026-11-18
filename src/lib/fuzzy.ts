/**
 * Typo and plural handling for prompts. A word the interpreter does not know is
 * compared with the words it does know, and only a very likely typo is fixed.
 * Being wrong is worse than doing nothing, so the rules are strict:
 *
 *  - only words of 5+ letters that start with the same letter are considered;
 *  - a swap of two neighbouring letters, one missing letter or one extra letter is accepted;
 *  - a changed letter is accepted only in a long word (7+ letters), away from the
 *    ending, or when one vowel replaces another ("bakary" for "bakery"), so
 *    ordinary words like "designed", "teaches" and "trained" stay as they are;
 *  - if two different known words fit equally well, nothing is changed.
 */

export interface Correction {
  from: string;
  to: string;
}

/** Edit distance counting a swap of two neighbouring letters as one edit. Stops early above `max`. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    rows.push(new Array<number>(b.length + 1).fill(0));
    rows[i][0] = i;
  }
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, rows[i - 2][j - 2] + 1);
      }
      rows[i][j] = value;
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > max) return max + 1;
  }
  return rows[a.length][b.length];
}

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

/** Whether `word` is an acceptable typo of `known` (see the rules at the top of this file). */
function isLikelyTypo(word: string, known: string): boolean {
  if (known.length < 5 || word[0] !== known[0]) return false;
  const lengthDiff = Math.abs(word.length - known.length);
  const max = known.length >= 10 ? 2 : 1;
  if (lengthDiff > max) return false;
  const distance = editDistance(word, known, max);
  if (distance === 0 || distance > max) return false;

  // Two edits are only trusted in long words that agree on their first three letters.
  if (distance === 2) return known.length >= 10 && word.slice(0, 3) === known.slice(0, 3);

  if (lengthDiff === 1) {
    // A missing or extra letter. At the very end it is only a typo when it doubles the letter before
    // ("coffe" for "coffee"); otherwise it is an ordinary ending, as in "stable" and "stables".
    const longer = word.length > known.length ? word : known;
    const shorter = word.length > known.length ? known : word;
    if (longer.slice(0, -1) === shorter) return longer.at(-1) === longer.at(-2);
    return true;
  }

  // Same length: a swap of neighbours, or a single changed letter.
  const mismatches: number[] = [];
  for (let i = 0; i < word.length; i++) if (word[i] !== known[i]) mismatches.push(i);
  if (mismatches.length === 2 && mismatches[1] === mismatches[0] + 1 && word[mismatches[0]] === known[mismatches[1]]) {
    return true; // neighbouring letters swapped
  }
  if (mismatches.length !== 1) return false;
  const at = mismatches[0];
  if (VOWELS.has(word[at]) && VOWELS.has(known[at]) && at < known.length - 1) return true;
  return known.length >= 7 && at < known.length - 2;
}

/** Ways a plural could be written as a singular. */
export function singularCandidates(word: string): string[] {
  const candidates: string[] = [];
  if (word.endsWith("ies")) candidates.push(`${word.slice(0, -3)}y`);
  if (word.endsWith("es")) candidates.push(word.slice(0, -2));
  if (word.endsWith("s")) candidates.push(word.slice(0, -1));
  return candidates;
}

/** The singular form of a plural word, if that is a known word. */
function singular(word: string, known: ReadonlySet<string>): string | null {
  return singularCandidates(word).find((c) => known.has(c)) ?? null;
}

export type WordFix = { kind: "known" | "plural" | "typo" | "unknown"; word: string };

/** Looks a word up: as written, as a plural of a known word, as a likely typo, or not at all. */
export function resolveWord(word: string, known: ReadonlySet<string>): WordFix {
  if (known.has(word)) return { kind: "known", word };
  const base = singular(word, known);
  if (base) return { kind: "plural", word: base };
  if (word.length >= 5 && /^[a-z]+$/.test(word)) {
    let best: string | null = null;
    let bestDistance = Infinity;
    let tied = false;
    for (const candidate of known) {
      if (!isLikelyTypo(word, candidate)) continue;
      const distance = editDistance(word, candidate, 2);
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
        tied = false;
      } else if (distance === bestDistance && candidate !== best) {
        tied = true;
      }
    }
    if (best && !tied) return { kind: "typo", word: best };
  }
  return { kind: "unknown", word };
}

/**
 * Reads a prompt: returns its words with plurals and typos resolved, the prompt
 * text with typos fixed, and a list of the typos that were fixed.
 */
export function readPrompt(
  prompt: string,
  known: ReadonlySet<string>,
): { words: string[]; text: string; corrections: Correction[] } {
  const corrections: Correction[] = [];
  const seen = new Set<string>();
  const words: string[] = [];
  const text = prompt.replace(/[a-zà-ÿ0-9]+/gi, (token) => {
    const lower = token.toLowerCase();
    const fix = resolveWord(lower, known);
    words.push(fix.word);
    if (fix.kind !== "typo") return token;
    if (!seen.has(lower)) {
      seen.add(lower);
      corrections.push({ from: lower, to: fix.word });
    }
    return fix.word;
  });
  return { words, text, corrections };
}
