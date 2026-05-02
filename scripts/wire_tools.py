"""Conecta los tools del backend a los LLMs de Retell + configura webhook post-llamada.

Construye los tools dinamicamente desde daniela.config.yaml + el template de la
industria, asi sirve para cualquier negocio (dental, inmobiliaria, etc).

Agrega a cada LLM:
  - search_products      -> /search-products
  - create_lead          -> /create-lead
  - book_appointment     -> /book-appointment
  - update_lead_status   -> /update-lead-status

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

from app.config import (  # noqa: E402
    BUSINESS,
    CRM_PRODUCT_FIELDS,
    CRM_PRODUCT_NAME,
    CRM_LEAD_EXTRA_FIELDS,
)

BACKEND = "https://haski-audiovisual--callia-asistente-api.modal.run"


def _select_options(fields: list, name: str) -> list:
    """Devuelve las opciones de un campo tipo 'select' por nombre."""
    for f in fields:
        if f.get("name") == name and f.get("type") == "select":
            return f.get("options", [])
    return []


def _category_options() -> list:
    """Opciones del campo 'Categoria' del producto (si existe)."""
    return _select_options(CRM_PRODUCT_FIELDS, "Categoria")


def _interest_field() -> tuple[str, list]:
    """Devuelve (nombre, opciones) del primer campo 'select' de lead_extra_fields."""
    for f in CRM_LEAD_EXTRA_FIELDS:
        if f.get("type") == "select":
            return f.get("name", ""), f.get("options", [])
    return "", []


def build_tools() -> list:
    product_label = CRM_PRODUCT_NAME or "Productos"
    business_name = BUSINESS.get("name", "")
    industry = BUSINESS.get("industry", "")

    category_opts = _category_options()
    interest_name, interest_opts = _interest_field()
    urgency_opts = _select_options(CRM_LEAD_EXTRA_FIELDS, "Urgencia")
    status_opts = [
        "En proceso",
        "Pendiente de llamar",
        "Cita agendada",
        "Cerrado ganado",
        "Cerrado perdido",
        "No contesta",
    ]

    search_props: dict = {}
    if category_opts:
        search_props["categoria"] = {
            "type": "string",
            "description": f"Categoria de {product_label.lower()}",
            "enum": category_opts,
        }

    search_tool = {
        "type": "custom",
        "name": "search_products",
        "description": (
            f"Busca {product_label.lower()} disponibles"
            + (f" en {business_name}" if business_name else "")
            + (f" ({', '.join(category_opts).lower()})" if category_opts else "")
            + ". Usa esta tool cuando el cliente pregunte por opciones, precios o detalles."
        ),
        "url": f"{BACKEND}/search-products",
        "method": "POST",
        "speak_during_execution": True,
        "execution_message_description": "Dejame revisar...",
        "parameters": {
            "type": "object",
            "properties": search_props,
            "required": [],
        },
        "timeout_ms": 10000,
    }

    lead_props = {
        "name": {"type": "string", "description": "Nombre completo del cliente"},
        "phone": {"type": "string", "description": "Telefono con codigo de pais"},
        "email": {"type": "string", "description": "Email del cliente (opcional)"},
        "fuente": {
            "type": "string",
            "description": "Como llego el cliente",
            "enum": ["Llamada entrante", "Llamada saliente", "Sitio web", "Referido", "Otro"],
        },
        "notas": {"type": "string", "description": "Motivo de la llamada o contexto relevante"},
    }
    if interest_name and interest_opts:
        # Convierte "Tratamiento de interes" -> "tratamiento_de_interes"
        key = interest_name.lower().replace(" ", "_").replace("ó", "o").replace("á", "a").replace("é", "e").replace("í", "i").replace("ú", "u")
        lead_props[key] = {
            "type": "string",
            "description": interest_name,
            "enum": interest_opts,
        }
    if urgency_opts:
        lead_props["urgencia"] = {
            "type": "string",
            "enum": urgency_opts,
        }

    create_lead_tool = {
        "type": "custom",
        "name": "create_lead",
        "description": (
            "Guarda los datos de un cliente nuevo en el CRM. Usa siempre despues de "
            "capturar nombre y telefono del cliente."
        ),
        "url": f"{BACKEND}/create-lead",
        "method": "POST",
        "speak_during_execution": False,
        "parameters": {
            "type": "object",
            "properties": lead_props,
            "required": ["name", "phone"],
        },
        "timeout_ms": 10000,
    }

    book_tool = {
        "type": "custom",
        "name": "book_appointment",
        "description": (
            "Agenda una cita. Si el cliente no sabe una hora exacta, puedes llamar "
            "primero con solo preferred_date para ver disponibilidad. Nunca confirmes "
            "la cita al cliente hasta ver status='ok' en la respuesta."
        ),
        "url": f"{BACKEND}/book-appointment",
        "method": "POST",
        "speak_during_execution": True,
        "execution_message_description": "Estoy agendando tu cita...",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Nombre completo del cliente"},
                "phone": {"type": "string"},
                "email": {"type": "string"},
                "preferred_date": {"type": "string", "description": "Fecha en formato YYYY-MM-DD"},
                "preferred_time": {"type": "string", "description": "Hora en formato HH:MM 24h"},
            },
            "required": ["name", "preferred_date"],
        },
        "timeout_ms": 15000,
    }

    update_lead_tool = {
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
                "estatus": {"type": "string", "enum": status_opts},
                "temperatura": {"type": "string", "enum": ["Hot", "Warm", "Cold"]},
                "siguiente_accion": {"type": "string"},
            },
            "required": ["phone"],
        },
        "timeout_ms": 10000,
    }

    return [search_tool, create_lead_tool, book_tool, update_lead_tool]


def main():
    client = Retell(api_key=os.environ["RETELL_API_KEY"])

    inbound_llm = os.environ["RETELL_INBOUND_LLM_ID"]
    outbound_llm = os.environ["RETELL_OUTBOUND_LLM_ID"]
    inbound_agent = os.environ["RETELL_INBOUND_AGENT_ID"]
    outbound_agent = os.environ["RETELL_OUTBOUND_AGENT_ID"]

    tools = build_tools()

    print(f"[1/3] Agregando {len(tools)} tools al LLM inbound...")
    client.llm.update(llm_id=inbound_llm, general_tools=tools)
    print(f"  OK")

    print(f"[2/3] Agregando {len(tools)} tools al LLM outbound...")
    client.llm.update(llm_id=outbound_llm, general_tools=tools)
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

    business = BUSINESS.get("name") or "el negocio"
    print(f"\nSistema completo conectado para {business}.")


if __name__ == "__main__":
    main()
