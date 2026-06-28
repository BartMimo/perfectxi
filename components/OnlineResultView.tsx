"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useOnlineCareer } from "@/lib/onlineCareer";
import { divisionLabel } from "@/lib/career";
import { QUALIFICATION_LABELS } from "@/lib/sim";
import { saveResult } from "@/lib/saveResult";

export default function OnlineResultView() {
  const result = useGame((s) => s.result);
  const slots = useGame((s) => s.slots);
  const formationKey = useGame((s) => s.formationKey);
  const ratingMode = useGame((s) => s.ratingMode);
  const difficulty = useGame((s) => s.difficulty);
  const newGame = useGame((s) => s.newGame);
  const userId = useAuth((s) => s.userId);
  const { lobby, finishSeason, saveSquad, advanceSeason, kickPlayer } = useOnlineCareer();
  const [saved, setSaved] = useState(false);
  const [seasonFinished, setSeasonFinished] = useState(false);
  const [showTable, setShowTable] = useState(true);

  const me = lobby?.players.find((p) => p.user_id === userId);

  useEffect(() => {
    if (!result || !userId || saved || !me || !lobby) return;
    const squad = slots.map((s) => s.player!);
    saveSquad(userId, squad);

    saveResult({
      userId,
      result,
      slots,
      leagueCode: "DIV",
      leagueName: `Divisie ${me.current_division}`,
      formation: formationKey,
      ratingMode,
      difficulty,
      isCareer: true,
      careerDivision: me.current_division,
      careerSeason: lobby.current_season,
    }).then(() => setSaved(true));
  }, [result, userId, saved]);

  useEffect(() => {
    if (!result || !userId || seasonFinished || !me || !lobby) return;
    finishSeason(userId, result.position, result.userRow.points, result.userRow.gf, result.userRow.ga);
    setSeasonFinished(true);
  }, [result, userId, seasonFinished]);

  if (!result || !lobby || !me) return null;

  const { userRow, position, invincible, qualification, table, squadStats } = result;
  const promoted = position <= 2 && me.current_division > 1;
  const relegated = position >= 18 && me.current_division < 10;
  const champion = position === 1;

  const allReady = lobby.players.every((p) => p.ready);
  const isOwner = lobby.owner_id === userId;

  const handleNextSeason = async () => {
    await advanceSeason();
    newGame();
  };

  // Check if anyone has won div 1
  const div1Winner = lobby.players.find(
    (p) => p.history.some((h) => h.division === 1 && h.position === 1),
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
      {/* Season result */}
      <div className="card animate-pop p-6 text-center">
        <div className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
          {divisionLabel(me.current_division)} · Seizoen {lobby.current_season}
        </div>

        {invincible ? (
          <>
            <div className="text-5xl">🏆🛡️</div>
            <div className="mt-3 bg-gradient-to-r from-amber-500 to-yellow-400 bg-clip-text text-2xl font-black text-transparent">THE INVINCIBLES</div>
          </>
        ) : (
          <>
            <div className="text-5xl font-black tabular-nums text-slate-800">
              {position}<span className="text-2xl text-slate-300">{position === 1 ? "ste" : "e"}</span>
            </div>
            <div className="mt-2 text-base font-bold text-emerald-600">
              {QUALIFICATION_LABELS[qualification]}
            </div>
          </>
        )}

        {champion && promoted && (
          <div className="mt-2 text-lg font-black text-amber-700">
            Kampioen! Promotie naar {divisionLabel(me.current_division - 1)}
          </div>
        )}
        {!champion && position === 2 && me.current_division > 1 && (
          <div className="mt-2 text-lg font-black text-emerald-600">
            Promotie naar {divisionLabel(me.current_division - 1)}!
          </div>
        )}
        {relegated && (
          <div className="mt-2 text-lg font-black text-rose-600">
            Degradatie naar {divisionLabel(me.current_division + 1)}
          </div>
        )}

        <div className="mx-auto mt-4 grid max-w-md grid-cols-4 gap-2 text-center">
          <Stat label="Punten" value={userRow.points} accent />
          <Stat label="W" value={userRow.won} />
          <Stat label="G" value={userRow.drawn} />
          <Stat label="V" value={userRow.lost} />
        </div>
      </div>

      {/* Game winner */}
      {div1Winner && (
        <div className="card p-6 text-center border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50">
          <div className="text-4xl mb-2">🏆👑🏆</div>
          <div className="text-xl font-black text-amber-800">
            {div1Winner.team_name || div1Winner.username} wint het spel!
          </div>
          <p className="text-sm text-amber-600 mt-1">
            Divisie 1 kampioen in seizoen {lobby.current_season}!
          </p>
        </div>
      )}

      {/* Other players status */}
      <div className="card p-5">
        <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
          Overzicht spelers
        </div>
        <div className="flex flex-col gap-1.5">
          {lobby.players
            .sort((a, b) => a.current_division - b.current_division)
            .map((p) => {
              const lastSeason = p.history[p.history.length - 1];
              return (
                <div
                  key={p.user_id}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 ${
                    p.user_id === userId ? "bg-indigo-50 border-2 border-indigo-200" : "bg-slate-50/80 border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {p.is_bot && <span className="text-xs">🤖</span>}
                    <span className={`text-sm font-bold truncate ${p.is_bot ? "text-slate-500" : "text-slate-800"}`}>
                      {p.team_name || p.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {divisionLabel(p.current_division)}
                    </span>
                    {lastSeason && (
                      <span className={`text-[10px] font-bold ${
                        lastSeason.position <= 2 ? "text-emerald-600" : lastSeason.position >= 18 ? "text-rose-500" : "text-slate-500"
                      }`}>
                        {lastSeason.position}e
                      </span>
                    )}
                    {p.ready ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">✓</span>
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs text-slate-400">…</span>
                    )}
                    {isOwner && p.user_id !== userId && !p.is_bot && (
                      <button
                        onClick={() => kickPlayer(p.user_id)}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs text-rose-500 hover:bg-rose-200 transition"
                        title="Verwijder speler"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Next season button */}
      {allReady && !div1Winner && (
        isOwner ? (
          <button onClick={handleNextSeason} className="btn-primary w-full text-lg">
            Start seizoen {lobby.current_season + 1}
          </button>
        ) : (
          <div className="rounded-2xl bg-slate-100 px-5 py-3.5 text-center text-base font-bold text-slate-500">
            Wacht tot de host het volgende seizoen start…
          </div>
        )
      )}

      {!allReady && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-3.5 text-center text-sm font-bold text-amber-700">
          Wacht tot alle spelers hun seizoen hebben afgerond…
        </div>
      )}

      {/* Standings table */}
      <button onClick={() => setShowTable((v) => !v)} className="btn-secondary w-full">
        {showTable ? "Verberg ranglijst" : "Toon ranglijst"}
      </button>

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
                    <span className={i < 2 ? "text-emerald-500" : i >= 17 ? "text-rose-400" : ""}>{i + 1}</span>
                  </td>
                  <td className="max-w-[150px] truncate px-3 py-2">{r.name}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{r.played}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{(r.gd >= 0 ? "+" : "") + r.gd}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Player stats */}
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
  );
}

function Stat({ label, value, accent = false }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl px-2 py-2.5 ${accent ? "bg-emerald-50/80" : "bg-slate-50/80"}`}>
      <div className={`text-lg font-black tabular-nums ${accent ? "text-emerald-700" : "text-slate-800"}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-slate-400">{label}</div>
    </div>
  );
}
