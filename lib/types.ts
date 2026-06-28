// Gedeelde datatypes voor de hele app (client + server).

/** Ruwe positie-categorie zoals in de dataset. */
export type RawPos = "Goalkeeper" | "Defender" | "Midfield" | "Attack" | "Missing";

/** Slot-categorie in een formatie. */
export type SlotPos = "GK" | "DEF" | "MID" | "ATT";

export interface Player {
  pid?: string;
  name: string;
  pos: RawPos;
  sub: string;
  overall: number;
  attack: number;
  defense: number;
  goals: number;
  assists: number;
  minutes: number;
  games: number;
  mv: number;
  /** Beste bekende rating van deze speler in de hele dataset (server-side berekend). */
  prime?: { overall: number; attack: number; defense: number };
}

export interface ClubSeason {
  id: string;
  league: string;
  leagueCode: string;
  club: string;
  season: string;
  teamRating: number;
  players: Player[];
}

/** Lichte variant zonder spelers, voor het rad / index. */
export interface ClubSeasonLite {
  id: string;
  league: string;
  leagueCode: string;
  club: string;
  season: string;
  teamRating: number;
}

export interface RawData {
  meta: {
    source: string;
    leagues: Record<string, string>;
    minSeason: number;
  };
  clubSeasons: ClubSeason[];
}

/** Een speler die gedraft is, samen met herkomst-info. */
export interface DraftedPlayer extends Player {
  fromClub: string;
  fromSeason: string;
  fromId: string;
}
