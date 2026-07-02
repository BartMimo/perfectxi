"use client";

import { useGame } from "@/lib/store";
import { leagueName } from "@/lib/leagues";
import { getFormation } from "@/lib/formations";
import { useCareer, divisionLabel } from "@/lib/career";
import { useOnlineCareer } from "@/lib/onlineCareer";
import { useAuth } from "@/lib/auth";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LevelBadge from "@/components/LevelBadge";
import { useT } from "@/lib/i18n/core";

export default function Header({ showMeta = false, backHref }: { showMeta?: boolean; backHref?: string }) {
  const t = useT();
  const newGame = useGame((s) => s.newGame);
  const leagueCode = useGame((s) => s.leagueCode);
  const gameMode = useGame((s) => s.gameMode);
  const formationKey = useGame((s) => s.formationKey);
  const formation = getFormation(formationKey);
  const career = useCareer();
  const lobby = useOnlineCareer((s) => s.lobby);
  const userId = useAuth((s) => s.userId);

  const isOnlineCareer = !!lobby && lobby.status === "drafting";
  const onlineMe = lobby?.players.find((p) => p.user_id === userId);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/40 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          {backHref && (
            <a href={backHref} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition text-sm">
              ←
            </a>
          )}
          <a href="/" className="text-base font-black tracking-tight text-emerald-950">
            Elite Football
          </a>
        </div>
        <div className="flex items-center gap-2">
          {showMeta && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              {isOnlineCareer && onlineMe ? (
                <span className="truncate rounded-full border border-indigo-200/60 bg-indigo-50/60 px-3 py-1.5 text-indigo-700 backdrop-blur">
                  {divisionLabel(t, onlineMe.current_division)} · S{lobby.current_season}
                </span>
              ) : gameMode === "career" ? (
                <span className="truncate rounded-full border border-indigo-200/60 bg-indigo-50/60 px-3 py-1.5 text-indigo-700 backdrop-blur">
                  {divisionLabel(t, career.currentDivision)} · S{career.season}
                </span>
              ) : leagueCode ? (
                <span className="truncate rounded-full border border-slate-200/60 bg-white/60 px-3 py-1.5 backdrop-blur">
                  {leagueName(leagueCode)}
                </span>
              ) : null}
              <span className="rounded-full border border-slate-200/60 bg-white/60 px-3 py-1.5 backdrop-blur">
                {formation.label}
              </span>
            </div>
          )}
          <span className="hidden sm:block">
            <LevelBadge />
          </span>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
