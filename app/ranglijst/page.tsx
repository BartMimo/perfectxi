"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FORMATIONS } from "@/lib/formations";
import { LEAGUES } from "@/lib/leagues";
import { posLabel, type PosKey } from "@/lib/positions";
import { getCurrentChallenge, getChallengeDayId } from "@/lib/challenge";
import type { CareerSeason } from "@/lib/career";
import SortableTable, { UserLink, type RanglijstColumn } from "@/components/ranglijst/SortableTable";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useT } from "@/lib/i18n/core";
import { IconBall, IconBolt, IconGlobe, IconStar, IconTrophy } from "@/components/icons";

type Tab = "myPlayer" | "onlineCareer" | "offlineCareer" | "singleSeason" | "daily";
type DailySubTab = "today" | "wins";
type TFunc = (key: string, vars?: Record<string, string | number>) => string;

interface MyPlayerRow {
  id: string;
  playerName: string;
  username: string;
  position: PosKey;
  extraPositions: PosKey[];
  overall: number;
  seasonsPlayed: number;
  championships: number;
}

interface CareerRow {
  id: string;
  username: string;
  seasons: number;
  championships: number;
  fastestDiv1: number | null;
  teamRating: number;
  formation: string | null;
  leagues: string[];
}

interface SingleSeasonRow {
  id: string;
  username: string;
  leagueName: string;
  formation: string;
  points: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  teamRating: number;
  position: number;
}

interface DailyTodayRow {
  id: string;
  username: string;
  points: number;
  position: number;
  teamRating: number;
  goalDiff: number;
}

interface DailyWinRow {
  username: string;
  wins: number;
}

function avgRating(squad: { overall: number }[] | null | undefined): number {
  if (!squad || squad.length === 0) return 0;
  return Math.round((squad.reduce((s, p) => s + p.overall, 0) / squad.length) * 10) / 10;
}

function fastestDiv1Champion(history: CareerSeason[] | null | undefined): number | null {
  let best: number | null = null;
  for (const h of history ?? []) {
    if (h.division === 1 && h.position === 1) {
      if (best === null || h.season < best) best = h.season;
    }
  }
  return best;
}

function fmtFormation(key: string): string {
  return FORMATIONS.find((f) => f.key === key)?.label ?? key;
}

function fmtLeagues(t: TFunc, codes: string[]): string {
  if (!codes || codes.length === 0) return t("ranglijst.allLeagues");
  return codes.map((c) => LEAGUES.find((l) => l.code === c)?.flag ?? c).join(" ");
}

function PosBadge({ position }: { position: number }) {
  return (
    <span className={`inline-flex h-6 min-w-[2rem] items-center justify-center rounded-full px-2 text-[10px] font-bold ${
      position === 1 ? "bg-amber-100/80 text-amber-700"
        : position <= 4 ? "bg-emerald-100/80 text-emerald-700"
        : position >= 18 ? "bg-rose-100/80 text-rose-600"
        : "bg-slate-100/80 text-slate-500"
    }`}>
      {position}e
    </span>
  );
}

function careerColumns(t: TFunc): RanglijstColumn<CareerRow>[] {
  return [
    {
      key: "username",
      label: t("ranglijst.col.username"),
      value: (r) => r.username,
      cell: (r) => <UserLink username={r.username} />,
      defaultDir: "asc",
    },
    {
      key: "seasons",
      label: t("ranglijst.col.seasons"),
      align: "right",
      value: (r) => r.seasons,
      cell: (r) => r.seasons,
      defaultDir: "desc",
    },
    {
      key: "titles",
      label: t("ranglijst.col.titles"),
      align: "right",
      value: (r) => r.championships,
      cell: (r) => r.championships,
      defaultDir: "desc",
    },
    {
      key: "fastest",
      label: t("ranglijst.col.fastestDiv1"),
      align: "right",
      value: (r) => r.fastestDiv1 ?? Infinity,
      cell: (r) => (r.fastestDiv1 !== null ? t("ranglijst.seasonsShort", { n: r.fastestDiv1 }) : "—"),
      defaultDir: "asc",
    },
    {
      key: "rating",
      label: t("ranglijst.col.teamRating"),
      align: "right",
      value: (r) => r.teamRating,
      cell: (r) => (r.teamRating > 0 ? r.teamRating.toFixed(1) : "—"),
      defaultDir: "desc",
    },
    {
      key: "formation",
      label: t("ranglijst.col.formation"),
      value: (r) => (r.formation ? fmtFormation(r.formation) : ""),
      cell: (r) => (r.formation ? fmtFormation(r.formation) : "—"),
      defaultDir: "desc",
    },
    {
      key: "leagues",
      label: t("ranglijst.col.leagues"),
      value: (r) => (r.leagues.length === 0 ? 999 : r.leagues.length),
      cell: (r) => fmtLeagues(t, r.leagues),
      defaultDir: "desc",
    },
  ];
}

export default function RanglijstPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("myPlayer");
  const [dailySubTab, setDailySubTab] = useState<DailySubTab>("today");
  const [loadedTabs, setLoadedTabs] = useState<Set<Tab>>(new Set());
  const [loading, setLoading] = useState(false);

  const [myPlayerRows, setMyPlayerRows] = useState<MyPlayerRow[]>([]);
  const [onlineCareerRows, setOnlineCareerRows] = useState<CareerRow[]>([]);
  const [offlineCareerRows, setOfflineCareerRows] = useState<CareerRow[]>([]);
  const [singleSeasonRows, setSingleSeasonRows] = useState<SingleSeasonRow[]>([]);
  const [dailyTodayRows, setDailyTodayRows] = useState<DailyTodayRow[]>([]);
  const [dailyWinRows, setDailyWinRows] = useState<DailyWinRow[]>([]);

  const challenge = getCurrentChallenge();

  const loadMyPlayer = useCallback(async () => {
    const { data } = await supabase
      .from("custom_players")
      .select("id, name, position, extra_positions, overall, seasons_played, championships, users!inner(username)")
      .limit(500);
    setMyPlayerRows(
      ((data as Record<string, unknown>[]) ?? []).map((r) => ({
        id: r.id as string,
        playerName: r.name as string,
        username: (r.users as Record<string, string>).username,
        position: r.position as PosKey,
        extraPositions: (r.extra_positions as PosKey[]) ?? [],
        overall: r.overall as number,
        seasonsPlayed: (r.seasons_played as number) ?? 0,
        championships: (r.championships as number) ?? 0,
      })),
    );
  }, []);

  const loadOnlineCareer = useCallback(async () => {
    const { data } = await supabase
      .from("online_career_players")
      .select("id, username, squad, history, championships, formation_key, online_careers(leagues)")
      .eq("is_bot", false)
      .eq("pending", false)
      .limit(1000);
    const rows: CareerRow[] = ((data as Record<string, unknown>[]) ?? [])
      .map((r) => {
        const history = (r.history as CareerSeason[]) ?? [];
        return {
          id: r.id as string,
          username: r.username as string,
          seasons: history.length,
          championships: (r.championships as number) ?? 0,
          fastestDiv1: fastestDiv1Champion(history),
          teamRating: avgRating(r.squad as { overall: number }[]),
          formation: (r.formation_key as string | null) ?? null,
          leagues: ((r.online_careers as Record<string, unknown> | null)?.leagues as string[]) ?? [],
        };
      })
      .filter((r) => r.seasons > 0);
    setOnlineCareerRows(rows);
  }, []);

  const loadOfflineCareer = useCallback(async () => {
    const { data } = await supabase
      .from("careers")
      .select("id, user_id, squad, history, championships, formation_key, leagues")
      .limit(1000);
    const list = (data as Record<string, unknown>[]) ?? [];
    const userIds = [...new Set(list.map((r) => r.user_id as string))];
    let nameById = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: users } = await supabase.from("users").select("id, username").in("id", userIds);
      nameById = new Map(((users as Record<string, string>[]) ?? []).map((u) => [u.id, u.username]));
    }
    const rows: CareerRow[] = list
      .map((r) => {
        const history = (r.history as CareerSeason[]) ?? [];
        return {
          id: r.id as string,
          username: nameById.get(r.user_id as string) ?? "?",
          seasons: history.length,
          championships: (r.championships as number) ?? 0,
          fastestDiv1: fastestDiv1Champion(history),
          teamRating: avgRating(r.squad as { overall: number }[]),
          formation: (r.formation_key as string | null) ?? null,
          leagues: (r.leagues as string[]) ?? [],
        };
      })
      .filter((r) => r.seasons > 0);
    setOfflineCareerRows(rows);
  }, []);

  const loadSingleSeason = useCallback(async () => {
    const { data } = await supabase
      .from("results")
      .select("id, user_id, formation, team_rating, points, won, drawn, lost, goals_for, goals_against, league_name, position, users!inner(username)")
      .or("is_career.is.null,is_career.eq.false")
      .or("is_challenge.is.null,is_challenge.eq.false")
      .limit(3000);

    const bestByUser = new Map<string, SingleSeasonRow>();
    for (const r of (data as Record<string, unknown>[]) ?? []) {
      const row: SingleSeasonRow = {
        id: r.id as string,
        username: (r.users as Record<string, string>).username,
        leagueName: r.league_name as string,
        formation: r.formation as string,
        points: r.points as number,
        won: r.won as number,
        drawn: r.drawn as number,
        lost: r.lost as number,
        goalsFor: r.goals_for as number,
        goalsAgainst: r.goals_against as number,
        teamRating: r.team_rating as number,
        position: r.position as number,
      };
      const existing = bestByUser.get(r.user_id as string);
      if (!existing || row.points > existing.points) bestByUser.set(r.user_id as string, row);
    }
    setSingleSeasonRows([...bestByUser.values()]);
  }, []);

  const loadDaily = useCallback(async () => {
    const dayId = getChallengeDayId();
    const { data: todayData } = await supabase
      .from("results")
      .select("id, points, goal_diff, position, team_rating, users!inner(username)")
      .eq("is_challenge", true)
      .eq("challenge_week", dayId)
      .limit(200);
    setDailyTodayRows(
      ((todayData as Record<string, unknown>[]) ?? []).map((r) => ({
        id: r.id as string,
        username: (r.users as Record<string, string>).username,
        points: r.points as number,
        position: r.position as number,
        teamRating: r.team_rating as number,
        goalDiff: r.goal_diff as number,
      })),
    );

    const { data: allData } = await supabase
      .from("results")
      .select("user_id, challenge_week, points, users!inner(username)")
      .eq("is_challenge", true)
      .limit(5000);

    const dayResults = new Map<string, { username: string; points: number }[]>();
    for (const r of (allData as Record<string, unknown>[]) ?? []) {
      const day = r.challenge_week as string;
      if (!day) continue;
      const list = dayResults.get(day) ?? [];
      list.push({ username: (r.users as Record<string, string>).username, points: r.points as number });
      dayResults.set(day, list);
    }
    const winsByUser = new Map<string, number>();
    for (const [, entries] of dayResults) {
      if (entries.length === 0) continue;
      const maxPoints = Math.max(...entries.map((e) => e.points));
      for (const w of entries.filter((e) => e.points === maxPoints)) {
        winsByUser.set(w.username, (winsByUser.get(w.username) ?? 0) + 1);
      }
    }
    setDailyWinRows(
      [...winsByUser.entries()]
        .map(([username, wins]) => ({ username, wins }))
        .sort((a, b) => b.wins - a.wins),
    );
  }, []);

  const loadTab = useCallback(async (t: Tab) => {
    setLoading(true);
    if (t === "myPlayer") await loadMyPlayer();
    else if (t === "onlineCareer") await loadOnlineCareer();
    else if (t === "offlineCareer") await loadOfflineCareer();
    else if (t === "singleSeason") await loadSingleSeason();
    else if (t === "daily") await loadDaily();
    setLoading(false);
  }, [loadMyPlayer, loadOnlineCareer, loadOfflineCareer, loadSingleSeason, loadDaily]);

  useEffect(() => {
    if (loadedTabs.has(tab)) return;
    setLoadedTabs((prev) => new Set(prev).add(tab));
    loadTab(tab);
  }, [tab, loadedTabs, loadTab]);

  const TABS: { id: Tab; label: string; accent: string; icon: React.ReactNode }[] = [
    { id: "myPlayer", label: t("ranglijst.tab.myPlayer"), accent: "rose", icon: <IconStar className="h-4 w-4" /> },
    { id: "onlineCareer", label: t("ranglijst.tab.onlineCareer"), accent: "cyan", icon: <IconGlobe className="h-4 w-4" /> },
    { id: "offlineCareer", label: t("ranglijst.tab.offlineCareer"), accent: "indigo", icon: <IconTrophy className="h-4 w-4" /> },
    { id: "singleSeason", label: t("ranglijst.tab.singleSeason"), accent: "emerald", icon: <IconBall className="h-4 w-4" /> },
    { id: "daily", label: t("ranglijst.tab.daily"), accent: "amber", icon: <IconBolt className="h-4 w-4" /> },
  ];

  const myPlayerColumns: RanglijstColumn<MyPlayerRow>[] = [
    {
      key: "playerName",
      label: t("ranglijst.col.playerName"),
      value: (r) => r.playerName,
      cell: (r) => <span className="font-bold text-slate-800">{r.playerName}</span>,
      defaultDir: "asc",
    },
    {
      key: "username",
      label: t("ranglijst.col.username"),
      value: (r) => r.username,
      cell: (r) => <UserLink username={r.username} />,
      defaultDir: "asc",
    },
    {
      key: "positions",
      label: t("ranglijst.col.positions"),
      value: (r) => [r.position, ...r.extraPositions].map((p) => posLabel(t, p)).join(", "),
      cell: (r) => [r.position, ...r.extraPositions].map((p) => posLabel(t, p)).join(", "),
      defaultDir: "asc",
    },
    {
      key: "rating",
      label: t("ranglijst.col.rating"),
      align: "right",
      value: (r) => r.overall,
      cell: (r) => r.overall,
      defaultDir: "desc",
    },
    {
      key: "seasonsPlayed",
      label: t("ranglijst.col.seasons"),
      align: "right",
      value: (r) => r.seasonsPlayed,
      cell: (r) => r.seasonsPlayed,
      defaultDir: "desc",
    },
    {
      key: "titles",
      label: t("ranglijst.col.titles"),
      align: "right",
      value: (r) => r.championships,
      cell: (r) => r.championships,
      defaultDir: "desc",
    },
  ];

  const singleSeasonColumns: RanglijstColumn<SingleSeasonRow>[] = [
    {
      key: "username",
      label: t("ranglijst.col.player"),
      value: (r) => r.username,
      cell: (r) => <UserLink username={r.username} />,
      defaultDir: "asc",
    },
    {
      key: "competition",
      label: t("ranglijst.col.competition"),
      value: (r) => r.leagueName,
      cell: (r) => <span className="text-slate-500">{r.leagueName}</span>,
      defaultDir: "desc",
    },
    {
      key: "formation",
      label: t("ranglijst.col.formation"),
      value: (r) => fmtFormation(r.formation),
      cell: (r) => (
        <span className="rounded-lg bg-slate-100/80 px-2 py-1 text-[11px] font-bold text-slate-600">
          {fmtFormation(r.formation)}
        </span>
      ),
      defaultDir: "desc",
    },
    {
      key: "points",
      label: t("ranglijst.col.pts"),
      align: "right",
      value: (r) => r.points,
      cell: (r) => r.points,
      defaultDir: "desc",
    },
    {
      key: "record",
      label: t("ranglijst.col.record"),
      align: "center",
      value: (r) => r.won,
      cell: (r) => <span className="text-[11px] text-slate-500">{r.won}-{r.drawn}-{r.lost}</span>,
      defaultDir: "desc",
    },
    {
      key: "gf",
      label: t("ranglijst.col.gf"),
      align: "right",
      value: (r) => r.goalsFor,
      cell: (r) => r.goalsFor,
      defaultDir: "desc",
    },
    {
      key: "ga",
      label: t("ranglijst.col.ga"),
      align: "right",
      value: (r) => r.goalsAgainst,
      cell: (r) => r.goalsAgainst,
      defaultDir: "asc",
    },
    {
      key: "rating",
      label: t("ranglijst.col.rating"),
      align: "right",
      value: (r) => r.teamRating,
      cell: (r) => r.teamRating.toFixed(1),
      defaultDir: "desc",
    },
    {
      key: "position",
      label: t("ranglijst.col.pos"),
      value: (r) => r.position,
      cell: (r) => <PosBadge position={r.position} />,
      defaultDir: "asc",
    },
  ];

  const dailyTodayColumns: RanglijstColumn<DailyTodayRow>[] = [
    {
      key: "username",
      label: t("ranglijst.col.player"),
      value: (r) => r.username,
      cell: (r) => <UserLink username={r.username} />,
      defaultDir: "asc",
    },
    {
      key: "points",
      label: t("ranglijst.col.pts"),
      align: "right",
      value: (r) => r.points,
      cell: (r) => r.points,
      defaultDir: "desc",
    },
    {
      key: "position",
      label: t("ranglijst.col.pos"),
      value: (r) => r.position,
      cell: (r) => <PosBadge position={r.position} />,
      defaultDir: "asc",
    },
    {
      key: "rating",
      label: t("ranglijst.col.rating"),
      align: "right",
      value: (r) => r.teamRating,
      cell: (r) => r.teamRating.toFixed(1),
      defaultDir: "desc",
    },
    {
      key: "goalDiff",
      label: t("ranglijst.col.gd"),
      align: "right",
      value: (r) => r.goalDiff,
      cell: (r) => (r.goalDiff >= 0 ? "+" : "") + r.goalDiff,
      defaultDir: "desc",
    },
  ];

  const dailyWinColumns: RanglijstColumn<DailyWinRow>[] = [
    {
      key: "username",
      label: t("ranglijst.col.player"),
      value: (r) => r.username,
      cell: (r) => <UserLink username={r.username} />,
      defaultDir: "asc",
    },
    {
      key: "wins",
      label: t("ranglijst.col.dailyWins"),
      align: "right",
      value: (r) => r.wins,
      cell: (r) => r.wins,
      defaultDir: "desc",
    },
  ];

  return (
    <main className="min-h-screen w-full pb-12">
      <Header backHref="/" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800">{t("ranglijst.title")}</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                tab === tb.id ? "bg-white shadow-sm border border-slate-200/60 text-slate-800" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tb.icon}
              {tb.label}
            </button>
          ))}
        </div>

        {tab === "daily" && (
          <div className="flex flex-wrap gap-2 mb-5">
            {(["today", "wins"] as DailySubTab[]).map((s) => (
              <button
                key={s}
                onClick={() => setDailySubTab(s)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  dailySubTab === s
                    ? "bg-amber-400 text-white shadow-[0_3px_0_#c98a10]"
                    : "bg-white/70 border border-slate-200/60 text-slate-500 hover:bg-white hover:shadow-sm backdrop-blur"
                }`}
              >
                {t(s === "today" ? "ranglijst.subtab.today" : "ranglijst.subtab.wins")}
              </button>
            ))}
          </div>
        )}

        <div className="card overflow-hidden">
          {loading && !loadedTabs.has(tab) ? (
            <div className="p-12 text-center text-sm text-slate-400">{t("common.loading")}</div>
          ) : tab === "myPlayer" ? (
            <SortableTable
              key="myPlayer"
              rows={myPlayerRows}
              columns={myPlayerColumns}
              rowKey={(r) => r.id}
              initialSortKey="rating"
              initialSortDir="desc"
              emptyIcon={<IconStar className="h-6 w-6" />}
              emptyText={t("ranglijst.empty.myPlayer")}
            />
          ) : tab === "onlineCareer" ? (
            <SortableTable
              key="onlineCareer"
              rows={onlineCareerRows}
              columns={careerColumns(t)}
              rowKey={(r) => r.id}
              initialSortKey="fastest"
              initialSortDir="asc"
              headerClassName="bg-cyan-50/50 text-cyan-600"
              rowClassName="border-t border-cyan-100/60 text-slate-600 transition hover:bg-cyan-50/30"
              emptyIcon={<IconGlobe className="h-6 w-6" />}
              emptyText={t("ranglijst.empty.onlineCareer")}
            />
          ) : tab === "offlineCareer" ? (
            <SortableTable
              key="offlineCareer"
              rows={offlineCareerRows}
              columns={careerColumns(t)}
              rowKey={(r) => r.id}
              initialSortKey="fastest"
              initialSortDir="asc"
              headerClassName="bg-indigo-50/50 text-indigo-600"
              rowClassName="border-t border-indigo-100/60 text-slate-600 transition hover:bg-indigo-50/30"
              emptyIcon={<IconTrophy className="h-6 w-6" />}
              emptyText={t("ranglijst.empty.offlineCareer")}
            />
          ) : tab === "singleSeason" ? (
            <SortableTable
              key="singleSeason"
              rows={singleSeasonRows}
              columns={singleSeasonColumns}
              rowKey={(r) => r.id}
              initialSortKey="points"
              initialSortDir="desc"
              emptyIcon={<IconBall className="h-6 w-6" />}
              emptyText={t("ranglijst.empty.singleSeason")}
            />
          ) : dailySubTab === "today" ? (
            <>
              <div className="px-5 py-3 border-b border-slate-100/60 flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-amber-800">{t("ranglijst.dailyChallenge")}</span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                  {challenge.leagueFlag} {challenge.leagueName}
                </span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                  {challenge.formationLabel}
                </span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                  {challenge.ratingMode === "prime" ? t("ranglijst.ratingMode.prime") : t("ranglijst.ratingMode.current")}
                </span>
              </div>
              <SortableTable
                key="dailyToday"
                rows={dailyTodayRows}
                columns={dailyTodayColumns}
                rowKey={(r) => r.id}
                initialSortKey="points"
                initialSortDir="desc"
                headerClassName="bg-amber-50/50 text-amber-600"
                rowClassName="border-t border-amber-100/60 text-slate-600 transition hover:bg-amber-50/30"
                emptyIcon={<IconBolt className="h-6 w-6" />}
                emptyText={t("ranglijst.empty.today")}
              />
            </>
          ) : (
            <SortableTable
              key="dailyWins"
              rows={dailyWinRows}
              columns={dailyWinColumns}
              rowKey={(r) => r.username}
              initialSortKey="wins"
              initialSortDir="desc"
              headerClassName="bg-amber-50/50 text-amber-600"
              rowClassName="border-t border-amber-100/60 text-slate-600 transition hover:bg-amber-50/30"
              emptyIcon={<IconTrophy className="h-6 w-6" />}
              emptyText={t("ranglijst.empty.wins")}
            />
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
