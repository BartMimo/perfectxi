"use client";

import { create } from "zustand";
import { supabase } from "./supabase";
import type { DraftedPlayer } from "./types";
import type { CareerSeason } from "./career";

export interface OnlinePlayer {
  id: string;
  user_id: string;
  username: string;
  team_name: string | null;
  current_division: number;
  squad: DraftedPlayer[];
  history: CareerSeason[];
  championships: number;
  ready: boolean;
  is_bot: boolean;
}

export interface OnlineCareer {
  id: string;
  code: string;
  owner_id: string;
  status: "waiting" | "drafting" | "simulating" | "finished";
  current_season: number;
  max_players: number;
  players: OnlinePlayer[];
}

export interface MyLobbyInfo {
  code: string;
  status: string;
  current_season: number;
  player_count: number;
  current_division: number;
}

interface OnlineCareerState {
  lobby: OnlineCareer | null;
  myLobbies: MyLobbyInfo[];
  loading: boolean;
  error: string | null;
  subscription: ReturnType<typeof supabase.channel> | null;
  pollInterval: ReturnType<typeof setInterval> | null;

  loadMyLobbies: (userId: string) => Promise<void>;
  createLobby: (userId: string, username: string, teamName: string | null) => Promise<string | null>;
  joinLobby: (code: string, userId: string, username: string, teamName: string | null) => Promise<boolean>;
  loadLobby: (code: string) => Promise<void>;
  leaveLobby: (userId: string) => Promise<void>;
  deleteLobby: () => Promise<void>;
  subscribe: (code: string) => void;
  unsubscribe: () => void;

  kickPlayer: (userId: string) => Promise<void>;
  startDraft: () => Promise<void>;
  setReady: (userId: string, ready: boolean) => Promise<void>;
  saveSquad: (userId: string, squad: DraftedPlayer[]) => Promise<void>;
  finishSeason: (userId: string, position: number, points: number, gf: number, ga: number) => Promise<void>;
  advanceSeason: () => Promise<void>;
  getDivisionPlayers: (division: number) => OnlinePlayer[];
  getSeasonSeed: (division: number) => number;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function fetchPlayers(careerId: string): Promise<OnlinePlayer[]> {
  const { data } = await supabase
    .from("online_career_players")
    .select("*")
    .eq("career_id", careerId)
    .order("joined_at", { ascending: true });
  if (!data) return [];
  return data.map((p: Record<string, unknown>) => ({
    id: p.id as string,
    user_id: p.user_id as string,
    username: p.username as string,
    team_name: p.team_name as string | null,
    current_division: p.current_division as number,
    squad: (p.squad as DraftedPlayer[]) ?? [],
    history: (p.history as CareerSeason[]) ?? [],
    championships: p.championships as number,
    ready: p.ready as boolean,
    is_bot: p.is_bot as boolean,
  }));
}

export const useOnlineCareer = create<OnlineCareerState>((set, get) => ({
  lobby: null,
  myLobbies: [],
  loading: false,
  error: null,
  subscription: null,
  pollInterval: null,

  loadMyLobbies: async (userId) => {
    const { data: memberships } = await supabase
      .from("online_career_players")
      .select("career_id, current_division")
      .eq("user_id", userId)
      .eq("is_bot", false);

    if (!memberships || memberships.length === 0) {
      set({ myLobbies: [] });
      return;
    }

    const careerIds = memberships.map((m) => m.career_id as string);
    const { data: careers } = await supabase
      .from("online_careers")
      .select("id, code, status, current_season")
      .in("id", careerIds);

    if (!careers) {
      set({ myLobbies: [] });
      return;
    }

    const lobbies: MyLobbyInfo[] = [];
    for (const c of careers) {
      const { count } = await supabase
        .from("online_career_players")
        .select("*", { count: "exact", head: true })
        .eq("career_id", c.id);

      const mem = memberships.find((m) => m.career_id === c.id);
      lobbies.push({
        code: c.code as string,
        status: c.status as string,
        current_season: c.current_season as number,
        player_count: count ?? 0,
        current_division: (mem?.current_division as number) ?? 10,
      });
    }

    set({ myLobbies: lobbies });
  },

  createLobby: async (userId, username, teamName) => {
    set({ loading: true, error: null });
    const code = generateCode();

    const { data: career, error } = await supabase
      .from("online_careers")
      .insert({ code, owner_id: userId, status: "waiting", current_season: 1 })
      .select()
      .single();

    if (error || !career) {
      set({ loading: false, error: "Kon lobby niet aanmaken" });
      return null;
    }

    await supabase.from("online_career_players").insert({
      career_id: career.id,
      user_id: userId,
      username,
      team_name: teamName,
    });

    const players = await fetchPlayers(career.id);
    set({
      lobby: {
        id: career.id,
        code: career.code,
        owner_id: career.owner_id,
        status: career.status,
        current_season: career.current_season,
        max_players: career.max_players,
        players,
      },
      loading: false,
    });

    return code;
  },

  joinLobby: async (code, userId, username, teamName) => {
    set({ loading: true, error: null });
    const { data: career } = await supabase
      .from("online_careers")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .single();

    if (!career) {
      set({ loading: false, error: "Lobby niet gevonden" });
      return false;
    }

    if (career.status !== "waiting") {
      set({ loading: false, error: "Dit spel is al begonnen" });
      return false;
    }

    const players = await fetchPlayers(career.id);
    if (players.length >= career.max_players) {
      set({ loading: false, error: "Lobby is vol (max 20 spelers)" });
      return false;
    }

    if (players.some((p) => p.user_id === userId)) {
      set({
        lobby: { ...career, players },
        loading: false,
      });
      return true;
    }

    const { error } = await supabase.from("online_career_players").insert({
      career_id: career.id,
      user_id: userId,
      username,
      team_name: teamName,
    });

    if (error) {
      set({ loading: false, error: "Kon niet joinen" });
      return false;
    }

    const updatedPlayers = await fetchPlayers(career.id);
    set({
      lobby: { ...career, players: updatedPlayers },
      loading: false,
    });
    return true;
  },

  loadLobby: async (code) => {
    set({ loading: true, error: null });
    const { data: career } = await supabase
      .from("online_careers")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .single();

    if (!career) {
      set({ loading: false, error: "Lobby niet gevonden" });
      return;
    }

    const players = await fetchPlayers(career.id);
    set({
      lobby: { ...career, players },
      loading: false,
    });
  },

  leaveLobby: async (userId) => {
    const { lobby } = get();
    if (!lobby) return;

    await supabase
      .from("online_career_players")
      .delete()
      .eq("career_id", lobby.id)
      .eq("user_id", userId);

    get().unsubscribe();
    set({ lobby: null });
  },

  deleteLobby: async () => {
    const { lobby } = get();
    if (!lobby) return;

    await supabase.from("online_careers").delete().eq("id", lobby.id);

    get().unsubscribe();
    set({ lobby: null });
  },

  subscribe: (code) => {
    get().unsubscribe();

    // Silent refetch (no loading flicker) used by both realtime and polling.
    const refetch = async () => {
      const { data: career } = await supabase
        .from("online_careers")
        .select("*")
        .eq("code", code.toUpperCase().trim())
        .single();
      if (!career) return;
      const players = await fetchPlayers(career.id);
      set({ lobby: { ...career, players } });
    };

    const channel = supabase
      .channel(`online-career-${code}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "online_careers", filter: `code=eq.${code}` },
        refetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "online_career_players" },
        refetch,
      )
      .subscribe();

    // Polling fallback: guarantees progress even when Supabase realtime is
    // not enabled on the tables or a realtime event is missed.
    const pollInterval = setInterval(refetch, 4000);

    set({ subscription: channel, pollInterval });
  },

  unsubscribe: () => {
    const { subscription, pollInterval } = get();
    if (subscription) supabase.removeChannel(subscription);
    if (pollInterval) clearInterval(pollInterval);
    set({ subscription: null, pollInterval: null });
  },

  kickPlayer: async (userId) => {
    const { lobby } = get();
    if (!lobby) return;

    if (lobby.status === "waiting") {
      await supabase
        .from("online_career_players")
        .delete()
        .eq("career_id", lobby.id)
        .eq("user_id", userId);
    } else {
      const player = lobby.players.find((p) => p.user_id === userId);
      const botName = player ? `CPU ${player.team_name || player.username}` : `CPU`;
      await supabase
        .from("online_career_players")
        .update({ is_bot: true, ready: true, username: botName, team_name: botName })
        .eq("career_id", lobby.id)
        .eq("user_id", userId);
    }
  },

  startDraft: async () => {
    const { lobby } = get();
    if (!lobby) return;

    await supabase
      .from("online_careers")
      .update({ status: "drafting", updated_at: new Date().toISOString() })
      .eq("id", lobby.id);

    await supabase
      .from("online_career_players")
      .update({ ready: false })
      .eq("career_id", lobby.id)
      .eq("is_bot", false);

    await supabase
      .from("online_career_players")
      .update({ ready: true })
      .eq("career_id", lobby.id)
      .eq("is_bot", true);

    set({ lobby: { ...lobby, status: "drafting", players: lobby.players.map((p) => ({ ...p, ready: p.is_bot })) } });
  },

  setReady: async (userId, ready) => {
    const { lobby } = get();
    if (!lobby) return;

    await supabase
      .from("online_career_players")
      .update({ ready })
      .eq("career_id", lobby.id)
      .eq("user_id", userId);
  },

  saveSquad: async (userId, squad) => {
    const { lobby } = get();
    if (!lobby) return;

    await supabase
      .from("online_career_players")
      .update({ squad, ready: true })
      .eq("career_id", lobby.id)
      .eq("user_id", userId);
  },

  // Records the season result. Does NOT change the division — promotion/
  // relegation is applied centrally in advanceSeason so the division stays
  // stable while the result screen is shown (and survives a page reload).
  finishSeason: async (userId, position, points, gf, ga) => {
    const { lobby } = get();
    if (!lobby) return;

    const player = lobby.players.find((p) => p.user_id === userId);
    if (!player) return;

    if (player.history.some((h) => h.season === lobby.current_season)) return;

    const entry: CareerSeason = {
      season: lobby.current_season,
      division: player.current_division,
      position,
      points,
      gf,
      ga,
    };
    const history = [...player.history, entry];
    const championships = player.championships + (position === 1 ? 1 : 0);

    await supabase
      .from("online_career_players")
      .update({ history, championships })
      .eq("career_id", lobby.id)
      .eq("user_id", userId);
  },

  // Owner-only. Applies promotion/relegation from each player's recorded
  // result, then bumps the season and resets readiness.
  advanceSeason: async () => {
    const { lobby } = get();
    if (!lobby) return;

    const newSeason = lobby.current_season + 1;

    // Re-fetch the latest players so we use everyone's recorded result.
    const players = await fetchPlayers(lobby.id);
    await Promise.all(
      players.map((p) => {
        const entry = p.history.find((h) => h.season === lobby.current_season);
        let newDiv = p.current_division;
        if (entry) {
          if (entry.position <= 2 && newDiv > 1) newDiv--;
          else if (entry.position >= 18 && newDiv < 10) newDiv++;
        }
        return supabase
          .from("online_career_players")
          .update({ current_division: newDiv, ready: p.is_bot })
          .eq("id", p.id);
      }),
    );

    await supabase
      .from("online_careers")
      .update({
        current_season: newSeason,
        status: "drafting",
        updated_at: new Date().toISOString(),
      })
      .eq("id", lobby.id);
  },

  getDivisionPlayers: (division) => {
    const { lobby } = get();
    if (!lobby) return [];
    return lobby.players.filter((p) => p.current_division === division);
  },

  getSeasonSeed: (division) => {
    const { lobby } = get();
    if (!lobby) return 0;
    let h = lobby.current_season * 73856093 + division * 19349669;
    h = ((h >> 16) ^ h) * 0x45d9f3b;
    h = ((h >> 16) ^ h) * 0x45d9f3b;
    h = (h >> 16) ^ h;
    return h >>> 0;
  },
}));
