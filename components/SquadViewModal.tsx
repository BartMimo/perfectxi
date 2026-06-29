"use client";

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
  const line = { stroke: "rgba(255,255,255,0.5)", strokeWidth: 0.5, fill: "none" } as const;
  return (
    <svg viewBox="0 0 75 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
      <rect x="2.5" y="2" width="70" height="96" rx="1.2" {...line} />
      <line x1="2.5" y1="50" x2="72.5" y2="50" {...line} />
      <circle cx="37.5" cy="50" r="9" {...line} />
      <circle cx="37.5" cy="50" r="0.7" fill="rgba(255,255,255,0.6)" />
      <rect x="18" y="2" width="39" height="15" {...line} />
      <rect x="28.5" y="2" width="18" height="6" {...line} />
      <circle cx="37.5" cy="11" r="0.7" fill="rgba(255,255,255,0.6)" />
      <path d="M30.9 17 A9 9 0 0 0 44.1 17" {...line} />
      <rect x="18" y="83" width="39" height="15" {...line} />
      <rect x="28.5" y="92" width="18" height="6" {...line} />
      <circle cx="37.5" cy="89" r="0.7" fill="rgba(255,255,255,0.6)" />
      <path d="M30.9 83 A9 9 0 0 1 44.1 83" {...line} />
    </svg>
  );
}

function PitchToken({ slot, player }: { slot: FormationSlot; player?: DraftedPlayer }) {
  return (
    <div
      style={{ left: `${slot.x}%`, top: `${100 - slot.y}%` }}
      className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
    >
      {player ? (
        <>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black tabular-nums shadow-[0_2px_6px_rgba(0,0,0,0.3)] ring-2 ring-white/90 ${ratingColor(player.overall)}`}>
            {player.overall}
          </div>
          <div className="mt-0.5 max-w-[60px] truncate rounded-full bg-white/95 px-2 py-[1px] text-[9px] font-bold leading-tight text-slate-800 shadow-sm">
            {player.name.split(" ").slice(-1)[0]}
          </div>
        </>
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-white/50 bg-white/10 text-[10px] font-bold text-white/70">
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

export default function SquadViewModal({ player, onClose }: { player: OnlinePlayer; onClose: () => void }) {
  if (player.squad.length === 0) return null;

  const rating = avgRating(player.squad);
  const { formation, placed } = fitSquadToFormation(player.squad);

  const grouped = new Map<Band, DraftedPlayer[]>();
  for (const band of BAND_ORDER) grouped.set(band, []);
  for (const p of player.squad) {
    const posMap: Record<string, Band> = { Goalkeeper: "GK", Defender: "DEF", Midfield: "MID", Attack: "ATT", Missing: "MID" };
    grouped.get(posMap[p.pos] ?? "MID")!.push(p);
  }

  return (
    <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 shrink-0">
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
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition text-sm font-bold shrink-0">
          ✕
        </button>
      </div>

      {/* Main content: pitch + list side by side */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Pitch */}
        <div className="flex items-center justify-center p-6 lg:flex-1">
          <div className="pitch relative aspect-[3/4] h-full max-h-[calc(100vh-120px)] w-auto overflow-hidden rounded-2xl ring-1 ring-black/10">
            <PitchMarkings />
            {formation.slots.map((slot) => (
              <PitchToken key={slot.id} slot={slot} player={placed.get(slot.id)} />
            ))}
          </div>
        </div>

        {/* Player list */}
        <div className="lg:w-[340px] shrink-0 overflow-y-auto border-t lg:border-t-0 lg:border-l border-slate-200/60 p-5">
          <div className="flex flex-col gap-3">
            {BAND_ORDER.map((band) => {
              const players = grouped.get(band)!;
              if (players.length === 0) return null;
              return (
                <div key={band}>
                  <div className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${BAND_COLORS[band]}`}>
                    {BAND_LABELS[band]}
                  </div>
                  <div className="flex flex-col gap-1">
                    {players
                      .sort((a, b) => b.overall - a.overall)
                      .map((p) => (
                        <div key={p.name} className="flex items-center gap-2.5 rounded-xl bg-slate-50/80 px-3 py-2">
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black tabular-nums ${ratingColor(p.overall)}`}>
                            {p.overall}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-slate-800 truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{p.fromClub} · {p.sub}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
