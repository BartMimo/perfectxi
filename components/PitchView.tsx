"use client";

import { useMemo } from "react";
import { filledCount, useGame, validTargets, placementTargets, type Slot } from "@/lib/store";
import { POS_BAND, type Band } from "@/lib/positions";
import { POS_LABEL } from "@/lib/positions";
import { ratingColor, shortSeason } from "./ui";

/** Crispe veldlijnen als SVG (coördinaten 75×100, matcht de 3:4 verhouding). */
function PitchMarkings() {
  const line = { stroke: "rgba(255,255,255,0.55)", strokeWidth: 0.5, fill: "none" } as const;
  return (
    <svg
      viewBox="0 0 75 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {/* buitenlijn */}
      <rect x="2.5" y="2" width="70" height="96" rx="1.2" {...line} />
      {/* middenlijn + cirkel */}
      <line x1="2.5" y1="50" x2="72.5" y2="50" {...line} />
      <circle cx="37.5" cy="50" r="9" {...line} />
      <circle cx="37.5" cy="50" r="0.7" fill="rgba(255,255,255,0.7)" />
      {/* boven: strafschopgebied */}
      <rect x="18" y="2" width="39" height="15" {...line} />
      <rect x="28.5" y="2" width="18" height="6" {...line} />
      <circle cx="37.5" cy="11" r="0.7" fill="rgba(255,255,255,0.7)" />
      <path d="M30.9 17 A9 9 0 0 0 44.1 17" {...line} />
      <rect x="32.5" y="0.6" width="10" height="1.4" {...line} />
      {/* onder: strafschopgebied */}
      <rect x="18" y="83" width="39" height="15" {...line} />
      <rect x="28.5" y="92" width="18" height="6" {...line} />
      <circle cx="37.5" cy="89" r="0.7" fill="rgba(255,255,255,0.7)" />
      <path d="M30.9 83 A9 9 0 0 1 44.1 83" {...line} />
      <rect x="32.5" y="98" width="10" height="1.4" {...line} />
      {/* hoekbogen */}
      <path d="M2.5 4 A1.6 1.6 0 0 1 4.1 2.4" {...line} />
      <path d="M72.5 4 A1.6 1.6 0 0 0 70.9 2.4" {...line} />
      <path d="M2.5 96 A1.6 1.6 0 0 0 4.1 97.6" {...line} />
      <path d="M72.5 96 A1.6 1.6 0 0 1 70.9 97.6" {...line} />
    </svg>
  );
}

function Token({
  slot,
  selected,
  isTarget,
  hideRating,
  onClick,
}: {
  slot: Slot;
  selected: boolean;
  isTarget: boolean;
  hideRating: boolean;
  onClick: () => void;
}) {
  const p = slot.player;

  return (
    <button
      onClick={onClick}
      title={POS_LABEL[slot.pos]}
      style={{ left: `${slot.x}%`, top: `${100 - slot.y}%` }}
      className="absolute z-10 flex w-[64px] -translate-x-1/2 -translate-y-1/2 flex-col items-center outline-none"
    >
      {p ? (
        <>
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full text-base font-black tabular-nums shadow-[0_3px_8px_rgba(0,0,0,0.35)] ring-2 transition ${
              hideRating ? "bg-slate-700 text-white" : ratingColor(p.overall)
            } ${
              selected
                ? "scale-110 ring-emerald-300"
                : isTarget
                  ? "ring-amber-300"
                  : "ring-white/90"
            }`}
          >
            {hideRating ? "?" : p.overall}
          </div>
          <div className="mt-1 max-w-[64px] truncate rounded-full bg-white/95 px-2 py-[2px] text-[10px] font-bold leading-tight text-slate-800 shadow-sm">
            {p.name.split(" ").slice(-1)[0]}
          </div>
          <div className="token-shadow max-w-[64px] truncate text-[8px] font-medium text-white/90">
            {p.fromClub} {shortSeason(p.fromSeason)}
          </div>
        </>
      ) : (
        <div
          className={`flex h-11 w-11 flex-col items-center justify-center rounded-full border-2 border-dashed text-[11px] font-bold backdrop-blur-[1px] transition ${
            isTarget
              ? "scale-110 border-amber-300 bg-amber-300/30 text-white"
              : "border-white/55 bg-white/10 text-white/85"
          }`}
        >
          {slot.pos}
        </div>
      )}
    </button>
  );
}

export default function PitchView() {
  const slots = useGame((s) => s.slots);
  const selectedSlotId = useGame((s) => s.selectedSlotId);
  const pendingPlayer = useGame((s) => s.pendingPlayer);
  const onSlotClick = useGame((s) => s.onSlotClick);
  const cancelPick = useGame((s) => s.cancelPick);
  const difficulty = useGame((s) => s.difficulty);
  const phase = useGame((s) => s.phase);

  const hideRating = difficulty === "hard" && phase !== "result";
  const targets = pendingPlayer
    ? placementTargets(slots, pendingPlayer)
    : validTargets(slots, selectedSlotId);

  return (
    <div className="relative w-full">
      <div className="pitch relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-2xl ring-1 ring-black/10 lg:h-[calc(100dvh_-_150px)] lg:max-h-[660px] lg:w-auto">
        <PitchMarkings />
        {slots.map((slot) => (
          <Token
            key={slot.id}
            slot={slot}
            selected={selectedSlotId === slot.id}
            isTarget={targets.has(slot.id)}
            hideRating={hideRating}
            onClick={() => onSlotClick(slot.id)}
          />
        ))}
      </div>

      {pendingPlayer && (
        <div className="mt-2 text-center text-[11px] font-semibold text-amber-600">
          Kies een gemarkeerde positie voor {pendingPlayer.name} ·{" "}
          <button onClick={cancelPick} className="underline">
            annuleer
          </button>
        </div>
      )}
      {!pendingPlayer && selectedSlotId && (
        <div className="mt-2 text-center text-[11px] font-semibold text-amber-600">
          Kies een gemarkeerde positie om te verplaatsen of te wisselen ·{" "}
          <button onClick={() => onSlotClick(selectedSlotId)} className="underline">
            annuleer
          </button>
        </div>
      )}

      <LineRatings slots={slots} hideRating={hideRating} />
    </div>
  );
}

function LineRatings({ slots, hideRating }: { slots: Slot[]; hideRating: boolean }) {
  const opponents = useGame((s) => s.opponents);

  const stats = useMemo(() => {
    const bands: Band[] = ["GK", "DEF", "MID", "ATT"];
    const labels: Record<Band, string> = { GK: "GK", DEF: "DEF", MID: "MID", ATT: "ATT" };
    const result: { band: Band; label: string; avg: number; count: number }[] = [];
    for (const band of bands) {
      const players = slots.filter((s) => s.player && POS_BAND[s.pos] === band).map((s) => s.player!);
      if (players.length === 0) {
        result.push({ band, label: labels[band], avg: 0, count: 0 });
      } else {
        const avg = Math.round(players.reduce((s, p) => s + p.overall, 0) / players.length);
        result.push({ band, label: labels[band], avg, count: players.length });
      }
    }
    return result;
  }, [slots]);

  const prediction = useMemo(() => {
    const filled = slots.filter((s) => s.player);
    if (filled.length < 11 || opponents.length === 0) return null;
    const teamOvr = filled.reduce((s, sl) => s + sl.player!.overall, 0) / filled.length;
    const sorted = [...opponents].sort((a, b) => b.teamRating - a.teamRating);
    let pos = 1;
    for (const opp of sorted) {
      if (opp.teamRating > teamOvr) pos++;
    }
    return pos;
  }, [slots, opponents]);

  const hasFilled = slots.some((s) => s.player);
  if (!hasFilled) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
      {stats.map((s) =>
        s.count > 0 ? (
          <div key={s.band} className="flex items-center gap-1.5 rounded-full bg-white/70 border border-slate-200/60 px-3 py-1.5 backdrop-blur">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</span>
            <span className={`text-xs font-black tabular-nums ${hideRating ? "text-slate-400" : "text-slate-700"}`}>
              {hideRating ? "?" : s.avg}
            </span>
          </div>
        ) : null,
      )}
      {prediction && !hideRating && (
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/60 px-3 py-1.5 backdrop-blur">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Verwacht</span>
          <span className="text-xs font-black tabular-nums text-emerald-700">
            ~{prediction}e
          </span>
        </div>
      )}
    </div>
  );
}
