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
        className="flex h-8 items-center gap-1 rounded-full bg-slate-100 px-3 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
      >
        <span>{LOCALE_FLAGS[locale]}</span>
        <span>{locale.toUpperCase()}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {LOCALES.map((l) => (
              <button
                key={l}
                onClick={() => { setLocale(l); setOpen(false); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                  l === locale ? "font-bold text-emerald-600" : "text-slate-600"
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
