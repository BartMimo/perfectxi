"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { messages } from "./messages";

export const LOCALES = ["nl", "en", "fr", "de", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  nl: "Nederlands",
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  nl: "🇳🇱",
  en: "🇬🇧",
  fr: "🇫🇷",
  de: "🇩🇪",
  es: "🇪🇸",
};

export type MessageDict = Partial<Record<Locale, Record<string, string>>>;

function isLocale(v: string | null | undefined): v is Locale {
  return !!v && (LOCALES as readonly string[]).includes(v);
}

function detectLocale(): Locale {
  if (typeof window === "undefined") return "nl";
  const stored = window.localStorage.getItem("locale");
  if (isLocale(stored)) return stored;
  const nav = navigator.language?.slice(0, 2).toLowerCase();
  if (isLocale(nav)) return nav;
  return "nl";
}

interface LocaleState {
  locale: Locale;
  hydrated: boolean;
  setLocale: (l: Locale) => void;
  hydrate: () => void;
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  locale: "nl",
  hydrated: false,
  setLocale: (l) => {
    if (typeof window !== "undefined") window.localStorage.setItem("locale", l);
    set({ locale: l });
  },
  hydrate: () => {
    if (get().hydrated) return;
    set({ locale: detectLocale(), hydrated: true });
  },
}));

/** Detecteert de taal van de bezoeker éénmalig na mount (voorkomt hydration mismatch). */
export function useLocaleInit() {
  const hydrate = useLocaleStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
}

export function useLocale(): Locale {
  return useLocaleStore((s) => s.locale);
}

export function useSetLocale() {
  return useLocaleStore((s) => s.setLocale);
}

export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  return (key: string, vars?: Record<string, string | number>) => {
    let str = messages[locale]?.[key] ?? messages.nl?.[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
    }
    return str;
  };
}
