"use client";

import { useMemo } from "react";
import { effectiveStats, useGame } from "@/lib/store";
import { canPlayerPlay, eligibleSlots } from "@/lib/positions";
import type { Player } from "@/lib/types";
import { RatingBadge, fmtMv } from "./ui";
import { useT } from "@/lib/i18n/core";

export default function SquadPicker() {
  const t = useT();
  const squad = useGame((s) => s.squad);
  const slots = useGame((s) => s.slots);
  const loadingSquad = useGame((s) => s.loadingSquad);
  const landed = useGame((s) => s.landed);
  const error = useGame((s) => s.error);
  const ratingMode = useGame((s) => s.ratingMode);
  const difficulty = useGame((s) => s.difficulty);
  const rerollsLeft = useGame((s) => s.rerollsLeft);
  const pendingPlayer = useGame((s) => s.pendingPlayer);
  const pickPlayer = useGame((s) => s.pickPlayer);
  const cancelPick = useGame((s) => s.cancelPick);
  const reroll = useGame((s) => s.reroll);
  const requestSpin = useGame((s) => s.requestSpin);

  const ratingsHidden = difficulty === "hard";

  const openPos = useMemo(() => slots.filter((s) => !s.player).map((s) => s.pos), [slots]);

  const players = useMemo(
    () =>
      squad
        ? [...squad.players].sort(
            (a, b) => effectiveStats(b, ratingMode).overall - effectiveStats(a, ratingMode).overall,
          )
        : [],
    [squad, ratingMode],
  );

  const draftedIds = useMemo(
    () => new Set(slots.filter((s) => s.player).map((s) => s.player!.pid || s.player!.name)),
    [slots],
  );

  if (!landed) return null;

  const fits = (p: Player) => !draftedIds.has(p.pid || p.name) && openPos.some((pos) => canPlayerPlay(p, pos));
  const anyFits = players.some(fits);

  if (pendingPlayer) {
    return (
      <div className="rounded-2xl border border-draw/40 bg-draw/[0.07] px-5 py-4 text-center backdrop-blur">
        <div className="text-sm font-bold text-text">
          {t("draft.placePlayerPrefix")} <span className="font-extrabold text-draw">{pendingPlayer.name}</span>
        </div>
        <div className="mt-1 text-xs leading-relaxed text-dim">
          {t("draft.tapHighlightedSpot")}
        </div>
        <button onClick={cancelPick} className="btn-secondary mt-3 text-xs">
          {t("draft.cancel")}
        </button>
      </div>
    );
  }

  return (
    <div className="card flex w-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="eyebrow text-accent">{landed.league}</div>
          <h2 className="truncate text-lg font-extrabold leading-tight text-text font-display">
            {landed.club}
          </h2>
          <div className="text-xs text-dim">
            {landed.season}
            {!ratingsHidden && <> · <span className="text-faint">rating</span> <span className="stat-num text-accent-2">{landed.teamRating}</span></>}
          </div>
        </div>
        {rerollsLeft > 0 && (
          <button onClick={reroll} className="btn-secondary shrink-0 text-xs">
            ↻ {t("draft.rerollWithCount", { count: rerollsLeft })}
          </button>
        )}
      </div>

      {loadingSquad && <div className="py-6 text-center text-sm text-faint">{t("draft.squadLoading")}</div>}
      {error && <div className="text-center text-sm text-loss">{error}</div>}

      {squad && !anyFits && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white/[0.03] px-5 py-5 text-center">
          <div className="text-sm text-dim">{t("draft.noPlayerFits")}</div>
          <button onClick={requestSpin} className="btn-primary text-sm">
            {t("draft.spinAgain")}
          </button>
        </div>
      )}

      {squad && anyFits && (
        <>
          <div className="eyebrow">
            {t("draft.pickOnePlayerHint")}
          </div>
          <ul className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto lg:max-h-[calc(100dvh_-_320px)]">
            {players.map((p, i) => {
              const eligible = fits(p);
              const positions = eligibleSlots(p);
              const stats = effectiveStats(p, ratingMode);
              return (
                <li key={`${p.name}-${i}`}>
                  <button
                    disabled={!eligible}
                    onClick={() => pickPlayer(p)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-all ${
                      eligible
                        ? "border-line bg-white/[0.03] hover:border-accent/45 hover:bg-white/[0.055]"
                        : "cursor-not-allowed border-transparent bg-white/[0.015] opacity-40"
                    }`}
                  >
                    {ratingsHidden ? (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-sm font-bold text-faint">
                        ?
                      </span>
                    ) : (
                      <RatingBadge value={stats.overall} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-text">{p.name}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {positions.map((pos) => (
                          <span
                            key={pos}
                            className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-bold text-dim"
                          >
                            {pos}
                          </span>
                        ))}
                      </div>
                    </div>
                    {!ratingsHidden && (
                      <div className="shrink-0 text-right text-[10px] leading-relaxed text-faint">
                        <div className="text-dim">{fmtMv(p.mv)}</div>
                        <div>ATT <span className="stat-num text-xs text-text">{stats.attack}</span></div>
                        <div>DEF <span className="stat-num text-xs text-text">{stats.defense}</span></div>
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
