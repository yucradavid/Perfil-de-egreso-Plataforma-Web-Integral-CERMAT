# Guía de sustentación y defensa técnica

!!! info "Por qué existe esta página"
    En la versión vigente de la guía oficial (septiembre de 2026), la sustentación ya no es un entregable aparte (el antiguo E5, CE0217). Se evalúa en **cada** entregable: criterio "Sustentación y defensa técnica" y anexo "Evidencia de sustentación". En Infraestructura pesa entre 6 % y 8 %, y la sustentación individual puede complementar la nota del equipo para verificar autoría y dominio técnico. Esta guía organiza esa defensa.

## 1. Reparto por integrante

Cada integrante debe dominar el sistema completo y defender en profundidad al menos un área. El historial de git muestra un solo autor, así que el jurado puede preguntar a cualquiera.

| Área / entregable | Responsable principal | Suplente |
|---|---|---|
| Gestión TI (E1–E5) | (a definir por el equipo) | (a definir) |
| Software E1–E2: requerimientos y datos | (a definir) | (a definir) |
| Software E3–E4: sistema, pruebas y CI | (a definir) | (a definir) |
| Infraestructura (S1 y S2) | (a definir) | (a definir) |

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
| ¿Por qué la última entrega tiene pruebas en rojo? | La matrícula masiva del 16-nov se publicó sin pasar el CI: Vercel publica `main` aunque el CI falle. Lo detectó la verificación de este informe. Está registrado como defecto abierto con su plan (E4 §1.3 y PB-27). |
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
