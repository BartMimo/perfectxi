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
    <div className="mb-3 flex items-center gap-2.5 text-xs font-bold uppercase tracking-widest text-slate-400">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-extrabold text-emerald-700">
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

interface ModeAccent {
  border: string;
  chip: string;
  title: string;
  desc: string;
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
  const className = `group relative flex rounded-3xl border bg-white p-4 text-left shadow-[0_2px_0_rgba(15,23,42,0.04)] transition-all duration-150 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-900/10 active:translate-y-0 sm:p-5 ${accent.border} ${
    featured ? "sm:col-span-2 flex-row items-center gap-4" : "flex-row items-center gap-3.5 sm:flex-col sm:items-start sm:gap-3"
  }`;
  const inner = (
    <>
      {badge && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-sky-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
          {badge}
        </span>
      )}
      <span className={`flex shrink-0 items-center justify-center rounded-full ${accent.chip} ${featured ? "h-14 w-14" : "h-11 w-11"}`}>
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`text-[15px] font-black sm:text-base ${accent.title}`}>{title}</span>
        <span className={`text-xs leading-relaxed sm:text-[13px] ${accent.desc}`}>{desc}</span>
      </span>
      {featured && <IconChevronRight className="h-5 w-5 shrink-0 text-sky-300 transition-transform group-hover:translate-x-1" />}
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
      className="group flex items-center gap-3.5 rounded-3xl border border-amber-200 bg-amber-50 p-4 transition-all duration-150 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-900/10 active:translate-y-0 sm:gap-4 sm:px-5"
    >
      <span className="animate-wiggle flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white shadow-[0_3px_0_#c98a10] sm:h-12 sm:w-12">
        <IconBolt className="h-6 w-6" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-black text-amber-900 sm:text-base">{t("start.mode.dailyChallenge.title")}</span>
        <span className="text-xs text-amber-700 sm:text-[13px]">
          {t("start.daily.countdown", { time: countdown })}
        </span>
      </span>
      <span className="hidden shrink-0 rounded-full border border-amber-200 bg-white px-4 py-2 text-[13px] font-bold text-amber-700 shadow-[0_3px_0_#f0d68e] transition-transform group-active:translate-y-[3px] sm:inline-block">
        {t("start.daily.cta")}
      </span>
      <IconChevronRight className="h-5 w-5 shrink-0 text-amber-400 sm:hidden" />
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
            <span className="animate-floaty flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_3px_0_#0a8f66]">
              <IconBall className="h-6 w-6" />
            </span>
            <span className="text-lg font-black tracking-tight text-emerald-950">Elite Football</span>
          </div>
          <div className="flex items-center gap-2">
            <LevelBadge />
            <LanguageSwitcher />
          </div>
        </div>

        <div className="animate-fade-up mt-8 text-center sm:mt-10">
          <h1 className="mx-auto max-w-lg text-2xl font-black leading-snug text-emerald-950 sm:text-3xl">
            {t("start.tagline.prefix")}{" "}
            <span className="inline-block rounded-full bg-amber-100 px-3.5 py-0.5 text-amber-700">38&#8209;0&#8209;0</span>
          </h1>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:mt-10">
          <DailyChallengeBanner />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ModeCard
              icon={<IconGlobe className="h-7 w-7" />}
              title={t("start.mode.online.title")}
              desc={t("start.mode.online.desc")}
              href="/online-carriere"
              accent={{ border: "border-sky-200", chip: "bg-sky-100 text-sky-600", title: "text-sky-950", desc: "text-sky-800/60" }}
              badge={t("start.mode.online.badge")}
              featured
            />
            <ModeCard
              icon={<IconShirt className="h-5.5 w-5.5" />}
              title={t("start.mode.singleSeason.title")}
              desc={t("start.mode.singleSeason.desc")}
              onClick={() => setScreen("single")}
              accent={{ border: "border-emerald-200", chip: "bg-emerald-100 text-emerald-600", title: "text-emerald-950", desc: "text-emerald-800/60" }}
            />
            <ModeCard
              icon={<IconTrophy className="h-5.5 w-5.5" />}
              title={t("start.mode.offlineCareer.title")}
              desc={t("start.mode.offlineCareer.desc")}
              href="/offline-carriere"
              accent={{ border: "border-indigo-200", chip: "bg-indigo-100 text-indigo-600", title: "text-indigo-950", desc: "text-indigo-800/60" }}
            />
            <ModeCard
              icon={<IconStar className="h-5.5 w-5.5" />}
              title={t("start.mode.myPlayer.title")}
              desc={t("start.mode.myPlayer.desc")}
              href="/mijn-speler"
              accent={{ border: "border-rose-200", chip: "bg-rose-100 text-rose-500", title: "text-rose-950", desc: "text-rose-800/60" }}
            />
            <ModeCard
              icon={<IconChart className="h-5.5 w-5.5" />}
              title={t("start.mode.leaderboard.title")}
              desc={t("start.mode.leaderboard.desc")}
              href="/ranglijst"
              accent={{ border: "border-cyan-200", chip: "bg-cyan-100 text-cyan-600", title: "text-cyan-950", desc: "text-cyan-800/60" }}
            />
            <ModeCard
              icon={<IconUser className="h-6 w-6" />}
              title={t("start.mode.profile.title")}
              desc={t("start.mode.profile.desc")}
              href="/profiel"
              accent={{ border: "border-violet-200", chip: "bg-violet-100 text-violet-600", title: "text-violet-950", desc: "text-violet-800/60" }}
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
        <button onClick={() => setScreen("home")} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition mb-4">
          ← {t("start.back")}
        </button>
        <h1 className="text-3xl font-black text-slate-800">{t("start.singleSeason.title")}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
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
          <SectionTitle n={2}>{t("start.section.league")}</SectionTitle>
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
