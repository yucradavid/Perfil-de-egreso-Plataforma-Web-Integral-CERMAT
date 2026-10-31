# E2 — Business Case del Proyecto (CE0113)

!!! abstract "Evidencia CE0113 — Caso de negocio"
    Justifica la viabilidad y conveniencia de **institucionalizar** la Plataforma Web Integral CERMAT. El modelo financiero completo, con fórmulas de Excel auditables, está en [business-case.xlsx](../assets/gestion-ti/business-case.xlsx) y se genera con `perfil-egreso/scripts/generar-business-case.mjs`. Todas las cifras de este documento salen de ese libro. **Advertencia:** el piloto registró solo 8 matrículas, 2 pagos y 7 marcas de asistencia; los beneficios dependen de la adopción institucional y todas las cifras estimadas son supuestos a validar con la Dirección.

## Portada

| Campo | Detalle |
|---|---|
| Título | Business case — Institucionalización de la Plataforma Web Integral de Gestión Académica CERMAT |
| Estudiantes | David Robert Yucra Mamani (líder), Gladys Rosaura Yana Pari, Denilson Leeke Mamani Flores, Cárdenas Vilca Rennzo |
| Semestre | 2026-2 (9° ciclo), UPeU campus Juliaca, sección g1 |
| Fecha | 2026-10-24 |
| Competencia | CE011 — Gestión e Innovación de TI (evidencia CE0113); aporta a CE0124 (análisis económico) |
| Horizonte | Año 0 = 2026 (inversión) y años 1 a 3 = 2027 a 2029 (operación), en soles constantes y antes de impuestos |

## Resumen ejecutivo

**Decisión que se pide a la Dirección:** adoptar la plataforma como canal oficial de matrícula, cobranza y asistencia de la academia en 2027, financiar su operación (S/ 2 438 al año en el escenario base) y aportar el tiempo de su personal para el cierre del proyecto (S/ 1 166). El desarrollo ya ejecutado es costo hundido y el cierre técnico lo realiza el equipo EPE sin desembolso de CERMAT.

| Indicador (vista A, perspectiva de CERMAT, tasa 12 %) | Pesimista | Base | Optimista |
|---|---|---|---|
| VAN | S/ −8 809 | **S/ 1 247** | S/ 13 245 |
| TIR | No calculable | **53,5 %** | 450,7 % |
| Relación beneficio/costo | 0,10 | **1,18** | 3,23 |
| ROI a 3 años | −89,6 % | **23,6 %** | 238,9 % |
| Periodo de recuperación | No se recupera en 3 años | **1,7 años** (descontado: 1,9) | 0,2 años |

1. **En el escenario base el proyecto conviene a CERMAT**, pero con margen estrecho: el VAN es cero con 40 matrículas por ciclo (el supuesto base es 60) o con una adopción sostenida de 64,1 %.
2. **Si la adopción se queda como en el piloto, el proyecto pierde dinero** (escenario pesimista): los costos fijos de operación superan los ahorros.
3. **Valorizado a precio de mercado**, el proyecto completo (S/ 21 346, incluidas las horas del equipo) no se recupera en 3 años en ningún escenario (vista B). Desarrollar a medida para una sola sede solo se paga a escala multi-sede (≈ 363 matrículas por ciclo) o con un horizonte mayor. La conveniencia actual para CERMAT se apoya en que esa inversión ya la aportó el equipo.
4. Las variables que más mueven el VAN son la **captación y retención** (que hoy dependen de desbloquear la matrícula pública en producción) y la **adopción**; el costo del hosting comercial es la principal palanca de ahorro.

**Recomendación:** aprobar la alternativa D (plataforma propia) con un **hito de continuidad el 2027-03-31**, al cierre del ciclo de verano, con los criterios de la sección 2.4.6.

## 2.1 Justificación del proyecto

### Problema que se resuelve

CERMAT gestiona la matrícula, la cobranza y la asistencia de la academia con procesos mayormente manuales (cuaderno, hojas de cálculo y WhatsApp), mientras la plataforma construida para digitalizarlos opera con adopción mínima. Hasta el 2026-10-24 sus reglas publicadas bloqueaban la matrícula en línea y exponían el listado de matrículas pagadas; ese día se publicó la versión corregida. El análisis completo del problema, sus causas raíz y su impacto está en el [E1, sección 1.4](e1-diagnostico-organizacional-ce0111.md#14-identificacion-del-problema).

### Objetivos del proyecto (SMART)

| ID | Objetivo | Indicador y fuente | Línea base | Meta | Plazo |
|---|---|---|---|---|---|
| OBJ-1 | Registrar en la plataforma las matrículas de la academia | Matrículas en `enrollments` ÷ matrículas del registro de secretaría | 8 matrículas en el piloto (ene–jul 2026); porcentaje no medido | ≥ 60 % en 2027 (promedio anual) y ≥ 80 % en 2028 | 31-12-2027 y 31-12-2028 |
| OBJ-2 | Reducir el tiempo de personal por matrícula | Minutos cronometrados en 10 trámites | ≈ 40 min (supuesto; se mide en nov-2026) | ≤ 12 min | 31-03-2027 |
| OBJ-3 | Responder rápido a cada pre-matrícula | Percentil 90 de `approvedAt` o `cancelledAt` − `createdAt` | No medible hoy (2 registros de prueba) | ≤ 24 h | Campaña 2027 |
| OBJ-4 | Publicar solo versiones seguras y sin errores de cupo | Pruebas de reglas contra lo publicado; incidentes de sobrecupo o duplicado | 10 de 19 pruebas fallaban contra lo publicado hasta el 2026-10-24; 0 fallas observadas en producción tras publicar la versión corregida | 19 de 19 y 0 incidentes | Desde el 06-11-2026 |
| OBJ-5 | Confirmar el valor económico con datos reales | VAN de la vista A recalculado con volumen, adopción y tiempos medidos | VAN base proyectado: S/ 1 247 | VAN ≥ 0 | 31-03-2027 y 31-12-2027 |

### Beneficios esperados

Menos tiempo de secretaría y de la Dirección por matrícula, pagos y reportes; asistencia consolidada sin trabajo manual; padres que consultan solos; matrículas captadas fuera del horario de atención; alumnos retenidos gracias a las alertas de inasistencia y menor morosidad. Se cuantifican en la sección 2.3.

## 2.2 Análisis de alternativas

### Alternativas tecnológicas consideradas

| Alternativa | Descripción | Principal ventaja | Principal limitación |
|---|---|---|---|
| A. Mantener el proceso manual | Cuaderno, hojas de cálculo y WhatsApp | Sin desembolso | No controla cupos ni duplicados; sin trazabilidad ni datos para decidir |
| B. Formularios y hojas compartidas | Formularios y hojas de Google Workspace (el dominio del colegio ya usa correo de Google) | Bajo costo y rápida | Sin transacciones de cupo, sin roles por registro, sin QR ni consulta de padres; hojas compartidas por enlace |
| C. Software SaaS de gestión académica | Suscripción por alumno a un proveedor | Soporte del proveedor | Modelo de colegio genérico (no ciclos, grupos y turnos de academia); datos y reglas fuera del control de CERMAT; costo recurrente en dólares |
| D. Plataforma propia (**elegida**) | La plataforma ya construida, con cierre técnico y adopción | Ajuste exacto al proceso; ya probada (99 pruebas) | Depende de mantenimiento propio y de la adopción |
| E. Extender el sistema del colegio | Construir los módulos de la academia en Laravel y Angular | Integración nativa con el colegio | Rehacer ≈ 400 h de trabajo; no estaría lista para la campaña 2027 |

### Criterios de evaluación

| Criterio | Peso | Cómo se puntúa (1 a 5) |
|---|---|---|
| C1 Ajuste al proceso de CERMAT (ciclos, grupos, sedes, turnos, cuotas, QR, código de padres) | 25 % | 5 = cubre todo sin adaptación; 1 = no cubre el proceso |
| C2 Costo incremental para CERMAT a 3 años (valor actual) | 20 % | Regla de la hoja Alternativas: ≤ S/ 2 000 = 5; ≤ 5 000 = 4; ≤ 8 000 = 3; ≤ 12 000 = 2; > 12 000 = 1 |
| C3 Control de cupos y calidad de datos | 15 % | 5 = cupo y duplicados garantizados por transacción; 1 = control manual |
| C4 Seguridad y protección de datos (roles, Ley N.° 29733) | 15 % | 5 = control de acceso por rol verificado con pruebas; 1 = sin control |
| C5 Integración con el ecosistema y escalabilidad multi-sede | 15 % | 5 = integración nativa; 1 = sistema aislado |
| C6 Tiempo y riesgo de puesta en marcha para la campaña 2027 | 10 % | 5 = disponible hoy; 1 = más de 6 meses |

### Matriz comparativa

**Costo incremental para CERMAT a 3 años** (hoja Alternativas; VA al 12 %):

| Alternativa | Inversión inicial | Costo anual | VA del costo a 3 años | Puntaje C2 |
|---|---|---|---|---|
| A. Manual | S/ 0 | S/ 0 | S/ 0 | 5 |
| B. Formularios y hojas | S/ 500 | S/ 300 | S/ 1 221 | 5 |
| C. SaaS | S/ 500 | S/ 4 896 | S/ 12 259 | 1 |
| D. Plataforma propia | S/ 1 166 | S/ 2 438 | S/ 7 023 | 3 |
| E. Extender el sistema del colegio | S/ 10 000 | S/ 900 | S/ 12 162 | 1 |

**Matriz ponderada:**

| Alternativa | C1 (25 %) | C2 (20 %) | C3 (15 %) | C4 (15 %) | C5 (15 %) | C6 (10 %) | Total |
|---|---|---|---|---|---|---|---|
| A. Manual | 2 | 5 | 1 | 2 | 1 | 5 | 2,60 |
| B. Formularios y hojas | 2 | 5 | 2 | 2 | 2 | 5 | 2,90 |
| C. SaaS | 3 | 1 | 4 | 3 | 2 | 3 | 2,60 |
| **D. Plataforma propia** | **5** | **3** | **5** | **4** | **4** | **4** | **4,20** |
| E. Extender el sistema del colegio | 3 | 1 | 4 | 4 | 5 | 1 | 3,00 |

**Justificación de los puntajes de D y de su competidora más cercana (E):** D obtiene 5 en C1 porque modela ciclos, grupos, sedes, turnos, cuotas, QR y código de padres; 5 en C3 porque la matrícula valida cupo y duplicado en una transacción con id determinístico (cubierto por 6 pruebas de reglas); 4 en C4 porque el control por rol está probado (19 pruebas) pero la versión publicada aún no lo aplica; 4 en C5 porque ya replica a MySQL por API y la integración con el colegio está diseñada pero no hecha; 4 en C6 porque existe y solo falta un cierre de 6 semanas. E obtiene 5 en integración, pero 1 en costo y en tiempo.

**Robustez:** se subió 10 puntos el peso de cada criterio y se reescalaron los demás (6 variantes). D queda primera en **6 de 6**. La decisión no depende de un peso en particular.

**Decisión:** alternativa D. B es la opción de menor costo, pero no resuelve el control de cupos ni la protección de datos, que son parte del problema.

## 2.3 Evaluación de beneficios

### Beneficios cuantificables

Fórmulas con la adopción α de cada año (supuestos en la sección 2.4.1). Valores del escenario base.

| ID | Beneficio | Mecanismo y fórmula | Año 1 | Año 2 | Año 3 |
|---|---|---|---|---|---|
| B1 | Tiempo de secretaría y de la Dirección en la matrícula | α × matrículas al año × (25 min × S/ 10 por h + 4,5 min × S/ 30 por h); tiempos del [E4](e4-modelado-procesos-ce0131.md) | S/ 693 | S/ 924 | S/ 1 040 |
| B2 | Registro de pagos y reporte de gestión | α × (matrículas × 2 pagos × 5 min + 3 h al mes) × S/ 10 por h | S/ 396 | S/ 528 | S/ 594 |
| B3 | Consolidación de asistencia y consultas de padres | α × (10 min × 200 días + alumnos × 1 consulta × 10 meses × 5 min × 50 % resueltas con el código) × S/ 10 por h | S/ 350 | S/ 467 | S/ 525 |
| B4 | Matrículas adicionales captadas en línea y alumnos retenidos | α × 3 ciclos × S/ 400 × 60 % de margen × (2 adicionales + 1 retenido × 50 %) | S/ 1 080 | S/ 1 440 | S/ 1 620 |
| B5 | Menor morosidad | α × matrículas × S/ 400 × 0,5 puntos | S/ 216 | S/ 288 | S/ 324 |
| | **Total** | | **S/ 2 735** | **S/ 3 647** | **S/ 4 103** |

B1 a B3 son **ahorros de tiempo**: el personal se reasigna a la atención, no se reduce planilla. B4 y B5 son **ingresos protegidos o adicionales** y dependen de que la matrícula pública vuelva a funcionar en producción y de que se usen las alertas de inasistencia.

### Beneficios cualitativos

| Beneficio | Destinatario | Cómo se evidencia |
|---|---|---|
| Cumplimiento de la Ley N.° 29733 y menor riesgo de sanción | Dirección | Reglas corregidas publicadas; política de privacidad e inscripción del banco de datos |
| Confianza de las familias | Padres | Consultas por código; confirmación inmediata de la matrícula |
| Trazabilidad y auditoría | Dirección | Quién aprobó, canceló o anuló y cuándo (`approvedBy`, `approvedAt` y triggers de auditoría en MySQL) |
| Datos para decidir | Dirección | Vistas de estado de cuenta, asistencia diaria y riesgo de abandono |
| Imagen institucional moderna | Postulantes | Sitio público con oferta y matrícula en línea |
| Base para integrar colegio y academia | CERMAT | Roadmap RM-08 a RM-11 ([E1](e1-diagnostico-organizacional-ce0111.md#15-roadmap-de-tecnologia-ce0114)) |
| Menos papel | Todos | Fichas y listas digitales |

### Indicadores de valor

| Indicador | Fórmula | Línea base real | Meta 2027 |
|---|---|---|---|
| Adopción | Matrículas en la plataforma ÷ matrículas totales | 8 matrículas en la plataforma; total por medir | ≥ 60 % |
| Minutos de personal por matrícula | Cronometraje de 10 trámites | Por medir (supuesto 40 min) | ≤ 12 min |
| Tiempo de respuesta a la pre-matrícula (p90) | `approvedAt` o `cancelledAt` − `createdAt` | No medible (2 registros de prueba) | ≤ 24 h |
| Matrículas originadas en línea por ciclo | Pre-matrículas públicas que pasan a pagadas | Por medir | ≥ 2 adicionales por ciclo |
| Consultas de padres | Alumnos con al menos una consulta por código en el mes ÷ alumnos activos | 0 | ≥ 50 % |
| Morosidad | Saldo vencido ÷ ingreso del ciclo | Por medir | −0,5 puntos |
| VAN recalculado (vista A) | Libro con datos reales | S/ 1 247 (proyectado) | ≥ 0 |

## 2.4 Estimación de costos

### 2.4.1 Supuestos del modelo

Los costos **reales conocidos** son: VPS RackNerd US$ 35,99 al año; Vercel en plan Hobby US$ 0 (sus términos lo limitan a uso personal no comercial, por lo que el uso institucional corresponde al plan Pro, de pago por miembro, que se toma como **supuesto de costo**); Firebase en plan gratuito con el uso actual. Todo lo demás es supuesto, con su fuente o criterio. Esta tabla es copia de la hoja "Supuestos" del libro; si se cambia un valor allí, todo el modelo se recalcula.

| ID | Supuesto | Unidad | Pesimista | Base | Optimista | Fuente o criterio | Estado |
|---|---|---|---|---|---|---|---|
| S01 | Tasa de descuento anual | % anual | 12,0 % | 12,0 % | 12,0 % | Costo de oportunidad del capital para una institución educativa privada pequeña; se usa por encima de la tasa social de descuento del MEF (8 %) por el riesgo privado. Validar con la Dirección o su contador. | Supuesto a validar |
| S02 | Tipo de cambio | S/ por US$ | 3,40 | 3,40 | 3,40 | Referencia de mercado 2026. Validar con el tipo de cambio venta de la SBS el día de aprobación (ver hoja Sensibilidad: ±10 %). | Supuesto a validar |
| S03 | Matrículas por ciclo (todas las vías) | matrículas | 40 | 60 | 90 | Base: 2 grupos de 30 alumnos en la sede actual. Validar con los registros de matrícula de secretaría. El piloto registró solo 8 matrículas en la plataforma entre el 2026-01-27 y el 2026-07-07. | Supuesto a validar |
| S04 | Ciclos por año | ciclos | 3 | 3 | 3 | Calendario típico de una academia preuniversitaria (verano, ciclo I y ciclo II). Validar con la Dirección. | Supuesto a validar |
| S05 | Adopción en el año 1 (2027) | % de matrículas registradas en la plataforma | 30 % | 60 % | 80 % | Depende de una disposición de la Dirección: toda matrícula se registra en línea o con el registro rápido de secretaría. Hoy la adopción real es baja (8 matrículas). | Supuesto a validar |
| S06 | Adopción en el año 2 (2028) | % de matrículas | 40 % | 80 % | 95 % | Curva de adopción con capacitación y acompañamiento. | Supuesto a validar |
| S07 | Adopción en el año 3 (2029) | % de matrículas | 50 % | 90 % | 100 % | Curva de adopción con capacitación y acompañamiento. | Supuesto a validar |
| S08 | Costo hora del personal administrativo y auxiliar | S/ por hora | 10 | 10 | 10 | Remuneración supuesta de S/ 1 300 al mes más cargas sociales (≈ 45 %) entre 192 h al mes. | Supuesto a validar |
| S09 | Costo hora de la Dirección | S/ por hora | 30 | 30 | 30 | Remuneración directiva supuesta de S/ 4 000 al mes más cargas sociales entre 192 h al mes. | Supuesto a validar |
| S10 | Costo hora docente | S/ por hora | 20 | 20 | 20 | Tarifa horaria docente supuesta. | Supuesto a validar |
| S11 | Costo hora técnico (desarrollo, operación y mantenimiento) | S/ por hora | 25 | 25 | 25 | Desarrollador junior con S/ 3 000 al mes más cargas sociales (≈ 45 %) entre 176 h al mes. | Supuesto a validar |
| S12 | Minutos de secretaría ahorrados por matrícula | min | 15 | 25 | 30 | Base calculada en la hoja Proceso (35 → 10 min). Medir con el cronometraje de 10 trámites y las marcas de tiempo del sistema (E4). | Supuesto a validar |
| S13 | Minutos de la Dirección ahorrados por matrícula | min | 3 | 4,5 | 5 | Base calculada en la hoja Proceso (5 → 0,5 min). | Supuesto a validar |
| S14 | Pagos registrados por matrícula | pagos | 2 | 2 | 2 | Promedio supuesto entre pago al contado (1) y en cuotas (2 a 3). | Supuesto a validar |
| S15 | Minutos ahorrados por pago registrado | min | 3 | 5 | 6 | Registro y conciliación manual (≈ 8 min) frente a registro en el panel con conciliación automática (≈ 3 min). | Supuesto a validar |
| S16 | Horas ahorradas al mes en el reporte de gestión | h por mes | 1,5 | 3 | 4 | Consolidar cuadernos y hojas (≈ 3,5 h) frente a consultar el panel y las vistas de MySQL (≈ 0,5 h). | Supuesto a validar |
| S17 | Minutos ahorrados por día lectivo al consolidar la asistencia | min por día | 5 | 10 | 15 | Lista en cuaderno y consolidación manual frente a registro por QR. | Supuesto a validar |
| S18 | Días lectivos por año | días | 200 | 200 | 200 | Cinco días por semana durante 40 semanas. | Supuesto a validar |
| S19 | Consultas de padres por alumno al mes | consultas | 1 | 1 | 1 | Llamadas o visitas para preguntar por asistencia o pagos. Hoy hay 0 consultas registradas en la plataforma. | Supuesto a validar |
| S20 | Minutos de personal por consulta atendida | min | 5 | 5 | 5 | Atención telefónica o presencial. | Supuesto a validar |
| S21 | Consultas resueltas con el código de padres (autoservicio) | % | 25 % | 50 % | 75 % | Consulta de asistencia por código CERMAT sin llamar a la academia. | Supuesto a validar |
| S22 | Meses con clases por año | meses | 10 | 10 | 10 | Calendario académico supuesto. | Supuesto a validar |
| S23 | Ingreso promedio por matrícula | S/ | S/ 400 | S/ 400 | S/ 400 | Supuesto; validar con el tarifario vigente de la academia. | Supuesto a validar |
| S24 | Margen de contribución de una matrícula adicional | % | 60 % | 60 % | 60 % | Docente y aula son costos fijos del grupo; el costo variable son materiales y atención. | Supuesto a validar |
| S25 | Matrículas adicionales por ciclo captadas por el canal en línea | matrículas | 0 | 2 | 4 | Pre-matrícula 24/7 desde el sitio público (desbloqueada en producción el 2026-10-24 al publicar las reglas corregidas). Medir con el origen de cada matrícula. | Supuesto a validar |
| S26 | Alumnos retenidos por ciclo gracias a las alertas de inasistencia | alumnos | 0 | 1 | 2 | Seguimiento con sp_riesgo_inasistencia y la analítica de riesgo. | Supuesto a validar |
| S27 | Fracción del ingreso del ciclo que se conserva por alumno retenido | % | 50 % | 50 % | 50 % | El abandono ocurre a mitad de ciclo en promedio (supuesto). | Supuesto a validar |
| S28 | Reducción de la morosidad | puntos del ingreso | 0,0 % | 0,5 % | 1,0 % | Visibilidad del saldo por cuota en el panel. Medir con el saldo vencido mensual. | Supuesto a validar |
| S29 | Vercel Pro por miembro al mes | US$ | US$ 20,00 | US$ 20,00 | US$ 20,00 | Precio de lista del plan Pro (pago por miembro). El plan Hobby actual (US$ 0) es solo para uso personal no comercial; el uso institucional corresponde al plan Pro. Validar al contratar. | Supuesto de costo |
| S30 | Miembros del plan Pro | miembros | 1 | 1 | 1 | Un responsable técnico publica los despliegues. | Supuesto a validar |
| S31 | VPS institucional imputado a la academia | US$ por año | US$ 35,99 | US$ 35,99 | US$ 35,99 | Costo real del plan RackNerd vigente. Se imputa completo por prudencia: copia externa de respaldos y VPN de la capa relacional (diseño CE03) o VPS puente del mismo plan mientras no exista VM-APP01. | Real (costo); imputación supuesta |
| S32 | Firebase | US$ por año | US$ 60,00 | US$ 0,00 | US$ 0,00 | Plan gratuito con el uso actual (real). El escenario pesimista reserva US$ 5 al mes por exceso de cuota o por pasar al plan Blaze. | Real (US$ 0 hoy); reserva supuesta |
| S33 | Operación: monitoreo, respaldos y usuarios | h por mes | 3 | 2 | 1,5 | Rutina diaria, semanal y mensual de operación (E5). | Supuesto a validar |
| S34 | Mantenimiento correctivo y evolutivo | h por mes | 5 | 3 | 2 | Actualización de dependencias y correcciones; el CI con 99 pruebas reduce el esfuerzo de verificación. | Supuesto a validar |
| S35 | Horas del Product Owner (Dirección) | h | 12 | 12 | 12 | Hoja Presupuesto, fila C.1. | Supuesto a validar |
| S36 | Horas de la Dirección en revisiones de sprint | h | 3 | 3 | 3 | Hoja Presupuesto, fila C.2. | Supuesto a validar |
| S37 | Horas de capacitación del personal administrativo y auxiliar | h | 9 | 9 | 9 | Hoja Presupuesto, fila C.3. | Supuesto a validar |
| S38 | Horas de capacitación docente | h | 6 | 6 | 6 | Hoja Presupuesto, fila C.4. | Supuesto a validar |
| S39 | Horas de transferencia de conocimiento al responsable técnico de CERMAT | h | 16 | 16 | 16 | Hoja Presupuesto, fila C.5. | Supuesto a validar |
| S40 | Reserva de contingencia sobre el trabajo planificado | % | 20 % | 10 % | 10 % | Práctica habitual de 10 % para trabajo con alcance conocido; 20 % en el escenario pesimista. | Supuesto a validar |
| S41 | Horas del equipo ya ejecutadas (ene a oct de 2026) | h | 640 | 640 | 640 | Hoja Presupuesto. Estimación por analogía: no hay registro de horas (brecha de estimación del E4 de Software). | Supuesto a validar |
| S42 | Horas del equipo planificadas (oct de 2026 a abr de 2027) | h | 152 | 152 | 152 | Hoja Presupuesto. | Supuesto a validar |
| S43 | Suscripción SaaS por alumno activo al mes | US$ | US$ 2,00 | US$ 2,00 | US$ 2,00 | Valor de referencia del equipo, sin cotización. Pedir al menos dos cotizaciones. | Supuesto a validar |
| S44 | Horas de configuración y migración al SaaS | h | 20 | 20 | 20 | Carga de oferta, alumnos y usuarios. | Supuesto a validar |
| S45 | Horas para configurar formularios y hojas compartidas | h | 20 | 20 | 20 | Formularios, hoja de cupos y permisos. | Supuesto a validar |
| S46 | Mantenimiento de formularios y hojas | h por mes | 1 | 1 | 1 | Ajustes por ciclo. | Supuesto a validar |
| S47 | Horas para extender el sistema del colegio a la academia | h | 400 | 400 | 400 | Rehacer en Laravel y Angular la oferta, matrícula, pagos, asistencia QR y portales (estimación del equipo). | Supuesto a validar |
| S48 | Mantenimiento del sistema extendido | h por mes | 3 | 3 | 3 | Igual esfuerzo que la plataforma propia. | Supuesto a validar |

### 2.4.2 Inversión inicial

La inversión se presenta en dos vistas. La **vista A** (decisión) contiene solo lo que CERMAT aporta: el tiempo de su personal. La **vista B** (referencia) agrega el trabajo del equipo valorizado a S/ 25 por hora, ejecutado y planificado, y coincide con el presupuesto total del proyecto del [E3, sección 3.4](e3-plan-gestion-proyecto-ce0121.md#34-gestion-de-costos).

| Rubro | Horas | Tarifa (S/ por h) | Costo | Vista |
|---|---|---|---|---|
| Product Owner designado por la Dirección | 12 | 30 | S/ 360 | A |
| Revisiones de sprint con la Dirección | 3 | 30 | S/ 90 | A |
| Capacitación del personal administrativo y auxiliar | 9 | 10 | S/ 90 | A |
| Capacitación docente | 6 | 20 | S/ 120 | A |
| Transferencia de conocimiento al responsable técnico de CERMAT | 16 | 25 | S/ 400 | A |
| Reserva de contingencia (10 %) | | | S/ 106 | A |
| **Inversión de CERMAT (año 0)** | | | **S/ 1 166** | **A** |
| Trabajo ejecutado del equipo, ene a oct de 2026 (costo hundido) | 640 | 25 | S/ 16 000 | B |
| Trabajo planificado del equipo, oct de 2026 a abr de 2027 | 152 | 25 | S/ 3 800 | B |
| Reserva de contingencia del trabajo planificado (10 %) | | | S/ 380 | B |
| **Inversión del proyecto completo (año 0)** | | | **S/ 21 346** | **B** |

**Fuera de este caso:** el host on-premise del diseño de centro de datos de CE03 (hardware por cotizar, sin presupuesto aprobado, ver [S1-E2 de Infraestructura](../infraestructura/s1-e2-diseno-centro-datos-hibrido-ce0331.md)). Sirve a todo CERMAT y a los servicios de seguridad, y la vía crítica de la plataforma está en la nube, por lo que se evalúa en su propio caso.

### 2.4.3 Costos operativos y de mantenimiento

| Rubro | Hoy | Pesimista (año) | Base (año) | Optimista (año) | Tipo |
|---|---|---|---|---|---|
| C1 Vercel Pro (1 miembro × US$ 20 × 12 meses) | US$ 0 (Hobby, no comercial) | S/ 816 | S/ 816 | S/ 816 | Operación |
| C2 VPS institucional imputado (US$ 35,99) | US$ 35,99 al año (pagado por el colegio) | S/ 122 | S/ 122 | S/ 122 | Operación |
| C3 Firebase | US$ 0 | S/ 204 | S/ 0 | S/ 0 | Operación |
| C4 Operación (h por mes × 12 × S/ 25) | No formalizada | S/ 900 | S/ 600 | S/ 450 | Operación |
| C5 Mantenimiento correctivo y evolutivo (h por mes × 12 × S/ 25) | No formalizado | S/ 1 500 | S/ 900 | S/ 600 | Mantenimiento |
| **Total anual** | | **S/ 3 542** | **S/ 2 438** | **S/ 1 988** | |

El dominio no genera costo: la institución decidió mantener la plataforma en el subdominio de Vercel, enlazado desde el sitio del colegio. Si más adelante la Dirección prefiere un subdominio del dominio `.edu.pe` que ya paga el colegio, tampoco habría costo adicional.

### 2.4.4 Flujo de caja y evaluación económica a 3 años

**Flujo de caja del escenario base** (hoja "Flujo de caja", soles):

| Concepto | Año 0 (2026) | Año 1 (2027) | Año 2 (2028) | Año 3 (2029) | Total |
|---|---|---|---|---|---|
| Adopción | — | 60 % | 80 % | 90 % | |
| Matrículas registradas en la plataforma | — | 108 | 144 | 162 | 414 |
| B1 Matrícula: tiempo de secretaría y de la Dirección | 0 | 693 | 924 | 1 040 | 2 657 |
| B2 Pagos y reporte de gestión | 0 | 396 | 528 | 594 | 1 518 |
| B3 Asistencia y consultas de padres | 0 | 350 | 467 | 525 | 1 342 |
| B4 Matrículas adicionales y alumnos retenidos | 0 | 1 080 | 1 440 | 1 620 | 4 140 |
| B5 Menor morosidad | 0 | 216 | 288 | 324 | 828 |
| **Beneficios totales** | **0** | **2 735** | **3 647** | **4 103** | **10 484** |
| C1 Vercel Pro | 0 | 816 | 816 | 816 | 2 448 |
| C2 VPS institucional imputado | 0 | 122 | 122 | 122 | 367 |
| C3 Firebase | 0 | 0 | 0 | 0 | 0 |
| C4 Operación | 0 | 600 | 600 | 600 | 1 800 |
| C5 Mantenimiento | 0 | 900 | 900 | 900 | 2 700 |
| Costos de operación y mantenimiento | 0 | 2 438 | 2 438 | 2 438 | 7 315 |
| Inversión de CERMAT | 1 166 | 0 | 0 | 0 | 1 166 |
| **Flujo neto, vista A** | **−1 166** | **297** | **1 208** | **1 664** | **2 003** |
| Flujo neto acumulado, vista A | −1 166 | −869 | 339 | 2 003 | |
| Flujo descontado al 12 %, vista A | −1 166 | 265 | 963 | 1 184 | 1 247 |
| Aporte valorizado del equipo (solo vista B) | 20 180 | 0 | 0 | 0 | 20 180 |
| **Flujo neto, vista B** | **−21 346** | **297** | **1 208** | **1 664** | **−18 177** |

**Flujos netos de los otros escenarios (vista A):**

| Escenario | Año 0 | Año 1 | Año 2 | Año 3 | Beneficios a 3 años | Costos a 3 años |
|---|---|---|---|---|---|---|
| Pesimista | −1 272 | −3 233 | −3 130 | −3 027 | 1 236 | 11 899 |
| Optimista | −1 166 | 5 042 | 6 360 | 6 799 | 24 166 | 7 131 |

**Indicadores** (hoja "Indicadores"; VAN = flujo del año 0 + `NPV(12 %; años 1 a 3)`, TIR = `IRR`, B/C = VA de beneficios ÷ VA de costos con la inversión, ROI = (beneficios − costos) ÷ costos sin descontar, recuperación por interpolación del flujo acumulado):

| Indicador | Vista | Pesimista | Base | Optimista |
|---|---|---|---|---|
| VAN | A | S/ −8 809 | **S/ 1 247** | S/ 13 245 |
| TIR | A | No calculable (todos los flujos netos son negativos) | **53,5 %** | 450,7 % |
| Relación B/C | A | 0,10 | **1,18** | 3,23 |
| ROI a 3 años | A | −89,6 % | **23,6 %** | 238,9 % |
| Recuperación | A | No se recupera en 3 años | **1,7 años** | 0,2 años |
| Recuperación descontada | A | No se recupera en 3 años | **1,9 años** | 0,3 años |
| Inversión inicial | A | S/ 1 272 | S/ 1 166 | S/ 1 166 |
| VAN si CERMAT tuviera que contratar el cierre técnico | A | S/ −13 369 | S/ −2 933 | S/ 9 065 |
| VAN | B | S/ −29 369 | S/ −18 933 | S/ −6 935 |
| TIR | B | No calculable | −52,4 % | −7,2 % |
| Relación B/C | B | 0,03 | 0,30 | 0,73 |
| ROI a 3 años | B | −96,2 % | −63,4 % | −11,5 % |
| Recuperación | B | No se recupera en 3 años | No se recupera en 3 años | No se recupera en 3 años |
| Inversión inicial | B | S/ 21 832 | S/ 21 346 | S/ 21 346 |

**Lectura de los indicadores:**

- La **TIR de la vista A es muy alta** porque el desembolso inicial de CERMAT es pequeño (S/ 1 166). No mide la rentabilidad del desarrollo; para eso está la vista B. Para la decisión se priorizan el VAN y la relación B/C.
- La fila "VAN si CERMAT tuviera que contratar el cierre técnico" muestra la dependencia del aporte del equipo: sin él, el caso base pasa a S/ −2 933. Por eso la transferencia de conocimiento (C.5) es parte de la inversión.
- La **vista B** responde otra pregunta: ¿se paga el proyecto completo a precio de mercado? No en 3 años. Es la razón para escalar a otras sedes y al colegio (roadmap RM-08 a RM-13) en lugar de construir sistemas separados.

### 2.4.5 Análisis de sensibilidad

**Puntos de equilibrio** (hoja "Indicadores"; el VAN es lineal en el volumen y en la adopción):

| Umbral para VAN = 0 (resto de supuestos en base) | Vista A | Vista B |
|---|---|---|
| Matrículas por ciclo | **40,0** (base: 60) | 363,3 |
| Adopción constante en los 3 años | **64,1 %** (base: 60 %, 80 % y 90 %) | 248,5 % (inalcanzable) |

**Una variable a la vez** (hoja "Sensibilidad"; VAN de la vista A con el resto en base, ordenado por rango):

| Variable | Valor bajo → alto | VAN bajo | VAN alto | Rango |
|---|---|---|---|---|
| Captación en línea y retención (S25 y S26) | 0 y 0 → 4 y 2 por ciclo | S/ −2 019 | S/ 4 512 | S/ 6 531 |
| Adopción años 1 a 3 (S05 a S07) | 30/40/50 % → 80/95/100 % | S/ −2 726 | S/ 2 930 | S/ 5 656 |
| Hosting de la SPA (S29) | US$ 40 (2 miembros Pro) → US$ 0 (alternativa sin costo) | S/ −713 | S/ 3 206 | S/ 3 920 |
| Horas de operación y mantenimiento (S33 y S34) | 3 + 5 h → 1,5 + 2 h al mes | S/ −915 | S/ 2 327 | S/ 3 242 |
| Matrículas por ciclo (S03) | 40 → 90 | S/ −2 | S/ 3 120 | S/ 3 122 |
| Ahorros en pagos, reportes, asistencia y padres (S15 a S21) | pesimista → optimista | S/ 173 | S/ 2 102 | S/ 1 929 |
| Reducción de la morosidad (S28) | 0 → 1 punto | S/ 594 | S/ 1 900 | S/ 1 306 |
| Minutos ahorrados por matrícula (S12 y S13) | 15 y 3 min → 30 y 5 min | S/ 457 | S/ 1 600 | S/ 1 143 |
| Tipo de cambio (S02) | 3,74 → 3,06 (±10 %) | S/ 1 021 | S/ 1 472 | S/ 451 |
| Tasa de descuento (S01) | 16 % → 8 % | S/ 1 054 | S/ 1 466 | S/ 412 |

**Conclusiones de la sensibilidad:**

1. Las dos variables que más pesan dependen de **gestión, no de tecnología**: la captación en línea y retención, y la adopción. La primera exigía publicar las reglas corregidas, lo que se hizo el 2026-10-24 (la pre-matrícula pública volvió a funcionar), y exige usar las alertas de inasistencia; la segunda, una disposición de la Dirección.
2. El **costo del hosting** es la palanca de ahorro más fuerte: un hosting comercial sin costo de licencia elevaría el VAN base en S/ 1 959 (de S/ 1 247 a S/ 3 206). Se evaluará en el E5 sin cambiar el supuesto de costo del plan Pro.
3. Tipo de cambio y tasa de descuento casi no cambian la decisión.

### 2.4.6 Recomendación y criterios del hito de continuidad

Se recomienda **aprobar la alternativa D** con estas condiciones:

1. La Dirección emite antes del 2026-12-18 una disposición de canal único: toda matrícula se registra en la plataforma, en línea o con el registro rápido de secretaría.
2. El equipo completa los Sprints 1 a 3 (publicación de reglas, hecha el 2026-10-24; operación continua de la capa relacional, respaldo, monitor y capacitación) según el [E3](e3-plan-gestion-proyecto-ce0121.md).
3. CERMAT presupuesta S/ 2 438 al año de operación y mantenimiento (escenario base).
4. **Hito de continuidad del 2027-03-31.** Se recalcula el libro con datos reales. Se continúa si se cumplen todos estos criterios: adopción del ciclo de verano ≥ 60 %; minutos de personal por matrícula ≤ 12; 0 incidentes de sobrecupo o duplicado; matrículas por ciclo ≥ 40; VAN de la vista A recalculado ≥ 0. Si no se cumplen, se aplican primero las palancas de costo (hosting y horas de mantenimiento) y se revisa el alcance antes de seguir invirtiendo.

## 2.5 Riesgos iniciales

Escala 1 a 5 de probabilidad (P) e impacto (I); nivel por P × I: Bajo 1–4, Medio 5–9, Alto 10–14, Crítico 15–25. El impacto económico se calculó en la hoja "Sensibilidad" o con el mismo modelo.

| ID | Riesgo estratégico | P | I | P×I | Impacto económico preliminar | Mitigación | Responsable |
|---|---|---|---|---|---|---|---|
| RB-01 | Adopción como la del piloto: el personal sigue con cuaderno | 4 | 4 | 16 Crítico | VAN base de S/ 1 247 a S/ −2 726 con la adopción pesimista | Disposición de canal único, registro rápido, capacitación y meta mensual | Dirección |
| RB-02 | La matrícula pública vuelve a bloquearse (por ejemplo, por un despliegue que no llega a producción) o no se usan las alertas | 3 | 4 | 12 Alto | Sin captación ni retención, el VAN base baja a S/ −2 019 | Reglas corregidas publicadas y matrícula sin sesión verificada el 2026-10-24; publicar solo tras las 19 pruebas y verificar producción después de cada cambio | Equipo técnico |
| RB-03 | El equipo no completa el cierre técnico y CERMAT lo contrata | 2 | 4 | 8 Medio | VAN base de S/ 1 247 a S/ −2 933 | Cierre dentro de los Sprints 1 a 3 y transferencia de conocimiento (C.5) | Líder del proyecto |
| RB-04 | Mayor esfuerzo de operación y mantenimiento | 3 | 3 | 9 Medio | Con 3 + 5 h al mes, el VAN base baja a S/ −915 | CI con 99 pruebas, monitor con alertas y backlog priorizado | Responsable técnico |
| RB-05 | Volumen real menor al supuesto | 3 | 4 | 12 Alto | Con 40 matrículas por ciclo, VAN ≈ S/ 0 (S/ −2) | Validar el volumen con secretaría antes del 2026-12-04 | Product Owner |
| RB-06 | Cambio de precio o de plan del hosting | 2 | 3 | 6 Medio | Con 2 miembros Pro, VAN base S/ −713 | Un solo miembro con permiso de despliegue; evaluar alternativa sin costo | Dirección |
| RB-07 | Tipo de cambio desfavorable | 2 | 2 | 4 Bajo | Con S/ 3,74 por dólar, VAN base S/ 1 021 | Pago anual o en soles cuando sea posible | Dirección |
| RB-08 | Incidente de datos personales derivado de la exposición que hubo hasta el 2026-10-24 | 3 | 5 | 15 Crítico | No monetizado: multas de hasta 100 UIT según la Ley N.° 29733 y daño reputacional | Reglas corregidas publicadas el 2026-10-24; política de privacidad y plan de respuesta a incidentes ([SGSI](../infraestructura/s2-e1-sgsi-ce0321-ce0324.md)) | Dirección y equipo técnico |
| RB-09 | Dependencia de una sola persona | 4 | 5 | 20 Crítico | Interrupción de la operación; no monetizado | Revisión por pares, documentación y responsable técnico de CERMAT capacitado | Dirección |

## Referencias

[1] Project Management Institute, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)*, 7th ed. Newtown Square, PA, USA: PMI, 2021.

[2] Ministerio de Economía y Finanzas del Perú, "Anexo N.° 11: Parámetros de evaluación social," Directiva N.° 001-2019-EF/63.01, Directiva General del Sistema Nacional de Programación Multianual y Gestión de Inversiones, Lima, 2019.

[3] Vercel Inc., "Pricing." [En línea]. Disponible: https://vercel.com/pricing

[4] Google, "Firebase pricing." [En línea]. Disponible: https://firebase.google.com/pricing

[5] Congreso de la República del Perú, "Ley N.° 29733, Ley de Protección de Datos Personales," *Diario Oficial El Peruano*, 3 de julio de 2011.

## Anexos

| Anexo | Ubicación |
|---|---|
| Modelo financiero con fórmulas (8 hojas: Léame, Supuestos, Proceso, Presupuesto, Flujo de caja, Indicadores, Sensibilidad, Alternativas) | [business-case.xlsx](../assets/gestion-ti/business-case.xlsx) |
| Script reproducible que genera el libro y verifica sus 824 fórmulas contra un cálculo independiente | `perfil-egreso/scripts/generar-business-case.mjs` (`node perfil-egreso/scripts/generar-business-case.mjs` desde la raíz) |
| Tiempos del proceso usados en B1 | [E4 — Modelado de procesos](e4-modelado-procesos-ce0131.md) |
| Presupuesto y línea base de costos | [E3, sección 3.4](e3-plan-gestion-proyecto-ce0121.md#34-gestion-de-costos) |

## Rúbrica de evaluación

| Criterio | Excelente | Bueno | Regular | Deficiente |
| --- | --- | --- | --- | --- |
| Análisis de alternativas | Analiza alternativas con matriz comparativa rigurosa y justificación sólida. | Compara alternativas con criterios definidos. | Presenta alternativas sin comparación estructurada. | No evalúa alternativas. |
| Evaluación económica | Presenta análisis financiero estructurado con indicadores cuantificados. | Estima costos y beneficios razonablemente. | Presenta costos generales sin sustento. | No presenta estimación financiera. |
| Identificación de riesgos | Analiza riesgos estratégicos con impacto y estrategias de mitigación. | Identifica riesgos con evaluación básica. | Enumera riesgos sin análisis. | No identifica riesgos relevantes. |
| Sustentación y defensa técnica | Explica y defiende con dominio las decisiones tomadas. | Explica con solvencia. | Explica con dificultad. | No sustenta. |
