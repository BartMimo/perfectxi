"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useOnlineCareer, type OnlinePlayer, type OnlineCareer } from "@/lib/onlineCareer";
import { useGame } from "@/lib/store";
import { divisionLabel, getDivisionRatingRange } from "@/lib/career";
import type { ClubSeasonLite } from "@/lib/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PitchView from "@/components/PitchView";
import ReelView from "@/components/ReelView";
import SquadPicker from "@/components/SquadPicker";
import SimulationView from "@/components/SimulationView";
import OnlineResultView from "@/components/OnlineResultView";
import { filledCount } from "@/lib/store";

function PlayerList({ players, currentUserId, ownerId, onKick }: { players: OnlinePlayer[]; currentUserId: string | null; ownerId?: string; onKick?: (userId: string) => void }) {
  const sorted = [...players].sort((a, b) => a.current_division - b.current_division || a.username.localeCompare(b.username));
  const isOwner = currentUserId === ownerId;

  return (
    <div className="flex flex-col gap-1.5">
      {sorted.map((p) => (
        <div
          key={p.user_id}
          className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 ${
            p.user_id === currentUserId
              ? "bg-indigo-50 border-2 border-indigo-200"
              : p.is_bot
                ? "bg-slate-100/60 border-2 border-dashed border-slate-200"
                : "bg-slate-50/80 border-2 border-transparent"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {p.is_bot && <span className="text-xs">🤖</span>}
            <span className={`text-sm font-bold truncate ${p.is_bot ? "text-slate-500" : "text-slate-800"}`}>
              {p.team_name || p.username}
            </span>
            {p.user_id === currentUserId && (
              <span className="text-[10px] font-bold text-indigo-500">(jij)</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {divisionLabel(p.current_division)}
            </span>
            {p.championships > 0 && (
              <span className="text-[10px] font-bold text-amber-600">{p.championships}x🏆</span>
            )}
            {p.ready ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">✓</span>
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs text-slate-400">…</span>
            )}
            {isOwner && onKick && p.user_id !== currentUserId && !p.is_bot && (
              <button
                onClick={() => onKick(p.user_id)}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs text-rose-500 hover:bg-rose-200 transition"
                title="Verwijder speler"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DivisionOverview({ players }: { players: OnlinePlayer[] }) {
  const divisions = new Map<number, OnlinePlayer[]>();
  for (const p of players) {
    const list = divisions.get(p.current_division) || [];
    list.push(p);
    divisions.set(p.current_division, list);
  }
  const sortedDivs = [...divisions.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <div className="flex flex-col gap-3">
      {sortedDivs.map(([div, divPlayers]) => (
        <div key={div} className="card p-4">
          <div className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">
            {divisionLabel(div)}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {divPlayers
              .sort((a, b) => {
                const lastA = a.history.filter((h) => h.division === div).pop();
                const lastB = b.history.filter((h) => h.division === div).pop();
                return (lastA?.position ?? 99) - (lastB?.position ?? 99);
              })
              .map((p) => {
                const lastInDiv = p.history.filter((h) => h.division === div).pop();
                return (
                  <span
                    key={p.user_id}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                      lastInDiv?.position === 1
                        ? "bg-amber-100 text-amber-800"
                        : lastInDiv && lastInDiv.position >= 18
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {p.team_name || p.username}
                    {lastInDiv && ` (${lastInDiv.position}e)`}
                  </span>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

function WaitingRoom() {
  const { lobby, startDraft, leaveLobby, kickPlayer } = useOnlineCareer();
  const userId = useAuth((s) => s.userId);
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  if (!lobby) return null;
  const isOwner = lobby.owner_id === userId;

  const copyCode = () => {
    navigator.clipboard.writeText(lobby.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    if (!userId) return;
    await leaveLobby(userId);
    router.push("/online-carriere");
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="text-center mb-6">
        <div className="text-3xl mb-2">🏟️</div>
        <h1 className="text-2xl font-black text-slate-800">Online Carrière</h1>
        <p className="text-sm text-slate-500 mt-1">Wacht tot iedereen er is</p>
      </div>

      <div className="card p-6 text-center mb-4">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Uitnodigingscode</div>
        <button onClick={copyCode} className="text-4xl font-black tracking-[0.4em] text-indigo-600 hover:text-indigo-700 transition">
          {lobby.code}
        </button>
        <div className="text-xs text-slate-400 mt-1">
          {copied ? "Gekopieerd!" : "Klik om te kopiëren"}
        </div>
      </div>

      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            Spelers ({lobby.players.length}/20)
          </span>
        </div>
        <PlayerList players={lobby.players} currentUserId={userId} ownerId={lobby.owner_id} onKick={kickPlayer} />
      </div>

      <div className="flex gap-2">
        {isOwner ? (
          <button
            disabled={lobby.players.length < 2}
            onClick={startDraft}
            className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3.5 text-base font-extrabold text-white shadow-md shadow-indigo-200/50 transition hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-40"
          >
            {lobby.players.length < 2 ? "Wacht op meer spelers…" : "Start het spel!"}
          </button>
        ) : (
          <div className="flex-1 rounded-2xl bg-slate-100 px-5 py-3.5 text-center text-base font-bold text-slate-500">
            Wacht tot de host start…
          </div>
        )}
        <button onClick={handleLeave} className="btn-secondary !px-4 !py-3 text-rose-500">
          Verlaat
        </button>
      </div>
    </div>
  );
}

function OnlinePlayView() {
  const slots = useGame((s) => s.slots);
  const filled = filledCount(slots);
  const total = slots.length;
  const complete = filled === total;
  const simulate = useGame((s) => s.simulate);
  const teamName = useAuth((s) => s.teamName);
  const { lobby } = useOnlineCareer();
  const userId = useAuth((s) => s.userId);
  const me = lobby?.players.find((p) => p.user_id === userId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-5">
      {lobby && me && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-indigo-100 px-3 py-1.5 font-bold text-indigo-800">
            {divisionLabel(me.current_division)}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-bold text-slate-700">
            Seizoen {lobby.current_season}
          </span>
          {me.championships > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1.5 font-bold text-amber-700">
              {me.championships}x kampioen
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-start">
        <div className="min-w-0 lg:sticky lg:top-[74px]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-600">Jouw opstelling</h2>
            <span className="rounded-full bg-emerald-100/80 px-3 py-1.5 text-xs font-bold text-emerald-700">
              {complete ? "Compleet" : `${filled} / ${total}`}
            </span>
          </div>
          <PitchView />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {complete ? (
            <div className="card flex flex-col items-center gap-4 p-6 text-center">
              <div className="text-base font-extrabold text-emerald-700">Je XI is compleet!</div>
              <button onClick={() => simulate(teamName ?? undefined)} className="btn-primary w-full text-lg">
                Simuleer het seizoen
              </button>
            </div>
          ) : (
            <>
              <ReelView />
              <SquadPicker />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TransferPhase() {
  const { lobby, saveSquad } = useOnlineCareer();
  const userId = useAuth((s) => s.userId);
  const startCareerSeason = useGame((s) => s.startCareerSeason);
  const phase = useGame((s) => s.phase);
  const loaded = useGame((s) => s.index.length > 0);

  const me = lobby?.players.find((p) => p.user_id === userId);
  const [playersToReplace, setPlayersToReplace] = useState<Set<string>>(new Set());
  const [transfersDone, setTransfersDone] = useState(false);

  if (!lobby || !me || !userId) return null;

  const allReady = lobby.players.every((p) => p.ready);

  if (me.ready && !transfersDone) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <WaitingForOthers lobby={lobby} userId={userId} title="Wacht op andere spelers…" />
      </div>
    );
  }

  if (allReady && !transfersDone) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 text-center">
        <div className="card p-6">
          <div className="text-2xl mb-2">🔄</div>
          <h2 className="text-lg font-black text-slate-800 mb-2">Transferwindow</h2>
          <p className="text-sm text-slate-500 mb-4">
            {divisionLabel(me.current_division)} · Seizoen {lobby.current_season + 1}
          </p>
          <button
            disabled={!loaded}
            onClick={() => {
              setTransfersDone(true);
              const remaining = me.squad.filter((p) => !playersToReplace.has(p.name));
              startCareerSeason(me.current_division, remaining);
            }}
            className="btn-primary w-full"
          >
            Start transfers
          </button>
        </div>
      </div>
    );
  }

  if (transfersDone && phase === "start") {
    const remaining = me.squad.filter((p) => !playersToReplace.has(p.name));
    startCareerSeason(me.current_division, remaining);
    return null;
  }

  if (transfersDone) {
    return null;
  }

  const toggleReplace = (name: string) => {
    const next = new Set(playersToReplace);
    if (next.has(name)) next.delete(name);
    else if (next.size < 2) next.add(name);
    setPlayersToReplace(next);
  };

  const confirmTransfers = () => {
    const remaining = me.squad.filter((p) => !playersToReplace.has(p.name));
    setTransfersDone(true);
    startCareerSeason(me.current_division, remaining);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="card p-6">
        <div className="text-center mb-4">
          <div className="text-2xl mb-2">🔄</div>
          <h2 className="text-lg font-black text-slate-800">Transferwindow</h2>
          <p className="text-sm text-slate-500 mt-1">
            Kies maximaal 2 spelers om te vervangen.
          </p>
          <div className="mt-2 text-xs font-bold text-indigo-600">
            {divisionLabel(me.current_division)} · Seizoen {lobby.current_season + 1}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto mb-4">
          {me.squad.map((p) => {
            const selected = playersToReplace.has(p.name);
            return (
              <button
                key={p.name}
                onClick={() => toggleReplace(p.name)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all ${
                  selected
                    ? "bg-rose-50 border-2 border-rose-300"
                    : "bg-slate-50/80 border-2 border-transparent hover:border-slate-200"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-800">{p.name}</div>
                  <div className="text-[10px] text-slate-400">{p.fromClub} · {p.sub}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tabular-nums text-slate-600">{p.overall}</span>
                  {selected && <span className="text-xs font-bold text-rose-500">Weg</span>}
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={confirmTransfers} className="btn-primary w-full">
          {playersToReplace.size === 0
            ? "Ga door zonder transfers"
            : `Vervang ${playersToReplace.size} speler${playersToReplace.size > 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}

function WaitingForOthers({ lobby, userId, title }: { lobby: OnlineCareer; userId: string; title: string }) {
  const { kickPlayer } = useOnlineCareer();
  return (
    <div className="card p-6">
      <div className="text-center mb-4">
        <div className="text-2xl mb-2">⏳</div>
        <h2 className="text-lg font-black text-slate-800">{title}</h2>
      </div>
      <PlayerList players={lobby.players} currentUserId={userId} ownerId={lobby.owner_id} onKick={kickPlayer} />
      <div className="mt-4">
        <DivisionOverview players={lobby.players} />
      </div>
    </div>
  );
}

export default function OnlineCarriereLobbyPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const router = useRouter();
  const userId = useAuth((s) => s.userId);
  const username = useAuth((s) => s.username);
  const teamName = useAuth((s) => s.teamName);
  const { lobby, loading, error, loadLobby, joinLobby, subscribe, unsubscribe, advanceSeason } = useOnlineCareer();
  const phase = useGame((s) => s.phase);
  const result = useGame((s) => s.result);
  const setIndex = useGame((s) => s.setIndex);
  const indexLoaded = useGame((s) => s.index.length > 0);
  const startCareerSeason = useGame((s) => s.startCareerSeason);
  const [gamePhase, setGamePhase] = useState<"lobby" | "drafting" | "simulating" | "result" | "transfer">("lobby");

  // Load index data
  useEffect(() => {
    if (indexLoaded) return;
    fetch("/api/clubseasons")
      .then((r) => r.json())
      .then((data: ClubSeasonLite[]) => setIndex(data))
      .catch(() => {});
  }, [indexLoaded, setIndex]);

  // Load and subscribe to lobby
  useEffect(() => {
    if (!userId) return;
    loadLobby(code);
    subscribe(code);
    return () => unsubscribe();
  }, [code, userId]);

  // Sync game phase with lobby status
  useEffect(() => {
    if (!lobby) return;

    if (lobby.status === "waiting") {
      setGamePhase("lobby");
    } else if (lobby.status === "drafting") {
      const me = lobby.players.find((p) => p.user_id === userId);
      if (me?.ready && phase === "start") {
        setGamePhase("transfer");
      } else if (phase === "result" && result) {
        setGamePhase("result");
      } else if (phase === "simulating") {
        setGamePhase("simulating");
      } else if (gamePhase === "lobby" || (gamePhase === "transfer" && !me?.ready)) {
        if (me && !me.ready && me.squad.length > 0 && lobby.current_season > 1) {
          setGamePhase("transfer");
        } else {
          setGamePhase("drafting");
          if (indexLoaded && me) {
            startCareerSeason(me.current_division, me.squad.length > 0 ? me.squad : undefined);
          }
        }
      }
    }
  }, [lobby?.status, lobby?.current_season, phase, result, indexLoaded]);

  if (!userId) {
    router.push("/online-carriere");
    return null;
  }

  if (loading && !lobby) {
    return (
      <main className="min-h-screen w-full pb-12">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400 font-bold">Laden…</div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !lobby) {
    return (
      <main className="min-h-screen w-full pb-12">
        <Header />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="text-4xl mb-4">😕</div>
          <h1 className="text-xl font-black text-slate-800 mb-2">Lobby niet gevonden</h1>
          <p className="text-sm text-slate-500 mb-4">{error || `Code "${code}" bestaat niet.`}</p>
          <button onClick={() => router.push("/online-carriere")} className="btn-primary">
            Terug
          </button>
        </div>
        <Footer />
      </main>
    );
  }

  const me = lobby.players.find((p) => p.user_id === userId);
  if (!me) {
    // Auto-join if not yet in the lobby
    if (lobby.status === "waiting") {
      joinLobby(code, userId, username!, teamName);
    }
    return (
      <main className="min-h-screen w-full pb-12">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400 font-bold">Joinen…</div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full pb-12">
      {gamePhase !== "lobby" && <Header showMeta />}

      {gamePhase === "lobby" && <WaitingRoom />}

      {gamePhase === "drafting" && phase === "play" && <OnlinePlayView />}

      {gamePhase === "simulating" || phase === "simulating" ? <SimulationView /> : null}

      {(gamePhase === "result" || phase === "result") && result && (
        <OnlineResultView />
      )}

      {gamePhase === "transfer" && <TransferPhase />}

      <Footer />
    </main>
  );
}
