"use client";

import type { DraftedPlayer } from "@/lib/types";
import type { OnlinePlayer } from "@/lib/onlineCareer";
import { divisionLabel } from "@/lib/career";
import { FORMATIONS, type FormationSlot } from "@/lib/formations";
import { canPlayerPlay } from "@/lib/positions";
import { POS_BAND, type Band } from "@/lib/positions";
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

function MiniPitchMarkings() {
  const line = { stroke: "rgba(255,255,255,0.45)", strokeWidth: 0.6, fill: "none" } as const;
  return (
    <svg viewBox="0 0 75 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
      <rect x="2.5" y="2" width="70" height="96" rx="1.2" {...line} />
      <line x1="2.5" y1="50" x2="72.5" y2="50" {...line} />
      <circle cx="37.5" cy="50" r="9" {...line} />
      <circle cx="37.5" cy="50" r="0.7" fill="rgba(255,255,255,0.5)" />
      <rect x="18" y="2" width="39" height="15" {...line} />
      <rect x="28.5" y="2" width="18" height="6" {...line} />
      <rect x="18" y="83" width="39" height="15" {...line} />
      <rect x="28.5" y="92" width="18" height="6" {...line} />
    </svg>
  );
}

function MiniToken({ slot, player }: { slot: FormationSlot; player?: DraftedPlayer }) {
  return (
    <div
      style={{ left: `${slot.x}%`, top: `${100 - slot.y}%` }}
      className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
    >
      {player ? (
        <>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black tabular-nums shadow-md ring-[1.5px] ring-white/80 ${ratingColor(player.overall)}`}
          >
            {player.overall}
          </div>
          <div className="mt-0.5 max-w-[52px] truncate rounded-full bg-white/90 px-1.5 py-[1px] text-[8px] font-bold leading-tight text-slate-800 shadow-sm">
            {player.name.split(" ").slice(-1)[0]}
          </div>
        </>
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-white/40 bg-white/10 text-[9px] font-bold text-white/60">
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
    const band = posMap[p.pos] ?? "MID";
    grouped.get(band)!.push(p);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3" onClick={onClose}>
      <div
        className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <div className="text-lg font-black text-slate-800">{player.team_name || player.username}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-bold text-slate-400">{divisionLabel(player.current_division)}</span>
              <span className="text-xs font-bold text-emerald-600">{rating} OVR</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{formation.label}</span>
              {player.championships > 0 && (
                <span className="text-xs font-bold text-amber-600">{player.championships}x 🏆</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition text-sm">
            ✕
          </button>
        </div>

        {/* Content: pitch + list */}
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Mini pitch */}
          <div className="p-4 flex items-center justify-center">
            <div className="pitch relative aspect-[3/4] w-full max-w-[240px] overflow-hidden rounded-xl ring-1 ring-black/10">
              <MiniPitchMarkings />
              {formation.slots.map((slot) => (
                <MiniToken key={slot.id} slot={slot} player={placed.get(slot.id)} />
              ))}
            </div>
          </div>

          {/* Player list grouped by line */}
          <div className="border-t sm:border-t-0 sm:border-l border-slate-100 p-4 flex flex-col gap-3">
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
