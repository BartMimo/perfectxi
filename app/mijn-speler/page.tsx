"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { POS_KEYS, posLabel, type PosKey } from "@/lib/positions";
import { useCustomPlayer, xpProgress, BASE_OVERALL, MAX_OVERALL, EXTRA_POSITION_COST } from "@/lib/customPlayer";
import { RatingBadge } from "@/components/ui";
import { LoginPrompt } from "@/components/AuthGate";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useT } from "@/lib/i18n/core";
import { IconPencil, IconStar } from "@/components/icons";

export default function MijnSpelerPage() {
  const t = useT();
  const userId = useAuth((s) => s.userId);
  const authLoading = useAuth((s) => s.loading);
  const [showLogin, setShowLogin] = useState(false);
  const [showUitleg, setShowUitleg] = useState(false);

  if (authLoading) {
    return (
      <main className="min-h-screen w-full pb-12">
        <Header backHref="/" />
        <div className="flex items-center justify-center py-20 text-sm text-faint font-bold">{t("common.loading")}</div>
        <Footer />
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen w-full pb-12">
        <Header backHref="/" />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-400/12 text-rose-300 ring-1 ring-rose-400/25"><IconStar className="h-7 w-7" /></div>
          <p className="text-sm text-dim mb-4">{t("mijnSpeler.loginPrompt")}</p>
          <button onClick={() => setShowLogin(true)} className="btn-primary">{t("common.login")}</button>
        </div>
        {showLogin && <LoginPrompt onClose={() => setShowLogin(false)} />}
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full pb-12">
      <Header backHref="/" />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8 text-center">
          <div className="animate-floaty mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-400/15 text-rose-300 ring-1 ring-rose-400/30"><IconStar className="h-7 w-7" /></div>
          <h1 className="text-3xl font-black text-text font-display tracking-tight">{t("mijnSpeler.title")}</h1>
          <p className="mt-2 text-sm text-dim">
            {t("mijnSpeler.intro")}
          </p>
          <button
            onClick={() => setShowUitleg((v) => !v)}
            className="mt-2 text-xs font-bold text-accent hover:brightness-110 transition"
          >
            {showUitleg ? t("mijnSpeler.hideExplainer") : t("mijnSpeler.showExplainer")}
          </button>
        </div>
        {showUitleg && (
          <div className="mb-6 rounded-2xl border border-line bg-white/[0.03] px-4 py-3 text-sm text-dim">
            <ul className="list-disc pl-4 space-y-1.5">
              <li>{t("mijnSpeler.explainer1")}</li>
              <li>{t("mijnSpeler.explainer2")}</li>
              <li>{t("mijnSpeler.explainer3", { max: MAX_OVERALL, cost: EXTRA_POSITION_COST })}</li>
              <li>{t("mijnSpeler.explainer4")}</li>
            </ul>
          </div>
        )}
        <CustomPlayerCard userId={userId} />
        <TopSpelersRanglijst />
      </div>
      <Footer />
    </main>
  );
}

interface TopSpelerRow {
  id: string;
  username: string;
  name: string;
  position: PosKey;
  extraPositions: PosKey[];
  overall: number;
  seasonsPlayed: number;
  totalGoals: number;
  totalAssists: number;
  totalCleanSheets: number;
}

function TopSpelersRanglijst() {
  const t = useT();
  const [rows, setRows] = useState<TopSpelerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("custom_players")
      .select("id, name, position, extra_positions, overall, seasons_played, total_goals, total_assists, total_clean_sheets, users!inner(username)")
      .order("overall", { ascending: false })
      .limit(20);
    if (data) {
      setRows((data as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        username: (r.users as Record<string, string>).username,
        name: r.name as string,
        position: r.position as PosKey,
        extraPositions: (r.extra_positions as PosKey[]) ?? [],
        overall: r.overall as number,
        seasonsPlayed: (r.seasons_played as number) ?? 0,
        totalGoals: (r.total_goals as number) ?? 0,
        totalAssists: (r.total_assists as number) ?? 0,
        totalCleanSheets: (r.total_clean_sheets as number) ?? 0,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="card-solid mt-6 overflow-hidden">
      <div className="px-5 py-3 border-b border-line">
        <span className="flex items-center gap-2 text-sm font-bold text-text">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-400/12 text-rose-300"><IconStar className="h-3.5 w-3.5" /></span>
          {t("mijnSpeler.leaderboardTitle")}
        </span>
      </div>
      {loading ? (
        <div className="p-8 text-center text-sm text-faint">{t("common.loading")}</div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-faint">{t("mijnSpeler.noPlayersYet")}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-faint">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-3 py-3 text-left">{t("mijnSpeler.colAccount")}</th>
                <th className="px-3 py-3 text-left">{t("mijnSpeler.colPlayer")}</th>
                <th className="px-3 py-3 text-left">{t("mijnSpeler.colPosition")}</th>
                <th className="px-3 py-3 text-right">{t("mijnSpeler.colOverall")}</th>
                <th className="px-3 py-3 text-right">{t("mijnSpeler.colSeasons")}</th>
                <th className="px-3 py-3 text-right">{t("mijnSpeler.colGoals")}</th>
                <th className="px-3 py-3 text-right">{t("mijnSpeler.colAssists")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-t border-line text-dim transition hover:bg-white/[0.03]">
                  <td className="px-4 py-3 stat-num text-sm text-faint">{i + 1}</td>
                  <td className="px-3 py-3">
                    <a href={`/profiel/${encodeURIComponent(r.username)}`} className="font-bold text-text hover:text-accent transition">
                      {r.username}
                    </a>
                  </td>
                  <td className="px-3 py-3 font-semibold">{r.name}</td>
                  <td className="px-3 py-3 text-faint">
                    {[r.position, ...r.extraPositions].map((p) => posLabel(t, p)).join(", ")}
                  </td>
                  <td className="px-3 py-3 text-right stat-num text-sm text-accent">{r.overall}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{r.seasonsPlayed}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{r.totalGoals}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{r.totalAssists}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CustomPlayerCard({ userId }: { userId: string }) {
  const t = useT();
  const { player, loaded, loading, load, create, rename, spendOnOverall, spendOnPosition } = useCustomPlayer();
  const [name, setName] = useState("");
  const [position, setPosition] = useState<PosKey | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    if (userId && !loaded && !loading) load(userId);
  }, [userId, loaded, loading, load]);

  if (loading || !loaded) {
    return <div className="p-12 text-center text-sm text-faint">{t("common.loading")}</div>;
  }

  if (!player) {
    return (
      <div className="card p-5">
        <div className="eyebrow mb-3">{t("mijnSpeler.newPlayerTitle")}</div>
        <p className="text-sm text-dim mb-3">
          {t("mijnSpeler.newPlayerDesc", { base: BASE_OVERALL })}
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("mijnSpeler.namePlaceholder")}
          maxLength={20}
          className="glass-input w-full !py-2.5 !text-sm mb-3"
        />
        <div className="grid grid-cols-4 gap-1.5 mb-3 sm:grid-cols-7">
          {POS_KEYS.map((pos) => (
            <button
              key={pos}
              onClick={() => setPosition(pos)}
              className={`rounded-xl border px-1.5 py-2 text-xs font-bold transition-all ${
                position === pos
                  ? "border-accent/60 bg-accent/[0.08] text-accent"
                  : "border-line bg-white/[0.03] text-dim hover:bg-white/[0.06]"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
        <button
          disabled={creating || name.trim().length < 2 || !position}
          onClick={async () => {
            if (!position) return;
            setCreating(true);
            await create(userId, name, position);
            setCreating(false);
          }}
          className="btn-primary w-full disabled:opacity-40"
        >
          {creating ? t("common.busy") : t("mijnSpeler.createPlayerBtn")}
        </button>
      </div>
    );
  }

  const progress = xpProgress(player.xp);
  const isMaxLevel = progress.needed === 0;
  const remainingPositions = POS_KEYS.filter((p) => p !== player.position && !player.extraPositions.includes(p));

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <RatingBadge value={player.overall} className="!h-11 !w-11 !text-base" />
        <div className="min-w-0 flex-1">
          {editingName ? (
            <form
              onSubmit={(e) => { e.preventDefault(); if (nameDraft.trim()) rename(userId, nameDraft); setEditingName(false); }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={20}
                autoFocus
                className="glass-input flex-1 !py-1.5 !text-sm"
              />
              <button type="submit" className="rounded-lg bg-accent px-2.5 py-1.5 text-xs font-bold text-accent-ink">✓</button>
              <button type="button" onClick={() => setEditingName(false)} className="rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-xs font-bold text-dim">✕</button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="text-lg font-black text-text truncate font-display">{player.name}</div>
              <button
                onClick={() => { setNameDraft(player.name); setEditingName(true); }}
                className="shrink-0 text-xs text-faint hover:text-text transition"
                title={t("mijnSpeler.renameTitle")}
              >
                <IconPencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="text-xs font-bold text-faint">
            {t("mijnSpeler.levelLine", { level: player.level, positions: [player.position, ...player.extraPositions].map((p) => posLabel(t, p)).join(", ") })}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1 eyebrow">
          <span>XP</span>
          <span className="text-dim tabular-nums">{isMaxLevel ? t("mijnSpeler.maxLevel") : `${progress.current} / ${progress.needed}`}</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-2 to-accent"
            style={{ width: isMaxLevel ? "100%" : `${(progress.current / progress.needed) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 mb-3">
        <PlayerStatBox label={t("mijnSpeler.statSeasons")} value={player.seasonsPlayed} />
        <PlayerStatBox label={t("mijnSpeler.statGoals")} value={player.totalGoals} />
        <PlayerStatBox label={t("mijnSpeler.statAssists")} value={player.totalAssists} />
        <PlayerStatBox label={t("mijnSpeler.statCleanSheets")} value={player.totalCleanSheets} />
      </div>

      <div className="rounded-2xl border border-accent/20 bg-accent/[0.07] px-4 py-3 mb-3">
        <div className="text-sm font-bold text-accent">
          {t("mijnSpeler.skillPointsAvailable", { n: player.skillPoints })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          disabled={player.skillPoints < 1 || player.overall >= MAX_OVERALL}
          onClick={() => spendOnOverall(userId)}
          className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-line px-4 py-3 text-left hover:bg-white/[0.06] transition disabled:opacity-40"
        >
          <span className="text-sm font-bold text-text">
            {player.overall >= MAX_OVERALL ? t("mijnSpeler.overallMaxed") : t("mijnSpeler.plusOneOverall")}
          </span>
          <span className="text-xs font-black text-accent">{t("mijnSpeler.onePoint")}</span>
        </button>

        {remainingPositions.length > 0 && (
          <div>
            <div className="text-xs font-bold text-dim mb-1.5 px-1">{t("mijnSpeler.extraPositionCost", { cost: EXTRA_POSITION_COST })}</div>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
              {remainingPositions.map((pos) => (
                <button
                  key={pos}
                  disabled={player.skillPoints < EXTRA_POSITION_COST}
                  onClick={() => spendOnPosition(userId, pos)}
                  className="rounded-xl border border-line bg-white/[0.03] px-1.5 py-2 text-xs font-bold text-dim transition-all hover:bg-white/[0.06] disabled:opacity-40"
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerStatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.03] px-2 py-2 text-center">
      <div className="stat-num text-lg text-text">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-wide text-faint">{label}</div>
    </div>
  );
}
