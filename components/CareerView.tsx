"use client";

import { useEffect } from "react";
import { useCareer, divisionLabel } from "@/lib/career";
import { useGame } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n/core";

export function TransferWindow() {
  const t = useT();
  const career = useCareer();
  const startCareerSeason = useGame((s) => s.startCareerSeason);
  const userId = useAuth((s) => s.userId);

  if (!career.transferring) return null;

  const selectedCount = career.playersToReplace.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="animate-pop w-full max-w-md card-solid p-6">
        <div className="text-center mb-4">
          <div className="text-2xl mb-2">🔄</div>
          <h2 className="text-xl font-black text-text font-display">{t("career.transferWindow")}</h2>
          <p className="text-sm text-dim mt-1">
            {career.wisselCount === 0
              ? t("career.noTransfersAllowed")
              : career.wisselCount > 1
                ? t("career.chooseMaxPlayersPlural", { n: career.wisselCount })
                : t("career.chooseMaxPlayersSingular", { n: career.wisselCount })}
          </p>
          <div className="mt-2 text-xs font-bold text-indigo-300">
            {divisionLabel(t, career.currentDivision)} · {t("career.seasonN", { n: career.season })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto mb-4">
          {career.squad.map((p) => {
            const selected = career.playersToReplace.has(p.name);
            return (
              <button
                key={p.name}
                onClick={() => career.toggleReplace(p.name)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all border ${
                  selected
                    ? "bg-loss/[0.1] border-loss/40"
                    : "bg-white/[0.03] border-line hover:border-line-strong"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-text">{p.name}</div>
                  <div className="text-[10px] text-faint">{p.fromClub} · {p.sub}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="stat-num text-base text-text">{p.overall}</span>
                  {selected && <span className="text-xs font-bold text-loss">{t("career.gone")}</span>}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              const remaining = career.confirmTransfers();
              if (userId) {
                // Save remaining squad to DB before starting new season
                career.setSquad(userId, remaining);
              }
              useGame.getState().setFormation(career.formationKey);
              startCareerSeason(career.currentDivision, remaining, career.rerollCount, career.leagues);
            }}
            className="btn-primary flex-1"
          >
            {selectedCount === 0
              ? t("career.continueWithoutTransfers")
              : selectedCount > 1
                ? t("career.replacePlayersPlural", { n: selectedCount })
                : t("career.replacePlayersSingular", { n: selectedCount })}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CareerResultBanner() {
  const t = useT();
  const career = useCareer();
  const result = useGame((s) => s.result);
  const slots = useGame((s) => s.slots);
  const gameMode = useGame((s) => s.gameMode);
  const userId = useAuth((s) => s.userId);

  useEffect(() => {
    if (gameMode === "career" && result && career.active && userId && slots.every((s) => s.player)) {
      const squad = slots.map((s) => s.player!);
      career.setSquad(userId, squad);
    }
  }, [gameMode, result]);

  if (gameMode !== "career" || !result || !career.active) return null;

  const position = result.position;
  const promoted = position === 1 && career.currentDivision > 1;
  const relegated = position >= 18 && career.currentDivision < 10;
  const champion = position === 1;

  const handleContinue = () => {
    if (userId) {
      career.finishSeason(userId, position, result.userRow.points, result.userRow.gf, result.userRow.ga);
    }
    career.startTransferWindow();
  };

  return (
    <div className="card p-5 text-center border border-indigo-400/25">
      <div className="eyebrow text-indigo-300 mb-2">
        {divisionLabel(t, career.currentDivision)} · {t("career.seasonN", { n: career.season })}
      </div>
      {champion && (
        <div className="text-lg font-black text-accent text-glow mb-1 font-display">
          {t("career.championExclaim")} {promoted ? t("career.promotedTo", { division: divisionLabel(t, career.currentDivision - 1) }) : ""}
        </div>
      )}
      {relegated && (
        <div className="text-lg font-black text-loss mb-1 font-display">
          {t("career.relegatedTo", { division: divisionLabel(t, career.currentDivision + 1) })}
        </div>
      )}
      {!champion && !relegated && (
        <div className="text-sm text-dim mb-1">
          {t("career.finishedPosition", { pos: position, division: divisionLabel(t, career.currentDivision) })}
        </div>
      )}
      <button onClick={handleContinue} className="btn-primary mt-3 w-full text-base">
        {t("career.nextSeason")}
      </button>
    </div>
  );
}
