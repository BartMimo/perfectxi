import type { ClubSeasonLite, DraftedPlayer } from "./types";
import type { PosKey } from "./positions";
import { POS_BAND } from "./positions";

// ---------- RNG (seedbaar, zodat een eindstand reproduceerbaar is) ----------
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function poisson(lambda: number, rng: () => number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

// ---------- Team-sterkte uit de gekozen XI ----------
export interface TeamStrength {
  attack: number;
  defense: number;
  overall: number;
}

export interface LineupEntry {
  player: DraftedPlayer;
  pos: PosKey;
}

export function teamStrength(xi: DraftedPlayer[]): TeamStrength {
  if (xi.length === 0) return { attack: 70, defense: 70, overall: 70 };
  const mean = (sel: (p: DraftedPlayer) => number) =>
    xi.reduce((s, p) => s + sel(p), 0) / xi.length;
  return {
    attack: mean((p) => p.attack),
    defense: mean((p) => p.defense),
    overall: mean((p) => p.overall),
  };
}

// ---------- Types ----------
export interface TableRow {
  name: string;
  isUser: boolean;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export interface MatchResult {
  opponent: string;
  home: boolean;
  gf: number;
  ga: number;
}

export interface MatchdayResult {
  round: number; // 1..38
  userMatch: MatchResult;
  standings: TableRow[]; // momentopname ná deze speeldag
}

export interface PlayerStat {
  name: string;
  pos: PosKey;
  overall: number;
  fromClub: string;
  goals: number;
  assists: number;
  cleanSheets: number;
}

export interface Awards {
  topScorer: PlayerStat | null;
  topAssister: PlayerStat | null;
  goalkeeper: PlayerStat | null; // golden glove
  cleanSheets: number; // team clean sheets
  biggestWin: MatchResult | null;
}

export interface SimResult {
  table: TableRow[];
  userRow: TableRow;
  position: number;
  matches: MatchResult[];
  matchdays: MatchdayResult[];
  squadStats: PlayerStat[];
  awards: Awards;
  invincible: boolean;
  qualification: Qualification;
  seed: number;
}

export type Qualification =
  | "champion"
  | "championsLeague"
  | "europaLeague"
  | "conferenceLeague"
  | "midtable"
  | "relegation";

const BASE_GOALS = 1.32;
const SLOPE = 0.09;
const HOME_BONUS = 0.25;

// Lineair (niet exponentieel) model: voorkomt onrealistische uitslagen tegen
// zwakke tegenstanders, doelsaldo's blijven in een geloofwaardige range.
function expectedGoals(att: number, oppDef: number, home: boolean): number {
  let lambda = BASE_GOALS + (att - oppDef) * SLOPE;
  if (home) lambda += HOME_BONUS;
  return Math.min(Math.max(lambda, 0.18), 3.7);
}

interface SimTeam {
  name: string;
  attack: number;
  defense: number;
  isUser: boolean;
}

function playMatch(home: SimTeam, away: SimTeam, rng: () => number): [number, number] {
  const lh = expectedGoals(home.attack, away.defense, true);
  const la = expectedGoals(away.attack, home.defense, false);
  return [poisson(lh, rng), poisson(la, rng)];
}

function emptyRow(name: string, isUser: boolean): TableRow {
  return { name, isUser, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
}

function applyResult(row: TableRow, gf: number, ga: number) {
  row.played++;
  row.gf += gf;
  row.ga += ga;
  row.gd = row.gf - row.ga;
  if (gf > ga) {
    row.won++;
    row.points += 3;
  } else if (gf === ga) {
    row.drawn++;
    row.points += 1;
  } else {
    row.lost++;
  }
}

function sortTable(rows: TableRow[]): TableRow[] {
  return [...rows].sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
}

// ---------- Speelschema (cirkelmethode) ----------
/** Genereer de speeldagen van een dubbele competitie voor n teams (n even). */
function buildSchedule(n: number): [number, number][][] {
  const single: [number, number][][] = [];
  const rotating = Array.from({ length: n - 1 }, (_, i) => i + 1); // 1..n-1
  for (let r = 0; r < n - 1; r++) {
    const cur = [0, ...rotating];
    const round: [number, number][] = [];
    for (let i = 0; i < n / 2; i++) {
      const home = cur[i];
      const away = cur[n - 1 - i];
      // wissel thuisvoordeel per speeldag voor balans
      round.push(r % 2 === 0 ? [home, away] : [away, home]);
    }
    single.push(round);
    rotating.unshift(rotating.pop()!); // roteer
  }
  // tweede seizoenshelft: zelfde paren, omgekeerd thuis/uit
  const second = single.map((round) => round.map(([h, a]) => [a, h] as [number, number]));
  return [...single, ...second];
}

// ---------- Doelpunt-/assistverdeling over de eigen XI ----------
const GOAL_WEIGHT: Record<PosKey, number> = {
  ST: 10,
  LW: 7,
  RW: 7,
  CAM: 6,
  LM: 4,
  RM: 4,
  CM: 3,
  CDM: 1.5,
  LWB: 1,
  RWB: 1,
  LB: 0.8,
  RB: 0.8,
  CB: 0.7,
  GK: 0.05,
};

const ASSIST_WEIGHT: Record<PosKey, number> = {
  CAM: 9,
  LW: 8,
  RW: 8,
  CM: 6,
  LM: 6,
  RM: 6,
  ST: 5,
  CDM: 3,
  LWB: 3,
  RWB: 3,
  LB: 2.5,
  RB: 2.5,
  CB: 1,
  GK: 0.2,
};

function weightedPick(
  lineup: LineupEntry[],
  weightOf: (e: LineupEntry) => number,
  rng: () => number,
  exclude?: string,
): LineupEntry | null {
  let total = 0;
  for (const e of lineup) {
    if (exclude && e.player.name === exclude) continue;
    total += weightOf(e);
  }
  if (total <= 0) return null;
  let roll = rng() * total;
  for (const e of lineup) {
    if (exclude && e.player.name === exclude) continue;
    roll -= weightOf(e);
    if (roll <= 0) return e;
  }
  return null;
}

export interface SimOptions {
  opponents: ClubSeasonLite[];
  seed?: number;
  teamName?: string;
}

export function simulateSeason(lineup: LineupEntry[], opts: SimOptions): SimResult {
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = mulberry32(seed);

  const strength = teamStrength(lineup.map((e) => e.player));

  const avgOpp = opts.opponents.reduce((s, c) => s + c.teamRating, 0) / opts.opponents.length;
  const COMPRESS = 0.2;

  const opponents: SimTeam[] = opts.opponents.map((cs) => {
    const compressed = avgOpp + (cs.teamRating - avgOpp) * (1 - COMPRESS);
    const r = compressed + (rng() - 0.5) * 4;
    return { name: cs.club, attack: r, defense: r, isUser: false };
  });
  const user: SimTeam = {
    name: opts.teamName || "Jouw XI",
    attack: strength.overall,
    defense: strength.overall,
    isUser: true,
  };
  const teams: SimTeam[] = [user, ...opponents];
  const n = teams.length;

  const rows = teams.map((t) => emptyRow(t.name, t.isUser));

  // spelersstatistieken
  const stats = new Map<string, PlayerStat>();
  for (const e of lineup) {
    stats.set(e.player.name, {
      name: e.player.name,
      pos: e.pos,
      overall: e.player.overall,
      fromClub: e.player.fromClub,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
    });
  }

  const scorerWeight = (e: LineupEntry) => GOAL_WEIGHT[e.pos] * (e.player.attack / 75);
  const assistWeight = (e: LineupEntry) => ASSIST_WEIGHT[e.pos];

  function distribute(goalsFor: number, goalsAgainst: number) {
    for (let g = 0; g < goalsFor; g++) {
      const scorer = weightedPick(lineup, scorerWeight, rng);
      if (scorer) stats.get(scorer.player.name)!.goals++;
      if (rng() < 0.72) {
        const assister = weightedPick(lineup, assistWeight, rng, scorer?.player.name);
        if (assister) stats.get(assister.player.name)!.assists++;
      }
    }
    if (goalsAgainst === 0) {
      for (const e of lineup) {
        const band = POS_BAND[e.pos];
        if (band === "GK" || band === "DEF") stats.get(e.player.name)!.cleanSheets++;
      }
    }
  }

  const schedule = buildSchedule(n); // 2*(n-1) speeldagen
  const userMatches: MatchResult[] = [];
  const matchdays: MatchdayResult[] = [];

  schedule.forEach((round, ri) => {
    let userMatch: MatchResult | null = null;
    for (const [hi, ai] of round) {
      const [hg, ag] = playMatch(teams[hi], teams[ai], rng);
      applyResult(rows[hi], hg, ag);
      applyResult(rows[ai], ag, hg);
      if (teams[hi].isUser) {
        userMatch = { opponent: teams[ai].name, home: true, gf: hg, ga: ag };
        distribute(hg, ag);
      } else if (teams[ai].isUser) {
        userMatch = { opponent: teams[hi].name, home: false, gf: ag, ga: hg };
        distribute(ag, hg);
      }
    }
    userMatches.push(userMatch!);
    matchdays.push({
      round: ri + 1,
      userMatch: userMatch!,
      standings: sortTable(rows).map((r) => ({ ...r })),
    });
  });

  const table = sortTable(rows);
  const userRow = table.find((r) => r.isUser)!;
  const position = table.indexOf(userRow) + 1;
  const invincible = userRow.won === userRow.played && userRow.lost === 0 && userRow.drawn === 0;

  const squadStats = [...stats.values()].sort(
    (a, b) => b.goals - a.goals || b.assists - a.assists,
  );
  const awards = buildAwards(squadStats, userMatches);

  return {
    table,
    userRow,
    position,
    matches: userMatches,
    matchdays,
    squadStats,
    awards,
    invincible,
    qualification: qualify(position),
    seed,
  };
}

function buildAwards(squadStats: PlayerStat[], matches: MatchResult[]): Awards {
  const topScorer = squadStats.reduce<PlayerStat | null>(
    (best, s) => (s.goals > 0 && (!best || s.goals > best.goals) ? s : best),
    null,
  );
  const topAssister = squadStats.reduce<PlayerStat | null>(
    (best, s) => (s.assists > 0 && (!best || s.assists > best.assists) ? s : best),
    null,
  );
  const goalkeeper = squadStats.find((s) => s.pos === "GK") ?? null;
  const cleanSheets = matches.filter((m) => m.ga === 0).length;
  const biggestWin = matches.reduce<MatchResult | null>((best, m) => {
    if (m.gf <= m.ga) return best;
    if (!best) return m;
    return m.gf - m.ga > best.gf - best.ga ? m : best;
  }, null);
  return { topScorer, topAssister, goalkeeper, cleanSheets, biggestWin };
}

function qualify(position: number): Qualification {
  if (position === 1) return "champion";
  if (position <= 4) return "championsLeague";
  if (position === 5) return "europaLeague";
  if (position <= 7) return "conferenceLeague";
  if (position >= 18) return "relegation";
  return "midtable";
}

export const QUALIFICATION_LABELS: Record<Qualification, string> = {
  champion: "Landskampioen 🏆",
  championsLeague: "Champions League",
  europaLeague: "Europa League",
  conferenceLeague: "Conference League",
  midtable: "Middenmoot",
  relegation: "Degradatiezone",
};
