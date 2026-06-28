"use client";

import { useMemo } from "react";
import { effectiveStats, useGame } from "@/lib/store";
import { canPlayerPlay, eligibleSlots } from "@/lib/positions";
import type { Player } from "@/lib/types";
import { RatingBadge, fmtMv } from "./ui";

export default function SquadPicker() {
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
      <div className="rounded-2xl border-2 border-amber-300/60 bg-amber-50/80 px-5 py-4 text-center backdrop-blur">
        <div className="text-sm font-bold text-amber-800">
          Plaats <span className="font-extrabold">{pendingPlayer.name}</span>
        </div>
        <div className="mt-1 text-xs leading-relaxed text-amber-700/70">
          Tik op een gemarkeerde positie in het veld.
        </div>
        <button onClick={cancelPick} className="btn-secondary mt-3 text-xs">
          Annuleer
        </button>
      </div>
    );
  }

  return (
    <div className="card flex w-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-emerald-600/80">{landed.league}</div>
          <h2 className="truncate text-base font-extrabold leading-tight text-slate-800">
            {landed.club}
          </h2>
          <div className="text-xs text-slate-400">
            {landed.season}
            {!ratingsHidden && <> · rating {landed.teamRating}</>}
          </div>
        </div>
        {rerollsLeft > 0 && (
          <button onClick={reroll} className="btn-secondary shrink-0 text-xs">
            ↻ Opnieuw ({rerollsLeft})
          </button>
        )}
      </div>

      {loadingSquad && <div className="py-6 text-center text-sm text-slate-400">Squad laden…</div>}
      {error && <div className="text-center text-sm text-rose-500">{error}</div>}

      {squad && !anyFits && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-slate-50/80 px-5 py-5 text-center">
          <div className="text-sm text-slate-500">Geen enkele speler past op een vrije positie.</div>
          <button onClick={requestSpin} className="btn-primary text-sm">
            Draai opnieuw
          </button>
        </div>
      )}

      {squad && anyFits && (
        <>
          <div className="text-xs text-slate-400">
            Kies één speler. Uitgegrijsd = past niet op een vrije positie.
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
                    className={`flex w-full items-center gap-3 rounded-2xl border-2 px-3.5 py-2.5 text-left transition-all ${
                      eligible
                        ? "border-transparent bg-white/70 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/60 hover:shadow"
                        : "cursor-not-allowed border-transparent bg-slate-50/50 opacity-40"
                    }`}
                  >
                    {ratingsHidden ? (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200 text-sm font-bold text-slate-400">
                        ?
                      </span>
                    ) : (
                      <RatingBadge value={stats.overall} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-slate-800">{p.name}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {positions.map((pos) => (
                          <span
                            key={pos}
                            className="rounded-lg bg-slate-100/80 px-1.5 py-0.5 text-[9px] font-bold text-slate-500"
                          >
                            {pos}
                          </span>
                        ))}
                      </div>
                    </div>
                    {!ratingsHidden && (
                      <div className="shrink-0 text-right text-[10px] leading-relaxed text-slate-400">
                        <div>{fmtMv(p.mv)}</div>
                        <div>ATT {stats.attack}</div>
                        <div>DEF {stats.defense}</div>
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
