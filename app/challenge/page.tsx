"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useGame } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { getCurrentChallenge, getChallengeDayId } from "@/lib/challenge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface ChallengeRow {
  id: string;
  username: string;
  points: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  position: number;
}

interface DailyWinRow {
  username: string;
  wins: number;
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

export default function ChallengePage() {
  const router = useRouter();
  const userId = useAuth((s) => s.userId);
  const startChallenge = useGame((s) => s.startChallenge);
  const loaded = useGame((s) => s.index.length > 0);
  const challenge = getCurrentChallenge();
  const dayId = getChallengeDayId();

  const [challengePlayed, setChallengePlayed] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [todayRows, setTodayRows] = useState<ChallengeRow[]>([]);
  const [dailyWinRows, setDailyWinRows] = useState<DailyWinRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    if (userId) {
      const { data } = await supabase
        .from("results")
        .select("points")
        .eq("user_id", userId)
        .eq("challenge_week", dayId)
        .eq("is_challenge", true)
        .limit(1);
      setChallengePlayed(data && data.length > 0 ? data[0].points : null);
    }
    setChecked(true);

    const { data: cData } = await supabase
      .from("results")
      .select("id, points, goals_for, goals_against, goal_diff, position, users!inner(username)")
      .eq("is_challenge", true)
      .eq("challenge_week", dayId)
      .order("points", { ascending: false })
      .limit(100);

    if (cData) {
      setTodayRows((cData as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        username: (r.users as Record<string, string>).username,
        points: r.points as number,
        goals_for: r.goals_for as number,
        goals_against: r.goals_against as number,
        goal_diff: r.goal_diff as number,
        position: r.position as number,
      })));
    }

    const { data: allChallenges } = await supabase
      .from("results")
      .select("challenge_week, points, users!inner(username)")
      .eq("is_challenge", true)
      .limit(2000);

    if (allChallenges) {
      const dayResults = new Map<string, { username: string; points: number }[]>();
      for (const r of allChallenges as Record<string, unknown>[]) {
        const day = r.challenge_week as string;
        if (!day) continue;
        const list = dayResults.get(day) || [];
        list.push({ username: (r.users as Record<string, string>).username, points: r.points as number });
        dayResults.set(day, list);
      }
      const winsByUser = new Map<string, DailyWinRow>();
      for (const [, entries] of dayResults) {
        if (entries.length === 0) continue;
        const maxPoints = Math.max(...entries.map((e) => e.points));
        for (const w of entries.filter((e) => e.points === maxPoints)) {
          const existing = winsByUser.get(w.username);
          if (existing) existing.wins++;
          else winsByUser.set(w.username, { username: w.username, wins: 1 });
        }
      }
      setDailyWinRows([...winsByUser.values()].sort((a, b) => b.wins - a.wins));
    }

    setLoading(false);
  }, [userId, dayId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePlay = () => {
    if (!loaded || challengePlayed !== null) return;
    startChallenge(challenge.leagueCode, challenge.formationKey, challenge.ratingMode, challenge.difficulty, challenge.day);
    router.push("/");
  };

  return (
    <main className="min-h-screen w-full pb-12">
      <Header backHref="/" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🏅</div>
          <h1 className="text-2xl font-black text-slate-800">Challenge van de dag</h1>
          <p className="mt-2 text-sm text-slate-500">Iedereen speelt dezelfde competitie en formatie. Vergelijk je score!</p>
        </div>

        <div className="card p-6 mb-6 border-2 border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-orange-50/50">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-amber-800">
              {challenge.leagueFlag} {challenge.leagueName}
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-amber-800">
              {challenge.formationLabel}
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-amber-800">
              {challenge.ratingMode === "prime" ? "Prime rating" : "Actuele rating"}
            </span>
          </div>

          {!checked ? (
            <div className="text-sm text-slate-400">Laden…</div>
          ) : !userId ? (
            <p className="text-sm text-amber-700">Log in om de challenge te spelen.</p>
          ) : challengePlayed !== null ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-amber-800">Al gespeeld vandaag!</span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">{challengePlayed} punten</span>
            </div>
          ) : (
            <button
              disabled={!loaded}
              onClick={handlePlay}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3.5 text-base font-extrabold text-white shadow-md shadow-amber-200/50 transition hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-40"
            >
              {loaded ? "Speel de challenge" : "Laden…"}
            </button>
          )}
        </div>

        <div className="card overflow-hidden mb-4">
          <div className="px-5 py-3 border-b border-amber-100/60 text-sm font-bold text-amber-800">🏅 Ranglijst van vandaag</div>
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">Laden…</div>
          ) : todayRows.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-3xl mb-3">🏅</div>
              <div className="text-sm text-slate-400">Nog niemand heeft de challenge vandaag gespeeld.</div>
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
                    <th className="px-3 py-3 text-left">Pos</th>
                  </tr>
                </thead>
                <tbody>
                  {todayRows.map((r, i) => (
                    <tr key={r.id} className="border-t border-amber-100/60 text-slate-600 transition hover:bg-amber-50/30">
                      <td className="px-4 py-3"><RankBadge rank={i + 1} /></td>
                      <td className="px-3 py-3 font-bold text-slate-800">{r.username}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-black text-amber-700">{r.points}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{r.goals_for}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{r.goals_against}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-400">{(r.goal_diff >= 0 ? "+" : "")}{r.goal_diff}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex h-6 min-w-[2rem] items-center justify-center rounded-full px-2 text-[10px] font-bold ${
                          r.position === 1 ? "bg-amber-100/80 text-amber-700" : r.position <= 4 ? "bg-emerald-100/80 text-emerald-700" : "bg-slate-100/80 text-slate-500"
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
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-100/60 text-sm font-bold text-amber-800">🏆 Meeste dagoverwinningen (aller tijden)</div>
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">Laden…</div>
          ) : dailyWinRows.length === 0 ? (
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
                    <th className="px-3 py-3 text-right">Overwinningen</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyWinRows.map((r, i) => (
                    <tr key={r.username} className="border-t border-amber-100/60 text-slate-600 transition hover:bg-amber-50/30">
                      <td className="px-4 py-3"><RankBadge rank={i + 1} /></td>
                      <td className="px-3 py-3 font-bold text-slate-800">{r.username}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-black text-amber-700">{r.wins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
