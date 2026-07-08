"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useGame } from "@/lib/store";
import { FORMATIONS } from "@/lib/formations";
import { LEAGUES } from "@/lib/leagues";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LevelBadge from "@/components/LevelBadge";
import { useT } from "@/lib/i18n/core";
import {
  IconBall,
  IconBolt,
  IconChart,
  IconChevronRight,
  IconGlobe,
  IconShirt,
  IconStar,
  IconTrophy,
  IconUser,
} from "@/components/icons";

function SectionTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/12 stat-num text-[13px] text-accent">
        {n}
      </span>
      <span className="eyebrow">{children}</span>
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
      className={`rounded-xl border px-4 py-3.5 text-left transition-all ${
        active
          ? "border-accent/60 bg-accent/[0.07]"
          : "border-line bg-white/[0.02] hover:border-line-strong hover:bg-white/[0.04]"
      }`}
    >
      <div className={`text-sm font-bold ${active ? "text-text" : "text-dim"}`}>{title}</div>
      <div className="mt-0.5 text-[11px] leading-relaxed text-faint">{desc}</div>
    </button>
  );
}

type StartScreen = "home" | "single";

interface ModeAccent {
  /** icon chip tint */
  chip: string;
  /** hover border tint */
  ring: string;
}

/** Mini-pitch signatuur — echoot het echte speelveld van de game. */
function MiniPitch({ className = "" }: { className?: string }) {
  const l = { stroke: "rgba(182,255,58,0.28)", strokeWidth: 1, fill: "none" } as const;
  return (
    <svg viewBox="0 0 64 96" className={className} aria-hidden="true">
      <rect x="3" y="3" width="58" height="90" rx="2" {...l} />
      <line x1="3" y1="48" x2="61" y2="48" {...l} />
      <circle cx="32" cy="48" r="11" {...l} />
      <rect x="18" y="3" width="28" height="13" {...l} />
      <rect x="18" y="80" width="28" height="13" {...l} />
      <circle cx="32" cy="48" r="2.4" fill="#b6ff3a" className="text-glow" />
    </svg>
  );
}

function ModeCard({ icon, title, desc, href, onClick, accent, badge, index, featured }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href?: string;
  onClick?: () => void;
  accent: ModeAccent;
  badge?: string;
  index: string;
  featured?: boolean;
}) {
  const className = `group relative grid grid-cols-[auto_auto_1fr_auto] items-center gap-3.5 overflow-hidden rounded-2xl border border-line bg-white/[0.03] p-4 text-left backdrop-blur transition-all duration-150 hover:bg-white/[0.055] active:translate-y-px ${accent.ring} ${
    featured ? "sm:col-span-2" : ""
  }`;
  const inner = (
    <>
      {/* lime edge on hover */}
      <span className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-accent opacity-0 transition-opacity group-hover:opacity-100" />
      <span className="stat-num w-6 text-center text-xl text-faint transition-colors group-hover:text-accent">{index}</span>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent.chip}`}>
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-bold text-text sm:text-base">{title}</span>
          {badge && (
            <span className="rounded-full bg-accent px-2 py-px text-[9px] font-black uppercase tracking-wider text-accent-ink">
              {badge}
            </span>
          )}
        </span>
        <span className="text-xs leading-relaxed text-dim sm:text-[13px]">{desc}</span>
      </span>
      <IconChevronRight className="h-5 w-5 shrink-0 text-faint transition-all group-hover:translate-x-1 group-hover:text-accent" />
    </>
  );
  return href ? (
    <Link href={href} className={className}>{inner}</Link>
  ) : (
    <button onClick={onClick} className={className}>{inner}</button>
  );
}

function useDailyCountdown() {
  const [left, setLeft] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const s = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
      const p = (n: number) => String(n).padStart(2, "0");
      setLeft(`${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return left;
}

function DailyChallengeBanner() {
  const t = useT();
  const countdown = useDailyCountdown();
  return (
    <Link
      href="/challenge"
      className="group flex items-center gap-3.5 rounded-2xl border border-draw/25 bg-draw/[0.06] p-4 transition-all duration-150 hover:-translate-y-0.5 hover:bg-draw/[0.1] active:translate-y-0 sm:gap-4 sm:px-5"
    >
      <span className="animate-wiggle flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-draw/15 text-draw sm:h-12 sm:w-12">
        <IconBolt className="h-6 w-6" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-bold text-text sm:text-base">{t("start.mode.dailyChallenge.title")}</span>
        <span className="text-xs text-dim sm:text-[13px]">
          {t("start.daily.countdown", { time: countdown })}
        </span>
      </span>
      <span className="hidden shrink-0 rounded-full border border-draw/30 bg-draw/10 px-4 py-2 text-[13px] font-bold text-draw transition-colors group-hover:bg-draw/15 sm:inline-block">
        {t("start.daily.cta")}
      </span>
      <IconChevronRight className="h-5 w-5 shrink-0 text-draw sm:hidden" />
    </Link>
  );
}

export default function StartView() {
  const t = useT();
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
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/12 text-accent ring-1 ring-accent/20">
              <IconBall className="h-6 w-6" />
            </span>
            <span className="text-lg font-black tracking-tight text-text">Elite Football</span>
          </div>
          <div className="flex items-center gap-2">
            <LevelBadge />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Hero — editorial "dossier"-paneel met scoreboard + mini-pitch signatuur */}
        <div className="animate-fade-up card mt-6 overflow-hidden p-6 sm:mt-8 sm:p-8">
          <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-3">
                <span className="hairline w-8" />
                <p className="eyebrow">{t("start.tagline.prefix")}</p>
              </div>
              <div className="mt-4 flex items-end gap-3 sm:gap-4">
                <span className="stat-num text-glow text-7xl leading-none text-accent sm:text-8xl">38</span>
                <span className="stat-num pb-1 text-4xl text-faint sm:text-5xl">–</span>
                <span className="stat-num text-7xl leading-none text-text sm:text-8xl">0</span>
                <span className="stat-num pb-1 text-4xl text-faint sm:text-5xl">–</span>
                <span className="stat-num text-7xl leading-none text-text sm:text-8xl">0</span>
              </div>
              {/* stat-readout: W / D / L kolommen */}
              <div className="mt-6 grid max-w-md grid-cols-3 divide-x divide-[color:var(--color-line)] rounded-xl border border-line bg-white/[0.02]">
                {([
                  ["W", "38", "text-accent-2"],
                  ["D", "0", "text-text"],
                  ["L", "0", "text-text"],
                ] as const).map(([k, v, c]) => (
                  <div key={k} className="flex flex-col items-center gap-0.5 px-3 py-2.5">
                    <span className="eyebrow">{k}</span>
                    <span className={`stat-num text-2xl ${c}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <MiniPitch className="hidden h-40 w-auto shrink-0 opacity-90 sm:block" />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <DailyChallengeBanner />

          <div className="mt-2 flex items-center gap-3">
            <span className="text-accent">▸</span>
            <span className="hairline flex-1" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ModeCard
              index="01"
              icon={<IconGlobe className="h-6 w-6" />}
              title={t("start.mode.online.title")}
              desc={t("start.mode.online.desc")}
              href="/online-carriere"
              accent={{ chip: "bg-sky-400/12 text-sky-300", ring: "hover:border-sky-400/40" }}
              badge={t("start.mode.online.badge")}
              featured
            />
            <ModeCard
              index="02"
              icon={<IconShirt className="h-5.5 w-5.5" />}
              title={t("start.mode.singleSeason.title")}
              desc={t("start.mode.singleSeason.desc")}
              onClick={() => setScreen("single")}
              accent={{ chip: "bg-accent/12 text-accent", ring: "hover:border-accent/40" }}
            />
            <ModeCard
              index="03"
              icon={<IconTrophy className="h-5.5 w-5.5" />}
              title={t("start.mode.offlineCareer.title")}
              desc={t("start.mode.offlineCareer.desc")}
              href="/offline-carriere"
              accent={{ chip: "bg-indigo-400/12 text-indigo-300", ring: "hover:border-indigo-400/40" }}
            />
            <ModeCard
              index="04"
              icon={<IconStar className="h-5.5 w-5.5" />}
              title={t("start.mode.myPlayer.title")}
              desc={t("start.mode.myPlayer.desc")}
              href="/mijn-speler"
              accent={{ chip: "bg-rose-400/12 text-rose-300", ring: "hover:border-rose-400/40" }}
            />
            <ModeCard
              index="05"
              icon={<IconChart className="h-5.5 w-5.5" />}
              title={t("start.mode.leaderboard.title")}
              desc={t("start.mode.leaderboard.desc")}
              href="/ranglijst"
              accent={{ chip: "bg-cyan-400/12 text-cyan-300", ring: "hover:border-cyan-400/40" }}
            />
            <ModeCard
              index="06"
              icon={<IconUser className="h-6 w-6" />}
              title={t("start.mode.profile.title")}
              desc={t("start.mode.profile.desc")}
              href="/profiel"
              accent={{ chip: "bg-violet-400/12 text-violet-300", ring: "hover:border-violet-400/40" }}
              featured
            />
          </div>
        </div>
      </div>
    );
  }

  // Single Season configuratie scherm
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="animate-fade-up text-center">
        <button onClick={() => setScreen("home")} className="inline-flex items-center gap-1.5 text-sm font-bold text-faint hover:text-text transition mb-4">
          ← {t("start.back")}
        </button>
        <h1 className="text-3xl font-black text-text font-display tracking-tight">{t("start.singleSeason.title")}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-dim">
          {t("start.singleSeason.desc")}
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {/* Formatie */}
        <section className="card p-5 sm:col-span-2">
          <SectionTitle n={1}>{t("start.section.formation")}</SectionTitle>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {FORMATIONS.map((fm) => (
              <button
                key={fm.key}
                onClick={() => setFormation(fm.key)}
                className={`rounded-xl border px-2 py-3 text-sm font-bold transition-all ${
                  formationKey === fm.key
                    ? "border-accent/60 bg-accent/[0.07] text-accent"
                    : "border-line bg-white/[0.02] text-dim hover:border-line-strong hover:bg-white/[0.04]"
                }`}
              >
                {fm.label}
              </button>
            ))}
          </div>
        </section>

        {/* Competitie */}
        <section className="card p-5 sm:col-span-2">
          <SectionTitle n={2}>{t("start.section.league")}</SectionTitle>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {LEAGUES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLeague(l.code)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
                  leagueCode === l.code
                    ? "border-accent/60 bg-accent/[0.07]"
                    : "border-line bg-white/[0.02] hover:border-line-strong hover:bg-white/[0.04]"
                }`}
              >
                <span className="text-2xl leading-none">{l.flag}</span>
                <span className={`flex-1 font-bold ${leagueCode === l.code ? "text-text" : "text-dim"}`}>{l.name}</span>
                {leagueCode === l.code && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-black text-accent-ink">✓</span>
                )}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-faint">
            {t("start.section.league.hint")}
          </p>
        </section>

        {/* Rating-modus */}
        <section className="card p-5">
          <SectionTitle n={3}>{t("start.section.ratingMode")}</SectionTitle>
          <div className="grid grid-cols-1 gap-2">
            <OptionCard
              active={ratingMode === "actual"}
              onClick={() => setRatingMode("actual")}
              title={t("start.ratingMode.actual.title")}
              desc={t("start.ratingMode.actual.desc")}
            />
            <OptionCard
              active={ratingMode === "prime"}
              onClick={() => setRatingMode("prime")}
              title={t("start.ratingMode.prime.title")}
              desc={t("start.ratingMode.prime.desc")}
            />
          </div>
        </section>

        {/* Niveau */}
        <section className="card p-5">
          <SectionTitle n={4}>{t("start.section.difficulty")}</SectionTitle>
          <div className="grid grid-cols-1 gap-2">
            <OptionCard
              active={difficulty === "normal"}
              onClick={() => setDifficulty("normal")}
              title={t("start.difficulty.normal.title")}
              desc={t("start.difficulty.normal.desc")}
            />
            <OptionCard
              active={difficulty === "hard"}
              onClick={() => setDifficulty("hard")}
              title={t("start.difficulty.hard.title")}
              desc={t("start.difficulty.hard.desc")}
            />
          </div>
        </section>
      </div>

      <button
        disabled={!ready}
        onClick={startGame}
        className="btn-primary mt-8 w-full text-lg"
      >
        {!loaded ? t("common.loading") : !leagueCode ? t("start.cta.chooseLeague") : t("start.cta.startDraft")}
      </button>
    </div>
  );
}
