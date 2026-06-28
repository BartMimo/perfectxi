import type { PosKey } from "./positions";

export interface FormationSlot {
  id: string;
  pos: PosKey;
  /** Veld-coördinaten in % (x: 0 links → 100 rechts, y: 0 eigen doel → 100 aanval). */
  x: number;
  y: number;
}

export interface Formation {
  key: string;
  label: string;
  slots: FormationSlot[];
}

// Compacte definitie: [pos, x, y]. Ids worden automatisch toegekend.
type Def = [PosKey, number, number];

function f(key: string, label: string, defs: Def[]): Formation {
  const counts: Record<string, number> = {};
  const slots = defs.map(([pos, x, y]) => {
    counts[pos] = (counts[pos] ?? 0) + 1;
    return { id: `${pos}${counts[pos]}`, pos, x, y };
  });
  return { key, label, slots };
}

const BACK4: Def[] = [
  ["LB", 16, 24],
  ["CB", 38, 23],
  ["CB", 62, 23],
  ["RB", 84, 24],
];

const BACK3: Def[] = [
  ["CB", 27, 23],
  ["CB", 50, 22],
  ["CB", 73, 23],
];

const BACK5: Def[] = [
  ["LWB", 9, 30],
  ["CB", 30, 23],
  ["CB", 50, 22],
  ["CB", 70, 23],
  ["RWB", 91, 30],
];

export const FORMATIONS: Formation[] = [
  f("433", "4-3-3", [
    ["GK", 50, 11],
    ...BACK4,
    ["CM", 28, 48],
    ["CM", 50, 44],
    ["CM", 72, 48],
    ["LW", 18, 76],
    ["ST", 50, 86],
    ["RW", 82, 76],
  ]),
  f("442", "4-4-2", [
    ["GK", 50, 11],
    ...BACK4,
    ["LM", 14, 52],
    ["CM", 38, 50],
    ["CM", 62, 50],
    ["RM", 86, 52],
    ["ST", 38, 85],
    ["ST", 62, 85],
  ]),
  f("4231", "4-2-3-1", [
    ["GK", 50, 11],
    ...BACK4,
    ["CDM", 36, 40],
    ["CDM", 64, 40],
    ["LW", 18, 66],
    ["CAM", 50, 64],
    ["RW", 82, 66],
    ["ST", 50, 88],
  ]),
  f("41212", "4-1-2-1-2", [
    ["GK", 50, 11],
    ...BACK4,
    ["CDM", 50, 40],
    ["LM", 22, 54],
    ["RM", 78, 54],
    ["CAM", 50, 66],
    ["ST", 38, 86],
    ["ST", 62, 86],
  ]),
  f("352", "3-5-2", [
    ["GK", 50, 11],
    ...BACK3,
    ["LWB", 10, 48],
    ["CM", 33, 50],
    ["CM", 50, 45],
    ["CM", 67, 50],
    ["RWB", 90, 48],
    ["ST", 38, 85],
    ["ST", 62, 85],
  ]),
  f("343", "3-4-3", [
    ["GK", 50, 11],
    ...BACK3,
    ["LM", 14, 50],
    ["CM", 38, 50],
    ["CM", 62, 50],
    ["RM", 86, 50],
    ["LW", 22, 80],
    ["ST", 50, 86],
    ["RW", 78, 80],
  ]),
  f("532", "5-3-2", [
    ["GK", 50, 11],
    ...BACK5,
    ["CM", 28, 52],
    ["CM", 50, 50],
    ["CM", 72, 52],
    ["ST", 38, 85],
    ["ST", 62, 85],
  ]),
  f("541", "5-4-1", [
    ["GK", 50, 11],
    ...BACK5,
    ["LM", 14, 54],
    ["CM", 38, 52],
    ["CM", 62, 52],
    ["RM", 86, 54],
    ["ST", 50, 86],
  ]),
  f("451", "4-5-1", [
    ["GK", 50, 11],
    ...BACK4,
    ["LM", 11, 52],
    ["CM", 31, 52],
    ["CM", 50, 49],
    ["CM", 69, 52],
    ["RM", 89, 52],
    ["ST", 50, 86],
  ]),
  f("4411", "4-4-1-1", [
    ["GK", 50, 11],
    ...BACK4,
    ["LM", 14, 50],
    ["CM", 38, 50],
    ["CM", 62, 50],
    ["RM", 86, 50],
    ["CAM", 50, 68],
    ["ST", 50, 87],
  ]),
  f("4321", "4-3-2-1", [
    ["GK", 50, 11],
    ...BACK4,
    ["CM", 28, 48],
    ["CM", 50, 45],
    ["CM", 72, 48],
    ["CAM", 36, 67],
    ["CAM", 64, 67],
    ["ST", 50, 88],
  ]),
  f("3412", "3-4-1-2", [
    ["GK", 50, 11],
    ...BACK3,
    ["LM", 14, 50],
    ["CM", 38, 50],
    ["CM", 62, 50],
    ["RM", 86, 50],
    ["CAM", 50, 67],
    ["ST", 38, 87],
    ["ST", 62, 87],
  ]),
];

export function getFormation(key: string): Formation {
  return FORMATIONS.find((fm) => fm.key === key) ?? FORMATIONS[0];
}
