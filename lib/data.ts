import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { ClubSeason, ClubSeasonLite, RawData } from "./types";
import { cleanClubName } from "./clubNames";

// De dataset wordt één keer ingelezen en in module-scope gecached.
// (Bij Vercel wordt het bestand meegenomen via outputFileTracingIncludes.)
let cache: RawData | null = null;
let liteCache: ClubSeasonLite[] | null = null;
let byId: Map<string, ClubSeason> | null = null;

async function load(): Promise<RawData> {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "clubSeasons.json");
  const buf = await fs.readFile(file, "utf-8");
  cache = JSON.parse(buf) as RawData;
  // Eénmalig de clubnamen opschonen naar nette weergavenamen.
  for (const cs of cache.clubSeasons) cs.club = cleanClubName(cs.club);

  // Prime-rating per speler: de hoogste overall (+ bijbehorende att/def)
  // die deze spelersnaam ergens in de dataset bereikt.
  const prime = new Map<string, { overall: number; attack: number; defense: number }>();
  for (const cs of cache.clubSeasons) {
    for (const p of cs.players) {
      const cur = prime.get(p.name);
      if (!cur || p.overall > cur.overall) {
        prime.set(p.name, { overall: p.overall, attack: p.attack, defense: p.defense });
      }
    }
  }
  for (const cs of cache.clubSeasons) {
    for (const p of cs.players) p.prime = prime.get(p.name);
  }

  byId = new Map(cache.clubSeasons.map((cs) => [cs.id, cs]));
  return cache;
}

/** Lichte index voor het rad — zonder spelers (klein genoeg voor de client). */
export async function getIndex(): Promise<ClubSeasonLite[]> {
  if (liteCache) return liteCache;
  const data = await load();
  liteCache = data.clubSeasons.map(({ id, league, leagueCode, club, season, teamRating }) => ({
    id,
    league,
    leagueCode,
    club,
    season,
    teamRating,
  }));
  return liteCache;
}

/** Volledige squad van één club-seizoen. */
export async function getSquad(id: string): Promise<ClubSeason | null> {
  await load();
  return byId?.get(id) ?? null;
}

export async function getMeta() {
  const data = await load();
  return data.meta;
}
