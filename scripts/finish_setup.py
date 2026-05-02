"""Setup corregido — usa el SDK actual de Retell y busca las DBs de Notion ya creadas.

Pasos:
1. Busca las 3 bases de datos en Notion (ya creadas por scripts/setup.py)
2. Crea 2 LLMs (inbound + outbound) y 2 agentes en Retell via SDK
3. Actualiza .env con todos los IDs generados

El import del numero de Twilio se hace en un paso separado (ver instrucciones).
"""
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv
from retell import Retell

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_ROOT / ".env"
sys.path.insert(0, str(PROJECT_ROOT))
load_dotenv(ENV_PATH)

from app.config import AGENT, BUSINESS, CRM_PRODUCT_NAME, get_inbound_prompt, get_outbound_prompt


def find_notion_dbs() -> dict:
    api = os.environ["NOTION_API_KEY"]
    business = BUSINESS["name"]
    r = requests.post(
        "https://api.notion.com/v1/search",
        headers={
            "Authorization": f"Bearer {api}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
        },
        json={"query": business, "filter": {"value": "database", "property": "object"}},
    )
    r.raise_for_status()
    by_title: dict[str, str] = {}
    for item in r.json().get("results", []):
        title = "".join(t.get("plain_text", "") for t in item.get("title", []))
        by_title[title] = item["id"]

    def find_one(prefix: str) -> str:
        for title, did in by_title.items():
            if title.startswith(prefix):
                return did
        raise RuntimeError(f"No se encontro DB en Notion que empiece con '{prefix}'")

    products_label = CRM_PRODUCT_NAME or "Productos"
    return {
        "NOTION_PRODUCTS_DB_ID": find_one(products_label),
        "NOTION_LEADS_DB_ID": find_one("Leads"),
        "NOTION_CALLS_DB_ID": find_one("Llamadas"),
    }


def create_retell_resources() -> dict:
    client = Retell(api_key=os.environ["RETELL_API_KEY"])
    agent_name = AGENT["name"]
    voice_id = AGENT["voice_id"]
    language = AGENT["language"]

    print(f"  Creando LLM inbound...")
    inbound_llm = client.llm.create(
        model="claude-4.5-sonnet",
        general_prompt=get_inbound_prompt(),
        begin_message=f"Hola, gracias por comunicarse con {BUSINESS['name']}, le atiende {agent_name}. En que le puedo ayudar?",
    )
    print(f"  OK llm inbound: {inbound_llm.llm_id}")

    print(f"  Creando agente inbound...")
    inbound_agent = client.agent.create(
        response_engine={"type": "retell-llm", "llm_id": inbound_llm.llm_id},
        voice_id=voice_id,
        agent_name=f"{agent_name} - Inbound",
        language=language,
    )
    print(f"  OK agente inbound: {inbound_agent.agent_id}")

    print(f"  Creando LLM outbound...")
    outbound_llm = client.llm.create(
        model="claude-4.5-sonnet",
        general_prompt=get_outbound_prompt(),
    )
    print(f"  OK llm outbound: {outbound_llm.llm_id}")

    print(f"  Creando agente outbound...")
    outbound_agent = client.agent.create(
        response_engine={"type": "retell-llm", "llm_id": outbound_llm.llm_id},
        voice_id=voice_id,
        agent_name=f"{agent_name} - Outbound",
        language=language,
    )
    print(f"  OK agente outbound: {outbound_agent.agent_id}")

    return {
        "RETELL_INBOUND_LLM_ID": inbound_llm.llm_id,
        "RETELL_INBOUND_AGENT_ID": inbound_agent.agent_id,
        "RETELL_OUTBOUND_LLM_ID": outbound_llm.llm_id,
        "RETELL_OUTBOUND_AGENT_ID": outbound_agent.agent_id,
    }


def update_env(additions: dict):
    existing = ENV_PATH.read_text() if ENV_PATH.exists() else ""
    lines = existing.splitlines()
    existing_keys = {line.split("=", 1)[0] for line in lines if "=" in line and not line.strip().startswith("#")}

    to_append = []
    for key, value in additions.items():
        if key not in existing_keys:
            to_append.append(f"{key}={value}")

    if not to_append:
        print("\n  Nada nuevo para agregar al .env")
        return

    with open(ENV_PATH, "a", encoding="utf-8") as f:
        if existing and not existing.endswith("\n"):
            f.write("\n")
        f.write("\n# --- Generados por finish_setup.py ---\n")
        for line in to_append:
            f.write(line + "\n")
    print(f"\n  .env actualizado con {len(to_append)} variables")


def main():
    label = f"{BUSINESS.get('name', 'Callia')} ({AGENT.get('name', 'Daniela')})"
    print("=" * 50)
    print(f"  Finish Setup - {label}")
    print("=" * 50)

    print("\n[1/3] Buscando DBs de Notion...")
    notion_ids = find_notion_dbs()
    for k, v in notion_ids.items():
        print(f"  OK {k}: {v[:8]}...")

    print("\n[2/3] Creando recursos en Retell...")
    retell_ids = create_retell_resources()

    print("\n[3/3] Actualizando .env...")
    update_env({**notion_ids, **retell_ids})

    print("\n" + "=" * 50)
    print("  SETUP CORE COMPLETADO")
    print("=" * 50)
    print("""
Siguiente paso: importar el numero de Twilio a Retell (SIP trunking).
Este paso requiere configuracion en el dashboard de Twilio.
Te doy las instrucciones cuando estes listo.
""")


if __name__ == "__main__":
    main()
