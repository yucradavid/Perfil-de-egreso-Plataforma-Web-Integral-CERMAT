# Producto Final S2 · Informe de Implementación Integral y Operativa

!!! abstract "Informe integral del Semestre 2 y evaluación de cierre de la línea"
    Integra los tres entregables del semestre: el SGSI ([S2-E1](s2-e1-sgsi-ce0321-ce0324.md)), la implementación y las pruebas de red ([S2-E2](s2-e2-implementacion-red-ce0312-ce0313.md)) y la implementación y el control del centro de datos ([S2-E3](s2-e3-implementacion-control-cd-ce0332-ce0333.md)). Incluye la presentación ejecutiva, las evidencias unificadas, la trazabilidad con el [diseño consolidado del Semestre 1](s1-producto-final.md) y la evaluación de cierre de la línea de Infraestructura.

## Portada

| Campo | Detalle |
|---|---|
| Título | Informe de implementación integral y operativa de la infraestructura híbrida de CERMAT |
| Entregable | Producto final del Semestre 2 (CE031, CE032 y CE033) |
| Estudiantes | David Robert Yucra Mamani (líder), Gladys Rosaura Yana Pari, Denilson Leeke Mamani Flores, Cárdenas Vilca Rennzo |
| Semestre | 2026-2 (9° ciclo), UPeU campus Juliaca, sección g1 |
| Fecha | 2026-10-24 |
| Versión | 2.0 |

**Productos**

| Producto | Formato sugerido por la guía | Entregado | Estado |
|---|---|---|---|
| Informe integral | PDF consolidado | Este documento y los tres entregables; el [PDF completo del sitio](../assets/perfil-egreso-completo.pdf) se genera desde la vista de impresión | Entregado (versión del 2026-10-24; se regenera tras cada cambio) |
| Demo, video o recorrido técnico | Video o demostración en vivo | Guion en la sección 11 | **Grabación pendiente** |

## Resumen ejecutivo

**Qué se diseñó.** Una arquitectura de seguridad híbrida con tres dominios:

- Sede principal segmentada y virtualizada: Proxmox VE equivalente a ESXi, OPNsense con Suricata, honeypot y Wazuh.
- Nube IaaS: el VPS de RackNerd como equivalente de EC2 en una VPC.
- Nube PaaS: Vercel y Firebase.

Los tres se integran por un túnel IPsec IKEv2 con AES-256-GCM y PFS.

**Qué está implementado y verificado.**

- La **nube**: VPS con firewall de host, TLS 1.2/1.3, redirección a HTTPS y base de datos solo en loopback, y la plataforma PaaS con HSTS y, desde el 2026-10-24, con cabeceras de seguridad y las reglas de Firestore corregidas publicadas. Verificado el 2026-10-24.
- La **capa de datos de la academia**: migraciones aplicadas en la base real, cuentas de mínimo privilegio, auditoría y respaldo con restauración probada (RTO de 0,23 s en la base real y 0,27–0,38 s en la base de prueba).
- Las **pruebas automáticas** de reglas, API y base de datos.
- El **SGSI completo**: 33 activos, 29 riesgos, una SoA de 93 controles, 6 políticas y procedimientos y una auditoría interna real con 11 hallazgos.

**Qué está pendiente.** Todo lo que requiere el hardware de la sede: hipervisor, VM, OPNsense, VLAN, VPN, Suricata, honeypot y Wazuh. Cada componente tiene procedimiento, configuración sin secretos, criterio de aceptación y evidencia por adjuntar.

**Qué se cerró el 2026-10-24.** La auditoría encontró fallas reales y activas, y las dos más graves se cerraron el mismo día:

- **Reglas de Firestore:** se publicaron el frontend y las reglas corregidas, y se verificó como visitante sin sesión que las matrículas pagadas ya no se pueden listar (403). La pre-matrícula pública volvió a funcionar.
- **Clave de servicio de los ZIP versionados:** fue revocada y reemplazada, y las contraseñas de las cuentas de `teachers.json` se restablecieron.

**Qué sigue siendo urgente** antes de la sustentación:

- Respaldos del VPS y de Firestore sin implantar.
- Dominio sin SPF ni DMARC y MFA no verificado.

## 1. Presentación ejecutiva

| Pregunta | Respuesta |
|---|---|
| ¿Qué problema resuelve? | Servicios críticos en la nube sin perímetro en la sede, sin canal privado entre la sede y el VPS, sin detección ni respaldo externo |
| ¿Qué entrega hoy? | Perímetro y cifrado verificados en la nube; capa de datos con mínimo privilegio y restauración probada; SGSI con trazabilidad completa; diseño on-premise listo para ejecutar |
| ¿Cuánto cuesta? | VPS de US$ 35,99 al año (ya contratado); software on-premise US$ 0; hardware por cotizar, sin presupuesto aprobado |
| ¿Qué riesgos quedan? | 4 críticos sin tratar todavía (R-04, R-07, R-11 y R-12); R-01 a R-03 se trataron el 2026-10-24. Con el plan, 11 residuales medios para aceptar |
| ¿Qué se pide a la Dirección? | Aprobar las políticas; designar roles; autorizar las pruebas; aceptar los riesgos residuales medios (incluidos los `.env` versionados sin contraseñas); decidir la compra del hardware |

## 2. Evidencias unificadas

| Dominio | Evidencia | Tipo | Ubicación |
|---|---|---|---|
| Red (nube) | UFW con entrada denegada; PostgreSQL en loopback | Real (manual del 2026-10-17) | S2-E2 §4.1; PR-01 y PR-02 |
| Red (nube) | Redirección 301/308, TLS 1.0/1.1 rechazados, TLS 1.2/1.3 con AEAD, certificados vigentes, `/.env` con 403 | Real (verificación del 2026-10-24) | S2-E2, Anexo B; PR-03 a PR-09 y PR-13 |
| Red (nube) | Brechas: cabeceras de seguridad ausentes en el colegio (la academia las publicó el 2026-10-24); dominio sin CAA, SPF, DMARC ni DNSSEC | Real (verificación del 2026-10-24) | PR-10 y PR-12 |
| Red (sede) | Procedimientos de VPN, OPNsense, Suricata, Cowrie y Wazuh | Pendiente de ejecución | S2-E2 §3 a §7 |
| Centro de datos (nube) | VPS equivalente a EC2 y su configuración | Real (manual) | S2-E3 §4.1 |
| Centro de datos (sede) | Configuración de red de Proxmox, comandos `qm`, PBS y migración | Pendiente de ejecución | S2-E3 §3 |
| Continuidad | REC-01 a REC-05: restauración con SHA-256 y RTO medido | Real (base de prueba y base real, REC-05) | S2-E3 §7.2; registro XLSX |
| Seguridad de aplicación | 19 pruebas de reglas (10 fallaban con las reglas de junio; 0 fallas observadas en producción desde el 2026-10-24), 18 de API y 19 de base de datos | Real | [E4 de Ingeniería de Software](../e4-calidad-operacion-ce024.md) |
| SGSI | Inventario, riesgos, SoA, políticas, auditoría y no conformidades | Real (documental) y auditoría del 2026-10-24 | S2-E1 |
| Ética | Declaración de ética y autorización de pruebas | Pendiente de firma | S2-E1 §12 |

## 3. Análisis de riesgos

29 riesgos evaluados con ISO/IEC 27005: 7 críticos, 10 altos y 12 medios. 16 provienen de hallazgos reales. Tras el tratamiento quedarían 18 bajos y 11 medios.

| Riesgo crítico | Nivel | Tratamiento | Plazo | Estado |
|---|---|---|---|---|
| R-01 Datos personales listables sin sesión | 20 | Publicar las reglas corregidas y verificar en producción | 2026-10-31 | Tratado (2026-10-24) |
| R-02 Auto-asignación de rol | 16 | Publicar las reglas y revisar los perfiles | 2026-10-31 | Tratado (2026-10-24); falta revisar los perfiles |
| R-04 Cambios de seguridad que no llegan a producción | 16 | Publicación solo por CI y comparación mensual | 2026-11-07 | En curso (falta el secreto del CI) |
| R-03 Matrícula pública bloqueada | 15 | Publicar las reglas y hacer una matrícula de prueba | 2026-10-31 | Tratado (2026-10-24) |
| R-07 Pérdida de datos del colegio | 15 | `pg_dump` diario, copia externa y restauración mensual | 2026-11-07 | Pendiente |
| R-11 Toma de cuentas por phishing | 15 | MFA, SPF, DKIM y DMARC | 2026-10-31 | Pendiente |
| R-12 Acceso SSH no autorizado al VPS | 15 | Verificar solo llaves, fail2ban y SSH por VPN | 2026-11-07 | Pendiente |

Detalle completo en [S2-E1 §6 y §7](s2-e1-sgsi-ce0321-ce0324.md) y en [s2-e1-matriz-riesgos.xlsx](../assets/infraestructura/s2-e1-matriz-riesgos.xlsx).

## 4. Declaración de Aplicabilidad

| Tema | Controles | Implementado | Parcial | Planificado | No aplicable |
|---|---|---|---|---|---|
| 5. Organizacionales | 37 | 4 | 22 | 11 | 0 |
| 6. De personas | 8 | 0 | 2 | 6 | 0 |
| 7. Físicos | 14 | 0 | 0 | 14 | 0 |
| 8. Tecnológicos | 34 | 5 | 22 | 6 | 1 |
| Total | 93 | 9 | 46 | 37 | 1 |

Implementados con evidencia: 5.9, 5.12, 5.27, 5.37, 8.11, 8.26, 8.29, 8.33 y 8.34. Excluido: 8.30. Detalle en [S2-E1 §8](s2-e1-sgsi-ce0321-ce0324.md) y en [s2-e1-declaracion-aplicabilidad.xlsx](../assets/infraestructura/s2-e1-declaracion-aplicabilidad.xlsx).

## 5. Declaración ética

La declaración de ética de seguridad ([S2-E1 §12.7](s2-e1-sgsi-ce0321-ce0324.md)) y la declaración de responsabilidad ética del Semestre 1 ([Producto final S1 §11](s1-producto-final.md)) están **pendientes de firma** por los 4 integrantes. El comportamiento observado es coherente con ellas:

- Pruebas en el emulador y en bases de prueba.
- Auditoría de producción en modo solo lectura.
- Indicadores con conteos agregados.
- Verificación externa no intrusiva.
- Secretos reportados sin rutas exactas.

## 6. Pruebas

| Tipo | Total | Con resultado real | Pendientes |
|---|---:|---:|---:|
| Pruebas de red y perímetro (PR) | 37 | 11 conformes y 2 no conformes | 24 |
| Pruebas de recuperación (REC) | 12 | 5 | 7 |
| Pruebas automáticas de software (E4) | 90 | 90 en verde con las reglas corregidas | Primera ejecución del CI en GitHub |

Incluyen pruebas positivas (permitido), negativas (denegado, rechazo de un respaldo alterado, negativa a restaurar sobre producción) y de detección (pendientes).

## 7. Monitoreo

| Aspecto | Estado |
|---|---|
| Disponibilidad de la API y de MySQL (`/health` y panel de infraestructura) | Implementado |
| Rutinas de operación del VPS (diaria, semanal y mensual) | Documentado en el manual |
| Registros locales (morgan, Nginx y autenticación) | Implementado, sin centralizar |
| Uptime Kuma con latido externo | Pendiente (puede desplegarse de forma transitoria en la PC local) |
| Netdata y Wazuh | Pendientes (requieren el host) |

## 8. Respaldo y recuperación

| Sistema | Respaldo | Restauración probada | RTO objetivo / medido |
|---|---|---|---|
| MySQL de la academia | `backup.js` con SHA-256 (falta programarlo a diario) | Sí: REC-01 a REC-04 en base de prueba y REC-05 en la base real | < 1 h / 0,23 s (base real) |
| PostgreSQL del colegio | Diseñado, no implantado | No | 2 h / pendiente |
| Firestore | No programado | No | 4 h / pendiente |
| VM de la sede | PBS (diseñado) | No | 2 h / pendiente |
| SPA en Vercel | Código en Git y despliegues anteriores | No ensayada | 15 min / pendiente |

## 9. Recomendaciones finales

| N° | Recomendación | Riesgo o NC | Plazo |
|---|---|---|---|
| 1 | Publicar las reglas de Firestore corregidas por el CI **antes de difundir el sitio de documentación actualizado** y verificar una matrícula sin sesión | R-01 a R-04, NC-01 y NC-02 | Hecho (2026-10-24), desde la consola; la publicación por CI sigue en R-04 |
| 2 | Revocar y rotar la clave de la cuenta de servicio; retirar todas las copias ZIP y depurar el historial; agregar escaneo de secretos al CI | R-05, R-06 y NC-03 | Rotación hecha (2026-10-24); copias ZIP a cargo del equipo; escaneo en el CI 2026-11-07 |
| 3 | Activar MFA en Google, GitHub, Vercel, RackNerd y Punto.pe; publicar SPF, DKIM y DMARC | R-11 y NC-07 | 2026-10-31 |
| 4 | Implantar `pg_dump` diario en el VPS con copia externa y ejecutar REC-06 | R-07 y NC-04 | 2026-11-07 |
| 5 | Agregar cabeceras de seguridad y `server_tokens off`; verificar SSH e instalar fail2ban; publicar CAA | R-12 a R-14 | Academia: cabeceras publicadas (2026-10-24). Colegio: 2026-11-07 a 2026-11-14 |
| 6 | Desplegar Uptime Kuma (de forma transitoria) con latido externo y medir la disponibilidad | R-09 y NC-05 | 2026-11-14 |
| 7 | Programar la exportación de Firestore y ejecutar REC-11 | R-10 y NC-06 | 2026-11-21 |
| 8 | Montar un laboratorio con Proxmox para ejecutar PR-14 a PR-35, REC-07, REC-09 y REC-12, rotulando la evidencia como de laboratorio | R-15, R-16 y R-20 | 2026-11-21 |
| 9 | Realizar la revisión por la dirección: aprobar las políticas, designar roles, aceptar los riesgos residuales y decidir el presupuesto | Cláusula 9.3 | Semana del 2026-11-23 |
| 10 | Adquirir el hardware y ejecutar la fase 2 en la sede | R-15 a R-19, R-26 y R-28 | 2027-I |

## 10. Trazabilidad con el diseño técnico consolidado del Semestre 1

| Elemento del diseño (S1) | Implementación o evidencia (S2) | Estado |
|---|---|---|
| Zonas y VLAN (S1-E1 §8) | Procedimiento de OPNsense, switch y Wi-Fi (S2-E2 §4.2); pruebas PR-14 a PR-23 | Pendiente |
| Perímetro de la nube (UFW-01 a UFW-05) | PR-01 y PR-02 | Implementado |
| Cifrado en tránsito | PR-03 a PR-07 y PR-13 | Implementado y verificado |
| VPN IPsec (S1-E1 §10) | Procedimiento y configuración sin secretos (S2-E2 §3) | Pendiente |
| Detección (S1-E1 §14) | Procedimientos de Suricata, Cowrie y Wazuh (S2-E2 §6) | Pendiente |
| Host y VM (S1-E2 §5 y §6) | Procedimiento de Proxmox (S2-E3 §3) | Pendiente |
| Nube equivalente a AWS (S1-E2 §7) | VPS, UFW y PaaS (S2-E3 §4) | Implementado (NACL y `dum0` pendientes) |
| Integración híbrida (S1-E2 §8) | Proxy de la API y túnel (S2-E3 §4.4) | Pendiente |
| Continuidad 3-2-1 y RTO/RPO (S1-E2 §11) | REC-01 a REC-05 ejecutados; REC-06 a REC-12 pendientes (S2-E3 §7 y §8) | Parcial |
| Requisitos RQ-01 a RQ-15 (Producto final S1 §6) | Verificaciones asignadas por requisito | Parcial |
| Riesgos y controles | SoA y matriz maestra (S2-E1 §8 y §14.2) | Establecido |

## 11. Guion del recorrido técnico (demo)

**Estado: grabación pendiente.** Duración objetivo: 12 minutos.

| Minuto | Contenido | Evidencia mostrada |
|---|---|---|
| 0–2 | Problema y arquitectura híbrida | Diagramas draw.io de topología general y zonas |
| 2–4 | Perímetro de la nube en vivo | `curl -I` (redirección, cabeceras) y `openssl s_client` (TLS) contra los dominios propios; captura de `ufw status verbose` |
| 4–6 | Seguridad de aplicación | Suite de 19 pruebas en el emulador: 19/19 con las reglas corregidas y 10 fallas con las de junio; consulta sin sesión que hoy devuelve 403 en producción |
| 6–8 | Recuperación en vivo | `node scripts/backup.js` y `node scripts/restore.js` en la base de prueba, con el RTO medido y la línea del registro |
| 8–10 | SGSI | Del riesgo R-01 al control 5.15 de la SoA y a su evidencia, con la no conformidad NC-01, su acción y su cierre del 2026-10-24 |
| 10–12 | Pendientes y plan | Hoja de ruta, laboratorio y decisiones que se piden a la Dirección |

## 12. Evaluación de cierre de la línea

La guía exige demostrar coherencia entre requerimientos, diseño, implementación, seguridad, operación, monitoreo, documentación, repositorio técnico y sustentación. La tabla resume la evidencia disponible y la brecha de cada aspecto. No es una autoevaluación: el nivel lo asigna el jurado.

| Aspecto | Evidencia disponible | Brecha pendiente |
|---|---|---|
| Requerimientos | 15 requisitos trazados a diseño y prueba (Producto final S1 §6) | Validar los supuestos con mediciones (ISP, energía y carga) |
| Diseño | Red, centro de datos, equivalencias, matrices y diagramas editables (S1) | — |
| Implementación | Nube y capa de datos operativas | Sede on-premise, VPN y detección |
| Seguridad | SGSI con riesgos, SoA, políticas y auditoría real; mínimo privilegio en las bases | Cerrar NC-04 a NC-08 (NC-01 a NC-03 se cerraron el 2026-10-24) |
| Operación | Procedimientos del VPS; respaldo y restauración de MySQL | Respaldos del VPS y de Firestore; laboratorio |
| Monitoreo | `/health` y registros locales | Uptime Kuma, Netdata y Wazuh |
| Documentación | 8 documentos versionados con evidencia y pendientes declarados; PDF consolidado | Adjuntar capturas del laboratorio |
| Repositorio técnico | Scripts, CI, pruebas, matrices reproducibles y diagramas | Carpeta `infra/` con configuraciones sanitizadas; limpiar secretos del historial |
| Sustentación | Guion del recorrido técnico | Grabación y defensa individual |

**Pregunta central de la guía:** *¿el estudiante puede diseñar, implementar, validar, operar y defender una solución de infraestructura tecnológica híbrida con criterio profesional, responsabilidad ética y evidencia técnica verificable?*

Respuesta basada en la evidencia:

- **Diseñar:** demostrado con un diseño completo, trazable y con equivalencias justificadas.
- **Implementar, validar y operar:** demostrado en la nube y en la capa de datos, con verificaciones reproducibles y una restauración medida. En la sede queda pendiente de hardware, con procedimientos listos.
- **Responsabilidad ética:** practicada (pruebas acotadas, sin datos ni secretos expuestos y hallazgos propios reportados), con las firmas pendientes.
- **Defender:** se completará en la sustentación.

## Rúbricas aplicables

La guía no define una rúbrica propia para el producto final del Semestre 2; se evalúa con las rúbricas de los entregables que integra y con la evaluación de cierre de la sección 12.

**S2-E1 · CE0321–CE0324 — Planificación e Implementación del SGSI**

| N° | Criterio de evaluación | Peso |
| ---: | --- | ---: |
| 1 | Contexto, alcance y liderazgo del SGSI | 10% |
| 2 | Inventario de activos y clasificación de información | 10% |
| 3 | Evaluación y tratamiento de riesgos (ISO/IEC 27005) | 18% |
| 4 | Declaración de Aplicabilidad (SoA) y selección de controles | 12% |
| 5 | Políticas y procedimientos del SGSI | 10% |
| 6 | Gestión de identidades, accesos y protección de datos (gobernanza) | 8% |
| 7 | Gestión de incidentes, continuidad y recuperación (planificación) | 8% |
| 8 | Ética de la seguridad de la información | 8% |
| 9 | Monitoreo, medición y auditoría interna del SGSI | 9% |
| 10 | Calidad documental y sustentación | 7% |
|  | **Total** | **100%** |

**S2-E2 · CE0312–CE0313 — Implementación, Testing y Monitoreo de Red**

| N° | Criterio de evaluación | Peso |
| ---: | --- | ---: |
| 1 | Trazabilidad con el diseño de red (Semestre 1) | 6% |
| 2 | Conectividad híbrida implementada: VPN y enrutamiento | 15% |
| 3 | Seguridad perimetral implementada: firewall, DMZ y segmentación | 22% |
| 4 | IDS/IPS, honeypot y detección implementados | 18% |
| 5 | Monitoreo, registros y visibilidad de red | 15% |
| 6 | Plan y resultados de pruebas técnicas | 12% |
| 7 | Calidad documental, evidencias y repositorio | 6% |
| 8 | Sustentación técnica | 6% |
|  | **Total** | **100%** |

**S2-E3 · CE0332–CE0333 — Implementación, Gestión y Control de Centro de Datos**

| N° | Criterio de evaluación | Peso |
| ---: | --- | ---: |
| 1 | Trazabilidad con el diseño de centro de datos (Semestre 1) | 6% |
| 2 | Implementación on-premise: hipervisor ESXi y VMs | 18% |
| 3 | Implementación AWS: VPC, EC2, Security Groups y NACL | 18% |
| 4 | Gestión de identidades y accesos del centro de datos | 14% |
| 5 | Inventario final de activos con evidencia | 12% |
| 6 | Continuidad: backup, restore y recuperación probada | 14% |
| 7 | Monitoreo y control operativo del centro de datos | 10% |
| 8 | Calidad documental, control de versiones y sustentación | 8% |
|  | **Total** | **100%** |

Escala: Excelente 4, Logrado 3, En proceso 2, Insuficiente 1 y No evidenciado 0. Puntaje = peso × (nivel / 4).
