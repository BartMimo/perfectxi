"use client";

import type { CareerSeason } from "@/lib/career";

export interface PlayerCareerSeries {
  id: string;
  name: string;
  isMe: boolean;
  history: CareerSeason[];
  currentDivision: number;
}

interface Props {
  players: PlayerCareerSeries[];
  currentSeason: number;
}

const PALETTE = ["#f97316", "#0ea5e9", "#a855f7", "#ec4899", "#14b8a6", "#84cc16", "#f43f5e", "#eab308"];
const ME_COLOR = "#6366f1";

interface ColoredSeries extends PlayerCareerSeries {
  color: string;
}

const CHART_H = 170;
const PAD_TOP = 22;
const PAD_BOT = 26;
const PAD_LEFT = 30;
const PAD_RIGHT = 12;
const INNER_H = CHART_H - PAD_TOP - PAD_BOT;

export default function MultiCareerTimeline({ players, currentSeason }: Props) {
  const withData = players.filter((p) => p.history.length > 0);
  if (withData.length === 0) return null;

  const seasonSet = new Set<number>();
  withData.forEach((p) => p.history.forEach((h) => seasonSet.add(h.season)));
  seasonSet.add(currentSeason);
  const seasons = [...seasonSet].sort((a, b) => a - b);

  let colorIdx = 0;
  const colored: ColoredSeries[] = players.map((p) => ({
    ...p,
    color: p.isMe ? ME_COLOR : PALETTE[colorIdx++ % PALETTE.length],
  }));
  const drawOrder = [...colored].sort((a, b) => Number(a.isMe) - Number(b.isMe));

  const hasRatingData = withData.some((p) => p.history.some((h) => h.avgRating != null));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <DivisionChart players={drawOrder} seasons={seasons} currentSeason={currentSeason} />
      {hasRatingData && <RatingChart players={drawOrder} seasons={seasons} />}
      <Legend players={colored} className="lg:col-span-2" />
    </div>
  );
}

function xScale(seasons: number[], viewW: number) {
  const innerW = viewW - PAD_LEFT - PAD_RIGHT;
  return (season: number) => {
    const idx = seasons.indexOf(season);
    return PAD_LEFT + (seasons.length <= 1 ? innerW / 2 : (idx / (seasons.length - 1)) * innerW);
  };
}

function DivisionChart({ players, seasons, currentSeason }: { players: ColoredSeries[]; seasons: number[]; currentSeason: number }) {
  const divisions = players.flatMap((p) => [...p.history.map((h) => h.division), p.currentDivision]);
  const minDiv = Math.min(...divisions);
  const maxDiv = Math.max(...divisions);
  const range = maxDiv - minDiv || 1;
  const y = (div: number) => PAD_TOP + ((div - minDiv) / range) * INNER_H;

  const viewW = Math.max(280, seasons.length * 46 + PAD_LEFT + PAD_RIGHT);
  const x = xScale(seasons, viewW);

  const divLabels: number[] = [];
  for (let d = minDiv; d <= maxDiv; d++) divLabels.push(d);

  return (
    <div className="card p-4 overflow-hidden">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Divisie per seizoen</div>
      <div className="overflow-x-auto -mx-4 px-4">
        <svg viewBox={`0 0 ${viewW} ${CHART_H}`} width={viewW} height={CHART_H} className="min-w-full">
          {divLabels.map((d) => (
            <g key={d}>
              <line x1={PAD_LEFT - 4} y1={y(d)} x2={viewW - PAD_RIGHT} y2={y(d)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray={d === minDiv || d === maxDiv ? "" : "3,3"} />
              <text x={PAD_LEFT - 8} y={y(d) + 3.5} textAnchor="end" fontSize="8" fontWeight="700" fill="#94a3b8">D{d}</text>
            </g>
          ))}

          {seasons.map((s) => (
            <text key={s} x={x(s)} y={CHART_H - 6} textAnchor="middle" fontSize="8" fontWeight="700" fill={s === currentSeason ? ME_COLOR : "#94a3b8"}>
              {s === currentSeason ? "nu" : `S${s}`}
            </text>
          ))}

          {players.map((p) => {
            const pts = p.history.map((h) => ({ season: h.season, division: h.division }));
            pts.push({ season: currentSeason, division: p.currentDivision });
            if (pts.length === 0) return null;
            const pathD = "M" + pts.map((pt) => `${x(pt.season)},${y(pt.division)}`).join(" L");
            return (
              <g key={p.id}>
                <path d={pathD} fill="none" stroke={p.color} strokeWidth={p.isMe ? 2.5 : 1.5} strokeLinecap="round" strokeLinejoin="round" opacity={p.isMe ? 1 : 0.6} />
                {pts.map((pt, i) => {
                  const isCurrent = pt.season === currentSeason;
                  return (
                    <circle
                      key={i}
                      cx={x(pt.season)}
                      cy={y(pt.division)}
                      r={p.isMe ? 4.5 : 3}
                      fill={isCurrent ? "white" : p.color}
                      stroke={p.color}
                      strokeWidth={isCurrent ? 2 : 1.5}
                      strokeDasharray={isCurrent ? "2,1.5" : ""}
                      opacity={p.isMe ? 1 : 0.7}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function RatingChart({ players, seasons }: { players: ColoredSeries[]; seasons: number[] }) {
  const ratings = players.flatMap((p) => p.history.map((h) => h.avgRating).filter((r): r is number => r != null));
  if (ratings.length === 0) return null;
  const minR = Math.min(...ratings) - 1;
  const maxR = Math.max(...ratings) + 1;
  const range = maxR - minR || 1;
  const y = (r: number) => PAD_TOP + INNER_H - ((r - minR) / range) * INNER_H;

  const viewW = Math.max(280, seasons.length * 46 + PAD_LEFT + PAD_RIGHT);
  const x = xScale(seasons, viewW);

  const rLabels: number[] = [];
  const step = Math.max(1, Math.round(range / 3));
  for (let r = Math.ceil(minR); r <= maxR; r += step) rLabels.push(r);

  return (
    <div className="card p-4 overflow-hidden">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Team gemiddelde per seizoen</div>
      <div className="overflow-x-auto -mx-4 px-4">
        <svg viewBox={`0 0 ${viewW} ${CHART_H}`} width={viewW} height={CHART_H} className="min-w-full">
          {rLabels.map((r) => (
            <g key={r}>
              <line x1={PAD_LEFT - 4} y1={y(r)} x2={viewW - PAD_RIGHT} y2={y(r)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
              <text x={PAD_LEFT - 8} y={y(r) + 3.5} textAnchor="end" fontSize="8" fontWeight="700" fill="#94a3b8">{r}</text>
            </g>
          ))}

          {seasons.map((s) => {
            const anyData = players.some((p) => p.history.some((h) => h.season === s && h.avgRating != null));
            if (!anyData) return null;
            return (
              <text key={s} x={x(s)} y={CHART_H - 6} textAnchor="middle" fontSize="8" fontWeight="700" fill="#94a3b8">S{s}</text>
            );
          })}

          {players.map((p) => {
            const pts = p.history
              .filter((h) => h.avgRating != null)
              .map((h) => ({ season: h.season, rating: h.avgRating as number }));
            if (pts.length === 0) return null;
            const pathD = pts.length > 1 ? "M" + pts.map((pt) => `${x(pt.season)},${y(pt.rating)}`).join(" L") : "";
            return (
              <g key={p.id}>
                {pathD && <path d={pathD} fill="none" stroke={p.color} strokeWidth={p.isMe ? 2.5 : 1.5} strokeLinecap="round" strokeLinejoin="round" opacity={p.isMe ? 1 : 0.6} />}
                {pts.map((pt, i) => (
                  <circle key={i} cx={x(pt.season)} cy={y(pt.rating)} r={p.isMe ? 4.5 : 3} fill={p.color} stroke="white" strokeWidth="1.5" opacity={p.isMe ? 1 : 0.7} />
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function Legend({ players, className = "" }: { players: ColoredSeries[]; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-x-3 gap-y-1.5 px-1 ${className}`}>
      {players.map((p) => (
        <div key={p.id} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className={`text-[10px] font-bold truncate max-w-[120px] ${p.isMe ? "text-indigo-700" : "text-slate-500"}`}>
            {p.name}{p.isMe ? " (jij)" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
