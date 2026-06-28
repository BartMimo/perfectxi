"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useGame } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { QUALIFICATION_LABELS } from "@/lib/sim";
import { saveResult } from "@/lib/saveResult";
import { leagueName } from "@/lib/leagues";
import { computeAchievements, type Achievement } from "@/lib/achievements";
import ShareCard from "./ShareCard";

export default function ResultView() {
  const result = useGame((s) => s.result);
  const newGame = useGame((s) => s.newGame);
  const slots = useGame((s) => s.slots);
  const leagueCode = useGame((s) => s.leagueCode);
  const formationKey = useGame((s) => s.formationKey);
  const ratingMode = useGame((s) => s.ratingMode);
  const difficulty = useGame((s) => s.difficulty);
  const userId = useAuth((s) => s.userId);
  const [showTable, setShowTable] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!result || !userId || !leagueCode || saved) return;
    const achv = computeAchievements(result);
    setAchievements(achv);
    saveResult({
      userId,
      result,
      slots,
      leagueCode,
      leagueName: leagueName(leagueCode),
      formation: formationKey,
      ratingMode,
      difficulty,
    }).then(() => setSaved(true));
  }, [result, userId, leagueCode, saved, slots, formationKey, ratingMode, difficulty]);

  async function shareResult() {
    if (sharing) return;
    setSharing(true);
    try {
      const node = cardRef.current;
      if (!node) {
        alert("Deelkaart kon niet geladen worden.");
        return;
      }
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "perfect-xi.png", { type: "image/png" });

      let shared = false;
      try {
        const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
        if (nav.canShare?.({ files: [file] })) {
          await nav.share({ files: [file], title: "Perfect XI", text: "Mijn Perfect XI seizoen! Speel jij het beter?" });
          shared = true;
        }
      } catch {
        // share dismissed or unsupported, fall through to download
      }

      if (!shared) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "perfect-xi.png";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      console.error("Share failed:", e);
      alert("Delen mislukt: " + e.message);
    } finally {
      setSharing(false);
    }
  }

  if (!result) return null;
  const { userRow, position, invincible, qualification, table, matches, awards, squadStats } =
    result;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
      {/* Reveal-kop */}
      <div className="card animate-pop p-6 text-center">
        {invincible ? (
          <>
            <div className="text-5xl">🏆🛡️</div>
            <div className="mt-3 bg-gradient-to-r from-amber-500 to-yellow-400 bg-clip-text text-2xl font-black text-transparent">THE INVINCIBLES</div>
            <div className="mt-1 text-sm text-slate-500">
              38 gespeeld, 38 gewonnen. Een perfect seizoen: <b>38-0-0</b>.
            </div>
          </>
        ) : (
          <>
            <div className="text-xs uppercase tracking-widest text-slate-400">Eindstand</div>
            <div className="mt-2 text-5xl font-black tabular-nums text-slate-800">
              {position}
              <span className="text-2xl text-slate-300">
                {position === 1 ? "ste" : position === 2 ? "de" : "e"}
              </span>
            </div>
            <div className="mt-2 text-base font-bold text-emerald-600">
              {QUALIFICATION_LABELS[qualification]}
            </div>
          </>
        )}

        <div className="mx-auto mt-5 grid max-w-md grid-cols-4 gap-2 text-center">
          <Stat label="Punten" value={userRow.points} accent />
          <Stat label="W" value={userRow.won} />
          <Stat label="G" value={userRow.drawn} />
          <Stat label="V" value={userRow.lost} />
        </div>
        <div className="mx-auto mt-2 grid max-w-md grid-cols-3 gap-2 text-center">
          <Stat label="Voor" value={userRow.gf} />
          <Stat label="Tegen" value={userRow.ga} />
          <Stat label="Saldo" value={(userRow.gd >= 0 ? "+" : "") + userRow.gd} />
        </div>
      </div>

      {/* Awards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Award icon="⚽" title="Topscorer" name={awards.topScorer?.name ?? "—"} value={awards.topScorer ? `${awards.topScorer.goals} goals` : ""} />
        <Award icon="🎯" title="Meeste assists" name={awards.topAssister?.name ?? "—"} value={awards.topAssister ? `${awards.topAssister.assists} assists` : ""} />
        <Award icon="🧤" title="Golden Glove" name={awards.goalkeeper?.name ?? "—"} value={`${awards.cleanSheets} clean sheets`} />
        <Award icon="💥" title="Grootste zege" name={awards.biggestWin ? `vs ${awards.biggestWin.opponent}` : "—"} value={awards.biggestWin ? `${awards.biggestWin.gf}-${awards.biggestWin.ga}` : ""} />
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="card animate-fade-up p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Achievements</div>
          <div className="flex flex-wrap gap-2">
            {achievements.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full bg-amber-50/80 border border-amber-200/60 px-3.5 py-1.5 text-xs font-bold text-amber-800 shadow-sm">
                {a.icon} {a.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={shareResult}
        disabled={sharing}
        className="btn-primary w-full text-base"
      >
        {sharing ? "Kaart maken…" : "Deel je resultaat"}
      </button>

      <div className="flex gap-2">
        <button onClick={() => setShowTable((v) => !v)} className="btn-secondary flex-1">
          {showTable ? "Verberg ranglijst" : "Toon ranglijst"}
        </button>
        <button onClick={newGame} className="btn-primary flex-1 text-sm">
          Speel opnieuw
        </button>
      </div>

      {/* Verborgen resultkaart voor export */}
      <div aria-hidden style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }}>
        <ShareCard ref={cardRef} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        {showTable && (
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
                {table.map((r, i) => (
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
        )}

        <div className="card overflow-hidden">
          <div className="px-5 py-3 text-sm font-bold text-slate-700">Spelersstatistieken</div>
          <table className="w-full text-xs">
            <thead className="bg-slate-50/80 text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left">Speler</th>
                <th className="px-2 py-2 text-left">Pos</th>
                <th className="px-2 py-2 text-right">G</th>
                <th className="px-2 py-2 text-right">A</th>
                <th className="px-3 py-2 text-right">CS</th>
              </tr>
            </thead>
            <tbody>
              {squadStats.map((p) => (
                <tr key={p.name} className="border-t border-slate-100/60 text-slate-600">
                  <td className="max-w-[150px] truncate px-3 py-2">{p.name}</td>
                  <td className="px-2 py-2 text-slate-400">{p.pos}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{p.goals || "—"}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{p.assists || "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.cleanSheets || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alle uitslagen */}
      <details className="card">
        <summary className="cursor-pointer px-5 py-3.5 text-sm font-bold text-slate-700">
          Alle 38 uitslagen
        </summary>
        <div className="grid grid-cols-2 gap-1.5 px-4 pb-4 text-[11px] sm:grid-cols-3">
          {matches.map((m, i) => {
            const win = m.gf > m.ga;
            const draw = m.gf === m.ga;
            return (
              <div
                key={i}
                className={`flex items-center justify-between rounded-xl px-3 py-1.5 ${
                  win ? "bg-emerald-50/70" : draw ? "bg-amber-50/70" : "bg-rose-50/70"
                }`}
              >
                <span className="truncate text-slate-500">
                  {m.home ? "" : "@"}
                  {m.opponent}
                </span>
                <span className="ml-1 shrink-0 font-bold tabular-nums text-slate-700">
                  {m.gf}-{m.ga}
                </span>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}

function Award({ icon, title, name, value }: { icon: string; title: string; name: string; value: string }) {
  return (
    <div className="card p-3.5">
      <div className="text-[10px] uppercase tracking-widest text-slate-400">
        {icon} {title}
      </div>
      <div className="mt-1 truncate text-sm font-bold text-slate-800">{name}</div>
      <div className="truncate text-[11px] text-emerald-600">{value}</div>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl px-2 py-2.5 ${accent ? "bg-emerald-50/80" : "bg-slate-50/80"}`}>
      <div className={`text-lg font-black tabular-nums ${accent ? "text-emerald-700" : "text-slate-800"}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-slate-400">{label}</div>
    </div>
  );
}
