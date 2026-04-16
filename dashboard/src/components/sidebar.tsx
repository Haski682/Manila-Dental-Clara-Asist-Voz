"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Menu,
  PhoneCall,
  Settings2,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const agentName = process.env.NEXT_PUBLIC_AGENT_NAME || "Clara";
const logoText = process.env.NEXT_PUBLIC_LOGO_TEXT || "MANILA";
const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "";

const nav = [
  { href: "/", label: "Analíticas", Icon: BarChart3 },
  { href: "/leads", label: "Pacientes", Icon: Users },
  { href: "/llamadas", label: "Llamadas", Icon: PhoneCall },
  { href: "/configuracion", label: "Configuración", Icon: Settings2 },
];

const specialties = [
  "Alta estética",
  "Odontología reconstructiva",
  "Cirugía maxilofacial",
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Mobile top bar (< lg) */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-5 h-16 bg-background/90 backdrop-blur border-b border-border">
        <Link href="/" className="block" onClick={() => setOpen(false)}>
          <span className="font-wordmark text-[16px] text-foreground leading-none">
            {logoText}
          </span>
          <span className="mt-0.5 block text-[9px] uppercase tracking-[0.32em] text-muted-foreground">
            Dental Studio
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground hover:bg-accent transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </header>

      {/* Backdrop (mobile drawer) */}
      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
          className="lg:hidden fixed inset-0 z-40 bg-foreground/25 backdrop-blur-[2px] animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(280px,85vw)] flex-col bg-sidebar border-r border-sidebar-border",
          "transition-transform duration-300 ease-out",
          "lg:w-64 lg:translate-x-0",
          open ? "translate-x-0 shadow-2xl shadow-foreground/10" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Close button (mobile only) */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="lg:hidden absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>

        {/* Wordmark */}
        <div className="px-8 pt-10 pb-8">
          <Link href="/" className="block">
            <span className="font-wordmark text-[22px] text-foreground leading-none">
              {logoText}
            </span>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
              Dental Studio
            </span>
          </Link>
        </div>

        <div className="mx-8 hair-divider" />

        {/* Nav */}
        <nav className="flex-1 px-5 pt-6 pb-8 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-200",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    active ? "text-foreground" : "text-muted-foreground/70"
                  )}
                  strokeWidth={1.5}
                />
                <span className="tracking-tight">{label}</span>
                {active && (
                  <span className="ml-auto h-1 w-1 rounded-full bg-foreground/70" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Specialties (hidden on shorter drawers if needed) */}
        <div className="px-8 pb-6 hidden sm:block">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-3">
            Especialidades
          </p>
          <ul className="space-y-1.5">
            {specialties.map((s) => (
              <li
                key={s}
                className="flex items-center gap-2 text-[11px] text-foreground/70 font-heading"
                style={{ fontVariationSettings: '"opsz" 12, "SOFT" 50' }}
              >
                <span className="h-0.5 w-3 bg-foreground/30" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-8 hair-divider" />

        {/* Footer / Agent info */}
        <div className="px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background shrink-0">
              <span
                className="font-heading text-sm"
                style={{ fontVariationSettings: '"opsz" 14' }}
              >
                {agentName.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium tracking-tight text-foreground truncate">
                {agentName}
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Recepción IA
              </p>
            </div>
          </div>
          <p className="mt-5 text-[9px] uppercase tracking-[0.24em] text-muted-foreground/70 truncate">
            {businessName || "Dental Studio"}
          </p>
        </div>
      </aside>
    </>
  );
}
