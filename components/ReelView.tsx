"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/lib/store";
import type { ClubSeasonLite } from "@/lib/types";
import { shortSeason } from "./ui";

const STRIDE = 140;
const STRIP_LEN = 44;
const WINNER_INDEX = 37;

export default function ReelView() {
  const index = useGame((s) => s.index);
  const leagueCode = useGame((s) => s.leagueCode);
  const spinning = useGame((s) => s.spinning);
  const beginSpin = useGame((s) => s.beginSpin);
  const prefetchSquad = useGame((s) => s.prefetchSquad);
  const land = useGame((s) => s.land);
  const landed = useGame((s) => s.landed);
  const spinRequested = useGame((s) => s.spinRequested);
  const difficulty = useGame((s) => s.difficulty);
  const ratingsHidden = difficulty === "hard";

  const gameMode = useGame((s) => s.gameMode);

  const pool = useMemo(
    () => gameMode === "career" ? index : index.filter((c) => c.leagueCode === leagueCode),
    [index, leagueCode, gameMode],
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [strip, setStrip] = useState<ClubSeasonLite[]>([]);
  const [offset, setOffset] = useState(0);
  const [animate, setAnimate] = useState(false);
  const winnerRef = useRef<ClubSeasonLite | null>(null);

  const rnd = () => pool[Math.floor(Math.random() * pool.length)];

  function doSpin() {
    if (pool.length === 0 || spinning) return;
    beginSpin();
    const winner = rnd();
    winnerRef.current = winner;
    prefetchSquad(winner.id);
    const items: ClubSeasonLite[] = Array.from({ length: STRIP_LEN }, (_, i) =>
      i === WINNER_INDEX ? winner : rnd(),
    );
    setStrip(items);
    setAnimate(false);
    setOffset(0);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const vw = viewportRef.current?.clientWidth ?? 360;
        const target = WINNER_INDEX * STRIDE + STRIDE / 2 - vw / 2;
        setAnimate(true);
        setOffset(target);
      }),
    );
  }

  function onEnd() {
    if (spinning && winnerRef.current) land(winnerRef.current);
  }

  useEffect(() => {
    if (pool.length && strip.length === 0) {
      setStrip(Array.from({ length: STRIP_LEN }, () => rnd()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  useEffect(() => {
    if (spinRequested && !spinning && pool.length) {
      useGame.setState({ spinRequested: false });
      doSpin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinRequested, spinning, pool.length]);

  const disabled = spinning || !!landed;

  return (
    <div className="card flex flex-col items-center gap-3 p-4">
      <div ref={viewportRef} className="relative w-full overflow-hidden rounded-xl">
        {/* aanwijzer */}
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 text-emerald-500">
          ▼
        </div>
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-full w-[132px] -translate-x-1/2 rounded-2xl border-2 border-emerald-400/60 shadow-lg shadow-emerald-100/40" />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white/90 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white/90 to-transparent" />

        <div
          ref={trackRef}
          onTransitionEnd={onEnd}
          className="flex gap-2 py-3"
          style={{
            transform: `translateX(${-offset}px)`,
            transition: animate ? "transform 3.1s cubic-bezier(0.12, 0.7, 0.1, 1)" : "none",
          }}
        >
          {strip.map((c, i) => (
            <div
              key={i}
              className="flex h-[88px] w-[132px] shrink-0 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white/70 px-2 text-center shadow-sm"
            >
              <div className="text-[9px] uppercase tracking-wide text-emerald-600/80">
                {c.league}
              </div>
              <div className="line-clamp-2 text-xs font-bold leading-tight text-slate-800">
                {c.club}
              </div>
              <div className="text-[11px] text-slate-400">{c.season}</div>
              {!ratingsHidden && (
                <div className="text-[9px] text-slate-400/70">rating {c.teamRating}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {!landed && (
        <button
          disabled={disabled}
          onClick={doSpin}
          className="btn-primary w-full text-lg"
        >
          {spinning ? "Draaien…" : "Draai het rad"}
        </button>
      )}
    </div>
  );
}
