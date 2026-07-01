import type { SimResult } from "./sim";

export interface Achievement {
  id: string;
  icon: string;
}

export interface AchievementDef {
  id: string;
  icon: string;
  check: (r: SimResult) => boolean;
}

export const ALL_ACHIEVEMENTS: AchievementDef[] = [
  { id: "champion", icon: "🏆", check: (r) => r.position === 1 },
  { id: "invincible", icon: "🛡️", check: (r) => r.invincible },
  { id: "100pts", icon: "💯", check: (r) => r.userRow.points >= 100 },
  { id: "clean20", icon: "🧤", check: (r) => r.awards.cleanSheets >= 20 },
  { id: "gf100", icon: "⚽", check: (r) => r.userRow.gf >= 100 },
  { id: "gf152", icon: "💀", check: (r) => r.userRow.gf >= 152 },
  { id: "ga20", icon: "🔒", check: (r) => r.userRow.ga < 20 },
  { id: "gd80", icon: "📊", check: (r) => r.userRow.gd >= 80 },
  { id: "unbeaten", icon: "💪", check: (r) => r.userRow.lost === 0 },
  { id: "cl", icon: "⭐", check: (r) => r.position <= 4 },
  { id: "topscorer30", icon: "🔥", check: (r) => (r.awards.topScorer?.goals ?? 0) >= 30 },
  { id: "nolosses", icon: "🚫", check: (r) => r.userRow.lost === 0 && r.userRow.drawn > 0 },
  { id: "win30", icon: "🎖️", check: (r) => r.userRow.won >= 30 },
  { id: "relegation", icon: "😅", check: (r) => r.position >= 15 && r.position <= 17 },
  { id: "gf50", icon: "🥅", check: (r) => r.userRow.gf >= 50 },
  { id: "assister20", icon: "🎯", check: (r) => (r.awards.topAssister?.assists ?? 0) >= 20 },
  { id: "div1champ", icon: "👑", check: () => false },
  { id: "dailywinner", icon: "🌟", check: () => false },
];

export function computeAchievements(result: SimResult): Achievement[] {
  return ALL_ACHIEVEMENTS.filter((a) => a.check(result)).map(({ id, icon }) => ({ id, icon }));
}
