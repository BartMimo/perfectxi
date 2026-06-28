"use client";

import { create } from "zustand";
import { supabase } from "./supabase";

interface AuthState {
  userId: string | null;
  username: string | null;
  teamName: string | null;
  loading: boolean;
  error: string | null;
  restore: () => void;
  register: (username: string, password: string) => Promise<boolean>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setTeamName: (name: string) => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  userId: null,
  username: null,
  teamName: null,
  loading: true,
  error: null,

  restore: () => {
    const userId = localStorage.getItem("pxi_user_id");
    const username = localStorage.getItem("pxi_username");
    const teamName = localStorage.getItem("pxi_team_name");
    if (userId && username) {
      set({ userId, username, teamName, loading: false });
      supabase.from("users").select("team_name").eq("id", userId).single().then(({ data }) => {
        if (data?.team_name) {
          localStorage.setItem("pxi_team_name", data.team_name);
          set({ teamName: data.team_name });
        }
      });
    } else {
      set({ loading: false });
    }
  },

  register: async (username: string, password: string) => {
    set({ error: null });
    const { data, error } = await supabase.rpc("register_user", {
      p_username: username.trim(),
      p_password: password,
    });

    if (error) {
      const msg = error.message;
      if (msg.includes("duplicate") || msg.includes("unique") || error.code === "23505") {
        set({ error: "Deze gebruikersnaam is al bezet" });
      } else if (msg.includes("2-20")) {
        set({ error: "Gebruikersnaam moet 2-20 tekens zijn" });
      } else if (msg.includes("4 tekens")) {
        set({ error: "Wachtwoord moet minimaal 4 tekens zijn" });
      } else {
        set({ error: "Registratie mislukt, probeer opnieuw" });
      }
      return false;
    }

    const user = data as { id: string; username: string };
    localStorage.setItem("pxi_user_id", user.id);
    localStorage.setItem("pxi_username", user.username);
    set({ userId: user.id, username: user.username });
    return true;
  },

  login: async (username: string, password: string) => {
    set({ error: null });
    const { data, error } = await supabase.rpc("login_user", {
      p_username: username.trim(),
      p_password: password,
    });

    if (error) {
      set({ error: "Ongeldige gebruikersnaam of wachtwoord" });
      return false;
    }

    const user = data as { id: string; username: string };
    localStorage.setItem("pxi_user_id", user.id);
    localStorage.setItem("pxi_username", user.username);
    set({ userId: user.id, username: user.username });

    const { data: profile } = await supabase.from("users").select("team_name").eq("id", user.id).single();
    if (profile?.team_name) {
      localStorage.setItem("pxi_team_name", profile.team_name);
      set({ teamName: profile.team_name });
    }

    return true;
  },

  logout: () => {
    localStorage.removeItem("pxi_user_id");
    localStorage.removeItem("pxi_username");
    localStorage.removeItem("pxi_team_name");
    set({ userId: null, username: null, teamName: null });
  },

  setTeamName: (name: string) => {
    const trimmed = name.trim();
    const { userId } = get();
    if (trimmed) {
      localStorage.setItem("pxi_team_name", trimmed);
    } else {
      localStorage.removeItem("pxi_team_name");
    }
    set({ teamName: trimmed || null });
    if (userId) {
      supabase.from("users").update({ team_name: trimmed || null }).eq("id", userId).then(() => {});
    }
  },
}));
