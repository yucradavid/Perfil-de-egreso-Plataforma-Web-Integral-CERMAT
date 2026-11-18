# Guía de sustentación y defensa técnica

!!! info "Por qué existe esta página"
    En la versión vigente de la guía oficial (septiembre de 2026), la sustentación ya no es un entregable aparte (el antiguo E5, CE0217). Se evalúa en **cada** entregable: criterio "Sustentación y defensa técnica" y anexo "Evidencia de sustentación". En Infraestructura pesa entre 6 % y 8 %, y la sustentación individual puede complementar la nota del equipo para verificar autoría y dominio técnico. Esta guía organiza esa defensa.

## 1. Reparto por integrante

Cada integrante debe dominar el sistema completo y defender en profundidad al menos un área. El historial de git muestra un solo autor, así que el jurado puede preguntar a cualquiera.

**Exposición del jueves 2026-11-19: Infraestructura (CE03) e Ingeniería de Software (CE02).** Reparto actualizado el 2026-11-18. En Software, cada integrante expone una parte, en el orden E1 → E4, y David responde las preguntas técnicas de fondo de cualquier entregable:

| Área / entregable | Responsable principal | Suplente |
|---|---|---|
| Software E1–E2: requerimientos, diseño y plataforma de datos | Gladys Rosaura Yana Pari | David Robert Yucra Mamani |
| Software E3: sistema funcional y demostración | David Robert Yucra Mamani | Gladys Rosaura Yana Pari |
| Software E4, parte 1: pruebas automáticas e integración continua (§1 y §2) | Denilson Leeke Mamani Flores | David Robert Yucra Mamani |
| Software E4, parte 2: gestión ágil y aseguramiento de la calidad, con CMMI (§3 y §4) | Cárdenas Vilca Rennzo | Gladys Rosaura Yana Pari |
| Infraestructura S1-E1 y S2-E2: diseño de la red y su prueba (red, VPN y detección en Docker) | Denilson Leeke Mamani Flores | David Robert Yucra Mamani |
| Infraestructura S2-E1: SGSI y ética | Cárdenas Vilca Rennzo | Denilson Leeke Mamani Flores |
| Infraestructura S1-E2 y S2-E3: centro de datos (Hyper-V, nube y recuperación) | David Robert Yucra Mamani | Cárdenas Vilca Rennzo |
| Gestión TI (E1–E5) | No entra el 2026-11-19; Leeke preparó E4 (procesos) | — |

## 2. Guion de demostración (10 minutos)

| Min. | Qué se muestra | Dónde | Mensaje |
|---|---|---|---|
| 0–1 | Problema y solución | Inicio del sitio | Procesos dispersos → plataforma única con portales por rol |
| 1–2 | Pre-matrícula pública | `/matricula` | Ficha con autorización de datos; validación de ciclo, grupo, cupo y precio; un teléfono no se duplica en el grupo |
| 2–4 | Confirmación, pago y acceso | `/admin/matriculas`, `/admin/pagos`, `/admin/estado-de-cuenta` | Máquina de estados; un pago no se borra; comprobante con QR que se verifica sin sesión; acceso del alumno con usuario y tarjeta |
| 4–5 | Asistencia por QR | Portal auxiliar y «QR del docente» | QR firmado del alumno con resumen en la marca; código del docente que cambia cada 2 minutos |
| 5–6 | Consulta de padres | `/consulta-asistencia` | Código sin caracteres ambiguos, revocable y de solo lectura |
| 6–8 | Calidad | Pestaña *Actions* o terminal | 372 pruebas; las reglas de junio fallaban 10 de 19 y las corregidas se publicaron el 2026-10-24. Mostrar con honestidad el estado de la última entrega (E4 §1.3) |
| 8–9 | Datos | Salida de `92_pruebas_bd.sql`, `restore.js` y `compararReplica.js` | Integridad en la base, auditoría, RTO medido y réplica que se repara cada noche |
| 9–10 | Cierre | Plan de mejora del E4 | Qué falta, por qué y con qué métrica se medirá |

**Plan B sin Internet:** ejecutar en local `npm run test:rules` (emulador) y las pruebas de la base en MySQL local, y mostrar las capturas del [E1](e1-definicion-sistema-ce021.md#22-pantallas-principales) y las del [despliegue del 2026-10-24](infraestructura/evidencias-despliegue-2026-10-24.md).

## 3. Mensajes clave por entregable

| Entregable | Qué defender | Evidencia que mostrar |
|---|---|---|
| Gestión TI E1–E5 | Diagnóstico, business case con supuestos explícitos, plan, procesos AS-IS/TO-BE y ecosistema colegio + academia | Documentos de [Gestión TI](gestion-ti/index.md) y modelo financiero en Excel |
| Software E1 | Requisitos, reglas de negocio aplicadas en código, C4, ADR, estados y trazabilidad hasta las pruebas | [E1](e1-definicion-sistema-ce021.md) |
| Software E2 | Integridad en la base: FK, CHECK, procedimientos, triggers, roles y restauración probada | [E2](e2-base-datos-ce022.md), `92_pruebas_bd.sql` |
| Software E3 | Integración Firebase + API + analítica; patrones; manejo de errores; despliegue | [E3](e3-sistema-funcional-ce023.md), URL de Vercel |
| Software E4 | Pruebas en 4 niveles, CI, incidente de las reglas, gestión ágil y CMMI | [E4](e4-calidad-operacion-ce024.md) |
| Infraestructura | Diseño híbrido (sede + VPS + PaaS), SGSI, y qué está implementado y qué falta ejecutar | [Infraestructura](infraestructura/index.md) |

## 4. Preguntas probables y respuestas preparadas

| Pregunta | Respuesta |
|---|---|
| ¿Por qué Firestore y además MySQL? | Firestore da tiempo real y reglas por rol sin servidor propio. MySQL resuelve reportes, conciliación y auditoría, que Firestore no hace bien. La réplica nunca bloquea la operación. |
| ¿Qué pasa si se cae la API o MySQL? | La matrícula, los pagos y la asistencia siguen funcionando: la sincronización no bloquea y es idempotente. Lo que no llegó se repara esa noche a las 03:30, cuando se compara la réplica con Firestore. Si quedan diferencias, el servicio queda en `failed`. |
| ¿Cómo saben que las reglas de seguridad funcionan? | Con 101 pruebas en el emulador que corren en el CI. Al principio eran 19, y contra las reglas que estaban publicadas fallaban 10: así encontramos 3 fallas reales en producción. Publicamos la versión corregida el 2026-10-24 y lo verificamos como visitante sin sesión: listar matrículas pagadas ahora devuelve 403. |
| ¿Por qué las reglas de producción estaban desactualizadas? | La línea 1 del archivo tenía un `#`, que no es sintaxis válida, y el despliegue fallaba sin que nadie lo viera. La versión corregida se publicó el 2026-10-24 desde la consola, después de pasar las 19 pruebas; cuando se configure el secreto del CI, la publicación será automática y solo tras las pruebas. |
| ¿Cómo evitan que se falsifique un QR? | El QR del alumno lleva una firma opaca que solo leen el alumno y el admin. La marca guarda un resumen sha256 ligado al alumno, al día y al sentido, que la regla recalcula: el auxiliar no puede fabricar otra marca con lo que ve. El QR del docente cambia cada 2 minutos, así que una foto o un texto reenviado deja de servir. |
| ¿No es insegura la contraseña `cermat` + DNI? | Sí, quien conozca el DNI puede entrar hasta que el alumno la cambie. Lo aceptó el equipo para que el alumno entre desde el primer día (ADR-11), y está pendiente de validar con la Dirección. Lo mitigan un recordatorio de 7 días, un aviso fijo después y el restablecimiento desde el panel. El DNI nunca se muestra en la tarjeta y solo lo lee el administrador. |
| ¿Quién puede escribir en MySQL? | Solo los procedimientos almacenados. La cuenta de la API recibe "permiso denegado" si intenta un INSERT directo; lo comprobamos. |
| ¿El sistema se usa de verdad? | Está desplegado y en piloto con volumen bajo: al 2026-11-14, 10 matrículas, 3 pagos y 7 marcas. No lo presentamos como adopción masiva; las metas de uso están en Gestión TI E5. |
| ¿Qué pasó con la entrega del 16 de noviembre? | La matrícula masiva se publicó sin pasar el CI, porque Vercel publica `main` aunque el CI falle. Lo detectó la verificación de este informe y se corrigió el mismo día. 4 fallas eran de las pruebas o de los tipos, y 2 eran reglas que negaban funciones legítimas, sin abrir accesos. La lección es PB-27: que Vercel espere al CI (E4 §1.3). |
| ¿Por qué nivel 1 de CMMI si hay tantas pruebas? | Las prácticas técnicas están maduras, pero faltan estimación, revisiones registradas y gestión de configuración sin secretos. El plan de mejora lleva esas áreas al nivel 2. |
| ¿Qué datos personales usaron para el informe? | Ninguno. Los indicadores son conteos agregados, y las pruebas usan el emulador y datos ficticios. |
| ¿Por qué Vercel y no el VPS del colegio? | Son sistemas distintos: el colegio corre en su VPS y la academia en su propio dominio de Vercel. Llevar la capa relacional de la academia al VPS es viable, con el límite de 2 GB de RAM compartida. |

## 5. Evidencias a tener abiertas antes de empezar

- [ ] Sitio desplegado: [academia-school-platform.vercel.app](https://academia-school-platform.vercel.app)
- [ ] Repositorio y pestaña *Actions* con el último pipeline en verde
- [ ] Terminal con `npm test` y `npm run test:rules` listos para ejecutar
- [ ] Salidas de `92_pruebas_bd.sql` (25/25), de `scripts/restore.js` y de `compararReplica.js` («coinciden»)
- [ ] Un comprobante de prueba abierto desde su QR en un celular
- [ ] Sitio de esta documentación y PDF consolidado
- [ ] Actas firmadas (validación con la academia y declaración de ética) cuando existan

## 6. Registro de sustentación por entregable

| Entregable | Fecha | Docente | Integrante(s) | Observaciones | Acciones acordadas |
|---|---|---|---|---|---|
| (completar tras cada exposición) | | | | | |
## 7. Video pitch (1 a 3 minutos)

La guía de la línea de Software pide un video pitch de 1 a 3 minutos. Guion de 2 minutos y 30 segundos:

| Tiempo | Imagen | Qué se dice |
|---|---|---|
| 0:00–0:20 | Fila en secretaría o fotos del registro en papel | El problema: matricular a un alumno tomaba 40 minutos de personal y los datos quedaban en papel y en hojas sueltas |
| 0:20–0:50 | Portada del sitio y pre-matrícula desde un celular | La solución: una plataforma web donde la familia se pre-matricula desde su casa y la academia confirma en minutos |
| 0:50–1:30 | Panel de administración, comprobante con QR y asistencia por QR | Lo que hace: matrícula, pagos con comprobante, asistencia y portales para docentes, alumnos y padres |
| 1:30–2:00 | Pantalla del CI en verde y del panel de detección | Por qué confiar: 376 pruebas automáticas, reglas de seguridad probadas, respaldos restaurados y monitoreo |
| 2:00–2:30 | El equipo | El resultado: de 40 a 10,5 minutos por matrícula; la invitación a probarla en academia-school-platform.vercel.app |

Recomendaciones: grabar en horizontal, con datos ficticios en todas las pantallas, subtítulos y sin música con derechos de autor.
