"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/store";
import type { MatchResult } from "@/lib/sim";
import type { CLResult, CLGroup, CLKnockoutRound } from "@/lib/simCL";

function outcome(m: MatchResult): "W" | "D" | "L" {
  return m.gf > m.ga ? "W" : m.gf === m.ga ? "D" : "L";
}
const dot = { W: "bg-emerald-400", D: "bg-amber-400", L: "bg-rose-400" } as const;

export default function SimulationView() {
  const result = useGame((s) => s.result);
  const clResult = useGame((s) => s.clResult);
  const gameMode = useGame((s) => s.gameMode);
  const finish = useGame((s) => s.finishSimulation);

  if (gameMode === "cl" && clResult) {
    return <CLSimAnimation clResult={clResult} onFinish={finish} />;
  }

  const total = result?.matchdays.length ?? 0;
  const [round, setRound] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!playing || !result) return;
    if (round >= total - 1) {
      setPlaying(false);
      return;
    }
    timer.current = setTimeout(() => setRound((r) => Math.min(r + 1, total - 1)), 460 / speed);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, round, total, speed, result]);

  if (!result) return null;

  const md = result.matchdays[round];
  const userRow = md.standings.find((r) => r.isUser)!;
  const position = md.standings.indexOf(userRow) + 1;
  const m = md.userMatch;
  const oc = outcome(m);
  const form = result.matches.slice(0, round + 1).slice(-5);
  const done = round >= total - 1;

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-2 lg:items-start">
      <div className="flex flex-col gap-4">
        <div className="card p-5">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
            <span>
              Speeldag {md.round} / {total}
            </span>
            <span className="text-slate-500">
              {userRow.won}W {userRow.drawn}G {userRow.lost}V · {userRow.points} ptn
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
              style={{ width: `${((round + 1) / total) * 100}%` }}
            />
          </div>

          <div
            className={`mt-5 flex items-center justify-between rounded-2xl border-2 px-5 py-4 ${
              oc === "W"
                ? "border-emerald-200/60 bg-emerald-50/60"
                : oc === "D"
                  ? "border-amber-200/60 bg-amber-50/60"
                  : "border-rose-200/60 bg-rose-50/60"
            }`}
          >
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-slate-400">
                {m.home ? "Thuis" : "Uit"}
              </div>
              <div className="truncate text-sm font-bold text-slate-800">
                Jouw XI <span className="text-slate-300">vs</span> {m.opponent}
              </div>
            </div>
            <div className="shrink-0 text-2xl font-black tabular-nums text-slate-800">
              {m.gf}-{m.ga}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Vorm</span>
              {form.map((f, i) => (
                <span key={i} className={`h-4 w-4 rounded-full shadow-sm ${dot[outcome(f)]}`} />
              ))}
            </div>
            <div className="text-sm font-bold">
              <span className="text-slate-400">Positie </span>
              <span className="tabular-nums text-emerald-600">{position}e</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {!done ? (
            <>
              <button
                onClick={() => setPlaying((p) => !p)}
                className="btn-secondary flex-1"
              >
                {playing ? "⏸ Pauze" : "▶ Hervat"}
              </button>
              <button
                onClick={() => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
                className="btn-secondary"
              >
                {speed}×
              </button>
              <button
                onClick={() => {
                  setPlaying(false);
                  setRound(total - 1);
                }}
                className="btn-primary flex-1 text-sm"
              >
                Naar einde
              </button>
            </>
          ) : (
            <button onClick={finish} className="btn-primary w-full text-lg">
              Bekijk eindstand
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50/80 text-slate-400">
            <tr>
              <th className="px-3 py-2.5 text-left">#</th>
              <th className="px-3 py-2.5 text-left">Team</th>
              <th className="px-2 py-2.5 text-right">GS</th>
              <th className="px-2 py-2.5 text-right">DS</th>
              <th className="px-3 py-2.5 text-right">Ptn</th>
            </tr>
          </thead>
          <tbody>
            {md.standings.map((r, i) => (
              <tr
                key={r.name}
                className={`border-t border-slate-100/60 ${
                  r.isUser ? "bg-emerald-50/60 font-bold text-emerald-800" : "text-slate-600"
                }`}
              >
                <td className="px-3 py-2">
                  <span className={i < 4 ? "text-emerald-500" : i >= 17 ? "text-rose-400" : ""}>
                    {i + 1}
                  </span>
                </td>
                <td className="max-w-[150px] truncate px-3 py-2">{r.name}</td>
                <td className="px-2 py-2 text-right tabular-nums">{r.played}</td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {(r.gd >= 0 ? "+" : "") + r.gd}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const CL_PHASES = ["Groepsfase", "Laatste 32", "Laatste 16", "Kwartfinale", "Halve finale", "Finale", "Resultaat"];

function CLSimAnimation({ clResult, onFinish }: { clResult: CLResult; onFinish: () => void }) {
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = CL_PHASES.length - 1;

  useEffect(() => {
    if (!playing || phase >= total) {
      if (phase >= total) setPlaying(false);
      return;
    }
    timer.current = setTimeout(() => setPhase((p) => p + 1), 1200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [playing, phase, total]);

  const done = phase >= total;
  const userGroup = clResult.groups.find((g) => g.standings.some((s) => s.isUser));
  const userAdvanced = userGroup ? userGroup.standings.findIndex((s) => s.isUser) < 2 : false;

  const currentRound = phase > 0 && phase <= clResult.knockout.length ? clResult.knockout[phase - 1] : null;
  const userTie = currentRound?.ties.find((t) =>
    clResult.groups.some((g) => g.standings.some((s) => s.isUser && (s.name === t.home || s.name === t.away)))
  ) ?? currentRound?.ties.find((t) => {
    const userName = userGroup?.standings.find((s) => s.isUser)?.name;
    return userName && (t.home === userName || t.away === userName || t.winner === userName);
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="card p-5 mb-4">
        <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-blue-600">
          <span>⭐ Champions League</span>
          <span className="text-slate-400">{CL_PHASES[Math.min(phase, total)]}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${((phase + 1) / (total + 1)) * 100}%` }}
          />
        </div>

        {/* Group phase */}
        {phase === 0 && userGroup && (
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-500 mb-2">Jouw poule</div>
            {userGroup.standings.map((s, i) => (
              <div key={s.name} className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm ${
                s.isUser ? "bg-blue-50 font-bold text-blue-800" : i < 2 ? "text-emerald-700" : "text-slate-500"
              }`}>
                <span className="truncate max-w-[200px]">{i + 1}. {s.name}</span>
                <span className="tabular-nums font-bold">{s.points} ptn</span>
              </div>
            ))}
            <div className="mt-2 text-xs font-bold text-center">
              {userAdvanced ? (
                <span className="text-emerald-600">Door naar de knockout!</span>
              ) : (
                <span className="text-rose-500">Uitgeschakeld in de groepsfase</span>
              )}
            </div>
          </div>
        )}

        {/* Knockout rounds */}
        {phase > 0 && phase < total && currentRound && (
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-500 mb-2">{currentRound.name}</div>
            {currentRound.ties.slice(0, 4).map((tie, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] text-slate-600">
                <span className={`truncate max-w-[120px] ${tie.winner === tie.home ? "font-black" : ""}`}>{tie.home}</span>
                <span className="tabular-nums font-bold">{tie.aggregate[0]} - {tie.aggregate[1]}</span>
                <span className={`truncate max-w-[120px] text-right ${tie.winner === tie.away ? "font-black" : ""}`}>{tie.away}</span>
              </div>
            ))}
            {currentRound.ties.length > 4 && (
              <div className="text-[10px] text-slate-400 text-center mt-1">+{currentRound.ties.length - 4} meer</div>
            )}
          </div>
        )}

        {/* Final result teaser */}
        {done && (
          <div className="mt-4 text-center">
            <div className="text-3xl mb-2">{clResult.userBestRound === "Winnaar" ? "🏆" : "⭐"}</div>
            <div className="text-lg font-black text-slate-800">
              {clResult.userBestRound === "Winnaar" ? "Champions League winnaar!" : `Uitgeschakeld: ${clResult.userBestRound}`}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {!done ? (
          <>
            <button onClick={() => setPlaying((p) => !p)} className="btn-secondary flex-1">
              {playing ? "⏸ Pauze" : "▶ Hervat"}
            </button>
            <button onClick={() => { setPlaying(false); setPhase(total); }} className="btn-primary flex-1 text-sm">
              Naar einde
            </button>
          </>
        ) : (
          <button onClick={onFinish} className="btn-primary w-full text-lg">
            Bekijk details
          </button>
        )}
      </div>
    </div>
  );
}
