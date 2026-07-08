"use client";

import { divisionLabel } from "@/lib/career";
import type { OnlinePlayer } from "@/lib/onlineCareer";
import { useT } from "@/lib/i18n/core";
import { IconTrophy } from "@/components/icons";

/** Vergelijkt twee lobbyspelers over de seizoenen die ze allebei gespeeld hebben.
 * Er zijn geen directe onderlinge wedstrijden in online carrière (iedereen speelt
 * tegen CPU-clubs binnen zijn eigen divisie), dus "gewonnen" betekent hier: wie dat
 * seizoen de betere divisie/positie haalde. */
function compareH2H(me: OnlinePlayer, opponent: OnlinePlayer) {
  const opponentSeasons = new Map(opponent.history.map((h) => [h.season, h]));
  let myWins = 0;
  let theirWins = 0;
  let ties = 0;
  let myPoints = 0;
  let theirPoints = 0;
  let myBestDivision = Infinity;
  let theirBestDivision = Infinity;
  let seasonsTogether = 0;

  for (const mine of me.history) {
    const theirs = opponentSeasons.get(mine.season);
    if (!theirs) continue;
    seasonsTogether++;
    myPoints += mine.points;
    theirPoints += theirs.points;
    myBestDivision = Math.min(myBestDivision, mine.division);
    theirBestDivision = Math.min(theirBestDivision, theirs.division);
    if (mine.division !== theirs.division) {
      if (mine.division < theirs.division) myWins++;
      else theirWins++;
    } else if (mine.position !== theirs.position) {
      if (mine.position < theirs.position) myWins++;
      else theirWins++;
    } else {
      ties++;
    }
  }

  return {
    seasonsTogether,
    myWins,
    theirWins,
    ties,
    myPoints,
    theirPoints,
    myBestDivision,
    theirBestDivision,
  };
}

function Row({ label, mine, theirs }: { label: string; mine: string | number; theirs: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-white/[0.03] px-3.5 py-2.5">
      <span className="w-16 text-center stat-num text-lg text-accent">{mine}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-faint">{label}</span>
      <span className="w-16 text-center stat-num text-lg text-dim">{theirs}</span>
    </div>
  );
}

export default function HeadToHeadModal({
  me,
  opponent,
  onClose,
}: {
  me: OnlinePlayer;
  opponent: OnlinePlayer;
  onClose: () => void;
}) {
  const t = useT();
  const stats = compareH2H(me, opponent);
  const opponentName = opponent.team_name || opponent.username;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm card-solid p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-400/12 text-indigo-300 ring-1 ring-indigo-400/25">
            <IconTrophy className="h-6 w-6" />
          </div>
          <h2 className="text-base font-black text-text">{t("onlineCarriere.h2h.title", { name: opponentName })}</h2>
        </div>

        {stats.seasonsTogether === 0 ? (
          <p className="py-4 text-center text-sm text-faint">{t("onlineCarriere.h2h.noHistory")}</p>

        ) : (
          <div className="flex flex-col gap-1.5">
            <Row label={t("onlineCarriere.h2h.seasonsTogether")} mine={stats.seasonsTogether} theirs={stats.seasonsTogether} />
            <Row label={t("onlineCarriere.h2h.wins")} mine={stats.myWins} theirs={stats.theirWins} />
            <Row label={t("onlineCarriere.h2h.championships")} mine={me.championships} theirs={opponent.championships} />
            <Row label={t("onlineCarriere.h2h.totalPoints")} mine={stats.myPoints} theirs={stats.theirPoints} />
            <Row
              label={t("onlineCarriere.h2h.bestDivision")}
              mine={divisionLabel(t, stats.myBestDivision)}
              theirs={divisionLabel(t, stats.theirBestDivision)}
            />
          </div>
        )}

        <button onClick={onClose} className="btn-secondary mt-5 w-full">
          {t("onlineCarriere.h2h.close")}
        </button>
      </div>
    </div>
  );
}
