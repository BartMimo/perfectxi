"use client";

import { useGame } from "@/lib/store";
import { leagueName } from "@/lib/leagues";
import { getFormation } from "@/lib/formations";
import { useCareer, divisionLabel } from "@/lib/career";

export default function Header({ showMeta = false }: { showMeta?: boolean }) {
  const newGame = useGame((s) => s.newGame);
  const leagueCode = useGame((s) => s.leagueCode);
  const gameMode = useGame((s) => s.gameMode);
  const formationKey = useGame((s) => s.formationKey);
  const formation = getFormation(formationKey);
  const career = useCareer();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/40 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <button onClick={newGame} className="text-base font-black tracking-tight">
          <span className="bg-gradient-to-r from-emerald-600 to-cyan-500 bg-clip-text text-transparent">
            Perfect XI
          </span>
        </button>
        {showMeta && (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            {gameMode === "career" ? (
              <span className="truncate rounded-full border border-indigo-200/60 bg-indigo-50/60 px-3 py-1.5 text-indigo-700 backdrop-blur">
                {divisionLabel(career.currentDivision)} · S{career.season}
              </span>
            ) : leagueCode ? (
              <span className="truncate rounded-full border border-slate-200/60 bg-white/60 px-3 py-1.5 backdrop-blur">
                {leagueName(leagueCode)}
              </span>
            ) : (
              <span className="truncate rounded-full border border-blue-200/60 bg-blue-50/60 px-3 py-1.5 text-blue-700 backdrop-blur">
                Champions League
              </span>
            )}
            <span className="rounded-full border border-slate-200/60 bg-white/60 px-3 py-1.5 backdrop-blur">
              {formation.label}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
