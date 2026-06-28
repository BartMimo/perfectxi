"use client";

import { useEffect } from "react";
import { useCareer, divisionLabel } from "@/lib/career";
import { useGame } from "@/lib/store";

export function CareerStartCard() {
  const career = useCareer();
  const startCareerSeason = useGame((s) => s.startCareerSeason);
  const loaded = useGame((s) => s.index.length > 0);

  useEffect(() => { career.restore(); }, []);

  if (career.active) {
    return (
      <div className="card p-5 border-2 border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 to-purple-50/50">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🏟️</span>
          <span className="text-xs font-black uppercase tracking-widest text-indigo-700">Carrière</span>
        </div>
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
          <div className="mb-3 flex flex-wrap gap-1.5">
            {career.history.slice(-5).map((h, i) => (
              <span key={i} className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                h.position === 1 ? "bg-amber-100 text-amber-800" :
                h.position >= 18 ? "bg-rose-100 text-rose-700" :
                "bg-slate-100 text-slate-600"
              }`}>
                D{h.division}: {h.position}e ({h.points}p)
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button
            disabled={!loaded}
            onClick={() => startCareerSeason(career.currentDivision)}
            className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3.5 text-base font-extrabold text-white shadow-md shadow-indigo-200/50 transition hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-40 disabled:transform-none"
          >
            {loaded ? `Speel seizoen ${career.season}` : "Laden…"}
          </button>
          <button onClick={career.endCareer} className="btn-secondary !px-4 !py-3 !text-xs text-rose-500">
            Stop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 border-2 border-indigo-200/40 bg-gradient-to-br from-indigo-50/40 to-purple-50/30">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🏟️</span>
        <span className="text-xs font-black uppercase tracking-widest text-indigo-700">Carrièremodus</span>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Begin in Divisie 10 en werk je omhoog. Word kampioen om te promoveren,
        eindig onderaan en je degradeert. Elk seizoen mag je 2 spelers vervangen.
      </p>
      <button
        disabled={!loaded}
        onClick={career.startCareer}
        className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3.5 text-base font-extrabold text-white shadow-md shadow-indigo-200/50 transition hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-40 disabled:transform-none"
      >
        {loaded ? "Start carrière" : "Laden…"}
      </button>
    </div>
  );
}

export function TransferWindow() {
  const career = useCareer();
  const startCareerSeason = useGame((s) => s.startCareerSeason);

  if (!career.transferring) return null;

  const selectedCount = career.playersToReplace.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="animate-pop w-full max-w-md card p-6">
        <div className="text-center mb-4">
          <div className="text-2xl mb-2">🔄</div>
          <h2 className="text-lg font-black text-slate-800">Transferwindow</h2>
          <p className="text-sm text-slate-500 mt-1">
            Kies maximaal 2 spelers om te vervangen. Je draft daarna nieuwe spelers.
          </p>
          <div className="mt-2 text-xs font-bold text-indigo-600">
            {divisionLabel(career.currentDivision)} · Seizoen {career.season}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto mb-4">
          {career.squad.map((p) => {
            const selected = career.playersToReplace.has(p.name);
            return (
              <button
                key={p.name}
                onClick={() => career.toggleReplace(p.name)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all ${
                  selected
                    ? "bg-rose-50 border-2 border-rose-300"
                    : "bg-slate-50/80 border-2 border-transparent hover:border-slate-200"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-800">{p.name}</div>
                  <div className="text-[10px] text-slate-400">{p.fromClub} · {p.sub}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tabular-nums text-slate-600">{p.overall}</span>
                  {selected && <span className="text-xs font-bold text-rose-500">Weg</span>}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              const remaining = career.confirmTransfers();
              startCareerSeason(career.currentDivision, remaining);
            }}
            className="btn-primary flex-1"
          >
            {selectedCount === 0 ? "Ga door zonder transfers" : `Vervang ${selectedCount} speler${selectedCount > 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CareerResultBanner() {
  const career = useCareer();
  const result = useGame((s) => s.result);
  const slots = useGame((s) => s.slots);
  const gameMode = useGame((s) => s.gameMode);

  // Save squad to career when result is shown
  useEffect(() => {
    if (gameMode === "career" && result && career.active && slots.every((s) => s.player)) {
      const squad = slots.map((s) => s.player!);
      career.setSquad(squad);
    }
  }, [gameMode, result]);

  if (gameMode !== "career" || !result || !career.active) return null;

  const position = result.position;
  const promoted = position === 1 && career.currentDivision > 1;
  const relegated = position >= 18 && career.currentDivision < 10;
  const champion = position === 1;

  const handleContinue = () => {
    career.finishSeason(position, result.userRow.points, result.userRow.gf, result.userRow.ga);
    career.startTransferWindow();
  };

  return (
    <div className="card p-5 text-center border-2 border-indigo-200/60">
      <div className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
        {divisionLabel(career.currentDivision)} · Seizoen {career.season}
      </div>
      {champion && (
        <div className="text-lg font-black text-amber-700 mb-1">
          Kampioen! {promoted ? `Promotie naar ${divisionLabel(career.currentDivision - 1)}` : ""}
        </div>
      )}
      {relegated && (
        <div className="text-lg font-black text-rose-600 mb-1">
          Degradatie naar {divisionLabel(career.currentDivision + 1)}
        </div>
      )}
      {!champion && !relegated && (
        <div className="text-sm text-slate-500 mb-1">
          {position}e plaats — je blijft in {divisionLabel(career.currentDivision)}
        </div>
      )}
      <button onClick={handleContinue} className="btn-primary mt-3 w-full text-base">
        Volgend seizoen
      </button>
    </div>
  );
}
