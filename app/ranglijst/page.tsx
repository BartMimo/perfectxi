"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LEAGUES } from "@/lib/leagues";
import { FORMATIONS } from "@/lib/formations";

type SortKey = "points" | "goals_for" | "goals_against" | "achievements";

interface Row {
  id: string;
  username: string;
  formation: string;
  team_rating: number;
  team_value: number;
  points: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  achievements: string[];
  league_name: string;
  rating_mode: string;
  difficulty: string;
  position: number;
  qualification: string;
  created_at: string;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "points", label: "Punten" },
  { key: "goals_for", label: "Goals voor" },
  { key: "goals_against", label: "Goals tegen" },
  { key: "achievements", label: "Achievements" },
];

export default function RanglijstPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("points");

  const [filterLeague, setFilterLeague] = useState("");
  const [filterRating, setFilterRating] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterFormation, setFilterFormation] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("results")
      .select("id, user_id, formation, team_rating, team_value, points, goals_for, goals_against, goal_diff, achievements, league_name, league_code, rating_mode, difficulty, position, qualification, created_at, users!inner(username)")
      .limit(100);

    if (filterLeague) query = query.eq("league_code", filterLeague);
    if (filterRating) query = query.eq("rating_mode", filterRating);
    if (filterDifficulty) query = query.eq("difficulty", filterDifficulty);
    if (filterFormation) query = query.eq("formation", filterFormation);

    if (sortBy === "points") {
      query = query.order("points", { ascending: false }).order("goal_diff", { ascending: false });
    } else if (sortBy === "goals_for") {
      query = query.order("goals_for", { ascending: false });
    } else if (sortBy === "goals_against") {
      query = query.order("goals_against", { ascending: true });
    } else {
      query = query.order("points", { ascending: false });
    }

    const { data } = await query;

    if (data) {
      let mapped: Row[] = data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        username: (r.users as Record<string, string>).username,
        formation: r.formation as string,
        team_rating: r.team_rating as number,
        team_value: r.team_value as number,
        points: r.points as number,
        goals_for: r.goals_for as number,
        goals_against: r.goals_against as number,
        goal_diff: r.goal_diff as number,
        achievements: (r.achievements as string[]) ?? [],
        league_name: r.league_name as string,
        rating_mode: r.rating_mode as string,
        difficulty: r.difficulty as string,
        position: r.position as number,
        qualification: r.qualification as string,
        created_at: r.created_at as string,
      }));

      if (sortBy === "achievements") {
        mapped.sort((a, b) => b.achievements.length - a.achievements.length);
      }

      setRows(mapped);
    }
    setLoading(false);
  }, [sortBy, filterLeague, filterRating, filterDifficulty, filterFormation]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hasFilters = !!(filterLeague || filterRating || filterDifficulty || filterFormation);

  return (
    <main className="min-h-screen w-full pb-12">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="animate-fade-up">
            <a href="/" className="text-base font-black tracking-tight">
              <span className="bg-gradient-to-r from-emerald-600 to-cyan-500 bg-clip-text text-transparent">
                Perfect XI
              </span>
            </a>
            <h1 className="text-3xl font-black text-slate-800 mt-1">Ranglijst</h1>
            <p className="text-sm text-slate-400 mt-1">Wie haalt het beste seizoen?</p>
          </div>
          <a href="/" className="btn-secondary mt-1">
            Speel
          </a>
        </div>

        {/* Sortering */}
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

        {/* Filters */}
        <details className="mb-5">
          <summary className="cursor-pointer text-sm font-bold text-slate-400 hover:text-slate-600 transition">
            Filters {hasFilters && <span className="text-emerald-500">({[filterLeague, filterRating, filterDifficulty, filterFormation].filter(Boolean).length} actief)</span>}
          </summary>
          <div className="mt-4 card p-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <FilterSelect label="Competitie" value={filterLeague} onChange={setFilterLeague} options={LEAGUES.map((l) => ({ value: l.code, label: `${l.flag} ${l.name}` }))} />
              <FilterSelect label="Rating" value={filterRating} onChange={setFilterRating} options={[{ value: "actual", label: "Actueel" }, { value: "prime", label: "Prime" }]} />
              <FilterSelect label="Niveau" value={filterDifficulty} onChange={setFilterDifficulty} options={[{ value: "normal", label: "Normaal" }, { value: "hard", label: "Hard" }]} />
              <FilterSelect label="Opstelling" value={filterFormation} onChange={setFilterFormation} options={FORMATIONS.map((f) => ({ value: f.key, label: f.label }))} />
            </div>
            {hasFilters && (
              <button
                onClick={() => { setFilterLeague(""); setFilterRating(""); setFilterDifficulty(""); setFilterFormation(""); }}
                className="mt-3 text-xs font-bold text-rose-400 hover:text-rose-500 transition"
              >
                Wis alle filters
              </button>
            )}
          </div>
        </details>

        {/* Tabel */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">Laden…</div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-3xl mb-3">🏟️</div>
              <div className="text-sm text-slate-400">
                Nog geen resultaten{hasFilters ? " met deze filters" : ""}. Speel een potje!
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 text-[10px] uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-3 py-3 text-left">Speler</th>
                    <th className="px-3 py-3 text-left">Opstelling</th>
                    <th className="px-3 py-3 text-right">Rating</th>
                    <th className="px-3 py-3 text-right">Waarde</th>
                    {sortBy === "points" && <th className="px-3 py-3 text-right">Ptn</th>}
                    {sortBy === "goals_for" && <th className="px-3 py-3 text-right">GV</th>}
                    {sortBy === "goals_against" && <th className="px-3 py-3 text-right">GT</th>}
                    {sortBy === "achievements" && <th className="px-3 py-3 text-right">Achv</th>}
                    <th className="px-3 py-3 text-right">DS</th>
                    <th className="px-3 py-3 text-left">Pos</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id} className="border-t border-slate-100/60 text-slate-600 transition hover:bg-emerald-50/30">
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
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-800">{r.username}</div>
                        <div className="mt-0.5 text-[10px] text-slate-400">{r.league_name}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-lg bg-slate-100/80 px-2 py-1 text-[11px] font-bold text-slate-600">
                          {formatFormation(r.formation)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold">{r.team_rating.toFixed(1)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-400">{formatValue(r.team_value)}</td>
                      {sortBy === "points" && (
                        <td className="px-3 py-3 text-right tabular-nums font-black text-emerald-600">{r.points}</td>
                      )}
                      {sortBy === "goals_for" && (
                        <td className="px-3 py-3 text-right tabular-nums font-black text-emerald-600">{r.goals_for}</td>
                      )}
                      {sortBy === "goals_against" && (
                        <td className="px-3 py-3 text-right tabular-nums font-black text-emerald-600">{r.goals_against}</td>
                      )}
                      {sortBy === "achievements" && (
                        <td className="px-3 py-3 text-right tabular-nums font-black text-amber-600">{r.achievements.length}</td>
                      )}
                      <td className="px-3 py-3 text-right tabular-nums text-slate-400">
                        {(r.goal_diff >= 0 ? "+" : "")}{r.goal_diff}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex h-6 min-w-[2rem] items-center justify-center rounded-full px-2 text-[10px] font-bold ${
                          r.position === 1
                            ? "bg-amber-100/80 text-amber-700"
                            : r.position <= 4
                            ? "bg-emerald-100/80 text-emerald-700"
                            : r.position >= 18
                            ? "bg-rose-100/80 text-rose-600"
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
        </div>
      </div>
    </main>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200/60 bg-white/80 px-3 py-2.5 text-xs font-medium text-slate-700 backdrop-blur focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition"
      >
        <option value="">Alle</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function formatFormation(key: string): string {
  const fm = FORMATIONS.find((f) => f.key === key);
  return fm?.label ?? key;
}

function formatValue(mv: number): string {
  if (mv >= 1_000_000) return `€${(mv / 1_000_000).toFixed(0)}M`;
  if (mv >= 1000) return `€${(mv / 1000).toFixed(0)}K`;
  return `€${Math.round(mv)}`;
}
