"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ALL_ACHIEVEMENTS } from "@/lib/achievements";
import { LEAGUES } from "@/lib/leagues";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useT } from "@/lib/i18n/core";

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

export default function PublicProfilePage() {
  const t = useT();
  const params = useParams();
  const profileUsername = params.username as string;
  const decoded = decodeURIComponent(profileUsername);

  const [userId, setUserId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);

    const { data: user } = await supabase
      .from("users")
      .select("id, username, team_name")
      .eq("username", decoded)
      .single();

    if (!user) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setUserId(user.id);
    setTeamName(user.team_name ?? null);

    const { data } = await supabase
      .from("results")
      .select("points, goals_for, goals_against, team_rating, team_value, position, achievements, league_code, is_career, career_division, is_challenge, challenge_week")
      .eq("user_id", user.id);

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

      for (const r of data) {
        if ((r as Record<string, unknown>).is_career) {
          if (r.career_division === 1 && r.position === 1) s.div1Champ = true;
          for (const a of (r.achievements ?? [])) s.unlockedAchievements.add(a);
        }
      }

      // Count daily challenge wins
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
          for (const r of data.filter((rr: Record<string, unknown>) => rr.is_challenge)) {
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
  }, [decoded]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  if (notFound) {
    return (
      <main className="min-h-screen w-full pb-12">
        <Header backHref="/ranglijst" />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="text-4xl mb-4">😕</div>
          <h1 className="text-xl font-black text-slate-800 mb-2">{t("profiel.playerNotFound")}</h1>
          <p className="text-sm text-slate-500">{t("profiel.userDoesNotExist", { username: decoded })}</p>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full pb-12">
      <Header backHref="/ranglijst" />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="animate-fade-up mb-8">
          <h1 className="text-3xl font-black text-slate-800">{decoded}</h1>
          {teamName && <p className="text-sm font-bold text-indigo-600 mt-1">{teamName}</p>}
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">{t("common.loading")}</div>
        ) : !stats ? (
          <div className="card p-12 text-center">
            <div className="text-3xl mb-3">🏟️</div>
            <div className="text-sm text-slate-400">{t("profiel.noSeasons")}</div>
          </div>
        ) : (
          <>
            <div className="card p-5 mb-4">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">{t("profiel.stats")}</div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatBox label={t("profiel.stat.played")} value={stats.games} />
                <StatBox label={t("profiel.stat.champion")} value={t("profiel.stat.champion.value", { n: stats.champions })} accent />
                <StatBox label={t("profiel.stat.mostPoints")} value={stats.bestPoints} />
                <StatBox label={t("profiel.stat.mostGoals")} value={stats.bestGf} />
                <StatBox label={t("profiel.stat.leastConceded")} value={stats.leastGa === 9999 ? "—" : stats.leastGa} />
                <StatBox label={t("profiel.stat.bestRating")} value={stats.bestRating.toFixed(1)} />
                <StatBox label={t("profiel.stat.dailyWins")} value={stats.dailyWins} accent />
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{t("profiel.achievements")}</div>
                <span className="text-xs font-bold text-emerald-600">{t("profiel.achievementsCount", { unlocked: stats.unlockedAchievements.size, total: ALL_ACHIEVEMENTS.length })}</span>
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
                  return (
                    <div
                      key={a.id}
                      className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 ${
                        unlocked
                          ? "border-amber-200/60 bg-amber-50/80"
                          : "border-transparent bg-slate-50/50 opacity-40"
                      }`}
                    >
                      <span className="text-xl">{a.icon}</span>
                      <div className="min-w-0">
                        <span className={`text-sm font-bold ${unlocked ? "text-amber-800" : "text-slate-400"}`}>
                          {t(`achievement.${a.id}.label`)}
                        </span>
                        <div className="text-[11px] text-slate-500">{t(`achievement.${a.id}.description`)}</div>
                      </div>
                    </div>
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
