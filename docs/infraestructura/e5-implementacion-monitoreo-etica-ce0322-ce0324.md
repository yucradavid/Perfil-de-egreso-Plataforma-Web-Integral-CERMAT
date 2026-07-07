# Entregable 5 (Semestre 2): Implementación, Monitoreo y Ética de Seguridad (CE0322-CE0324)

## Portada

| Campo | Detalle |
|---|---|
| Título | Implementación de controles de seguridad, monitoreo y ética — Plataforma CERMAT |
| Competencias | CE0322 (implementación de controles), CE0323 (monitoreo y mejora), CE0324 (ética ACM) |
| Semestre | 2 |
| Integrantes | David Robert Yucra Mamani (líder), Gladys Rosaura Yana Pari, Denilson Leeke Mamani Flores, Cárdenas Vilca Rennzo |
| Ciclo académico | 9° ciclo |
| Fecha | 2026-07-06 |

## Resumen ejecutivo

Este documento distingue explícitamente entre los controles de seguridad **ya implementados** en la Plataforma CERMAT (autenticación e identidad vía Firebase, reglas de acceso por rol en Firestore, validación de datos con Zod) y los controles de **infraestructura local** planificados en el [Entregable 2](e2-planificacion-seguridad-ce0321.md) que quedan como plan de implementación (firewall perimetral, backups 3-2-1, monitoreo SNMP). Cierra con el análisis ético ACM del proyecto.

## Sección 1: Implementación de controles técnicos

| Control | Estado | Evidencia |
|---|---|---|
| IAM (gestión de identidad y acceso) | **Implementado** | Firebase Authentication asigna identidad; las reglas de Firestore (`firestore.rules`) restringen cada colección por rol (admin, docente, estudiante, auxiliar). |
| Mínimo privilegio a nivel de aplicación | **Implementado** | Cada portal (admin/docente/estudiante/auxiliar) solo expone las rutas y datos de su rol (ver [Brief EPE](../brief-epe.md#3-contexto-y-stakeholders)). |
| Cifrado en tránsito | **Implementado** | Firebase y el hosting de la SPA operan sobre HTTPS/TLS de forma nativa. |
| Firewall perimetral de la sede (VLAN, ACL) | Planificado | Ver configuración propuesta en el [Entregable 4](e4-implementacion-testing-red-ce0312-ce0313.md). |
| Backups locales 3-2-1 | Parcialmente implementado | PM2 ya administra backups automáticos de MySQL (ver [Brief EPE](../brief-epe.md#7-enfoque-de-solucion)); falta formalizar la copia externa/fuera de sede de la política 3-2-1. |

## Sección 2: Gestión de parches y planes de continuidad

- **Gestión de parches:** actualizaciones de dependencias del backend (Node.js, paquetes npm) y del sistema operativo del servidor local se revisan mensualmente; las de seguridad crítica, de forma inmediata al ser reportadas.
- **Plan de continuidad:** ante una falla del servidor local, la plataforma sigue operando con normalidad para matrícula, pagos y asistencia porque esos flujos dependen de Firebase (cloud); solo se pausan temporalmente la sincronización a MySQL y los reportes de analítica hasta restaurar el servidor o el contenedor correspondiente (ver [virtualización propuesta](e3-diseno-centro-datos-ce0331.md#seccion-4-incorporacion-de-virtualizacion-cloud-hibrido)).

## Sección 3: Monitoreo y mejora

**KPIs de seguridad propuestos:**

| KPI | Meta | Frecuencia de revisión |
|---|---|---|
| Tiempo de disponibilidad del servidor local | ≥ 99% mensual | Mensual |
| Backups completados sin error | 100% | Diaria (automatizado por PM2) |
| Cuentas admin con MFA activo | 100% | Trimestral |
| Incidentes de seguridad reportados y cerrados | 100% cerrados en ≤ 7 días | Por incidente |

- **Registro y auditoría:** los cambios a `firestore.rules` y a los roles de usuario quedan documentados en el historial de control de versiones del repositorio (evidencia también citada en [E4 — Calidad, Operación y Evolución](../e4-calidad-operacion-ce024.md)).
- **Evaluación de vulnerabilidades:** revisión periódica de dependencias del proyecto (`npm audit` sobre el frontend/backend) y verificación manual de las reglas de Firestore ante cada cambio de modelo de datos.

## Sección 4: Ética ACM

- **Confidencialidad:** los datos de alumnos, padres y docentes solo se usan para los fines académicos y administrativos declarados; el equipo de desarrollo no accede a datos de producción salvo para soporte autorizado.
- **Cumplimiento normativo:** alineado a la Ley N° 29733 de Protección de Datos Personales del Perú (ver también [Entregable 2](e2-planificacion-seguridad-ce0321.md#seccion-3-politicas-de-seguridad)).
- **Impacto social y legal:** un fallo de seguridad en este sistema afectaría a menores de edad y a sus familias; por eso las decisiones técnicas (segmentación de red, mínimo privilegio, backups) se priorizan explícitamente en función de ese impacto, no solo del costo o la comodidad de desarrollo.

## Anexos

- Configuraciones y reglas: ver `firestore.rules` del repositorio y sección 1 del [Entregable 4](e4-implementacion-testing-red-ce0312-ce0313.md).
- Resultados de `npm audit` — *pendiente de adjuntar como evidencia continua*.

## Rúbrica de evaluación

*(8 criterios — máximo 32 puntos, según guía oficial de evaluación de perfil de egreso)*

| Criterio | Excelente (4) | Bueno (3) | Regular (2) | Deficiente |
|---|---|---|---|---|
| Implementación de Controles Técnicos (IAM, Cifrado) | Completos y probados. | Funcionales, probados parcialmente. | Básicos. | No implementados. |
| Aplicación de Mínimo Privilegio | Integrada en todos los aspectos. | Aplicada en principales. | Parcial. | Ausente. |
| Gestión de Parches y Actualizaciones | Procedimientos automatizados. | Manuales, documentados. | Básicos. | Sin gestión. |
| Implementación de Planes de Continuidad | Detallados con simulaciones. | Básicos, sin simulaciones. | Parciales. | Ausente. |
| Definición de KPIs de Seguridad | Cuantitativos y relevantes. | Básicos. | Vagos. | Sin KPIs. |
| Implementación de Registro y Auditoría | Avanzada con herramientas. | Básica. | Mínima. | Ausente. |
| Evaluación de Vulnerabilidades y Mejoras | Análisis profundo con propuestas. | Análisis básico. | Superficial. | No evaluado. |
| Integración Ética ACM | Análisis exhaustivo de impactos. | Mencionada con ejemplos. | Básica. | Ignorada. |
