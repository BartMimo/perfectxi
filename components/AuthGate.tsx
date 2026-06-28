"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, restore } = useAuth();

  useEffect(() => {
    restore();
  }, [restore]);

  if (loading) return null;
  return <>{children}</>;
}

export function LoginPrompt({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const { register, login, error } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const ok = mode === "register" ? await register(name, password) : await login(name, password);
    setSubmitting(false);
    if (ok) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="animate-pop w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="card p-8 text-center">
          <h2 className="text-lg font-black text-slate-800">Log in om op te slaan</h2>
          <p className="mt-2 text-sm text-slate-500">
            Je resultaat en achievements worden opgeslagen bij je account.
          </p>

          <div className="mt-5 flex rounded-xl bg-slate-100/80 p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                mode === "login" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Inloggen
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                mode === "register" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Registreren
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Gebruikersnaam" maxLength={20} className="glass-input" autoFocus />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Wachtwoord" className="glass-input" />
            {error && <p className="animate-pop rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{error}</p>}
            <button type="submit" disabled={submitting || name.trim().length < 2 || password.length < 4} className="btn-primary">
              {submitting ? "Bezig…" : mode === "login" ? "Inloggen" : "Account aanmaken"}
            </button>
          </form>

          <button onClick={onClose} className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 transition">
            Overslaan
          </button>
        </div>
      </div>
    </div>
  );
}
