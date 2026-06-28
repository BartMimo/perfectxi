"use client";

import { create } from "zustand";
import type { ClubSeason, ClubSeasonLite, DraftedPlayer, Player } from "./types";
import type { PosKey } from "./positions";
import { canPlayerPlay } from "./positions";
import { getFormation } from "./formations";
import { simulateSeason, type SimResult } from "./sim";
import { simulateCL, type CLResult } from "./simCL";
import { getDivisionRatingRange } from "./career";

export type Phase = "start" | "play" | "simulating" | "result";
export type GameMode = "league" | "cl" | "career";
export type RatingMode = "actual" | "prime";
export type Difficulty = "normal" | "hard";

export const CURRENT_SEASON = "2025-2026";
const OPPONENT_COUNT = 19; // + jouw XI = 20 teams = 38 wedstrijden

// Client-side squad-cache: opgehaalde squads blijven bewaard en worden al
// tijdens de rad-animatie geprefetcht, zodat ze direct beschikbaar zijn.
const squadCache = new Map<string, ClubSeason>();
const squadInflight = new Map<string, Promise<ClubSeason>>();

function loadSquad(id: string): Promise<ClubSeason> {
  const cached = squadCache.get(id);
  if (cached) return Promise.resolve(cached);
  const inflight = squadInflight.get(id);
  if (inflight) return inflight;
  const p = fetch(`/api/squad/${encodeURIComponent(id)}`)
    .then((r) => {
      if (!r.ok) throw new Error("Kon squad niet laden");
      return r.json() as Promise<ClubSeason>;
    })
    .then((s) => {
      squadCache.set(id, s);
      squadInflight.delete(id);
      return s;
    })
    .catch((e) => {
      squadInflight.delete(id);
      throw e;
    });
  squadInflight.set(id, p);
  return p;
}

/** Effectieve ratings van een speler op basis van de gekozen rating-modus. */
export function effectiveStats(player: Player, mode: RatingMode) {
  if (mode === "prime" && player.prime) return player.prime;
  return { overall: player.overall, attack: player.attack, defense: player.defense };
}

export interface Slot {
  id: string;
  pos: PosKey;
  x: number;
  y: number;
  player: DraftedPlayer | null;
}

function buildSlots(formationKey: string): Slot[] {
  return getFormation(formationKey).slots.map((s) => ({
    id: s.id,
    pos: s.pos,
    x: s.x,
    y: s.y,
    player: null,
  }));
}

/** Tegenstanders: clubs uit de gekozen competitie in het huidige seizoen,
 *  aangevuld met recente clubs van dezelfde competitie tot er 19 zijn. */
function buildOpponents(index: ClubSeasonLite[], leagueCode: string): ClubSeasonLite[] {
  const inLeague = index.filter((c) => c.leagueCode === leagueCode);
  const current = inLeague.filter((c) => c.season === CURRENT_SEASON);
  const seen = new Set(current.map((c) => c.club));
  const result = [...current];
  // aanvullen met andere (recente) seizoenen, geen dubbele clubnamen
  const extras = inLeague
    .filter((c) => c.season !== CURRENT_SEASON)
    .sort((a, b) => b.season.localeCompare(a.season));
  for (const c of extras) {
    if (result.length >= OPPONENT_COUNT) break;
    if (seen.has(c.club)) continue;
    seen.add(c.club);
    result.push(c);
  }
  return result.slice(0, OPPONENT_COUNT);
}

function buildCLOpponents(index: ClubSeasonLite[]): ClubSeasonLite[] {
  const current = index.filter((c) => c.season === CURRENT_SEASON);
  const seen = new Set(current.map((c) => c.club));
  const result = [...current];
  const extras = index
    .filter((c) => c.season !== CURRENT_SEASON)
    .sort((a, b) => b.teamRating - a.teamRating);
  for (const c of extras) {
    if (result.length >= 63) break;
    if (seen.has(c.club)) continue;
    seen.add(c.club);
    result.push(c);
  }
  return result.sort((a, b) => b.teamRating - a.teamRating).slice(0, 63);
}

function buildDivisionOpponents(index: ClubSeasonLite[], division: number): ClubSeasonLite[] {
  const [minR, maxR] = getDivisionRatingRange(division);
  const mid = (minR + maxR) / 2;
  const all = index.filter((c) => c.season === CURRENT_SEASON);
  const seen = new Set<string>();
  const candidates: ClubSeasonLite[] = [];
  // Sort by distance to division midpoint
  const sorted = [...all].sort((a, b) => Math.abs(a.teamRating - mid) - Math.abs(b.teamRating - mid));
  for (const c of sorted) {
    if (seen.has(c.club)) continue;
    seen.add(c.club);
    // Clamp rating to division range
    candidates.push({ ...c, teamRating: Math.max(minR, Math.min(maxR, c.teamRating)) });
    if (candidates.length >= OPPONENT_COUNT) break;
  }
  // Fill remaining with synthetic teams if needed
  while (candidates.length < OPPONENT_COUNT) {
    const r = minR + Math.random() * (maxR - minR);
    candidates.push({
      id: `div${division}-fill-${candidates.length}`,
      league: `Divisie ${division}`,
      leagueCode: "DIV",
      club: `FC Div${division}-${candidates.length + 1}`,
      season: CURRENT_SEASON,
      teamRating: Math.round(r),
    });
  }
  return candidates.slice(0, OPPONENT_COUNT);
}

export const filledCount = (slots: Slot[]) => slots.filter((s) => s.player).length;

/** Posities waarheen de geselecteerde speler verplaatst/geruild kan worden. */
export function validTargets(slots: Slot[], selectedId: string | null): Set<string> {
  const targets = new Set<string>();
  if (!selectedId) return targets;
  const from = slots.find((s) => s.id === selectedId);
  if (!from?.player) return targets;
  for (const s of slots) {
    if (s.id === selectedId) continue;
    if (!s.player) {
      if (canPlayerPlay(from.player, s.pos)) targets.add(s.id);
    } else if (canPlayerPlay(from.player, s.pos) && canPlayerPlay(s.player, from.pos)) {
      targets.add(s.id);
    }
  }
  return targets;
}

/** Lege slots waar deze (nog te plaatsen) speler in kan. */
export function placementTargets(slots: Slot[], player: Player | null): Set<string> {
  const targets = new Set<string>();
  if (!player) return targets;
  for (const s of slots) {
    if (!s.player && canPlayerPlay(player, s.pos)) targets.add(s.id);
  }
  return targets;
}

interface GameState {
  index: ClubSeasonLite[];
  formationKey: string;
  leagueCode: string | null;
  ratingMode: RatingMode;
  difficulty: Difficulty;
  phase: Phase;
  slots: Slot[];
  opponents: ClubSeasonLite[];

  spinning: boolean;
  spinRequested: boolean;
  landed: ClubSeasonLite | null;
  squad: ClubSeason | null;
  loadingSquad: boolean;
  error: string | null;
  selectedSlotId: string | null;
  pendingPlayer: Player | null; // gekozen speler die nog op een positie geplaatst moet worden
  rerollsLeft: number;

  result: SimResult | null;
  clResult: CLResult | null;
  gameMode: GameMode;
  isChallenge: boolean;
  challengeWeek: string | null;

  setIndex: (idx: ClubSeasonLite[]) => void;
  setFormation: (key: string) => void;
  setLeague: (code: string) => void;
  setRatingMode: (mode: RatingMode) => void;
  setDifficulty: (d: Difficulty) => void;
  startGame: () => void;
  startCL: () => void;
  startCareerSeason: (division: number, existingSquad?: DraftedPlayer[]) => void;
  startChallenge: (leagueCode: string, formationKey: string, ratingMode: RatingMode, difficulty: Difficulty, week: string) => void;
  beginSpin: () => void;
  prefetchSquad: (id: string) => void;
  land: (pick: ClubSeasonLite) => Promise<void>;
  requestSpin: () => void;
  reroll: () => void;
  pickPlayer: (player: Player) => void;
  placeInSlot: (player: Player, slotId: string) => void;
  cancelPick: () => void;
  onSlotClick: (slotId: string) => void;
  clearSelection: () => void;
  simulate: (teamName?: string) => void;
  finishSimulation: () => void;
  newGame: () => void;
}

const rerollsFor = (d: Difficulty) => (d === "normal" ? 1 : 0);

export const useGame = create<GameState>((set, get) => ({
  index: [],
  formationKey: "433",
  leagueCode: null,
  ratingMode: "actual",
  difficulty: "normal",
  phase: "start",
  slots: buildSlots("433"),
  opponents: [],
  spinning: false,
  spinRequested: false,
  landed: null,
  squad: null,
  loadingSquad: false,
  error: null,
  selectedSlotId: null,
  pendingPlayer: null,
  rerollsLeft: 1,
  result: null,
  clResult: null,
  gameMode: "league" as GameMode,
  isChallenge: false,
  challengeWeek: null,

  setIndex: (idx) => set({ index: idx }),
  setFormation: (key) => set({ formationKey: key, slots: buildSlots(key) }),
  setLeague: (code) => set({ leagueCode: code }),
  setRatingMode: (mode) => set({ ratingMode: mode }),
  setDifficulty: (d) => set({ difficulty: d }),

  startGame: () => {
    const { formationKey, leagueCode, index, difficulty } = get();
    if (!leagueCode) return;
    set({
      phase: "play",
      gameMode: "league",
      slots: buildSlots(formationKey),
      opponents: buildOpponents(index, leagueCode),
      landed: null,
      squad: null,
      result: null,
      clResult: null,
      selectedSlotId: null,
      pendingPlayer: null,
      rerollsLeft: rerollsFor(difficulty),
      isChallenge: false,
      challengeWeek: null,
      error: null,
    });
  },

  startCL: () => {
    const { formationKey, index, difficulty, ratingMode } = get();
    set({
      phase: "play",
      gameMode: "cl",
      leagueCode: null,
      formationKey,
      ratingMode,
      difficulty,
      slots: buildSlots(formationKey),
      opponents: buildCLOpponents(index),
      landed: null,
      squad: null,
      result: null,
      clResult: null,
      selectedSlotId: null,
      pendingPlayer: null,
      rerollsLeft: rerollsFor(difficulty),
      isChallenge: false,
      challengeWeek: null,
      error: null,
    });
  },

  startCareerSeason: (division: number, existingSquad?: DraftedPlayer[]) => {
    const { formationKey, index } = get();
    const newSlots = buildSlots(formationKey);

    // Pre-fill slots with existing career squad
    if (existingSquad && existingSquad.length > 0) {
      for (const player of existingSquad) {
        const eligible = newSlots.filter(
          (s) => !s.player && canPlayerPlay(player, s.pos),
        );
        if (eligible.length > 0) {
          eligible[0].player = player;
        }
      }
    }

    const needsDraft = newSlots.some((s) => !s.player);

    set({
      phase: "play",
      gameMode: "career",
      leagueCode: null,
      ratingMode: "actual",
      difficulty: "normal",
      slots: newSlots,
      opponents: buildDivisionOpponents(index, division),
      landed: null,
      squad: null,
      result: null,
      clResult: null,
      selectedSlotId: null,
      pendingPlayer: null,
      rerollsLeft: 1,
      isChallenge: false,
      challengeWeek: null,
      error: null,
    });
  },

  startChallenge: (leagueCode, formationKey, ratingMode, difficulty, week) => {
    const { index } = get();
    set({
      leagueCode,
      formationKey,
      ratingMode,
      difficulty,
      phase: "play",
      slots: buildSlots(formationKey),
      opponents: buildOpponents(index, leagueCode),
      landed: null,
      squad: null,
      result: null,
      selectedSlotId: null,
      pendingPlayer: null,
      rerollsLeft: rerollsFor(difficulty),
      isChallenge: true,
      challengeWeek: week,
      error: null,
    });
  },

  beginSpin: () =>
    set({
      spinning: true,
      spinRequested: false,
      landed: null,
      squad: null,
      error: null,
      selectedSlotId: null,
      pendingPlayer: null,
    }),

  prefetchSquad: (id) => {
    loadSquad(id).catch(() => {});
  },

  land: async (pick) => {
    const cached = squadCache.get(pick.id);
    set({ spinning: false, landed: pick, squad: cached ?? null, loadingSquad: !cached, error: null });
    if (cached) return;
    try {
      const squad = await loadSquad(pick.id);
      if (get().landed?.id === pick.id) set({ squad, loadingSquad: false });
    } catch (e) {
      if (get().landed?.id === pick.id) set({ loadingSquad: false, error: (e as Error).message });
    }
  },

  // Vraag een nieuwe draai aan (ReelView pakt dit op en animeert).
  requestSpin: () =>
    set({ landed: null, squad: null, pendingPlayer: null, error: null, spinRequested: true }),

  reroll: () => {
    if (get().rerollsLeft <= 0) return;
    set((s) => ({ rerollsLeft: s.rerollsLeft - 1 }));
    get().requestSpin();
  },

  // Speler gekozen uit de squad: direct plaatsen bij één optie, anders
  // plaatsingsmodus aan (gebruiker tikt zelf de positie aan).
  pickPlayer: (player: Player) => {
    const { slots } = get();
    const eligible = slots.filter((s) => !s.player && canPlayerPlay(player, s.pos));
    if (eligible.length === 0) return;
    if (eligible.length === 1) {
      get().placeInSlot(player, eligible[0].id);
    } else {
      set({ pendingPlayer: player, selectedSlotId: null });
    }
  },

  placeInSlot: (player: Player, slotId: string) => {
    const { slots, squad, ratingMode, difficulty } = get();
    if (!squad) return;
    const target = slots.find((s) => s.id === slotId);
    if (!target || target.player || !canPlayerPlay(player, target.pos)) return;
    const stats = effectiveStats(player, ratingMode);
    const drafted: DraftedPlayer = {
      ...player,
      overall: stats.overall,
      attack: stats.attack,
      defense: stats.defense,
      fromClub: squad.club,
      fromSeason: squad.season,
      fromId: squad.id,
    };
    const newSlots = slots.map((s) => (s.id === slotId ? { ...s, player: drafted } : s));
    set({
      slots: newSlots,
      squad: null,
      landed: null,
      pendingPlayer: null,
      selectedSlotId: null,
    });
  },

  cancelPick: () => set({ pendingPlayer: null }),

  onSlotClick: (slotId) => {
    const { slots, selectedSlotId, pendingPlayer } = get();
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;

    // Plaatsingsmodus: tik een geldige lege positie aan.
    if (pendingPlayer) {
      if (!slot.player && canPlayerPlay(pendingPlayer, slot.pos)) {
        get().placeInSlot(pendingPlayer, slot.id);
      }
      return;
    }

    if (!selectedSlotId) {
      if (slot.player) set({ selectedSlotId: slotId });
      return;
    }
    if (selectedSlotId === slotId) {
      set({ selectedSlotId: null });
      return;
    }
    const from = slots.find((s) => s.id === selectedSlotId)!;
    const moving = from.player!;

    if (!slot.player) {
      if (canPlayerPlay(moving, slot.pos)) {
        set({
          slots: slots.map((s) =>
            s.id === slot.id ? { ...s, player: moving } : s.id === from.id ? { ...s, player: null } : s,
          ),
          selectedSlotId: null,
        });
      } else {
        set({ selectedSlotId: null });
      }
      return;
    }
    // doel is bezet → ruilen indien beiden passen
    const other = slot.player;
    if (canPlayerPlay(moving, slot.pos) && canPlayerPlay(other, from.pos)) {
      set({
        slots: slots.map((s) =>
          s.id === slot.id ? { ...s, player: moving } : s.id === from.id ? { ...s, player: other } : s,
        ),
        selectedSlotId: null,
      });
    } else {
      set({ selectedSlotId: null });
    }
  },

  clearSelection: () => set({ selectedSlotId: null }),

  simulate: (teamName?: string) => {
    const { slots, opponents, gameMode } = get();
    if (slots.some((s) => !s.player)) return;
    const lineup = slots.map((s) => ({ player: s.player!, pos: s.pos }));
    if (gameMode === "cl") {
      const clResult = simulateCL(lineup, { opponents, teamName });
      set({ clResult, result: null, phase: "simulating", selectedSlotId: null });
    } else {
      const result = simulateSeason(lineup, { opponents, teamName });
      set({ result, clResult: null, phase: "simulating", selectedSlotId: null });
    }
  },

  finishSimulation: () => set({ phase: "result" }),

  newGame: () => {
    const { formationKey } = get();
    set({
      phase: "start",
      gameMode: "league",
      slots: buildSlots(formationKey),
      landed: null,
      squad: null,
      result: null,
      clResult: null,
      spinning: false,
      spinRequested: false,
      error: null,
      selectedSlotId: null,
      pendingPlayer: null,
    });
  },
}));

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __game?: typeof useGame }).__game = useGame;
}
