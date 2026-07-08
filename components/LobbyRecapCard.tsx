"use client";

import { forwardRef } from "react";
import { divisionLabel } from "@/lib/career";
import type { OnlinePlayer } from "@/lib/onlineCareer";
import { useT } from "@/lib/i18n/core";

/**
 * Vaste 1080×1350 seizoensrecap-kaart voor een online carrière-lobby, gerenderd
 * buiten beeld en geëxporteerd naar PNG voor delen op socials. Toont voor elke
 * speler hun divisie/positie/punten na afloop van het seizoen.
 */
const LobbyRecapCard = forwardRef<
  HTMLDivElement,
  { lobbyName: string; season: number; players: OnlinePlayer[]; myUserId: string }
>(function LobbyRecapCard({ lobbyName, season, players, myUserId }, ref) {
  const t = useT();
  const sorted = [...players].sort(
    (a, b) => a.current_division - b.current_division || b.championships - a.championships,
  );

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
        backgroundColor: "#312e81",
        backgroundImage:
          "radial-gradient(120% 60% at 50% 0%, rgba(129,140,248,0.35), rgba(0,0,0,0) 60%), linear-gradient(165deg, #3730a3 0%, #1e1b4b 55%, #12102e 100%)",
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: -1 }}>
          <span style={{ color: "#a5b4fc" }}>Perfect</span> XI
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.14)",
            borderRadius: 999,
            padding: "8px 20px",
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          {lobbyName}
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", marginTop: 4 }}>
        <div style={{ fontSize: 22, letterSpacing: 6, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
          {t("onlineCarriere.title").toUpperCase()}
        </div>
        <div style={{ fontSize: 56, fontWeight: 900, color: "#a5b4fc", marginTop: 6 }}>
          {t("result.recapHeadline", { season })}
        </div>
      </div>

      {/* Standings */}
      <div
        style={{
          marginTop: 8,
          borderRadius: 24,
          overflow: "hidden",
          backgroundColor: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {sorted.map((p, i) => {
          const isMe = p.user_id === myUserId;
          const lastSeason = p.history[p.history.length - 1];
          return (
            <div
              key={p.user_id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "20px 28px",
                borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.08)",
                background: isMe ? "rgba(165,180,252,0.14)" : "transparent",
              }}
            >
              <div style={{ width: 44, fontSize: 26, fontWeight: 900, color: "rgba(255,255,255,0.4)" }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.team_name || p.username}
                  {p.championships > 0 && ` · 🏆×${p.championships}`}
                </div>
                <div style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
                  {divisionLabel(t, p.current_division)}
                </div>
              </div>
              {lastSeason && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 30, fontWeight: 900, color: "#a5b4fc" }}>{lastSeason.points}</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>
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
          fontSize: 22,
          fontWeight: 700,
          color: "rgba(255,255,255,0.65)",
          marginTop: "auto",
        }}
      >
        {t("result.shareFooter")}
      </div>
    </div>
  );
});

export default LobbyRecapCard;
