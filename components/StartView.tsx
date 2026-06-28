"use client";

import { useGame } from "@/lib/store";
import { FORMATIONS } from "@/lib/formations";
import { LEAGUES } from "@/lib/leagues";

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
  const loaded = useGame((s) => s.index.length > 0);

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

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
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
