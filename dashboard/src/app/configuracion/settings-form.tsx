"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, Radio } from "lucide-react";

export function SettingsForm({
  agentName,
  businessName,
  industryName,
  language,
  initialGreeting,
  initialPrompt,
  initialTemperature,
  model,
}: {
  agentName: string;
  businessName: string;
  industryName: string;
  language: string;
  initialGreeting: string;
  initialPrompt: string;
  initialTemperature: number;
  model: string;
}) {
  const [greeting, setGreeting] = useState(initialGreeting);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [temperature, setTemperature] = useState(initialTemperature);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [outboundStatus, setOutboundStatus] = useState<string | null>(null);
  const [triggeringOutbound, setTriggeringOutbound] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beginMessage: greeting,
          generalPrompt: prompt,
          modelTemperature: temperature,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleTriggerOutbound() {
    setTriggeringOutbound(true);
    setOutboundStatus(null);
    try {
      const res = await fetch("/api/trigger-outbound", { method: "POST" });
      const data = await res.json();
      setOutboundStatus(
        `${data.calls_made ?? 0} llamadas realizadas de ${
          data.leads_found ?? 0
        } pendientes`
      );
    } catch {
      setOutboundStatus("Error al disparar el worker");
    } finally {
      setTriggeringOutbound(false);
    }
  }

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* Agent card */}
      <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <span
                className="font-heading text-[20px] sm:text-[22px]"
                style={{ fontVariationSettings: '"opsz" 24' }}
              >
                {agentName.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <p
                className="font-heading text-[24px] sm:text-[28px] leading-none text-foreground"
                style={{
                  fontVariationSettings: '"opsz" 48, "SOFT" 40',
                  fontStyle: "italic",
                }}
              >
                {agentName}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Recepción virtual de {businessName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <StatusIndicator active />
            <Meta>{industryName}</Meta>
            <Meta>{language}</Meta>
            {model && <Meta mono>{model}</Meta>}
          </div>
        </div>
      </section>

      {/* Greeting */}
      <Block
        eyebrow="Saludo inicial"
        title="Primera frase al contestar"
        description={`Lo primero que escucha el paciente cuando ${agentName} toma la llamada. Corta y clara funciona mejor.`}
      >
        <Textarea
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          rows={3}
          className="bg-background border-border text-sm resize-none leading-relaxed"
        />
      </Block>

      {/* Prompt */}
      <Block
        eyebrow="Personalidad"
        title="Carácter del agente"
        description={`Las instrucciones que definen cómo habla, qué información conoce y cómo responde ${agentName} durante la conversación.`}
      >
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={18}
          className="bg-background border-border text-sm font-mono resize-none leading-relaxed"
        />
      </Block>

      {/* Temperature */}
      <Block
        eyebrow="Tono"
        title="Precisión versus creatividad"
        description="Valores bajos hacen respuestas consistentes y predecibles. Valores altos las vuelven más conversacionales y naturales."
      >
        <div className="flex items-center gap-6">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="flex-1 accent-foreground"
          />
          <span
            className="font-heading text-[28px] leading-none text-foreground w-14 text-right tabular-nums"
            style={{ fontVariationSettings: '"opsz" 36, "SOFT" 40' }}
          >
            {temperature.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-[10px] uppercase tracking-[0.24em] text-muted-foreground mt-2">
          <span>Precisa</span>
          <span>Conversacional</span>
        </div>
      </Block>

      {/* Save button */}
      <div className="flex items-center gap-5">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-foreground text-background hover:bg-foreground/85 rounded-full px-8 h-11 text-sm tracking-wide uppercase [letter-spacing:0.14em]"
        >
          {saving ? "Guardando" : "Guardar cambios"}
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-2 text-sm text-foreground/75">
            <Check className="h-3.5 w-3.5" strokeWidth={2} />
            Guardado
          </span>
        )}
      </div>

      <div className="hair-divider" />

      {/* Outbound trigger */}
      <Block
        eyebrow="Seguimiento"
        title="Llamadas salientes manuales"
        description={`${agentName} llama automáticamente cada hora a los pacientes pendientes. Si quieres adelantar ese ciclo, dispáralo manualmente.`}
      >
        <div className="flex items-center gap-5 flex-wrap">
          <Button
            onClick={handleTriggerOutbound}
            disabled={triggeringOutbound}
            variant="outline"
            className="rounded-full px-7 h-11 text-sm tracking-wide uppercase [letter-spacing:0.14em] border-foreground/30 text-foreground hover:bg-accent"
          >
            <Radio className="h-4 w-4 mr-2" strokeWidth={1.5} />
            {triggeringOutbound ? "Disparando" : "Disparar seguimientos"}
          </Button>
          {outboundStatus && (
            <span className="text-sm text-muted-foreground">
              {outboundStatus}
            </span>
          )}
        </div>
      </Block>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────

function Block({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-12">
      <div>
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-3">
          {eyebrow}
        </p>
        <h3
          className="font-heading text-lg sm:text-xl text-foreground tracking-tight mb-3"
          style={{ fontVariationSettings: '"opsz" 24, "SOFT" 40' }}
        >
          {title}
        </h3>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div>{children}</div>
    </section>
  );
}

function StatusIndicator({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1">
      <span className="relative flex h-1.5 w-1.5">
        <span
          className={`absolute inset-0 rounded-full ${
            active ? "bg-emerald-500/40 animate-ping" : ""
          }`}
        />
        <span
          className={`relative h-1.5 w-1.5 rounded-full ${
            active ? "bg-emerald-600" : "bg-muted-foreground"
          }`}
        />
      </span>
      <span className="text-[10px] uppercase tracking-[0.24em] text-foreground/70">
        {active ? "Activa" : "Pausada"}
      </span>
    </span>
  );
}

function Meta({
  children,
  mono = false,
}: {
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <span
      className={`text-[10px] uppercase tracking-[0.24em] text-muted-foreground ${
        mono ? "font-mono" : ""
      }`}
    >
      {children}
    </span>
  );
}
