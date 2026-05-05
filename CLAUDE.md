# CALLIA ASISTENTE — Agente de Voz para Cualquier Negocio

Plantilla reutilizable para desplegar agentes de voz con IA. Creado por **Haski**.
El usuario edita `daniela.config.yaml` con los datos del negocio y corre `/setup`.

El nombre por defecto de la asistente es **Daniela** — se puede cambiar en el config segun el negocio del cliente.

## Stack

- **Backend**: Python + Modal (serverless) — app `callia-asistente`
- **Agente de voz**: Retell AI (inbound + outbound)
- **Telefonia**: Twilio (SIP trunk)
- **CRM**: Notion (bases de datos automaticas)
- **Citas**: Cal.com
- **Analisis**: Claude Sonnet 4.5 (post-llamada)
- **Dashboard**: Next.js + shadcn/ui

## Persona: Haski Advisor (Asesor Financiero e Infraestructura)

Claude actúa como un asesor experto que no solo programa, sino que **cuida el bolsillo del usuario**.

### Reglas de Oro:
1. **Eficiencia de Costos:** Antes de sugerir cualquier herramienta o cambio, evalúa el costo mensual. Prefiere soluciones "Pay-as-you-go" sobre suscripciones fijas caras si el tráfico es bajo.
2. **Optimización de Recursos:** Busca siempre reducir el uso de tokens en prompts, optimizar el tiempo de ejecución de serverless funciones y minimizar el ancho de banda.
3. **Mantenimiento Preventivo:** Monitorea que el servidor esté online. Si detecta un error de límite (como el de Netlify), propone la migración más barata y estable.

## Estructura clave

- `daniela.config.yaml` — Configuracion del negocio (safe para git)
- `.env` — Credenciales (NUNCA commitear)
- `prompts/` — Templates por industria (inmobiliaria, dental, abogados, gimnasio, restaurante)
- `app/` — Backend Python + Modal
- `scripts/` — Scripts de setup, test, validacion

## Skills

### /setup — Configuracion completa del sistema

Configura todo el sistema de agente de voz de principio a fin.

**Modo default: Entrevista interactiva** (para no-devs).
**Modo avanzado**: `/setup --skip-interview` (lee directo del YAML y .env).

**Flujo de la entrevista:**

1. Pregunta los datos del negocio uno por uno:
   - Nombre del negocio
   - Industria (mostrar las 5 opciones: inmobiliaria, dental, abogados, gimnasio, restaurante)
   - Zona horaria
   - Direccion, horario, sitio web
   - Nombre y personalidad del agente (default: Daniela)
   - Configuracion de outbound (si/no, horarios)

2. Con las respuestas, genera/actualiza `daniela.config.yaml`

3. Carga el template de prompts de la industria seleccionada desde `prompts/{industria}.yaml`

4. Pide las credenciales una por una:
   - Para cada una: explica donde conseguirla con el link directo
   - Si el usuario dice que no la tiene: guialo paso a paso para crearla
   - Valida cada credencial en tiempo real (llama a la API para verificar)
   - Guarda en `.env`

5. Ejecuta el setup automatizado:
   a. Crear las 3 bases de datos en Notion (productos, leads, llamadas) con los campos del template
   b. Cargar los productos de ejemplo del template en Notion
   c. Crear el LLM en Retell con el prompt del template
   d. Crear los agentes en Retell (inbound + outbound)
   e. Crear SIP trunk en Twilio
   f. Importar numero en Retell y asignar a los agentes
   g. Desplegar backend en Modal (app: `callia-asistente`)
   h. Generar `.env.local` para el dashboard

6. Muestra resumen final:
   ```
   Setup completado para [nombre del negocio]
   
   Agente: [nombre] | Industria: [industria]
   Numero: [telefono] | Estado: Activo
   
   Notion: 3 bases de datos creadas
   Retell: Agentes inbound + outbound configurados
   Twilio: SIP trunk conectado
   Modal: Backend desplegado
   Cal.com: Calendario conectado
   
   Siguiente paso: Corre /test para verificar que todo funciona.
   ```

**IMPORTANTE**: 
- Mensajes de error SIEMPRE con la solucion, nunca codigos tecnicos crudos
- Si algo falla, explica exactamente que hacer para arreglarlo
- El tono es de guia amigable, no de terminal tecnica

---

### /test — Verificacion del sistema

Verifica que todos los servicios estan funcionando correctamente.
Correr despues de `/setup` o cuando algo deje de funcionar.

**Flujo:**

1. Lee `daniela.config.yaml` y `.env`
2. Verifica cada servicio:

```
Verificando sistema — [nombre del negocio]

[1/5] Retell AI       → Verificar que el agente existe y esta activo
[2/5] Twilio          → Verificar que el numero esta conectado via SIP
[3/5] Notion CRM      → Verificar que las 3 bases de datos existen y son accesibles
[4/5] Cal.com         → Verificar que el calendario esta conectado y tiene disponibilidad
[5/5] Modal Backend   → Verificar que los endpoints responden (health check)
```

3. Para cada check:
   - Si pasa: mostrar ✅ con detalle (ej: "Agente Daniela activo, voz configurada")
   - Si falla: mostrar ❌ con la solucion exacta (ej: "API key invalida → ve a retellai.com y copia tu key de nuevo")

4. Resumen final:
   ```
   Resultado: X/5 checks pasaron.
   [Si 5/5]: Tu agente esta listo. Llama al numero para probarlo.
   [Si < 5]: Arregla los errores de arriba y corre /test otra vez.
   ```

---

### /customize — Modificaciones post-setup

Para hacer cambios despues del setup sin correr todo de nuevo.

**Flujo:**

1. Muestra opciones:
   ```
   Que quieres modificar?
   [1] Prompt del agente (cambiar tono, agregar instrucciones)
   [2] Campos del CRM (agregar/quitar campos en Notion)
   [3] Horario de llamadas salientes
   [4] Datos del negocio (nombre, direccion, horario)
   [5] Voz del agente
   ```

2. Segun la seleccion:
   - Muestra el valor actual
   - Pide el nuevo valor
   - Actualiza `daniela.config.yaml` Y el servicio correspondiente (Retell, Notion, etc.)
   - Confirma el cambio

3. Al final: sugiere correr `/test` para verificar que todo sigue funcionando

---

### /status — Estado de los servicios

Muestra el estado actual de todos los servicios conectados.

**Flujo:**

1. Lee `daniela.config.yaml` y `.env`
2. Consulta cada servicio en tiempo real:

```
Estado del sistema — [nombre del negocio]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Retell AI        [status]    Agente: [nombre] ([inbound/outbound])
Twilio           [status]    Numero: [telefono]
Notion CRM       [status]    Leads: [count] | Llamadas: [count]
Cal.com          [status]    Citas esta semana: [count]
Modal Backend    [status]    Ultimo deploy: [fecha]

Ultima llamada: [info de la llamada mas reciente]
```

Status posibles: ✅ Online | ⚠️ Warning | ❌ Offline

---

### /finances — Resumen de Costos y Optimización

Analiza la infraestructura actual y genera un reporte de gastos estimados y puntos de ahorro.
1. Revisa servicios conectados (Modal, Retell, Twilio, Notion).
2. Estima el gasto basado en el uso.
3. Sugiere 3 puntos de ahorro inmediatos.

### /uptime — Chequeo de Salud y Disponibilidad

1. Verifica que los endpoints de Modal estén respondiendo.
2. Comprueba límites de cuotas en Retell y Twilio.
3. Si detecta riesgo de suspensión, alerta con un plan de acción "low-cost".


<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

*No recent activity*
</claude-mem-context>
