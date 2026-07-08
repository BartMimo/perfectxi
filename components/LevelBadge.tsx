"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useXp, xpProgress } from "@/lib/xp";

export default function LevelBadge() {
  const userId = useAuth((s) => s.userId);
  const authLoading = useAuth((s) => s.loading);
  const totalXp = useXp((s) => s.totalXp);
  const load = useXp((s) => s.load);
  useEffect(() => {
    if (!authLoading) load(userId);
  }, [load, userId, authLoading]);
  const { level, current, needed } = xpProgress(totalXp);
  const pct = needed > 0 ? Math.round((current / needed) * 100) : 100;
  return (
    <span className="flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-accent">
      lvl {level}
      <span className="inline-block h-1.5 w-11 overflow-hidden rounded-full bg-white/[0.08]">
        <span
          className="block h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </span>
    </span>
  );
}
