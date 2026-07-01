"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n/core";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, restore } = useAuth();

  useEffect(() => {
    restore();
  }, [restore]);

  if (loading) return null;
  return <>{children}</>;
}

export function LoginPrompt({ onClose }: { onClose: () => void }) {
  const t = useT();
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
          <h2 className="text-lg font-black text-slate-800">{t("authGate.title")}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {t("authGate.desc")}
          </p>

          <div className="mt-5 flex rounded-xl bg-slate-100/80 p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                mode === "login" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {t("common.login")}
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                mode === "register" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {t("common.register")}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("common.username")} maxLength={20} className="glass-input" autoFocus />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("common.password")} className="glass-input" />
            {error && <p className="animate-pop rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{error}</p>}
            <button type="submit" disabled={submitting || name.trim().length < 2 || password.length < 4} className="btn-primary">
              {submitting ? t("common.busy") : mode === "login" ? t("common.login") : t("common.createAccount")}
            </button>
          </form>

          <button onClick={onClose} className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 transition">
            {t("common.skip")}
          </button>
        </div>
      </div>
    </div>
  );
}
