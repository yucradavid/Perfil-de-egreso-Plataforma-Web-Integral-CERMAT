# E5 - Presentación, Video Pitch y Sustentación Final (CE0217)

!!! abstract "Evidencia CE0217 — Presentación y Sustentación (transversal)"
    Presentación ejecutiva y defensa técnica del sistema desarrollado. Evalúa la capacidad del estudiante para explicar el valor de la solución, demostrar su funcionamiento y sustentar decisiones técnicas ante el jurado. Este entregable se apoya en la evidencia ya construida en el [Brief EPE](brief-epe.md), [E1](e1-definicion-sistema-ce021.md), [E2](e2-base-datos-ce022.md), [E3](e3-sistema-funcional-ce023.md) y [E4](e4-calidad-operacion-ce024.md) — no repite contenido, lo sintetiza para la defensa oral.

## 1. Informacion general

| Campo | Detalle |
|---|---|
| Proyecto | Plataforma Web Integral de Gestion Academica CERMAT |
| Tipo | [ ] PS &nbsp;&nbsp; [ ] PI &nbsp;&nbsp; [x] EPE |
| Curso / Ciclo | Perfil de Egreso - Evidencia integradora (9° ciclo) |
| Equipo | David Robert Yucra Mamani (líder), Gladys Rosaura Yana Pari, Denilson Leeke Mamani Flores, Cárdenas Vilca Rennzo |
| Fecha | 2026-07-05 |
| Formato | Presentación ejecutiva + video pitch (1-3 min) + demo funcional del sistema |

## 2. Resumen Ejecutivo

**Problema abordado:** la Academia La Prepa Cermat operaba su gestión académica y administrativa (matrícula, pagos, asistencia, contenidos públicos, comunicación con padres) sobre canales dispersos, sin un sistema único que centralizara la operación por rol y garantizara trazabilidad.

**Solución construida:** una plataforma web integral (React + TypeScript + Firebase + Node.js + MySQL + Python/FastAPI) con portales diferenciados para administrador, docente, estudiante y auxiliar, matrícula pública en línea, control de asistencia por QR firmado criptográficamente, gestión de pagos, y un servicio de analítica que detecta riesgo de inasistencia. El sistema está desplegado y operando con datos reales, no es un prototipo.

**Valor o impacto esperado:** reducción del trabajo manual administrativo, trazabilidad completa de matrículas/pagos/asistencia, alta masiva de cuentas por Excel para las tres áreas operativas (alumnos, docentes, auxiliares), y visibilidad temprana de alumnos en riesgo de abandono mediante alertas automáticas.

## 3. Presentacion de la solucion

### Contexto del problema

CERMAT (Azángaro, Perú) necesitaba una plataforma digital que centralizara su oferta académica, matrícula, control de asistencia, pagos, contenidos públicos y comunicación con padres — descrito en detalle en el [Brief EPE](brief-epe.md).

### Usuarios o stakeholders

Dirección/administración CERMAT, administrador del sistema, docentes, estudiantes, auxiliares, padres de familia y visitantes/postulantes — el detalle completo de necesidades por stakeholder está en la sección 3 del [Brief EPE](brief-epe.md).

### Alcance del sistema

Sitio público institucional, matrícula en línea, gestión académica completa (ciclos/grupos/sedes), portal administrativo, portal docente, portal estudiante, portal auxiliar, consulta de asistencia para padres, y sincronización complementaria hacia MySQL — alcance completo en la sección 5 del [Brief EPE](brief-epe.md).

### Funcionalidades principales

22 requerimientos funcionales documentados en el [E1](e1-definicion-sistema-ce021.md), destacando: matrícula pública con validación de cupos, asistencia QR firmada con anti-condición de carrera, invitación y auto-activación por rol, carga masiva de cuentas por Excel, y alertas automáticas de riesgo de inasistencia.

## 4. Demostracion del sistema

### Demo funcional

Recorrido sugerido para la sustentación en vivo (sistema real, no simulado):

1. Sitio público → `/ciclos` → matrícula pública (`/matricula`).
2. Panel admin → aprobación de matrícula y registro de pago (`/admin/matriculas`, `/admin/pagos`).
3. Activación de cuenta de estudiante (`/activate`) y de docente por invitación (`/activate-teacher`).
4. Escaneo de QR de asistencia (estudiante y docente) y su validación por firma.
5. Carga masiva de docentes/alumnos/auxiliares por Excel (`/admin/docentes/pendientes`, `/admin/matriculas`, `/admin/auxiliares`).
6. Panel de analítica: alertas de riesgo de inasistencia (`AnalyticsSection`).

### Flujos principales

Matrícula → activación → asistencia → pago → seguimiento, documentado con diagramas de secuencia en la sección 10 del [E1](e1-definicion-sistema-ce021.md).

### Evidencias de datos, integracion, calidad y despliegue

- Datos: 21 colecciones Firestore + 6 tablas MySQL (ver [E2](e2-base-datos-ce022.md)).
- Integración: SPA + Firebase + API REST + servicio analítico Python (ver [E3](e3-sistema-funcional-ce023.md)).
- Calidad: verificación estática (`tsc`, `npm run build`), 90+ documentos de auditoría, brechas de pruebas/CI declaradas honestamente (ver [E4](e4-calidad-operacion-ce024.md)).
- Despliegue: Vercel (frontend), reglas de Firestore desplegadas, API REST bajo PM2.

## 5. Sustento tecnico

### Justificacion de decisiones de diseño y arquitectura

- **Firebase/Firestore como fuente de verdad**, en vez de un backend propio desde cero: reduce tiempo de desarrollo, da reglas de seguridad declarativas y sincronización en tiempo real sin infraestructura adicional que administrar.
- **MySQL como capa complementaria, no crítica**: los reportes y la analítica no deben poner en riesgo la operación académica diaria; por eso la sincronización es *fire-and-forget* y nunca bloquea un flujo real (ver [E3](e3-sistema-funcional-ce023.md)).
- **Arquitectura modular por dominio** (`src/features/*`): cada área de negocio (matrícula, asistencia, pagos...) es independiente y auditable por separado.
- **QR firmado con firma opaca** en vez de un QR con solo el ID del estudiante: cierra la posibilidad de que alguien reconstruya o falsifique un código válido, verificado empíricamente contra el emulador de Firestore.

### Explicacion de tecnologias utilizadas

React 18 + TypeScript + Vite + Tailwind/shadcn (frontend) · Firebase Auth + Firestore + Storage (backend cloud) · Node.js + Express (API REST) · MySQL (datos relacionales complementarios) · Python + FastAPI (analítica) · TanStack Query + Zod (estado remoto y validación) — detalle técnico completo en el [E3](e3-sistema-funcional-ce023.md).

### Limitaciones y trade-offs

Declaradas explícitamente en el [E4](e4-calidad-operacion-ce024.md), sin minimizarlas:

- No existe todavía una suite de pruebas automatizada ni un pipeline de CI/CD — la calidad se sostiene hoy en verificación estática, validación empírica de reglas y auditoría técnica manual documentada.
- El esquema MySQL (6 tablas) es deliberadamente más pequeño que Firestore (21 colecciones): es una decisión, no un olvido — MySQL solo replica lo necesario para reportes.
- El tipado `any` creció junto con el sistema (224 → 789 incidencias de lint); hay una política de corrección priorizada por riesgo, no una corrección automática ciega.
- La librería `xlsx` (carga masiva) agregó ~440 KB al bundle público; no hay code-splitting todavía para aislarla del sitio público.

### Plan de evolucion

Priorizado por riesgo en el [E4](e4-calidad-operacion-ce024.md): (1) pruebas automatizadas sobre matrícula/pagos/asistencia, (2) pipeline mínimo de CI, (3) continuar reduciendo `any` sobre el código nuevo de esta iteración, (4) evaluar carga diferida de `xlsx` en el panel admin.

## 6. Defensa ante jurado

### Respuesta a preguntas

Preguntas técnicas anticipadas y su respuesta preparada:

| Pregunta probable | Respuesta preparada |
|---|---|
| ¿Por qué Firestore y no solo MySQL? | Firestore da reglas de seguridad declarativas y tiempo real sin servidor propio; MySQL se reserva para consultas relacionales que Firestore no resuelve bien (agregados, tendencias). |
| ¿Qué pasa si se cae la API REST o MySQL? | Nada del flujo principal se rompe: la sincronización es *fire-and-forget* — se puede demostrar en vivo apagando el servicio local y matriculando a un alumno igualmente. |
| ¿Por qué no hay pruebas automatizadas todavía? | Es una brecha real y declarada explícitamente en el E4, con un plan de mejora priorizado por riesgo. |
| ¿Cómo se garantiza que un QR no se pueda falsificar? | Firma opaca almacenada en `studentQrSignatures`, validada por Firestore Rules mediante `get()` cruzado; verificado empíricamente contra el emulador de Firestore. |
| ¿Por qué MySQL solo tiene 6 tablas si el sistema tiene más entidades? | Porque MySQL nunca fue diseñado para ser la fuente principal — solo replica lo que se necesita para reportes (alumnos, ciclos, matrículas, pagos, asistencia, alertas); todo lo demás vive y se gobierna en Firestore. |

### Argumentacion tecnica

El proyecto no defiende una arquitectura "de libro" sino la que efectivamente resuelve el problema de CERMAT con menor riesgo operativo: una base cloud como fuente de verdad (alta disponibilidad, reglas declarativas) y una capa local complementaria que nunca bloquea la operación académica. Cada decisión (ver sección 5) tiene una razón de negocio o de seguridad detrás, no es arbitraria, y cada brecha declarada en el E4 tiene un plan de cierre priorizado por riesgo real, no por comodidad.

### Sintesis final del aporte del proyecto

CERMAT pasó de procesos dispersos y manuales a una plataforma única, desplegada y en operación real, con portales por rol, asistencia QR con prueba criptográfica de origen, alta masiva de cuentas, y detección temprana de riesgo de inasistencia — documentado y verificado de punta a punta en los entregables E1-E4.

## 7. Anexos

| Anexo | Contenido |
|---|---|
| Enlace al video pitch | Grabación de 1 a 3 minutos siguiendo el Resumen Ejecutivo (sección 2) — pendiente de grabar |
| Enlace al repositorio | `academia-school-platform` |
| Enlace a la demo o despliegue | `https://www.cermatschool.edu.pe` (verificar que resuelve antes de la sustentación) |
| Evidencias complementarias | Capturas del recorrido funcional de la sección 4; documentos E1-E4 como sustento técnico completo |

## 8. Rubrica de evaluacion

| Criterio | Excelente | Bueno | Regular | Deficiente | Evaluacion CERMAT |
|---|---|---|---|---|---|
| Dominio tecnico | Dominio completo del sistema y arquitectura | Dominio adecuado | Dominio parcial | No domina el sistema | Pendiente de sustentacion |
| Claridad de presentacion | Presentacion clara y estructurada | Presentacion adecuada | Presentacion confusa | Presentacion deficiente | Pendiente de sustentacion |
| Sustento de decisiones | Justifica decisiones tecnicas correctamente | Justificacion basica | Justificacion limitada | Sin sustento | Excelente (ver seccion 5) |
| Demostracion del sistema | Demostracion clara y coherente | Demostracion funcional | Demostracion incompleta | No demuestra | Excelente (sistema real en produccion) |
| Comunicacion y sintesis | Comunicacion tecnica clara, incluye pitch | Comunicacion adecuada | Comunicacion limitada | Comunicacion deficiente | Pendiente de grabar el video |
| Respuesta a preguntas | Responde con precision | Responde parcialmente | Respuestas limitadas | No responde | Pendiente de sustentacion |

!!! note "Por que algunos criterios estan 'Pendientes'"
    El dominio técnico, la comunicación y la respuesta a preguntas solo se demuestran en la sustentación en vivo — no se pueden autoevaluar de antemano sin ser deshonestos. Lo que sí está garantizado hoy (sustento de decisiones y demostración del sistema) se califica en Excelente porque tiene evidencia verificable en E1-E4 y un sistema real desplegado, no una promesa.

## Consideraciones finales de evaluacion

!!! info "Aplican a los 5 entregables de esta linea (CE02), no solo a este"
    - La evaluación se realiza sobre productos reales del sistema desarrollado.
    - Cada competencia se evalúa de manera independiente mediante su rúbrica.
    - No se evalúan fases del proyecto, sino resultados evidenciables.
    - No se fuerza el uso de tecnologías específicas.
    - La evaluación está alineada al perfil de egreso.

    Estas cinco consideraciones son consistentes con cómo se documentaron E1-E5: cada uno cita evidencia verificable en el repositorio (código, reglas, esquemas, métricas) en vez de afirmaciones sin sustento, y la elección de stack (Firebase + Node.js + MySQL + Python) fue una decisión de arquitectura, no una imposición externa.

## Competencia evaluada

!!! abstract "CE0217 — Presentación y Sustentación (transversal)"
    Este entregable demuestra la capacidad de comunicar el valor de un sistema real y en producción ante un jurado, sustentando con evidencia técnica verificable (E1-E4) las decisiones de arquitectura, datos, programación y calidad — incluyendo sus limitaciones declaradas — en vez de defender un prototipo teórico.
