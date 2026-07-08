"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useGame } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { QUALIFICATION_LABELS } from "@/lib/sim";
import { saveResult } from "@/lib/saveResult";
import { leagueName } from "@/lib/leagues";
import { computeAchievements, type Achievement } from "@/lib/achievements";
import { useCustomPlayer, isCustomPlayer } from "@/lib/customPlayer";
import { useT } from "@/lib/i18n/core";
import ShareCard from "./ShareCard";
import { LoginPrompt } from "./AuthGate";
import { CareerResultBanner, TransferWindow } from "./CareerView";
import { useCareer } from "@/lib/career";
import { computeSeasonXp, useXp, xpProgress } from "@/lib/xp";
import Confetti from "./Confetti";
import { IconBall, IconBolt, IconChart, IconStar } from "@/components/icons";

function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export default function ResultView() {
  const t = useT();
  const result = useGame((s) => s.result);
  const newGame = useGame((s) => s.newGame);
  const slots = useGame((s) => s.slots);
  const leagueCode = useGame((s) => s.leagueCode);
  const formationKey = useGame((s) => s.formationKey);
  const ratingMode = useGame((s) => s.ratingMode);
  const difficulty = useGame((s) => s.difficulty);
  const isChallenge = useGame((s) => s.isChallenge);
  const challengeWeek = useGame((s) => s.challengeWeek);
  const gameMode = useGame((s) => s.gameMode);
  const userId = useAuth((s) => s.userId);
  const career = useCareer();
  const recordCustomPlayerSeason = useCustomPlayer((s) => s.recordSeason);
  const [showTable, setShowTable] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [newLevel, setNewLevel] = useState<number | null>(null);
  const [confetti, setConfetti] = useState(false);
  const seasonXpDone = useRef(false);
  const addXp = useXp((s) => s.addXp);
  const loadXp = useXp((s) => s.load);
  const authLoading = useAuth((s) => s.loading);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!result || !leagueCode) return;
    const achv = computeAchievements(result);
    setAchievements(achv);
  }, [result, leagueCode]);

  useEffect(() => {
    if (!result || authLoading || seasonXpDone.current) return;
    seasonXpDone.current = true;
    let cancelled = false;
    let confettiId: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      await loadXp(userId);
      if (cancelled) return;
      const gained = computeSeasonXp(result);
      const { before, after } = addXp(gained, userId);
      setXpGained(gained);
      if (xpProgress(after).level > xpProgress(before).level) setNewLevel(xpProgress(after).level);
      if (result.position === 1 || result.invincible) {
        setConfetti(true);
        confettiId = setTimeout(() => setConfetti(false), 6500);
      }
    })();
    return () => {
      cancelled = true;
      if (confettiId) clearTimeout(confettiId);
    };
  }, [result, authLoading, userId, addXp, loadXp]);

  useEffect(() => {
    if (!result || !userId || saved) return;
    const lc = leagueCode ?? "DIV";
    const ln = leagueCode ? leagueName(leagueCode) : `Divisie ${career.currentDivision}`;
    saveResult({
      userId,
      result,
      slots,
      leagueCode: lc,
      leagueName: ln,
      formation: formationKey,
      ratingMode,
      difficulty,
      isChallenge,
      challengeWeek,
      isCareer: gameMode === "career",
      careerDivision: gameMode === "career" ? career.currentDivision : undefined,
      careerSeason: gameMode === "career" ? career.season : undefined,
    }).then(() => setSaved(true));
  }, [result, userId, leagueCode, saved, slots, formationKey, ratingMode, difficulty]);

  useEffect(() => {
    if (!result || !userId || xpAwarded) return;
    setXpAwarded(true);
    if (!slots.some((s) => isCustomPlayer(s.player))) return;
    const stat = result.squadStats.find((p) => p.fromClub === "Jouw speler");
    recordCustomPlayerSeason(userId, {
      champion: result.position === 1,
      goals: stat?.goals ?? 0,
      assists: stat?.assists ?? 0,
      cleanSheets: stat?.cleanSheets ?? 0,
    });
  }, [result, userId, xpAwarded, slots, recordCustomPlayerSeason]);

  async function shareResult() {
    if (sharing) return;
    setSharing(true);
    try {
      const node = cardRef.current;
      if (!node) {
        alert(t("result.shareCardLoadFailed"));
        return;
      }
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "elite-football.png", { type: "image/png" });

      let shared = false;
      try {
        const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
        if (nav.canShare?.({ files: [file] })) {
          await nav.share({ files: [file], title: "Elite Football", text: t("result.shareText") });
          shared = true;
        }
      } catch {
        // share dismissed or unsupported, fall through to download
      }

      if (!shared) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "elite-football.png";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      console.error("Share failed:", e);
      alert(t("result.shareFailed", { message: e.message }));
    } finally {
      setSharing(false);
    }
  }

  const pointsAnimated = useCountUp(result?.userRow.points ?? 0);

  if (!result) return null;
  const { userRow, position, invincible, qualification, table, matches, awards, squadStats } =
    result;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
      {confetti && <Confetti />}
      {/* Reveal-kop */}
      <div className="card animate-pop p-6 text-center">
        {invincible ? (
          <>
            <div className="mx-auto flex h-16 w-16 animate-floaty items-center justify-center rounded-full bg-accent/15 text-accent ring-1 ring-accent/30">
              <IconStar className="h-9 w-9" />
            </div>
            <div className="mt-3 stat-num text-3xl text-accent text-glow">THE INVINCIBLES</div>
            <div className="mt-1 text-sm text-dim">
              {t("result.invincibleDesc")} <b className="text-text">38-0-0</b>.
            </div>
          </>
        ) : (
          <>
            <div className="eyebrow">{t("result.finalStandings")}</div>
            <div className="mt-2 stat-num text-6xl text-text">
              {position}
              <span className="text-3xl text-faint">
                {position === 1 ? t("result.ordinalSte") : position === 2 ? t("result.ordinalDe") : t("result.ordinalE")}
              </span>
            </div>
            <div className="mt-2 text-base font-bold text-accent">
              {QUALIFICATION_LABELS[qualification]}
            </div>
          </>
        )}

        {xpGained > 0 && (
          <div className="mt-4 flex flex-col items-center gap-1.5">
            <span className="animate-pop inline-flex items-center gap-1.5 rounded-full border border-violet-400/25 bg-violet-400/[0.12] px-4 py-1.5 text-sm font-black text-violet-200" style={{ animationDelay: "400ms" }}>
              <IconBolt className="h-4 w-4" />
              {t("result.xpEarned", { xp: xpGained })}
            </span>
            {newLevel !== null && (
              <span className="animate-pop inline-flex items-center gap-1.5 rounded-full bg-violet-500/25 px-4 py-1.5 text-sm font-black text-violet-100 ring-1 ring-violet-400/40" style={{ animationDelay: "900ms" }}>
                {t("result.levelUp", { level: newLevel })}
              </span>
            )}
          </div>
        )}

        <div className="mx-auto mt-5 grid max-w-md grid-cols-4 gap-2 text-center">
          <Stat label={t("result.points")} value={pointsAnimated} accent />
          <Stat label={t("result.wonAbbr")} value={userRow.won} />
          <Stat label={t("result.drawnAbbr")} value={userRow.drawn} />
          <Stat label={t("result.lostAbbr")} value={userRow.lost} />
        </div>
        <div className="mx-auto mt-2 grid max-w-md grid-cols-3 gap-2 text-center">
          <Stat label={t("result.goalsFor")} value={userRow.gf} />
          <Stat label={t("result.goalsAgainst")} value={userRow.ga} />
          <Stat label={t("result.goalDiff")} value={(userRow.gd >= 0 ? "+" : "") + userRow.gd} />
        </div>
      </div>

      {/* Awards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Award icon={<IconBall className="h-4 w-4" />} chip="bg-accent/12 text-accent" title={t("result.topScorer")} name={awards.topScorer?.name ?? "—"} value={awards.topScorer ? t("result.goalsCount", { count: awards.topScorer.goals }) : ""} />
        <Award icon={<IconStar className="h-4 w-4" />} chip="bg-sky-400/12 text-sky-300" title={t("result.topAssister")} name={awards.topAssister?.name ?? "—"} value={awards.topAssister ? t("result.assistsCount", { count: awards.topAssister.assists }) : ""} />
        <Award icon={<IconChart className="h-4 w-4" />} chip="bg-violet-400/12 text-violet-300" title={t("result.goldenGlove")} name={awards.goalkeeper?.name ?? "—"} value={t("result.cleanSheetsCount", { count: awards.cleanSheets })} />
        <Award icon={<IconBolt className="h-4 w-4" />} chip="bg-draw/15 text-draw" title={t("result.biggestWin")} name={awards.biggestWin ? `vs ${awards.biggestWin.opponent}` : "—"} value={awards.biggestWin ? `${awards.biggestWin.gf}-${awards.biggestWin.ga}` : ""} />
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="card animate-fade-up p-5">
          <div className="eyebrow mb-3">{t("result.achievements")}</div>
          <div className="flex flex-wrap gap-2">
            {achievements.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full border border-draw/25 bg-draw/[0.08] px-3.5 py-1.5 text-xs font-bold text-draw">
                {a.icon} {t(`achievement.${a.id}.label`)}
              </span>
            ))}
          </div>
        </div>
      )}

      <CareerResultBanner />
      <TransferWindow />

      {!userId && !saved && (
        <button onClick={() => setShowLogin(true)} className="btn-primary w-full text-base">
          {t("result.loginToSave")}
        </button>
      )}
      {saved && (
        <div className="text-center text-xs font-bold text-accent">{t("result.resultSaved")}</div>
      )}

      <button
        onClick={shareResult}
        disabled={sharing}
        className={`${userId || saved ? "btn-primary" : "btn-secondary"} w-full text-base`}
      >
        {sharing ? t("result.creatingCard") : t("result.shareYourResult")}
      </button>

      <div className="flex gap-2">
        <button onClick={() => setShowTable((v) => !v)} className="btn-secondary flex-1">
          {showTable ? t("result.hideStandings") : t("result.showStandings")}
        </button>
        <button onClick={newGame} className="btn-primary flex-1 text-sm">
          {t("result.playAgain")}
        </button>
      </div>

      {/* Verborgen resultkaart voor export */}
      <div aria-hidden style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }}>
        <ShareCard ref={cardRef} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        {showTable && (
          <div className="card-solid overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-white/[0.03] text-faint">
                <tr className="[&>th]:font-bold [&>th]:uppercase [&>th]:tracking-wider [&>th]:text-[10px]">
                  <th className="px-3 py-2.5 text-left">#</th>
                  <th className="px-3 py-2.5 text-left">{t("result.team")}</th>
                  <th className="px-2 py-2.5 text-right">{t("result.playedAbbr")}</th>
                  <th className="px-2 py-2.5 text-right">{t("result.goalDiffAbbr")}</th>
                  <th className="px-3 py-2.5 text-right">{t("result.pointsAbbr")}</th>
                </tr>
              </thead>
              <tbody>
                {table.map((r, i) => (
                  <tr
                    key={r.name}
                    className={`animate-fade-up border-t border-line ${
                      r.isUser ? "bg-accent/[0.08] font-bold text-accent" : "text-dim"
                    }`}
                    style={{ animationDelay: `${i * 45}ms` }}
                  >
                    <td className="px-3 py-2">
                      <span className={`stat-num text-sm ${i < 4 ? "text-accent-2" : i >= 17 ? "text-loss" : "text-faint"}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="max-w-[150px] truncate px-3 py-2">{r.name}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{r.played}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {(r.gd >= 0 ? "+" : "") + r.gd}
                    </td>
                    <td className="px-3 py-2 text-right stat-num text-sm text-text">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="card-solid overflow-hidden">
          <div className="px-5 py-3 eyebrow">{t("result.playerStats")}</div>
          <table className="w-full text-xs">
            <thead className="bg-white/[0.03] text-faint">
              <tr className="[&>th]:font-bold [&>th]:uppercase [&>th]:tracking-wider [&>th]:text-[10px]">
                <th className="px-3 py-2 text-left">{t("result.player")}</th>
                <th className="px-2 py-2 text-left">{t("result.pos")}</th>
                <th className="px-2 py-2 text-right">{t("result.goalsAbbr")}</th>
                <th className="px-2 py-2 text-right">{t("result.assistsAbbr")}</th>
                <th className="px-3 py-2 text-right">{t("result.cleanSheetsAbbr")}</th>
              </tr>
            </thead>
            <tbody>
              {squadStats.map((p) => (
                <tr key={p.name} className="border-t border-line text-dim">
                  <td className="max-w-[150px] truncate px-3 py-2">{p.name}</td>
                  <td className="px-2 py-2 text-faint">{p.pos}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{p.goals || "—"}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{p.assists || "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.cleanSheets || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alle uitslagen */}
      <details className="card">
        <summary className="cursor-pointer px-5 py-3.5 eyebrow">
          {t("result.allResults", { count: 38 })}
        </summary>
        <div className="grid grid-cols-2 gap-1.5 px-4 pb-4 text-[11px] sm:grid-cols-3">
          {matches.map((m, i) => {
            const win = m.gf > m.ga;
            const draw = m.gf === m.ga;
            return (
              <div
                key={i}
                className={`flex items-center justify-between rounded-lg border px-3 py-1.5 ${
                  win ? "border-win/20 bg-win/[0.07]" : draw ? "border-draw/20 bg-draw/[0.07]" : "border-loss/20 bg-loss/[0.07]"
                }`}
              >
                <span className="truncate text-dim">
                  {m.home ? "" : "@"}
                  {m.opponent}
                </span>
                <span className="ml-1 shrink-0 stat-num text-sm text-text">
                  {m.gf}-{m.ga}
                </span>
              </div>
            );
          })}
        </div>
      </details>

      {showLogin && <LoginPrompt onClose={() => setShowLogin(false)} />}
    </div>
  );
}

function Award({ icon, chip, title, name, value }: { icon: React.ReactNode; chip: string; title: string; name: string; value: string }) {
  return (
    <div className="card p-3.5">
      <div className="flex items-center gap-1.5 eyebrow">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${chip}`}>{icon}</span>
        <span className="truncate">{title}</span>
      </div>
      <div className="mt-1.5 truncate text-sm font-bold text-text">{name}</div>
      <div className="truncate text-[11px] text-accent">{value}</div>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border px-2 py-2.5 ${accent ? "border-accent/30 bg-accent/[0.08]" : "border-line bg-white/[0.03]"}`}>
      <div className={`stat-num text-2xl ${accent ? "text-accent" : "text-text"}`}>
        {value}
      </div>
      <div className="eyebrow mt-0.5">{label}</div>
    </div>
  );
}
