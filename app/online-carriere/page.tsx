"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useOnlineCareer } from "@/lib/onlineCareer";
import { divisionLabel } from "@/lib/career";
import { LEAGUES } from "@/lib/leagues";
import { LoginPrompt } from "@/components/AuthGate";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useT } from "@/lib/i18n/core";
import { IconGlobe } from "@/components/icons";

const REROLL_OPTIONS = [0, 1, 2, 3];
const WISSEL_OPTIONS = [0, 1, 2, 3, 4];

const chipBtn = (active: boolean) =>
  `rounded-xl border py-2 text-sm font-bold transition-all ${
    active
      ? "border-accent/60 bg-accent/[0.08] text-accent"
      : "border-line bg-white/[0.03] text-dim hover:bg-white/[0.06]"
  }`;

function statusLabel(t: ReturnType<typeof useT>, status: string): string {
  switch (status) {
    case "waiting": return t("onlineCarriere.status.waiting");
    case "drafting": return t("onlineCarriere.status.drafting");
    case "simulating": return t("onlineCarriere.status.simulating");
    case "finished": return t("onlineCarriere.status.finished");
    default: return status;
  }
}

export default function OnlineCarrierePage() {
  const t = useT();
  const router = useRouter();
  const userId = useAuth((s) => s.userId);
  const username = useAuth((s) => s.username);
  const teamName = useAuth((s) => s.teamName);
  const { createLobby, joinLobby, loadMyLobbies, myLobbies, loadOpenLobbies, openLobbies, loading, error } = useOnlineCareer();
  const [joinCode, setJoinCode] = useState("");
  const [lobbyName, setLobbyName] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [rerollCount, setRerollCount] = useState(1);
  const [wisselCount, setWisselCount] = useState(2);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(LEAGUES.map((l) => l.code));
  const [sameFormation, setSameFormation] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [allowCustomPlayer, setAllowCustomPlayer] = useState(true);

  useEffect(() => {
    if (userId) loadMyLobbies(userId);
  }, [userId]);

  useEffect(() => {
    loadOpenLobbies();
  }, []);

  const toggleLeague = (code: string) => {
    setSelectedLeagues((prev) => {
      if (prev.includes(code)) {
        if (prev.length === 1) return prev; // minstens 1 competitie
        return prev.filter((c) => c !== code);
      }
      return [...prev, code];
    });
  };

  const handleCreate = async () => {
    if (!userId || !username) return;
    const code = await createLobby(userId, username, teamName, lobbyName, {
      rerollCount,
      wisselCount,
      leagues: selectedLeagues.length === LEAGUES.length ? [] : selectedLeagues,
      sameFormation,
      isPublic,
      allowCustomPlayer,
    });
    if (code) router.push(`/online-carriere/${code}`);
  };

  const handleJoin = async () => {
    if (!userId || !username || !joinCode.trim()) return;
    const ok = await joinLobby(joinCode, userId, username, teamName);
    if (ok) router.push(`/online-carriere/${joinCode.toUpperCase().trim()}`);
  };

  const handleJoinOpen = async (code: string) => {
    if (!userId || !username) { setShowLogin(true); return; }
    const ok = await joinLobby(code, userId, username, teamName);
    if (ok) router.push(`/online-carriere/${code}`);
  };

  return (
    <main className="min-h-screen w-full pb-12">
      <Header backHref="/" />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="text-center mb-8">
          <div className="animate-floaty mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-400/12 text-sky-300 ring-1 ring-sky-400/25"><IconGlobe className="h-7 w-7" /></div>
          <h1 className="text-3xl font-black text-text font-display tracking-tight">{t("onlineCarriere.title")}</h1>
          <p className="mt-2 text-sm text-dim">
            {t("onlineCarriere.intro")}
          </p>
        </div>

        <div className="mb-6 card p-5">
          <h3 className="eyebrow mb-3">{t("onlineCarriere.howItWorks.title")}</h3>
          <ol className="text-sm text-dim space-y-2 list-decimal list-inside marker:text-faint">
            <li>{t("onlineCarriere.howItWorks.step1")}</li>
            <li>{t("onlineCarriere.howItWorks.step2")}</li>
            <li>{t("onlineCarriere.howItWorks.step3")}</li>
            <li>{t("onlineCarriere.howItWorks.step4")}</li>
            <li>{t("onlineCarriere.howItWorks.step5")}</li>
            <li>{t("onlineCarriere.howItWorks.step6")}</li>
          </ol>
        </div>

        {openLobbies.length > 0 && (
          <div className="mb-6 card p-5 border border-cyan-400/25">
            <div className="eyebrow text-cyan-300 mb-3">
              🔓 {t("onlineCarriere.openLobbies.title")}
            </div>
            <div className="flex flex-col gap-1.5">
              {openLobbies.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleJoinOpen(l.code)}
                  disabled={loading}
                  className="flex items-center justify-between rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 text-left hover:bg-white/[0.06] hover:border-cyan-400/30 transition disabled:opacity-40"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="stat-num text-sm tracking-wider text-cyan-300 shrink-0">{l.code}</span>
                    <span className="text-sm font-bold text-text truncate">{l.lobby_name || "—"}</span>
                  </div>
                  <span className="text-[10px] font-bold text-faint shrink-0">{t("onlineCarriere.playerCountOf20", { n: l.player_count })}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!userId ? (
          <div className="card p-6 text-center">
            <p className="text-sm text-dim mb-4">{t("onlineCarriere.loginToJoin")}</p>
            <button onClick={() => setShowLogin(true)} className="btn-primary w-full">
              {t("common.login")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Actieve carrières */}
            {myLobbies.length > 0 && (
              <div className="card p-5 border border-indigo-400/25">
                <div className="eyebrow text-indigo-300 mb-3">
                  {t("onlineCarriere.yourCareers")}
                </div>
                <div className="flex flex-col gap-1.5">
                  {myLobbies.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => router.push(`/online-carriere/${l.code}`)}
                      className="flex items-center justify-between rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 text-left hover:bg-white/[0.06] hover:border-indigo-400/30 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="stat-num text-sm tracking-wider text-indigo-300 shrink-0">{l.code}</span>
                        <span className="text-sm font-bold text-text truncate">{l.lobby_name || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold text-faint">{divisionLabel(t, l.current_division)}</span>
                        <span className="text-[10px] font-bold text-faint">S{l.current_season}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          l.status === "waiting" ? "bg-draw/12 text-draw" : "bg-accent/12 text-accent"
                        }`}>
                          {statusLabel(t, l.status)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="card p-6">
              <h2 className="eyebrow mb-3">
                {t("onlineCarriere.createNewGame")}
              </h2>
              <input
                type="text"
                value={lobbyName}
                onChange={(e) => setLobbyName(e.target.value)}
                placeholder={t("onlineCarriere.lobbyNamePlaceholder")}
                maxLength={30}
                className="glass-input w-full !py-3 !text-sm mb-3"
              />
              <p className="text-sm text-dim mb-4">
                {t("onlineCarriere.createLobbyDesc")}
              </p>

              <div className="mb-3.5">
                <div className="eyebrow mb-1.5">{t("onlineCarriere.rerollsPerPlayer")}</div>
                <div className="flex gap-1.5">
                  {REROLL_OPTIONS.map((n) => (
                    <button key={n} onClick={() => setRerollCount(n)} className={`flex-1 ${chipBtn(rerollCount === n)}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3.5">
                <div className="eyebrow mb-1.5">{t("onlineCarriere.wisselsPerRound")}</div>
                <div className="flex gap-1.5">
                  {WISSEL_OPTIONS.map((n) => (
                    <button key={n} onClick={() => setWisselCount(n)} className={`flex-1 ${chipBtn(wisselCount === n)}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3.5">
                <div className="eyebrow mb-1.5">{t("onlineCarriere.competitions")}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {LEAGUES.map((l) => {
                    const active = selectedLeagues.includes(l.code);
                    return (
                      <button key={l.code} onClick={() => toggleLeague(l.code)} className={`flex items-center gap-1.5 px-2.5 ${chipBtn(active)}`}>
                        <span>{l.flag}</span>
                        <span className="truncate">{l.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setSameFormation((v) => !v)}
                className="mb-3 flex w-full items-center justify-between rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition"
              >
                <span className="text-sm font-bold text-dim">{t("onlineCarriere.sameFormationForAll")}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${
                  sameFormation ? "bg-accent text-accent-ink" : "border border-line bg-white/[0.04] text-faint"
                }`}>
                  {sameFormation ? t("onlineCarriere.on") : t("onlineCarriere.off")}
                </span>
              </button>

              <button
                onClick={() => setIsPublic((v) => !v)}
                className="mb-4 flex w-full items-center justify-between rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition"
              >
                <span className="text-left">
                  <span className="block text-sm font-bold text-dim">{isPublic ? t("onlineCarriere.openLobby") : t("onlineCarriere.closedLobby")}</span>
                  <span className="block text-[11px] text-faint">
                    {isPublic ? t("onlineCarriere.openLobbyDesc") : t("onlineCarriere.closedLobbyDesc")}
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                  isPublic ? "bg-cyan-400 text-cyan-950" : "border border-line bg-white/[0.04] text-faint"
                }`}>
                  {isPublic ? t("onlineCarriere.open") : t("onlineCarriere.closed")}
                </span>
              </button>

              <button
                onClick={() => setAllowCustomPlayer((v) => !v)}
                className="mb-4 flex w-full items-center justify-between rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition"
              >
                <span className="text-left">
                  <span className="block text-sm font-bold text-dim">{t("onlineCarriere.allowCustomPlayer")}</span>
                  <span className="block text-[11px] text-faint">
                    {allowCustomPlayer ? t("onlineCarriere.allowCustomPlayerDesc") : t("onlineCarriere.disallowCustomPlayerDesc")}
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                  allowCustomPlayer ? "bg-accent text-accent-ink" : "border border-line bg-white/[0.04] text-faint"
                }`}>
                  {allowCustomPlayer ? t("onlineCarriere.on") : t("onlineCarriere.off")}
                </span>
              </button>

              <button disabled={loading} onClick={handleCreate} className="btn-primary w-full">
                {loading ? t("onlineCarriere.creating") : t("onlineCarriere.createLobbyBtn")}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="eyebrow">{t("onlineCarriere.or")}</span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <div className="card p-6">
              <h2 className="eyebrow mb-3">
                {t("onlineCarriere.joinWithCode")}
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABCD12"
                  maxLength={6}
                  className="glass-input flex-1 text-center !text-lg font-bold tracking-[0.3em] uppercase"
                />
                <button
                  disabled={loading || joinCode.trim().length < 4}
                  onClick={handleJoin}
                  className="btn-primary px-6"
                >
                  {t("onlineCarriere.join")}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-loss/30 bg-loss/[0.1] px-4 py-3 text-sm font-bold text-loss text-center">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
      {showLogin && <LoginPrompt onClose={() => setShowLogin(false)} />}
      <Footer />
    </main>
  );
}
