import { Shell } from "@/components/shell";
import { getStats, getCalls } from "@/lib/notion";
import { agent, business } from "@/lib/config";
import { ArrowDownRight, ArrowUpRight, MinusIcon, PhoneIncoming, PhoneOutgoing } from "lucide-react";

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
  fecha: string;
};

export default async function DashboardPage() {
  const [stats, calls] = await Promise.all([getStats(), getCalls()]);
  const recentCalls = (calls as Call[]).slice(0, 6);

  return (
    <Shell>
      {/* Eyebrow + title */}
      <header className="mb-10 sm:mb-14">
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-4">
          Panel de control · {business.name}
        </p>
        <h1
          className="font-heading text-[40px] sm:text-[48px] md:text-[56px] leading-[0.95] tracking-tight text-foreground"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
        >
          Recepción
          <br />
          <span className="italic text-foreground/85" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}>
            inteligente.
          </span>
        </h1>
        <p className="mt-5 sm:mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {agent.name} atiende, agenda y acompaña a cada cliente
          {business.name ? ` de ${business.name}` : ""} con el cuidado de una
          conversación presencial. Aquí ves todo lo que ocurre cuando tú no
          estás al teléfono.
        </p>
      </header>

      {/* KPI row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border mb-12 sm:mb-14">
        <Kpi label="Llamadas" value={stats.totalCalls} sub="totales" />
        <Kpi label="Leads" value={stats.totalLeads} sub="registrados" />
        <Kpi
          label="Citas"
          value={stats.citasAgendadas}
          sub="agendadas"
          emphasize
        />
        <Kpi
          label="Efectividad"
          value={`${stats.tasaExito}%`}
          sub="contestadas"
        />
      </section>

      {/* Secondary metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-14 sm:mb-16">
        <MetricBlock
          eyebrow="Duración media"
          value={formatDuration(stats.avgDuration)}
          caption="por conversación"
        />
        <MetricBlock
          eyebrow="Contestadas"
          value={stats.contestadas}
          caption={`de ${stats.totalCalls} llamadas`}
        />
        <TempBlock
          hot={stats.temperatura.hot}
          warm={stats.temperatura.warm}
          cold={stats.temperatura.cold}
        />
      </section>

      {/* Funnel */}
      {Object.keys(stats.statusCounts).length > 0 && (
        <section className="mb-16">
          <SectionTitle eyebrow="Pipeline" title="Estado de leads" />
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2"
              >
                <StatusDot status={status} />
                <span className="text-xs text-muted-foreground">{status}</span>
                <span
                  className="font-heading text-sm text-foreground"
                  style={{ fontVariationSettings: '"opsz" 14, "SOFT" 30' }}
                >
                  {count as number}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent calls */}
      <section>
        <SectionTitle
          eyebrow="Actividad reciente"
          title="Últimas llamadas"
        />
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {recentCalls.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Aún no hay llamadas registradas.
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Cuando {agent.name} reciba la primera, aparecerá aquí.
              </p>
            </div>
          )}
          {recentCalls.map((call) => (
            <CallRow key={call.id} call={call} />
          ))}
        </div>
      </section>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-1.5">
        {eyebrow}
      </p>
      <h2
        className="font-heading text-2xl text-foreground tracking-tight"
        style={{ fontVariationSettings: '"opsz" 32, "SOFT" 40' }}
      >
        {title}
      </h2>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  emphasize = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  emphasize?: boolean;
}) {
  return (
    <div className="bg-card px-4 sm:px-6 py-6 sm:py-8">
      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-3 sm:mb-4">
        {label}
      </p>
      <p
        className={`font-heading leading-none text-foreground ${
          emphasize
            ? "text-[40px] sm:text-[48px] lg:text-[56px]"
            : "text-[36px] sm:text-[42px] lg:text-[48px]"
        }`}
        style={{
          fontVariationSettings: `"opsz" 144, "SOFT" ${emphasize ? 80 : 40}`,
          fontStyle: emphasize ? "italic" : "normal",
        }}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-2 text-[11px] text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

function MetricBlock({
  eyebrow,
  value,
  caption,
}: {
  eyebrow: string;
  value: string | number;
  caption: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-3">
        {eyebrow}
      </p>
      <p
        className="font-heading text-[36px] leading-none text-foreground"
        style={{ fontVariationSettings: '"opsz" 48, "SOFT" 40' }}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

function TempBlock({ hot, warm, cold }: { hot: number; warm: number; cold: number }) {
  const total = hot + warm + cold || 1;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-3">
        Temperatura del lead
      </p>
      <div className="flex items-baseline gap-5">
        <TempItem label="Hot" count={hot} pct={(hot / total) * 100} />
        <TempItem label="Warm" count={warm} pct={(warm / total) * 100} />
        <TempItem label="Cold" count={cold} pct={(cold / total) * 100} />
      </div>
    </div>
  );
}

function TempItem({
  label,
  count,
  pct,
}: {
  label: string;
  count: number;
  pct: number;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-heading text-[22px] text-foreground leading-none"
          style={{ fontVariationSettings: '"opsz" 24, "SOFT" 40' }}
        >
          {count}
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-2 h-px w-16 bg-border relative overflow-hidden">
        <span
          className="absolute inset-y-0 left-0 bg-foreground/70"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CallRow({ call }: { call: Call }) {
  const isInbound = call.tipo === "Inbound";
  const Icon = isInbound ? PhoneIncoming : PhoneOutgoing;
  return (
    <div className="grid grid-cols-[auto_1fr_auto] gap-3 sm:gap-5 px-4 sm:px-6 py-4 sm:py-5 items-start hover:bg-accent/40 transition-colors">
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-x-2 sm:gap-x-3 gap-y-1 mb-1 flex-wrap">
          <span className="text-sm font-medium text-foreground tracking-tight">
            {call.titulo || "Llamada"}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {call.resultado || "—"}
          </span>
          {call.citaAgendada && (
            <span
              className="text-[10px] uppercase tracking-[0.2em] text-foreground border border-foreground/40 rounded-full px-2 py-0.5"
              style={{ fontFeatureSettings: '"ss01"' }}
            >
              Cita
            </span>
          )}
          <SentimentChip sentiment={call.sentimiento} />
        </div>
        {call.resumen && (
          <p className="text-[13px] leading-relaxed text-muted-foreground max-w-2xl line-clamp-3 sm:line-clamp-none">
            {call.resumen}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p
          className="font-heading text-sm text-foreground"
          style={{ fontVariationSettings: '"opsz" 14' }}
        >
          {call.duracion ? formatDuration(call.duracion) : "—"}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {call.fecha
            ? new Date(call.fecha).toLocaleDateString("es-CO", {
                day: "numeric",
                month: "short",
              })
            : ""}
        </p>
      </div>
    </div>
  );
}

function SentimentChip({ sentiment }: { sentiment: string }) {
  if (!sentiment) return null;
  const isPositive = sentiment === "Positivo";
  const isNegative = sentiment === "Negativo";
  const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : MinusIcon;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
      <Icon className="h-3 w-3" strokeWidth={1.5} />
      {sentiment}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Pendiente de llamar": "bg-foreground/30",
    "En proceso": "bg-foreground/55",
    "Cita agendada": "bg-foreground",
    "No contesta": "bg-foreground/30",
    "Cerrado ganado": "bg-foreground",
    "Cerrado perdido": "bg-foreground/20",
  };
  return (
    <span className={`h-1.5 w-1.5 rounded-full ${map[status] ?? "bg-foreground/40"}`} />
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
