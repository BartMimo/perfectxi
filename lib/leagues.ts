export interface LeagueInfo {
  code: string;
  name: string;
  flag: string;
}

export const LEAGUES: LeagueInfo[] = [
  { code: "GB1", name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "ES1", name: "La Liga", flag: "🇪🇸" },
  { code: "IT1", name: "Serie A", flag: "🇮🇹" },
  { code: "L1", name: "Bundesliga", flag: "🇩🇪" },
  { code: "FR1", name: "Ligue 1", flag: "🇫🇷" },
  { code: "NL1", name: "Eredivisie", flag: "🇳🇱" },
  { code: "PO1", name: "Primeira Liga", flag: "🇵🇹" },
];

export function leagueName(code: string | null): string {
  return LEAGUES.find((l) => l.code === code)?.name ?? "";
}
