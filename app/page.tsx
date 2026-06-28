"use client";

import { useEffect } from "react";
import { filledCount, useGame } from "@/lib/store";
import type { ClubSeasonLite } from "@/lib/types";
import PitchView from "@/components/PitchView";
import StartView from "@/components/StartView";
import ReelView from "@/components/ReelView";
import SquadPicker from "@/components/SquadPicker";
import SimulationView from "@/components/SimulationView";
import ResultView from "@/components/ResultView";
import CLResultView from "@/components/CLResultView";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/lib/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function CompleteCTA() {
  const simulate = useGame((s) => s.simulate);
  const teamName = useAuth((s) => s.teamName);
  return (
    <div className="card flex flex-col items-center gap-4 p-6 text-center">
      <div className="text-base font-extrabold text-emerald-700">Je XI is compleet!</div>
      <p className="text-sm leading-relaxed text-slate-500">
        Tik op een speler in het veld om hem te verplaatsen, of simuleer je seizoen.
      </p>
      <button onClick={() => simulate(teamName ?? undefined)} className="btn-primary w-full text-lg">
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
          <div className="flex items-center gap-2">
            {filled > 0 && (
              <button onClick={useGame.getState().newGame} className="rounded-full bg-rose-50/80 px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-100 transition">
                Opnieuw
              </button>
            )}
            <span className="rounded-full bg-emerald-100/80 px-3 py-1.5 text-xs font-bold text-emerald-700">
              {complete ? "Compleet" : `${filled} / ${total}`}
            </span>
          </div>
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
  const gameMode = useGame((s) => s.gameMode);
  const setIndex = useGame((s) => s.setIndex);
  const indexLoaded = useGame((s) => s.index.length > 0);
  useEffect(() => {
    if (indexLoaded) return;
    fetch("/api/clubseasons")
      .then((r) => r.json())
      .then((data: ClubSeasonLite[]) => setIndex(data))
      .catch(() => {});
  }, [indexLoaded, setIndex]);

  return (
    <AuthGate>
      <main className="min-h-screen w-full pb-12">
        {phase === "start" ? (
          <StartView />
        ) : (
          <>
            <Header showMeta />
            {phase === "play" && <PlayView />}
            {phase === "simulating" && <SimulationView />}
            {phase === "result" && (gameMode === "cl" ? <CLResultView /> : <ResultView />)}
          </>
        )}
        <Footer />
      </main>
    </AuthGate>
  );
}
