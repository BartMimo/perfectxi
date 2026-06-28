"use client";

import { create } from "zustand";
import type { DraftedPlayer } from "./types";

export interface CareerSeason {
  season: number;
  division: number;
  position: number;
  points: number;
  gf: number;
  ga: number;
}

export interface CareerState {
  active: boolean;
  currentDivision: number;
  season: number;
  squad: DraftedPlayer[];
  history: CareerSeason[];
  championships: number;
  transfersLeft: number;
  transferring: boolean;
  playersToReplace: Set<string>;

  startCareer: () => void;
  setSquad: (squad: DraftedPlayer[]) => void;
  finishSeason: (position: number, points: number, gf: number, ga: number) => void;
  startTransferWindow: () => void;
  toggleReplace: (playerName: string) => void;
  confirmTransfers: () => DraftedPlayer[];
  endCareer: () => void;
  restore: () => void;
}

const STORAGE_KEY = "pxi_career";

function saveToStorage(state: Pick<CareerState, "active" | "currentDivision" | "season" | "squad" | "history" | "championships">) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    active: state.active,
    currentDivision: state.currentDivision,
    season: state.season,
    squad: state.squad,
    history: state.history,
    championships: state.championships,
  }));
}

export const useCareer = create<CareerState>((set, get) => ({
  active: false,
  currentDivision: 10,
  season: 1,
  squad: [],
  history: [],
  championships: 0,
  transfersLeft: 0,
  transferring: false,
  playersToReplace: new Set(),

  startCareer: () => {
    const state = {
      active: true,
      currentDivision: 10,
      season: 1,
      squad: [],
      history: [],
      championships: 0,
      transfersLeft: 0,
      transferring: false,
      playersToReplace: new Set<string>(),
    };
    set(state);
    saveToStorage(state);
  },

  setSquad: (squad) => {
    set({ squad });
    const s = get();
    saveToStorage(s);
  },

  finishSeason: (position, points, gf, ga) => {
    const s = get();
    const entry: CareerSeason = {
      season: s.season,
      division: s.currentDivision,
      position,
      points,
      gf,
      ga,
    };
    const history = [...s.history, entry];
    let newDiv = s.currentDivision;
    let championships = s.championships;

    if (position === 1) {
      championships++;
      if (newDiv > 1) newDiv--;
    } else if (position >= 18) {
      if (newDiv < 10) newDiv++;
    }

    const newState = {
      ...s,
      history,
      championships,
      currentDivision: newDiv,
      season: s.season + 1,
    };
    set(newState);
    saveToStorage(newState);
  },

  startTransferWindow: () => {
    set({ transferring: true, transfersLeft: 2, playersToReplace: new Set() });
  },

  toggleReplace: (playerName) => {
    const { playersToReplace, transfersLeft } = get();
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
    const s = get();
    saveToStorage(s);
    return remaining;
  },

  endCareer: () => {
    set({
      active: false,
      currentDivision: 10,
      season: 1,
      squad: [],
      history: [],
      championships: 0,
      transfersLeft: 0,
      transferring: false,
      playersToReplace: new Set(),
    });
    localStorage.removeItem(STORAGE_KEY);
  },

  restore: () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      set({
        active: data.active ?? false,
        currentDivision: data.currentDivision ?? 10,
        season: data.season ?? 1,
        squad: data.squad ?? [],
        history: data.history ?? [],
        championships: data.championships ?? 0,
      });
    } catch {}
  },
}));

// Division rating ranges: div 10 = weakest, div 1 = strongest
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
