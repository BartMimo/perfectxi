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

const REROLL_OPTIONS = [0, 1, 2, 3];
const WISSEL_OPTIONS = [0, 1, 2, 3, 4];

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
          <div className="text-4xl mb-2">🌐</div>
          <h1 className="text-3xl font-black text-slate-800">{t("onlineCarriere.title")}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {t("onlineCarriere.intro")}
          </p>
        </div>

        <div className="mb-6 card p-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">{t("onlineCarriere.howItWorks.title")}</h3>
          <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
            <li>{t("onlineCarriere.howItWorks.step1")}</li>
            <li>{t("onlineCarriere.howItWorks.step2")}</li>
            <li>{t("onlineCarriere.howItWorks.step3")}</li>
            <li>{t("onlineCarriere.howItWorks.step4")}</li>
            <li>{t("onlineCarriere.howItWorks.step5")}</li>
            <li>{t("onlineCarriere.howItWorks.step6")}</li>
          </ol>
        </div>

        {openLobbies.length > 0 && (
          <div className="mb-6 card p-5 border-2 border-cyan-200/60 bg-gradient-to-br from-cyan-50/60 to-blue-50/30">
            <div className="text-xs font-black uppercase tracking-widest text-cyan-700 mb-3">
              🔓 {t("onlineCarriere.openLobbies.title")}
            </div>
            <div className="flex flex-col gap-1.5">
              {openLobbies.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleJoinOpen(l.code)}
                  disabled={loading}
                  className="flex items-center justify-between rounded-xl bg-white/80 border border-cyan-100 px-3 py-2.5 text-left hover:shadow-sm hover:border-cyan-200 transition disabled:opacity-40"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-black tracking-wider text-cyan-600 shrink-0">{l.code}</span>
                    <span className="text-sm font-bold text-slate-800 truncate">{l.lobby_name || "—"}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">{t("onlineCarriere.playerCountOf20", { n: l.player_count })}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!userId ? (
          <div className="card p-6 text-center">
            <p className="text-sm text-slate-500 mb-4">{t("onlineCarriere.loginToJoin")}</p>
            <button onClick={() => setShowLogin(true)} className="btn-primary w-full">
              {t("common.login")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Actieve carrières */}
            {myLobbies.length > 0 && (
              <div className="card p-5 border-2 border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 to-purple-50/50">
                <div className="text-xs font-black uppercase tracking-widest text-indigo-700 mb-3">
                  {t("onlineCarriere.yourCareers")}
                </div>
                <div className="flex flex-col gap-1.5">
                  {myLobbies.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => router.push(`/online-carriere/${l.code}`)}
                      className="flex items-center justify-between rounded-xl bg-white/80 border border-indigo-100 px-3 py-2.5 text-left hover:shadow-sm hover:border-indigo-200 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black tracking-wider text-indigo-600 shrink-0">{l.code}</span>
                        <span className="text-sm font-bold text-slate-800 truncate">{l.lobby_name || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold text-slate-400">{divisionLabel(t, l.current_division)}</span>
                        <span className="text-[10px] font-bold text-slate-400">S{l.current_season}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          l.status === "waiting" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
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
              <h2 className="text-sm font-black uppercase tracking-widest text-indigo-700 mb-3">
                {t("onlineCarriere.createNewGame")}
              </h2>
              <input
                type="text"
                value={lobbyName}
                onChange={(e) => setLobbyName(e.target.value)}
                placeholder={t("onlineCarriere.lobbyNamePlaceholder")}
                maxLength={30}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-bold focus:border-indigo-400 focus:outline-none transition mb-3"
              />
              <p className="text-sm text-slate-500 mb-4">
                {t("onlineCarriere.createLobbyDesc")}
              </p>

              <div className="mb-3.5">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">{t("onlineCarriere.rerollsPerPlayer")}</div>
                <div className="flex gap-1.5">
                  {REROLL_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setRerollCount(n)}
                      className={`flex-1 rounded-xl border-2 py-2 text-sm font-bold transition-all ${
                        rerollCount === n
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                          : "border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3.5">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">{t("onlineCarriere.wisselsPerRound")}</div>
                <div className="flex gap-1.5">
                  {WISSEL_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setWisselCount(n)}
                      className={`flex-1 rounded-xl border-2 py-2 text-sm font-bold transition-all ${
                        wisselCount === n
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                          : "border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3.5">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">{t("onlineCarriere.competitions")}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {LEAGUES.map((l) => {
                    const active = selectedLeagues.includes(l.code);
                    return (
                      <button
                        key={l.code}
                        onClick={() => toggleLeague(l.code)}
                        className={`flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-2 text-xs font-bold transition-all ${
                          active
                            ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                            : "border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        <span>{l.flag}</span>
                        <span className="truncate">{l.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setSameFormation((v) => !v)}
                className="mb-3 flex w-full items-center justify-between rounded-xl bg-slate-50 border-2 border-transparent px-4 py-3 text-left hover:bg-slate-100 transition"
              >
                <span className="text-sm font-bold text-slate-600">{t("onlineCarriere.sameFormationForAll")}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${
                  sameFormation ? "bg-indigo-500 text-white" : "bg-white text-slate-400 border border-slate-200"
                }`}>
                  {sameFormation ? t("onlineCarriere.on") : t("onlineCarriere.off")}
                </span>
              </button>

              <button
                onClick={() => setIsPublic((v) => !v)}
                className="mb-4 flex w-full items-center justify-between rounded-xl bg-slate-50 border-2 border-transparent px-4 py-3 text-left hover:bg-slate-100 transition"
              >
                <span className="text-left">
                  <span className="block text-sm font-bold text-slate-600">{isPublic ? t("onlineCarriere.openLobby") : t("onlineCarriere.closedLobby")}</span>
                  <span className="block text-[11px] text-slate-400">
                    {isPublic ? t("onlineCarriere.openLobbyDesc") : t("onlineCarriere.closedLobbyDesc")}
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                  isPublic ? "bg-cyan-500 text-white" : "bg-white text-slate-400 border border-slate-200"
                }`}>
                  {isPublic ? t("onlineCarriere.open") : t("onlineCarriere.closed")}
                </span>
              </button>

              <button
                onClick={() => setAllowCustomPlayer((v) => !v)}
                className="mb-4 flex w-full items-center justify-between rounded-xl bg-slate-50 border-2 border-transparent px-4 py-3 text-left hover:bg-slate-100 transition"
              >
                <span className="text-left">
                  <span className="block text-sm font-bold text-slate-600">{t("onlineCarriere.allowCustomPlayer")}</span>
                  <span className="block text-[11px] text-slate-400">
                    {allowCustomPlayer ? t("onlineCarriere.allowCustomPlayerDesc") : t("onlineCarriere.disallowCustomPlayerDesc")}
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                  allowCustomPlayer ? "bg-indigo-500 text-white" : "bg-white text-slate-400 border border-slate-200"
                }`}>
                  {allowCustomPlayer ? t("onlineCarriere.on") : t("onlineCarriere.off")}
                </span>
              </button>

              <button
                disabled={loading}
                onClick={handleCreate}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3.5 text-base font-extrabold text-white shadow-md shadow-indigo-200/50 transition hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-40"
              >
                {loading ? t("onlineCarriere.creating") : t("onlineCarriere.createLobbyBtn")}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-bold text-slate-400">{t("onlineCarriere.or")}</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="card p-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-indigo-700 mb-3">
                {t("onlineCarriere.joinWithCode")}
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABCD12"
                  maxLength={6}
                  className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 text-center text-lg font-bold tracking-[0.3em] uppercase focus:border-indigo-400 focus:outline-none transition"
                />
                <button
                  disabled={loading || joinCode.trim().length < 4}
                  onClick={handleJoin}
                  className="rounded-xl bg-indigo-500 px-6 py-3 font-bold text-white transition hover:bg-indigo-600 disabled:opacity-40"
                >
                  {t("onlineCarriere.join")}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-bold text-rose-600 text-center">
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
