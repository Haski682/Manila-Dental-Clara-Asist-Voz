import { Shell } from "@/components/shell";
import { getLeads, getLeadExtra } from "@/lib/notion";
import { industryTemplate } from "@/lib/config";

export const dynamic = "force-dynamic";

type ExtraField = { name: string; type: string };

type Lead = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  estatus: string;
  temperatura: string;
  intentos: number;
  _raw: Record<string, unknown>;
};

export default async function LeadsPage() {
  const leads = (await getLeads()) as Lead[];
  const extraFields = industryTemplate.leadExtraFields as ExtraField[];

  return (
    <Shell>
      <header className="mb-10 sm:mb-12">
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-4">
          Base de leads
        </p>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <h1
            className="font-heading text-[36px] sm:text-[42px] md:text-[48px] leading-[0.95] tracking-tight text-foreground"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
          >
            Leads
          </h1>
          <div className="text-right">
            <p
              className="font-heading text-[26px] sm:text-[32px] leading-none text-foreground"
              style={{
                fontVariationSettings: '"opsz" 48, "SOFT" 80',
                fontStyle: "italic",
              }}
            >
              {leads.length}
            </p>
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mt-1">
              Registros en CRM
            </p>
          </div>
        </div>
      </header>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[2fr_1.4fr_1.2fr_0.8fr_1.2fr_0.6fr] gap-4 px-6 py-4 border-b border-border bg-muted/40">
          <HeaderCell>Lead</HeaderCell>
          <HeaderCell>Teléfono</HeaderCell>
          <HeaderCell>Estatus</HeaderCell>
          <HeaderCell>Temp.</HeaderCell>
          <HeaderCell>{extraFields[0]?.name ?? "Interés"}</HeaderCell>
          <HeaderCell align="right">Intentos</HeaderCell>
        </div>

        <div className="divide-y divide-border">
          {leads.map((lead) => {
            const interest = extraFields[0]
              ? getLeadExtra(lead._raw, extraFields[0].name, extraFields[0].type)
              : null;
            const interestDisplay = Array.isArray(interest)
              ? interest.join(", ")
              : String(interest ?? "—");
            return (
              <div
                key={lead.id}
                className="grid grid-cols-[2fr_1.4fr_1.2fr_0.8fr_1.2fr_0.6fr] gap-4 px-6 py-5 items-center hover:bg-accent/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground tracking-tight truncate">
                    {lead.nombre || "Sin nombre"}
                  </p>
                  {lead.email && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {lead.email}
                    </p>
                  )}
                </div>
                <p className="text-sm font-mono text-foreground/80 tabular-nums">
                  {lead.telefono || "—"}
                </p>
                <StatusPill status={lead.estatus} />
                <TempPill temp={lead.temperatura} />
                <p className="text-[13px] text-foreground/75 truncate">
                  {interestDisplay !== "null" && interestDisplay !== ""
                    ? interestDisplay
                    : "—"}
                </p>
                <p
                  className="font-heading text-sm text-foreground text-right tabular-nums"
                  style={{ fontVariationSettings: '"opsz" 14' }}
                >
                  {lead.intentos}
                </p>
              </div>
            );
          })}
          {leads.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-sm text-muted-foreground">
                Aún no hay leads registrados.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {leads.map((lead) => {
          const interest = extraFields[0]
            ? getLeadExtra(lead._raw, extraFields[0].name, extraFields[0].type)
            : null;
          const interestDisplay = Array.isArray(interest)
            ? interest.join(", ")
            : String(interest ?? "");
          return (
            <article
              key={lead.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-foreground tracking-tight truncate">
                    {lead.nombre || "Sin nombre"}
                  </p>
                  {lead.email && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {lead.email}
                    </p>
                  )}
                  <p className="text-[13px] font-mono text-foreground/80 tabular-nums mt-1.5">
                    {lead.telefono || "—"}
                  </p>
                </div>
                <TempPill temp={lead.temperatura} />
              </div>

              <div className="hair-divider my-3" />

              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Field label="Estatus">
                  <StatusPill status={lead.estatus} />
                </Field>
                <Field label="Intentos" align="right">
                  <span
                    className="font-heading text-sm text-foreground tabular-nums"
                    style={{ fontVariationSettings: '"opsz" 14' }}
                  >
                    {lead.intentos}
                  </span>
                </Field>
                {interestDisplay && interestDisplay !== "null" && (
                  <Field label={extraFields[0]?.name ?? "Interés"} full>
                    <p className="text-[13px] text-foreground/80">
                      {interestDisplay}
                    </p>
                  </Field>
                )}
              </div>
            </article>
          );
        })}
        {leads.length === 0 && (
          <div className="rounded-xl border border-border bg-card py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Aún no hay leads registrados.
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}

function HeaderCell({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <p
      className={`text-[10px] uppercase tracking-[0.24em] text-muted-foreground ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </p>
  );
}

function Field({
  label,
  children,
  align = "left",
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  align?: "left" | "right";
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <p
        className={`text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1 ${
          align === "right" ? "text-right" : ""
        }`}
      >
        {label}
      </p>
      <div className={align === "right" ? "text-right" : ""}>{children}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (!status) return <span className="text-[11px] text-muted-foreground">—</span>;
  const emphatic = ["Cita agendada", "Cerrado ganado"].includes(status);
  return (
    <span
      className={`inline-flex items-center gap-2 text-[11px] text-foreground/80 ${
        emphatic ? "text-foreground" : ""
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
          emphatic ? "bg-foreground" : "bg-foreground/30"
        }`}
      />
      {status}
    </span>
  );
}

function TempPill({ temp }: { temp: string }) {
  if (!temp) return <span className="text-[11px] text-muted-foreground">—</span>;
  const map: Record<string, number> = { Hot: 3, Warm: 2, Cold: 1 };
  const level = map[temp] ?? 0;
  return (
    <span className="inline-flex items-center gap-1.5 shrink-0">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`h-0.5 w-2.5 ${
            i <= level ? "bg-foreground" : "bg-border"
          }`}
        />
      ))}
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1">
        {temp}
      </span>
    </span>
  );
}
