"""Conecta los tools del backend a los LLMs de Retell + configura webhook post-llamada.

Agrega a cada LLM:
  - search_products  -> /search-products
  - create_lead      -> /create-lead
  - book_appointment -> /book-appointment
  - update_lead_status -> /update-lead-status

Agrega a cada agente:
  - webhook_url = /retell-webhook
  - webhook_events = call_ended, call_analyzed
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from retell import Retell

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
load_dotenv(PROJECT_ROOT / ".env")

BACKEND = "https://haski-audiovisual--mega-sistema-ia-api.modal.run"

SEARCH_TOOL = {
    "type": "custom",
    "name": "search_products",
    "description": (
        "Busca tratamientos dentales disponibles (limpieza, ortodoncia, implantes, "
        "blanqueamiento, endodoncia, cirugia, estetica). Puedes filtrar por Categoria."
    ),
    "url": f"{BACKEND}/search-products",
    "method": "POST",
    "speak_during_execution": True,
    "execution_message_description": "Dejame revisar...",
    "parameters": {
        "type": "object",
        "properties": {
            "categoria": {
                "type": "string",
                "description": "Categoria del tratamiento",
                "enum": ["Limpieza", "Ortodoncia", "Implantes", "Blanqueamiento", "Endodoncia", "Cirugia", "Estetica"],
            }
        },
        "required": [],
    },
    "timeout_ms": 10000,
}

CREATE_LEAD_TOOL = {
    "type": "custom",
    "name": "create_lead",
    "description": (
        "Guarda los datos de un paciente nuevo en el CRM. Usa siempre despues de "
        "capturar nombre y telefono del paciente."
    ),
    "url": f"{BACKEND}/create-lead",
    "method": "POST",
    "speak_during_execution": False,
    "parameters": {
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "Nombre completo del paciente"},
            "phone": {"type": "string", "description": "Telefono con codigo de pais"},
            "email": {"type": "string", "description": "Email del paciente (opcional)"},
            "fuente": {
                "type": "string",
                "description": "Como llego el paciente",
                "enum": ["Llamada entrante", "Llamada saliente", "Sitio web", "Referido", "Otro"],
            },
            "notas": {"type": "string", "description": "Motivo de la llamada o contexto relevante"},
            "tratamiento_de_interes": {
                "type": "string",
                "enum": ["Limpieza", "Ortodoncia", "Implantes", "Blanqueamiento", "Valoracion general", "Urgencia"],
            },
            "urgencia": {
                "type": "string",
                "enum": ["Urgente (dolor)", "Esta semana", "Este mes", "Solo explorando"],
            },
        },
        "required": ["name", "phone"],
    },
    "timeout_ms": 10000,
}

BOOK_TOOL = {
    "type": "custom",
    "name": "book_appointment",
    "description": (
        "Agenda una cita dental. Si el paciente no sabe una hora exacta, puedes llamar "
        "primero con solo preferred_date para ver disponibilidad. Nunca confirmes la "
        "cita al paciente hasta ver status='ok' en la respuesta."
    ),
    "url": f"{BACKEND}/book-appointment",
    "method": "POST",
    "speak_during_execution": True,
    "execution_message_description": "Estoy agendando tu cita...",
    "parameters": {
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "Nombre completo del paciente"},
            "phone": {"type": "string"},
            "email": {"type": "string"},
            "preferred_date": {"type": "string", "description": "Fecha en formato YYYY-MM-DD"},
            "preferred_time": {"type": "string", "description": "Hora en formato HH:MM 24h"},
        },
        "required": ["name", "preferred_date"],
    },
    "timeout_ms": 15000,
}

UPDATE_LEAD_TOOL = {
    "type": "custom",
    "name": "update_lead_status",
    "description": (
        "Actualiza el estatus, temperatura o siguiente accion de un lead existente. "
        "Usa phone para identificar al lead."
    ),
    "url": f"{BACKEND}/update-lead-status",
    "method": "POST",
    "speak_during_execution": False,
    "parameters": {
        "type": "object",
        "properties": {
            "phone": {"type": "string"},
            "estatus": {
                "type": "string",
                "enum": ["En proceso", "Pendiente de llamar", "Cita agendada", "Cerrado ganado", "Cerrado perdido", "No contesta"],
            },
            "temperatura": {"type": "string", "enum": ["Hot", "Warm", "Cold"]},
            "siguiente_accion": {"type": "string"},
        },
        "required": ["phone"],
    },
    "timeout_ms": 10000,
}

TOOLS = [SEARCH_TOOL, CREATE_LEAD_TOOL, BOOK_TOOL, UPDATE_LEAD_TOOL]


def main():
    client = Retell(api_key=os.environ["RETELL_API_KEY"])

    inbound_llm = os.environ["RETELL_INBOUND_LLM_ID"]
    outbound_llm = os.environ["RETELL_OUTBOUND_LLM_ID"]
    inbound_agent = os.environ["RETELL_INBOUND_AGENT_ID"]
    outbound_agent = os.environ["RETELL_OUTBOUND_AGENT_ID"]

    print(f"[1/3] Agregando {len(TOOLS)} tools al LLM inbound...")
    client.llm.update(llm_id=inbound_llm, general_tools=TOOLS)
    print(f"  OK")

    print(f"[2/3] Agregando {len(TOOLS)} tools al LLM outbound...")
    client.llm.update(llm_id=outbound_llm, general_tools=TOOLS)
    print(f"  OK")

    print(f"[3/3] Configurando webhook post-llamada en ambos agentes...")
    webhook_url = f"{BACKEND}/retell-webhook"
    events = ["call_ended", "call_analyzed"]
    for agent_id, label in [(inbound_agent, "inbound"), (outbound_agent, "outbound")]:
        client.agent.update(
            agent_id=agent_id,
            webhook_url=webhook_url,
            webhook_events=events,
        )
        print(f"  OK {label}: webhook -> {webhook_url}")

    print("\nSistema completo conectado. Clara puede buscar tratamientos, crear leads,")
    print("agendar citas y cada llamada se guarda en Notion con analisis post-call.")


if __name__ == "__main__":
    main()
