import { supabase } from "./supabase";
import type { SimResult } from "./sim";
import type { Slot } from "./store";
import type { RatingMode, Difficulty } from "./store";
import { computeAchievements } from "./achievements";

interface SaveParams {
  userId: string;
  result: SimResult;
  slots: Slot[];
  leagueCode: string;
  leagueName: string;
  formation: string;
  ratingMode: RatingMode;
  difficulty: Difficulty;
  isChallenge?: boolean;
  challengeWeek?: string | null;
  isCareer?: boolean;
  careerDivision?: number;
  careerSeason?: number;
}

export async function saveResult(params: SaveParams) {
  const { userId, result, slots, leagueCode, leagueName, formation, ratingMode, difficulty, isChallenge, challengeWeek, isCareer, careerDivision, careerSeason } = params;

  const players = slots.map((s) => s.player!);
  const teamRating = Math.round(
    players.reduce((sum, p) => sum + p.overall, 0) / players.length * 10
  ) / 10;
  const teamValue = Math.round(
    players.reduce((sum, p) => sum + p.mv, 0)
  );

  const achievements = computeAchievements(result);

  const { error } = await supabase.from("results").upsert(
    {
      user_id: userId,
      seed: result.seed,
      league_code: leagueCode,
      league_name: leagueName,
      formation,
      rating_mode: ratingMode,
      difficulty,
      team_rating: teamRating,
      team_value: teamValue,
      position: result.position,
      points: result.userRow.points,
      won: result.userRow.won,
      drawn: result.userRow.drawn,
      lost: result.userRow.lost,
      goals_for: result.userRow.gf,
      goals_against: result.userRow.ga,
      goal_diff: result.userRow.gd,
      qualification: result.qualification,
      invincible: result.invincible,
      achievements: achievements.map((a) => a.id),
      is_challenge: isChallenge ?? false,
      challenge_week: challengeWeek ?? null,
      is_career: isCareer ?? false,
      career_division: careerDivision ?? null,
      career_season: careerSeason ?? null,
    },
    { onConflict: "user_id,seed", ignoreDuplicates: true },
  );

  return { error, achievements };
}
