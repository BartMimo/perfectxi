"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { POS_KEYS, POS_LABEL, type PosKey } from "@/lib/positions";
import { useCustomPlayer, xpProgress, BASE_OVERALL, MAX_OVERALL, EXTRA_POSITION_COST } from "@/lib/customPlayer";
import { RatingBadge } from "@/components/ui";
import { LoginPrompt } from "@/components/AuthGate";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export default function MijnSpelerPage() {
  const userId = useAuth((s) => s.userId);
  const authLoading = useAuth((s) => s.loading);
  const [showLogin, setShowLogin] = useState(false);

  if (authLoading) {
    return (
      <main className="min-h-screen w-full pb-12">
        <Header backHref="/" />
        <div className="flex items-center justify-center py-20 text-sm text-slate-400 font-bold">Laden…</div>
        <Footer />
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen w-full pb-12">
        <Header backHref="/" />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="text-4xl mb-2">⭐</div>
          <p className="text-sm text-slate-500 mb-4">Log in om je eigen speler aan te maken.</p>
          <button onClick={() => setShowLogin(true)} className="btn-primary">Inloggen</button>
        </div>
        {showLogin && <LoginPrompt onClose={() => setShowLogin(false)} />}
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full pb-12">
      <Header backHref="/" />
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="mb-8 text-center">
          <div className="text-4xl mb-2">⭐</div>
          <h1 className="text-2xl font-black text-slate-800">Mijn Speler</h1>
          <p className="mt-2 text-sm text-slate-500">
            Jouw eigen profielspeler. Voeg hem als eerste toe aan je opstelling in elke spelmodus en verdien XP door seizoenen te spelen.
          </p>
        </div>
        <CustomPlayerCard userId={userId} />
      </div>
      <Footer />
    </main>
  );
}

function CustomPlayerCard({ userId }: { userId: string }) {
  const { player, loaded, loading, load, create, rename, spendOnOverall, spendOnPosition } = useCustomPlayer();
  const [name, setName] = useState("");
  const [position, setPosition] = useState<PosKey | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    if (userId && !loaded && !loading) load(userId);
  }, [userId, loaded, loading, load]);

  if (loading || !loaded) {
    return <div className="p-12 text-center text-sm text-slate-400">Laden…</div>;
  }

  if (!player) {
    return (
      <div className="card p-5">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Nieuwe speler</div>
        <p className="text-sm text-slate-500 mb-3">
          Maak je eigen speler aan. Hij begint op {BASE_OVERALL} overall en je kunt hem in elke spelmodus als eerste
          aan je opstelling toevoegen. Speel seizoenen om XP en levels te verdienen.
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Naam van je speler"
          maxLength={20}
          className="glass-input w-full !py-2.5 !text-sm mb-3"
        />
        <div className="grid grid-cols-4 gap-1.5 mb-3 sm:grid-cols-7">
          {POS_KEYS.map((pos) => (
            <button
              key={pos}
              onClick={() => setPosition(pos)}
              className={`rounded-xl border-2 px-1.5 py-2 text-xs font-bold transition-all ${
                position === pos
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                  : "border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
        <button
          disabled={creating || name.trim().length < 2 || !position}
          onClick={async () => {
            if (!position) return;
            setCreating(true);
            await create(userId, name, position);
            setCreating(false);
          }}
          className="btn-primary w-full disabled:opacity-40"
        >
          {creating ? "Bezig…" : "Maak speler aan"}
        </button>
      </div>
    );
  }

  const progress = xpProgress(player.xp);
  const isMaxLevel = progress.needed === 0;
  const remainingPositions = POS_KEYS.filter((p) => p !== player.position && !player.extraPositions.includes(p));

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <RatingBadge value={player.overall} className="!h-11 !w-11 !text-base" />
        <div className="min-w-0 flex-1">
          {editingName ? (
            <form
              onSubmit={(e) => { e.preventDefault(); if (nameDraft.trim()) rename(userId, nameDraft); setEditingName(false); }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={20}
                autoFocus
                className="glass-input flex-1 !py-1.5 !text-sm"
              />
              <button type="submit" className="rounded-lg bg-indigo-500 px-2.5 py-1.5 text-xs font-bold text-white">✓</button>
              <button type="button" onClick={() => setEditingName(false)} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-500">✕</button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="text-lg font-black text-slate-800 truncate">{player.name}</div>
              <button
                onClick={() => { setNameDraft(player.name); setEditingName(true); }}
                className="shrink-0 text-xs text-slate-400 hover:text-slate-600 transition"
                title="Naam wijzigen"
              >
                ✏️
              </button>
            </div>
          )}
          <div className="text-xs font-bold text-slate-400">
            Level {player.level} · {[player.position, ...player.extraPositions].map((p) => POS_LABEL[p]).join(", ")}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <span>XP</span>
          <span>{isMaxLevel ? "MAX" : `${progress.current} / ${progress.needed}`}</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
            style={{ width: isMaxLevel ? "100%" : `${(progress.current / progress.needed) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 mb-3">
        <PlayerStatBox label="Seizoenen" value={player.seasonsPlayed} />
        <PlayerStatBox label="Goals" value={player.totalGoals} />
        <PlayerStatBox label="Assists" value={player.totalAssists} />
        <PlayerStatBox label="Clean sheets" value={player.totalCleanSheets} />
      </div>

      <div className="rounded-2xl bg-indigo-50/80 border border-indigo-100 px-4 py-3 mb-3">
        <div className="text-sm font-bold text-indigo-700">
          {player.skillPoints} punt{player.skillPoints !== 1 ? "en" : ""} te besteden
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          disabled={player.skillPoints < 1 || player.overall >= MAX_OVERALL}
          onClick={() => spendOnOverall(userId)}
          className="flex items-center justify-between rounded-xl bg-slate-50 border-2 border-transparent px-4 py-3 text-left hover:bg-slate-100 transition disabled:opacity-40 disabled:hover:bg-slate-50"
        >
          <span className="text-sm font-bold text-slate-700">
            {player.overall >= MAX_OVERALL ? "Overall (max bereikt)" : "+1 Overall"}
          </span>
          <span className="text-xs font-black text-indigo-600">1 punt</span>
        </button>

        {remainingPositions.length > 0 && (
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1.5 px-1">Extra positie (3 punten)</div>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
              {remainingPositions.map((pos) => (
                <button
                  key={pos}
                  disabled={player.skillPoints < EXTRA_POSITION_COST}
                  onClick={() => spendOnPosition(userId, pos)}
                  className="rounded-xl border-2 border-transparent bg-slate-50 px-1.5 py-2 text-xs font-bold text-slate-500 transition-all hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50"
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerStatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-2 text-center">
      <div className="text-sm font-black text-slate-700">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}
