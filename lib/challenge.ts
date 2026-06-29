import { LEAGUES } from "./leagues";
import { FORMATIONS } from "./formations";
import type { RatingMode, Difficulty } from "./store";

export interface DailyChallenge {
  day: string;
  leagueCode: string;
  leagueName: string;
  leagueFlag: string;
  formationKey: string;
  formationLabel: string;
  ratingMode: RatingMode;
  difficulty: Difficulty;
}

const EPOCH = Date.UTC(2026, 5, 29); // 29 June 2026 as day 0
const DAY_MS = 24 * 60 * 60 * 1000;

export function getCurrentChallenge(): DailyChallenge {
  const now = Date.now();
  const dayNumber = Math.floor((now - EPOCH) / DAY_MS);
  return getChallengeForDay(dayNumber);
}

export function getChallengeDayId(): string {
  const now = Date.now();
  const dayNumber = Math.floor((now - EPOCH) / DAY_MS);
  return `d${dayNumber}`;
}

/** @deprecated Use getChallengeDayId instead */
export function getChallengeWeekId(): string {
  return getChallengeDayId();
}

function getChallengeForDay(dayNumber: number): DailyChallenge {
  const league = LEAGUES[((dayNumber % LEAGUES.length) + LEAGUES.length) % LEAGUES.length];
  const formation = FORMATIONS[((dayNumber % FORMATIONS.length) + FORMATIONS.length) % FORMATIONS.length];
  const ratingMode: RatingMode = dayNumber % 2 === 0 ? "actual" : "prime";

  return {
    day: `d${dayNumber}`,
    leagueCode: league.code,
    leagueName: league.name,
    leagueFlag: league.flag,
    formationKey: formation.key,
    formationLabel: formation.label,
    ratingMode,
    difficulty: "normal",
  };
}
