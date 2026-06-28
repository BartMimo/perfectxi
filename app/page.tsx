"use client";

import { useEffect } from "react";
import { filledCount, useGame } from "@/lib/store";
import type { ClubSeasonLite } from "@/lib/types";
import { getFormation } from "@/lib/formations";
import { leagueName } from "@/lib/leagues";
import { useAuth } from "@/lib/auth";
import PitchView from "@/components/PitchView";
import StartView from "@/components/StartView";
import ReelView from "@/components/ReelView";
import SquadPicker from "@/components/SquadPicker";
import SimulationView from "@/components/SimulationView";
import ResultView from "@/components/ResultView";
import AuthGate from "@/components/AuthGate";

function CompleteCTA() {
  const simulate = useGame((s) => s.simulate);
  return (
    <div className="card flex flex-col items-center gap-4 p-6 text-center">
      <div className="text-base font-extrabold text-emerald-700">Je XI is compleet!</div>
      <p className="text-sm leading-relaxed text-slate-500">
        Tik op een speler in het veld om hem te verplaatsen, of simuleer je seizoen.
      </p>
      <button onClick={simulate} className="btn-primary w-full text-lg">
        Simuleer het seizoen
      </button>
    </div>
  );
}

function PlayView() {
  const slots = useGame((s) => s.slots);
  const filled = filledCount(slots);
  const total = slots.length;
  const complete = filled === total;

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-start">
      <div className="min-w-0 lg:sticky lg:top-[74px]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-600">Jouw opstelling</h2>
          <span className="rounded-full bg-emerald-100/80 px-3 py-1.5 text-xs font-bold text-emerald-700">
            {complete ? "Compleet" : `${filled} / ${total}`}
          </span>
        </div>
        <PitchView />
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        {complete ? (
          <CompleteCTA />
        ) : (
          <>
            <ReelView />
            <SquadPicker />
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  const phase = useGame((s) => s.phase);
  const setIndex = useGame((s) => s.setIndex);
  const indexLoaded = useGame((s) => s.index.length > 0);
  const formationKey = useGame((s) => s.formationKey);
  const leagueCode = useGame((s) => s.leagueCode);
  const newGame = useGame((s) => s.newGame);

  useEffect(() => {
    if (indexLoaded) return;
    fetch("/api/clubseasons")
      .then((r) => r.json())
      .then((data: ClubSeasonLite[]) => setIndex(data))
      .catch(() => {});
  }, [indexLoaded, setIndex]);

  const formation = getFormation(formationKey);

  const username = useAuth((s) => s.username);
  const logout = useAuth((s) => s.logout);

  return (
    <AuthGate>
      <main className="min-h-screen w-full pb-12">
        {phase === "start" ? (
          <StartView />
        ) : (
          <>
            <header className="sticky top-0 z-30 border-b border-slate-200/40 bg-white/70 backdrop-blur-xl">
              <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
                <button onClick={newGame} className="text-base font-black tracking-tight">
                  <span className="bg-gradient-to-r from-emerald-600 to-cyan-500 bg-clip-text text-transparent">
                    Perfect XI
                  </span>
                </button>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span className="truncate rounded-full border border-slate-200/60 bg-white/60 px-3 py-1.5 backdrop-blur">
                    {leagueName(leagueCode)}
                  </span>
                  <span className="rounded-full border border-slate-200/60 bg-white/60 px-3 py-1.5 backdrop-blur">
                    {formation.label}
                  </span>
                </div>
              </div>
            </header>

            {phase === "play" && <PlayView />}
            {phase === "simulating" && <SimulationView />}
            {phase === "result" && <ResultView />}
          </>
        )}

        <footer className="mt-8 px-4 text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200/40 bg-white/50 px-5 py-2 text-xs text-slate-400 backdrop-blur">
            {username && (
              <>
                <span>{username}</span>
                <span className="text-slate-200">·</span>
                <button onClick={logout} className="hover:text-slate-600 transition">Uitloggen</button>
                <span className="text-slate-200">·</span>
              </>
            )}
            <a href="/ranglijst" className="font-semibold text-emerald-600 hover:text-emerald-700 transition">Ranglijst</a>
          </div>
          <div className="mt-2 text-[10px] text-slate-400/70">
            Spelersdata: Transfermarkt via Kaggle (CC0). Fan-project, geen officiële merken.
          </div>
        </footer>
      </main>
    </AuthGate>
  );
}
