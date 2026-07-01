"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useCareer, divisionLabel } from "@/lib/career";
import { useGame } from "@/lib/store";
import { FORMATIONS } from "@/lib/formations";
import { LEAGUES } from "@/lib/leagues";
import { LoginPrompt } from "@/components/AuthGate";
import CareerTimeline from "@/components/CareerTimeline";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const REROLL_OPTIONS = [0, 1, 2, 3];
const WISSEL_OPTIONS = [0, 1, 2, 3, 4];

function SettingChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/80 border border-indigo-100 px-3 py-2 text-center">
      <div className="text-sm font-black text-slate-700">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
    </div>
  );
}

export default function OfflineCarrierePage() {
  const router = useRouter();
  const userId = useAuth((s) => s.userId);
  const authLoading = useAuth((s) => s.loading);
  const career = useCareer();
  const startCareerSeason = useGame((s) => s.startCareerSeason);
  const setFormation = useGame((s) => s.setFormation);
  const loaded = useGame((s) => s.index.length > 0);
  const [showLogin, setShowLogin] = useState(false);

  const [formationKey, setFormationKey] = useState("433");
  const [rerollCount, setRerollCount] = useState(1);
  const [wisselCount, setWisselCount] = useState(2);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(LEAGUES.map((l) => l.code));

  useEffect(() => {
    if (userId) career.loadCareer(userId);
  }, [userId]);

  const toggleLeague = (code: string) => {
    setSelectedLeagues((prev) => {
      if (prev.includes(code)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== code);
      }
      return [...prev, code];
    });
  };

  const playSeason = () => {
    setFormation(career.formationKey);
    startCareerSeason(career.currentDivision, career.squad.length > 0 ? career.squad : undefined, career.rerollCount, career.leagues);
    router.push("/");
  };

  const handleStart = async () => {
    if (!userId) return;
    const leagues = selectedLeagues.length === LEAGUES.length ? [] : selectedLeagues;
    await career.startCareer(userId, { formationKey, rerollCount, wisselCount, leagues });
    setFormation(formationKey);
    startCareerSeason(10, undefined, rerollCount, leagues);
    router.push("/");
  };

  if (authLoading || career.loading) {
    return (
      <main className="min-h-screen w-full pb-12">
        <Header backHref="/" />
        <div className="flex items-center justify-center py-20 text-sm text-slate-400 font-bold">Laden…</div>
        <Footer />
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen w-full pb-12">
        <Header backHref="/" />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="text-4xl mb-2">🏟️</div>
          <p className="text-sm text-slate-500 mb-4">Log in om een carrière te starten.</p>
          <button onClick={() => setShowLogin(true)} className="btn-primary">Inloggen</button>
        </div>
        {showLogin && <LoginPrompt onClose={() => setShowLogin(false)} />}
        <Footer />
      </main>
    );
  }

  if (career.active) {
    return (
      <main className="min-h-screen w-full pb-12">
        <Header backHref="/" />
        <div className="mx-auto max-w-lg px-4 py-10">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🏟️</div>
            <h1 className="text-2xl font-black text-slate-800">Offline Carrière</h1>
          </div>

          <div className="card p-5 border-2 border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 to-purple-50/50 mb-4">
            <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
              <span className="rounded-full bg-white/80 border border-indigo-200/60 px-3 py-1.5 font-bold text-indigo-800">
                {divisionLabel(career.currentDivision)}
              </span>
              <span className="rounded-full bg-white/80 border border-indigo-200/60 px-3 py-1.5 font-bold text-slate-700">
                Seizoen {career.season}
              </span>
              <span className="rounded-full bg-white/80 border border-indigo-200/60 px-3 py-1.5 font-bold text-amber-700">
                {career.championships}x kampioen
              </span>
            </div>

            {career.history.length > 0 && (
              <div className="mb-3">
                <CareerTimeline history={career.history} currentDivision={career.currentDivision} currentSeason={career.season} />
              </div>
            )}

            <div className="grid grid-cols-4 gap-1.5">
              <SettingChip label="Formatie" value={FORMATIONS.find((f) => f.key === career.formationKey)?.label ?? career.formationKey} />
              <SettingChip label="Rerolls" value={String(career.rerollCount)} />
              <SettingChip label="Wissels" value={String(career.wisselCount)} />
              <SettingChip label="Competities" value={career.leagues.length === 0 ? "Alle 7" : `${career.leagues.length}/7`} />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              disabled={!loaded}
              onClick={playSeason}
              className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3.5 text-base font-extrabold text-white shadow-md shadow-indigo-200/50 transition hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-40"
            >
              {loaded ? `Speel seizoen ${career.season}` : "Laden…"}
            </button>
            <button
              onClick={() => userId && career.endCareer(userId)}
              className="rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-100 transition"
            >
              Stop
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full pb-12">
      <Header backHref="/" />
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🏟️</div>
          <h1 className="text-2xl font-black text-slate-800">Offline Carrière</h1>
          <p className="mt-2 text-sm text-slate-500">
            Begin in Divisie 10 en werk je omhoog naar Divisie 1. Word kampioen om te promoveren, eindig onderaan en je degradeert.
          </p>
        </div>

        <div className="card p-6">
          <div className="mb-3.5">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Formatie</div>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
              {FORMATIONS.map((fm) => (
                <button
                  key={fm.key}
                  onClick={() => setFormationKey(fm.key)}
                  className={`rounded-xl border-2 px-1.5 py-2 text-xs font-bold transition-all ${
                    formationKey === fm.key
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {fm.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3.5">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Rerolls per seizoen</div>
            <div className="flex gap-1.5">
              {REROLL_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setRerollCount(n)}
                  className={`flex-1 rounded-xl border-2 py-2 text-sm font-bold transition-all ${
                    rerollCount === n
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3.5">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Wissels per seizoen</div>
            <div className="flex gap-1.5">
              {WISSEL_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setWisselCount(n)}
                  className={`flex-1 rounded-xl border-2 py-2 text-sm font-bold transition-all ${
                    wisselCount === n
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Competities</div>
            <div className="grid grid-cols-2 gap-1.5">
              {LEAGUES.map((l) => {
                const active = selectedLeagues.includes(l.code);
                return (
                  <button
                    key={l.code}
                    onClick={() => toggleLeague(l.code)}
                    className={`flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-2 text-xs font-bold transition-all ${
                      active
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                        : "border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span className="truncate">{l.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            disabled={!loaded}
            onClick={handleStart}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3.5 text-base font-extrabold text-white shadow-md shadow-indigo-200/50 transition hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-40"
          >
            {loaded ? "Start carrière" : "Laden…"}
          </button>
        </div>
      </div>
      <Footer />
    </main>
  );
}
