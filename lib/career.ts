"use client";

import { create } from "zustand";
import { supabase } from "./supabase";
import type { DraftedPlayer, ClubSeasonLite } from "./types";

export interface CareerSeason {
  season: number;
  division: number;
  position: number;
  points: number;
  gf: number;
  ga: number;
  avgRating?: number;
}

export interface CareerSettings {
  formationKey: string;
  rerollCount: number;
  wisselCount: number;
  leagues: string[];
}

export interface CareerState {
  active: boolean;
  currentDivision: number;
  season: number;
  squad: DraftedPlayer[];
  history: CareerSeason[];
  championships: number;
  transferring: boolean;
  playersToReplace: Set<string>;
  loading: boolean;
  formationKey: string;
  rerollCount: number;
  wisselCount: number;
  leagues: string[];

  startCareer: (userId: string, settings: CareerSettings) => Promise<void>;
  loadCareer: (userId: string) => Promise<void>;
  setSquad: (userId: string, squad: DraftedPlayer[]) => void;
  finishSeason: (userId: string, position: number, points: number, gf: number, ga: number) => void;
  startTransferWindow: () => void;
  toggleReplace: (playerName: string) => void;
  confirmTransfers: () => DraftedPlayer[];
  endCareer: (userId: string) => void;
}

function saveToDb(userId: string, state: {
  currentDivision: number; season: number; squad: DraftedPlayer[]; history: CareerSeason[]; championships: number;
  formationKey: string; rerollCount: number; wisselCount: number; leagues: string[];
}) {
  supabase.from("careers").upsert({
    user_id: userId,
    current_division: state.currentDivision,
    season: state.season,
    championships: state.championships,
    squad: state.squad,
    history: state.history,
    formation_key: state.formationKey,
    reroll_count: state.rerollCount,
    wissel_count: state.wisselCount,
    leagues: state.leagues,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" }).then(() => {});
}

export const useCareer = create<CareerState>((set, get) => ({
  active: false,
  currentDivision: 10,
  season: 1,
  squad: [],
  history: [],
  championships: 0,
  transferring: false,
  playersToReplace: new Set(),
  loading: false,
  formationKey: "433",
  rerollCount: 1,
  wisselCount: 2,
  leagues: [],

  startCareer: async (userId, settings) => {
    const state = {
      currentDivision: 10,
      season: 1,
      squad: [] as DraftedPlayer[],
      history: [] as CareerSeason[],
      championships: 0,
      formationKey: settings.formationKey,
      rerollCount: settings.rerollCount,
      wisselCount: settings.wisselCount,
      leagues: settings.leagues,
    };
    set({ active: true, ...state, transferring: false, playersToReplace: new Set() });
    saveToDb(userId, state);
  },

  loadCareer: async (userId) => {
    set({ loading: true });
    const { data } = await supabase
      .from("careers")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      set({
        active: true,
        currentDivision: data.current_division,
        season: data.season,
        squad: (data.squad as DraftedPlayer[]) ?? [],
        history: (data.history as CareerSeason[]) ?? [],
        championships: data.championships ?? 0,
        formationKey: (data.formation_key as string) ?? "433",
        rerollCount: (data.reroll_count as number) ?? 1,
        wisselCount: (data.wissel_count as number) ?? 2,
        leagues: (data.leagues as string[]) ?? [],
        loading: false,
      });
    } else {
      set({ active: false, loading: false });
    }
  },

  setSquad: (userId, squad) => {
    set({ squad });
    const s = get();
    saveToDb(userId, { currentDivision: s.currentDivision, season: s.season, squad, history: s.history, championships: s.championships, formationKey: s.formationKey, rerollCount: s.rerollCount, wisselCount: s.wisselCount, leagues: s.leagues });
  },

  finishSeason: (userId, position, points, gf, ga) => {
    const s = get();
    const entry: CareerSeason = { season: s.season, division: s.currentDivision, position, points, gf, ga };
    const history = [...s.history, entry];
    let newDiv = s.currentDivision;
    let championships = s.championships;

    if (position === 1) {
      championships++;
      if (newDiv > 1) newDiv--;
    } else if (position >= 18) {
      if (newDiv < 10) newDiv++;
    }

    set({ history, championships, currentDivision: newDiv, season: s.season + 1 });
    saveToDb(userId, { currentDivision: newDiv, season: s.season + 1, squad: s.squad, history, championships, formationKey: s.formationKey, rerollCount: s.rerollCount, wisselCount: s.wisselCount, leagues: s.leagues });
  },

  startTransferWindow: () => {
    set({ transferring: true, playersToReplace: new Set() });
  },

  toggleReplace: (playerName) => {
    const { playersToReplace, wisselCount } = get();
    const next = new Set(playersToReplace);
    if (next.has(playerName)) {
      next.delete(playerName);
    } else if (next.size < wisselCount) {
      next.add(playerName);
    }
    set({ playersToReplace: next });
  },

  confirmTransfers: () => {
    const { squad, playersToReplace } = get();
    const remaining = squad.filter((p) => !playersToReplace.has(p.name));
    set({ transferring: false, playersToReplace: new Set(), squad: remaining });
    return remaining;
  },

  endCareer: (userId) => {
    set({
      active: false,
      currentDivision: 10,
      season: 1,
      squad: [],
      history: [],
      championships: 0,
      transferring: false,
      playersToReplace: new Set(),
    });
    supabase.from("careers").delete().eq("user_id", userId).then(() => {});
  },
}));

const DIV_RATINGS: Record<number, [number, number]> = {
  10: [63, 69],
  9: [66, 72],
  8: [68, 74],
  7: [70, 76],
  6: [72, 78],
  5: [74, 80],
  4: [76, 82],
  3: [78, 84],
  2: [80, 86],
  1: [83, 88],
};

export function getDivisionRatingRange(div: number): [number, number] {
  return DIV_RATINGS[div] ?? [65, 70];
}

/**
 * Divisie-ratingrange, herschaald naar de daadwerkelijk haalbare teamsterkte
 * binnen de gekozen competitie(s). Zonder dit zou bv. een carrière met alleen
 * de Eredivisie nooit divisie 1 (83-88) kunnen bereiken, omdat die range
 * gekalibreerd is op toegang tot alle competities. De hele ladder schuift op
 * zodat het plafond van divisie 1 altijd overeenkomt met het beste dat binnen
 * de gekozen competities haalbaar is — de progressie (breedte per divisie)
 * blijft ongewijzigd.
 */
export function getAdjustedDivisionRange(
  div: number,
  index: Pick<ClubSeasonLite, "leagueCode" | "teamRating">[],
  leagues: string[],
): [number, number] {
  const [minR, maxR] = getDivisionRatingRange(div);
  if (index.length === 0) return [minR, maxR];

  const pool = leagues.length === 0 ? index : index.filter((c) => leagues.includes(c.leagueCode));
  if (pool.length === 0) return [minR, maxR];

  const globalCeiling = Math.max(...index.map((c) => c.teamRating));
  const leagueCeiling = Math.max(...pool.map((c) => c.teamRating));
  const shift = Math.max(-20, Math.min(10, Math.round(leagueCeiling - globalCeiling)));

  return [minR + shift, maxR + shift];
}

export function divisionLabel(div: number): string {
  return `Divisie ${div}`;
}
