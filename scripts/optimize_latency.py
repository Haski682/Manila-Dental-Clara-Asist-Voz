"""Aplica 3 optimizaciones de latencia a los LLMs de Retell.

1. Cambia modelo a claude-4.5-haiku (3-4x mas rapido que Sonnet)
2. Activa model_high_priority (pool dedicado)
3. Aplica prompt simplificado (reduce tokens de primer token)
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from retell import Retell

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
load_dotenv(PROJECT_ROOT / ".env")

from app.config import get_inbound_prompt, get_outbound_prompt


def main():
    client = Retell(api_key=os.environ["RETELL_API_KEY"])
    inbound_llm = os.environ["RETELL_INBOUND_LLM_ID"]
    outbound_llm = os.environ["RETELL_OUTBOUND_LLM_ID"]

    inbound_prompt = get_inbound_prompt()
    outbound_prompt = get_outbound_prompt()

    print(f"Prompt inbound: {len(inbound_prompt)} chars")
    print(f"Prompt outbound: {len(outbound_prompt)} chars")

    print("\n[1/2] Actualizando LLM inbound (Haiku + high priority + prompt corto)...")
    client.llm.update(
        llm_id=inbound_llm,
        model="claude-4.5-haiku",
        model_high_priority=True,
        general_prompt=inbound_prompt,
    )
    print("  OK")

    print("[2/2] Actualizando LLM outbound...")
    client.llm.update(
        llm_id=outbound_llm,
        model="claude-4.5-haiku",
        model_high_priority=True,
        general_prompt=outbound_prompt,
    )
    print("  OK")

    print("\nLatencia esperada: ~600-1100ms (antes ~1100-1900ms)")


if __name__ == "__main__":
    main()
