/**
 * Regular-expression matcher that cannot backtrack.
 *
 * The service worker has to evaluate rules itself (page titles, single-page-app
 * navigations), and the built-in RegExp engine can take minutes on a pattern such
 * as `a*a*a*a*b`, freezing every tab check and the UI with it. This matcher
 * simulates all alternatives at once (Thompson construction), so the cost is
 * bounded by pattern size × text length whatever the pattern is.
 *
 * It answers one question, "does the pattern occur in the text?", always
 * case-insensitively, for the syntax shared by JavaScript and RE2: literals,
 * classes, `.`, groups, alternation, `* + ? {n,m}` (lazy or not), `^ $ \b \B` and
 * the usual escapes. Look-around, back-references and named groups are refused.
 */

export type Matcher = (text: string) => boolean;

const MAX_PROGRAM = 20_000;
const MAX_REPEAT = 1000; // same ceiling as RE2

const CHAR = 0;
const SPLIT = 1;
const JMP = 2;
const MATCH = 3;
const BOL = 4;
const EOL = 5;
const WORDB = 6;
const NWORDB = 7;

/** Inclusive code-unit ranges, flattened: [lo, hi, lo, hi, ...]. */
interface CharSet {
  neg: boolean;
  ranges: number[];
}

type Node =
  | { t: "set"; set: CharSet }
  | { t: "cat"; items: Node[] }
  | { t: "alt"; items: Node[] }
  | { t: "rep"; node: Node; min: number; max: number }
  | { t: "assert"; op: number };

const DIGIT = [48, 57];
const WORD = [48, 57, 65, 90, 95, 95, 97, 122];
const SPACE = [
  9, 13, 32, 32, 0xa0, 0xa0, 0x1680, 0x1680, 0x2000, 0x200a, 0x2028, 0x2029, 0x202f, 0x202f, 0x205f, 0x205f,
  0x3000, 0x3000, 0xfeff, 0xfeff,
];
const NEWLINE = [10, 10, 13, 13, 0x2028, 0x2029];

function complement(ranges: number[]): number[] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < ranges.length; i += 2) pairs.push([ranges[i] as number, ranges[i + 1] as number]);
  pairs.sort((a, b) => a[0] - b[0]);
  const out: number[] = [];
  let next = 0;
  for (const [lo, hi] of pairs) {
    if (lo > next) out.push(next, lo - 1);
    next = Math.max(next, hi + 1);
  }
  if (next <= 0xffff) out.push(next, 0xffff);
  return out;
}

const SHORTHAND: Record<string, number[]> = {
  d: DIGIT,
  w: WORD,
  s: SPACE,
  D: complement(DIGIT),
  W: complement(WORD),
  S: complement(SPACE),
};

class Unsupported extends Error {}
const refuse = (): never => {
  throw new Unsupported();
};

const isHex = (s: string) => /^[0-9a-f]+$/i.test(s);

function parse(src: string): Node {
  let i = 0;

  /** The code unit an escape stands for (after the backslash). */
  const escaped = (c: string): number => {
    switch (c) {
      case "t":
        return 9;
      case "n":
        return 10;
      case "v":
        return 11;
      case "f":
        return 12;
      case "r":
        return 13;
      case "0":
        return /\d/.test(src[i] ?? "") ? refuse() : 0;
      case "x":
      case "u": {
        const len = c === "x" ? 2 : 4;
        const digits = src.slice(i, i + len);
        if (digits.length !== len || !isHex(digits)) return refuse();
        i += len;
        return parseInt(digits, 16);
      }
      case "c": {
        const letter = src[i] ?? "";
        if (!/[a-z]/i.test(letter)) return refuse();
        i++;
        return letter.charCodeAt(0) % 32;
      }
      default:
        // Other letters and digits mean different things to different engines.
        return /[a-z0-9]/i.test(c) ? refuse() : c.charCodeAt(0);
    }
  };

  const classAtom = (): number | number[] => {
    if (src[i] !== "\\") return src.charCodeAt(i++);
    i++;
    const c = src[i++];
    if (c === undefined) return refuse();
    if (c === "b") return 8;
    return SHORTHAND[c] ?? escaped(c);
  };

  const charClass = (): CharSet => {
    const neg = src[i] === "^";
    if (neg) i++;
    const ranges: number[] = [];
    for (;;) {
      if (i >= src.length) return refuse();
      if (src[i] === "]") {
        i++;
        return { neg, ranges };
      }
      const a = classAtom();
      if (typeof a !== "number") {
        ranges.push(...a);
        continue;
      }
      if (src[i] === "-" && i + 1 < src.length && src[i + 1] !== "]") {
        i++;
        const b = classAtom();
        if (typeof b !== "number") ranges.push(a, a, 45, 45, ...b);
        else if (b < a) return refuse();
        else ranges.push(a, b);
        continue;
      }
      ranges.push(a, a);
    }
  };

  const literal = (code: number): Node => ({ t: "set", set: { neg: false, ranges: [code, code] } });
  const QUANTIFIER = /^\{(\d+)(?:(,)(\d*))?\}/;

  const atom = (): Node => {
    const c = src[i] as string;
    switch (c) {
      case "^":
        i++;
        return { t: "assert", op: BOL };
      case "$":
        i++;
        return { t: "assert", op: EOL };
      case ".":
        i++;
        return { t: "set", set: { neg: true, ranges: NEWLINE } };
      case "(": {
        i++;
        if (src[i] === "?") {
          if (src[i + 1] !== ":") return refuse();
          i += 2;
        }
        const inner = alternation();
        if (src[i] !== ")") return refuse();
        i++;
        return inner;
      }
      case "[":
        i++;
        return { t: "set", set: charClass() };
      case "\\": {
        i++;
        const e = src[i++];
        if (e === undefined) return refuse();
        if (e === "b") return { t: "assert", op: WORDB };
        if (e === "B") return { t: "assert", op: NWORDB };
        const set = SHORTHAND[e];
        return set ? { t: "set", set: { neg: false, ranges: set } } : literal(escaped(e));
      }
      case "*":
      case "+":
      case "?":
        return refuse();
      case "{":
        if (QUANTIFIER.test(src.slice(i, i + 16))) return refuse();
        i++;
        return literal(123);
      default:
        return literal(src.charCodeAt(i++));
    }
  };

  const quantified = (): Node => {
    const node = atom();
    let min: number;
    let max: number;
    const c = src[i];
    if (c === "*") [min, max, i] = [0, Infinity, i + 1];
    else if (c === "+") [min, max, i] = [1, Infinity, i + 1];
    else if (c === "?") [min, max, i] = [0, 1, i + 1];
    else if (c === "{") {
      const m = QUANTIFIER.exec(src.slice(i, i + 16));
      if (!m) return node;
      min = Number(m[1]);
      max = m[2] ? (m[3] ? Number(m[3]) : Infinity) : min;
      i += m[0].length;
    } else return node;
    if (src[i] === "?") i++; // lazy or greedy: the set of matching texts is the same
    if (min > MAX_REPEAT || (max !== Infinity && (max > MAX_REPEAT || max < min))) return refuse();
    return { t: "rep", node, min, max };
  };

  function alternation(): Node {
    const branches: Node[] = [];
    for (;;) {
      const items: Node[] = [];
      while (i < src.length && src[i] !== "|" && src[i] !== ")") items.push(quantified());
      branches.push({ t: "cat", items });
      if (src[i] !== "|") break;
      i++;
    }
    return branches.length === 1 ? (branches[0] as Node) : { t: "alt", items: branches };
  }

  const root = alternation();
  if (i < src.length) return refuse(); // stray ")"
  return root;
}

/** True when every match has to start at the beginning of the text. */
function startsAtBeginning(n: Node): boolean {
  switch (n.t) {
    case "assert":
      return n.op === BOL;
    case "cat":
      return n.items.length > 0 && startsAtBeginning(n.items[0] as Node);
    case "alt":
      return n.items.every(startsAtBeginning);
    case "rep":
      return n.min > 0 && startsAtBeginning(n.node);
    default:
      return false;
  }
}

const inRanges = (ranges: number[], c: number): boolean => {
  for (let k = 0; k < ranges.length; k += 2) {
    if (c >= (ranges[k] as number) && c <= (ranges[k + 1] as number)) return true;
  }
  return false;
};

/** Upper-case form used for case-insensitive comparison (same rule as RegExp's `i` flag). */
function canonical(c: number): number {
  if (c < 128) return c >= 97 && c <= 122 ? c - 32 : c;
  const up = String.fromCharCode(c).toUpperCase();
  const u = up.length === 1 ? up.charCodeAt(0) : c;
  return u < 128 ? c : u;
}

function lowerOf(c: number, upper: number): number {
  if (c < 128) return c >= 65 && c <= 90 ? c + 32 : c;
  const low = String.fromCharCode(c).toLowerCase();
  const l = low.length === 1 ? low.charCodeAt(0) : c;
  return l !== c && canonical(l) === upper ? l : c;
}

const isWordAt = (text: string, pos: number) => pos >= 0 && pos < text.length && inRanges(WORD, text.charCodeAt(pos));

function build(root: Node): Matcher {
  const op: number[] = [];
  const x: number[] = [];
  const y: number[] = [];
  const sets: CharSet[] = [];

  const emit = (o: number, a = 0): number => {
    if (op.length >= MAX_PROGRAM) refuse();
    op.push(o);
    x.push(a);
    y.push(0);
    return op.length - 1;
  };

  const gen = (n: Node): void => {
    switch (n.t) {
      case "set":
        emit(CHAR, sets.push(n.set) - 1);
        return;
      case "assert":
        emit(n.op);
        return;
      case "cat":
        n.items.forEach(gen);
        return;
      case "alt": {
        const exits: number[] = [];
        n.items.forEach((item, k) => {
          if (k === n.items.length - 1) return gen(item);
          const split = emit(SPLIT);
          x[split] = op.length;
          gen(item);
          exits.push(emit(JMP));
          y[split] = op.length;
        });
        for (const j of exits) x[j] = op.length;
        return;
      }
      case "rep": {
        for (let k = 0; k < n.min; k++) gen(n.node);
        if (n.max === Infinity) {
          const split = emit(SPLIT);
          x[split] = op.length;
          gen(n.node);
          x[emit(JMP)] = split;
          y[split] = op.length;
          return;
        }
        const splits: number[] = [];
        for (let k = n.min; k < n.max; k++) {
          const split = emit(SPLIT);
          x[split] = op.length;
          gen(n.node);
          splits.push(split);
        }
        for (const s of splits) y[s] = op.length;
      }
    }
  };

  gen(root);
  emit(MATCH);

  const size = op.length;
  const anchored = startsAtBeginning(root);
  const lists = [new Int32Array(size), new Int32Array(size)] as const;
  const marks = [new Uint32Array(size), new Uint32Array(size)] as const;
  const stamps = [0, 0];
  const counts = [0, 0];
  const stack = new Int32Array(2 * size + 2);
  let clock = 0;

  return (text) => {
    const end = text.length;

    /** Adds `pc` and everything reachable from it without consuming input. True on a match. */
    const add = (which: 0 | 1, start: number, pos: number): boolean => {
      const list = lists[which];
      const mark = marks[which];
      const stamp = stamps[which] as number;
      let sp = 0;
      stack[sp++] = start;
      while (sp > 0) {
        const pc = stack[--sp] as number;
        if (mark[pc] === stamp) continue;
        mark[pc] = stamp;
        switch (op[pc]) {
          case CHAR:
            list[counts[which]!++] = pc;
            break;
          case JMP:
            stack[sp++] = x[pc] as number;
            break;
          case SPLIT:
            stack[sp++] = y[pc] as number;
            stack[sp++] = x[pc] as number;
            break;
          case BOL:
            if (pos === 0) stack[sp++] = pc + 1;
            break;
          case EOL:
            if (pos === end) stack[sp++] = pc + 1;
            break;
          case WORDB:
          case NWORDB:
            if ((isWordAt(text, pos - 1) !== isWordAt(text, pos)) === (op[pc] === WORDB)) stack[sp++] = pc + 1;
            break;
          default:
            return true; // MATCH
        }
      }
      return false;
    };

    const fresh = (which: 0 | 1) => {
      if (clock >= 0xffffffff) {
        marks[0].fill(0);
        marks[1].fill(0);
        clock = 0;
      }
      stamps[which] = ++clock;
      counts[which] = 0;
    };

    let cur: 0 | 1 = 0;
    fresh(cur);
    for (let pos = 0; ; pos++) {
      if ((pos === 0 || !anchored) && add(cur, 0, pos)) return true;
      if (pos >= end || (anchored && counts[cur] === 0)) return false;
      const c = text.charCodeAt(pos);
      const upper = canonical(c);
      const lower = lowerOf(c, upper);
      const next: 0 | 1 = cur === 0 ? 1 : 0;
      fresh(next);
      const list = lists[cur];
      const n = counts[cur] as number;
      for (let k = 0; k < n; k++) {
        const pc = list[k] as number;
        const set = sets[x[pc] as number] as CharSet;
        const hit =
          inRanges(set.ranges, c) ||
          (upper !== c && inRanges(set.ranges, upper)) ||
          (lower !== c && inRanges(set.ranges, lower));
        if (hit !== set.neg && add(next, pc + 1, pos + 1)) return true;
      }
      cur = next;
    }
  };
}

/** Compiles `src`, or returns null when it uses syntax this matcher does not support. */
export function compile(src: string): Matcher | null {
  try {
    return build(parse(src));
  } catch (e) {
    if (e instanceof Unsupported || e instanceof RangeError) return null;
    throw e;
  }
}
