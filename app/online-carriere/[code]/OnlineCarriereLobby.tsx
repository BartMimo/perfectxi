"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useOnlineCareer, type OnlinePlayer, type OnlineCareer } from "@/lib/onlineCareer";
import { useGame, filledCount } from "@/lib/store";
import { divisionLabel, getAdjustedDivisionRange } from "@/lib/career";
import { FORMATIONS } from "@/lib/formations";
import type { ClubSeasonLite, DraftedPlayer } from "@/lib/types";
import { simulateOnlineSeason, type OnlineUserTeam } from "@/lib/sim";
import type { PosKey } from "@/lib/positions";
import { useEnsureCustomPlayerLoaded, useCustomPlayerSlot } from "@/lib/customPlayer";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PitchView from "@/components/PitchView";
import AddCustomPlayerCard from "@/components/AddCustomPlayerCard";
import ReelView from "@/components/ReelView";
import SquadPicker from "@/components/SquadPicker";
import SimulationView from "@/components/SimulationView";
import OnlineResultView from "@/components/OnlineResultView";
import SquadViewModal from "@/components/SquadViewModal";
import { useT } from "@/lib/i18n/core";

const CURRENT_SEASON = "2025-2026";

function avgRating(squad: DraftedPlayer[]): number {
  if (squad.length === 0) return 0;
  return Math.round((squad.reduce((s, p) => s + p.overall, 0) / squad.length) * 10) / 10;
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

function buildOnlineOpponents(
  index: ClubSeasonLite[],
  division: number,
  humanNames: Set<string>,
  slotsNeeded: number,
  leagues: string[],
): ClubSeasonLite[] {
  const [minR, maxR] = getAdjustedDivisionRange(division, index, leagues);
  const mid = (minR + maxR) / 2;
  const all = index.filter((c) => c.season === CURRENT_SEASON);
  const seen = new Set(humanNames);
  const candidates: ClubSeasonLite[] = [];
  const sorted = [...all].sort((a, b) => Math.abs(a.teamRating - mid) - Math.abs(b.teamRating - mid));
  for (const c of sorted) {
    if (seen.has(c.club)) continue;
    seen.add(c.club);
    candidates.push({ ...c, teamRating: Math.max(minR, Math.min(maxR, c.teamRating)) });
    if (candidates.length >= slotsNeeded) break;
  }
  return candidates;
}

function PlayerCard({ p, isMe, isOwner, onKick, onViewSquad, onAccept, onReject }: {
  p: OnlinePlayer; isMe: boolean; isOwner: boolean;
  onKick?: (userId: string) => void;
  onViewSquad?: (p: OnlinePlayer) => void;
  onAccept?: (userId: string) => void;
  onReject?: (userId: string) => void;
}) {
  const t = useT();
  const rating = avgRating(p.squad);
  const lastSeason = p.history[p.history.length - 1];

  if (p.pending) {
    return (
      <div className="rounded-2xl p-3.5 bg-amber-50/60 border-2 border-dashed border-amber-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-200 text-xs font-black text-amber-700">
              {(p.team_name || p.username).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-800 truncate">{p.team_name || p.username}</span>
              <div className="text-[10px] font-bold text-amber-600">{t("onlineCarriere.waitingForApproval")}</div>
            </div>
          </div>
          {isOwner && onAccept && onReject && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onAccept(p.user_id)}
                className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 transition"
              >
                ✓
              </button>
              <button
                onClick={() => onReject(p.user_id)}
                className="rounded-full bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-200 transition"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

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
              {isMe && <span className="text-[9px] font-bold text-indigo-400 uppercase">{t("onlineCarriere.you")}</span>}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold text-slate-400">
                {divisionLabel(t, p.current_division)}
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
              {t("onlineCarriere.positionOrdinal", { n: lastSeason.position })}
            </span>
          )}
          {onViewSquad && p.squad.length > 0 && (
            <button
              onClick={() => onViewSquad(p)}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-500 hover:bg-indigo-100 transition"
              title={t("onlineCarriere.viewTeam")}
            >
              👁
            </button>
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
              title={t("onlineCarriere.removePlayer")}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerList({ players, currentUserId, ownerId, onKick, onViewSquad, onAccept, onReject }: {
  players: OnlinePlayer[]; currentUserId: string | null; ownerId?: string;
  onKick?: (userId: string) => void;
  onViewSquad?: (p: OnlinePlayer) => void;
  onAccept?: (userId: string) => void;
  onReject?: (userId: string) => void;
}) {
  const isOwner = currentUserId === ownerId;
  const pending = players.filter((p) => p.pending);
  const active = players.filter((p) => !p.pending);
  const divisions = new Map<number, OnlinePlayer[]>();
  for (const p of active) {
    const list = divisions.get(p.current_division) || [];
    list.push(p);
    divisions.set(p.current_division, list);
  }
  const sortedDivs = [...divisions.entries()].sort((a, b) => a[0] - b[0]);
  const hasManyDivisions = sortedDivs.length > 1;
  const t = useT();

  return (
    <div className="flex flex-col gap-3">
      {pending.length > 0 && isOwner && (
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1.5 px-1">
            {t("onlineCarriere.applications", { n: pending.length })}
          </div>
          <div className="flex flex-col gap-1.5">
            {pending.map((p) => (
              <PlayerCard key={p.user_id} p={p} isMe={false} isOwner={isOwner} onAccept={onAccept} onReject={onReject} />
            ))}
          </div>
        </div>
      )}
      {sortedDivs.map(([div, divPlayers]) => (
        <div key={div}>
          {hasManyDivisions && (
            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1.5 px-1">
              {divisionLabel(t, div)}
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
                  onViewSquad={onViewSquad}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function WaitingForOthers({ lobby, userId, title }: { lobby: OnlineCareer; userId: string; title: string }) {
  const kickPlayer = useOnlineCareer((s) => s.kickPlayer);
  const [viewSquadPlayer, setViewSquadPlayer] = useState<OnlinePlayer | null>(null);
  return (
    <div className="card p-6">
      <div className="text-center mb-4">
        <div className="text-2xl mb-2">⏳</div>
        <h2 className="text-lg font-black text-slate-800">{title}</h2>
      </div>
      <PlayerList players={lobby.players} currentUserId={userId} ownerId={lobby.owner_id} onKick={kickPlayer} onViewSquad={setViewSquadPlayer} />
      {viewSquadPlayer && <SquadViewModal player={viewSquadPlayer} onClose={() => setViewSquadPlayer(null)} />}
    </div>
  );
}

function SettingChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-center">
      <div className="text-sm font-black text-slate-700">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
    </div>
  );
}

function WaitingRoom() {
  const t = useT();
  const { lobby, startDraft, leaveLobby, archiveLobby, kickPlayer, acceptPlayer, rejectPlayer, updateLobbyName, confirmFormation } = useOnlineCareer();
  const userId = useAuth((s) => s.userId);
  const formationKey = useGame((s) => s.formationKey);
  const setFormation = useGame((s) => s.setFormation);
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const isOwner = lobby?.owner_id === userId;
  const ownerPlayer = lobby?.players.find((p) => p.user_id === lobby.owner_id);
  const lockedFormation = lobby?.same_formation && !isOwner ? ownerPlayer?.formation_key ?? null : null;

  useEffect(() => {
    if (lockedFormation && formationKey !== lockedFormation) setFormation(lockedFormation);
  }, [lockedFormation]);

  if (!lobby) return null;
  const me = lobby.players.find((p) => p.user_id === userId);
  const isPending = me?.pending;
  const isFormationConfirmed = me?.formation_confirmed ?? false;

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

  const activePlayers = lobby.players.filter((p) => !p.pending);

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="text-center mb-6">
        {editingName ? (
          <form
            onSubmit={(e) => { e.preventDefault(); updateLobbyName(nameDraft); setEditingName(false); }}
            className="flex items-center justify-center gap-2"
          >
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder={t("onlineCarriere.lobbyNamePlaceholder")}
              maxLength={30}
              autoFocus
              className="rounded-xl border-2 border-indigo-300 px-3 py-2 text-center text-lg font-bold focus:border-indigo-500 focus:outline-none transition"
            />
            <button type="submit" className="rounded-xl bg-indigo-500 px-3 py-2 text-sm font-bold text-white">✓</button>
            <button type="button" onClick={() => setEditingName(false)} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-500">✕</button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black text-slate-800">
              {lobby.lobby_name || t("onlineCarriere.title")}
            </h1>
            {isOwner && (
              <button
                onClick={() => { setNameDraft(lobby.lobby_name || ""); setEditingName(true); }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
                title={t("onlineCarriere.changeName")}
              >
                ✏️
              </button>
            )}
          </div>
        )}
        <p className="text-sm text-slate-500 mt-1">{t("onlineCarriere.seasonAndPlayers", { season: lobby.current_season, n: activePlayers.length })}</p>
      </div>

      {isPending && (
        <div className="rounded-2xl bg-amber-50 border-2 border-amber-200 px-4 py-3 mb-5 text-center">
          <span className="text-sm font-bold text-amber-700">⏳ {t("onlineCarriere.waitingForOwnerApproval")}</span>
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 px-4 py-3 mb-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">{t("onlineCarriere.code")}</div>
        <button onClick={copyCode} className="text-xl font-black tracking-[0.3em] text-indigo-600 hover:text-indigo-700 transition">
          {lobby.code}
        </button>
        <span className="text-[10px] font-bold text-indigo-400">
          {copied ? `✓ ${t("onlineCarriere.copied")}` : t("onlineCarriere.copy")}
        </span>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-1.5">
        <SettingChip label={t("onlineCarriere.rerolls")} value={String(lobby.reroll_count)} />
        <SettingChip label={t("onlineCarriere.wissels")} value={String(lobby.wissel_count)} />
        <SettingChip label={t("onlineCarriere.competitions")} value={lobby.leagues.length === 0 ? t("onlineCarriere.all7") : `${lobby.leagues.length}/7`} />
        <SettingChip label={t("onlineCarriere.formation")} value={lobby.same_formation ? t("onlineCarriere.equal") : t("onlineCarriere.free")} />
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t("onlineCarriere.players")}</span>
          <span className="text-xs font-bold text-slate-400">{t("onlineCarriere.playerCountOf20", { n: activePlayers.length })}</span>
        </div>
        <PlayerList
          players={lobby.players.map((p) => (p.pending || p.is_bot ? p : { ...p, ready: p.formation_confirmed }))}
          currentUserId={userId}
          ownerId={lobby.owner_id}
          onKick={kickPlayer}
          onAccept={isOwner ? acceptPlayer : undefined}
          onReject={isOwner ? rejectPlayer : undefined}
        />
      </div>

      {!isPending && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              {lobby.same_formation && !isOwner ? t("onlineCarriere.formationDeterminedByHost") : t("onlineCarriere.yourFormation")}
            </span>
            {isFormationConfirmed && (
              <button
                onClick={() => userId && confirmFormation(userId, formationKey, false)}
                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 transition"
              >
                {t("onlineCarriere.change")}
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 mb-2.5">
            {FORMATIONS.map((fm) => (
              <button
                key={fm.key}
                disabled={isFormationConfirmed || (lobby.same_formation && !isOwner)}
                onClick={() => setFormation(fm.key)}
                className={`rounded-xl border-2 px-1.5 py-2 text-xs font-bold transition-all disabled:opacity-50 ${
                  formationKey === fm.key
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm"
                    : "border-transparent bg-white/60 text-slate-500 hover:bg-white/80"
                }`}
              >
                {fm.label}
              </button>
            ))}
          </div>
          {isFormationConfirmed ? (
            <div className="rounded-xl bg-emerald-50 border-2 border-emerald-200 px-4 py-2.5 text-center text-sm font-bold text-emerald-700">
              ✓ {t("onlineCarriere.formationConfirmed")}
            </div>
          ) : lobby.same_formation && !isOwner && !lockedFormation ? (
            <div className="rounded-xl bg-slate-50 border-2 border-slate-200 px-4 py-2.5 text-center text-sm font-bold text-slate-400">
              {t("onlineCarriere.waitingForHostFormation")}
            </div>
          ) : (
            <button
              onClick={() => userId && confirmFormation(userId, formationKey, true)}
              className="w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-600 transition"
            >
              {t("onlineCarriere.confirmFormation")}
            </button>
          )}
        </div>
      )}

      {!isPending && (
        <div className="flex gap-2">
          {isOwner ? (
            <button
              disabled={activePlayers.length < 2 || !activePlayers.every((p) => p.formation_confirmed && (!lobby.same_formation || p.formation_key === ownerPlayer?.formation_key))}
              onClick={startDraft}
              className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3.5 text-base font-extrabold text-white shadow-md shadow-indigo-200/50 transition hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-40"
            >
              {activePlayers.length < 2
                ? t("onlineCarriere.waitingForPlayers")
                : !activePlayers.every((p) => p.formation_confirmed && (!lobby.same_formation || p.formation_key === ownerPlayer?.formation_key))
                  ? t("onlineCarriere.waitingForFormationConfirm")
                  : t("onlineCarriere.startGame")}
            </button>
          ) : (
            <div className="flex-1 rounded-2xl bg-slate-50 border border-slate-200 px-5 py-3.5 text-center text-sm font-bold text-slate-400">
              {t("onlineCarriere.waitingForHostStart")}
            </div>
          )}
          {isOwner ? (
            <button
              onClick={async () => {
                if (confirm(t("onlineCarriere.confirmArchive"))) {
                  await archiveLobby();
                  router.push("/online-carriere");
                }
              }}
              className="rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-100 transition"
            >
              {t("onlineCarriere.archive")}
            </button>
          ) : (
            <button onClick={handleLeave} className="rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-100 transition">
              {t("onlineCarriere.leave")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DraftBoard({ lobby, me, onSubmit }: { lobby: OnlineCareer; me: OnlinePlayer; onSubmit: () => void }) {
  const userId = useAuth((s) => s.userId);
  const slots = useGame((s) => s.slots);
  const filled = filledCount(slots);
  const total = slots.length;
  const complete = total > 0 && filled === total;
  const customPlayerReady = useEnsureCustomPlayerLoaded(userId);
  const { blocking: customPlayerBlocking } = useCustomPlayerSlot(lobby.allow_custom_player);
  const t = useT();

  return (
    <div className="mx-auto max-w-6xl px-4 py-5">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-indigo-100 px-3 py-1.5 font-bold text-indigo-800">
          {divisionLabel(t, me.current_division)}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 font-bold text-slate-700">
          {t("onlineCarriere.season", { season: lobby.current_season })}
        </span>
        {me.championships > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1.5 font-bold text-amber-700">
            {t("onlineCarriere.timesChampion", { n: me.championships })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-start">
        <div className="min-w-0 lg:sticky lg:top-[74px]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-600">{t("onlineCarriere.yourLineup")}</h2>
            <span className="rounded-full bg-emerald-100/80 px-3 py-1.5 text-xs font-bold text-emerald-700">
              {complete ? t("onlineCarriere.complete") : `${filled} / ${total}`}
            </span>
          </div>
          <PitchView />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {complete ? (
            <div className="card flex flex-col items-center gap-4 p-6 text-center">
              <div className="text-base font-extrabold text-emerald-700">{t("onlineCarriere.xiComplete")}</div>
              <p className="text-sm text-slate-500">
                {t("onlineCarriere.confirmLineupDesc")}
              </p>
              <button onClick={onSubmit} className="btn-primary w-full text-lg">
                {t("onlineCarriere.confirmLineup")}
              </button>
            </div>
          ) : !customPlayerReady ? (
            <div className="card p-6 text-center text-sm text-slate-400">{t("common.loading")}</div>
          ) : customPlayerBlocking ? (
            <AddCustomPlayerCard />
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

function TransferWindow({ squad, division, season, disabled, maxReplace, onConfirm }: {
  squad: DraftedPlayer[];
  division: number;
  season: number;
  disabled: boolean;
  maxReplace: number;
  onConfirm: (remaining: DraftedPlayer[]) => void;
}) {
  const [toReplace, setToReplace] = useState<Set<string>>(new Set());
  const t = useT();

  const toggle = (name: string) => {
    const next = new Set(toReplace);
    if (next.has(name)) next.delete(name);
    else if (next.size < maxReplace) next.add(name);
    setToReplace(next);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="card p-6">
        <div className="text-center mb-4">
          <div className="text-2xl mb-2">🔄</div>
          <h2 className="text-lg font-black text-slate-800">{t("onlineCarriere.transferWindow")}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {maxReplace === 0 ? t("onlineCarriere.noTransfersAllowed") : t("onlineCarriere.chooseMaxToReplace", { n: maxReplace })}
          </p>
          <div className="mt-2 text-xs font-bold text-indigo-600">
            {divisionLabel(t, division)} · {t("onlineCarriere.season", { season })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto mb-4">
          {squad.map((p) => {
            const selected = toReplace.has(p.name);
            return (
              <button
                key={p.name}
                onClick={() => toggle(p.name)}
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
                  {selected && <span className="text-xs font-bold text-rose-500">{t("onlineCarriere.gone")}</span>}
                </div>
              </button>
            );
          })}
        </div>

        <button
          disabled={disabled}
          onClick={() => onConfirm(squad.filter((p) => !toReplace.has(p.name)))}
          className="btn-primary w-full disabled:opacity-40"
        >
          {toReplace.size === 0
            ? t("onlineCarriere.continueWithoutTransfers")
            : t("onlineCarriere.replaceNPlayers", { n: toReplace.size })}
        </button>
      </div>
    </div>
  );
}

function DraftFlow({ lobby, userId, me }: { lobby: OnlineCareer; userId: string; me: OnlinePlayer }) {
  const t = useT();
  const startCareerSeason = useGame((s) => s.startCareerSeason);
  const slots = useGame((s) => s.slots);
  const loaded = useGame((s) => s.index.length > 0);
  const saveSquad = useOnlineCareer((s) => s.saveSquad);

  const needsTransfer = me.squad.length > 0 && lobby.current_season > 1;
  const [step, setStep] = useState<"transfer" | "draft">(needsTransfer ? "transfer" : "draft");
  const [submitting, setSubmitting] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (step === "draft" && !initRef.current && loaded) {
      initRef.current = true;
      startCareerSeason(me.current_division, me.squad.length > 0 ? me.squad : undefined, lobby.reroll_count, lobby.leagues);
    }
  }, [step, loaded]);

  if (me.ready || submitting) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <WaitingForOthers lobby={lobby} userId={userId} title={t("onlineCarriere.waitingForEveryoneReady")} />
      </div>
    );
  }

  if (step === "transfer") {
    return (
      <TransferWindow
        squad={me.squad}
        division={me.current_division}
        season={lobby.current_season}
        disabled={!loaded}
        maxReplace={lobby.wissel_count}
        onConfirm={(remaining) => {
          initRef.current = true;
          startCareerSeason(me.current_division, remaining, lobby.reroll_count, lobby.leagues);
          setStep("draft");
        }}
      />
    );
  }

  if (!loaded || slots.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400 font-bold">{t("common.loading")}</div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!slots.every((s) => s.player)) return;
    setSubmitting(true);
    const squad = slots.map((s) => s.player!);
    await saveSquad(userId, squad);
  };

  return <DraftBoard lobby={lobby} me={me} onSubmit={handleSubmit} />;
}

function LobbySettingsBar({ lobby }: { lobby: OnlineCareer }) {
  const t = useT();
  const router = useRouter();
  const { archiveLobby, updateLobbyName } = useOnlineCareer();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(lobby.lobby_name || "");

  return (
    <div className="border-b border-slate-100 bg-slate-50/60">
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-2 px-4 py-2">
        {editing ? (
          <form
            onSubmit={(e) => { e.preventDefault(); updateLobbyName(draft); setEditing(false); }}
            className="flex items-center gap-2 flex-1"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("onlineCarriere.lobbyNamePlaceholder")}
              maxLength={30}
              autoFocus
              className="rounded-lg border border-indigo-300 px-2.5 py-1.5 text-sm font-bold focus:border-indigo-500 focus:outline-none transition flex-1 max-w-[200px]"
            />
            <button type="submit" className="rounded-lg bg-indigo-500 px-2.5 py-1.5 text-xs font-bold text-white">{t("onlineCarriere.save")}</button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs font-bold text-slate-400">{t("onlineCarriere.cancel")}</button>
          </form>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-slate-600 truncate">{lobby.lobby_name || t("onlineCarriere.noName")}</span>
            <button
              onClick={() => { setDraft(lobby.lobby_name || ""); setEditing(true); }}
              className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 transition shrink-0"
            >
              {t("onlineCarriere.change")}
            </button>
          </div>
        )}
        <button
          onClick={async () => {
            if (confirm(t("onlineCarriere.confirmArchive"))) {
              await archiveLobby();
              router.push("/online-carriere");
            }
          }}
          className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[10px] font-bold text-rose-500 hover:bg-rose-100 transition"
        >
          {t("onlineCarriere.archive")}
        </button>
      </div>
    </div>
  );
}

export default function OnlineCarriereLobby({ code }: { code: string }) {
  const t = useT();
  const userId = useAuth((s) => s.userId);
  const username = useAuth((s) => s.username);
  const teamName = useAuth((s) => s.teamName);
  const authLoading = useAuth((s) => s.loading);
  const { lobby, loading, error, loadLobby, joinLobby, subscribe, unsubscribe, getSeasonSeed } = useOnlineCareer();
  const phase = useGame((s) => s.phase);
  const result = useGame((s) => s.result);
  const setIndex = useGame((s) => s.setIndex);
  const indexLoaded = useGame((s) => s.index.length > 0);
  const index = useGame((s) => s.index);
  const [gamePhase, setGamePhase] = useState<"lobby" | "playing" | "simulating" | "result">("lobby");

  useEffect(() => {
    if (indexLoaded) return;
    fetch("/api/clubseasons")
      .then((r) => r.json())
      .then((data: ClubSeasonLite[]) => setIndex(data))
      .catch(() => {});
  }, [indexLoaded, setIndex]);

  useEffect(() => {
    if (!userId) return;
    loadLobby(code);
    subscribe(code);
    return () => unsubscribe();
  }, [code, userId]);

  const playersReadyKey = lobby?.players?.filter((p) => !p.pending).map((p) => (p.ready ? "1" : "0")).join("") ?? "";
  const currentSeason = lobby?.current_season ?? 0;
  const simulatedSeasonRef = useRef(0);

  useEffect(() => {
    if (!lobby || !userId || !indexLoaded) return;
    const me = lobby.players.find((p) => p.user_id === userId);
    if (!me || me.pending) return;

    if (lobby.status === "waiting") {
      setGamePhase("lobby");
      return;
    }
    if (lobby.status !== "drafting") return;

    if (simulatedSeasonRef.current === lobby.current_season) return;

    const activePlayers = lobby.players.filter((p) => !p.pending);
    const allReady = activePlayers.every((p) => p.ready);
    if (!allReady || me.squad.length === 0) {
      setGamePhase("playing");
      return;
    }

    simulatedSeasonRef.current = lobby.current_season;
    setGamePhase("simulating");
    try {
      const myDiv = me.current_division;
      const divPlayers = activePlayers.filter((p) => p.current_division === myDiv && p.squad.length > 0);
      const userTeams: OnlineUserTeam[] = divPlayers.map((p) => ({
        userId: p.user_id,
        name: p.team_name || p.username,
        lineup: buildLineupFromSquad(p.squad),
      }));
      const humanNames = new Set(divPlayers.map((p) => p.team_name || p.username));
      const candidates = buildOnlineOpponents(index, myDiv, humanNames, 20 - userTeams.length, lobby.leagues);
      const seed = getSeasonSeed(myDiv);
      const simResult = simulateOnlineSeason(userTeams, candidates, seed);
      const myResult = simResult.userResults.get(userId);

      if (myResult) {
        useGame.setState({ result: myResult, phase: "simulating", gameMode: "career" });
      } else {
        simulatedSeasonRef.current = 0;
        setGamePhase("playing");
      }
    } catch (e) {
      console.error("Simulation error:", e);
      simulatedSeasonRef.current = 0;
      setGamePhase("playing");
    }
  }, [lobby?.status, currentSeason, playersReadyKey, indexLoaded, userId]);

  useEffect(() => {
    if (gamePhase === "simulating" && phase === "result") setGamePhase("result");
  }, [gamePhase, phase]);

  const me = lobby?.players.find((p) => p.user_id === userId);
  const [joining, setJoining] = useState(false);
  useEffect(() => {
    if (lobby && userId && username && !me && lobby.status === "waiting" && !joining) {
      setJoining(true);
      joinLobby(code, userId, username, teamName).finally(() => setJoining(false));
    }
  }, [lobby?.id, userId, me?.user_id]);

  if (authLoading || !userId || (loading && !lobby)) {
    return (
      <main className="min-h-screen w-full pb-12">
        <Header backHref="/online-carriere" />
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400 font-bold">{t("common.loading")}</div>
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
          <h1 className="text-xl font-black text-slate-800 mb-2">{t("onlineCarriere.lobbyNotFound")}</h1>
          <p className="text-sm text-slate-500 mb-4">{error || t("onlineCarriere.codeDoesNotExist", { code })}</p>
          <a href="/online-carriere" className="btn-primary inline-block">{t("onlineCarriere.back")}</a>
        </div>
        <Footer />
      </main>
    );
  }

  if (!me) {
    return (
      <main className="min-h-screen w-full pb-12">
        <Header backHref="/online-carriere" />
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400 font-bold">{t("onlineCarriere.joining")}</div>
        </div>
        <Footer />
      </main>
    );
  }

  const isWaitingRoom = lobby.status === "waiting";
  const isOwner = lobby.owner_id === userId;

  return (
    <main className="min-h-screen w-full pb-12">
      <Header backHref="/online-carriere" showMeta={!isWaitingRoom} />

      {!isWaitingRoom && isOwner && (
        <LobbySettingsBar lobby={lobby} />
      )}

      {isWaitingRoom && <WaitingRoom />}

      {!isWaitingRoom && gamePhase === "simulating" && <SimulationView />}
      {!isWaitingRoom && gamePhase === "result" && result && <OnlineResultView />}
      {!isWaitingRoom && gamePhase !== "simulating" && gamePhase !== "result" && (
        <DraftFlow key={currentSeason} lobby={lobby} userId={userId} me={me} />
      )}

      <Footer />
    </main>
  );
}
