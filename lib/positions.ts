import type { Player, RawPos } from "./types";

// Gedetailleerde veldposities (slot-types).
export const POS_KEYS = [
  "GK",
  "LB",
  "CB",
  "RB",
  "LWB",
  "RWB",
  "CDM",
  "CM",
  "LM",
  "RM",
  "CAM",
  "LW",
  "RW",
  "ST",
] as const;

export type PosKey = (typeof POS_KEYS)[number];

/** Brede categorie voor kleur/groepering. */
export type Band = "GK" | "DEF" | "MID" | "ATT";

export const POS_BAND: Record<PosKey, Band> = {
  GK: "GK",
  LB: "DEF",
  CB: "DEF",
  RB: "DEF",
  LWB: "DEF",
  RWB: "DEF",
  CDM: "MID",
  CM: "MID",
  LM: "MID",
  RM: "MID",
  CAM: "MID",
  LW: "ATT",
  RW: "ATT",
  ST: "ATT",
};

export function posLabel(t: (key: string) => string, pos: PosKey): string {
  return t(`position.${pos}`);
}

/**
 * Welke posities kan een speler spelen op basis van zijn gedetailleerde
 * sub-positie? Verticale rol is leidend (een spits speelt geen vleugel),
 * links/rechts is uitwisselbaar (vleugelspelers en backs mogen van kant
 * wisselen).
 */
const SUB_TO_POS: Record<string, PosKey[]> = {
  Goalkeeper: ["GK"],
  "Centre-Back": ["CB", "LB", "RB"],
  "Right-Back": ["RB", "LB", "RWB", "LWB"],
  "Left-Back": ["LB", "RB", "LWB", "RWB"],
  "Defensive Midfield": ["CDM", "CM"],
  "Central Midfield": ["CM", "CDM", "CAM"],
  "Attacking Midfield": ["CAM", "CM", "LW", "RW"],
  "Right Midfield": ["RM", "LM", "RW", "LW", "CM"],
  "Left Midfield": ["LM", "RM", "LW", "RW", "CM"],
  "Right Winger": ["RW", "LW", "RM", "LM"],
  "Left Winger": ["LW", "RW", "LM", "RM"],
  "Centre-Forward": ["ST"],
  "Second Striker": ["ST", "CAM"],
};

/** Terugval op basis van de brede positie als de sub-positie ontbreekt. */
const RAW_TO_POS: Record<RawPos, PosKey[]> = {
  Goalkeeper: ["GK"],
  Defender: ["CB", "LB", "RB", "LWB", "RWB"],
  Midfield: ["CDM", "CM", "CAM", "LM", "RM"],
  Attack: ["ST", "LW", "RW"],
  Missing: ["CB", "CM", "ST", "LB", "RB", "LW", "RW", "CDM", "CAM", "LM", "RM"],
};

/** De posities die deze speler kan bekleden. */
export function eligibleSlots(p: Pick<Player, "pos" | "sub" | "customPositions">): PosKey[] {
  if (p.customPositions && p.customPositions.length > 0) return p.customPositions as PosKey[];
  const bySub = SUB_TO_POS[p.sub];
  if (bySub) return bySub;
  return RAW_TO_POS[p.pos] ?? RAW_TO_POS.Missing;
}

export function canPlayerPlay(p: Pick<Player, "pos" | "sub" | "customPositions">, pos: PosKey): boolean {
  return eligibleSlots(p).includes(pos);
}

export function bandLabel(t: (key: string) => string, band: Band): string {
  return t(`position.band.${band}`);
}
