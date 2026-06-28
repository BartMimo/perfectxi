"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { userId, loading, restore } = useAuth();

  useEffect(() => {
    restore();
  }, [restore]);

  if (loading) return null;
  if (userId) return <>{children}</>;
  return <AuthForm />;
}

function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const { register, login, error } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    if (mode === "register") {
      await register(name, password);
    } else {
      await login(name, password);
    }
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="animate-fade-up w-full max-w-sm">
        <div className="card p-8 text-center">
          <div className="mx-auto mb-2 text-4xl">⚽</div>
          <h1 className="bg-gradient-to-r from-emerald-600 to-cyan-500 bg-clip-text text-3xl font-black tracking-tight text-transparent">
            Perfect&nbsp;XI
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            {mode === "login"
              ? "Log in om je resultaten te bekijken."
              : "Maak een account aan om te spelen."}
          </p>

          {/* Tabs */}
          <div className="mt-5 flex rounded-xl bg-slate-100/80 p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                mode === "login"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Inloggen
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                mode === "register"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Registreren
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Gebruikersnaam"
              maxLength={20}
              className="glass-input"
              autoFocus
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Wachtwoord"
              className="glass-input"
            />
            {error && (
              <p className="animate-pop rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting || name.trim().length < 2 || password.length < 4}
              className="btn-primary"
            >
              {submitting
                ? "Bezig…"
                : mode === "login"
                  ? "Inloggen"
                  : "Account aanmaken"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          {mode === "login"
            ? "Nog geen account? Klik op Registreren."
            : "Wachtwoord minimaal 4 tekens."}
        </p>
      </div>
    </div>
  );
}
