import type { ClubSeasonLite, DraftedPlayer } from "./types";
import type { PosKey } from "./positions";
import { POS_BAND } from "./positions";
import { teamStrength, type LineupEntry } from "./sim";

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
  do { k++; p *= rng(); } while (p > L);
  return k - 1;
}

const BASE_GOALS = 1.32;
const SLOPE = 0.09;
const HOME_BONUS = 0.25;

function expectedGoals(att: number, oppDef: number, home: boolean): number {
  let lambda = BASE_GOALS + (att - oppDef) * SLOPE;
  if (home) lambda += HOME_BONUS;
  return Math.min(Math.max(lambda, 0.18), 3.7);
}

interface CLTeam {
  name: string;
  rating: number;
  isUser: boolean;
}

export interface CLMatch {
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
}

export interface CLGroupStanding {
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

export interface CLGroup {
  teams: string[];
  matches: CLMatch[];
  standings: CLGroupStanding[];
}

export interface CLKnockoutRound {
  name: string;
  ties: CLKnockoutTie[];
}

export interface CLKnockoutTie {
  home: string;
  away: string;
  leg1: CLMatch;
  leg2: CLMatch;
  winner: string;
  aggregate: [number, number];
}

export interface CLResult {
  groups: CLGroup[];
  knockout: CLKnockoutRound[];
  winner: string;
  userEliminated: string;
  userBestRound: string;
  seed: number;
}

export interface CLOptions {
  opponents: ClubSeasonLite[];
  seed?: number;
  teamName?: string;
}

function playMatchCL(home: CLTeam, away: CLTeam, rng: () => number): CLMatch {
  const lh = expectedGoals(home.rating, away.rating, true);
  const la = expectedGoals(away.rating, home.rating, false);
  return {
    home: home.name,
    away: away.name,
    homeGoals: poisson(lh, rng),
    awayGoals: poisson(la, rng),
  };
}

function emptyStanding(name: string, isUser: boolean): CLGroupStanding {
  return { name, isUser, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
}

function applyMatch(s: CLGroupStanding, gf: number, ga: number) {
  s.played++;
  s.gf += gf;
  s.ga += ga;
  s.gd = s.gf - s.ga;
  if (gf > ga) { s.won++; s.points += 3; }
  else if (gf === ga) { s.drawn++; s.points += 1; }
  else { s.lost++; }
}

export function simulateCL(lineup: LineupEntry[], opts: CLOptions): CLResult {
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = mulberry32(seed);

  const strength = teamStrength(lineup.map((e) => e.player));
  const userName = opts.teamName || "Jouw XI";

  const OPP_COMPRESS = 0.2;
  const avgOpp = opts.opponents.reduce((s, c) => s + c.teamRating, 0) / opts.opponents.length;

  // Build 63 AI teams from top opponents
  const sorted = [...opts.opponents].sort((a, b) => b.teamRating - a.teamRating).slice(0, 63);
  const aiTeams: CLTeam[] = sorted.map((cs) => {
    const compressed = avgOpp + (cs.teamRating - avgOpp) * (1 - OPP_COMPRESS);
    return { name: `${cs.club}`, rating: compressed + (rng() - 0.5) * 3, isUser: false };
  });

  const userTeam: CLTeam = { name: userName, rating: strength.overall, isUser: true };
  const allTeams: CLTeam[] = [userTeam, ...aiTeams];

  // Shuffle teams (but keep user)
  for (let i = allTeams.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [allTeams[i], allTeams[j]] = [allTeams[j], allTeams[i]];
  }

  // Create 16 groups of 4
  const groups: CLGroup[] = [];
  for (let g = 0; g < 16; g++) {
    const groupTeams = allTeams.slice(g * 4, g * 4 + 4);
    const teamMap = new Map<string, CLTeam>(groupTeams.map((t) => [t.name, t]));
    const standings = groupTeams.map((t) => emptyStanding(t.name, t.isUser));
    const standingMap = new Map(standings.map((s) => [s.name, s]));
    const matches: CLMatch[] = [];

    // Round-robin: each team plays each other twice (home & away)
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = 0; j < groupTeams.length; j++) {
        if (i === j) continue;
        const m = playMatchCL(groupTeams[i], groupTeams[j], rng);
        matches.push(m);
        applyMatch(standingMap.get(m.home)!, m.homeGoals, m.awayGoals);
        applyMatch(standingMap.get(m.away)!, m.awayGoals, m.homeGoals);
      }
    }

    standings.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
    groups.push({ teams: groupTeams.map((t) => t.name), matches, standings });
  }

  // Top 2 from each group advance → 32 teams
  let advancing: CLTeam[] = [];
  for (const group of groups) {
    const top2 = group.standings.slice(0, 2);
    for (const s of top2) {
      const team = allTeams.find((t) => t.name === s.name)!;
      advancing.push(team);
    }
  }

  // Track user progress
  let userEliminated = "Groepsfase";
  let userBestRound = "Groepsfase";
  const userInRound = (teams: CLTeam[]) => teams.some((t) => t.isUser);

  if (userInRound(advancing)) userBestRound = "Laatste 32";

  const roundNames = ["Laatste 32", "Laatste 16", "Kwartfinale", "Halve finale", "Finale"];
  const knockout: CLKnockoutRound[] = [];

  let current = advancing;
  for (let ri = 0; ri < roundNames.length; ri++) {
    const roundName = roundNames[ri];
    const ties: CLKnockoutTie[] = [];

    // Shuffle for draw
    for (let i = current.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [current[i], current[j]] = [current[j], current[i]];
    }

    const winners: CLTeam[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const teamA = current[i];
      const teamB = current[i + 1];
      const leg1 = playMatchCL(teamA, teamB, rng);
      const leg2 = playMatchCL(teamB, teamA, rng);
      const aggA = leg1.homeGoals + leg2.awayGoals;
      const aggB = leg1.awayGoals + leg2.homeGoals;

      let winner: CLTeam;
      if (aggA > aggB) winner = teamA;
      else if (aggB > aggA) winner = teamB;
      else {
        // Away goals rule, then extra time sim
        const awayA = leg2.awayGoals;
        const awayB = leg1.awayGoals;
        if (awayA > awayB) winner = teamA;
        else if (awayB > awayA) winner = teamB;
        else winner = rng() > 0.5 ? teamA : teamB;
      }

      ties.push({
        home: teamA.name,
        away: teamB.name,
        leg1,
        leg2,
        winner: winner.name,
        aggregate: [aggA, aggB],
      });
      winners.push(winner);
    }

    knockout.push({ name: roundName, ties });

    if (userInRound(current) && !userInRound(winners)) {
      userEliminated = roundName;
    }
    if (userInRound(winners)) {
      userBestRound = ri + 1 < roundNames.length ? roundNames[ri + 1] : "Winnaar";
    }

    current = winners;
  }

  const winner = current[0]?.name ?? "";
  if (winner === userName) userBestRound = "Winnaar";

  return { groups, knockout, winner, userEliminated, userBestRound, seed };
}
