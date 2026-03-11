"use client";

type SortDir = "asc" | "desc";

export function SortableTh({
  label,
  field,
  sortBy,
  sortDir,
  onSortChange,
}: {
  label: string;
  field: string;
  sortBy: string;
  sortDir: SortDir;
  onSortChange: (field: string, dir: SortDir) => void;
}) {
  const active = sortBy === field;
  const nextDir: SortDir = active && sortDir === "asc" ? "desc" : "asc";

  return (
    <th className="px-3 py-2 text-left">
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:underline"
        onClick={() => onSortChange(field, nextDir)}
      >
        {label}
        <span className="text-xs text-muted-foreground">{active ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
      </button>
    </th>
  );
}
