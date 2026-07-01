"use client";

import { useState } from "react";

export type SortDir = "asc" | "desc";

export interface RanglijstColumn<T> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  /** Waarde die gesorteerd wordt op. Ontbrekende/onbekende waardes: geef Infinity (asc-best) of -Infinity (desc-best) terug zodat ze altijd onderaan blijven. */
  value: (row: T) => number | string;
  cell: (row: T) => React.ReactNode;
  /** Richting die "beste eerst" betekent voor deze kolom. Bepaalt de sorteerrichting bij de eerste klik. */
  defaultDir?: SortDir;
}

export function UserLink({ username }: { username: string }) {
  return (
    <a
      href={`/profiel/${encodeURIComponent(username)}`}
      className="font-bold text-slate-800 hover:text-indigo-600 transition"
    >
      {username}
    </a>
  );
}

export function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white ${
        rank === 1 ? "bg-amber-400" : rank === 2 ? "bg-slate-400" : "bg-amber-600"
      }`}>
        {rank}
      </span>
    );
  }
  return <span className="pl-1.5 font-bold text-slate-400">{rank}</span>;
}

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="p-12 text-center">
      <div className="text-3xl mb-3">{icon}</div>
      <div className="text-sm text-slate-400">{text}</div>
    </div>
  );
}

function compare<T>(a: T, b: T, col: RanglijstColumn<T>, dir: SortDir): number {
  const va = col.value(a);
  const vb = col.value(b);
  let base: number;
  if (typeof va === "number" && typeof vb === "number") {
    base = va - vb;
  } else {
    base = String(va).localeCompare(String(vb));
  }
  return dir === "asc" ? base : -base;
}

export default function SortableTable<T>({
  rows,
  columns,
  rowKey,
  initialSortKey,
  initialSortDir = "desc",
  headerClassName = "bg-slate-50/80 text-slate-400",
  rowClassName = "border-t border-slate-100/60 text-slate-600 transition hover:bg-emerald-50/30",
  emptyIcon,
  emptyText,
}: {
  rows: T[];
  columns: RanglijstColumn<T>[];
  rowKey: (row: T) => string;
  initialSortKey: string;
  initialSortDir?: SortDir;
  headerClassName?: string;
  rowClassName?: string;
  emptyIcon: string;
  emptyText: string;
}) {
  const [sortKey, setSortKey] = useState(initialSortKey);
  const [sortDir, setSortDir] = useState<SortDir>(initialSortDir);

  if (rows.length === 0) {
    return <EmptyState icon={emptyIcon} text={emptyText} />;
  }

  const activeCol = columns.find((c) => c.key === sortKey) ?? columns[0];
  const sorted = [...rows].sort((a, b) => compare(a, b, activeCol, sortDir));

  const handleClick = (col: RanglijstColumn<T>) => {
    if (col.key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir(col.defaultDir ?? "desc");
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className={`text-[10px] uppercase tracking-widest ${headerClassName}`}>
          <tr>
            <th className="px-4 py-3 text-left">#</th>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleClick(col)}
                className={`cursor-pointer select-none whitespace-nowrap px-3 py-3 hover:text-slate-600 ${
                  col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                }`}
              >
                {col.label}
                {sortKey === col.key && (
                  <span className="ml-1 inline-block">{sortDir === "asc" ? "▲" : "▼"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={rowKey(row)} className={rowClassName}>
              <td className="px-4 py-3"><RankBadge rank={i + 1} /></td>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-3 ${
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                  } ${sortKey === col.key ? "font-black text-emerald-600" : ""}`}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
