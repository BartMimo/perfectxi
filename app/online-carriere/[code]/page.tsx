"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useOnlineCareer, type OnlinePlayer, type OnlineCareer } from "@/lib/onlineCareer";
import { useGame, filledCount } from "@/lib/store";
import { divisionLabel, getDivisionRatingRange } from "@/lib/career";
import { FORMATIONS } from "@/lib/formations";
import type { ClubSeasonLite } from "@/lib/types";
import { simulateOnlineSeason, type OnlineUserTeam } from "@/lib/sim";
import type { DraftedPlayer } from "@/lib/types";
import type { PosKey } from "@/lib/positions";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PitchView from "@/components/PitchView";
import ReelView from "@/components/ReelView";
import SquadPicker from "@/components/SquadPicker";
import SimulationView from "@/components/SimulationView";
import OnlineResultView from "@/components/OnlineResultView";

function avgRating(squad: DraftedPlayer[]): number {
  if (squad.length === 0) return 0;
  return Math.round(squad.reduce((s, p) => s + p.overall, 0) / squad.length * 10) / 10;
}

function PlayerCard({ p, isMe, isOwner, onKick }: { p: OnlinePlayer; isMe: boolean; isOwner: boolean; onKick?: (userId: string) => void }) {
  const rating = avgRating(p.squad);
  const lastSeason = p.history[p.history.length - 1];

  return (
    <div
      className={`rounded-2xl p-3.5 transition-all ${
        isMe
          ? "bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-sm"
          : p.is_bot
            ? "bg-slate-50/60 border-2 border-dashed border-slate-200"
            : "bg-white/80 border-2 border-slate-100 hover:border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {p.is_bot ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm">🤖</div>
          ) : (
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white ${
              isMe ? "bg-gradient-to-br from-indigo-500 to-purple-500" : "bg-gradient-to-br from-slate-400 to-slate-500"
            }`}>
              {(p.team_name || p.username).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold truncate ${p.is_bot ? "text-slate-400" : "text-slate-800"}`}>
                {p.team_name || p.username}
              </span>
              {isMe && <span className="text-[9px] font-bold text-indigo-400 uppercase">jij</span>}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold text-slate-400">
                {divisionLabel(p.current_division)}
              </span>
              {rating > 0 && (
                <span className="text-[10px] font-bold text-emerald-600">{rating} OVR</span>
              )}
              {p.championships > 0 && (
                <span className="text-[10px] font-bold text-amber-600">{p.championships}x🏆</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {lastSeason && (
            <span className={`rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${
              lastSeason.position <= 2 ? "bg-emerald-50 text-emerald-700" :
              lastSeason.position >= 18 ? "bg-rose-50 text-rose-600" :
              "bg-slate-50 text-slate-500"
            }`}>
              {lastSeason.position}e
            </span>
          )}
          {p.ready ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs text-white shadow-sm shadow-emerald-200">✓</span>
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-400">…</span>
          )}
          {isOwner && onKick && !isMe && !p.is_bot && (
            <button
              onClick={() => onKick(p.user_id)}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 border border-rose-200 text-xs text-rose-400 hover:bg-rose-100 hover:text-rose-500 transition"
              title="Verwijder speler"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerList({ players, currentUserId, ownerId, onKick }: { players: OnlinePlayer[]; currentUserId: string | null; ownerId?: string; onKick?: (userId: string) => void }) {
  const isOwner = currentUserId === ownerId;
  const divisions = new Map<number, OnlinePlayer[]>();
  for (const p of players) {
    const list = divisions.get(p.current_division) || [];
    list.push(p);
    divisions.set(p.current_division, list);
  }
  const sortedDivs = [...divisions.entries()].sort((a, b) => a[0] - b[0]);
  const hasManyDivisions = sortedDivs.length > 1;

  return (
    <div className="flex flex-col gap-3">
      {sortedDivs.map(([div, divPlayers]) => (
        <div key={div}>
          {hasManyDivisions && (
            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1.5 px-1">
              {divisionLabel(div)}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            {divPlayers
              .sort((a, b) => {
                if (a.user_id === currentUserId) return -1;
                if (b.user_id === currentUserId) return 1;
                return a.username.localeCompare(b.username);
              })
              .map((p) => (
                <PlayerCard
                  key={p.user_id}
                  p={p}
                  isMe={p.user_id === currentUserId}
                  isOwner={isOwner}
                  onKick={onKick}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function WaitingRoom() {
  const { lobby, startDraft, leaveLobby, deleteLobby, kickPlayer } = useOnlineCareer();
  const userId = useAuth((s) => s.userId);
  const formationKey = useGame((s) => s.formationKey);
  const setFormation = useGame((s) => s.setFormation);
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
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black text-slate-800">Online Carrière</h1>
        <p className="text-sm text-slate-500 mt-1">Seizoen {lobby.current_season} · {lobby.players.length} speler{lobby.players.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Invite code — compact bar */}
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 px-4 py-3 mb-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Code</div>
        <button onClick={copyCode} className="text-xl font-black tracking-[0.3em] text-indigo-600 hover:text-indigo-700 transition">
          {lobby.code}
        </button>
        <span className="text-[10px] font-bold text-indigo-400">
          {copied ? "✓ Gekopieerd" : "Kopieer"}
        </span>
      </div>

      {/* Spelers */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            Spelers
          </span>
          <span className="text-xs font-bold text-slate-400">{lobby.players.length}/20</span>
        </div>
        <PlayerList players={lobby.players} currentUserId={userId} ownerId={lobby.owner_id} onKick={kickPlayer} />
      </div>

      {/* Formatie */}
      <div className="mb-5">
        <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
          Jouw formatie
        </div>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
          {FORMATIONS.map((fm) => (
            <button
              key={fm.key}
              onClick={() => setFormation(fm.key)}
              className={`rounded-xl border-2 px-1.5 py-2 text-xs font-bold transition-all ${
                formationKey === fm.key
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm"
                  : "border-transparent bg-white/60 text-slate-500 hover:bg-white/80"
              }`}
            >
              {fm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Start / Wacht */}
      <div className="flex gap-2">
        {isOwner ? (
          <button
            disabled={lobby.players.length < 2}
            onClick={startDraft}
            className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3.5 text-base font-extrabold text-white shadow-md shadow-indigo-200/50 transition hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-40"
          >
            {lobby.players.length < 2 ? "Wacht op spelers…" : "Start het spel!"}
          </button>
        ) : (
          <div className="flex-1 rounded-2xl bg-slate-50 border border-slate-200 px-5 py-3.5 text-center text-sm font-bold text-slate-400">
            Wacht tot de host start…
          </div>
        )}
        {isOwner ? (
          <button
            onClick={async () => {
              if (confirm("Weet je zeker dat je deze lobby wilt verwijderen? Dit kan niet ongedaan worden.")) {
                await deleteLobby();
                router.push("/online-carriere");
              }
            }}
            className="rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-100 transition"
          >
            Verwijder
          </button>
        ) : (
          <button onClick={handleLeave} className="rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-100 transition">
            Verlaat
          </button>
        )}
      </div>
    </div>
  );
}

function OnlinePlayView() {
  const slots = useGame((s) => s.slots);
  const filled = filledCount(slots);
  const total = slots.length;
  const complete = filled === total;
  const teamName = useAuth((s) => s.teamName);
  const { lobby, saveSquad } = useOnlineCareer();
  const userId = useAuth((s) => s.userId);
  const me = lobby?.players.find((p) => p.user_id === userId);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!userId || !complete) return;
    const squad = slots.map((s) => s.player!);
    await saveSquad(userId, squad);
    setSubmitted(true);
  };

  if (submitted && lobby && userId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <WaitingForOthers lobby={lobby} userId={userId} title="Wacht tot iedereen klaar is met draften…" />
      </div>
    );
  }

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
              <p className="text-sm text-slate-500">
                Bevestig je opstelling. Het seizoen wordt gesimuleerd zodra iedereen klaar is.
              </p>
              <button onClick={handleSubmit} className="btn-primary w-full text-lg">
                Bevestig opstelling
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
    </div>
  );
}

function buildLineupFromSquad(squad: DraftedPlayer[]): { player: DraftedPlayer; pos: PosKey }[] {
  const posMap: Record<string, PosKey> = {
    Goalkeeper: "GK",
    Defender: "CB",
    Midfield: "CM",
    Attack: "ST",
    Missing: "CM",
  };
  return squad.map((p) => ({ player: p, pos: posMap[p.pos] ?? "CM" }));
}

export default function OnlineCarriereLobbyPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const router = useRouter();
  const userId = useAuth((s) => s.userId);
  const username = useAuth((s) => s.username);
  const teamName = useAuth((s) => s.teamName);
  const oc = useOnlineCareer();
  const { lobby, loading, error, loadLobby, joinLobby, subscribe, unsubscribe } = oc;
  const phase = useGame((s) => s.phase);
  const result = useGame((s) => s.result);
  const setIndex = useGame((s) => s.setIndex);
  const indexLoaded = useGame((s) => s.index.length > 0);
  const index = useGame((s) => s.index);
  const startCareerSeason = useGame((s) => s.startCareerSeason);
  const [gamePhase, setGamePhase] = useState<"lobby" | "drafting" | "simulating" | "result" | "transfer">("lobby");
  const [simulated, setSimulated] = useState(false);

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

  // Reset simulated flag when season changes
  useEffect(() => {
    setSimulated(false);
  }, [lobby?.current_season]);

  // Sync game phase with lobby status
  useEffect(() => {
    if (!lobby || !userId) return;
    const me = lobby.players.find((p) => p.user_id === userId);

    if (lobby.status === "waiting") {
      setGamePhase("lobby");
      return;
    }

    if (lobby.status !== "drafting") return;

    // If we're showing result, stay there
    if (gamePhase === "result" && result && simulated) return;
    if (gamePhase === "simulating") return;

    const allReady = lobby.players.every((p) => p.ready);

    if (allReady && !simulated && me && indexLoaded) {
      // Everyone is ready — run the shared simulation
      setGamePhase("simulating");

      const myDiv = me.current_division;
      const divPlayers = lobby.players.filter((p) => p.current_division === myDiv && p.squad.length > 0);

      const userTeams: OnlineUserTeam[] = divPlayers.map((p) => ({
        userId: p.user_id,
        name: p.team_name || p.username,
        lineup: buildLineupFromSquad(p.squad),
      }));

      const [minR, maxR] = getDivisionRatingRange(myDiv);
      const mid = (minR + maxR) / 2;
      const CURRENT_SEASON = "2025-2026";
      const all = index.filter((c) => c.season === CURRENT_SEASON);
      const seen = new Set(divPlayers.map((p) => p.team_name || p.username));
      const candidates: ClubSeasonLite[] = [];
      const sorted = [...all].sort((a, b) => Math.abs(a.teamRating - mid) - Math.abs(b.teamRating - mid));
      for (const c of sorted) {
        if (seen.has(c.club)) continue;
        seen.add(c.club);
        candidates.push({ ...c, teamRating: Math.max(minR, Math.min(maxR, c.teamRating)) });
        if (candidates.length >= 20 - userTeams.length) break;
      }

      const seed = oc.getSeasonSeed(myDiv);
      const simResult = simulateOnlineSeason(userTeams, candidates, seed);
      const myResult = simResult.userResults.get(userId);

      if (myResult) {
        // Inject result into game store
        const gameStore = useGame.getState();
        (useGame as unknown as { setState: (s: Partial<typeof gameStore>) => void }).setState({
          result: myResult,
          phase: "simulating",
          gameMode: "career",
        });

        setTimeout(() => {
          (useGame as unknown as { setState: (s: Partial<typeof gameStore>) => void }).setState({
            phase: "result",
          });
          setGamePhase("result");
          setSimulated(true);
        }, 3000);
      }
      return;
    }

    if (me?.ready && !allReady) {
      // I'm ready, waiting for others
      setGamePhase("drafting");
      return;
    }

    // Need to draft or transfer
    if (!me?.ready) {
      if (me && me.squad.length > 0 && lobby.current_season > 1 && gamePhase !== "drafting") {
        setGamePhase("transfer");
      } else if (gamePhase !== "drafting" || phase === "start") {
        setGamePhase("drafting");
        if (indexLoaded && me) {
          startCareerSeason(me.current_division, me.squad.length > 0 ? me.squad : undefined);
        }
      }
    }
  }, [lobby?.status, lobby?.current_season, lobby?.players, phase, result, indexLoaded, simulated, userId]);

  if (!userId) {
    router.push("/online-carriere");
    return null;
  }

  if (loading && !lobby) {
    return (
      <main className="min-h-screen w-full pb-12">
        <Header backHref="/online-carriere" />
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
        <Header backHref="/online-carriere" />
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
    if (lobby.status === "waiting") {
      joinLobby(code, userId, username!, teamName);
    }
    return (
      <main className="min-h-screen w-full pb-12">
        <Header backHref="/online-carriere" />
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400 font-bold">Joinen…</div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full pb-12">
      {gamePhase !== "lobby" && <Header showMeta backHref="/online-carriere" />}

      {gamePhase === "lobby" && <WaitingRoom />}

      {gamePhase === "drafting" && phase === "play" && <OnlinePlayView />}
      {gamePhase === "drafting" && me.ready && (
        <div className="mx-auto max-w-lg px-4 py-8">
          <WaitingForOthers lobby={lobby} userId={userId} title="Wacht tot iedereen klaar is…" />
        </div>
      )}

      {gamePhase === "simulating" && <SimulationView />}

      {gamePhase === "result" && result && <OnlineResultView />}

      {gamePhase === "transfer" && <TransferPhase />}

      <Footer />
    </main>
  );
}
