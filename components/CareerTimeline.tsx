"use client";

import type { CareerSeason } from "@/lib/career";
import { divisionLabel } from "@/lib/career";
import { useT } from "@/lib/i18n/core";

interface Props {
  history: CareerSeason[];
  currentDivision: number;
  currentSeason: number;
}

export default function CareerTimeline({ history, currentDivision, currentSeason }: Props) {
  const t = useT();
  if (history.length === 0) return null;

  const minDiv = Math.min(...history.map((h) => h.division), currentDivision);
  const maxDiv = Math.max(...history.map((h) => h.division), currentDivision);
  const divRange = maxDiv - minDiv || 1;

  const chartH = 160;
  const padTop = 24;
  const padBot = 30;
  const innerH = chartH - padTop - padBot;
  const padLeft = 44;
  const padRight = 16;

  const points = history.map((h, i) => ({
    season: h.season,
    division: h.division,
    position: h.position,
    points: h.points,
    promoted: h.position <= 2 && h.division > 1,
    relegated: h.position >= 18 && h.division < 10,
    champion: h.position === 1,
  }));

  const totalSlots = points.length + 1;

  function x(i: number, totalW: number) {
    const inner = totalW - padLeft - padRight;
    return padLeft + (i / (totalSlots - 1)) * inner;
  }
  function y(div: number) {
    return padTop + ((div - minDiv) / divRange) * innerH;
  }

  const viewW = Math.max(320, totalSlots * 56 + padLeft + padRight);

  const pathPoints = points.map((p, i) => `${x(i, viewW)},${y(p.division)}`);
  pathPoints.push(`${x(points.length, viewW)},${y(currentDivision)}`);
  const pathD = "M" + pathPoints.join(" L");

  const divLabels: number[] = [];
  for (let d = minDiv; d <= maxDiv; d++) divLabels.push(d);

  return (
    <div className="card p-4 overflow-hidden">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
        {t("career.overview")}
      </div>
      <div className="overflow-x-auto -mx-4 px-4">
        <svg viewBox={`0 0 ${viewW} ${chartH}`} width={viewW} height={chartH} className="min-w-full">
          {/* Grid lines + div labels */}
          {divLabels.map((d) => (
            <g key={d}>
              <line
                x1={padLeft - 4} y1={y(d)} x2={viewW - padRight} y2={y(d)}
                stroke="#e2e8f0" strokeWidth="1" strokeDasharray={d === minDiv || d === maxDiv ? "" : "3,3"}
              />
              <text x={padLeft - 8} y={y(d) + 3.5} textAnchor="end" fontSize="9" fontWeight="700" fill="#94a3b8">
                D{d}
              </text>
            </g>
          ))}

          {/* Line */}
          <path d={pathD} fill="none" stroke="url(#careerGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          <defs>
            <linearGradient id="careerGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>

          {/* Data points */}
          {points.map((p, i) => {
            const cx = x(i, viewW);
            const cy = y(p.division);
            return (
              <g key={i}>
                {/* Dot */}
                <circle cx={cx} cy={cy} r={p.champion ? 7 : 5}
                  fill={p.champion ? "#f59e0b" : p.promoted ? "#10b981" : p.relegated ? "#ef4444" : "#6366f1"}
                  stroke="white" strokeWidth="2"
                />
                {p.champion && (
                  <text x={cx} y={cy - 11} textAnchor="middle" fontSize="11" fill="#f59e0b" fontWeight="900">★</text>
                )}
                {/* Season label */}
                <text x={cx} y={chartH - 6} textAnchor="middle" fontSize="8" fontWeight="700" fill="#94a3b8">
                  S{p.season}
                </text>
                {/* Position */}
                <text x={cx} y={cy + (p.champion ? 17 : 15)} textAnchor="middle" fontSize="8" fontWeight="700"
                  fill={p.position <= 2 ? "#10b981" : p.position >= 18 ? "#ef4444" : "#64748b"}>
                  {t("career.positionPoints", { pos: p.position, pts: p.points })}
                </text>
              </g>
            );
          })}

          {/* Current season dot */}
          <circle cx={x(points.length, viewW)} cy={y(currentDivision)} r={5}
            fill="white" stroke="#6366f1" strokeWidth="2" strokeDasharray="3,2"
          />
          <text x={x(points.length, viewW)} y={chartH - 6} textAnchor="middle" fontSize="8" fontWeight="700" fill="#6366f1">
            S{currentSeason}
          </text>
          <text x={x(points.length, viewW)} y={y(currentDivision) + 15} textAnchor="middle" fontSize="8" fontWeight="700" fill="#6366f1">
            {t("career.now")}
          </text>
        </svg>
      </div>
    </div>
  );
}
