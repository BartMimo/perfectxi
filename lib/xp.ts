"use client";

import { create } from "zustand";
import { supabase } from "./supabase";
import type { SimResult } from "./sim";
import { LEVEL_XP_COSTS, XP_PER_CHAMPIONSHIP, XP_PER_SEASON } from "./customPlayer";

export const MAX_LEVEL = 100;

// Zelfde XP-systeem als Mijn Speler: 1 XP per seizoen, 2 bij een kampioenschap,
// en dezelfde level-curve (LEVEL_XP_COSTS, level 1 -> 2 kost 1 XP). Voorbij het
// einde van de curve (level 40) kost elk volgend level evenveel als de laatste
// stap, tot maximaal level 100.
export function xpProgress(xp: number): { level: number; current: number; needed: number } {
  const lastCost = LEVEL_XP_COSTS[LEVEL_XP_COSTS.length - 1];
  let level = 1;
  let remaining = xp;
  while (level < MAX_LEVEL) {
    const cost = level - 1 < LEVEL_XP_COSTS.length ? LEVEL_XP_COSTS[level - 1] : lastCost;
    if (remaining < cost) return { level, current: remaining, needed: cost };
    remaining -= cost;
    level++;
  }
  return { level: MAX_LEVEL, current: 0, needed: 0 };
}

const KEY = "pxi_xp";

export function computeSeasonXp(result: SimResult): number {
  return result.position === 1 ? XP_PER_CHAMPIONSHIP : XP_PER_SEASON;
}

interface XpState {
  totalXp: number;
  loadedFor: string | null; // "local" (gast) of userId
  load: (userId: string | null) => void;
  addXp: (amount: number, userId: string | null) => { before: number; after: number };
}

export const useXp = create<XpState>((set, get) => ({
  totalXp: 0,
  loadedFor: null,
  load(userId) {
    const key = userId ?? "local";
    if (get().loadedFor === key || typeof window === "undefined") return;
    set({ loadedFor: key, totalXp: Number(localStorage.getItem(KEY)) || 0 });
    if (userId) {
      supabase
        .from("users")
        .select("xp")
        .eq("id", userId)
        .single()
        .then(({ data }) => {
          if (data && typeof data.xp === "number") set({ totalXp: data.xp });
        });
    }
  },
  addXp(amount, userId) {
    const before = get().totalXp;
    const after = before + amount;
    set({ totalXp: after });
    if (userId) {
      supabase.from("users").update({ xp: after }).eq("id", userId).then(() => {});
    } else {
      localStorage.setItem(KEY, String(after));
    }
    return { before, after };
  },
}));
