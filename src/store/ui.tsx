import { ReactNode, useEffect, useState } from "react";
import { hubOnline } from "./api";

export function go(path: string) { window.location.hash = path; }

export function Shell({ children }: { children: ReactNode }) {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const f = () => setHash(window.location.hash);
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  const active = (p: string) => (hash.startsWith(p) ? "text-white" : "text-neutral-500 hover:text-white");
  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-white selection:text-black">
      <header className="sticky top-0 z-20 border-b border-neutral-900 bg-black/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="#/" className="flex items-center gap-2.5 group" aria-label="Monico Labs home">
            <span className="grid place-items-center h-6 w-6 bg-white text-black font-mono text-[11px] font-bold">ML</span>
            <span className="font-display text-sm font-semibold tracking-[0.18em]">MONICO LABS</span>
          </a>
          <nav className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-widest">
            <a href="#/products" className={active("#/product")}>Products</a>
            <a href="#/account" className={active("#/account")}>Account</a>
          </nav>
        </div>
      </header>
      {!hubOnline && (
        <div className="border-b border-neutral-900 bg-neutral-950">
          <p className="mx-auto max-w-6xl px-4 sm:px-6 py-2 font-mono text-[11px] text-neutral-400">
            Checkout is offline while the payment hub is being connected. You can still browse everything.
          </p>
        </div>
      )}
      <main className="flex-1">{children}</main>
      <footer className="border-t border-neutral-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-4 justify-between font-mono text-[11px] text-neutral-500">
          <span>© {new Date().getFullYear()} Monico Labs · Built in Manitoba</span>
          <span className="flex gap-5">
            <span>BTC · ETH · SOL accepted</span>
            <a href="#/lab" className="hover:text-white">Site lab</a>
            <a href="#/owner" className="hover:text-white">Owner</a>
          </span>
        </div>
      </footer>
    </div>
  );
}

export function Page({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return <div className={`mx-auto ${narrow ? "max-w-2xl" : "max-w-6xl"} px-4 sm:px-6 py-10 sm:py-14`}>{children}</div>;
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">{children}</div>;
}

type BtnProps = { children: ReactNode; onClick?: () => void; href?: string; disabled?: boolean;
  variant?: "solid" | "line" | "ghost"; type?: "button" | "submit"; full?: boolean; small?: boolean };
export function Button({ children, onClick, href, disabled, variant = "solid", type = "button", full, small }: BtnProps) {
  const base = `inline-flex items-center justify-center gap-2 font-mono uppercase tracking-widest transition-colors
    ${small ? "h-8 px-3 text-[10px]" : "h-11 px-5 text-[11px]"} ${full ? "w-full" : ""}
    disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white`;
  const look = variant === "solid" ? "bg-white text-black hover:bg-neutral-300"
    : variant === "line" ? "border border-neutral-700 text-white hover:border-white"
    : "text-neutral-400 hover:text-white";
  if (href && !disabled) return <a href={href} className={`${base} ${look}`}>{children}</a>;
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${look}`}>{children}</button>;
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-400">{label}</span>
      <div className="mt-2">{children}</div>
      {hint && <span className="mt-1.5 block text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

export const inputCls = "w-full h-11 bg-black border border-neutral-800 px-3 font-mono text-sm text-white placeholder:text-neutral-600 focus:border-white focus:outline-none";

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "ok"; children: ReactNode }) {
  const look = tone === "error" ? "border-white bg-white text-black"
    : tone === "ok" ? "border-white text-white" : "border-neutral-800 text-neutral-300";
  return <div role={tone === "error" ? "alert" : undefined} className={`border px-4 py-3 text-sm ${look}`}>{children}</div>;
}

export function Copy({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white shrink-0"
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* ignore */ }
      }}>
      {done ? "Copied" : label}
    </button>
  );
}

export function Mono({ children, big }: { children: ReactNode; big?: boolean }) {
  return <span className={`font-mono break-all ${big ? "text-lg sm:text-xl" : "text-sm"}`}>{children}</span>;
}

export function Spinner() {
  return <span aria-hidden className="inline-block h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" />;
}
