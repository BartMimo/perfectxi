"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FORMATIONS } from "@/lib/formations";
import { getCurrentChallenge, getChallengeDayId } from "@/lib/challenge";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

type Tab = "records" | "accounts" | "challenge" | "career" | "dailywins";
type RecordSort = "points" | "goals_for" | "goals_against" | "team_rating" | "team_value";
type AccountSort = "achievements" | "champions";

interface GameRow {
  id: string;
  username: string;
  formation: string;
  team_rating: number;
  team_value: number;
  points: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  league_name: string;
  position: number;
}

interface AccountRow {
  username: string;
  games: number;
  champions: number;
  unique_achievements: string[];
}

interface CareerRow {
  username: string;
  seasons: number;
  championships: number;
  bestDivision: number;
  seasonsToDiv1Champ: number | null;
}

interface ChallengeRow {
  id: string;
  username: string;
  points: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  position: number;
  team_rating: number;
}

interface DailyWinRow {
  username: string;
  wins: number;
}

function UserLink({ username }: { username: string }) {
  return (
    <a
      href={`/profiel/${encodeURIComponent(username)}`}
      className="font-bold text-slate-800 hover:text-indigo-600 transition"
    >
      {username}
    </a>
  );
}

export default function RanglijstPage() {
  const [tab, setTab] = useState<Tab>("records");
  const [gameRows, setGameRows] = useState<GameRow[]>([]);
  const [accountRows, setAccountRows] = useState<AccountRow[]>([]);
  const [challengeRows, setChallengeRows] = useState<ChallengeRow[]>([]);
  const [careerRows, setCareerRows] = useState<CareerRow[]>([]);
  const [dailyWinRows, setDailyWinRows] = useState<DailyWinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordSort, setRecordSort] = useState<RecordSort>("points");
  const [accountSort, setAccountSort] = useState<AccountSort>("achievements");
  const challenge = getCurrentChallenge();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("results")
      .select("id, user_id, formation, team_rating, team_value, points, won, drawn, lost, goals_for, goals_against, goal_diff, league_name, position, achievements, users!inner(username)")
      .or("is_career.is.null,is_career.eq.false")
      .limit(500);

    if (data) {
      const games: GameRow[] = (data as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        username: (r.users as Record<string, string>).username,
        formation: r.formation as string,
        team_rating: r.team_rating as number,
        team_value: r.team_value as number,
        points: r.points as number,
        won: r.won as number,
        drawn: r.drawn as number,
        lost: r.lost as number,
        goals_for: r.goals_for as number,
        goals_against: r.goals_against as number,
        goal_diff: r.goal_diff as number,
        league_name: r.league_name as string,
        position: r.position as number,
      }));
      setGameRows(games);

      const byUser = new Map<string, AccountRow>();
      for (const r of data as Record<string, unknown>[]) {
        const uid = r.user_id as string;
        const username = (r.users as Record<string, string>).username;
        let u = byUser.get(uid);
        if (!u) {
          u = { username, games: 0, champions: 0, unique_achievements: [] };
          byUser.set(uid, u);
        }
        u.games++;
        if ((r.position as number) === 1) u.champions++;
        for (const a of ((r.achievements as string[]) ?? [])) {
          if (!u.unique_achievements.includes(a)) u.unique_achievements.push(a);
        }
      }
      setAccountRows([...byUser.values()]);
    }

    // Fetch challenge results for today
    const dayId = getChallengeDayId();
    const { data: cData } = await supabase
      .from("results")
      .select("id, points, goals_for, goals_against, goal_diff, position, team_rating, users!inner(username)")
      .eq("is_challenge", true)
      .eq("challenge_week", dayId)
      .order("points", { ascending: false })
      .limit(100);

    if (cData) {
      setChallengeRows((cData as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        username: (r.users as Record<string, string>).username,
        points: r.points as number,
        goals_for: r.goals_for as number,
        goals_against: r.goals_against as number,
        goal_diff: r.goal_diff as number,
        position: r.position as number,
        team_rating: r.team_rating as number,
      })));
    }

    // Fetch career data
    const { data: carData } = await supabase
      .from("results")
      .select("user_id, career_division, career_season, position, users!inner(username)")
      .eq("is_career", true)
      .limit(500);

    if (carData) {
      const byUser = new Map<string, CareerRow>();
      for (const r of carData as Record<string, unknown>[]) {
        const uid = r.user_id as string;
        const username = (r.users as Record<string, string>).username;
        let u = byUser.get(uid);
        if (!u) {
          u = { username, seasons: 0, championships: 0, bestDivision: 10, seasonsToDiv1Champ: null };
          byUser.set(uid, u);
        }
        u.seasons++;
        const div = r.career_division as number;
        const season = r.career_season as number;
        if ((r.position as number) === 1) {
          u.championships++;
          if (div === 1 && (u.seasonsToDiv1Champ === null || season < u.seasonsToDiv1Champ)) {
            u.seasonsToDiv1Champ = season;
          }
        }
        if (div < u.bestDivision) u.bestDivision = div;
      }
      setCareerRows([...byUser.values()].sort((a, b) => {
        if (a.seasonsToDiv1Champ !== null && b.seasonsToDiv1Champ !== null) return a.seasonsToDiv1Champ - b.seasonsToDiv1Champ;
        if (a.seasonsToDiv1Champ !== null) return -1;
        if (b.seasonsToDiv1Champ !== null) return 1;
        return a.bestDivision - b.bestDivision || b.championships - a.championships;
      }));
    }

    // Fetch daily challenge wins (best score per day, count #1 finishes)
    const { data: allChallenges } = await supabase
      .from("results")
      .select("user_id, challenge_week, points, users!inner(username)")
      .eq("is_challenge", true)
      .limit(2000);

    if (allChallenges) {
      // Group by day, find winner(s)
      const dayResults = new Map<string, { userId: string; username: string; points: number }[]>();
      for (const r of allChallenges as Record<string, unknown>[]) {
        const day = r.challenge_week as string;
        if (!day) continue;
        const list = dayResults.get(day) || [];
        list.push({
          userId: r.user_id as string,
          username: (r.users as Record<string, string>).username,
          points: r.points as number,
        });
        dayResults.set(day, list);
      }

      const winsByUser = new Map<string, DailyWinRow>();
      for (const [, entries] of dayResults) {
        if (entries.length === 0) continue;
        const maxPoints = Math.max(...entries.map((e) => e.points));
        const winners = entries.filter((e) => e.points === maxPoints);
        for (const w of winners) {
          const existing = winsByUser.get(w.username);
          if (existing) {
            existing.wins++;
          } else {
            winsByUser.set(w.username, { username: w.username, wins: 1 });
          }
        }
      }
      setDailyWinRows([...winsByUser.values()].sort((a, b) => b.wins - a.wins));
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sortedGames = [...gameRows].sort((a, b) => {
    if (recordSort === "points") return b.points - a.points || b.goal_diff - a.goal_diff;
    if (recordSort === "goals_for") return b.goals_for - a.goals_for;
    if (recordSort === "goals_against") return a.goals_against - b.goals_against;
    if (recordSort === "team_rating") return b.team_rating - a.team_rating;
    return b.team_value - a.team_value;
  });

  const sortedAccounts = [...accountRows].sort((a, b) => {
    if (accountSort === "achievements") return b.unique_achievements.length - a.unique_achievements.length;
    return b.champions - a.champions || b.unique_achievements.length - a.unique_achievements.length;
  });

  const RECORD_SORTS: { key: RecordSort; label: string }[] = [
    { key: "points", label: "Punten" },
    { key: "goals_for", label: "Goals voor" },
    { key: "goals_against", label: "Goals tegen" },
    { key: "team_rating", label: "Rating" },
    { key: "team_value", label: "Waarde" },
  ];

  const ACCOUNT_SORTS: { key: AccountSort; label: string }[] = [
    { key: "achievements", label: "Achievements" },
    { key: "champions", label: "Kampioenschappen" },
  ];

  const TabButton = ({ id, label, accent }: { id: Tab; label: string; accent?: string }) => (
    <button
      onClick={() => setTab(id)}
      className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${
        tab === id
          ? accent || "bg-white shadow-sm border border-slate-200/60 text-slate-800"
          : accent ? accent.replace("bg-", "text-").replace("shadow-sm border border-", "hover:text-").split(" ").slice(0, 2).join(" ") : "text-slate-400 hover:text-slate-600"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="min-h-screen w-full pb-12">
      <Header backHref="/" />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800">Ranglijst</h1>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setTab("records")}
            className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${
              tab === "records" ? "bg-white shadow-sm border border-slate-200/60 text-slate-800" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Seizoenen
          </button>
          <button
            onClick={() => setTab("accounts")}
            className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${
              tab === "accounts" ? "bg-white shadow-sm border border-slate-200/60 text-slate-800" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Spelers
          </button>
          <button
            onClick={() => setTab("challenge")}
            className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${
              tab === "challenge" ? "bg-amber-50 shadow-sm border border-amber-200/60 text-amber-800" : "text-amber-500 hover:text-amber-700"
            }`}
          >
            🏅 Daily
          </button>
          <button
            onClick={() => setTab("dailywins")}
            className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${
              tab === "dailywins" ? "bg-amber-50 shadow-sm border border-amber-200/60 text-amber-800" : "text-amber-500 hover:text-amber-700"
            }`}
          >
            🏆 Daily Wins
          </button>
          <button
            onClick={() => setTab("career")}
            className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${
              tab === "career" ? "bg-indigo-50 shadow-sm border border-indigo-200/60 text-indigo-800" : "text-indigo-500 hover:text-indigo-700"
            }`}
          >
            🏟️ Carrière
          </button>
        </div>

        {/* Sort pills */}
        {tab !== "challenge" && tab !== "career" && tab !== "dailywins" && <div className="flex flex-wrap gap-2 mb-5">
          {(tab === "records" ? RECORD_SORTS : ACCOUNT_SORTS).map((opt) => (
            <button
              key={opt.key}
              onClick={() => tab === "records" ? setRecordSort(opt.key as RecordSort) : setAccountSort(opt.key as AccountSort)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                (tab === "records" ? recordSort : accountSort) === opt.key
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md shadow-emerald-100"
                  : "bg-white/70 border border-slate-200/60 text-slate-500 hover:bg-white hover:shadow-sm backdrop-blur"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>}

        {/* Content */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">Laden…</div>
          ) : tab === "dailywins" ? (
            dailyWinRows.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-3xl mb-3">🏆</div>
                <div className="text-sm text-slate-400">Nog geen daily challenge winnaars.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-amber-50/50 text-[10px] uppercase tracking-widest text-amber-600">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-3 py-3 text-left">Speler</th>
                      <th className="px-3 py-3 text-right">Daily wins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyWinRows.map((r, i) => (
                      <tr key={r.username} className="border-t border-amber-100/60 text-slate-600 transition hover:bg-amber-50/30">
                        <td className="px-4 py-3"><RankBadge rank={i + 1} /></td>
                        <td className="px-3 py-3"><UserLink username={r.username} /></td>
                        <td className="px-3 py-3 text-right tabular-nums font-black text-amber-700">{r.wins}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : tab === "career" ? (
            careerRows.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-3xl mb-3">🏟️</div>
                <div className="text-sm text-slate-400">Nog niemand heeft een carrière gestart.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-indigo-50/50 text-[10px] uppercase tracking-widest text-indigo-600">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-3 py-3 text-left">Speler</th>
                      <th className="px-3 py-3 text-right">Seizoenen</th>
                      <th className="px-3 py-3 text-right">Titels</th>
                      <th className="px-3 py-3 text-right">Beste divisie</th>
                      <th className="px-3 py-3 text-right">Div 1 in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {careerRows.map((r, i) => (
                      <tr key={r.username} className="border-t border-indigo-100/60 text-slate-600 transition hover:bg-indigo-50/30">
                        <td className="px-4 py-3"><RankBadge rank={i + 1} /></td>
                        <td className="px-3 py-3"><UserLink username={r.username} /></td>
                        <td className="px-3 py-3 text-right tabular-nums">{r.seasons}</td>
                        <td className="px-3 py-3 text-right tabular-nums font-semibold text-amber-600">{r.championships}</td>
                        <td className="px-3 py-3 text-right">
                          <span className={`inline-flex min-w-[3rem] items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            r.bestDivision <= 3 ? "bg-amber-100/80 text-amber-700" :
                            r.bestDivision <= 6 ? "bg-emerald-100/80 text-emerald-700" :
                            "bg-slate-100/80 text-slate-500"
                          }`}>
                            Div {r.bestDivision}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          {r.seasonsToDiv1Champ !== null ? (
                            <span className="inline-flex items-center justify-center rounded-full bg-amber-100/80 px-2.5 py-1 text-[10px] font-black text-amber-700">
                              {r.seasonsToDiv1Champ} szn
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : tab === "challenge" ? (
            <>
              <div className="px-5 py-3 border-b border-slate-100/60 flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-amber-800">🏅 Daily Challenge</span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                  {challenge.leagueFlag} {challenge.leagueName}
                </span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                  {challenge.formationLabel}
                </span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                  {challenge.ratingMode === "prime" ? "Prime" : "Actueel"}
                </span>
              </div>
              {challengeRows.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-3xl mb-3">🏅</div>
                  <div className="text-sm text-slate-400">Nog niemand heeft de daily challenge gespeeld vandaag.</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-amber-50/50 text-[10px] uppercase tracking-widest text-amber-600">
                      <tr>
                        <th className="px-4 py-3 text-left">#</th>
                        <th className="px-3 py-3 text-left">Speler</th>
                        <th className="px-3 py-3 text-right">Ptn</th>
                        <th className="px-3 py-3 text-right">GV</th>
                        <th className="px-3 py-3 text-right">GT</th>
                        <th className="px-3 py-3 text-right">DS</th>
                        <th className="px-3 py-3 text-right">Rating</th>
                        <th className="px-3 py-3 text-left">Pos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {challengeRows.map((r, i) => (
                        <tr key={r.id} className="border-t border-amber-100/60 text-slate-600 transition hover:bg-amber-50/30">
                          <td className="px-4 py-3"><RankBadge rank={i + 1} /></td>
                          <td className="px-3 py-3"><UserLink username={r.username} /></td>
                          <td className="px-3 py-3 text-right tabular-nums font-black text-amber-700">{r.points}</td>
                          <td className="px-3 py-3 text-right tabular-nums">{r.goals_for}</td>
                          <td className="px-3 py-3 text-right tabular-nums">{r.goals_against}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-slate-400">{(r.goal_diff >= 0 ? "+" : "")}{r.goal_diff}</td>
                          <td className="px-3 py-3 text-right tabular-nums">{r.team_rating.toFixed(1)}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex h-6 min-w-[2rem] items-center justify-center rounded-full px-2 text-[10px] font-bold ${
                              r.position === 1 ? "bg-amber-100/80 text-amber-700"
                                : r.position <= 4 ? "bg-emerald-100/80 text-emerald-700"
                                : "bg-slate-100/80 text-slate-500"
                            }`}>
                              {r.position}e
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : tab === "records" ? (
            sortedGames.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50/80 text-[10px] uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-3 py-3 text-left">Speler</th>
                      <th className="px-3 py-3 text-left">Competitie</th>
                      <th className="px-3 py-3 text-left">Formatie</th>
                      <th className="px-3 py-3 text-right">Ptn</th>
                      <th className="px-3 py-3 text-center">Record</th>
                      <th className="px-3 py-3 text-right">GV</th>
                      <th className="px-3 py-3 text-right">GT</th>
                      <th className="px-3 py-3 text-right">Rating</th>
                      <th className="px-3 py-3 text-right">Waarde</th>
                      <th className="px-3 py-3 text-left">Pos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedGames.map((r, i) => (
                      <tr key={r.id} className="border-t border-slate-100/60 text-slate-600 transition hover:bg-emerald-50/30">
                        <td className="px-4 py-3">
                          <RankBadge rank={i + 1} />
                        </td>
                        <td className="px-3 py-3"><UserLink username={r.username} /></td>
                        <td className="px-3 py-3 text-slate-500 truncate max-w-[120px]">{r.league_name}</td>
                        <td className="px-3 py-3">
                          <span className="rounded-lg bg-slate-100/80 px-2 py-1 text-[11px] font-bold text-slate-600">
                            {fmtFormation(r.formation)}
                          </span>
                        </td>
                        <td className={`px-3 py-3 text-right tabular-nums font-semibold ${recordSort === "points" ? "font-black text-emerald-600" : ""}`}>{r.points}</td>
                        <td className="px-3 py-3 text-center tabular-nums text-[11px] text-slate-500">{r.won}-{r.drawn}-{r.lost}</td>
                        <td className={`px-3 py-3 text-right tabular-nums ${recordSort === "goals_for" ? "font-black text-emerald-600" : ""}`}>{r.goals_for}</td>
                        <td className={`px-3 py-3 text-right tabular-nums ${recordSort === "goals_against" ? "font-black text-emerald-600" : ""}`}>{r.goals_against}</td>
                        <td className={`px-3 py-3 text-right tabular-nums ${recordSort === "team_rating" ? "font-black text-emerald-600" : ""}`}>{r.team_rating.toFixed(1)}</td>
                        <td className={`px-3 py-3 text-right tabular-nums ${recordSort === "team_value" ? "font-black text-emerald-600" : "text-slate-400"}`}>{fmtValue(r.team_value)}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex h-6 min-w-[2rem] items-center justify-center rounded-full px-2 text-[10px] font-bold ${
                            r.position === 1 ? "bg-amber-100/80 text-amber-700"
                              : r.position <= 4 ? "bg-emerald-100/80 text-emerald-700"
                              : r.position >= 18 ? "bg-rose-100/80 text-rose-600"
                              : "bg-slate-100/80 text-slate-500"
                          }`}>
                            {r.position}e
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            sortedAccounts.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50/80 text-[10px] uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-3 py-3 text-left">Speler</th>
                      <th className="px-3 py-3 text-right">Gespeeld</th>
                      <th className="px-3 py-3 text-right">Titels</th>
                      <th className="px-3 py-3 text-right">Achievements</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAccounts.map((r, i) => (
                      <tr key={r.username} className="border-t border-slate-100/60 text-slate-600 transition hover:bg-emerald-50/30">
                        <td className="px-4 py-3">
                          <RankBadge rank={i + 1} />
                        </td>
                        <td className="px-3 py-3"><UserLink username={r.username} /></td>
                        <td className="px-3 py-3 text-right tabular-nums">{r.games}</td>
                        <td className={`px-3 py-3 text-right tabular-nums font-semibold ${accountSort === "champions" ? "font-black text-amber-600" : "text-amber-600"}`}>
                          {r.champions}
                        </td>
                        <td className={`px-3 py-3 text-right tabular-nums font-semibold ${accountSort === "achievements" ? "font-black text-emerald-600" : ""}`}>
                          {r.unique_achievements.length} / 17
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white ${
        rank === 1 ? "bg-amber-400" : rank === 2 ? "bg-slate-400" : "bg-amber-600"
      }`}>
        {rank}
      </span>
    );
  }
  return <span className="pl-1.5 font-bold text-slate-400">{rank}</span>;
}

function EmptyState() {
  return (
    <div className="p-12 text-center">
      <div className="text-3xl mb-3">🏟️</div>
      <div className="text-sm text-slate-400">Nog geen resultaten. Speel een potje!</div>
    </div>
  );
}

function fmtFormation(key: string): string {
  return FORMATIONS.find((f) => f.key === key)?.label ?? key;
}

function fmtValue(mv: number): string {
  if (mv >= 1_000_000) return `€${(mv / 1_000_000).toFixed(0)}M`;
  if (mv >= 1000) return `€${(mv / 1000).toFixed(0)}K`;
  return `€${Math.round(mv)}`;
}
