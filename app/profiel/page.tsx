"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ALL_ACHIEVEMENTS } from "@/lib/achievements";
import { LEAGUES } from "@/lib/leagues";
import Footer from "@/components/Footer";

interface Stats {
  games: number;
  champions: number;
  bestPoints: number;
  bestGf: number;
  leastGa: number;
  bestRating: number;
  bestValue: number;
  unlockedAchievements: Set<string>;
  champLeagues: Set<string>;
  div1Champ: boolean;
  dailyWins: number;
}

export default function ProfielPage() {
  const userId = useAuth((s) => s.userId);
  const username = useAuth((s) => s.username);
  const restore = useAuth((s) => s.restore);
  const [stats, setStats] = useState<Stats | null>(null);
  const [achievementPcts, setAchievementPcts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [expandedAch, setExpandedAch] = useState<string | null>(null);

  useEffect(() => { restore(); }, [restore]);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Fetch all results globally for achievement percentages
    const { data: allResults } = await supabase
      .from("results")
      .select("user_id, achievements")
      .limit(1000);

    if (allResults && allResults.length > 0) {
      const userAchs = new Map<string, Set<string>>();
      for (const r of allResults) {
        const uid = r.user_id as string;
        if (!userAchs.has(uid)) userAchs.set(uid, new Set());
        for (const a of ((r.achievements as string[]) ?? [])) {
          userAchs.get(uid)!.add(a);
        }
      }
      const totalUsers = userAchs.size;
      const pcts: Record<string, number> = {};
      for (const ach of ALL_ACHIEVEMENTS) {
        const count = [...userAchs.values()].filter((s) => s.has(ach.id)).length;
        pcts[ach.id] = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
      }
      setAchievementPcts(pcts);
    }

    const { data } = await supabase
      .from("results")
      .select("points, goals_for, goals_against, team_rating, team_value, position, achievements, league_code, is_career, career_division, is_challenge, challenge_week")
      .eq("user_id", userId);

    if (data && data.length > 0) {
      const nonCareer = data.filter((r: Record<string, unknown>) => !r.is_career && !r.is_challenge);
      const s: Stats = {
        games: nonCareer.length,
        champions: 0,
        bestPoints: 0,
        bestGf: 0,
        leastGa: 9999,
        bestRating: 0,
        bestValue: 0,
        unlockedAchievements: new Set(),
        champLeagues: new Set(),
        div1Champ: false,
        dailyWins: 0,
      };
      for (const r of nonCareer) {
        if (r.position === 1) {
          s.champions++;
          if (r.league_code) s.champLeagues.add(r.league_code as string);
        }
        s.bestPoints = Math.max(s.bestPoints, r.points);
        s.bestGf = Math.max(s.bestGf, r.goals_for);
        s.leastGa = Math.min(s.leastGa, r.goals_against);
        s.bestRating = Math.max(s.bestRating, r.team_rating);
        s.bestValue = Math.max(s.bestValue, r.team_value);
        for (const a of (r.achievements ?? [])) {
          s.unlockedAchievements.add(a);
        }
      }
      // Check div1 champ from career results
      for (const r of data) {
        if ((r as Record<string, unknown>).is_career && r.career_division === 1 && r.position === 1) {
          s.div1Champ = true;
        }
        // Career achievements still count
        if ((r as Record<string, unknown>).is_career) {
          for (const a of (r.achievements ?? [])) {
            s.unlockedAchievements.add(a);
          }
        }
      }
      // Count daily wins — fetch all challenge results for days this user played
      const challengeDays = data
        .filter((r: Record<string, unknown>) => r.is_challenge && r.challenge_week)
        .map((r) => r.challenge_week as string);
      const uniqueDays = [...new Set(challengeDays)];
      if (uniqueDays.length > 0) {
        const { data: allDayResults } = await supabase
          .from("results")
          .select("user_id, challenge_week, points")
          .eq("is_challenge", true)
          .in("challenge_week", uniqueDays);
        if (allDayResults) {
          const dayBest = new Map<string, number>();
          for (const r of allDayResults) {
            const day = r.challenge_week as string;
            dayBest.set(day, Math.max(dayBest.get(day) ?? 0, r.points as number));
          }
          const myByDay = new Map<string, number>();
          for (const r of data.filter((r: Record<string, unknown>) => r.is_challenge)) {
            const day = r.challenge_week as string;
            myByDay.set(day, Math.max(myByDay.get(day) ?? 0, r.points as number));
          }
          for (const [day, myPts] of myByDay) {
            if (myPts === dayBest.get(day)) s.dailyWins++;
          }
        }
      }
      if (s.dailyWins > 0) s.unlockedAchievements.add("dailywinner");

      setStats(s);
    } else {
      setStats(null);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (!userId) {
    return (
      <main className="min-h-screen w-full pb-12">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <p className="text-slate-500">Je bent niet ingelogd.</p>
          <a href="/" className="btn-primary mt-4 inline-block">Ga naar home</a>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full pb-12">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-start justify-between mb-8">
          <div className="animate-fade-up">
            <a href="/" className="text-base font-black tracking-tight">
              <span className="bg-gradient-to-r from-emerald-600 to-cyan-500 bg-clip-text text-transparent">
                Elite Football
              </span>
            </a>
            <h1 className="text-3xl font-black text-slate-800 mt-1">{username}</h1>
            <p className="text-sm text-slate-400 mt-1">Jouw profiel en statistieken</p>
          </div>
          <a href="/" className="btn-secondary mt-1">Speel</a>
        </div>

        <TeamNameEditor />

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Laden…</div>
        ) : !stats ? (
          <div className="card p-12 text-center">
            <div className="text-3xl mb-3">🏟️</div>
            <div className="text-sm text-slate-400">Nog geen seizoenen gespeeld.</div>
          </div>
        ) : (
          <>
            <div className="card p-5 mb-4">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Statistieken</div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatBox label="Gespeeld" value={stats.games} />
                <StatBox label="Kampioen" value={`${stats.champions}x`} accent />
                <StatBox label="Meeste punten" value={stats.bestPoints} />
                <StatBox label="Meeste goals" value={stats.bestGf} />
                <StatBox label="Minste tegen" value={stats.leastGa === 9999 ? "—" : stats.leastGa} />
                <StatBox label="Beste rating" value={stats.bestRating.toFixed(1)} />
                <StatBox label="Beste waarde" value={fmtValue(stats.bestValue)} />
                <StatBox label="Daily wins" value={stats.dailyWins} accent />
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Achievements</div>
                <span className="text-xs font-bold text-emerald-600">{stats.unlockedAchievements.size} / {ALL_ACHIEVEMENTS.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ALL_ACHIEVEMENTS.map((a) => {
                  const isChampion = a.id === "champion";
                  const isDiv1 = a.id === "div1champ";
                  const unlocked = isChampion
                    ? stats.champLeagues.size >= LEAGUES.length
                    : isDiv1
                      ? stats.div1Champ
                      : stats.unlockedAchievements.has(a.id);
                  const pct = achievementPcts[a.id] ?? 0;
                  const expanded = expandedAch === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setExpandedAch(expanded ? null : a.id)}
                      className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                        unlocked
                          ? "border-amber-200/60 bg-amber-50/80"
                          : isChampion && stats.champLeagues.size > 0
                            ? "border-amber-200/40 bg-amber-50/40"
                            : "border-transparent bg-slate-50/50 opacity-40"
                      }`}
                    >
                      <span className="text-xl">{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-bold ${unlocked ? "text-amber-800" : isChampion && stats.champLeagues.size > 0 ? "text-amber-700" : "text-slate-400"}`}>
                            {a.label}
                            {isChampion && <span className="ml-1 text-[10px] font-bold text-amber-500">{stats.champLeagues.size}/{LEAGUES.length}</span>}
                          </span>
                          <span className="shrink-0 text-[10px] font-bold text-slate-400">{pct}% heeft dit</span>
                        </div>
                        {expanded && (
                          <>
                            <div className="mt-1 text-[11px] leading-relaxed text-slate-500">{a.description}</div>
                            {isChampion && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {LEAGUES.map((l) => {
                                  const won = stats.champLeagues.has(l.code);
                                  return (
                                    <span key={l.code} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                      won ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-400"
                                    }`}>
                                      {l.flag} {l.name} {won ? "✓" : ""}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </main>
  );
}

function StatBox({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl px-3 py-3 ${accent ? "bg-emerald-50/80" : "bg-slate-50/80"}`}>
      <div className={`text-lg font-black tabular-nums ${accent ? "text-emerald-700" : "text-slate-800"}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-slate-400">{label}</div>
    </div>
  );
}

function TeamNameEditor() {
  const teamName = useAuth((s) => s.teamName);
  const setTeamName = useAuth((s) => s.setTeamName);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(teamName ?? "");

  if (editing) {
    return (
      <div className="card p-5 mb-4">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Teamnaam</div>
        <form onSubmit={(e) => { e.preventDefault(); setTeamName(draft); setEditing(false); }} className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Bijv. FC Bart"
            maxLength={24}
            className="glass-input flex-1 !py-2.5 !text-sm"
            autoFocus
          />
          <button type="submit" className="btn-primary !px-4 !py-2.5 !text-sm">Opslaan</button>
          <button type="button" onClick={() => setEditing(false)} className="btn-secondary !px-4 !py-2.5 !text-sm">Annuleer</button>
        </form>
      </div>
    );
  }

  return (
    <div className="card p-5 mb-4">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Teamnaam</div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-black text-slate-800">{teamName || "Jouw XI"}</span>
        <button onClick={() => { setDraft(teamName ?? ""); setEditing(true); }} className="btn-secondary !px-3 !py-1.5 !text-xs">
          Wijzig
        </button>
      </div>
    </div>
  );
}

function fmtValue(mv: number): string {
  if (mv >= 1_000_000) return `€${(mv / 1_000_000).toFixed(0)}M`;
  if (mv >= 1000) return `€${(mv / 1000).toFixed(0)}K`;
  return `€${Math.round(mv)}`;
}
