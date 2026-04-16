import { Shell } from "@/components/shell";
import { getCalls } from "@/lib/notion";
import {
  ArrowDownRight,
  ArrowUpRight,
  MinusIcon,
  PhoneIncoming,
  PhoneOutgoing,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Call = {
  id: string;
  titulo: string;
  tipo: string;
  resultado: string;
  resumen: string;
  sentimiento: string;
  citaAgendada: boolean;
  duracion: number;
  telefono: string;
  nombreLead: string;
  fecha: string;
};

export default async function LlamadasPage() {
  const calls = (await getCalls()) as Call[];

  return (
    <Shell>
      <header className="mb-10 sm:mb-12">
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-4">
          Historial
        </p>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <h1
            className="font-heading text-[36px] sm:text-[42px] md:text-[48px] leading-[0.95] tracking-tight text-foreground"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
          >
            Llamadas
          </h1>
          <div className="text-right">
            <p
              className="font-heading text-[26px] sm:text-[32px] leading-none text-foreground"
              style={{
                fontVariationSettings: '"opsz" 48, "SOFT" 80',
                fontStyle: "italic",
              }}
            >
              {calls.length}
            </p>
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mt-1">
              Registradas
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {calls.map((call) => (
          <CallCard key={call.id} call={call} />
        ))}
        {calls.length === 0 && (
          <div className="rounded-xl border border-border bg-card py-20 text-center">
            <p className="text-sm text-muted-foreground">
              Aún no hay llamadas registradas.
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}

function CallCard({ call }: { call: Call }) {
  const isInbound = call.tipo === "Inbound";
  const Icon = isInbound ? PhoneIncoming : PhoneOutgoing;

  return (
    <article className="rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
      <div className="grid grid-cols-[auto_1fr_auto] gap-3 sm:gap-6 px-4 sm:px-7 py-5 sm:py-6">
        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-border shrink-0">
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" strokeWidth={1.5} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-x-2 sm:gap-x-3 gap-y-1.5 mb-2 flex-wrap">
            <p className="text-[14px] sm:text-[15px] font-medium text-foreground tracking-tight">
              {call.titulo || call.nombreLead || "Llamada"}
            </p>
            <span className="h-3 w-px bg-border hidden sm:block" />
            <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              {call.tipo}
            </span>
            <span className="h-3 w-px bg-border hidden sm:block" />
            <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              {call.resultado || "—"}
            </span>
            {call.citaAgendada && (
              <span className="text-[10px] uppercase tracking-[0.24em] text-foreground border border-foreground/40 rounded-full px-2.5 py-0.5">
                Cita
              </span>
            )}
            <SentimentChip sentiment={call.sentimiento} />
          </div>

          {call.resumen && (
            <p className="text-[13px] leading-relaxed text-muted-foreground max-w-3xl line-clamp-4 sm:line-clamp-none">
              {call.resumen}
            </p>
          )}

          <div className="flex items-center gap-3 sm:gap-4 mt-3 flex-wrap">
            {call.telefono && (
              <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                {call.telefono}
              </span>
            )}
            {call.duracion > 0 && (
              <>
                <span className="text-muted-foreground/40 hidden sm:inline">·</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {Math.floor(call.duracion / 60)}:
                  {String(call.duracion % 60).padStart(2, "0")}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p
            className="font-heading text-sm text-foreground leading-tight"
            style={{ fontVariationSettings: '"opsz" 14' }}
          >
            {call.fecha
              ? new Date(call.fecha).toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "short",
                })
              : "—"}
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
            {call.fecha
              ? new Date(call.fecha).toLocaleTimeString("es-CO", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </p>
        </div>
      </div>
    </article>
  );
}

function SentimentChip({ sentiment }: { sentiment: string }) {
  if (!sentiment) return null;
  const isPositive = sentiment === "Positivo";
  const isNegative = sentiment === "Negativo";
  const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : MinusIcon;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
      <Icon className="h-3 w-3" strokeWidth={1.5} />
      {sentiment}
    </span>
  );
}
