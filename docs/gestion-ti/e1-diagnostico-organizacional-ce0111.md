# Entregable 1: Diagnóstico Organizacional y Alineamiento Estratégico (CE0111-CE0115)

## Portada

| Campo | Detalle |
|---|---|
| Título | Diagnóstico organizacional y alineamiento estratégico — Academia Colegio CERMAT |
| Competencia | CE011 — Gestión e Innovación de TI |
| Evidencias | CE0111 Diagnóstico organizacional · CE0112 Alineamiento estratégico · CE0113 Caso de negocio · CE0114 Roadmap de tecnología · CE0115 Matriz de riesgos estratégicos |
| Fecha | 2026-07-06 |

## 1.1 Contexto organizacional

**Sector y entorno competitivo.** Academia Colegio CERMAT opera en el sector de educación básica privada en Juliaca, Puno, Perú, un mercado con varias academias e instituciones educativas privadas compitiendo por matrícula, donde la percepción de organización, seguimiento al alumno y comunicación con los padres es un diferenciador comercial directo.

**Estructura organizacional.** Dirección general → coordinación académica/secretaría (matrícula, pagos, atención) → docentes por ciclo/curso → auxiliares (soporte de asistencia y disciplina) → alumnos y padres de familia.

**Cadena de valor.** Captación de interesados (sitio público, redes) → pre-matrícula → matrícula y cobro → dictado de ciclos/cursos por sede, grupo y turno → seguimiento de asistencia → comunicación con padres → egreso/renovación de matrícula.

**Mapa de stakeholders.** Ya documentado con detalle en el [Brief EPE — Contexto y Stakeholders](../brief-epe.md#3-contexto-y-stakeholders): dirección, administrador del sistema, docentes, estudiantes, auxiliares, padres/apoderados, visitantes/postulantes y el equipo técnico.

## 1.2 Análisis estratégico

**Misión.** Brindar una formación académica de calidad en Juliaca, con procesos administrativos claros y trazables que den confianza a las familias sobre el seguimiento de sus hijos.

**Visión.** Ser reconocida en la región como una academia que combina exigencia académica con una gestión moderna, digital y transparente de matrícula, pagos y asistencia.

**Análisis FODA**

| | Ayuda a lograr el objetivo | Perjudica el objetivo |
|---|---|---|
| **Origen interno** | **Fortalezas:** plataforma digital propia con portales diferenciados por rol; control de asistencia por QR; matrícula pública en línea conectada al flujo interno de aprobación. | **Debilidades:** dependencia de un equipo técnico pequeño para mantener y evolucionar el sistema; parte de los procesos históricos (antes de la plataforma) aún convive en transición hacia el flujo digital. |
| **Origen externo** | **Oportunidades:** crecimiento de matrícula al ofrecer una experiencia más moderna que la competencia; posibilidad de replicar el modelo a nuevas sedes con bajo costo marginal (el sistema ya soporta múltiples sedes). | **Amenazas:** competencia de otras academias con marketing agresivo; cambios regulatorios sobre protección de datos personales de menores de edad que exigen controles adicionales (ver [Planificación de Seguridad, CE0321](../infraestructura/e2-planificacion-seguridad-ce0321.md)). |

**Factores críticos de éxito:** (1) que la matrícula y el cobro nunca se detengan por un problema técnico; (2) que dirección tenga visibilidad en tiempo real de matrículas, pagos y asistencia; (3) que padres y docentes confíen en la plataforma como canal principal de información.

## 1.3 Diagnóstico digital / TI

**Inventario de sistemas de información existentes:** la Plataforma Web Integral CERMAT (React/TypeScript/Firebase, con capa complementaria Node.js/MySQL/Python), documentada en el [Brief EPE](../brief-epe.md) y en el [Entregable 1 de Ingeniería de Software (CE021)](../e1-definicion-sistema-ce021.md). No existen otros sistemas de información institucionales paralelos.

**Nivel de madurez digital:** medio-alto para un colegio/academia privada de su tamaño — ya opera con una plataforma propia en producción, autenticación por roles y sincronización a base relacional, cuando el estándar del sector suele limitarse a hojas de cálculo y mensajería informal.

**Brechas tecnológicas y problemas operativos asociados a TI** (documentados originalmente en el [Brief EPE — Problema](../brief-epe.md#2-problema)):

- Antes del sistema: formularios no integrados, gestión manual de alumnos, control de asistencia poco trazable, seguimiento de pagos separado de la matrícula, información pública difícil de mantener, ausencia de portales por rol.
- Consecuencias: duplicidad de datos, baja visibilidad operativa, riesgo de errores en cupos/matrículas, demora en la atención a padres, poca trazabilidad para decisiones administrativas.

## 1.4 Identificación del problema

**Definición estructurada del problema.** Academia CERMAT necesitaba centralizar su gestión académica y administrativa (ciclos, matrículas, pagos, asistencia, comunicación con padres) porque operaba con canales dispersos y procesos manuales que generaban duplicidad de datos y baja visibilidad operativa.

**Causas raíz:** ausencia histórica de un sistema propio; crecimiento de la institución (más sedes, ciclos y alumnos) sin que los procesos administrativos escalaran junto con ese crecimiento; falta de un canal digital único para padres y estudiantes.

**Impacto estratégico:** riesgo de perder matrículas frente a competidores mejor organizados; sobrecarga operativa del personal administrativo; decisiones de dirección basadas en información incompleta o desactualizada.

**Justificación de la intervención:** una plataforma web integral, con matrícula pública conectada al flujo interno, portales por rol y reglas de seguridad por permisos, resuelve directamente las brechas identificadas — como se sustenta en el [Business Case (CE0113)](e2-business-case-ce0113.md) y se despliega técnicamente en la línea CE02.

## Rúbricas

| Criterio | Excelente | Bueno | Regular | Deficiente |
|---|---|---|---|---|
| Análisis del contexto organizacional | Analiza profundamente el entorno con evidencia y sustento estratégico. | Analiza el contexto con identificación clara de problemas. | Describe la organización de forma general. | Descripción superficial sin análisis estructurado. |
| Identificación de brechas estratégicas | Identifica brechas críticas con análisis fundamentado y evidencia objetiva. | Identifica brechas coherentes con objetivos organizacionales. | Identifica brechas generales sin sustento. | No identifica brechas relevantes. |
| Alineamiento estratégico del proyecto | Evidencia alineamiento claro y coherente entre estrategia, problema y propuesta TI. | Justifica el proyecto en función de objetivos organizacionales. | Relación débil o implícita. | No demuestra relación entre estrategia y proyecto. |
