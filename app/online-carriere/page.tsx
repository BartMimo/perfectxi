"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useOnlineCareer } from "@/lib/onlineCareer";
import { LoginPrompt } from "@/components/AuthGate";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function OnlineCarrierePage() {
  const router = useRouter();
  const userId = useAuth((s) => s.userId);
  const username = useAuth((s) => s.username);
  const teamName = useAuth((s) => s.teamName);
  const { createLobby, joinLobby, loading, error } = useOnlineCareer();
  const [joinCode, setJoinCode] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  const handleCreate = async () => {
    if (!userId || !username) return;
    const code = await createLobby(userId, username, teamName);
    if (code) router.push(`/online-carriere/${code}`);
  };

  const handleJoin = async () => {
    if (!userId || !username || !joinCode.trim()) return;
    const ok = await joinLobby(joinCode, userId, username, teamName);
    if (ok) router.push(`/online-carriere/${joinCode.toUpperCase().trim()}`);
  };

  return (
    <main className="min-h-screen w-full pb-12">
      <Header />
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌐</div>
          <h1 className="text-3xl font-black text-slate-800">Online Carrière</h1>
          <p className="mt-2 text-sm text-slate-500">
            Speel de carrièremodus samen met vrienden. Begin allemaal in Divisie 10
            en race naar het kampioenschap in Divisie 1!
          </p>
        </div>

        {!userId ? (
          <div className="card p-6 text-center">
            <p className="text-sm text-slate-500 mb-4">Log in om mee te doen.</p>
            <button onClick={() => setShowLogin(true)} className="btn-primary w-full">
              Inloggen
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="card p-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-indigo-700 mb-3">
                Nieuw spel maken
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Maak een lobby aan en deel de code met je vrienden (max 20 spelers).
              </p>
              <button
                disabled={loading}
                onClick={handleCreate}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3.5 text-base font-extrabold text-white shadow-md shadow-indigo-200/50 transition hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-40"
              >
                {loading ? "Aanmaken…" : "Maak lobby aan"}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-bold text-slate-400">OF</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="card p-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-indigo-700 mb-3">
                Deelnemen met code
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
                  Join
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

        <div className="mt-8 card p-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Hoe werkt het?</h3>
          <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
            <li>Maak een lobby aan of join met een code</li>
            <li>De eigenaar drukt op Start als iedereen er is</li>
            <li>Iedereen draft een team en simuleert het seizoen</li>
            <li>Nr. 1 & 2 promoveren, laatste 3 degraderen</li>
            <li>Vervang 2 spelers en speel het volgende seizoen</li>
            <li>Eerste die Divisie 1 wint, wint het spel!</li>
          </ol>
        </div>
      </div>
      {showLogin && <LoginPrompt onClose={() => setShowLogin(false)} />}
      <Footer />
    </main>
  );
}
