# Entregable 6 (Semestre 2): Implementación y Control de Centro de Datos (CE0332-CE0333)

## Portada

| Campo | Detalle |
|---|---|
| Título | Implementación y control del centro de datos local — Plataforma CERMAT |
| Competencias | CE0332 (implementación de centro de datos), CE0333 (control y operación) |
| Semestre | 2 |
| Integrantes | David Robert Yucra Mamani (líder), Gladys Rosaura Yana Pari, Denilson Leeke Mamani Flores, Cárdenas Vilca Rennzo |
| Ciclo académico | 9° ciclo |
| Fecha | 2026-07-06 |

## Resumen ejecutivo

Sobre el diseño del [Entregable 3](e3-diseno-centro-datos-ce0331.md), este documento detalla qué servicios corren realmente en el servidor local, cómo se protege su almacenamiento, qué acuerdo de servicio (SLA) se propone, y los procedimientos operativos para mantenerlo funcionando de forma eficiente.

## Sección 1: Configuración de servidores y servicios

| Servicio de la plantilla oficial | ¿Aplica a la escala de CERMAT? | Decisión |
|---|---|---|
| Servidor físico/virtual | Sí | Un servidor físico (o mini-PC de gama servidor) corriendo los servicios en contenedores (ver [virtualización propuesta](e3-diseno-centro-datos-ce0331.md#seccion-4-incorporacion-de-virtualizacion-cloud-hibrido)). |
| Base de datos (BD) | Sí | MySQL — almacenamiento relacional complementario (reportes, sincronización). |
| Servicio Web/API | Sí | API Node.js + Express, que expone los datos de MySQL y recibe la sincronización desde la plataforma. |
| Servicio de analítica | Sí | Python + FastAPI, para alertas y tendencias sobre los datos sincronizados. |
| Active Directory (AD) | **No** | Una academia de este tamaño no gestiona un dominio Windows corporativo; los accesos de usuarios de la plataforma ya se resuelven con Firebase Authentication. Incluir AD sería sobre-ingeniería. |
| Servidor DNS propio | **No** | El dominio público de la plataforma se resuelve con el DNS del proveedor de hosting/registrador; no se justifica operar un servidor DNS local para una sede con ~15-20 equipos. |

*(Nota de honestidad académica: se documenta explícitamente por qué **no** se implementan AD/DNS locales, en vez de forzar componentes que no aportan valor a esta organización — ver principio "no se fuerza el uso de tecnologías específicas" de la guía oficial de evaluación.)*

## Sección 2: Implementación de almacenamiento y respaldos

- **RAID 1 (espejo)** en el disco SSD que aloja la base MySQL activa, para tolerar la falla de un disco sin pérdida de datos ni interrupción del servicio.
- **Política de respaldo (3-2-1)**, ejecutada automáticamente por PM2: backup diario de MySQL al HDD local (segunda copia) y sincronización semanal hacia almacenamiento externo/nube (tercera copia, fuera de la sede) — ver [Entregable 2](e2-planificacion-seguridad-ce0321.md#seccion-3-politicas-de-seguridad).
- **Verificación de restauración:** una vez al trimestre se restaura un backup en un entorno de prueba para confirmar que es realmente utilizable, no solo que "se generó".

## Sección 3: Definición de SLA y monitoreo

| Servicio | SLA propuesto | Herramienta de monitoreo |
|---|---|---|
| API local (sincronización) | 95% de disponibilidad mensual (la operación crítica de matrícula/pagos no depende de este servicio, ver plan de continuidad en [Entregable 5](e5-implementacion-monitoreo-etica-ce0322-ce0324.md#seccion-2-gestion-de-parches-y-planes-de-continuidad)) | PM2 monitoring + alertas por correo/WhatsApp al encargado de soporte |
| MySQL | Backup diario sin fallos, restauración verificada trimestralmente | Logs de PM2 + checklist trimestral |
| Red local (switch/router) | 99% de disponibilidad mensual | SNMP (ver [Entregable 4](e4-implementacion-testing-red-ce0312-ce0313.md#seccion-4-protocolo-de-pruebas-y-monitoreo)) |

## Sección 4: Procedimientos operativos y eficiencia

**Checklist de mantenimiento mensual:**

- [ ] Verificar espacio libre en disco del servidor (alerta si < 20%).
- [ ] Confirmar que los backups de los últimos 30 días existen y tienen tamaño consistente.
- [ ] Revisar temperatura del rack y estado del UPS (autonomía de batería).
- [ ] Revisar `npm audit` / actualizaciones de seguridad pendientes.
- [ ] Confirmar que el failover de internet (ISP1 → ISP2) sigue funcionando (prueba controlada).

**Eficiencia energética:** se elige hardware de bajo consumo (mini-servidor, no un rack de gran escala) acorde al dimensionamiento del [Entregable 3](e3-diseno-centro-datos-ce0331.md#seccion-3-dimensionamiento-de-capacidad), evitando sobredimensionar equipos que consuman energía innecesaria para la carga real de la sede.

## Anexos

- Checklist de mantenimiento: ver sección 4.
- Métricas de disponibilidad — *a completar con datos reales una vez en operación*.

## Rúbrica de evaluación

*(7 criterios — máximo 28 puntos, según guía oficial de evaluación de perfil de egreso)*

| Criterio | Excelente (4) | Bueno (3) | Regular (2) | Deficiente |
|---|---|---|---|---|
| Configuración de Servidores Físicos/Virtuales | Funcional y optimizada. | Funcional básica. | Parcial. | No configurado. |
| Implementación de Servicios (AD, DNS, etc.) | Integrados perfectamente **o justificadamente excluidos** según la escala real de la organización. | Integrados adecuadamente. | Básicos. | Ausente sin justificación. |
| Configuración de Almacenamiento (RAID, SAN) | Avanzada con redundancia. | Básica. | Parcial. | Incorrecta. |
| Implementación de Políticas de Respaldo | Automatizadas y probadas. | Manuales, probadas. | Básicas. | Sin políticas. |
| Definición de SLA | Detallados y medibles. | Básicos. | Vagos. | Ausente. |
| Implementación de Monitoreo | Herramientas avanzadas. | Básicas. | Mínimas. | Sin monitoreo. |
| Documentación de Procedimientos y Eficiencia | Profesional, con análisis energético. | Adecuada. | Básica. | Desorganizada. |
