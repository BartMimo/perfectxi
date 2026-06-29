export interface LeagueInfo {
  code: string;
  name: string;
  flag: string;
  countryCode: string;
}

export const LEAGUES: LeagueInfo[] = [
  { code: "GB1", name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", countryCode: "ENG" },
  { code: "ES1", name: "La Liga", flag: "🇪🇸", countryCode: "ESP" },
  { code: "IT1", name: "Serie A", flag: "🇮🇹", countryCode: "ITA" },
  { code: "L1", name: "Bundesliga", flag: "🇩🇪", countryCode: "DEU" },
  { code: "FR1", name: "Ligue 1", flag: "🇫🇷", countryCode: "FRA" },
  { code: "NL1", name: "Eredivisie", flag: "🇳🇱", countryCode: "NLD" },
  { code: "PO1", name: "Primeira Liga", flag: "🇵🇹", countryCode: "PRT" },
];

export function leagueName(code: string | null): string {
  return LEAGUES.find((l) => l.code === code)?.name ?? "";
}

export function leagueFlag(code: string | null): string {
  return LEAGUES.find((l) => l.code === code)?.flag ?? "";
}
