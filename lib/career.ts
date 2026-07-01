"use client";

import { create } from "zustand";
import { supabase } from "./supabase";
import type { DraftedPlayer } from "./types";

export interface CareerSeason {
  season: number;
  division: number;
  position: number;
  points: number;
  gf: number;
  ga: number;
  avgRating?: number;
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

  startCareer: (userId: string) => Promise<void>;
  loadCareer: (userId: string) => Promise<void>;
  setSquad: (userId: string, squad: DraftedPlayer[]) => void;
  finishSeason: (userId: string, position: number, points: number, gf: number, ga: number) => void;
  startTransferWindow: () => void;
  toggleReplace: (playerName: string) => void;
  confirmTransfers: () => DraftedPlayer[];
  endCareer: (userId: string) => void;
}

function saveToDb(userId: string, state: { currentDivision: number; season: number; squad: DraftedPlayer[]; history: CareerSeason[]; championships: number }) {
  supabase.from("careers").upsert({
    user_id: userId,
    current_division: state.currentDivision,
    season: state.season,
    championships: state.championships,
    squad: state.squad,
    history: state.history,
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

  startCareer: async (userId) => {
    const state = {
      currentDivision: 10,
      season: 1,
      squad: [] as DraftedPlayer[],
      history: [] as CareerSeason[],
      championships: 0,
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
        loading: false,
      });
    } else {
      set({ active: false, loading: false });
    }
  },

  setSquad: (userId, squad) => {
    set({ squad });
    const s = get();
    saveToDb(userId, { currentDivision: s.currentDivision, season: s.season, squad, history: s.history, championships: s.championships });
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
    saveToDb(userId, { currentDivision: newDiv, season: s.season + 1, squad: s.squad, history, championships });
  },

  startTransferWindow: () => {
    set({ transferring: true, playersToReplace: new Set() });
  },

  toggleReplace: (playerName) => {
    const { playersToReplace } = get();
    const next = new Set(playersToReplace);
    if (next.has(playerName)) {
      next.delete(playerName);
    } else if (next.size < 2) {
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

export function divisionLabel(div: number): string {
  return `Divisie ${div}`;
}
