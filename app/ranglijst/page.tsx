"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Footer from "@/components/Footer";

type SortKey = "achievements" | "champions" | "games" | "best_points";

interface UserRow {
  username: string;
  games: number;
  champions: number;
  best_points: number;
  best_gf: number;
  least_ga: number;
  best_rating: number;
  best_value: number;
  unique_achievements: string[];
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "achievements", label: "Achievements" },
  { key: "champions", label: "Kampioenschappen" },
  { key: "games", label: "Gespeeld" },
  { key: "best_points", label: "Beste punten" },
];

export default function RanglijstPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("achievements");

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from("results")
      .select("user_id, team_rating, team_value, points, goals_for, goals_against, achievements, position, users!inner(username)")
      .limit(500);

    if (data) {
      const byUser = new Map<string, UserRow>();
      for (const r of data as Record<string, unknown>[]) {
        const uid = r.user_id as string;
        const username = (r.users as Record<string, string>).username;
        const achs = (r.achievements as string[]) ?? [];
        let u = byUser.get(uid);
        if (!u) {
          u = { username, games: 0, champions: 0, best_points: 0, best_gf: 0, least_ga: 9999, best_rating: 0, best_value: 0, unique_achievements: [] };
          byUser.set(uid, u);
        }
        u.games++;
        if ((r.position as number) === 1) u.champions++;
        u.best_points = Math.max(u.best_points, r.points as number);
        u.best_gf = Math.max(u.best_gf, r.goals_for as number);
        u.least_ga = Math.min(u.least_ga, r.goals_against as number);
        u.best_rating = Math.max(u.best_rating, r.team_rating as number);
        u.best_value = Math.max(u.best_value, r.team_value as number);
        for (const a of achs) {
          if (!u.unique_achievements.includes(a)) u.unique_achievements.push(a);
        }
      }
      let mapped = [...byUser.values()];
      if (sortBy === "achievements") mapped.sort((a, b) => b.unique_achievements.length - a.unique_achievements.length);
      else if (sortBy === "champions") mapped.sort((a, b) => b.champions - a.champions || b.best_points - a.best_points);
      else if (sortBy === "games") mapped.sort((a, b) => b.games - a.games);
      else if (sortBy === "best_points") mapped.sort((a, b) => b.best_points - a.best_points);
      setRows(mapped);
    }
    setLoading(false);
  }, [sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <main className="min-h-screen w-full pb-12">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-start justify-between mb-8">
          <div className="animate-fade-up">
            <a href="/" className="text-base font-black tracking-tight">
              <span className="bg-gradient-to-r from-emerald-600 to-cyan-500 bg-clip-text text-transparent">
                Perfect XI
              </span>
            </a>
            <h1 className="text-3xl font-black text-slate-800 mt-1">Ranglijst</h1>
            <p className="text-sm text-slate-400 mt-1">Wie heeft de meeste achievements?</p>
          </div>
          <a href="/" className="btn-secondary mt-1">
            Speel
          </a>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                sortBy === opt.key
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md shadow-emerald-100"
                  : "bg-white/70 border border-slate-200/60 text-slate-500 hover:bg-white hover:shadow-sm backdrop-blur"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">Laden…</div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-3xl mb-3">🏟️</div>
              <div className="text-sm text-slate-400">Nog geen resultaten. Speel een potje!</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 text-[10px] uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-3 py-3 text-left">Speler</th>
                    <th className="px-3 py-3 text-right">Gespeeld</th>
                    <th className="px-3 py-3 text-right">Titels</th>
                    <th className="px-3 py-3 text-right">Beste ptn</th>
                    <th className="px-3 py-3 text-right">Achievements</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.username} className="border-t border-slate-100/60 text-slate-600 transition hover:bg-emerald-50/30">
                      <td className="px-4 py-3">
                        {i < 3 ? (
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white ${
                            i === 0 ? "bg-amber-400" : i === 1 ? "bg-slate-400" : "bg-amber-600"
                          }`}>
                            {i + 1}
                          </span>
                        ) : (
                          <span className="pl-1.5 font-bold text-slate-400">{i + 1}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-800">{r.username}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{r.games}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold text-amber-600">{r.champions}🏆</td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold">{r.best_points}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-black text-emerald-600">{r.unique_achievements.length} / 15</td>
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
