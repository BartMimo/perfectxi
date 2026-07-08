"use client";

import { forwardRef } from "react";
import { divisionLabel } from "@/lib/career";
import type { OnlinePlayer } from "@/lib/onlineCareer";
import { useT } from "@/lib/i18n/core";

const MEDALS = ["#fbbf24", "#cbd5e1", "#d97706"] as const;

function TrophySvg({ color = "#fff" }: { color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function MoveTriangle({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 10 8" width={9} height={7} style={{ display: "block" }}>
      <polygon points={up ? "5,0 10,8 0,8" : "0,0 10,0 5,8"} fill={up ? "#34d399" : "#fb7185"} />
    </svg>
  );
}

/**
 * Vaste-breedte (1080px), inhoud-hoogte seizoensrecap-kaart voor een online
 * carrière-lobby, gerenderd buiten beeld en geëxporteerd naar PNG voor delen.
 * Toont per speler divisie, positieverandering t.o.v. vorig seizoen en punten.
 */
const LobbyRecapCard = forwardRef<
  HTMLDivElement,
  { lobbyName: string; season: number; players: OnlinePlayer[]; myUserId: string }
>(function LobbyRecapCard({ lobbyName, season, players, myUserId }, ref) {
  const t = useT();
  const sorted = [...players].sort(
    (a, b) => a.current_division - b.current_division || b.championships - a.championships,
  );
  const champion = sorted.find((p) => p.current_division === 1 && p.history[p.history.length - 1]?.position === 1);

  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        padding: 60,
        boxSizing: "border-box",
        position: "relative",
        color: "#fff",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        backgroundColor: "#070e0b",
        backgroundImage:
          "radial-gradient(120% 55% at 50% 0%, rgba(182,255,58,0.16), rgba(0,0,0,0) 55%), radial-gradient(90% 40% at 100% 0%, rgba(129,140,248,0.18), rgba(0,0,0,0) 60%), linear-gradient(165deg, #0c1712 0%, #091310 65%, #060b09 100%)",
        display: "flex",
        flexDirection: "column",
        gap: 26,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1 }}>
          <span style={{ color: "#b6ff3a" }}>Elite</span> Football
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.14)",
            borderRadius: 999,
            padding: "8px 20px",
            fontSize: 20,
            fontWeight: 700,
            maxWidth: 380,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {lobbyName}
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, letterSpacing: 5, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
          {t("onlineCarriere.title").toUpperCase()}
        </div>
        <div style={{ fontSize: 50, fontWeight: 900, color: "#c7d2fe", marginTop: 4 }}>
          {t("result.recapHeadline", { season })}
        </div>
        {champion && (
          <div
            style={{
              marginTop: 10,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(251,191,36,0.16)",
              border: "1px solid rgba(251,191,36,0.4)",
              borderRadius: 999,
              padding: "8px 20px",
              fontSize: 20,
              fontWeight: 800,
              color: "#fde68a",
            }}
          >
            <TrophySvg color="#fde68a" />
            {t("result.winsTheGame", { name: champion.team_name || champion.username })}
          </div>
        )}
      </div>

      {/* Standings */}
      <div
        style={{
          borderRadius: 26,
          overflow: "hidden",
          backgroundColor: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {sorted.map((p, i) => {
          const isMe = p.user_id === myUserId;
          const lastSeason = p.history[p.history.length - 1];
          const prevSeason = p.history[p.history.length - 2];
          const movedUp = prevSeason ? p.current_division < prevSeason.division : false;
          const movedDown = prevSeason ? p.current_division > prevSeason.division : false;
          const medal = MEDALS[i];
          return (
            <div
              key={p.user_id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "18px 26px",
                borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.08)",
                background: isMe ? "rgba(199,210,254,0.14)" : "transparent",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 900,
                  flexShrink: 0,
                  color: medal ? "#1e1b4b" : "rgba(255,255,255,0.75)",
                  background: medal ?? "rgba(255,255,255,0.12)",
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 25,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{p.team_name || p.username}</span>
                  {isMe && (
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#c7d2fe", flexShrink: 0 }}>
                      {t("result.you").toUpperCase()}
                    </span>
                  )}
                  {p.championships > 0 && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 15, color: "#fde68a", flexShrink: 0 }}>
                      <TrophySvg color="#fde68a" />×{p.championships}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
                  <span style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
                    {divisionLabel(t, p.current_division)}
                  </span>
                  {(movedUp || movedDown) && <MoveTriangle up={movedUp} />}
                  {lastSeason && (
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                      · {t("result.ordinalPosition", { position: lastSeason.position })}
                    </span>
                  )}
                </div>
              </div>
              {lastSeason && (
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#b6ff3a" }}>{lastSeason.points}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>
                    {t("result.pointsAbbr").toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          textAlign: "center",
          fontSize: 20,
          fontWeight: 700,
          color: "rgba(255,255,255,0.6)",
        }}
      >
        {t("result.shareFooter")}
      </div>
    </div>
  );
});

export default LobbyRecapCard;
