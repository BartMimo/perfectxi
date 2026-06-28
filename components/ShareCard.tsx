"use client";

import { forwardRef } from "react";
import { useGame } from "@/lib/store";
import { getFormation } from "@/lib/formations";
import { LEAGUES } from "@/lib/leagues";
import { QUALIFICATION_LABELS } from "@/lib/sim";
import { ratingColor, shortSeason } from "./ui";

/** Veldlijnen voor de kaart (zelfde coördinaten 75×100). */
function CardPitchLines() {
  const l = { stroke: "rgba(255,255,255,0.5)", strokeWidth: 0.45, fill: "none" } as const;
  return (
    <svg
      viewBox="0 0 75 100"
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <rect x="2.5" y="2" width="70" height="96" rx="1.2" {...l} />
      <line x1="2.5" y1="50" x2="72.5" y2="50" {...l} />
      <circle cx="37.5" cy="50" r="9" {...l} />
      <circle cx="37.5" cy="50" r="0.7" fill="rgba(255,255,255,0.6)" />
      <rect x="18" y="2" width="39" height="15" {...l} />
      <rect x="28.5" y="2" width="18" height="6" {...l} />
      <rect x="18" y="83" width="39" height="15" {...l} />
      <rect x="28.5" y="92" width="18" height="6" {...l} />
    </svg>
  );
}

/**
 * Vaste 1080×1350 resultkaart, gerenderd buiten beeld en geëxporteerd naar PNG
 * voor delen op socials.
 */
const ShareCard = forwardRef<HTMLDivElement>(function ShareCard(_props, ref) {
  const result = useGame((s) => s.result);
  const slots = useGame((s) => s.slots);
  const leagueCode = useGame((s) => s.leagueCode);
  const formationKey = useGame((s) => s.formationKey);

  if (!result) return null;
  const { userRow, position, invincible, qualification, awards } = result;
  const league = LEAGUES.find((l) => l.code === leagueCode);
  const formation = getFormation(formationKey);

  const headline = invincible
    ? "THE INVINCIBLES"
    : position === 1
      ? "LANDSKAMPIOEN"
      : QUALIFICATION_LABELS[qualification].toUpperCase();

  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        height: 1350,
        padding: 56,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        color: "#fff",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        backgroundColor: "#064e3b",
        backgroundImage:
          "radial-gradient(120% 60% at 50% 0%, rgba(16,185,129,0.35), rgba(0,0,0,0) 60%), linear-gradient(165deg, #075e4a 0%, #0b3b30 55%, #062b22 100%)",
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: -1 }}>
          <span style={{ color: "#6ee7b7" }}>Perfect</span> XI
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26, fontWeight: 700 }}>
          <span style={{ fontSize: 30 }}>{league?.flag}</span>
          <span>{league?.name}</span>
          <span
            style={{
              background: "rgba(255,255,255,0.14)",
              borderRadius: 999,
              padding: "6px 16px",
              fontSize: 22,
            }}
          >
            {formation.label}
          </span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", marginTop: 4 }}>
        <div style={{ fontSize: 22, letterSpacing: 6, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
          EINDSTAND
        </div>
        <div
          style={{
            fontSize: invincible ? 72 : 78,
            fontWeight: 900,
            lineHeight: 1.05,
            color: "#6ee7b7",
            marginTop: 6,
          }}
        >
          {invincible ? "🏆🛡️" : `${position}e`}
        </div>
        <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: 1, marginTop: 2 }}>
          {headline} {invincible ? "" : position === 1 ? "🏆" : ""}
        </div>
      </div>

      {/* Stat-chips */}
      <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
        <Chip big label="PUNTEN" value={userRow.points} accent />
        <Chip label="GEWONNEN" value={userRow.won} />
        <Chip label="GELIJK" value={userRow.drawn} />
        <Chip label="VERLOREN" value={userRow.lost} />
        <Chip
          label="SALDO"
          value={`${userRow.gd >= 0 ? "+" : ""}${userRow.gd}`}
        />
      </div>

      {/* Pitch met XI */}
      <div
        style={{
          position: "relative",
          margin: "8px auto 0",
          width: 612,
          height: 770,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "inset 0 0 60px rgba(0,0,0,0.3), 0 16px 40px rgba(0,0,0,0.35)",
          backgroundColor: "#2f9e57",
          backgroundImage:
            "linear-gradient(180deg, rgba(0,0,0,0.16), rgba(0,0,0,0) 22%, rgba(0,0,0,0) 78%, rgba(0,0,0,0.2)), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 8.33%, rgba(0,0,0,0.05) 8.33%, rgba(0,0,0,0.05) 16.66%)",
        }}
      >
        <CardPitchLines />
        {slots.map((s) => {
          const p = s.player;
          if (!p) return null;
          return (
            <div
              key={s.id}
              style={{
                position: "absolute",
                left: `${s.x}%`,
                top: `${100 - s.y}%`,
                transform: "translate(-50%,-50%)",
                width: 78,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                className={ratingColor(p.overall)}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 900,
                  border: "3px solid rgba(255,255,255,0.92)",
                  boxShadow: "0 3px 8px rgba(0,0,0,0.35)",
                }}
              >
                {p.overall}
              </div>
              <div
                style={{
                  marginTop: 5,
                  background: "rgba(255,255,255,0.96)",
                  color: "#0f172a",
                  borderRadius: 999,
                  padding: "2px 10px",
                  fontSize: 15,
                  fontWeight: 800,
                  maxWidth: 78,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {p.name.split(" ").slice(-1)[0]}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.9)",
                  textShadow: "0 1px 2px rgba(0,0,0,0.55)",
                  maxWidth: 78,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {p.fromClub} {shortSeason(p.fromSeason)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Awards + footer */}
      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 4 }}>
        <AwardChip icon="⚽" label="Topscorer" value={awards.topScorer?.name ?? "—"} sub={awards.topScorer ? `${awards.topScorer.goals} goals` : ""} />
        <AwardChip icon="🧤" label="Clean sheets" value={awards.goalkeeper?.name ?? "—"} sub={`${awards.cleanSheets}×`} />
        <AwardChip icon="💥" label="Grootste zege" value={awards.biggestWin ? awards.biggestWin.opponent : "—"} sub={awards.biggestWin ? `${awards.biggestWin.gf}-${awards.biggestWin.ga}` : ""} />
      </div>

      <div
        style={{
          textAlign: "center",
          fontSize: 22,
          fontWeight: 700,
          color: "rgba(255,255,255,0.65)",
          marginTop: "auto",
        }}
      >
        Bouw jouw Perfect XI · jaag op 38-0-0
      </div>
    </div>
  );
});

function Chip({
  label,
  value,
  accent,
  big,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  big?: boolean;
}) {
  return (
    <div
      style={{
        background: accent ? "rgba(110,231,183,0.18)" : "rgba(255,255,255,0.08)",
        border: accent ? "1px solid rgba(110,231,183,0.5)" : "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: big ? "14px 26px" : "14px 20px",
        textAlign: "center",
        minWidth: big ? 150 : 110,
      }}
    >
      <div style={{ fontSize: big ? 46 : 38, fontWeight: 900, color: accent ? "#6ee7b7" : "#fff" }}>
        {value}
      </div>
      <div style={{ fontSize: 16, letterSpacing: 2, color: "rgba(255,255,255,0.55)", fontWeight: 700 }}>
        {label}
      </div>
    </div>
  );
}

function AwardChip({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: "14px 18px",
        width: 300,
      }}
    >
      <div style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
        {icon} {label}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 18, color: "#6ee7b7", fontWeight: 700 }}>{sub}</div>
    </div>
  );
}

export default ShareCard;
