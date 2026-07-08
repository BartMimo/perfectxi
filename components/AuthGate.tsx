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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="animate-pop w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="card-solid p-8 text-center">
          <h2 className="text-xl font-black text-text font-display">{t("authGate.title")}</h2>
          <p className="mt-2 text-sm text-dim">
            {t("authGate.desc")}
          </p>

          <div className="mt-5 flex rounded-xl border border-line bg-white/[0.03] p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                mode === "login" ? "bg-accent text-accent-ink" : "text-dim hover:text-text"
              }`}
            >
              {t("common.login")}
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                mode === "register" ? "bg-accent text-accent-ink" : "text-dim hover:text-text"
              }`}
            >
              {t("common.register")}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("common.username")} maxLength={20} className="glass-input" autoFocus />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("common.password")} className="glass-input" />
            {error && <p className="animate-pop rounded-xl border border-loss/30 bg-loss/[0.1] px-3 py-2 text-sm font-medium text-loss">{error}</p>}
            <button type="submit" disabled={submitting || name.trim().length < 2 || password.length < 4} className="btn-primary">
              {submitting ? t("common.busy") : mode === "login" ? t("common.login") : t("common.createAccount")}
            </button>
          </form>

          <button onClick={onClose} className="mt-4 text-xs font-bold text-faint hover:text-text transition">
            {t("common.skip")}
          </button>
        </div>
      </div>
    </div>
  );
}
