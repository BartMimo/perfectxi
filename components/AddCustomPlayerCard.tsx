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
    <div className="card-solid flex flex-col items-center gap-3 border border-draw/40 bg-draw/[0.06] p-6 text-center">
      <div className="eyebrow text-draw">{t("mijnSpeler.addFirstBanner")}</div>
      <RatingBadge value={player.overall} className="!h-12 !w-12 !text-lg" />
      <div>
        <div className="text-base font-bold text-text">{player.name}</div>
        <div className="text-xs text-dim">{t("mijnSpeler.positionLevelLine", { position: posLabel(t, player.position), level: player.level })}</div>
      </div>
      <button
        onClick={() => addCustomPlayer(drafted)}
        className="btn-primary w-full text-base"
      >
        {t("mijnSpeler.addToLineupBtn", { name: player.name })}
      </button>
    </div>
  );
}
