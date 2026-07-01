"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ALL_ACHIEVEMENTS } from "@/lib/achievements";
import { LEAGUES } from "@/lib/leagues";
import { POS_KEYS, POS_LABEL, type PosKey } from "@/lib/positions";
import { useCustomPlayer, BASE_OVERALL, MAX_OVERALL, XP_PER_LEVEL, EXTRA_POSITION_COST } from "@/lib/customPlayer";
import { RatingBadge } from "@/components/ui";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

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
        <Header backHref="/" />
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
      <Header backHref="/" />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800">{username}</h1>
          <p className="text-sm text-slate-400 mt-1">Jouw profiel en statistieken</p>
        </div>

        <TeamNameEditor />
        <CustomPlayerCard />

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

function CustomPlayerCard() {
  const userId = useAuth((s) => s.userId);
  const { player, loaded, loading, load, create, rename, spendOnOverall, spendOnPosition } = useCustomPlayer();
  const [name, setName] = useState("");
  const [position, setPosition] = useState<PosKey | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    if (userId && !loaded && !loading) load(userId);
  }, [userId, loaded, loading, load]);

  if (!userId || loading || !loaded) return null;

  if (!player) {
    return (
      <div className="card p-5 mb-4">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Jouw profielspeler</div>
        <p className="text-sm text-slate-500 mb-3">
          Maak je eigen speler aan. Hij begint op {BASE_OVERALL} overall en je kunt hem in elke spelmodus als eerste
          aan je opstelling toevoegen. Speel seizoenen om XP en levels te verdienen.
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Naam van je speler"
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
          {creating ? "Bezig…" : "Maak speler aan"}
        </button>
      </div>
    );
  }

  const xpInLevel = player.xp % XP_PER_LEVEL;
  const remainingPositions = POS_KEYS.filter((p) => p !== player.position && !player.extraPositions.includes(p));

  return (
    <div className="card p-5 mb-4">
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
                title="Naam wijzigen"
              >
                ✏️
              </button>
            </div>
          )}
          <div className="text-xs font-bold text-slate-400">
            Level {player.level} · {[player.position, ...player.extraPositions].map((p) => POS_LABEL[p]).join(", ")}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <span>XP</span>
          <span>{xpInLevel} / {XP_PER_LEVEL}</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${(xpInLevel / XP_PER_LEVEL) * 100}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 mb-3">
        <PlayerStatBox label="Seizoenen" value={player.seasonsPlayed} />
        <PlayerStatBox label="Goals" value={player.totalGoals} />
        <PlayerStatBox label="Assists" value={player.totalAssists} />
        <PlayerStatBox label="Clean sheets" value={player.totalCleanSheets} />
      </div>

      <div className="rounded-2xl bg-indigo-50/80 border border-indigo-100 px-4 py-3 mb-3">
        <div className="text-sm font-bold text-indigo-700">
          {player.skillPoints} punt{player.skillPoints !== 1 ? "en" : ""} te besteden
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          disabled={player.skillPoints < 1 || player.overall >= MAX_OVERALL}
          onClick={() => spendOnOverall(userId)}
          className="flex items-center justify-between rounded-xl bg-slate-50 border-2 border-transparent px-4 py-3 text-left hover:bg-slate-100 transition disabled:opacity-40 disabled:hover:bg-slate-50"
        >
          <span className="text-sm font-bold text-slate-700">
            {player.overall >= MAX_OVERALL ? "Overall (max bereikt)" : "+1 Overall"}
          </span>
          <span className="text-xs font-black text-indigo-600">1 punt</span>
        </button>

        {remainingPositions.length > 0 && (
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1.5 px-1">Extra positie (3 punten)</div>
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

function fmtValue(mv: number): string {
  if (mv >= 1_000_000) return `€${(mv / 1_000_000).toFixed(0)}M`;
  if (mv >= 1000) return `€${(mv / 1000).toFixed(0)}K`;
  return `€${Math.round(mv)}`;
}
