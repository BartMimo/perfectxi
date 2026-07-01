"use client";

import { useState } from "react";
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

type StartScreen = "home" | "single";

function ModeCard({ icon, title, desc, onClick, accent, badge, featured }: {
  icon: string; title: string; desc: string; onClick: () => void; accent: string; badge?: string; featured?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-6 text-center transition-all hover:shadow-md hover:-translate-y-0.5 ${accent} ${featured ? "sm:col-span-2 sm:flex-row sm:text-left sm:gap-5 sm:py-7" : ""}`}
    >
      {badge && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
          {badge}
        </span>
      )}
      <span className={featured ? "text-5xl sm:shrink-0" : "text-3xl"}>{icon}</span>
      <span className={featured ? "flex flex-col gap-1" : "contents"}>
        <span className="text-base font-black text-slate-800 sm:text-lg">{title}</span>
        <span className="text-xs leading-relaxed text-slate-500 sm:text-sm">{desc}</span>
      </span>
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

  const [screen, setScreen] = useState<StartScreen>("home");

  const ready = loaded && !!leagueCode;

  if (screen === "home") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="animate-fade-up text-center">
          <div className="text-4xl mb-2">⚽</div>
          <h1 className="bg-gradient-to-r from-emerald-600 to-cyan-500 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">
            Elite&nbsp;Football
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">
            Draft je droomelftal en jaag op het perfecte seizoen: <span className="font-bold text-emerald-600">38-0-0</span>.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ModeCard
            icon="🌐"
            title="Online Carrière"
            desc="Speel de carrièremodus met vrienden! Race samen naar Divisie 1."
            onClick={() => { window.location.href = "/online-carriere"; }}
            accent="border-cyan-200/60 bg-gradient-to-br from-cyan-50/60 to-blue-50/40"
            badge="Speel met vrienden"
            featured
          />
          <ModeCard
            icon="⭐"
            title="Mijn Speler"
            desc="Maak je eigen speler aan en laat hem groeien in elke spelmodus."
            onClick={() => { window.location.href = "/mijn-speler"; }}
            accent="border-rose-200/60 bg-gradient-to-br from-rose-50/60 to-pink-50/40"
          />
          <ModeCard
            icon="🏅"
            title="Challenge van de dag"
            desc="Dagelijkse challenge met vaste instellingen. Vergelijk je score!"
            onClick={() => { window.location.href = "/challenge"; }}
            accent="border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-orange-50/50"
          />
          <ModeCard
            icon="🏆"
            title="Offline Carrière"
            desc="Begin in Divisie 10 en werk je omhoog naar Divisie 1!"
            onClick={() => { window.location.href = "/offline-carriere"; }}
            accent="border-indigo-200/60 bg-gradient-to-br from-indigo-50/60 to-purple-50/40"
          />
          <ModeCard
            icon="⚽"
            title="Single Season"
            desc="Kies een competitie en formatie, draft je team en speel één seizoen."
            onClick={() => setScreen("single")}
            accent="border-emerald-200/60 bg-gradient-to-br from-emerald-50/60 to-teal-50/40"
          />
          <ModeCard
            icon="📊"
            title="Ranglijst"
            desc="Bekijk records, accounts en de beste carrières."
            onClick={() => { window.location.href = "/ranglijst"; }}
            accent="border-slate-200/60 bg-gradient-to-br from-slate-50/80 to-slate-100/50"
          />
        </div>
      </div>
    );
  }

  // Single Season configuratie scherm
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="animate-fade-up text-center">
        <button onClick={() => setScreen("home")} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition mb-4">
          ← Terug
        </button>
        <h1 className="text-3xl font-black text-slate-800">Single Season</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
          Kies een formatie en competitie, draft je droomelftal en jaag op het
          perfecte seizoen.
        </p>
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
                <span className="text-2xl leading-none">{l.flag}</span>
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
