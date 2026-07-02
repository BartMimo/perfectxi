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
        <div className="flex items-center justify-center py-20 text-sm text-slate-400 font-bold">{t("common.loading")}</div>
        <Footer />
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen w-full pb-12">
        <Header backHref="/" />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-500"><IconStar className="h-7 w-7" /></div>
          <p className="text-sm text-slate-500 mb-4">{t("mijnSpeler.loginPrompt")}</p>
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
          <div className="animate-floaty mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-400 text-white shadow-[0_3px_0_#be2f52]"><IconStar className="h-7 w-7" /></div>
          <h1 className="text-2xl font-black text-slate-800">{t("mijnSpeler.title")}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {t("mijnSpeler.intro")}
          </p>
          <button
            onClick={() => setShowUitleg((v) => !v)}
            className="mt-2 text-xs font-bold text-indigo-500 hover:text-indigo-700 transition"
          >
            {showUitleg ? t("mijnSpeler.hideExplainer") : t("mijnSpeler.showExplainer")}
          </button>
        </div>
        {showUitleg && (
          <div className="mb-6 rounded-2xl bg-indigo-50/80 border border-indigo-100 px-4 py-3 text-sm text-slate-600">
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
    <div className="card mt-6 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100/60">
        <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-500"><IconStar className="h-3.5 w-3.5" /></span>
          {t("mijnSpeler.leaderboardTitle")}
        </span>
      </div>
      {loading ? (
        <div className="p-8 text-center text-sm text-slate-400">{t("common.loading")}</div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">{t("mijnSpeler.noPlayersYet")}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50/80 text-[10px] uppercase tracking-widest text-slate-400">
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
                <tr key={r.id} className="border-t border-slate-100/60 text-slate-600 transition hover:bg-emerald-50/30">
                  <td className="px-4 py-3 font-bold text-slate-400">{i + 1}</td>
                  <td className="px-3 py-3">
                    <a href={`/profiel/${encodeURIComponent(r.username)}`} className="font-bold text-slate-800 hover:text-indigo-600 transition">
                      {r.username}
                    </a>
                  </td>
                  <td className="px-3 py-3 font-semibold">{r.name}</td>
                  <td className="px-3 py-3 text-slate-500">
                    {[r.position, ...r.extraPositions].map((p) => posLabel(t, p)).join(", ")}
                  </td>
                  <td className="px-3 py-3 text-right font-black text-indigo-600 tabular-nums">{r.overall}</td>
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
    return <div className="p-12 text-center text-sm text-slate-400">{t("common.loading")}</div>;
  }

  if (!player) {
    return (
      <div className="card p-5">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{t("mijnSpeler.newPlayerTitle")}</div>
        <p className="text-sm text-slate-500 mb-3">
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
              className={`rounded-xl border-2 px-1.5 py-2 text-xs font-bold transition-all ${
                position === pos
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                  : "border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100"
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
              <button type="submit" className="rounded-lg bg-indigo-500 px-2.5 py-1.5 text-xs font-bold text-white">✓</button>
              <button type="button" onClick={() => setEditingName(false)} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-500">✕</button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="text-lg font-black text-slate-800 truncate">{player.name}</div>
              <button
                onClick={() => { setNameDraft(player.name); setEditingName(true); }}
                className="shrink-0 text-xs text-slate-400 hover:text-slate-600 transition"
                title={t("mijnSpeler.renameTitle")}
              >
                <IconPencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="text-xs font-bold text-slate-400">
            {t("mijnSpeler.levelLine", { level: player.level, positions: [player.position, ...player.extraPositions].map((p) => posLabel(t, p)).join(", ") })}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <span>XP</span>
          <span>{isMaxLevel ? t("mijnSpeler.maxLevel") : `${progress.current} / ${progress.needed}`}</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
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

      <div className="rounded-2xl bg-indigo-50/80 border border-indigo-100 px-4 py-3 mb-3">
        <div className="text-sm font-bold text-indigo-700">
          {t("mijnSpeler.skillPointsAvailable", { n: player.skillPoints })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          disabled={player.skillPoints < 1 || player.overall >= MAX_OVERALL}
          onClick={() => spendOnOverall(userId)}
          className="flex items-center justify-between rounded-xl bg-slate-50 border-2 border-transparent px-4 py-3 text-left hover:bg-slate-100 transition disabled:opacity-40 disabled:hover:bg-slate-50"
        >
          <span className="text-sm font-bold text-slate-700">
            {player.overall >= MAX_OVERALL ? t("mijnSpeler.overallMaxed") : t("mijnSpeler.plusOneOverall")}
          </span>
          <span className="text-xs font-black text-indigo-600">{t("mijnSpeler.onePoint")}</span>
        </button>

        {remainingPositions.length > 0 && (
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1.5 px-1">{t("mijnSpeler.extraPositionCost", { cost: EXTRA_POSITION_COST })}</div>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
              {remainingPositions.map((pos) => (
                <button
                  key={pos}
                  disabled={player.skillPoints < EXTRA_POSITION_COST}
                  onClick={() => spendOnPosition(userId, pos)}
                  className="rounded-xl border-2 border-transparent bg-slate-50 px-1.5 py-2 text-xs font-bold text-slate-500 transition-all hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50"
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
    <div className="rounded-xl bg-slate-50 px-2 py-2 text-center">
      <div className="text-sm font-black text-slate-700">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}
