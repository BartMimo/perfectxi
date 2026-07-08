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

function ModeCard({ icon, title, desc, href, onClick, accent, badge, featured }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href?: string;
  onClick?: () => void;
  accent: ModeAccent;
  badge?: string;
  featured?: boolean;
}) {
  const className = `group relative flex rounded-2xl border border-line bg-white/[0.03] p-4 text-left backdrop-blur transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/[0.055] active:translate-y-0 sm:p-5 ${accent.ring} ${
    featured ? "sm:col-span-2 flex-row items-center gap-4" : "flex-row items-center gap-3.5 sm:flex-col sm:items-start sm:gap-3"
  }`;
  const inner = (
    <>
      {badge && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-accent px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-accent-ink">
          {badge}
        </span>
      )}
      <span className={`flex shrink-0 items-center justify-center rounded-xl ${accent.chip} ${featured ? "h-14 w-14" : "h-11 w-11"}`}>
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-bold text-text sm:text-base">{title}</span>
        <span className="text-xs leading-relaxed text-dim sm:text-[13px]">{desc}</span>
      </span>
      {featured && <IconChevronRight className="h-5 w-5 shrink-0 text-faint transition-all group-hover:translate-x-1 group-hover:text-accent" />}
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
      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
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

        {/* Hero — unbeaten-record scoreboard signature */}
        <div className="animate-fade-up mt-10 text-center sm:mt-14">
          <p className="eyebrow">{t("start.tagline.prefix")}</p>
          <div className="mt-4 flex items-center justify-center gap-3 sm:gap-5">
            <span className="stat-num text-glow text-7xl text-accent sm:text-8xl">38</span>
            <span className="stat-num text-4xl text-faint sm:text-5xl">–</span>
            <span className="stat-num text-7xl text-text sm:text-8xl">0</span>
            <span className="stat-num text-4xl text-faint sm:text-5xl">–</span>
            <span className="stat-num text-7xl text-text sm:text-8xl">0</span>
          </div>
          <div className="mx-auto mt-4 flex max-w-xs items-center justify-center gap-4">
            <span className="hairline flex-1" />
            <div className="flex gap-4 eyebrow">
              <span className="text-accent-2">W</span>
              <span>D</span>
              <span>L</span>
            </div>
            <span className="hairline flex-1" />
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-3 sm:mt-12">
          <DailyChallengeBanner />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ModeCard
              icon={<IconGlobe className="h-7 w-7" />}
              title={t("start.mode.online.title")}
              desc={t("start.mode.online.desc")}
              href="/online-carriere"
              accent={{ chip: "bg-sky-400/12 text-sky-300", ring: "hover:border-sky-400/40" }}
              badge={t("start.mode.online.badge")}
              featured
            />
            <ModeCard
              icon={<IconShirt className="h-5.5 w-5.5" />}
              title={t("start.mode.singleSeason.title")}
              desc={t("start.mode.singleSeason.desc")}
              onClick={() => setScreen("single")}
              accent={{ chip: "bg-accent/12 text-accent", ring: "hover:border-accent/40" }}
            />
            <ModeCard
              icon={<IconTrophy className="h-5.5 w-5.5" />}
              title={t("start.mode.offlineCareer.title")}
              desc={t("start.mode.offlineCareer.desc")}
              href="/offline-carriere"
              accent={{ chip: "bg-indigo-400/12 text-indigo-300", ring: "hover:border-indigo-400/40" }}
            />
            <ModeCard
              icon={<IconStar className="h-5.5 w-5.5" />}
              title={t("start.mode.myPlayer.title")}
              desc={t("start.mode.myPlayer.desc")}
              href="/mijn-speler"
              accent={{ chip: "bg-rose-400/12 text-rose-300", ring: "hover:border-rose-400/40" }}
            />
            <ModeCard
              icon={<IconChart className="h-5.5 w-5.5" />}
              title={t("start.mode.leaderboard.title")}
              desc={t("start.mode.leaderboard.desc")}
              href="/ranglijst"
              accent={{ chip: "bg-cyan-400/12 text-cyan-300", ring: "hover:border-cyan-400/40" }}
            />
            <ModeCard
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
