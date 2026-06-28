"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { FORMATIONS } from "@/lib/formations";
import { LEAGUES } from "@/lib/leagues";
import { getCurrentChallenge, getChallengeWeekId } from "@/lib/challenge";
import { supabase } from "@/lib/supabase";
import { CareerStartCard } from "./CareerView";

function SectionTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2.5 text-xs font-bold uppercase tracking-widest text-slate-400">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100 text-[11px] font-extrabold text-emerald-700">
        {n}
      </span>
      {children}
    </div>
  );
}

function OptionCard({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border-2 px-4 py-3.5 text-left transition-all ${
        active
          ? "border-emerald-400 bg-emerald-50/80 shadow-sm shadow-emerald-100"
          : "border-transparent bg-white/60 hover:bg-white/80 hover:shadow-sm"
      }`}
    >
      <div className="text-sm font-bold text-slate-800">{title}</div>
      <div className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{desc}</div>
    </button>
  );
}

export default function StartView() {
  const formationKey = useGame((s) => s.formationKey);
  const setFormation = useGame((s) => s.setFormation);
  const leagueCode = useGame((s) => s.leagueCode);
  const setLeague = useGame((s) => s.setLeague);
  const ratingMode = useGame((s) => s.ratingMode);
  const setRatingMode = useGame((s) => s.setRatingMode);
  const difficulty = useGame((s) => s.difficulty);
  const setDifficulty = useGame((s) => s.setDifficulty);
  const startGame = useGame((s) => s.startGame);
  const startChallenge = useGame((s) => s.startChallenge);
  const loaded = useGame((s) => s.index.length > 0);
  const userId = useAuth((s) => s.userId);

  const challenge = getCurrentChallenge();
  const [challengePlayed, setChallengePlayed] = useState<number | null>(null);
  const [challengeChecked, setChallengeChecked] = useState(false);

  useEffect(() => {
    if (!userId) { setChallengeChecked(true); return; }
    const weekId = getChallengeWeekId();
    supabase
      .from("results")
      .select("points")
      .eq("user_id", userId)
      .eq("challenge_week", weekId)
      .eq("is_challenge", true)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setChallengePlayed(data[0].points);
        setChallengeChecked(true);
      });
  }, [userId]);

  const ready = loaded && !!leagueCode;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="animate-fade-up text-center">
        <div className="text-4xl mb-2">⚽</div>
        <h1 className="bg-gradient-to-r from-emerald-600 to-cyan-500 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">
          Perfect&nbsp;XI
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">
          Kies een formatie en competitie, draft je droomelftal en jaag op het
          perfecte seizoen: <span className="font-bold text-emerald-600">38-0-0</span>.
        </p>
      </div>

      {/* Challenge van de week */}
      {challengeChecked && (
        <div className="mt-8 card p-5 border-2 border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-orange-50/50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏅</span>
            <span className="text-xs font-black uppercase tracking-widest text-amber-700">Challenge van de week</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-white/80 border border-amber-200/60 px-3 py-1.5 font-bold text-slate-700">
              {challenge.leagueFlag} {challenge.leagueName}
            </span>
            <span className="rounded-full bg-white/80 border border-amber-200/60 px-3 py-1.5 font-bold text-slate-700">
              {challenge.formationLabel}
            </span>
            <span className="rounded-full bg-white/80 border border-amber-200/60 px-3 py-1.5 font-bold text-slate-700">
              {challenge.ratingMode === "prime" ? "Prime" : "Actueel"}
            </span>
          </div>
          {challengePlayed !== null ? (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-bold text-amber-800">Al gespeeld deze week!</span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">{challengePlayed} punten</span>
              <a href="/ranglijst" className="text-xs font-bold text-amber-600 hover:text-amber-700 underline transition">Bekijk ranglijst</a>
            </div>
          ) : (
            <button
              disabled={!loaded}
              onClick={() => startChallenge(challenge.leagueCode, challenge.formationKey, challenge.ratingMode, challenge.difficulty, challenge.week)}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3.5 text-base font-extrabold text-white shadow-md shadow-amber-200/50 transition hover:shadow-lg hover:-translate-y-0.5"
            >
              {loaded ? "Speel de challenge" : "Laden…"}
            </button>
          )}
        </div>
      )}

      {/* Carrière */}
      <div className="mt-6">
        <CareerStartCard />
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {/* Formatie */}
        <section className="card p-5 sm:col-span-2">
          <SectionTitle n={1}>Kies je formatie</SectionTitle>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {FORMATIONS.map((fm) => (
              <button
                key={fm.key}
                onClick={() => setFormation(fm.key)}
                className={`rounded-xl border-2 px-2 py-3 text-sm font-bold transition-all ${
                  formationKey === fm.key
                    ? "border-emerald-400 bg-emerald-50/80 text-emerald-700 shadow-sm shadow-emerald-100"
                    : "border-transparent bg-white/60 text-slate-600 hover:bg-white/80"
                }`}
              >
                {fm.label}
              </button>
            ))}
          </div>
        </section>

        {/* Competitie */}
        <section className="card p-5 sm:col-span-2">
          <SectionTitle n={2}>Kies je competitie</SectionTitle>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {LEAGUES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLeague(l.code)}
                className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all ${
                  leagueCode === l.code
                    ? "border-emerald-400 bg-emerald-50/80 shadow-sm shadow-emerald-100"
                    : "border-transparent bg-white/60 hover:bg-white/80"
                }`}
              >
                <span className="text-2xl">{l.flag}</span>
                <span className="flex-1 font-bold text-slate-800">{l.name}</span>
                {leagueCode === l.code && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">✓</span>
                )}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
            Je draft uit clubs van deze competitie (2014-2026) en speelt tegen de
            ploegen van dit seizoen.
          </p>
        </section>

        {/* Rating-modus */}
        <section className="card p-5">
          <SectionTitle n={3}>Rating-modus</SectionTitle>
          <div className="grid grid-cols-1 gap-2">
            <OptionCard
              active={ratingMode === "actual"}
              onClick={() => setRatingMode("actual")}
              title="Actuele rating"
              desc="Rating van de speler in dát seizoen"
            />
            <OptionCard
              active={ratingMode === "prime"}
              onClick={() => setRatingMode("prime")}
              title="Prime rating"
              desc="Beste rating ooit in de database"
            />
          </div>
        </section>

        {/* Niveau */}
        <section className="card p-5">
          <SectionTitle n={4}>Niveau</SectionTitle>
          <div className="grid grid-cols-1 gap-2">
            <OptionCard
              active={difficulty === "normal"}
              onClick={() => setDifficulty("normal")}
              title="Normaal"
              desc="Ratings zichtbaar · 1 reroll"
            />
            <OptionCard
              active={difficulty === "hard"}
              onClick={() => setDifficulty("hard")}
              title="Hard"
              desc="Ratings verborgen · geen reroll"
            />
          </div>
        </section>
      </div>

      <button
        disabled={!ready}
        onClick={startGame}
        className="btn-primary mt-8 w-full text-lg"
      >
        {!loaded ? "Laden…" : !leagueCode ? "Kies een competitie" : "Start het draft"}
      </button>
    </div>
  );
}
