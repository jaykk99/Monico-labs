/* Console primitives — the original Monico Labs look: near-black panels,
 * neutral-900 borders, white primary actions, monospace uppercase labels. */
import { ReactNode, useEffect, useState } from "react";
import { Check, Copy as CopyIcon, LoaderCircle, X } from "lucide-react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function Panel({ title, subtitle, actions, children, pad = true, className }: {
  title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; pad?: boolean; className?: string;
}) {
  return (
    <section className={cx("rounded-xl border border-neutral-900 bg-neutral-950/60", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-900 px-5 py-3.5">
          <div className="min-w-0">
            {title && <h3 className="font-mono text-[11px] font-semibold uppercase tracking-widest text-neutral-300">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

type BtnProps = { children: ReactNode; onClick?: () => void; disabled?: boolean; busy?: boolean;
  kind?: "primary" | "secondary" | "ghost" | "danger"; type?: "button" | "submit"; href?: string; target?: string; size?: "sm" | "md"; title?: string };
export function Btn({ children, onClick, disabled, busy, kind = "secondary", type = "button", href, target, size = "sm", title }: BtnProps) {
  const cls = cx(
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-mono font-semibold uppercase tracking-wider transition whitespace-nowrap",
    "disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400",
    size === "sm" ? "h-8 px-3 text-[11px]" : "h-10 px-4 text-xs",
    kind === "primary" && "bg-white text-neutral-950 hover:bg-neutral-200 shadow",
    kind === "secondary" && "border border-neutral-800 bg-neutral-900 text-neutral-200 hover:border-neutral-700",
    kind === "ghost" && "text-neutral-400 hover:text-white",
    kind === "danger" && "border border-neutral-800 text-neutral-300 hover:border-red-500/60 hover:text-red-300",
  );
  const inner = <>{busy && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{children}</>;
  if (href) return <a href={href} target={target} rel={target ? "noreferrer" : undefined} className={cls} title={title}>{inner}</a>;
  return <button type={type} onClick={onClick} disabled={disabled || busy} className={cls} title={title}>{inner}</button>;
}

export const inputCls = "h-9 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 font-mono text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none";
export const selectCls = inputCls + " pr-8";

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-neutral-500">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-[11px] text-neutral-600">{hint}</span>}
    </label>
  );
}

export function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex w-full items-center justify-between gap-4 py-2.5 text-left">
      <span>
        <span className="block text-sm text-neutral-200">{label}</span>
        {hint && <span className="block text-xs text-neutral-500">{hint}</span>}
      </span>
      <span className={cx("relative h-5 w-9 shrink-0 rounded-full border transition", on ? "border-white bg-white" : "border-neutral-700 bg-neutral-900")}>
        <span className={cx("absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all", on ? "left-[18px] bg-neutral-950" : "left-0.5 bg-neutral-500")} />
      </span>
    </button>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "ok" | "warn" | "bad" | "neutral" | "live"; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
      tone === "ok" && "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
      tone === "live" && "border-white bg-white text-neutral-950",
      tone === "warn" && "border-amber-500/25 bg-amber-500/10 text-amber-300",
      tone === "bad" && "border-red-500/25 bg-red-500/10 text-red-300",
      tone === "neutral" && "border-neutral-800 bg-neutral-900 text-neutral-400")}>
      {children}
    </span>
  );
}

export function statusTone(s: string): "ok" | "warn" | "bad" | "neutral" {
  return s === "ready" ? "ok" : s === "building" ? "warn" : s === "failed" || s === "error" ? "bad" : "neutral";
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-900 bg-neutral-950/60 p-4">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-neutral-500">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight text-white tabular-nums">{value}</div>
      {sub && <div className="mt-1 font-mono text-[11px] text-neutral-500">{sub}</div>}
    </div>
  );
}

export function Empty({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      {icon && <div className="grid h-12 w-12 place-items-center rounded-2xl border border-neutral-800 bg-neutral-900 text-neutral-400">{icon}</div>}
      <div className="text-sm font-bold uppercase tracking-tight text-neutral-200">{title}</div>
      {children && <p className="max-w-sm font-mono text-xs leading-relaxed text-neutral-500">{children}</p>}
      {action}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "ok"; children: ReactNode }) {
  return (
    <div role={tone === "error" ? "alert" : undefined} className={cx("rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed",
      tone === "error" && "border-red-500/30 bg-red-500/5 text-red-200",
      tone === "ok" && "border-emerald-500/30 bg-emerald-500/5 text-emerald-200",
      tone === "info" && "border-neutral-800 bg-neutral-900/60 text-neutral-400")}>{children}</div>
  );
}

export function CopyBtn({ value, label }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" title="Copy" className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-neutral-500 hover:text-white"
      onClick={async () => { try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1400); } catch { /* ignore */ } }}>
      {done ? <Check className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}{label}
    </button>
  );
}

export function Spinner({ label }: { label?: string }) {
  return <div className="flex items-center gap-2 py-8 justify-center font-mono text-xs uppercase text-neutral-500"><LoaderCircle className="h-4 w-4 animate-spin" />{label || "Loading"}</div>;
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const f = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-6 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className={cx("max-h-[92vh] w-full overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="flex items-center justify-between border-b border-neutral-900 px-5 py-4">
          <h2 className="text-sm font-black uppercase tracking-tight text-white">{title}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ServerOnly({ what }: { what: string }) {
  return (
    <Panel>
      <Empty title={`${what} runs on the Monico server`}>
        This console is running in browser-only mode, so there's no server for {what.toLowerCase()} to run on. Start the
        Monico server (desktop app, <span className="text-neutral-300">npm run dev</span>, or the Docker image) and open the console from it.
      </Empty>
    </Panel>
  );
}

/* Wraps a section that needs the Monico server, so hooks never run in browser-only mode. */
export function serverOnly<P extends { backend: { mode: { kind: string } } }>(what: string, Inner: (p: P) => any) {
  return function Guarded(p: P) { return p.backend.mode.kind === "server" ? <Inner {...p} /> : <ServerOnly what={what} />; };
}

export function ago(iso?: string | number | null): string {
  if (!iso) return "—";
  const t = typeof iso === "number" ? iso : new Date(iso).getTime();
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return `${Math.max(s, 0)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* Load data, expose reload + error, re-run when deps change. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]): { data: T | null; error: string | null; loading: boolean; reload: () => void; set: (v: T) => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true; setLoading(true);
    fn().then((d) => { if (alive) { setData(d); setError(null); } })
      .catch((e) => { if (alive) setError(e.message || String(e)); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data, error, loading, reload: () => setTick((t) => t + 1), set: setData };
}
