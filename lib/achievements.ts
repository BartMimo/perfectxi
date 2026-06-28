import type { SimResult } from "./sim";

export interface Achievement {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export interface AchievementDef {
  id: string;
  label: string;
  icon: string;
  description: string;
  check: (r: SimResult) => boolean;
}

export const ALL_ACHIEVEMENTS: AchievementDef[] = [
  { id: "champion", label: "Kampioen", icon: "🏆", description: "Word kampioen in alle 7 competities.", check: (r) => r.position === 1 },
  { id: "invincible", label: "Invincible", icon: "🛡️", description: "Win alle 38 wedstrijden in één seizoen (38-0-0).", check: (r) => r.invincible },
  { id: "100pts", label: "100+ punten", icon: "💯", description: "Behaal 100 of meer punten in één seizoen.", check: (r) => r.userRow.points >= 100 },
  { id: "clean20", label: "20+ clean sheets", icon: "🧤", description: "Houd 20 of meer clean sheets in één seizoen.", check: (r) => r.awards.cleanSheets >= 20 },
  { id: "gf100", label: "100+ goals", icon: "⚽", description: "Scoor 100 of meer doelpunten in één seizoen.", check: (r) => r.userRow.gf >= 100 },
  { id: "gf152", label: "152+ goals", icon: "💀", description: "Scoor 152 of meer doelpunten in één seizoen — een historisch record.", check: (r) => r.userRow.gf >= 152 },
  { id: "ga20", label: "< 20 tegendoelpunten", icon: "🔒", description: "Kasseer minder dan 20 tegendoelpunten in één seizoen.", check: (r) => r.userRow.ga < 20 },
  { id: "gd80", label: "Doelsaldo 80+", icon: "📊", description: "Eindig het seizoen met een doelsaldo van +80 of hoger.", check: (r) => r.userRow.gd >= 80 },
  { id: "unbeaten", label: "Ongeslagen", icon: "💪", description: "Verlies geen enkele wedstrijd in het hele seizoen.", check: (r) => r.userRow.lost === 0 },
  { id: "cl", label: "Champions League", icon: "⭐", description: "Eindig in de top 4 en kwalificeer je voor de Champions League.", check: (r) => r.position <= 4 },
  { id: "topscorer30", label: "Topscorer 30+", icon: "🔥", description: "Heb een speler met 30 of meer goals in één seizoen.", check: (r) => (r.awards.topScorer?.goals ?? 0) >= 30 },
  { id: "nolosses", label: "Nul verliespartijen", icon: "🚫", description: "Verlies geen wedstrijd, maar speel wel minstens één keer gelijk.", check: (r) => r.userRow.lost === 0 && r.userRow.drawn > 0 },
  { id: "win30", label: "30+ overwinningen", icon: "🎖️", description: "Win 30 of meer wedstrijden in één seizoen.", check: (r) => r.userRow.won >= 30 },
  { id: "relegation", label: "Degradatie overleefd", icon: "😅", description: "Eindig op plek 15, 16 of 17 — net boven de degradatiezone.", check: (r) => r.position >= 15 && r.position <= 17 },
  { id: "gf50", label: "50+ goals", icon: "🥅", description: "Scoor 50 of meer doelpunten in één seizoen.", check: (r) => r.userRow.gf >= 50 },
  { id: "assister20", label: "Assistkoning 20+", icon: "🎯", description: "Heb een speler met 20 of meer assists in één seizoen.", check: (r) => (r.awards.topAssister?.assists ?? 0) >= 20 },
  { id: "div1champ", label: "Divisie 1 Kampioen", icon: "👑", description: "Word kampioen in Divisie 1 in de carrièremodus.", check: () => false },
];

export function computeAchievements(result: SimResult): Achievement[] {
  return ALL_ACHIEVEMENTS.filter((a) => a.check(result)).map(({ id, label, icon, description }) => ({ id, label, icon, description }));
}
