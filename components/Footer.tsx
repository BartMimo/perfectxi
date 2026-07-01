"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n/core";
import { LoginPrompt } from "./AuthGate";

export default function Footer() {
  const t = useT();
  const username = useAuth((s) => s.username);
  const logout = useAuth((s) => s.logout);
  const restore = useAuth((s) => s.restore);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => { restore(); }, [restore]);

  return (
    <>
      <footer className="mt-8 px-4 text-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-slate-200/40 bg-white/50 px-5 py-2 text-xs text-slate-400 backdrop-blur">
          {username ? (
            <>
              <a href="/profiel" className="font-semibold text-slate-600 hover:text-slate-800 transition">
                {username}
              </a>
              <span className="text-slate-200">·</span>
              <button onClick={logout} className="hover:text-slate-600 transition">{t("common.logout")}</button>
              <span className="text-slate-200">·</span>
            </>
          ) : (
            <>
              <button onClick={() => setShowLogin(true)} className="font-semibold text-slate-600 hover:text-slate-800 transition">{t("common.login")}</button>
              <span className="text-slate-200">·</span>
            </>
          )}
          <a href="/ranglijst" className="font-semibold text-emerald-600 hover:text-emerald-700 transition">{t("common.leaderboard")}</a>
        </div>
      </footer>
      {showLogin && <LoginPrompt onClose={() => setShowLogin(false)} />}
    </>
  );
}
