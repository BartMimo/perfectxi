"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import type { DraftedPlayer } from "@/lib/types";
import type { OnlinePlayer } from "@/lib/onlineCareer";
import { divisionLabel } from "@/lib/career";
import { FORMATIONS, type FormationSlot } from "@/lib/formations";
import { canPlayerPlay } from "@/lib/positions";
import type { Band } from "@/lib/positions";
import { ratingColor } from "./ui";

function avgRating(squad: DraftedPlayer[]): number {
  if (squad.length === 0) return 0;
  return Math.round((squad.reduce((s, p) => s + p.overall, 0) / squad.length) * 10) / 10;
}

function fitSquadToFormation(squad: DraftedPlayer[]): { formation: typeof FORMATIONS[0]; placed: Map<string, DraftedPlayer> } {
  let bestFormation = FORMATIONS[0];
  let bestPlaced = new Map<string, DraftedPlayer>();
  let bestCount = 0;
  for (const fm of FORMATIONS) {
    const placed = new Map<string, DraftedPlayer>();
    const used = new Set<string>();
    for (const slot of fm.slots) {
      for (const p of squad) {
        if (used.has(p.name)) continue;
        if (canPlayerPlay(p, slot.pos)) {
          placed.set(slot.id, p);
          used.add(p.name);
          break;
        }
      }
    }
    if (placed.size > bestCount) {
      bestCount = placed.size;
      bestFormation = fm;
      bestPlaced = placed;
    }
    if (bestCount === squad.length) break;
  }
  return { formation: bestFormation, placed: bestPlaced };
}

function PitchMarkings() {
  const line = { stroke: "rgba(255,255,255,0.55)", strokeWidth: 0.5, fill: "none" } as const;
  return (
    <svg viewBox="0 0 75 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
      <rect x="2.5" y="2" width="70" height="96" rx="1.2" {...line} />
      <line x1="2.5" y1="50" x2="72.5" y2="50" {...line} />
      <circle cx="37.5" cy="50" r="9" {...line} />
      <circle cx="37.5" cy="50" r="0.7" fill="rgba(255,255,255,0.7)" />
      <rect x="18" y="2" width="39" height="15" {...line} />
      <rect x="28.5" y="2" width="18" height="6" {...line} />
      <circle cx="37.5" cy="11" r="0.7" fill="rgba(255,255,255,0.7)" />
      <path d="M30.9 17 A9 9 0 0 0 44.1 17" {...line} />
      <rect x="18" y="83" width="39" height="15" {...line} />
      <rect x="28.5" y="92" width="18" height="6" {...line} />
      <circle cx="37.5" cy="89" r="0.7" fill="rgba(255,255,255,0.7)" />
      <path d="M30.9 83 A9 9 0 0 1 44.1 83" {...line} />
    </svg>
  );
}

function PitchToken({ slot, player }: { slot: FormationSlot; player?: DraftedPlayer }) {
  return (
    <div
      style={{ left: `${slot.x}%`, top: `${100 - slot.y}%` }}
      className="absolute z-10 flex w-[64px] -translate-x-1/2 -translate-y-1/2 flex-col items-center"
    >
      {player ? (
        <>
          <div className={`flex h-11 w-11 items-center justify-center rounded-full text-base font-black tabular-nums shadow-[0_3px_8px_rgba(0,0,0,0.35)] ring-2 ring-white/90 ${ratingColor(player.overall)}`}>
            {player.overall}
          </div>
          <div className="mt-1 max-w-[64px] truncate rounded-full bg-white/95 px-2 py-[2px] text-[10px] font-bold leading-tight text-slate-800 shadow-sm">
            {player.name.split(" ").slice(-1)[0]}
          </div>
          <div className="max-w-[64px] truncate text-[8px] font-medium text-white/90">
            {player.fromClub}
          </div>
        </>
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-white/55 bg-white/10 text-[11px] font-bold text-white/85">
          {slot.pos}
        </div>
      )}
    </div>
  );
}

const BAND_ORDER: Band[] = ["GK", "DEF", "MID", "ATT"];
const BAND_LABELS: Record<Band, string> = { GK: "Keeper", DEF: "Verdediging", MID: "Middenveld", ATT: "Aanval" };
const BAND_COLORS: Record<Band, string> = {
  GK: "text-amber-600",
  DEF: "text-sky-600",
  MID: "text-emerald-600",
  ATT: "text-rose-600",
};

function SquadViewContent({ player, onClose }: { player: OnlinePlayer; onClose: () => void }) {
  const rating = avgRating(player.squad);
  const { formation, placed } = fitSquadToFormation(player.squad);

  const grouped = new Map<Band, DraftedPlayer[]>();
  for (const band of BAND_ORDER) grouped.set(band, []);
  for (const p of player.squad) {
    const posMap: Record<string, Band> = { Goalkeeper: "GK", Defender: "DEF", Midfield: "MID", Attack: "ATT", Missing: "MID" };
    grouped.get(posMap[p.pos] ?? "MID")!.push(p);
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999 }}
      className="bg-gradient-to-br from-slate-50 to-slate-100"
    >
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl">
        <div className="min-w-0">
          <div className="text-lg font-black text-slate-800 truncate">{player.team_name || player.username}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-bold text-slate-400">{divisionLabel(player.current_division)}</span>
            <span className="text-xs font-bold text-emerald-600">{rating} OVR</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">{formation.label}</span>
            {player.championships > 0 && (
              <span className="text-xs font-bold text-amber-600">{player.championships}x 🏆</span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition text-sm font-bold shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div className="overflow-y-auto" style={{ height: "calc(100% - 60px)" }}>
        {/* --- Desktop: side by side --- */}
        <div className="hidden lg:flex h-full">
          {/* Pitch */}
          <div className="flex-1 flex items-center justify-center p-8 min-h-0">
            <div className="pitch relative aspect-[3/4] max-h-full w-auto overflow-hidden rounded-2xl ring-1 ring-black/10 shadow-lg"
                 style={{ height: "100%" }}>
              <PitchMarkings />
              {formation.slots.map((slot) => (
                <PitchToken key={slot.id} slot={slot} player={placed.get(slot.id)} />
              ))}
            </div>
          </div>
          {/* List */}
          <div className="w-[380px] shrink-0 overflow-y-auto border-l border-slate-200/60 bg-white/60 p-6">
            <PlayerList grouped={grouped} />
          </div>
        </div>

        {/* --- Mobile: pitch then list stacked, scrollable --- */}
        <div className="lg:hidden">
          {/* Pitch — near full width */}
          <div className="px-4 pt-4 pb-2">
            <div className="pitch relative aspect-[3/4] w-full overflow-hidden rounded-2xl ring-1 ring-black/10 shadow-lg">
              <PitchMarkings />
              {formation.slots.map((slot) => (
                <PitchToken key={slot.id} slot={slot} player={placed.get(slot.id)} />
              ))}
            </div>
          </div>
          {/* List */}
          <div className="px-4 py-4">
            <PlayerList grouped={grouped} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerList({ grouped }: { grouped: Map<Band, DraftedPlayer[]> }) {
  return (
    <div className="flex flex-col gap-4">
      {BAND_ORDER.map((band) => {
        const players = grouped.get(band)!;
        if (players.length === 0) return null;
        return (
          <div key={band}>
            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${BAND_COLORS[band]}`}>
              {BAND_LABELS[band]}
            </div>
            <div className="flex flex-col gap-1.5">
              {players
                .sort((a, b) => b.overall - a.overall)
                .map((p) => (
                  <div key={p.name} className="flex items-center gap-3 rounded-xl bg-white/80 border border-slate-100 px-3.5 py-2.5 shadow-sm">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black tabular-nums shadow-sm ${ratingColor(p.overall)}`}>
                      {p.overall}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-800 truncate">{p.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{p.fromClub} · {p.sub}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SquadViewModal({ player, onClose }: { player: OnlinePlayer; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (player.squad.length === 0) return null;
  if (!mounted) return null;

  return createPortal(
    <SquadViewContent player={player} onClose={onClose} />,
    document.body,
  );
}
