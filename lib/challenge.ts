import { LEAGUES } from "./leagues";
import { FORMATIONS } from "./formations";
import type { RatingMode, Difficulty } from "./store";

export interface WeeklyChallenge {
  week: string;
  leagueCode: string;
  leagueName: string;
  leagueFlag: string;
  formationKey: string;
  formationLabel: string;
  ratingMode: RatingMode;
  difficulty: Difficulty;
}

const EPOCH = Date.UTC(2026, 5, 29); // Monday 29 June 2026 as week 0

export function getCurrentChallenge(): WeeklyChallenge {
  const now = Date.now();
  const weekNumber = Math.floor((now - EPOCH) / (7 * 24 * 60 * 60 * 1000));
  return getChallengeForWeek(weekNumber);
}

export function getChallengeWeekId(): string {
  const now = Date.now();
  const weekNumber = Math.floor((now - EPOCH) / (7 * 24 * 60 * 60 * 1000));
  return `w${weekNumber}`;
}

function getChallengeForWeek(weekNumber: number): WeeklyChallenge {
  const league = LEAGUES[((weekNumber % LEAGUES.length) + LEAGUES.length) % LEAGUES.length];
  const formation = FORMATIONS[((weekNumber % FORMATIONS.length) + FORMATIONS.length) % FORMATIONS.length];
  const ratingMode: RatingMode = weekNumber % 2 === 0 ? "actual" : "prime";

  return {
    week: `w${weekNumber}`,
    leagueCode: league.code,
    leagueName: league.name,
    leagueFlag: league.flag,
    formationKey: formation.key,
    formationLabel: formation.label,
    ratingMode,
    difficulty: "normal",
  };
}
