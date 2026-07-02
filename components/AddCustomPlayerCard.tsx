"use client";

import { useGame } from "@/lib/store";
import { useCustomPlayerSlot } from "@/lib/customPlayer";
import { posLabel } from "@/lib/positions";
import { RatingBadge } from "./ui";
import { useT } from "@/lib/i18n/core";

/** Verplichte stap: de profielspeler moet als eerste aan de opstelling toegevoegd worden. */
export default function AddCustomPlayerCard() {
  const t = useT();
  const { player, drafted } = useCustomPlayerSlot();
  const addCustomPlayer = useGame((s) => s.addCustomPlayer);

  if (!player || !drafted) return null;

  return (
    <div className="card flex flex-col items-center gap-3 border-2 border-amber-300 bg-amber-50/70 p-6 text-center">
      <div className="text-xs font-black uppercase tracking-widest text-amber-600">{t("mijnSpeler.addFirstBanner")}</div>
      <RatingBadge value={player.overall} className="!h-12 !w-12 !text-lg" />
      <div>
        <div className="text-base font-bold text-slate-800">{player.name}</div>
        <div className="text-xs text-amber-700">{t("mijnSpeler.positionLevelLine", { position: posLabel(t, player.position), level: player.level })}</div>
      </div>
      <button
        onClick={() => addCustomPlayer(drafted)}
        className="w-full rounded-full bg-amber-400 px-5 py-3.5 text-base font-extrabold text-white shadow-[0_4px_0_#c98a10] transition hover:brightness-105 active:translate-y-1 active:shadow-none"
      >
        {t("mijnSpeler.addToLineupBtn", { name: player.name })}
      </button>
    </div>
  );
}
