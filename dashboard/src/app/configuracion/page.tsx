import { Shell } from "@/components/shell";
import { getLlm } from "@/lib/retell";
import { agent, business, industryTemplate } from "@/lib/config";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const llm = await getLlm();

  return (
    <Shell>
      <header className="mb-10 sm:mb-12">
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-4">
          Estudio {agent.name}
        </p>
        <h1
          className="font-heading text-[36px] sm:text-[42px] md:text-[48px] leading-[0.95] tracking-tight text-foreground"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
        >
          Configuración
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Ajusta la voz, el carácter y el ritmo con el que {agent.name} atiende
          a cada cliente. Los cambios que hagas aquí se aplican en tiempo real.
        </p>
      </header>

      <SettingsForm
        agentName={agent.name}
        businessName={business.name}
        industryName={industryTemplate.displayName}
        language={agent.language}
        initialGreeting={llm?.begin_message ?? ""}
        initialPrompt={llm?.general_prompt ?? ""}
        initialTemperature={llm?.model_temperature ?? 0.4}
        model={llm?.model ?? ""}
      />
    </Shell>
  );
}
