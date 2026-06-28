import type { SimResult } from "./sim";

export interface Achievement {
  id: string;
  label: string;
  icon: string;
}

const ALL: { id: string; label: string; icon: string; check: (r: SimResult) => boolean }[] = [
  { id: "champion", label: "Kampioen", icon: "🏆", check: (r) => r.position === 1 },
  { id: "invincible", label: "Invincible", icon: "🛡️", check: (r) => r.invincible },
  { id: "100pts", label: "100+ punten", icon: "💯", check: (r) => r.userRow.points >= 100 },
  { id: "clean20", label: "20+ clean sheets", icon: "🧤", check: (r) => r.awards.cleanSheets >= 20 },
  { id: "gf100", label: "100+ goals", icon: "⚽", check: (r) => r.userRow.gf >= 100 },
  { id: "ga20", label: "Minder dan 20 tegendoelpunten", icon: "🔒", check: (r) => r.userRow.ga < 20 },
  { id: "gd80", label: "Doelsaldo 80+", icon: "📊", check: (r) => r.userRow.gd >= 80 },
  { id: "unbeaten", label: "Ongeslagen", icon: "💪", check: (r) => r.userRow.lost === 0 },
  { id: "cl", label: "Champions League", icon: "⭐", check: (r) => r.position <= 4 },
  { id: "topscorer30", label: "Topscorer 30+ goals", icon: "🔥", check: (r) => (r.awards.topScorer?.goals ?? 0) >= 30 },
];

export function computeAchievements(result: SimResult): Achievement[] {
  return ALL.filter((a) => a.check(result)).map(({ id, label, icon }) => ({ id, label, icon }));
}
