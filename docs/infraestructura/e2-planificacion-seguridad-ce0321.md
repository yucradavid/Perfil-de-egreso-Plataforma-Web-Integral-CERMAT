# Entregable 2: Planificación de Seguridad (CE0321)

## Portada

| Campo | Detalle |
|---|---|
| Título | Planificación de seguridad de la información — Plataforma CERMAT |
| Competencia | CE032 — Gestión de la Seguridad de la Información |
| Semestre | 1 |
| Fecha | 2026-07-06 |

## Resumen ejecutivo

Este documento identifica los activos críticos de la Plataforma CERMAT (datos de alumnos y padres, pagos, credenciales administrativas y el servidor local), analiza sus riesgos bajo el enfoque ISO 27005/NIST, define políticas de seguridad concretas y asigna roles y responsabilidades. Se apoya en dos controles que **ya existen implementados en el sistema** (reglas de seguridad de Firestore por rol, y validación de esquemas con Zod) y los complementa con controles de infraestructura local que aún son diseño/plan.

## Sección 1: Identificación de activos críticos

| Activo | Clasificación | Por qué es crítico |
|---|---|---|
| Datos de alumnos y padres (`users`, `enrollments`) | Dato personal — confidencialidad alta | Contiene nombre, teléfono, email y, para menores de edad, datos de matrícula y asistencia. Sujeto a la Ley N° 29733 de Protección de Datos Personales del Perú. |
| Datos de pagos (`payments`) | Dato financiero — confidencialidad alta, integridad crítica | Sustenta la cobranza real de la academia; un error o acceso indebido afecta directamente los ingresos. |
| Credenciales de administradores (Firebase Auth) | Credencial — confidencialidad crítica | Un admin comprometido puede alterar matrículas, pagos o eliminar contenido publicado. |
| Servidor local (API + MySQL + PM2) | Infraestructura — disponibilidad e integridad altas | Sostiene la sincronización, reportes y continuidad operativa (ver [Brief EPE](../brief-epe.md#7-enfoque-de-solucion)). |
| Backups de MySQL | Respaldo — disponibilidad crítica | Última línea de defensa ante pérdida de datos locales. |
| Reglas de seguridad de Firestore (`firestore.rules`) | Configuración — integridad crítica | Es el control de acceso real a toda la base de datos operativa; un cambio incorrecto expone o bloquea datos de todos los roles. |

## Sección 2: Análisis de riesgos (ISO 27005 / NIST)

| Amenaza | Vulnerabilidad | Impacto | Probabilidad | Riesgo |
|---|---|---|---|---|
| Phishing a una cuenta de administrador | Sin autenticación multifactor (MFA) obligatoria | Alto (acceso total al panel admin) | Media | Alto |
| Acceso indebido a datos de alumnos/pagos por regla de Firestore mal configurada | Cambios a `firestore.rules` sin revisión ni pruebas | Alto | Baja-media | Medio-alto |
| Pérdida de backups locales (falla de disco, ransomware) | Backups solo en el mismo servidor, sin copia externa | Alto (pérdida de continuidad operativa/reportes) | Media | Alto |
| Corte eléctrico prolongado en la sede | Sin generador, solo UPS de autonomía limitada | Medio (interrupción temporal del servidor local; Firebase sigue operando en la nube) | Media | Medio |
| Acceso físico no autorizado al rack/servidor | Cuarto de equipos sin control de acceso (ver [Diseño de Centro de Datos](e3-diseno-centro-datos-ce0331.md)) | Alto | Baja | Medio |
| Dispositivo de Wi-Fi de invitados intentando alcanzar la VLAN administrativa | Segmentación de red mal aplicada | Alto | Baja (mitigado por diseño de VLAN, ver [Diseño de Red](e1-diseno-red-ce0311.md)) | Bajo-medio |

## Sección 3: Políticas de seguridad

1. **Control de acceso y mínimo privilegio.** Cada rol (admin, docente, estudiante, auxiliar, padre) solo accede a lo que su función requiere, reforzado en dos capas: reglas de Firestore por colección/rol (ya implementadas) y, a nivel de red, segmentación por VLAN (ver Entregable 1).
2. **Autenticación reforzada para administradores.** Se exige contraseña robusta y se recomienda habilitar MFA en las cuentas de Firebase Authentication con rol admin, dado que concentran el mayor impacto ante compromiso.
3. **Backups con regla 3-2-1.** Al menos 3 copias de los datos críticos (MySQL local), en 2 medios distintos (disco local + almacenamiento externo/nube), con 1 copia fuera de la sede física, ejecutadas automáticamente vía PM2 y verificadas periódicamente.
4. **Protección de datos personales.** Los datos de alumnos y padres solo se usan para los fines académicos y administrativos declarados en el Brief EPE; no se comparten con terceros; se conservan mientras el alumno/apoderado mantenga vínculo con la institución.
5. **Gestión de cambios sobre reglas de seguridad.** Todo cambio a `firestore.rules` se prueba antes de publicarse (ver evidencia de auditoría de reglas en [E4 — Calidad, Operación y Evolución](../e4-calidad-operacion-ce024.md)).
6. **Uso aceptable de la red de invitados.** La VLAN de Wi-Fi público (invitados/padres en sede) no tiene visibilidad de ningún equipo administrativo ni del servidor local.

## Sección 4: Roles y responsabilidades

| Rol | Responsabilidad | RACI |
|---|---|---|
| Dirección CERMAT | Aprueba políticas de seguridad y prioriza inversión en controles. | Accountable |
| Encargado de soporte/TI de la sede | Administra el router/firewall, el switch, el rack y ejecuta los backups. | Responsible |
| Equipo de desarrollo de la plataforma | Mantiene las reglas de Firestore, la validación de datos y la auditoría técnica. | Responsible / Consulted |
| Administradores del sistema (usuarios) | Cumplen la política de contraseñas y reportan incidentes. | Informed / Responsible (de su propia cuenta) |
| Docentes, auxiliares, padres | Usan el sistema dentro de los permisos de su rol. | Informed |

## Anexos

- Matriz de riesgos completa: ver sección 2.
- Referencias a estándares: ISO 27005, NIST SP 800-30 (análisis de riesgos), Ley N° 29733 (protección de datos personales, Perú).

## Rúbrica de evaluación

*(5 criterios — máximo 20 puntos, según guía oficial de evaluación de perfil de egreso)*

| Criterio | Excelente (4) | Bueno (3) | Regular (2) |
|---|---|---|---|
| Identificación de Activos Críticos | Exhaustiva, con clasificación y justificación detallada. | Cubre lo principal, pero falta detalle. | Parcial, omite activos clave. |
| Análisis de Riesgos (ISO 27005/NIST) | Matriz completa con cálculos cuantitativos/cualitativos. | Matriz básica, con análisis cualitativo. | Matriz simple, con errores. |
| Definición de Políticas de Seguridad | Políticas claras, alineadas a estándares y aplicables. | Políticas adecuadas, pero genéricas. | Políticas básicas, inconsistentes. |
| Establecimiento de Roles y Responsabilidades | Estructura detallada con RACI y justificación. | Estructura básica, sin justificación profunda. | Menciona roles, pero vaga. |
| Calidad Documental y Ética | Profesional, con integración ética ACM y referencias. | Buena, con errores menores. | Básica, falta claridad. |
