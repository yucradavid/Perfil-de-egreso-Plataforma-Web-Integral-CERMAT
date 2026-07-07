# Entregable 5: Propuesta de Solución TIC Integrada al Ecosistema de Sistemas de Información (CE0141-CE0145)

## Portada

| Campo | Detalle |
|---|---|
| Título | Solución TIC integrada — Plataforma CERMAT en el ecosistema de SI de la institución |
| Competencia | CE014 — Gestión de Sistemas de Información |
| Integrantes | David Robert Yucra Mamani (líder), Gladys Rosaura Yana Pari, Denilson Leeke Mamani Flores, Cárdenas Vilca Rennzo |
| Ciclo académico | 9° ciclo |
| Fecha | 2026-07-06 |

## 5.1 Arquitectura de la solución

Ver arquitectura completa y justificada en el [Brief EPE — Enfoque de solución](../brief-epe.md#7-enfoque-de-solucion) y en el [Entregable 1 de CE02 (Definición del Sistema)](../e1-definicion-sistema-ce021.md). En resumen: SPA React/TypeScript → Firebase (Auth, Firestore, Storage) como capa cloud operativa → API Node.js/Express + MySQL como capa local complementaria → Python/FastAPI para analítica → PM2 y backups administrando la infraestructura local (detallada en la línea CE03).

## 5.2 Ecosistema de sistemas de información de la organización

**Mapa de sistemas actuales:** a diferencia de una empresa con múltiples sistemas heredados (contabilidad, ERP, CRM independientes), Academia La Prepa Cermat **no operaba ningún sistema de información propio antes de esta plataforma** — su "ecosistema" previo eran hojas de cálculo, cuadernos y mensajería informal (ver [Diagnóstico Organizacional, sección 1.3](e1-diagnostico-organizacional-ce0111.md#13-diagnostico-digital-ti)). Esto significa que la Plataforma CERMAT **es**, hoy, la totalidad del ecosistema formal de sistemas de información de la institución — no un componente más que deba integrarse con sistemas externos preexistentes.

**Integración propuesta e interoperabilidad:** dentro de la propia plataforma, la integración ocurre entre sus capas (cloud ↔ local) mediante el servicio de sincronización (`syncService`, fire-and-forget) descrito en el Brief EPE. No existen, a la fecha, integraciones con sistemas de terceros (bancos, gobierno, ERP externos) — declarado explícitamente como **fuera de alcance** en el Brief EPE, sección "No incluye".

## 5.3 Seguridad y gobernanza

- **Gestión de accesos:** Firebase Authentication + reglas de Firestore por rol y colección (ver línea CE03, [Planificación de Seguridad](../infraestructura/e2-planificacion-seguridad-ce0321.md)).
- **Protección de datos:** alineada a la Ley N° 29733 de Protección de Datos Personales del Perú, dado que el sistema gestiona datos de menores de edad (alumnos) y de sus padres.
- **Cumplimiento normativo:** las reglas de acceso y las políticas de retención de datos se documentan y auditan como parte de la evolución continua del sistema (ver [E4 — Calidad, Operación y Evolución, CE024](../e4-calidad-operacion-ce024.md)).

## 5.4 Escalabilidad y sostenibilidad

- **Capacidad de crecimiento:** la arquitectura por dominios (`src/features/*`) permite agregar nuevos módulos sin reescribir los existentes — evidencia: el sistema ya creció de 16 a 21 colecciones de Firestore documentadas entre el 22-jun-2026 y el 05-jul-2026 (ver [índice del perfil de egreso](../index.md#resumen-ejecutivo-del-sistema)), sin interrumpir la operación.
- **Costos futuros:** principalmente variables (uso de Firebase), no licencias fijas por usuario — ver [Business Case, sección 2.4](e2-business-case-ce0113.md#24-estimacion-de-costos).
- **Evolución tecnológica:** el sistema documenta explícitamente sus brechas y deuda técnica conocida (66 advertencias de TypeScript preexistentes, catalogadas y monitoreadas) en vez de ocultarlas, como evidencia de gobernanza técnica madura — ver [E4 — Calidad, Operación y Evolución](../e4-calidad-operacion-ce024.md).

## Rúbricas

| Criterio | Excelente | Bueno | Regular | Deficiente |
|---|---|---|---|---|
| Diseño de arquitectura | Arquitectura estructurada, integrada y alineada al ecosistema SI. | Arquitectura coherente con integración definida. | Arquitectura básica sin integración clara. | No presenta arquitectura clara. |
| Integración con sistemas existentes | Diseña integración completa considerando interoperabilidad y seguridad. | Define integración básica con sistemas existentes. | Integración mencionada sin detalle técnico. | No considera integración. |
| Sustento técnico y escalabilidad | Justifica solución considerando seguridad, escalabilidad y sostenibilidad. | Sustenta técnicamente la solución. | Justificación limitada. | Sin justificación técnica. |
