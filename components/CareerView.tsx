"use client";

import { useEffect } from "react";
import { useCareer, divisionLabel } from "@/lib/career";
import { useGame } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export function TransferWindow() {
  const career = useCareer();
  const startCareerSeason = useGame((s) => s.startCareerSeason);
  const userId = useAuth((s) => s.userId);

  if (!career.transferring) return null;

  const selectedCount = career.playersToReplace.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="animate-pop w-full max-w-md card p-6">
        <div className="text-center mb-4">
          <div className="text-2xl mb-2">🔄</div>
          <h2 className="text-lg font-black text-slate-800">Transferwindow</h2>
          <p className="text-sm text-slate-500 mt-1">
            {career.wisselCount === 0
              ? "Deze carrière staat geen transfers toe."
              : `Kies maximaal ${career.wisselCount} speler${career.wisselCount > 1 ? "s" : ""} om te vervangen. Je draft daarna nieuwe spelers.`}
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
              if (userId) {
                // Save remaining squad to DB before starting new season
                career.setSquad(userId, remaining);
              }
              useGame.getState().setFormation(career.formationKey);
              startCareerSeason(career.currentDivision, remaining, career.rerollCount, career.leagues);
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
  const userId = useAuth((s) => s.userId);

  useEffect(() => {
    if (gameMode === "career" && result && career.active && userId && slots.every((s) => s.player)) {
      const squad = slots.map((s) => s.player!);
      career.setSquad(userId, squad);
    }
  }, [gameMode, result]);

  if (gameMode !== "career" || !result || !career.active) return null;

  const position = result.position;
  const promoted = position === 1 && career.currentDivision > 1;
  const relegated = position >= 18 && career.currentDivision < 10;
  const champion = position === 1;

  const handleContinue = () => {
    if (userId) {
      career.finishSeason(userId, position, result.userRow.points, result.userRow.gf, result.userRow.ga);
    }
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
