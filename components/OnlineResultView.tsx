"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useOnlineCareer, type OnlinePlayer } from "@/lib/onlineCareer";
import { divisionLabel } from "@/lib/career";
import { QUALIFICATION_LABELS } from "@/lib/sim";
import { saveResult } from "@/lib/saveResult";
import SquadViewModal from "@/components/SquadViewModal";
import CareerTimeline from "@/components/CareerTimeline";

export default function OnlineResultView() {
  const result = useGame((s) => s.result);
  const slots = useGame((s) => s.slots);
  const formationKey = useGame((s) => s.formationKey);
  const ratingMode = useGame((s) => s.ratingMode);
  const difficulty = useGame((s) => s.difficulty);
  const userId = useAuth((s) => s.userId);
  const { lobby, finishSeason, advanceSeason, acknowledge, kickPlayer } = useOnlineCareer();
  const [saved, setSaved] = useState(false);
  const [seasonFinished, setSeasonFinished] = useState(false);
  const [showTable, setShowTable] = useState(true);
  const [viewSquadPlayer, setViewSquadPlayer] = useState<OnlinePlayer | null>(null);

  const me = lobby?.players.find((p) => p.user_id === userId);

  useEffect(() => {
    if (!result || !userId || saved || !me || !lobby) return;
    const hasPlayers = slots.length > 0 && slots.every((s) => s.player);
    if (!hasPlayers) return;

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

  const activePlayers = lobby.players.filter((p) => !p.pending);
  const allAcknowledged = activePlayers.every((p) => p.acknowledged);
  const isOwner = lobby.owner_id === userId;
  const iAcknowledged = me.acknowledged;

  const handleAcknowledge = async () => {
    if (!userId) return;
    await acknowledge(userId);
  };

  const handleNextSeason = async () => {
    await advanceSeason();
  };

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

      {/* Career timeline */}
      {me.history.length > 0 && (
        <CareerTimeline history={me.history} currentDivision={me.current_division} currentSeason={lobby.current_season + 1} />
      )}

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
          {[...activePlayers]
            .sort((a, b) => a.current_division - b.current_division || a.username.localeCompare(b.username))
            .map((p) => {
              const lastSeason = p.history[p.history.length - 1];
              const rating = p.squad.length > 0
                ? Math.round(p.squad.reduce((s, pl) => s + pl.overall, 0) / p.squad.length * 10) / 10
                : 0;
              const isMe = p.user_id === userId;
              return (
                <div
                  key={p.user_id}
                  className={`flex items-center justify-between rounded-2xl p-3 ${
                    isMe
                      ? "bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200"
                      : p.is_bot
                        ? "bg-slate-50/60 border-2 border-dashed border-slate-200"
                        : "bg-white/80 border-2 border-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {p.is_bot ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm shrink-0">🤖</div>
                    ) : (
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white shrink-0 ${
                        isMe ? "bg-gradient-to-br from-indigo-500 to-purple-500" : "bg-gradient-to-br from-slate-400 to-slate-500"
                      }`}>
                        {(p.team_name || p.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate">
                        {p.team_name || p.username}
                        {isMe && <span className="ml-1 text-[9px] font-bold text-indigo-400">jij</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400">{divisionLabel(p.current_division)}</span>
                        {rating > 0 && <span className="text-[10px] font-bold text-emerald-600">{rating} OVR</span>}
                        {p.championships > 0 && <span className="text-[10px] font-bold text-amber-600">{p.championships}x🏆</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {lastSeason && (
                      <span className={`rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${
                        lastSeason.position <= 2 ? "bg-emerald-50 text-emerald-700" :
                        lastSeason.position >= 18 ? "bg-rose-50 text-rose-600" :
                        "bg-slate-50 text-slate-500"
                      }`}>
                        {lastSeason.position}e
                      </span>
                    )}
                    {p.squad.length > 0 && (
                      <button
                        onClick={() => setViewSquadPlayer(p)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-500 hover:bg-indigo-100 transition"
                        title="Bekijk team"
                      >
                        👁
                      </button>
                    )}
                    {p.acknowledged ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs text-white shadow-sm shadow-emerald-200">✓</span>
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-400">…</span>
                    )}
                    {isOwner && !isMe && !p.is_bot && (
                      <button
                        onClick={() => kickPlayer(p.user_id)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 border border-rose-200 text-xs text-rose-400 hover:bg-rose-100 transition"
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

      {/* Continue / Next season buttons */}
      {!div1Winner && (
        !iAcknowledged ? (
          <button
            onClick={handleAcknowledge}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 text-lg font-extrabold text-white shadow-md shadow-emerald-200/50 transition hover:shadow-lg hover:-translate-y-0.5"
          >
            Verder gaan
          </button>
        ) : isOwner ? (
          <button
            disabled={!allAcknowledged}
            onClick={handleNextSeason}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-4 text-lg font-extrabold text-white shadow-md shadow-indigo-200/50 transition hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-40"
          >
            {allAcknowledged
              ? `Start seizoen ${lobby.current_season + 1}`
              : `Wacht tot iedereen op "Verder gaan" klikt…`}
          </button>
        ) : (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 px-5 py-3.5 text-center text-sm font-bold text-slate-400">
            Wacht tot de host het volgende seizoen start…
          </div>
        )
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
              {table.map((r, i) => {
                const isMe = r.name === (me?.team_name || me?.username);
                const isHuman = r.isUser;
                return (
                <tr
                  key={r.name}
                  className={`border-t border-slate-100/60 ${
                    isMe ? "bg-emerald-50/60 font-bold text-emerald-800"
                    : isHuman ? "bg-indigo-50/40 font-semibold text-indigo-800"
                    : "text-slate-600"
                  }`}
                >
                  <td className="px-3 py-2">
                    <span className={i < 2 ? "text-emerald-500" : i >= 17 ? "text-rose-400" : ""}>{i + 1}</span>
                  </td>
                  <td className="max-w-[150px] truncate px-3 py-2">
                    {r.name}
                    {isHuman && !isMe && <span className="ml-1 text-[9px] text-indigo-400">●</span>}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{r.played}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{(r.gd >= 0 ? "+" : "") + r.gd}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{r.points}</td>
                </tr>
                );
              })}
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

      {viewSquadPlayer && <SquadViewModal player={viewSquadPlayer} onClose={() => setViewSquadPlayer(null)} />}
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
