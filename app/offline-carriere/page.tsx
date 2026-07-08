"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useCareer, divisionLabel } from "@/lib/career";
import { useGame } from "@/lib/store";
import type { ClubSeasonLite } from "@/lib/types";
import { FORMATIONS } from "@/lib/formations";
import { LEAGUES } from "@/lib/leagues";
import { LoginPrompt } from "@/components/AuthGate";
import CareerTimeline from "@/components/CareerTimeline";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useT } from "@/lib/i18n/core";
import { IconTrophy } from "@/components/icons";

const REROLL_OPTIONS = [0, 1, 2, 3];
const WISSEL_OPTIONS = [0, 1, 2, 3, 4];

const chipBtn = (active: boolean) =>
  `rounded-xl border px-1.5 py-2 text-xs font-bold transition-all ${
    active
      ? "border-accent/60 bg-accent/[0.08] text-accent"
      : "border-line bg-white/[0.03] text-dim hover:bg-white/[0.06]"
  }`;

function SettingChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.03] px-3 py-2 text-center">
      <div className="stat-num text-lg text-text">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-widest text-faint">{label}</div>
    </div>
  );
}

export default function OfflineCarrierePage() {
  const t = useT();
  const router = useRouter();
  const userId = useAuth((s) => s.userId);
  const authLoading = useAuth((s) => s.loading);
  const career = useCareer();
  const startCareerSeason = useGame((s) => s.startCareerSeason);
  const setFormation = useGame((s) => s.setFormation);
  const setIndex = useGame((s) => s.setIndex);
  const loaded = useGame((s) => s.index.length > 0);
  const [showLogin, setShowLogin] = useState(false);

  const [formationKey, setFormationKey] = useState("433");
  const [rerollCount, setRerollCount] = useState(1);
  const [wisselCount, setWisselCount] = useState(2);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(LEAGUES.map((l) => l.code));

  useEffect(() => {
    if (userId) career.loadCareer(userId);
  }, [userId]);

  useEffect(() => {
    if (loaded) return;
    fetch("/api/clubseasons")
      .then((r) => r.json())
      .then((data: ClubSeasonLite[]) => setIndex(data))
      .catch(() => {});
  }, [loaded, setIndex]);

  const toggleLeague = (code: string) => {
    setSelectedLeagues((prev) => {
      if (prev.includes(code)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== code);
      }
      return [...prev, code];
    });
  };

  const playSeason = () => {
    setFormation(career.formationKey);
    startCareerSeason(career.currentDivision, career.squad.length > 0 ? career.squad : undefined, career.rerollCount, career.leagues);
    router.push("/");
  };

  const handleStart = async () => {
    if (!userId) return;
    const leagues = selectedLeagues.length === LEAGUES.length ? [] : selectedLeagues;
    await career.startCareer(userId, { formationKey, rerollCount, wisselCount, leagues });
    setFormation(formationKey);
    startCareerSeason(10, undefined, rerollCount, leagues);
    router.push("/");
  };

  if (authLoading || career.loading) {
    return (
      <main className="min-h-screen w-full pb-12">
        <Header backHref="/" />
        <div className="flex items-center justify-center py-20 text-sm text-faint font-bold">{t("common.loading")}</div>
        <Footer />
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen w-full pb-12">
        <Header backHref="/" />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-400/12 text-indigo-300 ring-1 ring-indigo-400/25"><IconTrophy className="h-7 w-7" /></div>
          <p className="text-sm text-dim mb-4">{t("career.loginToStart")}</p>
          <button onClick={() => setShowLogin(true)} className="btn-primary">{t("common.login")}</button>
        </div>
        {showLogin && <LoginPrompt onClose={() => setShowLogin(false)} />}
        <Footer />
      </main>
    );
  }

  if (career.active) {
    return (
      <main className="min-h-screen w-full pb-12">
        <Header backHref="/" />
        <div className="mx-auto max-w-2xl px-4 py-10">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-400/12 text-indigo-300 ring-1 ring-indigo-400/25"><IconTrophy className="h-7 w-7" /></div>
            <h1 className="text-3xl font-black text-text font-display tracking-tight">{t("career.offlineTitle")}</h1>
          </div>

          <div className="card p-5 border border-indigo-400/25 mb-4">
            <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
              <span className="rounded-full border border-indigo-400/25 bg-indigo-400/[0.08] px-3 py-1.5 font-bold text-indigo-200">
                {divisionLabel(t, career.currentDivision)}
              </span>
              <span className="rounded-full border border-line bg-white/[0.04] px-3 py-1.5 font-bold text-dim">
                {t("career.seasonN", { n: career.season })}
              </span>
              <span className="rounded-full border border-draw/25 bg-draw/[0.08] px-3 py-1.5 font-bold text-draw">
                {t("career.timesChampion", { n: career.championships })}
              </span>
            </div>

            {career.history.length > 0 && (
              <div className="mb-3">
                <CareerTimeline history={career.history} currentDivision={career.currentDivision} currentSeason={career.season} />
              </div>
            )}

            <div className="grid grid-cols-4 gap-1.5">
              <SettingChip label={t("career.formation")} value={FORMATIONS.find((f) => f.key === career.formationKey)?.label ?? career.formationKey} />
              <SettingChip label={t("career.rerolls")} value={String(career.rerollCount)} />
              <SettingChip label={t("career.substitutions")} value={String(career.wisselCount)} />
              <SettingChip label={t("career.competitions")} value={career.leagues.length === 0 ? t("career.allSeven") : `${career.leagues.length}/7`} />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              disabled={!loaded}
              onClick={playSeason}
              className="btn-primary flex-1"
            >
              {loaded ? t("career.playSeasonN", { n: career.season }) : t("common.loading")}
            </button>
            <button
              onClick={() => userId && career.endCareer(userId)}
              className="rounded-xl border border-loss/30 bg-loss/[0.08] px-4 py-3 text-xs font-bold text-loss hover:bg-loss/[0.14] transition"
            >
              {t("career.stop")}
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full pb-12">
      <Header backHref="/" />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-400/12 text-indigo-300 ring-1 ring-indigo-400/25"><IconTrophy className="h-7 w-7" /></div>
          <h1 className="text-3xl font-black text-text font-display tracking-tight">{t("career.offlineTitle")}</h1>
          <p className="mt-2 text-sm text-dim">
            {t("career.offlineIntro")}
          </p>
        </div>

        <div className="card p-6">
          <div className="mb-3.5">
            <div className="eyebrow mb-1.5">{t("career.formation")}</div>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
              {FORMATIONS.map((fm) => (
                <button key={fm.key} onClick={() => setFormationKey(fm.key)} className={chipBtn(formationKey === fm.key)}>
                  {fm.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3.5">
            <div className="eyebrow mb-1.5">{t("career.rerollsPerSeason")}</div>
            <div className="flex gap-1.5">
              {REROLL_OPTIONS.map((n) => (
                <button key={n} onClick={() => setRerollCount(n)} className={`flex-1 ${chipBtn(rerollCount === n)}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3.5">
            <div className="eyebrow mb-1.5">{t("career.substitutionsPerSeason")}</div>
            <div className="flex gap-1.5">
              {WISSEL_OPTIONS.map((n) => (
                <button key={n} onClick={() => setWisselCount(n)} className={`flex-1 ${chipBtn(wisselCount === n)}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="eyebrow mb-1.5">{t("career.competitions")}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {LEAGUES.map((l) => {
                const active = selectedLeagues.includes(l.code);
                return (
                  <button key={l.code} onClick={() => toggleLeague(l.code)} className={`flex items-center gap-1.5 ${chipBtn(active)}`}>
                    <span>{l.flag}</span>
                    <span className="truncate">{l.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button disabled={!loaded} onClick={handleStart} className="btn-primary w-full">
            {loaded ? t("career.startCareer") : t("common.loading")}
          </button>
        </div>
      </div>
      <Footer />
    </main>
  );
}
