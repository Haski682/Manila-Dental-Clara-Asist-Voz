"""Configura SIP trunk en Twilio + importa numero a Retell automaticamente.

Pasos:
1. Verifica que la cuenta de Twilio no sea trial (SIP trunking requiere upgrade)
2. Crea SIP Trunk en Twilio (friendly_name desde el config)
3. Genera username/password, crea Credential List, asocia al trunk
4. Setea Termination URI (domain_name) - reintenta con sufijo si hay conflicto
5. Asocia el phone number al trunk
6. Llama a Retell phone_number.import_ con termination URI + auth
7. Setea el Origination URI del trunk con la SIP URL que Retell entrega
8. Guarda username/password en .env (nunca los imprime en pantalla)
"""
import os
import re
import secrets
import sys
from pathlib import Path
from unicodedata import normalize

from dotenv import load_dotenv
from retell import Retell
from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_ROOT / ".env"
sys.path.insert(0, str(PROJECT_ROOT))
load_dotenv(ENV_PATH)

from app.config import AGENT, BUSINESS  # noqa: E402


def _slug(text: str, max_len: int = 30) -> str:
    """Convierte un nombre en slug seguro para SIP/DNS."""
    s = normalize("NFKD", text).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:max_len] or "callia"


_business_slug = _slug(BUSINESS.get("name", ""))
_agent_slug = _slug(AGENT.get("name", "daniela"))

SIP_USERNAME = f"{_agent_slug}_{_business_slug}" if _business_slug else _agent_slug
SIP_PASSWORD = secrets.token_urlsafe(20)
TRUNK_FRIENDLY = f"{BUSINESS.get('name', 'Callia')} {AGENT.get('name', 'Daniela')}".strip()
DOMAIN_BASE = _slug(f"{_business_slug}-{_agent_slug}".strip("-")) or "callia-agent"
CREDENTIAL_LIST_NAME = f"{BUSINESS.get('name', 'Callia')} Retell"


def twilio_client() -> Client:
    return Client(os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])


def check_account_upgraded(client: Client):
    acc = client.api.accounts(os.environ["TWILIO_ACCOUNT_SID"]).fetch()
    print(f"  Cuenta: {acc.friendly_name} | Status: {acc.status} | Type: {acc.type}")
    if acc.type and acc.type.lower() == "trial":
        print("  WARNING: Cuenta trial. SIP trunking requiere cuenta upgradeada.")


def create_or_get_trunk(client: Client):
    for t in client.trunking.v1.trunks.list(limit=50):
        if t.friendly_name == TRUNK_FRIENDLY:
            print(f"  Trunk ya existe: {t.sid}")
            return t
    t = client.trunking.v1.trunks.create(friendly_name=TRUNK_FRIENDLY)
    print(f"  Trunk creado: {t.sid}")
    return t


def set_domain_name(client: Client, trunk_sid: str) -> str:
    for suffix in ["", "-01", "-02", "-03", "-04"]:
        domain = f"{DOMAIN_BASE}{suffix}.pstn.twilio.com"
        try:
            client.trunking.v1.trunks(trunk_sid).update(domain_name=domain)
            print(f"  Termination URI: {domain}")
            return domain
        except TwilioRestException as e:
            if "already" in str(e).lower() or "taken" in str(e).lower() or e.status == 400:
                continue
            raise
    raise RuntimeError("No se pudo asignar un domain_name unico")


def create_credential_list(client: Client) -> str:
    for cl in client.sip.credential_lists.list(limit=50):
        if cl.friendly_name == CREDENTIAL_LIST_NAME:
            print(f"  Credential list ya existe: {cl.sid}")
            return cl.sid
    cl = client.sip.credential_lists.create(friendly_name=CREDENTIAL_LIST_NAME)
    client.sip.credential_lists(cl.sid).credentials.create(username=SIP_USERNAME, password=SIP_PASSWORD)
    print(f"  Credential list creada: {cl.sid}")
    return cl.sid


def attach_credentials_to_trunk(client: Client, trunk_sid: str, cl_sid: str):
    existing = client.trunking.v1.trunks(trunk_sid).credentials_lists.list()
    if any(c.sid == cl_sid for c in existing):
        print(f"  Credential list ya asociada al trunk")
        return
    client.trunking.v1.trunks(trunk_sid).credentials_lists.create(credential_list_sid=cl_sid)
    print(f"  Credential list asociada al trunk")


def attach_phone_to_trunk(client: Client, trunk_sid: str, phone: str):
    numbers = client.incoming_phone_numbers.list(phone_number=phone)
    if not numbers:
        raise RuntimeError(f"No encontre el numero {phone} en tu cuenta Twilio")
    number = numbers[0]

    existing = client.trunking.v1.trunks(trunk_sid).phone_numbers.list()
    if any(n.sid == number.sid for n in existing):
        print(f"  Numero {phone} ya asociado al trunk")
        return
    client.trunking.v1.trunks(trunk_sid).phone_numbers.create(phone_number_sid=number.sid)
    print(f"  Numero {phone} asociado al trunk")


def retell_import(phone: str, termination_uri: str, inbound_agent: str, outbound_agent: str):
    client = Retell(api_key=os.environ["RETELL_API_KEY"])
    for p in client.phone_number.list():
        if p.phone_number == phone:
            print(f"  Numero ya importado en Retell")
            return p
    nickname = f"{BUSINESS.get('name', 'Callia')} - {AGENT.get('name', 'Daniela')}"
    imported = client.phone_number.import_(
        phone_number=phone,
        termination_uri=termination_uri,
        sip_trunk_auth_username=SIP_USERNAME,
        sip_trunk_auth_password=SIP_PASSWORD,
        inbound_agent_id=inbound_agent,
        outbound_agent_id=outbound_agent,
        nickname=nickname,
    )
    print(f"  Numero importado en Retell")
    return imported


def set_origination(client: Client, trunk_sid: str):
    retell_sip = "sip:5t4n6j0wnrl.sip.livekit.cloud"

    existing = client.trunking.v1.trunks(trunk_sid).origination_urls.list()
    for url in existing:
        if "livekit.cloud" in (url.sip_url or ""):
            print(f"  Origination URI Retell ya configurada")
            return
    client.trunking.v1.trunks(trunk_sid).origination_urls.create(
        friendly_name="Retell AI",
        sip_url=retell_sip,
        priority=1,
        weight=1,
        enabled=True,
    )
    print(f"  Origination URI configurada: {retell_sip}")


def save_to_env(termination_uri: str):
    additions = {
        "SIP_TERMINATION_URI": termination_uri,
        "SIP_AUTH_USERNAME": SIP_USERNAME,
        "SIP_AUTH_PASSWORD": SIP_PASSWORD,
    }
    existing = ENV_PATH.read_text() if ENV_PATH.exists() else ""
    keys = {line.split("=", 1)[0] for line in existing.splitlines() if "=" in line and not line.strip().startswith("#")}
    to_add = [(k, v) for k, v in additions.items() if k not in keys]
    if not to_add:
        return
    with open(ENV_PATH, "a", encoding="utf-8") as f:
        if existing and not existing.endswith("\n"):
            f.write("\n")
        f.write("\n# --- SIP Trunk (generados por setup_sip.py) ---\n")
        for k, v in to_add:
            f.write(f"{k}={v}\n")
    print(f"  .env actualizado con {len(to_add)} variables SIP")


def main():
    label = f"{BUSINESS.get('name', 'Callia')} ({AGENT.get('name', 'Daniela')})"
    print("=" * 50)
    print(f"  SIP Trunk Setup - {label}")
    print("=" * 50)

    phone = os.environ["TWILIO_PHONE_NUMBER"]
    inbound_agent = os.environ["RETELL_INBOUND_AGENT_ID"]
    outbound_agent = os.environ["RETELL_OUTBOUND_AGENT_ID"]

    tw = twilio_client()

    print("\n[1/7] Verificando cuenta Twilio...")
    check_account_upgraded(tw)

    print("\n[2/7] Creando SIP Trunk en Twilio...")
    trunk = create_or_get_trunk(tw)

    print("\n[3/7] Asignando Termination URI...")
    termination = set_domain_name(tw, trunk.sid)

    print("\n[4/7] Creando Credential List + asociando al trunk...")
    cl_sid = create_credential_list(tw)
    attach_credentials_to_trunk(tw, trunk.sid, cl_sid)

    print(f"\n[5/7] Asociando numero {phone} al trunk...")
    attach_phone_to_trunk(tw, trunk.sid, phone)

    print(f"\n[6/7] Importando numero en Retell...")
    retell_import(phone, termination, inbound_agent, outbound_agent)

    print(f"\n[7/7] Configurando Origination URI (Retell SIP)...")
    set_origination(tw, trunk.sid)

    print("\n[extra] Guardando credenciales SIP en .env...")
    save_to_env(termination)

    print("\n" + "=" * 50)
    print("  SIP TRUNK LISTO")
    print("=" * 50)
    print(f"""
  Trunk SID:       {trunk.sid}
  Termination URI: {termination}
  Numero:          {phone}
  Inbound agent:   {inbound_agent}
  Outbound agent:  {outbound_agent}

  Siguiente: llama al numero {phone} para probar a {AGENT.get('name', 'Daniela')}.
""")


if __name__ == "__main__":
    main()
