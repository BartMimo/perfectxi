"use client";

import { create } from "zustand";
import { supabase } from "./supabase";

interface AuthState {
  userId: string | null;
  username: string | null;
  loading: boolean;
  error: string | null;
  restore: () => void;
  register: (username: string, password: string) => Promise<boolean>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  userId: null,
  username: null,
  loading: true,
  error: null,

  restore: () => {
    const userId = localStorage.getItem("pxi_user_id");
    const username = localStorage.getItem("pxi_username");
    if (userId && username) {
      set({ userId, username, loading: false });
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
    return true;
  },

  logout: () => {
    localStorage.removeItem("pxi_user_id");
    localStorage.removeItem("pxi_username");
    set({ userId: null, username: null });
  },
}));
