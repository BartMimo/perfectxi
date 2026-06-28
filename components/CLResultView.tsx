"use client";

import { useState } from "react";
import { useGame } from "@/lib/store";
import type { CLGroup, CLKnockoutRound, CLKnockoutTie } from "@/lib/simCL";

export default function CLResultView() {
  const clResult = useGame((s) => s.clResult);
  const newGame = useGame((s) => s.newGame);
  const [showGroups, setShowGroups] = useState(false);
  const [showKnockout, setShowKnockout] = useState(true);

  if (!clResult) return null;
  const { groups, knockout, winner, userBestRound } = clResult;

  const isWinner = userBestRound === "Winnaar";
  const userGroup = groups.find((g) => g.standings.some((s) => s.isUser));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
      {/* Hero */}
      <div className="card animate-pop p-6 text-center">
        {isWinner ? (
          <>
            <div className="text-5xl">🏆⭐</div>
            <div className="mt-3 bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-2xl font-black text-transparent">
              CHAMPIONS LEAGUE WINNAAR
            </div>
          </>
        ) : (
          <>
            <div className="text-xs uppercase tracking-widest text-slate-400">Champions League</div>
            <div className="mt-2 text-2xl font-black text-slate-800">Uitgeschakeld</div>
            <div className="mt-1 text-base font-bold text-blue-600">{userBestRound}</div>
          </>
        )}
        <div className="mt-3 text-sm text-slate-500">
          Winnaar: <span className="font-bold text-slate-700">{winner}</span>
        </div>
      </div>

      {/* User's group */}
      {userGroup && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 text-sm font-bold text-slate-700">Jouw poule</div>
          <GroupTable group={userGroup} />
        </div>
      )}

      {/* Knockout */}
      <button onClick={() => setShowKnockout((v) => !v)} className="btn-secondary text-sm">
        {showKnockout ? "Verberg knockout" : "Toon knockout"}
      </button>
      {showKnockout && (
        <div className="flex flex-col gap-3">
          {knockout.map((round) => (
            <KnockoutRoundView key={round.name} round={round} />
          ))}
        </div>
      )}

      {/* All groups */}
      <button onClick={() => setShowGroups((v) => !v)} className="btn-secondary text-sm">
        {showGroups ? "Verberg alle poules" : "Toon alle poules"}
      </button>
      {showGroups && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {groups.map((g, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="px-4 py-2 text-xs font-bold text-slate-500">Poule {String.fromCharCode(65 + i)}</div>
              <GroupTable group={g} />
            </div>
          ))}
        </div>
      )}

      <button onClick={newGame} className="btn-primary w-full text-base">
        Speel opnieuw
      </button>
    </div>
  );
}

function GroupTable({ group }: { group: CLGroup }) {
  return (
    <table className="w-full text-xs">
      <thead className="bg-slate-50/80 text-slate-400">
        <tr>
          <th className="px-3 py-2 text-left">#</th>
          <th className="px-3 py-2 text-left">Team</th>
          <th className="px-2 py-2 text-right">GS</th>
          <th className="px-2 py-2 text-right">W</th>
          <th className="px-2 py-2 text-right">G</th>
          <th className="px-2 py-2 text-right">V</th>
          <th className="px-2 py-2 text-right">DS</th>
          <th className="px-3 py-2 text-right">Ptn</th>
        </tr>
      </thead>
      <tbody>
        {group.standings.map((s, i) => (
          <tr
            key={s.name}
            className={`border-t border-slate-100/60 ${
              s.isUser ? "bg-blue-50/60 font-bold text-blue-800" :
              i < 2 ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            <td className="px-3 py-2">{i + 1}</td>
            <td className="px-3 py-2 max-w-[140px] truncate">{s.name}</td>
            <td className="px-2 py-2 text-right tabular-nums">{s.played}</td>
            <td className="px-2 py-2 text-right tabular-nums">{s.won}</td>
            <td className="px-2 py-2 text-right tabular-nums">{s.drawn}</td>
            <td className="px-2 py-2 text-right tabular-nums">{s.lost}</td>
            <td className="px-2 py-2 text-right tabular-nums">{(s.gd >= 0 ? "+" : "")}{s.gd}</td>
            <td className="px-3 py-2 text-right font-semibold tabular-nums">{s.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function KnockoutRoundView({ round }: { round: CLKnockoutRound }) {
  const hasUser = round.ties.some((t) => t.home.includes("XI") || t.away.includes("XI") ||
    t.leg1.home === t.home && round.ties.some(ti => ti.home === t.home));

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50/50">
        {round.name}
      </div>
      <div className="grid grid-cols-1 gap-1 p-3 sm:grid-cols-2">
        {round.ties.map((tie, i) => (
          <TieView key={i} tie={tie} />
        ))}
      </div>
    </div>
  );
}

function TieView({ tie }: { tie: CLKnockoutTie }) {
  const isUserTie = tie.home === tie.winner && tie.leg1.home === tie.home;
  const homeWon = tie.winner === tie.home;

  return (
    <div className="rounded-xl bg-slate-50/60 px-3 py-2 text-[11px]">
      <div className="flex items-center justify-between">
        <span className={`truncate max-w-[100px] ${tie.winner === tie.home ? "font-black" : ""}`}>{tie.home}</span>
        <span className="tabular-nums font-bold text-slate-600">{tie.aggregate[0]}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className={`truncate max-w-[100px] ${tie.winner === tie.away ? "font-black" : ""}`}>{tie.away}</span>
        <span className="tabular-nums font-bold text-slate-600">{tie.aggregate[1]}</span>
      </div>
      <div className="mt-1 text-[9px] text-slate-400">
        {tie.leg1.homeGoals}-{tie.leg1.awayGoals} / {tie.leg2.homeGoals}-{tie.leg2.awayGoals}
      </div>
    </div>
  );
}
