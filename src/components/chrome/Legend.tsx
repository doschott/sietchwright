import { KIT_LIST } from "@/lib/pieces";

export function Legend() {
  return (
    <div className="hidden max-w-56 rounded-xl border border-border bg-surface/92 p-2 shadow-panel lg:block">
      <p className="mb-1.5 px-1 text-xs font-medium tracking-wide text-muted">
        Piece marks
      </p>
      <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
        {KIT_LIST.map((p) => (
          <li key={p.type} className="flex items-center gap-1.5 text-xs text-muted">
            <span
              className="inline-flex min-w-7 justify-center rounded-sm px-1 py-0.5 font-mono text-xs font-semibold text-fg"
              style={{ background: p.marker }}
            >
              {p.code}
            </span>
            <span className="truncate">{p.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
