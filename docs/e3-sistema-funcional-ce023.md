# E3 - Sistema de Software Funcional Integrado (CE023)

!!! abstract "Evidencia CE023 — Programación"
    Sistema funcional y desplegado que implementa los requerimientos del [E1](e1-definicion-sistema-ce021.md) sobre la plataforma de datos del [E2](e2-base-datos-ce022.md): una aplicación web React + TypeScript integrada con Firebase, una API REST Node.js y un servicio de analítica en Python.

## Portada

| Campo | Detalle |
|---|---|
| Título del sistema | Plataforma Web Integral de Gestión Académica CERMAT |
| Estudiantes | David Robert Yucra Mamani (líder), Gladys Rosaura Yana Pari, Denilson Leeke Mamani Flores, Cárdenas Vilca Rennzo |
| Semestre | 2026-2 (9° ciclo) |
| Fecha | 2026-11-16 (primera versión: 2026-10-24) |
| Despliegue | [https://academia-school-platform.vercel.app](https://academia-school-platform.vercel.app) (Vercel) |
| Repositorio | `github.com/yucradavid/academia-school-platform` (privado; acceso para el jurado a solicitud) |

## Resumen Ejecutivo

**Qué resuelve.** La plataforma centraliza la operación de la academia en un solo sistema con portales por rol: oferta de ciclos, pre-matrícula en línea, aprobación y pagos, asistencia por QR y consulta de los padres. Antes había registros dispersos, duplicados y riesgo de sobrepasar los cupos.

**Cómo se usa.**

1. El visitante elige un ciclo y se pre-matricula en `/matricula` con la ficha del alumno y la autorización de datos. El administrador también puede matricular desde el panel o con un Excel.
2. El administrador confirma la matrícula y registra el pago en `/admin/matriculas` y `/admin/pagos`; cada pago genera su comprobante con QR. Luego crea el acceso del alumno (usuario y contraseña inicial) y le entrega la tarjeta, o le envía una invitación si la academia usa ese modo.
3. El auxiliar registra la entrada y salida escaneando el QR firmado del alumno.
4. El docente marca su asistencia con el QR que muestra el auxiliar, que cambia cada 2 minutos.
5. El padre consulta la asistencia con un código `CERMAT-XXXX-XXXX` en `/consulta-asistencia`.
6. El alumno ve sus cursos, recursos, comprobantes y asistencia, se inscribe en talleres y cambia su contraseña. El administrador sigue la deuda en `/admin/estado-de-cuenta`.

**Estado.** El sistema está desplegado y en operación piloto. Al 2026-10-24 tenía 8 matrículas, 2 pagos, 7 marcas de asistencia y 8 usuarios con perfil. Al 2026-11-14, la conciliación contó 10 matrículas, 3 pagos y 7 marcas.

La verificación del 2026-11-16, con los mismos comandos del CI, da:

- **Build:** de producción correcto.
- **Pruebas:** 372 automáticas, todas en verde.
- **TypeScript:** 0 errores en el frontend y en la API.
- **Calidad:** pipeline de CI con 6 trabajos.

La entrega de matrícula masiva (`f9447d8`) se había publicado con 34 errores de tipos y 6 pruebas en rojo. Se corrigieron ese mismo día, y la corrección se publicó el 2026-11-16 (`95b270d`), con las reglas verificadas sin sesión ([E4 §1.3](e4-calidad-operacion-ce024.md#13-reporte-de-ejecucion-2026-11-16)).

## Sección 1: Arquitectura e Integración

### 1.1 Arquitectura general

| Proceso | Tecnología | Ubicación en el repositorio | Rol |
|---|---|---|---|
| Frontend SPA | React 18 + TypeScript + Vite | `src/` | Portales público y privados (59 rutas, 6 guardas) |
| Identidad y datos | Firebase Auth, Cloud Firestore, Storage | `src/lib/firebase.ts`, `firestore.rules` | Fuente de verdad, protegida por reglas probadas |
| API REST | Node.js + Express + TypeScript | `server/src/` | Sincronización a MySQL con autorización por rol; cuentas de alumnos (`/api/cuentas`) y de personal (`/api/usuarios`) con Firebase Admin |
| Analítica | Python + FastAPI | `analytics/main.py` | Riesgo de inasistencia y resúmenes (solo admin) |
| Base relacional | MySQL 8 | `server/src/db/` | Réplica con procedimientos, triggers y auditoría |
| Conciliación nocturna | Temporizador de systemd + scripts de la API | `deploy/systemd/academia-replica.*`, `server/src/scripts/` | Compara y repara la réplica cada noche a las 03:30 |

Desde el 2026-10-24 la API, la analítica y MySQL corren en el VPS del colegio. Nginx publica la API y la analítica por HTTPS en `api-academia.cermatschool.edu.pe` y `analitica-academia.cermatschool.edu.pe`, y la SPA las encuentra por esas direcciones, configuradas en el panel de administración (`config/services`).

```mermaid
flowchart TD
  Browser["Navegador"] --> SPA["SPA React (Vercel)"]
  SPA -->|"SDK + reglas"| Auth["Firebase Authentication"]
  SPA -->|"SDK + reglas"| FS["Cloud Firestore"]
  SPA -->|"SDK"| Storage["Firebase Storage"]
  SPA -->|"fetch + ID token (no bloqueante)"| API["API REST Express"]
  API -->|"verifyIdToken + rol"| Auth
  API -->|"CALL sp_* (cuenta cermat_api)"| MySQL[("MySQL 8")]
  SPA -->|"fetch + ID token admin"| Analytics["FastAPI"]
  Analytics -->|"CALL sp_riesgo_inasistencia"| MySQL
  API -->|"Admin SDK: cuentas de alumnos y personal"| Auth
  Timer["Temporizador 03:30 (systemd)"] -->|"compara y repara"| FS
  Timer -->|"CALL sp_*"| MySQL
```

### 1.2 Capas, módulos y servicios

| Capa | Contenido | Ejemplos |
|---|---|---|
| Presentación | Páginas por portal y componentes de UI | `pages/admin/*`, `pages/student/*`, `components/ui/*` (shadcn/ui) |
| Dominio | 17 módulos con el mismo patrón de archivos | `features/enrollments`, `payments`, `receipts`, `attendance`, `cycles`, `groups`, `users`, `accesos`, `teacherInvites`, `resources`, `posts`, `workshops`, `messages`, `institucion`, `analytics`, `students`, `site` |
| Componentes compartidos | Marco único de los 4 paneles y listas con filtros, paginación y acciones | `components/panel/PanelShell.tsx`, `components/admin/list/*` |
| Infraestructura | Acceso a Firebase y sincronización | `lib/firebase.ts`, `lib/syncService.ts` |
| Seguridad | Guardas de ruta y reglas del servidor | `routes/*Route.tsx`, `routes/useStaffProfile.ts`, `firestore.rules`, `server/src/middleware/auth.ts` |

### 1.3 Integración con la base de datos

- **Firestore** es la base operativa. Las escrituras críticas usan transacciones, como la matrícula con su cupo y el estado diario de la asistencia.
- **MySQL** recibe una copia de cada matrícula, pago y marca de asistencia mediante `syncService` → API → procedimiento almacenado. La cuenta de la API solo puede ejecutar procedimientos; no tiene INSERT, UPDATE ni DELETE directos.
- La sincronización es **idempotente**: reenviar un log no lo duplica. Además, **no bloquea**: si la API está apagada, el usuario no lo nota. La vista `v_conciliacion_pagos` detecta los eventos perdidos.
- Un envío fallido no se reintenta en el momento. Hasta el 2026-11-14 llegaba solo cuando el registro volvía a cambiar. Desde entonces, la conciliación nocturna compara la réplica con Firestore y la repara ([E2 §4.5](e2-base-datos-ce022.md#45-comparacion-y-reparacion-nocturna-de-la-replica)).
- Al confirmar una matrícula o registrar o anular un pago, `resyncEnrollment` relee la matrícula y la envía completa, porque MySQL guarda el monto pagado que recibe. Al borrar una marca en el panel, la API la borra también en MySQL.
- Los datos anteriores a la sincronización se copiaron una sola vez el 2026-10-24 con `server/src/scripts/cargaInicial.ts`. Usa las mismas validaciones (`server/src/sync/esquemas.ts`) y los mismos procedimientos que `/api/sync`, y calcula la hora de Perú aunque el VPS esté en UTC ([E2 §2.3](e2-base-datos-ce022.md#23-evidencias-de-creacion)). Desde el 14-nov el mismo script también repara filas existentes.
- El número de documento del alumno no viaja a MySQL ni a `users`: vive en `fichasMatricula` y `documentosAlumnos`, que solo lee el administrador.

### 1.4 Integración con servicios externos

| Servicio | Uso | Autenticación |
|---|---|---|
| Firebase Authentication | Identidad de los 5 roles | Correo (o usuario interno del alumno) y contraseña; claims `admin` y `role` |
| Firebase Admin SDK (API y analítica) | Verificar el ID token y leer el rol; en la API, crear, desactivar y restablecer cuentas de alumnos y de personal | Cuenta de servicio (solo en el VPS) |
| WhatsApp (enlaces `wa.me`) | Tarjeta de acceso, recordatorio de deuda y solicitudes de cupo | — (enlace abierto por el usuario; sin API) |
| Vercel | Publicación del frontend | Panel del equipo |
| Sitio del colegio (cermatschool.edu.pe) | Enlaza a la plataforma de la academia | — (enlace público) |

## Sección 2: Funcionalidad del Sistema

### 2.1 Flujos principales implementados

| Flujo | Descripción | Evidencia |
|---|---|---|
| Pre-matrícula pública con cupo | Transacción con id determinístico, validación del ciclo, el grupo, el cupo y el precio del plan, ficha del alumno con autorización de datos y mensaje claro ante un duplicado | `features/enrollments/api.ts` (`createEnrollment`), `ficha.ts`; 10 pruebas de reglas con el código real y 7 de la ficha |
| Máquina de estados de la matrícula | Pendiente → confirmada sin acceso → confirmada con acceso; cancelación y reapertura con autor | `updateEnrollmentStatus`, `isAdminEnrollmentUpdateAllowed` |
| Edición de la matrícula | Nombre, teléfono, correo, monto y cambio de grupo del mismo ciclo; el cupo pasa al grupo nuevo en la misma transacción | `updateEnrollmentDetails`, `EditEnrollmentDialog.tsx` |
| Matrícula masiva por Excel | Una fila por alumno con ciclo, grupo, forma de pago, cuotas, descuento y ficha; los errores se reportan por fila | `features/enrollments/bulkEnrollmentImport.ts`, `AdminBulkQuickEnrollmentCard.tsx` |
| Pagos con cuotas y comprobante | Registro solo admin, descuento al contado, cronograma por cuota, anulación lógica y saldo calculado. El comprobante numerado con QR se crea en la misma transacción y se imprime en A4 o ticket de 80 mm | `features/payments/*`, `features/receipts/*`, `pages/ReceiptPage.tsx` |
| Estado de cuenta | Deuda vencida, cuotas por vencer en 7 días, cronograma por alumno, registrar pago, recordatorio por WhatsApp y CSV | `pages/admin/AdminAccountStatementPage.tsx`, `features/payments/summary.ts` |
| Acceso directo del alumno | Usuario `nombre.apellido` y contraseña inicial creados por la API. Incluye tarjeta imprimible, restablecimiento, corrección del documento, desactivación, cambio de contraseña con aviso y creación en lote tras la matrícula masiva | `features/accesos/*`, `server/src/routes/cuentas.ts`; 21 pruebas de API |
| Activación por invitación | Token de un solo uso con vencimiento para docentes y auxiliares (y alumnos, en modo invitación). La página revisa el enlace antes de crear la cuenta y renueva uno vencido | `pages/Activate*Page.tsx`; 21 pruebas de reglas de roles y activación |
| Módulo Usuarios | Todas las cuentas con rol, estado y último ingreso. Crea cuentas de personal y cambia contraseñas. Desactiva y reactiva cuentas | `pages/admin/AdminUsuariosPage.tsx`, `server/src/routes/usuarios.ts`; 10 pruebas de API |
| Asistencia con QR firmado | QR permanente del alumno con firma opaca, resumen sha256 en cada marca, estado diario transaccional y botón «Regenerar QR» | `features/attendance/api.ts`, `scanProof.ts`, `studentQr.ts` |
| Asistencia del docente | Código que cambia cada 2 minutos, mostrado por el auxiliar o en «QR del día» con cuenta regresiva; no se acepta salida sin entrada | `rotatingCode.ts`, `logTeacherAttendanceScan` |
| Varios docentes por grupo | Docente responsable y cursos por materia; «Mis cursos» une los grupos donde es responsable y donde dicta un curso | `features/groups/teachers.ts`, `AdminCycleGroupsPage.tsx` |
| Talleres con cupo | Inscripción y cancelación del alumno; lista, exportación y retiro de inscritos por el admin | `features/workshops/registrations.ts` |
| Consulta de padres | Código normalizado, sin caracteres ambiguos y revocable; el historial pasa al código nuevo | `pages/ConsultaAsistenciaPadrePage.tsx`, `lib/parentAccess.ts` |
| Solicitudes | Bandeja con los mensajes de Contacto y las solicitudes de cupo por WhatsApp | `pages/admin/AdminMessagesPage.tsx`, `features/messages/*` |
| Configuración institucional | Monto de inscripción, descuento mínimo al contado, cuentas bancarias y teléfonos de WhatsApp | `pages/admin/AdminInstitutionalConfigPage.tsx`, `features/institucion/*` |
| Carga masiva de personas por Excel | Alta de alumnos, docentes y auxiliares; los errores se reportan por fila sin detener el lote | `lib/excelImport.ts` |
| Analítica protegida | Riesgo de inasistencia sobre días lectivos, solo para administradores; una sola alerta abierta por alumno | `analytics/main.py`, `sp_riesgo_inasistencia` |

### 2.2 Gestión de usuarios, permisos y roles

| Rol | Cómo se identifica | Guarda de ruta | Alcance |
|---|---|---|---|
| Administrador | Claim `admin` | `AdminRoute` | Gestión completa, pagos y estados |
| Docente | Claim `teacher` o rol en `users`; pierde el rol si `isActive == false` | `TeacherRoute` | Sus grupos (como responsable o por un curso), alumnos confirmados, recursos y asistencia propia |
| Auxiliar | Claim `auxiliar` o rol en `users`, creado con invitación o por el admin; pierde el rol si `isActive == false` | `AuxiliarRoute` | Paneles de escaneo de asistencia y QR del docente |
| Estudiante | Rol `student`; entra con su usuario interno o su correo | `StudentRoute` | Sus cursos, recursos, matrícula, comprobantes, talleres, asistencia y contraseña |
| Padre | Código de acceso, sin cuenta | `ParentAttendanceRoute` | Asistencia de su hijo, solo lectura |
| Visitante | Sin sesión | — | Oferta pública y pre-matrícula |

### 2.3 Evidencias funcionales

| Pre-matrícula | Consulta de padres |
|---|---|
| ![Matrícula](assets/capturas/03-matricula.png) | ![Consulta de padres](assets/capturas/04-consulta-padres.png) |

Más capturas (inicio, ciclos, ingreso y vista móvil) en la [Sección 2 del E1](e1-definicion-sistema-ce021.md#22-pantallas-principales).

**Portales con sesión (2026-11-18).** Se capturaron sobre el sistema corriendo en local contra los emuladores de Firebase (proyecto `demo-cermat`), con las reglas de Firestore del repositorio, cuentas `@demo.test` y datos ficticios marcados «(demo)». Así se muestran los flujos sin exponer datos de alumnos reales. Ninguna de las 4 páginas registró errores de consola.

| Matrículas (administrador) | Pagos (administrador) |
|---|---|
| ![Panel de matrículas con estados pendiente, confirmada y cancelada](assets/capturas/07-admin-matriculas.png) | ![Panel de pagos con cuotas, métodos y totales cobrados](assets/capturas/08-admin-pagos.png) |

| Supervisión de asistencia (auxiliar) | Matrícula y pagos (alumno) |
|---|---|
| ![Escaneo de QR del alumno y asistencia del día](assets/capturas/09-auxiliar-asistencia.png) | ![Portal del alumno con su matrícula, pagos y saldo](assets/capturas/10-alumno-matricula.png) |

- **Matrículas:** los estados pendiente, confirmada y cancelada, el seguimiento y el tipo de pago (al contado o en cuotas).
- **Pagos:** el total cobrado, lo pendiente por cobrar y cada pago con su método y número de cuota.
- **Auxiliar:** el lector de QR (en un navegador sin cámara ofrece el lector USB o el código pegado) y quién sigue dentro.
- **Alumno:** ve su propia matrícula, con lo pagado y el saldo (RF15).

## Sección 3: Código y Diseño Técnico

### 3.1 Estructura del repositorio

```text
academia-school-platform/
├─ src/
│  ├─ features/<dominio>/   api.ts · hooks.ts · schemas.ts · types.ts · components/
│  ├─ pages/                59 rutas (público, admin, teacher, student, auxiliar)
│  ├─ components/           UI compartida (shadcn/ui), marco de paneles y listas
│  ├─ lib/                  firebase, syncService, qrPayload, parentAccess, date, excelImport, text, phone, csv
│  └─ routes/               guardas por rol y perfil del personal
├─ server/                  API REST (src/routes, src/middleware, src/cuentas, src/db, src/sync,
│                           src/replica, src/migracion, src/scripts, scripts, test)
├─ analytics/               servicio FastAPI
├─ deploy/                  manual de despliegue y unidades de systemd de la réplica
├─ tests/firestore-rules/   pruebas de reglas con emulador
├─ firestore.rules · firebase.json
└─ .github/workflows/ci.yml · .github/pull_request_template.md
```

### 3.2 Patrones y buenas prácticas aplicadas

| Patrón | Propósito | Ejemplo |
|---|---|---|
| Módulo por dominio (4 archivos) | Navegación predecible y aislamiento | `features/enrollments/*` |
| Hooks de TanStack Query | Caché, estados de carga y error | `useCreatePost`, `useQuickEnrollmentSubmit` |
| Validación en la frontera (doble) | El cliente valida con Zod; el servidor revalida con reglas y Zod | `schemas.ts` + `firestore.rules` + `server/src/sync/esquemas.ts` (los mismos esquemas en `/api/sync` y en la carga inicial) |
| Id determinístico y transacciones | Evitar duplicados y condiciones de carrera sin bloqueos externos | `grupo__teléfono`, `attendanceDayState/{tipo}_{id}_{fecha}` |
| Escritura solo por procedimientos | Integridad y auditoría centralizadas en la base | `CALL sp_sync_pago(...)` |
| Idempotencia | Reintentos seguros de la sincronización y de la carga inicial | `sp_registrar_asistencia` |
| Invitación por token hasheado | Activar sin contraseñas compartidas; el token no se guarda | `sha256Hex(token)` como id |
| Prueba sin secreto | Guardar un resumen que las reglas recalculan, en vez del secreto que el personal podría leer | `studentScanProof` (sha256 de firma, alumno, día y sentido) |
| Código rotativo | Un código que caduca en 2 minutos, recalculado por las reglas con la hora del servidor | `rotatingCode.ts` e `isTeacherDailyCode` |
| Contador ligado a su documento | El contador solo se mueve en 1 y junto con la inscripción propia, en la misma transacción | `workshopRegistrations` + `registeredCount`; correlativo de `counters/receipts` |
| Operación privilegiada en el servidor | Lo que el navegador no debe poder hacer (crear cuentas, calcular la contraseña inicial, marcar `passwordInicial`) lo hace la API con Firebase Admin | `server/src/routes/cuentas.ts`, `usuarios.ts` |
| Reintento idempotente | Si la conexión se corta a mitad de la creación de una cuenta, el reintento reutiliza la cuenta creada | `POST /api/cuentas/alumnos` |
| Un solo origen para cada cálculo | El mismo texto o cálculo en todas las pantallas | `groupScheduleText`, `accountStatement`, `normalizeSearch`, `isSamePersonName` |
| Utilidades genéricas | Un solo parser de Excel para 3 roles y la matrícula masiva | `excelImport.ts`, `runBulkRows` |

### 3.3 Modularidad y desacoplamiento

- Las páginas no llaman directamente a Firebase: usan los hooks y la API de su dominio.
- La sincronización está aislada en `syncService` y se activa por configuración (`config/services`), sin recompilar.
- La API depende de una interfaz mínima de base de datos (procedimientos), no del esquema de tablas.

### 3.4 Manejo de errores y validaciones

| Situación | Tratamiento |
|---|---|
| Formulario inválido | Zod + react-hook-form muestran el error por campo antes de cualquier escritura |
| Operación remota fallida | Las mutaciones exponen `isError` y la UI notifica con un toast |
| Duplicado en la pre-matrícula pública | El permiso denegado se traduce a un mensaje comprensible (`createEnrollment`) |
| API: datos inválidos, rechazo de la base o error inesperado | 400 con detalle de Zod / 422 con el mensaje del trigger / 500 sin filtrar detalles internos |
| API de cuentas: usuario ocupado o documento con cuenta | 409 con código (`usuario-ocupado` trae la sugerencia; `documento-con-cuenta` trae de quién es) para que el panel pregunte, nunca une solo |
| API caída al administrar usuarios | El módulo Usuarios sigue mostrando los perfiles de Firestore y avisa qué falta |
| Pantalla abierta con una versión anterior (QR del docente) | El código anterior deja de aceptarse; hay que recargar la pantalla del auxiliar |
| La llamada a un procedimiento falla | La API cierra esa conexión en vez de devolverla al pool, y MySQL deshace la transacción que el error pudo dejar abierta (`ejecutar` en `server/src/db/mysql.ts`) |
| Carga masiva | Continúa ante errores por fila e informa la fila real del Excel |
| Fechas de Firestore | `toDateSafe` convierte `Timestamp`, `Date` o texto, sin "Invalid Date" |

**Correcciones de esta iteración (2026-10-24):**

| Defecto | Corrección |
|---|---|
| 66 errores de TypeScript | Tipos corregidos sin cambiar el JavaScript generado (verificado archivo por archivo); 0 errores |
| Fechas del blog como "Invalid Date" | `toDateSafe` con 3 pruebas |
| Guardar un post sin imagen fallaba (`undefined` en Firestore) | Se guarda una cadena vacía |
| Editar un post reiniciaba su fecha de publicación | La API fija la fecha solo en la primera publicación |
| Posts sin autor | Se registra `createdBy` con el UID del administrador |
| Sincronización con `alumnoId` vacío | Se usa `studentUid`, que es el vínculo real |
| Animación de entrada de la galería que nunca corría | Entrada y hover separados en dos elementos (verificado en el navegador) |
| Ejemplo de código de padres inválido (`…AB12…` contiene "1") | Ejemplo válido `CERMAT-AB2C-D3EF` |
| Toda sincronización con turno mañana respondía 500 (`Data truncated`) | Migración `05_corregir_turno.sql` y `SET NAMES utf8mb4` en los scripts SQL |
| En el VPS, la asistencia, las funciones de saldo y `sp_estado_cuenta` fallaban con `Illegal mix of collations` | Base en `utf8mb4_0900_ai_ci` y rutinas re-creadas; `restore.js` verifica la collation |
| Una sincronización fallida dejaba su transacción abierta y bloqueó una migración | La API cierra la conexión si la llamada falla; la analítica cierra siempre la suya |

**Correcciones de octubre y noviembre (25-oct al 16-nov).** Una auditoría de solo lectura dejó 171 hallazgos sin verificar (41 altos, 98 medios y 32 bajos). Cada uno se comprobó en el código antes de corregirlo. Los que cruzan roles o tocan las reglas son:

| Defecto | Corrección |
|---|---|
| El docente activado con su invitación nunca entraba a `/docente` | Reglas y `TeacherRoute` aceptan el rol guardado en `users/{uid}`, que solo se crea con invitación |
| Las asistencias del auxiliar y del docente no llegaban a MySQL | Pueden leer `config/services` por id, que solo trae direcciones |
| La confirmación de la matrícula y lo pagado no llegaban a MySQL | `resyncEnrollment` reenvía la matrícula completa |
| La familia fijaba su propia deuda en la pre-matrícula | Las cuotas son las del plan del ciclo y las reglas validan el precio (`isEnrollmentPriceValid`) |
| El detalle público de cada ciclo decía «Ciclo no encontrado» | La ruta usa `:slug`, con respaldo por id |
| Ningún visitante podía abrir una entrada del blog | La consulta filtra por publicadas |
| El docente leía pre-matrículas y canceladas con teléfono y montos | Solo lee las confirmadas |
| Cualquiera con sesión podía apropiarse de una matrícula sin activar | La activación lee solo la invitación (`invites/{sha256(token)}`), no la matrícula |
| Dos hermanos con el mismo correo quedaban en una sola cuenta | La activación compara los nombres (`isSamePersonName`) y pide otro correo |
| Un código de padres regenerado seguía funcionando | Registro del código con revocación; el historial pasa al nuevo |
| Docentes y auxiliares podían fabricar marcas con la firma del QR | La firma salió del perfil y de las marcas, que guardan un resumen |
| El QR del docente valía todo el día y se podía usar desde fuera | Código rotativo cada 2 minutos |
| La primera marca del día del docente fallaba | Cada uno puede consultar su propio estado del día aunque no exista |
| Desactivar a un docente o auxiliar no le quitaba el acceso | `isStaffAccountActive` en reglas y API; la cuenta no puede reactivarse sola |
| Cualquier cuenta con el código del día marcaba como docente | La marca exige ser docente |
| Al renombrar una sede, ciclos, grupos y matrículas guardaban el nombre anterior | `propagateCampusRename` actualiza todo y reenvía las matrículas a MySQL |
| Las marcas borradas en el panel seguían en MySQL y en la analítica | `sp_eliminar_asistencia` y `DELETE /api/sync/attendance-log/:logId` |
| La analítica sumaba cada día otra alerta por alumno | Una sola alerta abierta por alumno, que se actualiza |
| «Pagado» en Matrículas significaba «confirmada» | Se muestra «Confirmada», sin cambiar el valor guardado |

## Sección 4: Despliegue o Instalación

### 4.1 Instrucciones de instalación

| Componente | Pasos |
|---|---|
| Frontend | `npm install` · `npm run dev` (desarrollo) · `npm run build` (genera `dist/`) |
| Calidad | `npm run typecheck` · `npm test` · `npm run test:rules` (emulador de Firestore; requiere Java y Firebase CLI) |
| Reglas de Firestore | `firebase deploy --only firestore:rules` (o automático desde el CI) |
| API REST | `cd server && npm install && npm run build` y PM2 (en el VPS, como `academia`: `pm2 start dist/index.js --name academia-api`) · pruebas: `npm test` |
| Base MySQL | Migraciones `02`–`06` y cuentas de mínimo privilegio según `server/src/db/README.md`. En una base existente: `06`, luego `03`, `04` y `05` |
| Analítica | `pip install -r requirements.txt` · `uvicorn main:app --host 127.0.0.1 --port 8000` (en el VPS, con PM2) |
| Conciliación nocturna | Copiar `deploy/systemd/academia-replica.service` y `.timer` a `/etc/systemd/system/` y `systemctl enable --now academia-replica.timer`, solo después de una comparación inicial sin diferencias |

El despliegue en el VPS del colegio está documentado paso a paso en `deploy/MANUAL-DESPLIEGUE-CERMAT.md` del repositorio de la plataforma: usuario de servicio, PM2, Nginx, HTTPS, respaldo diario, conciliación nocturna y verificación. Cada paquete del VPS lleva huellas SHA-256 y un bloque que se detiene ante el primer error sin dejar apagados los servicios.

**Orden al actualizar.** Cada entrega declara el suyo, porque depende de qué combinación de versiones falla. El manual lo resume en una tabla con lo que se rompe en cada caso (§5.2).

| Entrega | Orden | Motivo |
|---|---|---|
| 2026-10-24 (reglas corregidas) | Frontend → reglas → migraciones con servicios detenidos → API y analítica | Las reglas nuevas exigen la invitación que solo envía el frontend nuevo |
| 2026-10-28/30 (comprobantes y seguridad de accesos) | Frontend → reglas → migración de accesos en el VPS | Con las reglas anteriores solo fallan acciones del admin, que es quien despliega |
| 2026-11-12 (QR rotativo, docentes, talleres, Estado de cuenta) | Reglas → frontend → paquete del VPS | Con el frontend nuevo y las reglas anteriores, ningún docente podría marcar |
| 2026-11-15 (acceso directo y Usuarios) | API en el VPS → `config/accesos` en modo invitación → reglas → frontend → apagar la invitación | Así ningún alumno se queda sin acceso mientras cambia el modo |

Los cuatro pasos de la primera entrega se cumplieron en este orden el 2026-10-24. Los pasos 1 y 2 se verificaron en producción ([E4 §2.7](e4-calidad-operacion-ce024.md#27-cierre-en-produccion-2026-10-24)). Los pasos 3 y 4 se hicieron entre las 16:29 y las 16:40 (UTC−5): migraciones en la base real con respaldo previo, y la API y la analítica en línea con PM2, cada una con su cuenta de mínimo privilegio ([E2 §2.3](e2-base-datos-ce022.md#23-evidencias-de-creacion)). Después de cada publicación se verifica la versión en producción (bundle y cabeceras), porque Vercel puede bloquear un despliegue sin que el push lo muestre. Esa misma noche la capa relacional pasó al VPS del colegio. La migración 05 y la corrección de la collation se aplicaron allí a las 22:06, con los servicios detenidos, y la prueba de punta a punta de las 22:10 y 22:11 dio 200 ([E4 §2.8](e4-calidad-operacion-ce024.md#28-analisis-del-incidente-sincronizacion-con-el-vps-inc-06)).

### 4.2 Configuración requerida (solo nombres de variables)

| Componente | Variables |
|---|---|
| Frontend | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` |
| API | `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER` (`cermat_api`), `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `FIREBASE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS`, `CORS_ORIGINS` (incluye el dominio de Vercel), `HOST` (127.0.0.1 en el VPS), `TRUST_PROXY` (`loopback`, detrás de Nginx) y, opcional, `DOMINIO_CUENTAS_ALUMNOS` (por defecto `cermatacademia.edu.pe`) |
| Firestore (`config`) | `config/services` (direcciones de la API y la analítica), `config/accesos.invitacionAlumnos` (modo de acceso de los alumnos) y la configuración institucional de inscripción y pago |
| Analítica | `MYSQL_*` (`cermat_analitica`), `ALLOWED_ORIGINS`, `FIREBASE_SERVICE_ACCOUNT_PATH` |
| Respaldo | `BACKUP_MYSQL_USER` (`cermat_respaldo`), `BACKUP_MYSQL_PASSWORD`, `RESTORE_MYSQL_USER`, `MYSQLDUMP_PATH`, `MYSQL_PATH` |

Las contraseñas de MySQL van en `server/.env.local` y `analytics/.env.local`. No se versionan (regla `*.local`) y tienen prioridad sobre los `.env`, que siguen versionados sin contraseñas. En el VPS están en `/opt/academia/api/.env.local` y `/opt/academia/analitica/.env.local`, con permiso 600.

### 4.3 Evidencia de despliegue y ejecución

| Evidencia | Resultado |
|---|---|
| Frontend publicado | [academia-school-platform.vercel.app](https://academia-school-platform.vercel.app) responde 200 (capturas del 2026-10-24). Desde el 2026-10-24 producción corre la versión de esta iteración, con las cabeceras de seguridad ([E4 §2.7](e4-calidad-operacion-ce024.md#27-cierre-en-produccion-2026-10-24)). |
| Frontend en producción (2026-11-16) | El bundle publicado (`index-B3ptOLs7.js`) ya contiene textos de la entrega `f9447d8`, como «Inscripción y datos de pago»: Vercel publicó el último commit |
| API de cuentas en el VPS (2026-11-16) | `https://api-academia.cermatschool.edu.pe/api/cuentas/usuario-disponible` y `/api/usuarios` responden 401 sin sesión: las rutas están montadas y protegidas. `/health` responde 200 |
| Paquetes del VPS de noviembre | 12-nov, 20:52: marcas borradas, activación y cuentas desactivadas (`9 de 9` permisos). 12-nov, 21:07: conciliación de marcas (nada que borrar). 14-nov, 21:47: réplica reparable y temporizador, con la comparación final «coinciden» ([E2 §2.3](e2-base-datos-ce022.md#23-evidencias-de-creacion)) |
| Build de producción | `vite build` correcto (aviso de chunk mayor de 500 kB, registrado en el plan de mejora del E4) |
| Tipos | 2026-10-24: `tsc --noEmit` sin errores. 2026-11-16: 0 en la API y en el frontend, tras corregir los 34 de la entrega de matrícula masiva |
| Pruebas | 2026-10-24: 99 en verde. 2026-11-16: 150 unitarias, 96 de API, 101 de reglas y 25 de base de datos; 372 en verde con la corrección (366 en la entrega publicada) |
| Respaldo y restauración | Restauración verificada con SHA-256: RTO de 0,23 s en la base real (REC-05) y de 0,27 s en la base de prueba; en otro servidor, 0,33 s en el VPS (REC-13) y 0,41 s del VPS a la PC (REC-14) ([E2](e2-base-datos-ce022.md)) |
| Capa relacional en el VPS | `https://api-academia.cermatschool.edu.pe/health` y `https://analitica-academia.cermatschool.edu.pe/health` responden `"status":"ok"` con MySQL conectado; sincronización de punta a punta con respuesta 200 (2026-10-24, 22:10 y 22:11) |
| Respaldo diario | Temporizador de systemd en el VPS, a las 03:00 de Perú; primera ejecución correcta el 2026-10-24 a las 22:18 |
| Carga inicial de la réplica | 2026-10-24, 22:56: 10 matrículas (0 provisionales), 2 pagos y 7 asistencias en el MySQL del VPS, sin rechazos ni errores ([E2 §2.3](e2-base-datos-ce022.md#23-evidencias-de-creacion)) |
| Capturas del despliegue | 18 capturas del 2026-10-24, con los datos personales tapados ([Evidencias del despliegue](infraestructura/evidencias-despliegue-2026-10-24.md)) |

## Anexos

| Anexo | Ubicación |
|---|---|
| Repositorio fuente | `github.com/yucradavid/academia-school-platform` |
| Manual técnico breve | Sección 4 de este documento, `server/src/db/README.md` y `deploy/MANUAL-DESPLIEGUE-CERMAT.md` |
| Diseño de cada entrega | `docs/FASE_LOGICA_ROLES_REGLAS.md`, `docs/FASE_COMPROBANTES_DE_PAGO.md`, `docs/PLAN_ACCESO_DIRECTO_ALUMNOS.md` y `docs/FASE_UIX_*.md` |
| Capturas de funcionamiento | `docs/assets/capturas/` (6 capturas del sitio desplegado y 4 de los portales con sesión, con datos de prueba; sección 2.3) y [18 capturas del despliegue del 2026-10-24](infraestructura/evidencias-despliegue-2026-10-24.md) |
| Evidencia de despliegue | URL de Vercel, `vercel.json`, `firebase.json`, `.github/workflows/ci.yml` |
| Evidencia de sustentación | Pendiente (ver [Guía de sustentación](e5-presentacion-sustentacion-ce0217.md)) |

## Rúbrica de Evaluación

| Criterio | Excelente | Bueno | Regular | Deficiente |
|---|---|---|---|---|
| Arquitectura e integración del sistema | Arquitectura clara e integración completa | Integración funcional | Integración parcial | Sin integración |
| Funcionalidad del sistema | Sistema completamente operativo | Funcionalidad mayormente correcta | Funcionalidad incompleta | No cumple requerimientos |
| Integración entre capas y servicios | Comunicación fluida entre componentes | Integración funcional | Integración parcial | Componentes aislados |
| Calidad del código | Código limpio y modular | Código estructurado | Código poco organizado | Código deficiente |
| Desempeño y comportamiento del sistema | Sistema eficiente | Rendimiento aceptable | Problemas de rendimiento | Sistema inestable |
| Escalabilidad y diseño técnico | Diseño preparado para escalar | Escalabilidad parcial | Diseño rígido | No escalable |
| Sustentación y defensa técnica | Explica y defiende con dominio las decisiones tomadas | Explica con solvencia | Explica con dificultad | No sustenta |
