"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { supabase } from "./supabase";
import { useGame } from "./store";
import { canPlayerPlay } from "./positions";
import type { DraftedPlayer, RawPos } from "./types";
import type { PosKey } from "./positions";
import { POS_BAND } from "./positions";

export const BASE_OVERALL = 60;
export const MAX_OVERALL = 99;
export const EXTRA_POSITION_COST = 3;
export const XP_PER_SEASON = 1;
export const XP_PER_CHAMPIONSHIP = 2;

/** XP nodig om van level N naar N+1 te gaan (index 0 = level 1 -> 2, enz.). Level 40 is het maximum. */
export const LEVEL_XP_COSTS = [
  1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 6, 6, 7, 8,
  9, 9, 10, 12, 13, 14, 16, 17, 19, 21, 23, 26, 29, 32, 35, 39, 43, 48, 53,
];

export interface CustomPlayerData {
  id: string;
  name: string;
  position: PosKey;
  extraPositions: PosKey[];
  overall: number;
  xp: number;
  level: number;
  skillPoints: number;
  totalGoals: number;
  totalAssists: number;
  totalCleanSheets: number;
  seasonsPlayed: number;
  championships: number;
}

interface SeasonStats {
  champion: boolean;
  goals: number;
  assists: number;
  cleanSheets: number;
}

interface CustomPlayerState {
  player: CustomPlayerData | null;
  loading: boolean;
  loaded: boolean;

  load: (userId: string) => Promise<void>;
  create: (userId: string, name: string, position: PosKey) => Promise<boolean>;
  rename: (userId: string, name: string) => Promise<void>;
  recordSeason: (userId: string, stats: SeasonStats) => Promise<void>;
  spendOnOverall: (userId: string) => Promise<void>;
  spendOnPosition: (userId: string, position: PosKey) => Promise<void>;
}

function fromRow(data: Record<string, unknown>): CustomPlayerData {
  return {
    id: data.id as string,
    name: data.name as string,
    position: data.position as PosKey,
    extraPositions: (data.extra_positions as PosKey[]) ?? [],
    overall: data.overall as number,
    xp: data.xp as number,
    level: data.level as number,
    skillPoints: data.skill_points as number,
    totalGoals: (data.total_goals as number) ?? 0,
    totalAssists: (data.total_assists as number) ?? 0,
    totalCleanSheets: (data.total_clean_sheets as number) ?? 0,
    seasonsPlayed: (data.seasons_played as number) ?? 0,
    championships: (data.championships as number) ?? 0,
  };
}

function levelForXp(xp: number): number {
  let level = 1;
  let remaining = xp;
  for (const cost of LEVEL_XP_COSTS) {
    if (remaining < cost) break;
    remaining -= cost;
    level++;
  }
  return level;
}

/** Voortgang binnen het huidige level: xp verzameld sinds de laatste level-up en xp nodig voor de volgende. */
export function xpProgress(xp: number): { level: number; current: number; needed: number } {
  let level = 1;
  let remaining = xp;
  for (const cost of LEVEL_XP_COSTS) {
    if (remaining < cost) return { level, current: remaining, needed: cost };
    remaining -= cost;
    level++;
  }
  return { level, current: 0, needed: 0 };
}

export const useCustomPlayer = create<CustomPlayerState>((set, get) => ({
  player: null,
  loading: false,
  loaded: false,

  load: async (userId) => {
    if (get().loading) return;
    set({ loading: true });
    const { data } = await supabase
      .from("custom_players")
      .select("*")
      .eq("user_id", userId)
      .single();
    set({ player: data ? fromRow(data) : null, loading: false, loaded: true });
  },

  create: async (userId, name, position) => {
    const trimmed = name.trim().slice(0, 20);
    if (!trimmed) return false;
    const { data, error } = await supabase
      .from("custom_players")
      .insert({ user_id: userId, name: trimmed, position, overall: BASE_OVERALL })
      .select()
      .single();
    if (error || !data) return false;
    set({ player: fromRow(data), loaded: true });
    return true;
  },

  rename: async (userId, name) => {
    const { player } = get();
    const trimmed = name.trim().slice(0, 20);
    if (!player || !trimmed) return;
    await supabase.from("custom_players").update({ name: trimmed }).eq("user_id", userId);
    set({ player: { ...player, name: trimmed } });
  },

  recordSeason: async (userId, stats) => {
    const { player } = get();
    if (!player) return;
    const xp = player.xp + (stats.champion ? XP_PER_CHAMPIONSHIP : XP_PER_SEASON);
    const level = levelForXp(xp);
    const skillPoints = player.skillPoints + Math.max(0, level - player.level);
    const totalGoals = player.totalGoals + stats.goals;
    const totalAssists = player.totalAssists + stats.assists;
    const totalCleanSheets = player.totalCleanSheets + stats.cleanSheets;
    const seasonsPlayed = player.seasonsPlayed + 1;
    const championships = player.championships + (stats.champion ? 1 : 0);
    await supabase.from("custom_players").update({
      xp, level, skill_points: skillPoints,
      total_goals: totalGoals, total_assists: totalAssists, total_clean_sheets: totalCleanSheets,
      seasons_played: seasonsPlayed, championships,
    }).eq("user_id", userId);
    set({ player: { ...player, xp, level, skillPoints, totalGoals, totalAssists, totalCleanSheets, seasonsPlayed, championships } });
  },

  spendOnOverall: async (userId) => {
    const { player } = get();
    if (!player || player.skillPoints < 1 || player.overall >= MAX_OVERALL) return;
    const overall = Math.min(MAX_OVERALL, player.overall + 1);
    const skillPoints = player.skillPoints - 1;
    await supabase.from("custom_players").update({ overall, skill_points: skillPoints }).eq("user_id", userId);
    set({ player: { ...player, overall, skillPoints } });
  },

  spendOnPosition: async (userId, position) => {
    const { player } = get();
    if (!player || player.skillPoints < EXTRA_POSITION_COST) return;
    if (player.position === position || player.extraPositions.includes(position)) return;
    const extraPositions = [...player.extraPositions, position];
    const skillPoints = player.skillPoints - EXTRA_POSITION_COST;
    await supabase.from("custom_players").update({ extra_positions: extraPositions, skill_points: skillPoints }).eq("user_id", userId);
    set({ player: { ...player, extraPositions, skillPoints } });
  },
}));

const BAND_TO_RAW_POS: Record<string, RawPos> = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfield",
  ATT: "Attack",
};

/** Zet de profielspeler om in een DraftedPlayer die in een opstelling geplaatst kan worden. */
export function customPlayerToDrafted(cp: CustomPlayerData): DraftedPlayer {
  const customPositions = [cp.position, ...cp.extraPositions];
  return {
    pid: `custom-${cp.id}`,
    name: cp.name,
    pos: BAND_TO_RAW_POS[POS_BAND[cp.position]] ?? "Missing",
    sub: "Jouw speler",
    overall: cp.overall,
    attack: cp.overall,
    defense: cp.overall,
    goals: 0,
    assists: 0,
    minutes: 0,
    games: 0,
    mv: 0,
    customPositions,
    fromClub: "Jouw speler",
    fromSeason: "—",
    fromId: `custom-${cp.id}`,
  };
}

/** Herkent of een gedraft/geplaatste speler de profielspeler is. */
export function isCustomPlayer(p: { fromId?: string } | null | undefined): boolean {
  return !!p?.fromId?.startsWith("custom-");
}

/** Zorgt dat de profielspeler van de ingelogde gebruiker geladen is. Retourneert of we klaar zijn om te renderen. */
export function useEnsureCustomPlayerLoaded(userId: string | null): boolean {
  const loaded = useCustomPlayer((s) => s.loaded);
  const loading = useCustomPlayer((s) => s.loading);
  const load = useCustomPlayer((s) => s.load);

  useEffect(() => {
    if (userId && !loaded && !loading) load(userId);
  }, [userId, loaded, loading, load]);

  return !userId || loaded;
}

/** Status van de profielspeler t.o.v. de huidige opstelling-in-opbouw: nodig om te bepalen of hij verplicht eerst toegevoegd moet worden. `enabled` staat lobby's toe de profielspeler helemaal uit te schakelen. */
export function useCustomPlayerSlot(enabled: boolean = true) {
  const player = useCustomPlayer((s) => s.player);
  const slots = useGame((s) => s.slots);

  if (!enabled || !player) {
    return { player: null, drafted: null, alreadyAdded: false, blocking: false };
  }
  const drafted = customPlayerToDrafted(player);
  const alreadyAdded = slots.some((s) => isCustomPlayer(s.player));
  const hasOpenSlot = !alreadyAdded && slots.some((s) => !s.player && canPlayerPlay(drafted, s.pos));
  return { player, drafted, alreadyAdded, blocking: hasOpenSlot };
}
