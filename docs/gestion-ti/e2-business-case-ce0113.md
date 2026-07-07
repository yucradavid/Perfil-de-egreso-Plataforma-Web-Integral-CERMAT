# Entregable 2: Business Case del Proyecto (CE0113)

## Portada

| Campo | Detalle |
|---|---|
| Título | Business case — Plataforma Web Integral de Gestión Académica CERMAT |
| Competencia | CE011 — Gestión e Innovación de TI (evidencia CE0113) |
| Integrantes | David Robert Yucra Mamani (líder), Gladys Rosaura Yana Pari, Denilson Leeke Mamani Flores, Cárdenas Vilca Rennzo |
| Ciclo académico | 9° ciclo |
| Fecha | 2026-07-06 |

## 2.1 Justificación del proyecto

**Problema que se resuelve:** procesos de matrícula, pagos, asistencia y comunicación con padres dispersos en canales manuales, generando duplicidad de datos, baja visibilidad operativa y demoras — ver [Diagnóstico Organizacional](e1-diagnostico-organizacional-ce0111.md#14-identificacion-del-problema).

**Objetivos del proyecto (SMART):**

| Objetivo | Específico | Medible | Alcanzable | Relevante | Con plazo |
|---|---|---|---|---|---|
| Centralizar matrícula, pagos y asistencia en una sola plataforma | Un único sistema para los 3 procesos | 21 colecciones de datos operativas documentadas ([resumen ejecutivo del sistema](../index.md#resumen-ejecutivo-del-sistema)) | Sí, ya implementado | Elimina la causa raíz del problema | Sistema en producción a la fecha de este documento |
| Habilitar portales diferenciados por rol | 4 portales (admin, docente, estudiante, auxiliar) + consulta pública para padres | Rutas protegidas verificables en el código | Sí, ya implementado | Reduce fricción y errores de acceso a información | Sistema en producción |
| Digitalizar la asistencia | Registro por código QR | Tokens y registros de asistencia (`attendanceTokens`, `attendanceLogs`) | Sí, ya implementado | Reduce el registro manual propenso a error | Sistema en producción |

**Beneficios esperados:** menos horas administrativas perdidas en tareas repetitivas, menor riesgo de error en cobros y matrícula, mayor confianza de los padres al tener un canal de consulta directo.

## 2.2 Análisis de alternativas

| Alternativa | Descripción | Costo relativo | Personalización | Control de datos | Tiempo de puesta en marcha |
|---|---|---|---|---|---|
| A — Continuar con procesos manuales/Excel | Statu quo | Bajo (aparente) | N/A | Total, pero disperso y sin trazabilidad | Inmediato, pero no resuelve el problema |
| B — Adoptar un ERP educativo SaaS de terceros | Sistema genérico pre-construido, pago por suscripción | Medio-alto (suscripción recurrente en dólares) | Baja — límites del proveedor | Bajo — datos alojados fuera del control de la institución | Rápido, pero con curva de adaptación a un flujo ajeno |
| **C — Plataforma propia a medida (elegida)** | Desarrollo propio sobre Firebase + capa complementaria Node.js/MySQL | Medio (inversión de desarrollo, sin licencia recurrente por usuario) | Total — se adapta exactamente al flujo real de CERMAT (ciclos, sedes, grupos, turnos) | Total — CERMAT es dueña de sus datos y reglas de acceso | Medio — requiere desarrollo, pero ya se completó y está en producción |

**Matriz comparativa (escala 1-5, mayor es mejor):**

| Criterio | A. Manual | B. SaaS de terceros | C. Plataforma propia |
|---|---|---|---|
| Costo total de propiedad a 3 años | 2 | 2 | 4 |
| Ajuste al flujo real de CERMAT (sedes, ciclos, turnos, roles) | 1 | 2 | 5 |
| Control y propiedad de los datos | 3 | 2 | 5 |
| Velocidad de evolución futura (nuevos módulos) | 1 | 2 | 4 |
| **Total** | **7** | **8** | **18** |

**Decisión:** se elige la alternativa C, ya construida y documentada en la línea CE02 de este perfil de egreso.

## 2.3 Evaluación de beneficios

- **Cuantificables:** reducción estimada de horas de trabajo administrativo semanal dedicadas a conciliar matrícula y pagos manualmente; reducción del riesgo de matrícula duplicada gracias a la deduplicación implementada en `enrollments` (ver evidencia en la línea CE02, [E4 — Calidad, Operación y Evolución](../e4-calidad-operacion-ce024.md)).
- **Cualitativos:** mejor percepción institucional frente a padres y postulantes; mayor confianza de dirección en los reportes; menor carga de estrés operativo en secretaría durante los picos de matrícula.
- **Indicadores de valor:** número de matrículas procesadas sin intervención manual, tiempo promedio entre pre-matrícula y aprobación, número de consultas de asistencia resueltas directamente por el padre sin llamar a la academia.

## 2.4 Estimación de costos

*(Cifras estimadas para fines de sustentación del proyecto; no sustituyen la contabilidad formal de la institución.)*

| Rubro | Estimado |
|---|---|
| Inversión inicial de desarrollo (equipo propio/reducido, todos los módulos documentados en CE02) | Costo de horas de desarrollo, sin licencias de software (stack de código abierto: React, Node.js, MySQL, Python). |
| Costos operativos recurrentes | Plan de Firebase según uso (Firestore/Storage/Auth), dominio y hosting de la SPA. |
| Costos de mantenimiento | Horas de soporte y evolución continua del sistema (nuevos módulos, correcciones, auditorías — ver historial de [`docs/FASE_*` y `docs/AUDITORIA_*`](../index.md#evidencia-tecnica-base)). |
| Costo de la capa local (infraestructura) | Servidor local, UPS y conectividad de respaldo — ver dimensionamiento en la línea CE03, [Diseño de Centro de Datos](../infraestructura/e3-diseno-centro-datos-ce0331.md#seccion-3-dimensionamiento-de-capacidad). |

## 2.5 Riesgos iniciales

| Riesgo | Impacto preliminar |
|---|---|
| Dependencia de un equipo técnico reducido para mantener y evolucionar el sistema | Medio-alto — mitigado documentando el sistema exhaustivamente (este perfil de egreso es, en sí mismo, parte de esa mitigación). |
| Cambios regulatorios de protección de datos de menores de edad | Medio — mitigado con las políticas de la línea CE03 ([Planificación de Seguridad](../infraestructura/e2-planificacion-seguridad-ce0321.md)). |
| Resistencia al cambio del personal acostumbrado a procesos manuales | Bajo-medio — mitigado por la simplicidad de los portales por rol. |

## Rúbricas

| Criterio | Excelente | Bueno | Regular | Deficiente |
|---|---|---|---|---|
| Análisis de alternativas | Analiza alternativas con matriz comparativa rigurosa y justificación sólida. | Compara alternativas con criterios definidos. | Presenta alternativas sin comparación estructurada. | No evalúa alternativas. |
| Evaluación económica | Presenta análisis financiero estructurado con indicadores cuantificados. | Estima costos y beneficios razonablemente. | Presenta costos generales sin sustento. | No presenta estimación financiera. |
| Identificación de riesgos | Analiza riesgos estratégicos con impacto y estrategias de mitigación. | Identifica riesgos con evaluación básica. | Enumera riesgos sin análisis. | No identifica riesgos relevantes. |
