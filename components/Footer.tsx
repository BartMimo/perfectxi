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
        <div className="inline-flex items-center gap-3 rounded-full border border-line bg-white/[0.03] px-5 py-2 text-xs text-faint backdrop-blur">
          {username ? (
            <>
              <a href="/profiel" className="font-semibold text-dim hover:text-text transition">
                {username}
              </a>
              <span className="text-line-strong">·</span>
              <button onClick={logout} className="hover:text-text transition">{t("common.logout")}</button>
              <span className="text-line-strong">·</span>
            </>
          ) : (
            <>
              <button onClick={() => setShowLogin(true)} className="font-semibold text-dim hover:text-text transition">{t("common.login")}</button>
              <span className="text-line-strong">·</span>
            </>
          )}
          <a href="/ranglijst" className="font-semibold text-accent hover:brightness-110 transition">{t("common.leaderboard")}</a>
        </div>
      </footer>
      {showLogin && <LoginPrompt onClose={() => setShowLogin(false)} />}
    </>
  );
}
