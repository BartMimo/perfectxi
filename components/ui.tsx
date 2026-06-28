import type { RawPos } from "@/lib/types";
import type { Band } from "@/lib/positions";

/** Kleur op basis van overall rating. */
export function ratingColor(r: number): string {
  if (r >= 88) return "bg-emerald-500 text-emerald-950";
  if (r >= 82) return "bg-green-500 text-green-950";
  if (r >= 75) return "bg-lime-500 text-lime-950";
  if (r >= 68) return "bg-yellow-500 text-yellow-950";
  return "bg-orange-500 text-orange-950";
}

export function RatingBadge({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold tabular-nums shadow-sm ${ratingColor(
        value,
      )} ${className}`}
    >
      {value}
    </span>
  );
}

export const bandColor: Record<Band, string> = {
  GK: "text-amber-300 border-amber-400/40 bg-amber-400/10",
  DEF: "text-sky-300 border-sky-400/40 bg-sky-400/10",
  MID: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10",
  ATT: "text-rose-300 border-rose-400/40 bg-rose-400/10",
};

export const posAbbrev: Record<RawPos, string> = {
  Goalkeeper: "GK",
  Defender: "DEF",
  Midfield: "MID",
  Attack: "ATT",
  Missing: "—",
};

export function fmtMv(mv: number): string {
  if (mv >= 1_000_000) return `€${(mv / 1_000_000).toFixed(mv >= 10_000_000 ? 0 : 1)}M`;
  if (mv >= 1000) return `€${Math.round(mv / 1000)}K`;
  return `€${mv}`;
}

/** "2017-2018" → "17/18" */
export function shortSeason(s: string): string {
  return `${s.slice(2, 4)}/${s.slice(7, 9)}`;
}
