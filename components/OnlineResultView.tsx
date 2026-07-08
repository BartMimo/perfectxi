"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useGame } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useOnlineCareer, type OnlinePlayer } from "@/lib/onlineCareer";
import { divisionLabel } from "@/lib/career";
import { QUALIFICATION_LABELS } from "@/lib/sim";
import { saveResult } from "@/lib/saveResult";
import { useCustomPlayer, isCustomPlayer } from "@/lib/customPlayer";
import SquadViewModal from "@/components/SquadViewModal";
import MultiCareerTimeline from "@/components/MultiCareerTimeline";
import HeadToHeadModal from "@/components/HeadToHeadModal";
import LobbyRecapCard from "@/components/LobbyRecapCard";
import { useT } from "@/lib/i18n/core";
import { IconStar, IconTrophy } from "@/components/icons";

export default function OnlineResultView() {
  const t = useT();
  const result = useGame((s) => s.result);
  const slots = useGame((s) => s.slots);
  const formationKey = useGame((s) => s.formationKey);
  const ratingMode = useGame((s) => s.ratingMode);
  const difficulty = useGame((s) => s.difficulty);
  const userId = useAuth((s) => s.userId);
  const { lobby, finishSeason, advanceSeason, acknowledge, kickPlayer } = useOnlineCareer();
  const recordCustomPlayerSeason = useCustomPlayer((s) => s.recordSeason);
  const [saved, setSaved] = useState(false);
  const [seasonFinished, setSeasonFinished] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [showTable, setShowTable] = useState(true);
  const [viewSquadPlayer, setViewSquadPlayer] = useState<OnlinePlayer | null>(null);
  const [h2hPlayer, setH2hPlayer] = useState<OnlinePlayer | null>(null);
  const [sharingRecap, setSharingRecap] = useState(false);
  const recapRef = useRef<HTMLDivElement>(null);

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
    const players = slots.map((s) => s.player).filter((p): p is NonNullable<typeof p> => !!p);
    const avgRating = players.length > 0
      ? Math.round((players.reduce((sum, p) => sum + p.overall, 0) / players.length) * 10) / 10
      : 0;
    finishSeason(userId, result.position, result.userRow.points, result.userRow.gf, result.userRow.ga, avgRating);
    setSeasonFinished(true);
  }, [result, userId, seasonFinished]);

  useEffect(() => {
    if (!result || !userId || xpAwarded) return;
    setXpAwarded(true);
    if (!slots.some((s) => isCustomPlayer(s.player))) return;
    const stat = result.squadStats.find((p) => p.fromClub === "Jouw speler");
    recordCustomPlayerSeason(userId, {
      champion: result.position === 1,
      goals: stat?.goals ?? 0,
      assists: stat?.assists ?? 0,
      cleanSheets: stat?.cleanSheets ?? 0,
    });
  }, [result, userId, xpAwarded, slots, recordCustomPlayerSeason]);

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

  async function shareRecap() {
    if (sharingRecap) return;
    setSharingRecap(true);
    try {
      const node = recapRef.current;
      if (!node) return;
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, skipFonts: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "perfect-xi-recap.png", { type: "image/png" });
      let shared = false;
      try {
        const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
        if (nav.canShare?.({ files: [file] })) {
          await nav.share({ files: [file], title: "Perfect XI", text: t("result.recapShareText", { season: lobby?.current_season ?? 1 }) });
          shared = true;
        }
      } catch {
        // share dismissed of niet ondersteund, val terug op download
      }
      if (!shared) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "perfect-xi-recap.png";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }
    } finally {
      setSharingRecap(false);
    }
  }

  const div1Winner = lobby.players.find(
    (p) => p.history.some((h) => h.division === 1 && h.position === 1),
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
      {/* Season result */}
      <div className="card animate-pop p-6 text-center">
        <div className="eyebrow text-indigo-300 mb-2">
          {t("result.divisionSeason", { division: divisionLabel(t, me.current_division), season: lobby.current_season })}
        </div>

        {invincible ? (
          <>
            <div className="mx-auto flex h-16 w-16 animate-floaty items-center justify-center rounded-full bg-accent/15 text-accent ring-1 ring-accent/30">
              <IconStar className="h-9 w-9" />
            </div>
            <div className="mt-3 stat-num text-3xl text-accent text-glow">THE INVINCIBLES</div>
          </>
        ) : (
          <>
            <div className="stat-num text-6xl text-text">
              {position}<span className="text-3xl text-faint">{position === 1 ? t("result.ordinalSte") : t("result.ordinalE")}</span>
            </div>
            <div className="mt-2 text-base font-bold text-accent">
              {QUALIFICATION_LABELS[qualification]}
            </div>
          </>
        )}

        {champion && promoted && (
          <div className="mt-2 text-lg font-black text-draw font-display">
            {t("result.championPromotedTo", { division: divisionLabel(t, me.current_division - 1) })}
          </div>
        )}
        {!champion && position === 2 && me.current_division > 1 && (
          <div className="mt-2 text-lg font-black text-accent font-display">
            {t("result.promotedTo", { division: divisionLabel(t, me.current_division - 1) })}
          </div>
        )}
        {relegated && (
          <div className="mt-2 text-lg font-black text-loss font-display">
            {t("result.relegatedTo", { division: divisionLabel(t, me.current_division + 1) })}
          </div>
        )}

        <div className="mx-auto mt-4 grid max-w-md grid-cols-4 gap-2 text-center">
          <Stat label={t("result.points")} value={userRow.points} accent />
          <Stat label={t("result.wonAbbr")} value={userRow.won} />
          <Stat label={t("result.drawnAbbr")} value={userRow.drawn} />
          <Stat label={t("result.lostAbbr")} value={userRow.lost} />
        </div>
      </div>

      {/* Career timeline */}
      {me.history.length > 0 && (
        <MultiCareerTimeline
          players={activePlayers.map((p) => ({
            id: p.user_id,
            name: p.team_name || p.username,
            isMe: p.user_id === userId,
            history: p.history,
            currentDivision: p.current_division,
          }))}
          currentSeason={lobby.current_season + 1}
        />
      )}

      {/* Game winner */}
      {div1Winner && (
        <div className="card p-6 text-center border border-draw/30 bg-draw/[0.06]">
          <div className="animate-floaty mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-draw/15 text-draw ring-1 ring-draw/30"><IconTrophy className="h-7 w-7" /></div>
          <div className="text-xl font-black text-draw font-display text-glow">
            {t("result.winsTheGame", { name: div1Winner.team_name || div1Winner.username })}
          </div>
          <p className="text-sm text-draw/80 mt-1">
            {t("result.division1ChampionInSeason", { season: lobby.current_season })}
          </p>
        </div>
      )}

      {/* Other players status */}
      <div className="card p-5">
        <div className="eyebrow mb-3">
          {t("result.playerOverview")}
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
                  className={`flex items-center justify-between rounded-2xl p-3 border ${
                    isMe
                      ? "bg-indigo-400/[0.08] border-indigo-400/30"
                      : p.is_bot
                        ? "bg-white/[0.02] border-dashed border-line"
                        : "bg-white/[0.03] border-line"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {p.is_bot ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-sm shrink-0">🤖</div>
                    ) : (
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black shrink-0 ${
                        isMe ? "bg-indigo-500/30 text-indigo-100 ring-1 ring-indigo-400/40" : "bg-white/[0.08] text-dim"
                      }`}>
                        {(p.team_name || p.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-text truncate">
                        {p.team_name || p.username}
                        {isMe && <span className="ml-1 text-[9px] font-bold text-indigo-300">{t("result.you")}</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-faint">{divisionLabel(t, p.current_division)}</span>
                        {rating > 0 && <span className="text-[10px] font-bold text-accent">{rating} OVR</span>}
                        {p.championships > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-draw">
                            {p.championships}x <IconTrophy className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {lastSeason && (
                      <span className={`rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${
                        lastSeason.position <= 2 ? "bg-accent/12 text-accent" :
                        lastSeason.position >= 18 ? "bg-loss/12 text-loss" :
                        "bg-white/[0.05] text-dim"
                      }`}>
                        {t("result.ordinalPosition", { position: lastSeason.position })}
                      </span>
                    )}
                    {p.squad.length > 0 && (
                      <button
                        onClick={() => setViewSquadPlayer(p)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-400/12 border border-indigo-400/25 text-xs text-indigo-300 hover:bg-indigo-400/20 transition"
                        title={t("result.viewTeam")}
                      >
                        👁
                      </button>
                    )}
                    {!isMe && !p.is_bot && (
                      <button
                        onClick={() => setH2hPlayer(p)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-draw/12 border border-draw/25 text-xs text-draw hover:bg-draw/20 transition"
                        title={t("onlineCarriere.h2h.viewH2h")}
                      >
                        <IconTrophy className="h-3 w-3" />
                      </button>
                    )}
                    {p.acknowledged ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-accent-ink font-bold">✓</span>
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] border border-line text-xs text-faint">…</span>
                    )}
                    {isOwner && !isMe && !p.is_bot && (
                      <button
                        onClick={() => kickPlayer(p.user_id)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-loss/[0.08] border border-loss/25 text-xs text-loss hover:bg-loss/16 transition"
                        title={t("result.removePlayer")}
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

      <button onClick={shareRecap} disabled={sharingRecap} className="btn-secondary w-full">
        {sharingRecap ? t("result.creatingCard") : t("result.shareRecap")}
      </button>

      {/* Continue / Next season buttons */}
      {!div1Winner && (
        !iAcknowledged ? (
          <button
            onClick={handleAcknowledge}
            className="btn-primary w-full py-4 text-lg"
          >
            {t("result.continue")}
          </button>
        ) : isOwner ? (
          <button
            disabled={!allAcknowledged}
            onClick={handleNextSeason}
            className="btn-primary w-full py-4 text-lg"
          >
            {allAcknowledged
              ? t("result.startSeason", { season: lobby.current_season + 1 })
              : t("result.waitForEveryone")}
          </button>
        ) : (
          <div className="rounded-xl bg-white/[0.03] border border-line px-5 py-3.5 text-center text-sm font-bold text-faint">
            {t("result.waitForHost")}
          </div>
        )
      )}

      {/* Standings table */}
      <button onClick={() => setShowTable((v) => !v)} className="btn-secondary w-full">
        {showTable ? t("result.hideStandings") : t("result.showStandings")}
      </button>

      {showTable && (
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
              {table.map((r, i) => {
                const isMe = r.name === (me?.team_name || me?.username);
                const isHuman = r.isUser;
                return (
                <tr
                  key={r.name}
                  className={`border-t border-line ${
                    isMe ? "bg-accent/[0.08] font-bold text-accent"
                    : isHuman ? "bg-indigo-400/[0.06] font-semibold text-indigo-200"
                    : "text-dim"
                  }`}
                >
                  <td className="px-3 py-2">
                    <span className={`stat-num text-sm ${i < 2 ? "text-accent-2" : i >= 17 ? "text-loss" : "text-faint"}`}>{i + 1}</span>
                  </td>
                  <td className="max-w-[150px] truncate px-3 py-2">
                    {r.name}
                    {isHuman && !isMe && <span className="ml-1 text-[9px] text-indigo-300">●</span>}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{r.played}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{(r.gd >= 0 ? "+" : "") + r.gd}</td>
                  <td className="px-3 py-2 text-right stat-num text-sm text-text">{r.points}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Player stats */}
      <div className="card-solid overflow-hidden">
        <div className="px-5 py-3 eyebrow">{t("result.playerStats")}</div>
        <table className="w-full text-xs">
          <thead className="bg-white/[0.03] text-faint">
            <tr className="[&>th]:font-bold [&>th]:uppercase [&>th]:tracking-wider [&>th]:text-[10px]">
              <th className="px-3 py-2 text-left">{t("result.player")}</th>
              <th className="px-2 py-2 text-left">{t("result.pos")}</th>
              <th className="px-2 py-2 text-right">{t("result.goalsAbbr")}</th>
              <th className="px-2 py-2 text-right">{t("result.assistsAbbr")}</th>
              <th className="px-3 py-2 text-right">{t("result.cleanSheetsAbbr")}</th>
            </tr>
          </thead>
          <tbody>
            {squadStats.map((p) => (
              <tr key={p.name} className="border-t border-line text-dim">
                <td className="max-w-[150px] truncate px-3 py-2">{p.name}</td>
                <td className="px-2 py-2 text-faint">{p.pos}</td>
                <td className="px-2 py-2 text-right tabular-nums">{p.goals || "—"}</td>
                <td className="px-2 py-2 text-right tabular-nums">{p.assists || "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.cleanSheets || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewSquadPlayer && <SquadViewModal player={viewSquadPlayer} onClose={() => setViewSquadPlayer(null)} />}
      {h2hPlayer && <HeadToHeadModal me={me} opponent={h2hPlayer} onClose={() => setH2hPlayer(null)} />}

      {/* Verborgen recapkaart voor export */}
      <div aria-hidden style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }}>
        <LobbyRecapCard
          ref={recapRef}
          lobbyName={lobby.lobby_name || t("onlineCarriere.title")}
          season={lobby.current_season}
          players={activePlayers}
          myUserId={userId ?? ""}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border px-2 py-2.5 ${accent ? "border-accent/30 bg-accent/[0.08]" : "border-line bg-white/[0.03]"}`}>
      <div className={`stat-num text-2xl ${accent ? "text-accent" : "text-text"}`}>{value}</div>
      <div className="eyebrow mt-0.5">{label}</div>
    </div>
  );
}
