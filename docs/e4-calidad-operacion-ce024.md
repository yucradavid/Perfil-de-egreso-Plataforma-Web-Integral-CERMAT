# E4 - Calidad, Operacion y Evolucion del Sistema (CE024)

!!! abstract "Evidencia CE024 — Calidad de Software"
    Este entregable documenta cómo se gestiona la calidad técnica, la operación y la evolución del sistema CERMAT. Se reporta con **honestidad técnica**: se documentan tanto las prácticas de calidad ya instaladas (auditorías incrementales, verificación con emulador, tipado estricto progresivo) como las brechas reales pendientes (ausencia de suite de pruebas automatizada y de pipeline CI/CD), para que la evaluación refleje el estado verdadero del proyecto y no una imagen idealizada.

## 1. Informacion general

| Campo | Detalle |
|---|---|
| Proyecto | Plataforma Web Integral de Gestion Academica CERMAT |
| Tipo | [ ] PS &nbsp;&nbsp; [ ] PI &nbsp;&nbsp; [x] EPE |
| Curso / Ciclo | Perfil de Egreso - Evidencia integradora |
| Equipo | Equipo de desarrollo CERMAT |
| Fecha | 2026-07-05 |

## 2. Resumen Ejecutivo

Este entregable documenta la calidad, operación y evolución del sistema CERMAT con honestidad técnica: reporta tanto las prácticas de calidad ya instaladas (verificación estática con TypeScript, validación empírica de reglas de seguridad contra el emulador de Firestore, más de 90 documentos de auditoría técnica incremental) como las brechas reales pendientes (ausencia de suite de pruebas automatizada y de pipeline CI/CD), junto con un plan de mejora concreto y priorizado por riesgo para cerrarlas. Incluye además el historial medible de deuda técnica de tipado: auditoría de lint de 224 problemas iniciales, fases de corrección documentadas, y estado actual medido en 789 problemas por el crecimiento del sistema.

## 3. Pruebas

!!! warning "Brecha real: no existe una suite de pruebas automatizada"
    Una búsqueda de archivos `*.test.*` / `*.spec.*` en el repositorio no encuentra resultados. La calidad funcional se sostiene hoy en verificación manual dirigida, tipado estático y validación empírica de reglas de seguridad — no en una suite de pruebas unitarias o de integración ejecutable por CI. Esto se declara aquí como oportunidad de mejora explícita, no se oculta.

### Mecanismos de verificacion que si existen

| Mecanismo | Que cubre | Evidencia |
|---|---|---|
| Verificacion estatica de tipos | Errores de tipado en tiempo de compilacion sobre todo `src/` | `npx tsc --noEmit -p tsconfig.json` (ejecutado sin errores tras cada fase de cambios) |
| Build de produccion como gate | Que el bundle completo compila y se optimiza sin fallos | `npm run build` (Vite) |
| Validacion empirica de Firestore Rules | Comportamiento real de las reglas de seguridad ante escrituras validas e invalidas | Suite temporal con `@firebase/rules-unit-testing` contra el emulador de Firestore, usada para verificar el QR firmado de estudiantes (firma correcta aceptada, firma ausente o incorrecta rechazada) |
| Validacion de esquema en la frontera | Rechazo de payloads invalidos antes de tocar Firestore | `zod` en `schemas.ts` de cada dominio |
| Revision manual dirigida (auditorias) | Logica de negocio, relaciones entre modulos, reglas de seguridad | Mas de 30 documentos `AUDITORIA_*.md` en `docs/` (ver seccion 6) |

### Casos de prueba manuales documentados (muestra representativa)

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Escaneo de QR de estudiante con firma valida | Se registra la marcacion de entrada/salida | Aceptado |
| Escaneo de QR de estudiante con firma ausente o alterada | La escritura es rechazada por Firestore Rules | Rechazado (`PERMISSION_DENIED`) |
| Dos escaneos casi simultaneos del mismo estudiante | Solo una transaccion gana; no se duplica el estado del dia | Verificado mediante `runTransaction` sobre `attendanceDayState` |
| Marcacion de salida docente sin entrada previa | El sistema debe rechazar la secuencia invalida | Rechazado con mensaje de error explicito |
| Activacion de cuenta de estudiante (flujo completo) | El usuario queda creado con `studentQR` firmado y matricula activada | Verificado en dos transacciones separadas (limitacion de Firestore descubierta y corregida durante esta iteracion) |
| Acceso a endpoints de analitica sin token | Debe responder `401` | Verificado tras cerrar la brecha de autenticacion abierta |

### Plan de mejora declarado para pruebas

1. Incorporar `vitest` + `@testing-library/react` para hooks y componentes criticos (`useQuickEnrollmentSubmit`, `logAttendanceScan`).
2. Mantener una carpeta fija de pruebas de reglas (`@firebase/rules-unit-testing`) en vez de scripts temporales, para que la verificacion de seguridad sea repetible y no dependa de memoria de sesion.
3. Priorizar cobertura por riesgo: matricula, pagos y asistencia primero (flujos con dinero y con condiciones de carrera reales), UI puramente informativa despues.

## 4. Integracion y despliegue continuo

!!! warning "Brecha real: no hay pipeline de CI/CD configurado"
    El directorio `.github/appmod` existe pero no contiene workflows de GitHub Actions ejecutando lint, typecheck o build automaticamente en cada push o pull request. El despliegue actual es **manual y dirigido por el equipo**, no automatizado por un pipeline.

### Proceso de despliegue actual (manual)

| Paso | Accion | Responsable |
|---|---|---|
| 1 | `npx tsc --noEmit` y `npm run build` en local antes de subir cambios | Desarrollador |
| 2 | `npm run lint` para revisar regresiones de calidad | Desarrollador |
| 3 | Deploy del frontend (Vercel, con `vercel.json` manejando el rewrite de SPA) | Equipo tecnico |
| 4 | `firebase deploy --only firestore:rules` cuando cambian las reglas | Equipo tecnico |
| 5 | `pm2 restart cermat-api` en el servidor cuando cambia la API REST | Equipo tecnico |
| 6 | Respaldo periodico de MySQL via `server/scripts/backup.js` (evidencia en `backups/`) | Equipo tecnico |

### Plan de mejora declarado para CI/CD

1. Agregar un workflow de GitHub Actions minimo: `npm ci` + `tsc --noEmit` + `npm run build` en cada push a `main`, como primer paso antes de automatizar el deploy.
2. Agregar `npm run lint -- --max-warnings` como gate progresivo (ver metricas en la seccion 5) para evitar que la deuda tecnica crezca sin visibilidad.
3. Automatizar el respaldo de MySQL con una tarea programada en vez de ejecucion manual del script.

## 5. Gestion tecnica y metricas

!!! success "Practica real de auditoria incremental por fases"
    A diferencia de un proyecto academico tipico, este repositorio documenta su propia evolucion tecnica: mas de 90 documentos en `docs/` registran auditorias (`AUDITORIA_*.md`) y fases de correccion (`FASE_*.md`) con fecha, hallazgo, decision y evidencia de codigo. Esta es la metrica de gestion tecnica mas fuerte del proyecto.

### Historial de metricas de lint (deuda tecnica de tipado)

El proyecto ejecutó una auditoría formal de lint (`docs/FASE_H2_AUDITORIA_LINT_GLOBAL_CERMAT.md`) y la trabajó en fases incrementales de bajo riesgo (`FASE_H2_1`, `FASE_H2_2`, `FASE_H2_3`):

| Momento | Problemas totales | Errores | Warnings | Fuente |
|---|---:|---:|---:|---|
| Auditoria inicial H2.0 | 224 | 209 | 15 | `lint-report.txt` / `docs/FASE_H2_AUDITORIA_LINT_GLOBAL_CERMAT.md` |
| Tras fase H2.1 (higiene de bajo riesgo) | — | — | — | `lint-h2-1-before.txt` / `lint-h2-1-after.txt` (documentado en `docs/FASE_H2_1_HIGIENE_LINT_BAJO_RIESGO.md`) |
| Estado actual (crecimiento posterior del proyecto) | 789 | 725 | 64 | `npm run lint`, medido durante esta auditoria |

!!! note "Por que el numero actual es mayor, no menor"
    El aumento de 224 a 789 no es una regresion oculta: refleja que el sistema creció de forma sustancial después de la auditoría H2 (nuevos módulos de matrícula masiva, invitaciones de docentes, firma de QR, importación por Excel), y la regla dominante sigue siendo la misma — `@typescript-eslint/no-explicit-any` — concentrada en payloads de Firebase que aún no tienen un tipo de dominio definido. Se reporta el número real medido hoy en vez de citar solo la cifra histórica más favorable.

### Reglas con mayor incidencia (consistentes entre auditorias)

| Regla | Riesgo | Interpretacion |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | Medio/Alto segun el contexto | Concentrado en paginas admin y en `api.ts` que mapean documentos de Firestore sin interfaz tipada |
| `react-hooks/exhaustive-deps` | Alto | Requiere revision manual caso por caso; no se corrige con autofix ciego para evitar loops de refetch |
| `react-refresh/only-export-components` | Bajo | Archivos que exportan constantes junto a componentes |

### Politica de correccion declarada

- **Nunca** autofix masivo de `any -> unknown` sin adaptar el uso real del dato.
- **Nunca** autofix de `exhaustive-deps` agregando dependencias sin validar que no introduce un bucle de refetch.
- Prioridad de tipado: primero los modulos con dinero o efectos de negocio (matricula, pagos, asistencia, auth), despues vistas informativas.

### Revision tecnica y control de deuda

| Mecanismo | Evidencia |
|---|---|
| Registro de decisiones de correccion "seguras vs manuales" | `docs/FASE_H2_AUDITORIA_LINT_GLOBAL_CERMAT.md` |
| Snapshots de lint antes/despues por fase | `lint-h2-1-before.txt`, `lint-h2-1-after.txt` |
| Inventario funcional vivo de modulos y rutas | `MODULOS_ACTIVOS_WEB.md` |
| Scripts de migracion y validacion de datos | `scripts/dryRunMigracionGruposLegacy.mjs`, `scripts/validateMigration.cjs` |

## 6. Auditoria y evolucion del sistema

!!! info "El repositorio documenta su propia historia de evolucion"
    Cada cambio estructural relevante generó un documento propio antes de tocar código de producción, con el hallazgo, el riesgo y la decisión tomada. Esta sección resume las auditorías más recientes y de mayor impacto sobre seguridad y consistencia de datos.

### Auditorias y correcciones recientes (esta iteracion)

| Hallazgo | Riesgo si no se corregia | Correccion aplicada |
|---|---|---|
| Bug de alcance (scope) en `updateEnrollmentStatus`: variable referenciada fuera de la transaccion | Fallo silencioso tras una escritura exitosa | Variable capturada antes de la transaccion y reutilizada despues |
| Servicio de analitica sin autenticacion ni CORS restringido | Cualquiera podia leer datos de riesgo de inasistencia de alumnos reales | `require_admin` con verificacion de ID token + claim `admin`; `ALLOWED_ORIGINS` restringido |
| Logica de matricula rapida duplicada en formulario individual y masivo | Correcciones aplicadas a un formulario pero no al otro | Extraida a `useQuickEnrollmentSubmit`, usada por ambos |
| Paneles QR de asistencia duplicados entre admin, auxiliar y estudiante | Riesgo de que un cambio de seguridad quede aplicado solo en un panel | Extraidos a componentes/hooks compartidos (`AttendanceQrCard`, `useMidnightCountdown`) |
| Condicion de carrera en el registro de entrada/salida de estudiantes | Doble marcacion o estado inconsistente ante escaneos simultaneos | `runTransaction` sobre `attendanceDayState/{id}_{fecha}` |
| Ausencia de validacion de secuencia en asistencia docente | Se podia registrar una salida sin entrada previa | Validacion de secuencia dentro de la misma transaccion |
| QR de estudiante sin prueba criptografica de origen | Un QR podia ser fotografiado/reconstruido y reutilizado sin control | Firma opaca almacenada en `studentQrSignatures`, validada por Firestore Rules via `get()` cruzado |
| Sistema de invitacion de docentes inexistente (bloqueaba carga masiva) | No se podia dar de alta a un docente sin credenciales compartidas manualmente | Sistema de invitacion por token de un solo uso, con auto-activacion (`ActivateTeacherPage`) |
| Alta individual de alumnos/docentes/auxiliares sin via masiva | Alta operativa lenta para la academia | Carga masiva por `.xlsx` reutilizando la validacion existente de cada dominio |

### Auditorias historicas por area (muestra del repositorio)

| Area | Documentos representativos |
|---|---|
| Matricula y estados | `AUDITORIA_CIERRE_FLUJO_MATRICULA_CRITICO.md`, `AUDITORIA_R1_MAQUINA_ESTADOS_MATRICULA.md`, `AUDITORIA_R3_ACTIVACION_ALUMNO_TRANSACCIONAL.md` |
| Cupos y concurrencia | `AUDITORIA_R5_CUPOS_GRUPO_MATRICULA.md`, `AUDITORIA_R5_5_FIRESTORE_RULES_ENROLLED_COUNT.md` |
| Reglas de seguridad Firestore | `AUDITORIA_CRITICA_FIRESTORE_RULES_RECURSOS_CONTADORES.md`, `AUDITORIA_CRITICA_1C_PAYLOAD_ENROLLMENTS_RULES_COMPATIBILIDAD.md` |
| Contenido publico (recursos, posts, talleres) | `AUDITORIA_ARQUITECTURA_FUNCIONAL_POSTS_RECURSOS_TALLERES.md`, `AUDITORIA_CONTENIDO_1D_RESOURCES_RELACIONES_RULES.md` |
| UI/UX del panel admin | `AUDITORIA_UIX_ADMIN_MATRICULAS_PROFESIONAL.md`, `AUDITORIA_UIX_SIDEBAR_ADMIN_RESPONSIVE_RETRACTIL.md` |
| Calidad de codigo / lint | `FASE_H2_AUDITORIA_LINT_GLOBAL_CERMAT.md`, `FASE_H2_1_HIGIENE_LINT_BAJO_RIESGO.md`, `FASE_H2_2_TIPADO_SEGURO_BAJO_RIESGO.md`, `FASE_H2_3_TIPADO_DOMINIO_PUBLICO_CERMAT.md` |
| Migracion de datos legacy | `FASE_ACADEMICO_4E1_DRY_RUN_MIGRACION_GRUPOS_LEGACY.md`, `AUDITORIA_ACADEMICO_4E_MIGRACION_GRUPOS_LEGACY.md` |

### Plan de evolucion hacia adelante

1. Cerrar la brecha de pruebas automatizadas descrita en la seccion 3, priorizando matricula, pagos y asistencia.
2. Incorporar un pipeline minimo de CI (seccion 4) antes de automatizar el deploy.
3. Continuar la reduccion de `any` documentada en las fases H2, ahora sobre el codigo agregado en esta iteracion (invitaciones de docente, importacion por Excel).
4. Evaluar el impacto en tamaño de bundle de la libreria `xlsx` (~440 KB agregados) y considerar cargarla solo bajo demanda dentro del panel admin.
5. Mantener la disciplina de auditar antes de modificar: cada cambio estructural futuro deberia seguir generando su propio documento de decision, como ha ocurrido hasta ahora.

## 7. Anexos

| Anexo | Contenido | Ubicacion en este documento |
|---|---|---|
| Reportes de lint | `lint-report.txt`, `lint-h2-1-before.txt`, `lint-h2-1-after.txt` | Seccion "5. Gestion tecnica y metricas" |
| Auditorias tecnicas | 90+ documentos `AUDITORIA_*.md` / `FASE_*.md` en `docs/` | Seccion "6. Auditoria y evolucion del sistema" |
| Evidencia de verificacion de reglas | Suite temporal con `@firebase/rules-unit-testing` contra el emulador de Firestore | Seccion "3. Pruebas" |
| Plan de mejora | Roadmap priorizado por riesgo (pruebas, CI/CD, tipado, bundle) | Seccion "6. Auditoria y evolucion del sistema" -> "Plan de evolucion hacia adelante" |

## 8. Rubrica de evaluacion

| Criterio | Excelente | Bueno | Regular | Deficiente | Evaluacion CERMAT |
|---|---|---|---|---|---|
| Cobertura y calidad de pruebas | Pruebas efectivas cubren componentes criticos | Pruebas funcionales | Pruebas limitadas | Sin pruebas | Regular |
| Automatizacion (CI/CD) | Pipeline automatizado completo | Pipeline funcional | Automatizacion parcial | Sin automatizacion | Deficiente |
| Uso de metricas y evaluacion | Metricas utilizadas para evaluar el sistema | Metricas basicas | Metricas limitadas | Sin metricas | Bueno |
| Gestion tecnica del desarrollo | Control de decisiones y deuda tecnica | Gestion parcial | Gestion limitada | Sin gestion | Excelente |
| Auditoria tecnica del sistema | Evaluacion estructurada del sistema | Auditoria general | Auditoria superficial | Sin auditoria | Excelente |
| Propuesta de mejora continua | Plan basado en evidencia | Propuesta general | Propuesta limitada | Sin mejora | Bueno |

!!! note "Autoevaluacion deliberadamente conservadora"
    Los criterios de pruebas y CI/CD se califican por debajo del resto porque son brechas reales y verificables (no hay archivos de test ni workflows en `.github/`). Se prefiere una autoevaluacion defendible ante preguntas directas del jurado antes que una calificacion optimista que no resista una revisión del repositorio en vivo. Los seis criterios y su redaccion corresponden exactamente a la rubrica de "Entregable 4: Calidad, Operacion y Evolucion del Sistema (CE024)" del documento de Perfil de Egreso.

## Competencia evaluada

!!! abstract "CE024 — Calidad de Software"
    Este entregable demuestra que el sistema gestiona su calidad principalmente mediante auditoría técnica documentada, tipado estático progresivo y verificación empírica dirigida — con más de 90 documentos de auditoría y fases de corrección en `docs/` como evidencia central — mientras declara explícitamente, como parte de la madurez profesional exigida en un EPE, las brechas pendientes en pruebas automatizadas e integración continua junto con un plan concreto para cerrarlas.
