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
      className="font-bold text-text hover:text-accent transition"
    >
      {username}
    </a>
  );
}

export function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full stat-num text-xs ${
        rank === 1 ? "bg-draw text-accent-ink" : rank === 2 ? "bg-slate-300 text-slate-900" : "bg-amber-700 text-white"
      }`}>
        {rank}
      </span>
    );
  }
  return <span className="pl-1.5 stat-num text-sm text-faint">{rank}</span>;
}

export function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05] text-faint">
        {icon}
      </div>
      <div className="text-sm text-faint">{text}</div>
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
  headerClassName = "bg-white/[0.03] text-faint",
  rowClassName = "border-t border-line text-dim transition hover:bg-white/[0.03]",
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
  emptyIcon: React.ReactNode;
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
                className={`cursor-pointer select-none whitespace-nowrap px-3 py-3 hover:text-text ${
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
                  } ${sortKey === col.key ? "font-black text-accent" : ""}`}
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
