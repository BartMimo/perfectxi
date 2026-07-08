"use client";

import { useState } from "react";
import { LOCALES, LOCALE_LABELS, LOCALE_FLAGS, useLocale, useSetLocale, useLocaleInit } from "@/lib/i18n/core";

export default function LanguageSwitcher() {
  useLocaleInit();
  const locale = useLocale();
  const setLocale = useSetLocale();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 items-center gap-1 rounded-full border border-line bg-white/[0.04] px-3 text-xs font-bold text-dim hover:bg-white/[0.08] hover:text-text transition"
      >
        <span>{LOCALE_FLAGS[locale]}</span>
        <span>{locale.toUpperCase()}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-line bg-elev py-1 shadow-xl shadow-black/50">
            {LOCALES.map((l) => (
              <button
                key={l}
                onClick={() => { setLocale(l); setOpen(false); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-white/[0.05] ${
                  l === locale ? "font-bold text-accent" : "text-dim"
                }`}
              >
                <span>{LOCALE_FLAGS[l]}</span>
                <span>{LOCALE_LABELS[l]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
