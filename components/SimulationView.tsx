"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/store";
import type { MatchResult } from "@/lib/sim";
import { useT } from "@/lib/i18n/core";
import { IconBall, IconPause, IconPlay } from "@/components/icons";

function outcome(m: MatchResult): "W" | "D" | "L" {
  return m.gf > m.ga ? "W" : m.gf === m.ga ? "D" : "L";
}
const dot = { W: "bg-win", D: "bg-draw", L: "bg-loss" } as const;

function KeyMoments({ m }: { m: MatchResult }) {
  const t = useT();
  return (
    <div className="mt-3 flex h-24 flex-col gap-1 overflow-y-auto">
      {!!m.goals?.length && (
        <div className="eyebrow">
          {t("result.keyMoments")}
        </div>
      )}
      {m.goals?.map((g, i) => (
        <div
          key={i}
          className="animate-pop flex items-center gap-2 text-xs text-dim"
          style={{ animationDelay: `${i * 90}ms` }}
        >
          <span className="w-8 shrink-0 text-right stat-num text-sm text-accent">{g.minute}&prime;</span>
          <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-accent/12 text-accent">
            <IconBall className="h-3 w-3" />
          </span>
          <span className="truncate font-bold text-text">{g.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function SimulationView() {
  const t = useT();
  const result = useGame((s) => s.result);
  const finish = useGame((s) => s.finishSimulation);

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
          <div className="mb-2 flex items-center justify-between eyebrow">
            <span>
              {t("result.matchday", { round: md.round, total })}
            </span>
            <span className="text-dim">
              {t("result.formLine", { won: userRow.won, drawn: userRow.drawn, lost: userRow.lost, points: userRow.points })}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-2 to-accent transition-all"
              style={{ width: `${((round + 1) / total) * 100}%` }}
            />
          </div>

          <div
            className={`mt-5 flex items-center justify-between rounded-xl border px-5 py-4 ${
              oc === "W"
                ? "border-win/30 bg-win/[0.08]"
                : oc === "D"
                  ? "border-draw/30 bg-draw/[0.08]"
                  : "border-loss/30 bg-loss/[0.08]"
            }`}
          >
            <div className="min-w-0">
              <div className="eyebrow">
                {m.home ? t("result.home") : t("result.away")}
              </div>
              <div className="truncate text-sm font-bold text-text">
                {t("result.yourXi")} <span className="text-faint">vs</span> {m.opponent}
              </div>
            </div>
            <div className="shrink-0 stat-num text-3xl text-text">
              {m.gf}-{m.ga}
            </div>
          </div>

          <KeyMoments m={m} />

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="eyebrow">{t("result.form")}</span>
              {form.map((f, i) => (
                <span key={i} className={`h-4 w-4 rounded-full ${dot[outcome(f)]}`} />
              ))}
            </div>
            <div className="text-sm font-bold">
              <span className="text-faint">{t("result.position")} </span>
              <span className="stat-num text-lg text-accent">{t("result.positionValue", { position })}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {!done ? (
            <>
              <button
                onClick={() => setPlaying((p) => !p)}
                className="btn-secondary flex flex-1 items-center justify-center gap-2"
              >
                {playing ? <IconPause className="h-3.5 w-3.5" /> : <IconPlay className="h-3.5 w-3.5" />}
                {playing ? t("result.pause") : t("result.resume")}
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
                {t("result.toEnd")}
              </button>
            </>
          ) : (
            <button onClick={finish} className="btn-primary w-full text-lg">
              {t("result.viewFinalStandings")}
            </button>
          )}
        </div>
      </div>

      <div className="card-solid overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-white/[0.03] text-faint">
            <tr className="[&>th]:font-bold [&>th]:uppercase [&>th]:tracking-wider [&>th]:text-[10px]">
              <th className="px-3 py-2.5 text-left">#</th>
              <th className="px-3 py-2.5 text-left">{t("result.team")}</th>
              <th className="px-2 py-2.5 text-right">{t("result.playedAbbr")}</th>
              <th className="px-2 py-2.5 text-right">{t("result.goalDiffAbbr")}</th>
              <th className="px-3 py-2.5 text-right">{t("result.pointsAbbr")}</th>
            </tr>
          </thead>
          <tbody>
            {md.standings.map((r, i) => (
              <tr
                key={r.name}
                className={`border-t border-line ${
                  r.isUser ? "bg-accent/[0.08] font-bold text-accent" : "text-dim"
                }`}
              >
                <td className="px-3 py-2">
                  <span className={`stat-num text-sm ${i < 4 ? "text-accent-2" : i >= 17 ? "text-loss" : "text-faint"}`}>
                    {i + 1}
                  </span>
                </td>
                <td className="max-w-[150px] truncate px-3 py-2">{r.name}</td>
                <td className="px-2 py-2 text-right tabular-nums">{r.played}</td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {(r.gd >= 0 ? "+" : "") + r.gd}
                </td>
                <td className="px-3 py-2 text-right stat-num text-sm text-text">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
