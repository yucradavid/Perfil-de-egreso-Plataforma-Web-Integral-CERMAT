#!/usr/bin/env node
/**
 * Modelo financiero del Business Case (Gestión TI, E2 - CE0113) y presupuesto del Plan de Gestión (E3).
 *
 * Genera perfil-egreso/docs/assets/gestion-ti/business-case.xlsx con fórmulas de Excel auditables
 * (NPV/IRR = VNA/TIR en Excel en español) y calcula los mismos indicadores en JavaScript para que
 * las cifras de los documentos .md coincidan con el libro.
 *
 * Uso, desde la raíz del repositorio:
 *   node perfil-egreso/scripts/generar-business-case.mjs            -> escribe el .xlsx e imprime el resumen
 *   node perfil-egreso/scripts/generar-business-case.mjs --json     -> además imprime el resumen completo en JSON
 *
 * Control de calidad incluido: cada fórmula del libro se evalúa con un intérprete mínimo (SUM, NPV, IRR,
 * IF, IFERROR, AND, MIN, MAX, COUNT, SUMPRODUCT, INDEX, MATCH, ROUND, ABS) y se compara con un cálculo
 * independiente en JavaScript. Si alguna cifra difiere, el script termina con error y no escribe el archivo.
 *
 * Todas las cifras estimadas son supuestos a validar con la Dirección (hoja "Supuestos").
 * Requiere SheetJS (paquete xlsx) ya instalado en node_modules de la raíz. No instala nada.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
// createRequire apuntando a node_modules/xlsx de la raíz del proyecto.
const require = createRequire(path.join(ROOT, 'node_modules', 'xlsx', 'package.json'));
const XLSX = require('xlsx');

const OUT_DIR = path.join(ROOT, 'perfil-egreso', 'docs', 'assets', 'gestion-ti');
const OUT = path.join(OUT_DIR, 'business-case.xlsx');
const PRINT_JSON = process.argv.includes('--json');

/* ------------------------------------------------------------------------------------------------
 * 1. Libro en memoria: hojas -> celdas { v (valor), f (fórmula sin '='), z (formato) }
 * ---------------------------------------------------------------------------------------------- */
const book = {};
const sheetOrder = [];
const colWidths = {};
function sheet(name) {
  if (!book[name]) { book[name] = {}; sheetOrder.push(name); }
  return book[name];
}
function col(n) { // 0 -> A
  let s = ''; n += 1;
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
const A = (c, r) => `${col(c)}${r}`;          // c en base 0, r en base 1
const ABS = (c, r) => `$${col(c)}$${r}`;
function put(sh, a, v, z) { sheet(sh)[a] = { v, z }; }
function putF(sh, a, f, z) { sheet(sh)[a] = { f, z }; }
function widths(sh, arr) { colWidths[sh] = arr; }
const q = (name) => (/^[A-Za-z0-9_]+$/.test(name) ? name : `'${name.replace(/'/g, "''")}'`);

const FMT = {
  soles: '"S/ "#,##0;"S/ -"#,##0',
  soles2: '"S/ "#,##0.00;"S/ -"#,##0.00',
  pct: '0.0%',
  pct0: '0%',
  ratio: '0.00',
  num1: '0.0',
  num2: '0.00',
  int: '#,##0',
  usd: '"US$ "#,##0.00',
  years: '0.0 "años"',
};

/* ------------------------------------------------------------------------------------------------
 * 2. Datos fuente (una sola fuente de verdad para el libro y para el cálculo en JavaScript)
 * ---------------------------------------------------------------------------------------------- */
const SCEN = ['pes', 'base', 'opt'];
const SCEN_LABEL = { pes: 'Pesimista', base: 'Base', opt: 'Optimista' };
const SCEN_COL = { pes: 3, base: 4, opt: 5 }; // D, E, F en "Supuestos"

// Proceso de matrícula (E4): minutos de personal por matrícula. Supuestos a validar con cronometraje.
const PROCESO_ASIS = [
  ['A1', 'Atender la consulta e informar oferta, horarios y precios', 'Secretaría', 10, 0],
  ['A2', 'Registrar los datos del postulante en cuaderno u hoja de cálculo', 'Secretaría', 6, 0],
  ['A3', 'Verificar el cupo en la lista del grupo (otro registro)', 'Secretaría', 4, 0],
  ['A4', 'Revisar y autorizar la matrícula en persona', 'Dirección', 0, 5],
  ['A5', 'Cobrar, emitir el recibo físico y anotar en caja', 'Secretaría', 6, 0],
  ['A6', 'Conciliar el pago con el registro de matrícula', 'Secretaría', 3, 0],
  ['A7', 'Confirmar al padre y agregar al alumno a la lista del grupo', 'Secretaría', 6, 0],
];
const PROCESO_TOBE = [
  ['T1', 'Registrar la pre-matrícula en línea (autoservicio) o con el registro rápido de secretaría (promedio)', 'Postulante / Secretaría', 4, 0],
  ['T2', 'Validar ciclo abierto, cupo y duplicado en una transacción', 'Sistema', 0, 0],
  ['T3', 'Revisar la pre-matrícula y registrar el pago en el panel', 'Secretaría', 4, 0],
  ['T4', 'Aprobar: el sistema genera la invitación (7 días) y el código de padres', 'Secretaría', 1, 0],
  ['T5', 'Enviar el enlace de activación al alumno o al padre', 'Secretaría', 1, 0],
  ['T6', 'Sincronizar con MySQL y conciliar (vista v_conciliacion_pagos)', 'Sistema', 0, 0],
  ['T7', 'Revisar los indicadores de matrícula en el panel (prorrateo por matrícula)', 'Dirección', 0, 0.5],
];

// Presupuesto del proyecto (E3): horas por paquete. Meses planificados: oct-26 (desde el 24) ... abr-27.
const MESES = ['oct-26', 'nov-26', 'dic-26', 'ene-27', 'feb-27', 'mar-27', 'abr-27'];
// [código, descripción, estado, financia, rol, horasEjecutadas, [horas por mes]]
const PRESUPUESTO = [
  ['1.1', 'Inicio y acta de constitución', 'Real', 'Equipo EPE', 'tecnico', 4, null],
  ['1.2', 'Planificación: plan de gestión, presupuesto y backlog', 'Real', 'Equipo EPE', 'tecnico', 12, null],
  ['1.3', 'Seguimiento y control: sprints, riesgos y valor ganado', 'Planificado', 'Equipo EPE', 'tecnico', 0, [1, 8, 5, 3, 1, 2, 0]],
  ['1.4', 'Cierre: lecciones aprendidas y acta de cierre', 'Planificado', 'Equipo EPE', 'tecnico', 0, [0, 0, 0, 0, 0, 0, 4]],
  ['2', 'Diagnóstico y diseño de gestión TI (E1 a E5)', 'Real', 'Equipo EPE', 'tecnico', 56, null],
  ['3.1', 'Sitio público y oferta académica', 'Real', 'Equipo EPE', 'tecnico', 80, null],
  ['3.2', 'Matrícula, pagos y activación', 'Real', 'Equipo EPE', 'tecnico', 140, null],
  ['3.3', 'Asistencia QR y consulta de padres', 'Real', 'Equipo EPE', 'tecnico', 90, null],
  ['3.4', 'Portales por rol (admin, docente, alumno, auxiliar)', 'Real', 'Equipo EPE', 'tecnico', 110, null],
  ['3.5', 'Capa local: API, MySQL y analítica', 'Real', 'Equipo EPE', 'tecnico', 60, null],
  ['4.1', 'Pruebas automáticas (90) y pipeline CI (PB-01)', 'Real', 'Equipo EPE', 'tecnico', 40, null],
  ['4.2', 'Corrección de reglas de Firestore (PB-02)', 'Real', 'Equipo EPE', 'tecnico', 12, null],
  ['4.3', 'Capa de datos MySQL: integridad, roles y respaldo (PB-03)', 'Real', 'Equipo EPE', 'tecnico', 24, null],
  ['4.4', '0 errores de TypeScript y 7 defectos corregidos (PB-07)', 'Real', 'Equipo EPE', 'tecnico', 12, null],
  ['4.5', 'Tipado de los módulos de dinero y asistencia (PB-09)', 'Planificado', 'Equipo EPE', 'tecnico', 0, [0, 4, 4, 0, 0, 0, 0]],
  ['4.6', 'Pruebas de componentes de matrícula y pagos (PB-12)', 'Planificado', 'Equipo EPE', 'tecnico', 0, [0, 6, 6, 0, 0, 0, 0]],
  ['5.1', 'Subir los cambios y primera ejecución del CI', 'Planificado', 'Equipo EPE', 'tecnico', 0, [2, 0, 0, 0, 0, 0, 0]],
  ['5.2', 'Publicar las reglas corregidas y verificar la matrícula sin sesión (PB-04)', 'Planificado', 'Equipo EPE', 'tecnico', 0, [2, 2, 0, 0, 0, 0, 0]],
  ['5.3', 'Aplicar las migraciones MySQL en la base real (PB-05)', 'Planificado', 'Equipo EPE', 'tecnico', 0, [0, 4, 0, 0, 0, 0, 0]],
  ['5.4', 'Retirar secretos del historial y rotar la clave de servicio (PB-06)', 'Planificado', 'Equipo EPE', 'tecnico', 0, [0, 6, 0, 0, 0, 0, 0]],
  ['5.5', 'Operación continua de la capa relacional: VM-APP01 o VPS puente (PB-13)', 'Planificado', 'Equipo EPE', 'tecnico', 0, [0, 16, 0, 0, 0, 0, 0]],
  ['5.6', 'Monitor externo con alertas sobre la URL y /health (PB-08)', 'Planificado', 'Equipo EPE', 'tecnico', 0, [0, 4, 0, 0, 0, 0, 0]],
  ['5.7', 'Carga diferida de páginas (PB-10)', 'Planificado', 'Equipo EPE', 'tecnico', 0, [0, 8, 0, 0, 0, 0, 0]],
  ['5.8', 'Respaldo programado de Firestore con prueba de restauración (PB-11)', 'Planificado', 'Equipo EPE', 'tecnico', 0, [0, 4, 8, 0, 0, 0, 0]],
  ['6.1', 'Medición de la línea base AS-IS: 10 trámites cronometrados (PB-14)', 'Planificado', 'Equipo EPE', 'tecnico', 0, [0, 8, 0, 0, 0, 0, 0]],
  ['6.2', 'Política de privacidad y consentimiento (PB-16)', 'Planificado', 'Equipo EPE', 'tecnico', 0, [0, 2, 4, 0, 0, 0, 0]],
  ['6.3', 'Configuración de la oferta 2027 (PB-17)', 'Planificado', 'Equipo EPE', 'tecnico', 0, [0, 0, 4, 0, 0, 0, 0]],
  ['6.4', 'Manuales por rol y capacitación (PB-15)', 'Planificado', 'Equipo EPE', 'tecnico', 0, [0, 4, 14, 0, 0, 0, 0]],
  ['6.5', 'Acompañamiento en la campaña de matrícula 2027', 'Planificado', 'Equipo EPE', 'tecnico', 0, [0, 0, 0, 12, 0, 0, 0]],
  ['6.6', 'Evaluación de adopción y beneficios (hito de continuidad)', 'Planificado', 'Equipo EPE', 'tecnico', 0, [0, 0, 0, 0, 0, 4, 0]],
  ['C.1', 'Product Owner designado por la Dirección', 'Planificado', 'CERMAT', 'direccion', 0, [1, 8, 3, 0, 0, 0, 0]],
  ['C.2', 'Revisiones de sprint con la Dirección', 'Planificado', 'CERMAT', 'direccion', 0, [0, 2, 1, 0, 0, 0, 0]],
  ['C.3', 'Capacitación del personal administrativo y auxiliar (3 personas × 3 h)', 'Planificado', 'CERMAT', 'admin', 0, [0, 0, 9, 0, 0, 0, 0]],
  ['C.4', 'Capacitación docente (3 docentes × 2 h)', 'Planificado', 'CERMAT', 'docente', 0, [0, 0, 6, 0, 0, 0, 0]],
  ['C.5', 'Transferencia de conocimiento al responsable técnico de CERMAT', 'Planificado', 'CERMAT', 'tecnico', 0, [0, 0, 8, 8, 0, 0, 0]],
];

/* ------------------------------------------------------------------------------------------------
 * 3. Hoja "Proceso" (E4) - se construye primero porque alimenta los supuestos base
 * ---------------------------------------------------------------------------------------------- */
const SP = 'Supuestos';
const PR = 'Proceso';
const PRES = 'Presupuesto';
const FL = 'Flujo de caja';
const IND = 'Indicadores';
const SEN = 'Sensibilidad';
const ALT = 'Alternativas';
const LEE = 'Léame';

sheet(LEE); // primera hoja
sheet(SP);

// Parámetros: key -> { row, vals[3] | f[3] }
const P = {};
const PARAMS = [
  // [key, id, etiqueta, unidad, [pes, base, opt] | null, fmt, fuente, estado]
  ['__grupo', 'Generales'],
  ['tasa', 'S01', 'Tasa de descuento anual', '% anual', [0.12, 0.12, 0.12], FMT.pct, 'Costo de oportunidad del capital para una institución educativa privada pequeña; se usa por encima de la tasa social de descuento del MEF (8 %) por el riesgo privado. Validar con la Dirección o su contador.', 'Supuesto a validar'],
  ['fx', 'S02', 'Tipo de cambio', 'S/ por US$', [3.4, 3.4, 3.4], FMT.num2, 'Referencia de mercado 2026. Validar con el tipo de cambio venta de la SBS el día de aprobación (ver hoja Sensibilidad: ±10 %).', 'Supuesto a validar'],
  ['__grupo', 'Volumen y adopción'],
  ['vol', 'S03', 'Matrículas por ciclo (todas las vías)', 'matrículas', [40, 60, 90], FMT.int, 'Base: 2 grupos de 30 alumnos en la sede actual. Validar con los registros de matrícula de secretaría. El piloto registró solo 8 matrículas en la plataforma entre el 2026-01-27 y el 2026-07-07.', 'Supuesto a validar'],
  ['ciclos', 'S04', 'Ciclos por año', 'ciclos', [3, 3, 3], FMT.int, 'Calendario típico de una academia preuniversitaria (verano, ciclo I y ciclo II). Validar con la Dirección.', 'Supuesto a validar'],
  ['a1', 'S05', 'Adopción en el año 1 (2027)', '% de matrículas registradas en la plataforma', [0.3, 0.6, 0.8], FMT.pct0, 'Depende de una disposición de la Dirección: toda matrícula se registra en línea o con el registro rápido de secretaría. Hoy la adopción real es baja (8 matrículas).', 'Supuesto a validar'],
  ['a2', 'S06', 'Adopción en el año 2 (2028)', '% de matrículas', [0.4, 0.8, 0.95], FMT.pct0, 'Curva de adopción con capacitación y acompañamiento.', 'Supuesto a validar'],
  ['a3', 'S07', 'Adopción en el año 3 (2029)', '% de matrículas', [0.5, 0.9, 1.0], FMT.pct0, 'Curva de adopción con capacitación y acompañamiento.', 'Supuesto a validar'],
  ['__grupo', 'Costos unitarios de personal'],
  ['hs', 'S08', 'Costo hora del personal administrativo y auxiliar', 'S/ por hora', [10, 10, 10], FMT.num2, 'Remuneración supuesta de S/ 1 300 al mes más cargas sociales (≈ 45 %) entre 192 h al mes.', 'Supuesto a validar'],
  ['hd', 'S09', 'Costo hora de la Dirección', 'S/ por hora', [30, 30, 30], FMT.num2, 'Remuneración directiva supuesta de S/ 4 000 al mes más cargas sociales entre 192 h al mes.', 'Supuesto a validar'],
  ['hdoc', 'S10', 'Costo hora docente', 'S/ por hora', [20, 20, 20], FMT.num2, 'Tarifa horaria docente supuesta.', 'Supuesto a validar'],
  ['ht', 'S11', 'Costo hora técnico (desarrollo, operación y mantenimiento)', 'S/ por hora', [25, 25, 25], FMT.num2, 'Desarrollador junior con S/ 3 000 al mes más cargas sociales (≈ 45 %) entre 176 h al mes.', 'Supuesto a validar'],
  ['__grupo', 'Tiempos del proceso y ahorros operativos'],
  ['ms', 'S12', 'Minutos de secretaría ahorrados por matrícula', 'min', [15, null, 30], FMT.num1, 'Base calculada en la hoja Proceso (35 → 10 min). Medir con el cronometraje de 10 trámites y las marcas de tiempo del sistema (E4).', 'Supuesto a validar'],
  ['md', 'S13', 'Minutos de la Dirección ahorrados por matrícula', 'min', [3, null, 5], FMT.num1, 'Base calculada en la hoja Proceso (5 → 0,5 min).', 'Supuesto a validar'],
  ['cuotas', 'S14', 'Pagos registrados por matrícula', 'pagos', [2, 2, 2], FMT.num1, 'Promedio supuesto entre pago al contado (1) y en cuotas (2 a 3).', 'Supuesto a validar'],
  ['mp', 'S15', 'Minutos ahorrados por pago registrado', 'min', [3, 5, 6], FMT.num1, 'Registro y conciliación manual (≈ 8 min) frente a registro en el panel con conciliación automática (≈ 3 min).', 'Supuesto a validar'],
  ['hr', 'S16', 'Horas ahorradas al mes en el reporte de gestión', 'h por mes', [1.5, 3, 4], FMT.num1, 'Consolidar cuadernos y hojas (≈ 3,5 h) frente a consultar el panel y las vistas de MySQL (≈ 0,5 h).', 'Supuesto a validar'],
  ['ma', 'S17', 'Minutos ahorrados por día lectivo al consolidar la asistencia', 'min por día', [5, 10, 15], FMT.num1, 'Lista en cuaderno y consolidación manual frente a registro por QR.', 'Supuesto a validar'],
  ['dias', 'S18', 'Días lectivos por año', 'días', [200, 200, 200], FMT.int, 'Cinco días por semana durante 40 semanas.', 'Supuesto a validar'],
  ['qp', 'S19', 'Consultas de padres por alumno al mes', 'consultas', [1, 1, 1], FMT.num1, 'Llamadas o visitas para preguntar por asistencia o pagos. Hoy hay 0 consultas registradas en la plataforma.', 'Supuesto a validar'],
  ['mq', 'S20', 'Minutos de personal por consulta atendida', 'min', [5, 5, 5], FMT.num1, 'Atención telefónica o presencial.', 'Supuesto a validar'],
  ['pr', 'S21', 'Consultas resueltas con el código de padres (autoservicio)', '%', [0.25, 0.5, 0.75], FMT.pct0, 'Consulta de asistencia por código CERMAT sin llamar a la academia.', 'Supuesto a validar'],
  ['meses', 'S22', 'Meses con clases por año', 'meses', [10, 10, 10], FMT.int, 'Calendario académico supuesto.', 'Supuesto a validar'],
  ['__grupo', 'Ingresos protegidos y adicionales'],
  ['precio', 'S23', 'Ingreso promedio por matrícula', 'S/', [400, 400, 400], FMT.soles, 'Supuesto; validar con el tarifario vigente de la academia.', 'Supuesto a validar'],
  ['margen', 'S24', 'Margen de contribución de una matrícula adicional', '%', [0.6, 0.6, 0.6], FMT.pct0, 'Docente y aula son costos fijos del grupo; el costo variable son materiales y atención.', 'Supuesto a validar'],
  ['add', 'S25', 'Matrículas adicionales por ciclo captadas por el canal en línea', 'matrículas', [0, 2, 4], FMT.num1, 'Pre-matrícula 24/7 desde el sitio público (desbloqueada en producción el 2026-10-24 al publicar las reglas corregidas). Medir con el origen de cada matrícula.', 'Supuesto a validar'],
  ['ret', 'S26', 'Alumnos retenidos por ciclo gracias a las alertas de inasistencia', 'alumnos', [0, 1, 2], FMT.num1, 'Seguimiento con sp_riesgo_inasistencia y la analítica de riesgo.', 'Supuesto a validar'],
  ['frac', 'S27', 'Fracción del ingreso del ciclo que se conserva por alumno retenido', '%', [0.5, 0.5, 0.5], FMT.pct0, 'El abandono ocurre a mitad de ciclo en promedio (supuesto).', 'Supuesto a validar'],
  ['moro', 'S28', 'Reducción de la morosidad', 'puntos del ingreso', [0, 0.005, 0.01], FMT.pct, 'Visibilidad del saldo por cuota en el panel. Medir con el saldo vencido mensual.', 'Supuesto a validar'],
  ['__grupo', 'Costos de operación y mantenimiento'],
  ['vercel', 'S29', 'Vercel Pro por miembro al mes', 'US$', [20, 20, 20], FMT.usd, 'Precio de lista del plan Pro (pago por miembro). El plan Hobby actual (US$ 0) es solo para uso personal no comercial; el uso institucional corresponde al plan Pro. Validar al contratar.', 'Supuesto de costo'],
  ['asientos', 'S30', 'Miembros del plan Pro', 'miembros', [1, 1, 1], FMT.int, 'Un responsable técnico publica los despliegues.', 'Supuesto a validar'],
  ['vps', 'S31', 'VPS institucional imputado a la academia', 'US$ por año', [35.99, 35.99, 35.99], FMT.usd, 'Costo real del plan RackNerd vigente. Se imputa completo por prudencia: copia externa de respaldos y VPN de la capa relacional (diseño CE03) o VPS puente del mismo plan mientras no exista VM-APP01.', 'Real (costo); imputación supuesta'],
  ['firebase', 'S32', 'Firebase', 'US$ por año', [60, 0, 0], FMT.usd, 'Plan gratuito con el uso actual (real). El escenario pesimista reserva US$ 5 al mes por exceso de cuota o por pasar al plan Blaze.', 'Real (US$ 0 hoy); reserva supuesta'],
  ['ops', 'S33', 'Operación: monitoreo, respaldos y usuarios', 'h por mes', [3, 2, 1.5], FMT.num1, 'Rutina diaria, semanal y mensual de operación (E5).', 'Supuesto a validar'],
  ['mant', 'S34', 'Mantenimiento correctivo y evolutivo', 'h por mes', [5, 3, 2], FMT.num1, 'Actualización de dependencias y correcciones; el CI con 90 pruebas reduce el esfuerzo de verificación.', 'Supuesto a validar'],
  ['__grupo', 'Inversión del proyecto (horas tomadas de la hoja Presupuesto)'],
  ['po', 'S35', 'Horas del Product Owner (Dirección)', 'h', null, FMT.num1, 'Hoja Presupuesto, fila C.1.', 'Supuesto a validar'],
  ['rev', 'S36', 'Horas de la Dirección en revisiones de sprint', 'h', null, FMT.num1, 'Hoja Presupuesto, fila C.2.', 'Supuesto a validar'],
  ['capadm', 'S37', 'Horas de capacitación del personal administrativo y auxiliar', 'h', null, FMT.num1, 'Hoja Presupuesto, fila C.3.', 'Supuesto a validar'],
  ['capdoc', 'S38', 'Horas de capacitación docente', 'h', null, FMT.num1, 'Hoja Presupuesto, fila C.4.', 'Supuesto a validar'],
  ['kt', 'S39', 'Horas de transferencia de conocimiento al responsable técnico de CERMAT', 'h', null, FMT.num1, 'Hoja Presupuesto, fila C.5.', 'Supuesto a validar'],
  ['cont', 'S40', 'Reserva de contingencia sobre el trabajo planificado', '%', [0.2, 0.1, 0.1], FMT.pct0, 'Práctica habitual de 10 % para trabajo con alcance conocido; 20 % en el escenario pesimista.', 'Supuesto a validar'],
  ['hexe', 'S41', 'Horas del equipo ya ejecutadas (ene a oct de 2026)', 'h', null, FMT.int, 'Hoja Presupuesto. Estimación por analogía: no hay registro de horas (brecha de estimación del E4 de Software).', 'Supuesto a validar'],
  ['hplan', 'S42', 'Horas del equipo planificadas (oct de 2026 a abr de 2027)', 'h', null, FMT.int, 'Hoja Presupuesto.', 'Supuesto a validar'],
  ['__grupo', 'Alternativas (hoja Alternativas)'],
  ['saas', 'S43', 'Suscripción SaaS por alumno activo al mes', 'US$', [2, 2, 2], FMT.usd, 'Valor de referencia del equipo, sin cotización. Pedir al menos dos cotizaciones.', 'Supuesto a validar'],
  ['saasmig', 'S44', 'Horas de configuración y migración al SaaS', 'h', [20, 20, 20], FMT.int, 'Carga de oferta, alumnos y usuarios.', 'Supuesto a validar'],
  ['formset', 'S45', 'Horas para configurar formularios y hojas compartidas', 'h', [20, 20, 20], FMT.int, 'Formularios, hoja de cupos y permisos.', 'Supuesto a validar'],
  ['formmnt', 'S46', 'Mantenimiento de formularios y hojas', 'h por mes', [1, 1, 1], FMT.num1, 'Ajustes por ciclo.', 'Supuesto a validar'],
  ['extdev', 'S47', 'Horas para extender el sistema del colegio a la academia', 'h', [400, 400, 400], FMT.int, 'Rehacer en Laravel y Angular la oferta, matrícula, pagos, asistencia QR y portales (estimación del equipo).', 'Supuesto a validar'],
  ['extmnt', 'S48', 'Mantenimiento del sistema extendido', 'h por mes', [3, 3, 3], FMT.num1, 'Igual esfuerzo que la plataforma propia.', 'Supuesto a validar'],
];

// Layout de "Proceso"
const PR_ROW_ASIS0 = 4;                              // filas 4..10
const PR_ROW_ASIS_TOT = PR_ROW_ASIS0 + PROCESO_ASIS.length; // 11
const PR_ROW_TOBE_HDR = PR_ROW_ASIS_TOT + 2;          // 13
const PR_ROW_TOBE0 = PR_ROW_TOBE_HDR + 1;             // 14..20
const PR_ROW_TOBE_TOT = PR_ROW_TOBE0 + PROCESO_TOBE.length; // 21
const PR_ROW_RES = PR_ROW_TOBE_TOT + 2;               // 23 (resumen)

// Layout de "Supuestos": fila de cada parámetro
{
  let r = 4;
  for (const p of PARAMS) {
    if (p[0] === '__grupo') { p.row = r; r += 1; continue; }
    P[p[0]] = { row: r, def: p };
    r += 1;
  }
}
const ref = (key, s) => `${SP}!${ABS(SCEN_COL[s], P[key].row)}`;

// Layout de "Presupuesto"
const PRES_ROW0 = 5;
const PRES_COL = { cod: 0, desc: 1, est: 2, fin: 3, tarifa: 4, horas: 5, exe: 6, mes0: 7, costo: 7 + MESES.length };
PRESUPUESTO.forEach((it, i) => { it.row = PRES_ROW0 + i; });
const PRES_LAST = PRES_ROW0 + PRESUPUESTO.length - 1;
const PRES_TOT = PRES_LAST + 2; // filas de totales a partir de aquí
const presRow = (cod) => PRESUPUESTO.find((x) => x[0] === cod).row;

/* ------------------------------------------------------------------------------------------------
 * 4. Construcción de la hoja "Supuestos"
 * ---------------------------------------------------------------------------------------------- */
put(SP, 'A1', 'Supuestos del caso de negocio (valores editables: el resto del libro se recalcula)');
put(SP, 'A2', 'Moneda: soles constantes de 2026, antes de impuestos. Año 0 = 2026 (inversión); años 1 a 3 = 2027 a 2029 (operación). Celdas con fórmula: se calculan en otras hojas.');
['ID', 'Supuesto', 'Unidad', 'Pesimista', 'Base', 'Optimista', 'Fuente o criterio', 'Estado'].forEach((h, c) => put(SP, A(c, 3), h));
for (const p of PARAMS) {
  if (p[0] === '__grupo') { put(SP, A(0, p.row), p[1]); continue; }
  const [key, id, label, unit, vals, fmt, src, status] = p;
  const r = P[key].row;
  put(SP, A(0, r), id); put(SP, A(1, r), label); put(SP, A(2, r), unit);
  put(SP, A(6, r), src); put(SP, A(7, r), status);
  for (const s of SCEN) {
    const c = SCEN_COL[s];
    let f = null;
    if (key === 'ms' && s === 'base') f = `${PR}!${ABS(3, PR_ROW_ASIS_TOT)}-${PR}!${ABS(3, PR_ROW_TOBE_TOT)}`;
    if (key === 'md' && s === 'base') f = `${PR}!${ABS(4, PR_ROW_ASIS_TOT)}-${PR}!${ABS(4, PR_ROW_TOBE_TOT)}`;
    const presMap = { po: 'C.1', rev: 'C.2', capadm: 'C.3', capdoc: 'C.4', kt: 'C.5' };
    if (presMap[key]) f = `${PRES}!${ABS(PRES_COL.horas, presRow(presMap[key]))}`;
    if (key === 'hexe') f = `${PRES}!${ABS(PRES_COL.horas, PRES_TOT)}`;
    if (key === 'hplan') f = `${PRES}!${ABS(PRES_COL.horas, PRES_TOT + 1)}`;
    if (f) putF(SP, A(c, r), f, fmt);
    else put(SP, A(c, r), vals[SCEN.indexOf(s)], fmt);
  }
}
widths(SP, [6, 58, 22, 12, 12, 12, 110, 26]);

/* ------------------------------------------------------------------------------------------------
 * 5. Hoja "Proceso" (E4)
 * ---------------------------------------------------------------------------------------------- */
put(PR, 'A1', 'Proceso de matrícula: tiempo y costo de personal por matrícula (AS-IS frente a TO-BE). Minutos = supuestos a validar con 10 trámites cronometrados.');
['ID', 'Actividad AS-IS', 'Rol', 'Min secretaría', 'Min Dirección', 'Costo (S/)'].forEach((h, c) => put(PR, A(c, 3), h));
const hsRef = ref('hs', 'base');
const hdRef = ref('hd', 'base');
PROCESO_ASIS.forEach((a, i) => {
  const r = PR_ROW_ASIS0 + i;
  put(PR, A(0, r), a[0]); put(PR, A(1, r), a[1]); put(PR, A(2, r), a[2]);
  put(PR, A(3, r), a[3], FMT.num1); put(PR, A(4, r), a[4], FMT.num1);
  putF(PR, A(5, r), `D${r}/60*${hsRef}+E${r}/60*${hdRef}`, FMT.soles2);
});
put(PR, A(1, PR_ROW_ASIS_TOT), 'Total AS-IS por matrícula');
putF(PR, A(3, PR_ROW_ASIS_TOT), `SUM(D${PR_ROW_ASIS0}:D${PR_ROW_ASIS_TOT - 1})`, FMT.num1);
putF(PR, A(4, PR_ROW_ASIS_TOT), `SUM(E${PR_ROW_ASIS0}:E${PR_ROW_ASIS_TOT - 1})`, FMT.num1);
putF(PR, A(5, PR_ROW_ASIS_TOT), `SUM(F${PR_ROW_ASIS0}:F${PR_ROW_ASIS_TOT - 1})`, FMT.soles2);
['ID', 'Actividad TO-BE', 'Rol', 'Min secretaría', 'Min Dirección', 'Costo (S/)'].forEach((h, c) => put(PR, A(c, PR_ROW_TOBE_HDR), h));
PROCESO_TOBE.forEach((a, i) => {
  const r = PR_ROW_TOBE0 + i;
  put(PR, A(0, r), a[0]); put(PR, A(1, r), a[1]); put(PR, A(2, r), a[2]);
  put(PR, A(3, r), a[3], FMT.num1); put(PR, A(4, r), a[4], FMT.num1);
  putF(PR, A(5, r), `D${r}/60*${hsRef}+E${r}/60*${hdRef}`, FMT.soles2);
});
put(PR, A(1, PR_ROW_TOBE_TOT), 'Total TO-BE por matrícula');
putF(PR, A(3, PR_ROW_TOBE_TOT), `SUM(D${PR_ROW_TOBE0}:D${PR_ROW_TOBE_TOT - 1})`, FMT.num1);
putF(PR, A(4, PR_ROW_TOBE_TOT), `SUM(E${PR_ROW_TOBE0}:E${PR_ROW_TOBE_TOT - 1})`, FMT.num1);
putF(PR, A(5, PR_ROW_TOBE_TOT), `SUM(F${PR_ROW_TOBE0}:F${PR_ROW_TOBE_TOT - 1})`, FMT.soles2);
// Resumen del proceso (escenario base, año 3)
const PRS = {};
{
  let r = PR_ROW_RES;
  put(PR, A(0, r), 'Resumen (escenario base)'); r += 1;
  const rows = [
    ['minAsis', 'Minutos de personal por matrícula AS-IS', `D${PR_ROW_ASIS_TOT}+E${PR_ROW_ASIS_TOT}`, FMT.num1],
    ['minTobe', 'Minutos de personal por matrícula TO-BE', `D${PR_ROW_TOBE_TOT}+E${PR_ROW_TOBE_TOT}`, FMT.num1],
    ['minRed', 'Reducción del tiempo de personal', null, FMT.pct],
    ['costAsis', 'Costo de personal por matrícula AS-IS', `F${PR_ROW_ASIS_TOT}`, FMT.soles2],
    ['costTobe', 'Costo de personal por matrícula TO-BE', `F${PR_ROW_TOBE_TOT}`, FMT.soles2],
    ['costRed', 'Reducción del costo de personal por matrícula', null, FMT.pct],
    ['matY3', 'Matrículas en la plataforma en el año 3 (base)', `${ref('vol', 'base')}*${ref('ciclos', 'base')}*${ref('a3', 'base')}`, FMT.num1],
    ['anualAsis', 'Costo anual de personal del proceso AS-IS para esas matrículas', null, FMT.soles],
    ['anualTobe', 'Costo anual de personal del proceso TO-BE para esas matrículas', null, FMT.soles],
    ['share', 'Participación del ahorro de matrícula en el beneficio total (base, adopción 100 %)', null, FMT.pct],
    ['platPorMat', 'Costo de plataforma imputado por matrícula (año 3, base)', null, FMT.soles2],
    ['totalTobe', 'Costo total por matrícula TO-BE (personal + plataforma imputada)', null, FMT.soles2],
    ['totalRed', 'Reducción del costo total por matrícula frente al AS-IS', null, FMT.pct],
  ];
  for (const [k, label, f, z] of rows) { PRS[k] = r; put(PR, A(0, r), label); if (f) putF(PR, A(5, r), f, z); r += 1; }
  putF(PR, A(5, PRS.minRed), `1-F${PRS.minTobe}/F${PRS.minAsis}`, FMT.pct);
  putF(PR, A(5, PRS.costRed), `1-F${PRS.costTobe}/F${PRS.costAsis}`, FMT.pct);
  putF(PR, A(5, PRS.anualAsis), `F${PRS.matY3}*F${PRS.costAsis}`, FMT.soles);
  putF(PR, A(5, PRS.anualTobe), `F${PRS.matY3}*F${PRS.costTobe}`, FMT.soles);
  // share y platPorMat se completan cuando existan las celdas del flujo (ver más abajo)
}
widths(PR, [70, 78, 24, 14, 14, 14]);

/* ------------------------------------------------------------------------------------------------
 * 6. Hoja "Presupuesto" (E3): horas, tarifas, costo, distribución mensual y línea base
 * ---------------------------------------------------------------------------------------------- */
put(PRES, 'A1', 'Presupuesto del proyecto y línea base de costos (E3). Horas reales estimadas por analogía; horas planificadas = estimación por paquete (supuestos).');
put(PRES, 'A2', 'Tarifas tomadas de la hoja Supuestos (escenario base). La reserva de contingencia se aplica solo al trabajo planificado.');
['Código', 'Paquete de trabajo (EDT)', 'Estado', 'Financia', 'Tarifa (S/ por h)', 'Horas', 'Ejecutado ene–oct 2026 (h)', ...MESES.map((m) => `${m} (h)`), 'Costo (S/)']
  .forEach((h, c) => put(PRES, A(c, 4), h));
const rateRef = { tecnico: ref('ht', 'base'), direccion: ref('hd', 'base'), admin: ref('hs', 'base'), docente: ref('hdoc', 'base') };
for (const it of PRESUPUESTO) {
  const [cod, desc, est, fin, rol, hexe, meses] = it;
  const r = it.row;
  put(PRES, A(PRES_COL.cod, r), cod); put(PRES, A(PRES_COL.desc, r), desc);
  put(PRES, A(PRES_COL.est, r), est); put(PRES, A(PRES_COL.fin, r), fin);
  putF(PRES, A(PRES_COL.tarifa, r), rateRef[rol], FMT.num2);
  put(PRES, A(PRES_COL.exe, r), hexe, FMT.int);
  MESES.forEach((_, j) => put(PRES, A(PRES_COL.mes0 + j, r), meses ? meses[j] : 0, FMT.int));
  putF(PRES, A(PRES_COL.horas, r), `SUM(${A(PRES_COL.exe, r)}:${A(PRES_COL.mes0 + MESES.length - 1, r)})`, FMT.int);
  putF(PRES, A(PRES_COL.costo, r), `${A(PRES_COL.horas, r)}*${A(PRES_COL.tarifa, r)}`, FMT.soles);
}
// Totales
const PT = {
  exeEq: PRES_TOT, planEq: PRES_TOT + 1, planCer: PRES_TOT + 2, planTot: PRES_TOT + 3,
  cont: PRES_TOT + 4, bac: PRES_TOT + 5, acum: PRES_TOT + 6, acumCont: PRES_TOT + 7,
};
const teamPlanned = PRESUPUESTO.filter((x) => x[2] === 'Planificado' && x[3] === 'Equipo EPE');
const teamReal = PRESUPUESTO.filter((x) => x[2] === 'Real');
const cermat = PRESUPUESTO.filter((x) => x[3] === 'CERMAT');
const sumRows = (rows, c) => rows.map((x) => A(c, x.row)).join('+');
put(PRES, A(1, PT.exeEq), 'Total trabajo ejecutado del equipo (costo hundido valorizado)');
putF(PRES, A(PRES_COL.horas, PT.exeEq), sumRows(teamReal, PRES_COL.horas), FMT.int);
putF(PRES, A(PRES_COL.costo, PT.exeEq), sumRows(teamReal, PRES_COL.costo), FMT.soles);
put(PRES, A(1, PT.planEq), 'Total trabajo planificado del equipo (aporte valorizado)');
putF(PRES, A(PRES_COL.horas, PT.planEq), sumRows(teamPlanned, PRES_COL.horas), FMT.int);
putF(PRES, A(PRES_COL.costo, PT.planEq), sumRows(teamPlanned, PRES_COL.costo), FMT.soles);
put(PRES, A(1, PT.planCer), 'Total trabajo planificado de CERMAT (tiempo del personal)');
putF(PRES, A(PRES_COL.horas, PT.planCer), sumRows(cermat, PRES_COL.horas), FMT.int);
putF(PRES, A(PRES_COL.costo, PT.planCer), sumRows(cermat, PRES_COL.costo), FMT.soles);
put(PRES, A(1, PT.planTot), 'Valor planificado por mes (equipo + CERMAT, sin contingencia)');
MESES.forEach((_, j) => {
  const c = PRES_COL.mes0 + j;
  putF(PRES, A(c, PT.planTot), `SUMPRODUCT(${A(c, PRES_ROW0)}:${A(c, PRES_LAST)},${A(PRES_COL.tarifa, PRES_ROW0)}:${A(PRES_COL.tarifa, PRES_LAST)})`, FMT.soles);
});
putF(PRES, A(PRES_COL.costo, PT.planTot), `SUM(${A(PRES_COL.mes0, PT.planTot)}:${A(PRES_COL.mes0 + MESES.length - 1, PT.planTot)})`, FMT.soles);
put(PRES, A(1, PT.cont), 'Reserva de contingencia (% del trabajo planificado, escenario base)');
putF(PRES, A(PRES_COL.costo, PT.cont), `${A(PRES_COL.costo, PT.planTot)}*${ref('cont', 'base')}`, FMT.soles);
put(PRES, A(1, PT.bac), 'Presupuesto total del proyecto (BAC = ejecutado + planificado + contingencia)');
putF(PRES, A(PRES_COL.costo, PT.bac), `${A(PRES_COL.costo, PT.exeEq)}+${A(PRES_COL.costo, PT.planTot)}+${A(PRES_COL.costo, PT.cont)}`, FMT.soles);
put(PRES, A(1, PT.acum), 'Línea base de costos acumulada del trabajo planificado (sin contingencia)');
MESES.forEach((_, j) => {
  const c = PRES_COL.mes0 + j;
  putF(PRES, A(c, PT.acum), j === 0 ? `${A(c, PT.planTot)}` : `${A(c - 1, PT.acum)}+${A(c, PT.planTot)}`, FMT.soles);
});
put(PRES, A(1, PT.acumCont), 'Línea base acumulada con la reserva de contingencia prorrateada');
MESES.forEach((_, j) => {
  const c = PRES_COL.mes0 + j;
  putF(PRES, A(c, PT.acumCont), `${A(c, PT.acum)}*(1+${ref('cont', 'base')})`, FMT.soles);
});
widths(PRES, [7, 72, 12, 12, 10, 8, 12, ...MESES.map(() => 9), 12]);

/* ------------------------------------------------------------------------------------------------
 * 7. Constructor de fórmulas del modelo (una sola definición para flujo, sensibilidad y equilibrio)
 * ---------------------------------------------------------------------------------------------- */
// R(key) devuelve la referencia (o literal) a usar para cada parámetro.
const F = {
  b1: (R) => `${R('ciclos')}*${R('vol')}*(${R('ms')}/60*${R('hs')}+${R('md')}/60*${R('hd')})`,
  b2: (R) => `${R('ciclos')}*${R('vol')}*${R('cuotas')}*${R('mp')}/60*${R('hs')}+${R('hr')}*12*${R('hs')}`,
  b3: (R) => `${R('ma')}/60*${R('dias')}*${R('hs')}+${R('vol')}*${R('qp')}*${R('meses')}*${R('mq')}/60*${R('pr')}*${R('hs')}`,
  b4: (R) => `${R('ciclos')}*${R('precio')}*${R('margen')}*(${R('add')}+${R('ret')}*${R('frac')})`,
  b5: (R) => `${R('vol')}*${R('ciclos')}*${R('precio')}*${R('moro')}`,
  c1: (R) => `${R('vercel')}*${R('asientos')}*12*${R('fx')}`,
  c2: (R) => `${R('vps')}*${R('fx')}`,
  c3: (R) => `${R('firebase')}*${R('fx')}`,
  c4: (R) => `${R('ops')}*12*${R('ht')}`,
  c5: (R) => `${R('mant')}*12*${R('ht')}`,
  i0a: (R) => `(${R('po')}*${R('hd')}+${R('rev')}*${R('hd')}+${R('capadm')}*${R('hs')}+${R('capdoc')}*${R('hdoc')}+${R('kt')}*${R('ht')})*(1+${R('cont')})`,
  aporte: (R) => `${R('hexe')}*${R('ht')}+${R('hplan')}*${R('ht')}*(1+${R('cont')})`,
  // beneficio por unidad de "matrículas por ciclo" (para el punto de equilibrio)
  u: (R) => `${R('ciclos')}*(${R('ms')}/60*${R('hs')}+${R('md')}/60*${R('hd')})+${R('ciclos')}*${R('cuotas')}*${R('mp')}/60*${R('hs')}+${R('qp')}*${R('meses')}*${R('mq')}/60*${R('pr')}*${R('hs')}+${R('ciclos')}*${R('precio')}*${R('moro')}`,
};
F.b100 = (R) => `(${F.b1(R)})+(${F.b2(R)})+(${F.b3(R)})+(${F.b4(R)})+(${F.b5(R)})`;
F.opex = (R) => `(${F.c1(R)})+(${F.c2(R)})+(${F.c3(R)})+(${F.c4(R)})+(${F.c5(R)})`;
const Rscen = (s) => (key) => ref(key, s);

/* ------------------------------------------------------------------------------------------------
 * 8. Hoja "Flujo de caja": un bloque por escenario
 * ---------------------------------------------------------------------------------------------- */
put(FL, 'A1', 'Flujo de caja a 3 años por escenario (S/ constantes de 2026). Vista A: perspectiva de CERMAT. Vista B: proyecto completo con el aporte del equipo valorizado.');
const BLOCK = 40;
const FB = {}; // filas por escenario
const ROWS = ['titulo', 'hdr', 'adop', 'mat', 'b1', 'b2', 'b3', 'b4', 'b5', 'ben', 'c1', 'c2', 'c3', 'c4', 'c5', 'opex', 'i0a', 'costA', 'netA', 'cumA', 'fd', 'discA', 'cumDA', 'aporte', 'costB', 'netB', 'cumB', 'discB', 'cumDB', 'hA', 'hDA', 'hB', 'hDB'];
const LABELS = {
  adop: 'Adopción (% de matrículas en la plataforma)',
  mat: 'Matrículas registradas en la plataforma',
  b1: 'B1 Matrícula: tiempo de secretaría y de la Dirección',
  b2: 'B2 Pagos y reporte de gestión',
  b3: 'B3 Asistencia y consultas de padres',
  b4: 'B4 Margen de matrículas adicionales y alumnos retenidos',
  b5: 'B5 Menor morosidad',
  ben: 'Beneficios totales',
  c1: 'C1 Vercel Pro (hosting comercial de la SPA)',
  c2: 'C2 VPS institucional imputado',
  c3: 'C3 Firebase',
  c4: 'C4 Operación',
  c5: 'C5 Mantenimiento',
  opex: 'Costos de operación y mantenimiento',
  i0a: 'Inversión de CERMAT (tiempo del personal + contingencia)',
  costA: 'Costos totales, vista A',
  netA: 'Flujo neto, vista A',
  cumA: 'Flujo neto acumulado, vista A',
  fd: 'Factor de descuento',
  discA: 'Flujo descontado, vista A',
  cumDA: 'Flujo descontado acumulado, vista A',
  aporte: 'Aporte valorizado del equipo (ejecutado + planificado con contingencia)',
  costB: 'Costos totales, vista B',
  netB: 'Flujo neto, vista B',
  cumB: 'Flujo neto acumulado, vista B',
  discB: 'Flujo descontado, vista B',
  cumDB: 'Flujo descontado acumulado, vista B',
  hA: 'Auxiliar: año de recuperación, vista A',
  hDA: 'Auxiliar: año de recuperación descontado, vista A',
  hB: 'Auxiliar: año de recuperación, vista B',
  hDB: 'Auxiliar: año de recuperación descontado, vista B',
};
const YC = [1, 2, 3, 4]; // columnas B..E = años 0..3
SCEN.forEach((s, si) => {
  const r0 = 3 + si * BLOCK;
  const R = {}; ROWS.forEach((k, i) => { R[k] = r0 + i; });
  FB[s] = R;
  const Rs = Rscen(s);
  put(FL, A(0, R.titulo), `Escenario ${SCEN_LABEL[s].toLowerCase()}`);
  ['Concepto', 'Año 0 (2026)', 'Año 1 (2027)', 'Año 2 (2028)', 'Año 3 (2029)', 'Total'].forEach((h, c) => put(FL, A(c, R.hdr), h));
  for (const k of ROWS.slice(2)) put(FL, A(0, R[k]), LABELS[k]);
  const adopKeys = ['a1', 'a2', 'a3'];
  // Año 0: sin operación
  put(FL, A(1, R.adop), 0, FMT.pct0);
  put(FL, A(1, R.mat), 0, FMT.num1);
  for (const k of ['b1', 'b2', 'b3', 'b4', 'b5', 'c1', 'c2', 'c3', 'c4', 'c5']) put(FL, A(1, R[k]), 0, FMT.soles);
  for (let t = 1; t <= 3; t += 1) {
    const c = YC[t];
    putF(FL, A(c, R.adop), Rs(adopKeys[t - 1]), FMT.pct0);
    putF(FL, A(c, R.mat), `${Rs('vol')}*${Rs('ciclos')}*${A(c, R.adop)}`, FMT.num1);
    for (const k of ['b1', 'b2', 'b3', 'b4', 'b5']) putF(FL, A(c, R[k]), `${A(c, R.adop)}*(${F[k](Rs)})`, FMT.soles);
    for (const k of ['c1', 'c2', 'c3', 'c4', 'c5']) putF(FL, A(c, R[k]), F[k](Rs), FMT.soles);
  }
  for (const c of YC) {
    putF(FL, A(c, R.ben), `SUM(${A(c, R.b1)}:${A(c, R.b5)})`, FMT.soles);
    putF(FL, A(c, R.opex), `SUM(${A(c, R.c1)}:${A(c, R.c5)})`, FMT.soles);
    putF(FL, A(c, R.costA), `${A(c, R.opex)}+${A(c, R.i0a)}`, FMT.soles);
    putF(FL, A(c, R.netA), `${A(c, R.ben)}-${A(c, R.costA)}`, FMT.soles);
    putF(FL, A(c, R.cumA), c === 1 ? `${A(c, R.netA)}` : `${A(c - 1, R.cumA)}+${A(c, R.netA)}`, FMT.soles);
    putF(FL, A(c, R.fd), `1/(1+${Rs('tasa')})^${c - 1}`, '0.0000');
    putF(FL, A(c, R.discA), `${A(c, R.netA)}*${A(c, R.fd)}`, FMT.soles);
    putF(FL, A(c, R.cumDA), c === 1 ? `${A(c, R.discA)}` : `${A(c - 1, R.cumDA)}+${A(c, R.discA)}`, FMT.soles);
    putF(FL, A(c, R.costB), `${A(c, R.costA)}+${A(c, R.aporte)}`, FMT.soles);
    putF(FL, A(c, R.netB), `${A(c, R.ben)}-${A(c, R.costB)}`, FMT.soles);
    putF(FL, A(c, R.cumB), c === 1 ? `${A(c, R.netB)}` : `${A(c - 1, R.cumB)}+${A(c, R.netB)}`, FMT.soles);
    putF(FL, A(c, R.discB), `${A(c, R.netB)}*${A(c, R.fd)}`, FMT.soles);
    putF(FL, A(c, R.cumDB), c === 1 ? `${A(c, R.discB)}` : `${A(c - 1, R.cumDB)}+${A(c, R.discB)}`, FMT.soles);
  }
  putF(FL, A(1, R.i0a), F.i0a(Rs), FMT.soles);
  putF(FL, A(1, R.aporte), F.aporte(Rs), FMT.soles);
  for (let t = 1; t <= 3; t += 1) { put(FL, A(YC[t], R.i0a), 0, FMT.soles); put(FL, A(YC[t], R.aporte), 0, FMT.soles); }
  // Totales (columna F)
  for (const k of ['mat', 'b1', 'b2', 'b3', 'b4', 'b5', 'ben', 'c1', 'c2', 'c3', 'c4', 'c5', 'opex', 'i0a', 'costA', 'netA', 'discA', 'aporte', 'costB', 'netB', 'discB']) {
    putF(FL, A(5, R[k]), `SUM(${A(1, R[k])}:${A(4, R[k])})`, k === 'mat' ? FMT.num1 : FMT.soles);
  }
  // Auxiliares de recuperación: año t en que el acumulado cambia de signo (interpolación lineal)
  const helper = (row, cumRow, flowRow) => {
    for (let t = 1; t <= 3; t += 1) {
      const c = YC[t];
      putF(FL, A(c, row), `IF(AND(${A(c - 1, cumRow)}<0,${A(c, cumRow)}>=0),${t - 1}+(-${A(c - 1, cumRow)})/${A(c, flowRow)},"")`, FMT.num2);
    }
  };
  helper(R.hA, R.cumA, R.netA);
  helper(R.hDA, R.cumDA, R.discA);
  helper(R.hB, R.cumB, R.netB);
  helper(R.hDB, R.cumDB, R.discB);
});
widths(FL, [72, 15, 15, 15, 15, 15]);

// Completar la hoja Proceso con referencias al flujo base
{
  const Rb = Rscen('base');
  putF(PR, A(5, PRS.share), `(${F.b1(Rb)})/(${F.b100(Rb)})`, FMT.pct);
  putF(PR, A(5, PRS.platPorMat), `'${FL}'!${A(4, FB.base.opex)}*F${PRS.share}/F${PRS.matY3}`, FMT.soles2);
  putF(PR, A(5, PRS.totalTobe), `F${PRS.costTobe}+F${PRS.platPorMat}`, FMT.soles2);
  putF(PR, A(5, PRS.totalRed), `1-F${PRS.totalTobe}/F${PRS.costAsis}`, FMT.pct);
}

/* ------------------------------------------------------------------------------------------------
 * 9. Hoja "Indicadores"
 * ---------------------------------------------------------------------------------------------- */
put(IND, 'A1', 'Indicadores económicos por vista y escenario (fórmulas sobre la hoja Flujo de caja)');
put(IND, 'A2', 'Vista A: flujos de CERMAT (decisión vigente; el desarrollo ya ejecutado es costo hundido y el cierre técnico lo aporta el equipo EPE). Vista B: proyecto completo con todas las horas valorizadas a precio de mercado.');
['Indicador', 'Vista', 'Pesimista', 'Base', 'Optimista', 'Lectura'].forEach((h, c) => put(IND, A(c, 4), h));
const IR = {};
const fl = (c, r) => `'${FL}'!${A(c, r)}`;
const flr = (c1, c2, r) => `'${FL}'!${A(c1, r)}:${A(c2, r)}`;
const INDROWS = [
  ['vanA', 'VAN (S/)', 'A', (s, R) => `${fl(1, R.netA)}+NPV(${ref('tasa', s)},${flr(2, 4, R.netA)})`, FMT.soles, 'VAN > 0: la inversión de CERMAT se recupera con la tasa exigida.'],
  ['tirA', 'TIR', 'A', (s, R) => `IFERROR(IRR(${flr(1, 4, R.netA)}),"No calculable")`, FMT.pct, 'Alta porque el desembolso inicial de CERMAT es pequeño; leer junto con el VAN.'],
  ['bcA', 'Relación beneficio/costo', 'A', (s, R) => `(${fl(1, R.ben)}+NPV(${ref('tasa', s)},${flr(2, 4, R.ben)}))/(${fl(1, R.costA)}+NPV(${ref('tasa', s)},${flr(2, 4, R.costA)}))`, FMT.ratio, 'Valor actual de beneficios entre valor actual de costos (incluye la inversión).'],
  ['roiA', 'ROI a 3 años (sin descontar)', 'A', (s, R) => `(${fl(5, R.ben)}-${fl(5, R.costA)})/${fl(5, R.costA)}`, FMT.pct, '(Beneficios − costos) / costos del horizonte.'],
  ['payA', 'Periodo de recuperación (años)', 'A', (s, R) => `IF(COUNT(${flr(2, 4, R.hA)})=0,"No se recupera en 3 años",MIN(${flr(2, 4, R.hA)}))`, FMT.num2, 'Interpolación lineal del flujo acumulado.'],
  ['payDA', 'Periodo de recuperación descontado (años)', 'A', (s, R) => `IF(COUNT(${flr(2, 4, R.hDA)})=0,"No se recupera en 3 años",MIN(${flr(2, 4, R.hDA)}))`, FMT.num2, 'Con flujos descontados a la tasa S01.'],
  ['i0A', 'Inversión inicial (año 0)', 'A', (s, R) => `${fl(1, R.costA)}`, FMT.soles, 'Tiempo del personal de CERMAT y contingencia.'],
  ['vanAc', 'VAN si CERMAT tuviera que contratar el cierre técnico (S/)', 'A', (s, R) => `${fl(1, R.netA)}+NPV(${ref('tasa', s)},${flr(2, 4, R.netA)})-${ref('hplan', s)}*${ref('ht', s)}*(1+${ref('cont', s)})`, FMT.soles, 'Riesgo: el equipo no completa los sprints y CERMAT los paga.'],
  ['vanB', 'VAN (S/)', 'B', (s, R) => `${fl(1, R.netB)}+NPV(${ref('tasa', s)},${flr(2, 4, R.netB)})`, FMT.soles, 'Rentabilidad del proyecto completo valorizado a precio de mercado.'],
  ['tirB', 'TIR', 'B', (s, R) => `IFERROR(IRR(${flr(1, 4, R.netB)},-0.5),"No calculable")`, FMT.pct, 'Valor inicial −50 % para que la iteración converja a la raíz negativa.'],
  ['bcB', 'Relación beneficio/costo', 'B', (s, R) => `(${fl(1, R.ben)}+NPV(${ref('tasa', s)},${flr(2, 4, R.ben)}))/(${fl(1, R.costB)}+NPV(${ref('tasa', s)},${flr(2, 4, R.costB)}))`, FMT.ratio, ''],
  ['roiB', 'ROI a 3 años (sin descontar)', 'B', (s, R) => `(${fl(5, R.ben)}-${fl(5, R.costB)})/${fl(5, R.costB)}`, FMT.pct, ''],
  ['payB', 'Periodo de recuperación (años)', 'B', (s, R) => `IF(COUNT(${flr(2, 4, R.hB)})=0,"No se recupera en 3 años",MIN(${flr(2, 4, R.hB)}))`, FMT.num2, ''],
  ['payDB', 'Periodo de recuperación descontado (años)', 'B', (s, R) => `IF(COUNT(${flr(2, 4, R.hDB)})=0,"No se recupera en 3 años",MIN(${flr(2, 4, R.hDB)}))`, FMT.num2, ''],
  ['i0B', 'Inversión inicial (año 0)', 'B', (s, R) => `${fl(1, R.costB)}`, FMT.soles, 'Igual al presupuesto total del proyecto (BAC) en el escenario base.'],
];
{
  let r = 5;
  for (const [k, label, vista, fn, z, lectura] of INDROWS) {
    IR[k] = r;
    put(IND, A(0, r), label); put(IND, A(1, r), vista); put(IND, A(5, r), lectura);
    SCEN.forEach((s, i) => putF(IND, A(2 + i, r), fn(s, FB[s]), z));
    r += 1;
  }
  // Punto de equilibrio
  r += 1;
  put(IND, A(0, r), 'Puntos de equilibrio (cada escenario con sus propios supuestos)'); r += 1;
  const EQ = [
    ['u', 'Beneficio anual por cada matrícula por ciclo adicional (adopción 100 %)', '', (s) => F.u(Rscen(s)), FMT.soles2],
    ['sa', 'Suma de la adopción descontada (a1/(1+i) + a2/(1+i)^2 + a3/(1+i)^3)', '', (s) => `${ref('a1', s)}/(1+${ref('tasa', s)})+${ref('a2', s)}/(1+${ref('tasa', s)})^2+${ref('a3', s)}/(1+${ref('tasa', s)})^3`, '0.0000'],
    ['veqA', 'Matrículas por ciclo para VAN = 0', 'A', (s) => `${ref('vol', s)}-${A(2 + SCEN.indexOf(s), IR.vanA)}/(${A(2 + SCEN.indexOf(s), r)}*${A(2 + SCEN.indexOf(s), r + 1)})`, FMT.num1],
    ['veqB', 'Matrículas por ciclo para VAN = 0', 'B', (s) => `${ref('vol', s)}-${A(2 + SCEN.indexOf(s), IR.vanB)}/(${A(2 + SCEN.indexOf(s), r)}*${A(2 + SCEN.indexOf(s), r + 1)})`, FMT.num1],
    ['b100', 'Beneficio anual con adopción de 100 %', '', (s) => F.b100(Rscen(s)), FMT.soles],
    ['af', 'Factor de anualidad a 3 años', '', (s) => `1/(1+${ref('tasa', s)})+1/(1+${ref('tasa', s)})^2+1/(1+${ref('tasa', s)})^3`, '0.0000'],
    ['aeqA', 'Adopción constante para VAN = 0', 'A', (s) => `(${fl(1, FB[s].costA)}+${fl(2, FB[s].opex)}*${A(2 + SCEN.indexOf(s), r + 5)})/(${A(2 + SCEN.indexOf(s), r + 4)}*${A(2 + SCEN.indexOf(s), r + 5)})`, FMT.pct],
    ['aeqB', 'Adopción constante para VAN = 0', 'B', (s) => `(${fl(1, FB[s].costB)}+${fl(2, FB[s].opex)}*${A(2 + SCEN.indexOf(s), r + 5)})/(${A(2 + SCEN.indexOf(s), r + 4)}*${A(2 + SCEN.indexOf(s), r + 5)})`, FMT.pct],
  ];
  const r0 = r;
  EQ.forEach(([k, label, vista, fn, z], i) => {
    IR[k] = r0 + i;
    put(IND, A(0, r0 + i), label); put(IND, A(1, r0 + i), vista);
    SCEN.forEach((s, j) => putF(IND, A(2 + j, r0 + i), fn(s), z));
  });
  put(IND, A(5, IR.veqA), 'NPV es lineal en el volumen: V* = V − VAN / (u × suma de adopción descontada).');
  put(IND, A(5, IR.aeqA), 'α* = (inversión + VA de costos) / VA de beneficios con adopción 100 %. Un valor > 100 % es inalcanzable.');
}
widths(IND, [70, 7, 22, 22, 22, 95]);

/* ------------------------------------------------------------------------------------------------
 * 10. Hoja "Sensibilidad": una variable a la vez sobre el VAN de la vista A (resto en base)
 * ---------------------------------------------------------------------------------------------- */
put(SEN, 'A1', 'Sensibilidad de una variable a la vez sobre el VAN de la vista A (todos los demás supuestos en el escenario base)');
['Variable', 'Valor bajo', 'Valor alto', 'B100 bajo', 'Costos anuales bajo', 'Inversión bajo', 'VAN bajo', 'B100 alto', 'Costos anuales alto', 'Inversión alto', 'VAN alto', 'Rango del VAN']
  .forEach((h, c) => put(SEN, A(c, 3), h));
const TORNADO = [
  { label: 'Matrículas por ciclo (S03)', lowTxt: '40', highTxt: '90', keys: ['vol'] },
  { label: 'Adopción años 1 a 3 (S05 a S07)', lowTxt: '30/40/50 %', highTxt: '80/95/100 %', keys: ['a1', 'a2', 'a3'] },
  { label: 'Minutos ahorrados por matrícula (S12 y S13)', lowTxt: '15 y 3 min', highTxt: '30 y 5 min', keys: ['ms', 'md'] },
  { label: 'Captación en línea y retención (S25 y S26)', lowTxt: '0 y 0', highTxt: '4 y 2 por ciclo', keys: ['add', 'ret'] },
  { label: 'Reducción de la morosidad (S28)', lowTxt: '0 puntos', highTxt: '1 punto', keys: ['moro'] },
  { label: 'Ahorros en pagos, reportes, asistencia y padres (S15 a S21)', lowTxt: 'pesimista', highTxt: 'optimista', keys: ['mp', 'hr', 'ma', 'pr'] },
  { label: 'Horas de operación y mantenimiento (S33 y S34)', lowTxt: '3 + 5 h/mes', highTxt: '1,5 + 2 h/mes', keys: ['ops', 'mant'] },
  { label: 'Tipo de cambio (S02) ±10 %', lowTxt: '3,74', highTxt: '3,06', literal: { key: 'fx', low: 3.74, high: 3.06 } },
  { label: 'Tasa de descuento (S01)', lowTxt: '16 %', highTxt: '8 %', literal: { key: 'tasa', low: 0.16, high: 0.08 } },
  { label: 'Hosting de la SPA (S29): 2 miembros Pro o alternativa sin costo', lowTxt: 'US$ 40', highTxt: 'US$ 0', literal: { key: 'vercel', low: 40, high: 0 } },
];
TORNADO.forEach((t, i) => {
  const r = 4 + i;
  t.row = r;
  put(SEN, A(0, r), t.label); put(SEN, A(1, r), t.lowTxt); put(SEN, A(2, r), t.highTxt);
  const mk = (side) => (key) => {
    if (t.literal && t.literal.key === key) return String(t.literal[side]);
    if (t.keys && t.keys.includes(key)) return ref(key, side === 'low' ? 'pes' : 'opt');
    return ref(key, 'base');
  };
  // Para "ops y mant" el bajo es el pesimista (más horas) y el alto el optimista: ya coincide con pes/opt.
  for (const [side, c0] of [['low', 3], ['high', 7]]) {
    const R = mk(side);
    putF(SEN, A(c0, r), F.b100(R), FMT.soles);
    putF(SEN, A(c0 + 1, r), F.opex(R), FMT.soles);
    putF(SEN, A(c0 + 2, r), F.i0a(R), FMT.soles);
    const tasa = R('tasa');
    putF(SEN, A(c0 + 3, r), `-${A(c0 + 2, r)}+(${R('a1')}*${A(c0, r)}-${A(c0 + 1, r)})/(1+${tasa})+(${R('a2')}*${A(c0, r)}-${A(c0 + 1, r)})/(1+${tasa})^2+(${R('a3')}*${A(c0, r)}-${A(c0 + 1, r)})/(1+${tasa})^3`, FMT.soles);
  }
  putF(SEN, A(11, r), `ABS(${A(10, r)}-${A(6, r)})`, FMT.soles);
});
put(SEN, A(0, 4 + TORNADO.length + 1), 'VAN de la vista A en el escenario base (referencia)');
putF(SEN, A(6, 4 + TORNADO.length + 1), `${IND}!${A(3, IR.vanA)}`, FMT.soles);
widths(SEN, [62, 14, 16, 12, 14, 12, 12, 12, 14, 12, 12, 13]);

/* ------------------------------------------------------------------------------------------------
 * 11. Hoja "Alternativas": costo a 3 años y matriz ponderada con prueba de robustez
 * ---------------------------------------------------------------------------------------------- */
put(ALT, 'A1', 'Alternativas: valor actual del costo incremental para CERMAT a 3 años y matriz de decisión ponderada (puntajes 1 a 5)');
['Alternativa', 'Inversión inicial (S/)', 'Costo anual (S/)', 'VA del costo a 3 años (S/)', 'Puntaje de costo (1–5)', 'Base del cálculo'].forEach((h, c) => put(ALT, A(c, 3), h));
const ALTS = [
  ['A. Mantener el proceso manual (cuaderno, hojas y WhatsApp)', '0', '0', 'Sin desembolso; no resuelve el problema.'],
  ['B. Formularios y hojas de cálculo compartidas (Google Workspace)', `${ref('formset', 'base')}*${ref('ht', 'base')}`, `${ref('formmnt', 'base')}*12*${ref('ht', 'base')}`, 'S45, S46 y S11.'],
  ['C. Software SaaS de gestión académica', `${ref('saasmig', 'base')}*${ref('ht', 'base')}`, `${ref('saas', 'base')}*${ref('vol', 'base')}*12*${ref('fx', 'base')}`, 'S43, S44, S03 y S02.'],
  ['D. Plataforma propia (elegida, vista A)', `'${FL}'!${A(1, FB.base.costA)}`, `'${FL}'!${A(2, FB.base.opex)}`, 'Inversión y costos de operación del flujo base.'],
  ['E. Extender el sistema del colegio (Laravel y Angular)', `${ref('extdev', 'base')}*${ref('ht', 'base')}`, `${ref('extmnt', 'base')}*12*${ref('ht', 'base')}`, 'S47, S48 y S11; usa el VPS existente.'],
];
const ALT_ROW0 = 4;
ALTS.forEach(([name, inv, anual, base], i) => {
  const r = ALT_ROW0 + i;
  put(ALT, A(0, r), name);
  putF(ALT, A(1, r), inv, FMT.soles); putF(ALT, A(2, r), anual, FMT.soles);
  putF(ALT, A(3, r), `B${r}+NPV(${ref('tasa', 'base')},C${r},C${r},C${r})`, FMT.soles);
  putF(ALT, A(4, r), `IF(D${r}<=2000,5,IF(D${r}<=5000,4,IF(D${r}<=8000,3,IF(D${r}<=12000,2,1))))`, FMT.int);
  put(ALT, A(5, r), base);
});
put(ALT, A(0, ALT_ROW0 + ALTS.length), 'Regla del puntaje de costo: ≤ S/ 2 000 = 5; ≤ 5 000 = 4; ≤ 8 000 = 3; ≤ 12 000 = 2; > 12 000 = 1.');
// Matriz ponderada
const CRIT = [
  ['Ajuste al proceso de CERMAT (ciclos, grupos, sedes, turnos, cuotas, QR, código de padres)', 0.25],
  ['Costo incremental para CERMAT a 3 años', 0.20],
  ['Control de cupos y calidad de datos (sobrecupo, duplicados, trazabilidad)', 0.15],
  ['Seguridad y protección de datos (roles, Ley N.° 29733)', 0.15],
  ['Integración con el ecosistema y escalabilidad multi-sede', 0.15],
  ['Tiempo y riesgo de puesta en marcha para la campaña 2027', 0.10],
];
// puntajes por alternativa (criterio de costo = fórmula)
const SCORES = {
  0: [2, null, 1, 2, 1, 5],
  1: [2, null, 2, 2, 2, 5],
  2: [3, null, 4, 3, 2, 3],
  3: [5, null, 5, 4, 4, 4],
  4: [3, null, 4, 4, 5, 1],
};
const MAT_HDR = ALT_ROW0 + ALTS.length + 2;   // cabecera de criterios
const MAT_W = MAT_HDR + 1;                     // fila de pesos
const MAT_ROW0 = MAT_W + 1;                    // alternativas
put(ALT, A(0, MAT_HDR), 'Matriz de decisión ponderada');
CRIT.forEach(([name, w], j) => { put(ALT, A(1 + j, MAT_HDR), name); put(ALT, A(1 + j, MAT_W), w, FMT.pct0); });
put(ALT, A(7, MAT_HDR), 'Total ponderado');
put(ALT, A(0, MAT_W), 'Peso');
putF(ALT, A(7, MAT_W), `SUM(B${MAT_W}:G${MAT_W})`, FMT.pct0);
ALTS.forEach(([name], i) => {
  const r = MAT_ROW0 + i;
  put(ALT, A(0, r), name);
  SCORES[i].forEach((sc, j) => {
    if (sc === null) putF(ALT, A(1 + j, r), `E${ALT_ROW0 + i}`, FMT.int);
    else put(ALT, A(1 + j, r), sc, FMT.int);
  });
  putF(ALT, A(7, r), `SUMPRODUCT(B${r}:G${r},$B$${MAT_W}:$G$${MAT_W})`, FMT.num2);
});
const MAT_LAST = MAT_ROW0 + ALTS.length - 1;
put(ALT, A(0, MAT_LAST + 1), 'Alternativa con mayor puntaje');
putF(ALT, A(7, MAT_LAST + 1), `INDEX(A${MAT_ROW0}:A${MAT_LAST},MATCH(MAX(H${MAT_ROW0}:H${MAT_LAST}),H${MAT_ROW0}:H${MAT_LAST},0))`);
// Robustez: cada criterio +10 puntos de peso, el resto se reescala
const ROB_HDR = MAT_LAST + 3;
put(ALT, A(0, ROB_HDR), 'Prueba de robustez: se sube 10 puntos el peso de un criterio y se reescalan los demás');
CRIT.forEach(([name], j) => put(ALT, A(1 + j, ROB_HDR), `+10 en criterio ${j + 1}`));
const ROB_W0 = ROB_HDR + 1; // 6 filas de pesos: fila = criterio k, columna = variante j
CRIT.forEach((_, k) => {
  const r = ROB_W0 + k;
  put(ALT, A(0, r), `Peso del criterio ${k + 1}`);
  CRIT.forEach((__, j) => {
    const wk = `${col(1 + k)}$${MAT_W}`;
    const wj = `${col(1 + j)}$${MAT_W}`;
    putF(ALT, A(1 + j, r), k === j ? `${wk}+0.1` : `${wk}*(1-(${wj}+0.1))/(1-${wj})`, FMT.pct);
  });
});
const ROB_T0 = ROB_W0 + CRIT.length;
ALTS.forEach(([name], i) => {
  const r = ROB_T0 + i;
  put(ALT, A(0, r), `Total: ${name.split('.')[0]}`);
  CRIT.forEach((__, j) => {
    const terms = CRIT.map((___, k) => `${col(1 + k)}$${MAT_ROW0 + i}*${col(1 + j)}${ROB_W0 + k}`).join('+');
    putF(ALT, A(1 + j, r), terms, FMT.num2);
  });
});
const ROB_WIN = ROB_T0 + ALTS.length;
put(ALT, A(0, ROB_WIN), 'Gana en la variante');
CRIT.forEach((__, j) => {
  const c = col(1 + j);
  putF(ALT, A(1 + j, ROB_WIN), `INDEX($A$${MAT_ROW0}:$A$${MAT_LAST},MATCH(MAX(${c}${ROB_T0}:${c}${ROB_T0 + ALTS.length - 1}),${c}${ROB_T0}:${c}${ROB_T0 + ALTS.length - 1},0))`);
});
widths(ALT, [64, 18, 18, 18, 18, 18, 18, 16]);

/* ------------------------------------------------------------------------------------------------
 * 12. Hoja "Léame"
 * ---------------------------------------------------------------------------------------------- */
[
  'Business Case — Plataforma Web Integral CERMAT (Gestión TI, E2 · CE0113) y presupuesto del Plan de Gestión (E3)',
  'Equipo: David Robert Yucra Mamani (líder), Gladys Rosaura Yana Pari, Denilson Leeke Mamani Flores, Cárdenas Vilca Rennzo · UPeU Juliaca · 2026-2 · Fecha: 2026-10-24',
  '',
  'Cómo usar: cambie solo los valores de la hoja Supuestos (columnas Pesimista, Base y Optimista). Todo lo demás son fórmulas.',
  'Hojas: Supuestos (entradas y fuentes) · Proceso (tiempos AS-IS/TO-BE del E4) · Presupuesto (EDT, línea base y BAC del E3) · Flujo de caja (3 escenarios) · Indicadores (VAN, TIR, B/C, ROI, recuperación y puntos de equilibrio) · Sensibilidad (una variable a la vez) · Alternativas (costo a 3 años y matriz ponderada).',
  'Funciones: NPV e IRR se muestran como VNA y TIR en Excel en español. La TIR de la vista B usa un valor inicial de −50 % para converger a la raíz negativa.',
  'Vista A (decisión): flujos de CERMAT. El desarrollo ejecutado de ene a oct de 2026 es costo hundido y el cierre técnico lo aporta el equipo EPE sin desembolso de CERMAT.',
  'Vista B (referencia): proyecto completo con todas las horas del equipo valorizadas a precio de mercado (S/ 25 por hora).',
  'Costos reales conocidos: VPS US$ 35,99 al año; Vercel Hobby US$ 0 (solo uso personal no comercial; se presupuesta Vercel Pro); Firebase US$ 0 con el uso actual.',
  'Advertencia: el piloto registró solo 8 matrículas, 2 pagos y 7 marcas de asistencia. El beneficio depende de la adopción institucional; todas las cifras estimadas son supuestos a validar con la Dirección.',
  'El host on-premise del diseño CE03 (hardware por cotizar, sin presupuesto aprobado) queda fuera de este caso: sirve a todo CERMAT y la vía crítica de la plataforma está en la nube.',
  'Archivo generado por perfil-egreso/scripts/generar-business-case.mjs (reproducible). Las fórmulas se verificaron con un intérprete propio contra un cálculo independiente en JavaScript.',
].forEach((t, i) => put(LEE, A(0, i + 1), t));
widths(LEE, [180]);

/* ------------------------------------------------------------------------------------------------
 * 13. Intérprete mínimo de fórmulas (subconjunto de Excel usado arriba)
 * ---------------------------------------------------------------------------------------------- */
const ERR = (e) => ({ err: e });
const isErr = (v) => v && typeof v === 'object' && 'err' in v;
function tokenize(src) {
  const toks = []; let i = 0;
  const re = {
    ws: /^\s+/,
    str: /^"((?:[^"]|"")*)"/,
    sref: /^('(?:[^']|'')+'|[A-Za-z_][A-Za-z0-9_.]*)!(\$?[A-Z]{1,3}\$?\d+)(?::(\$?[A-Z]{1,3}\$?\d+))?/,
    func: /^([A-Z][A-Z0-9.]*)\(/,
    ref: /^(\$?[A-Z]{1,3}\$?\d+)(?::(\$?[A-Z]{1,3}\$?\d+))?/,
    num: /^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/,
    op: /^(<=|>=|<>|[-+*/^&=<>(),])/,
  };
  while (i < src.length) {
    const s = src.slice(i); let m;
    if ((m = re.ws.exec(s))) { i += m[0].length; continue; }
    if ((m = re.str.exec(s))) { toks.push({ t: 'str', v: m[1].replace(/""/g, '"') }); i += m[0].length; continue; }
    if ((m = re.sref.exec(s))) {
      let sh = m[1]; if (sh.startsWith("'")) sh = sh.slice(1, -1).replace(/''/g, "'");
      toks.push({ t: 'ref', sh, a: m[2].replace(/\$/g, ''), b: m[3] ? m[3].replace(/\$/g, '') : null }); i += m[0].length; continue;
    }
    if ((m = re.func.exec(s))) { toks.push({ t: 'func', v: m[1] }); i += m[0].length; continue; } // consume "("
    if ((m = re.ref.exec(s))) { toks.push({ t: 'ref', sh: null, a: m[1].replace(/\$/g, ''), b: m[2] ? m[2].replace(/\$/g, '') : null }); i += m[0].length; continue; }
    if ((m = re.num.exec(s))) { toks.push({ t: 'num', v: parseFloat(m[0]) }); i += m[0].length; continue; }
    if ((m = re.op.exec(s))) { toks.push({ t: 'op', v: m[1] }); i += m[0].length; continue; }
    throw new Error(`Token no reconocido en «${src}» desde «${s.slice(0, 20)}»`);
  }
  return toks;
}
function parse(src) {
  const toks = tokenize(src); let p = 0;
  const peek = () => toks[p];
  const eat = (v) => { const t = toks[p]; if (!t || (v && t.v !== v)) throw new Error(`Se esperaba ${v} en «${src}»`); p += 1; return t; };
  function expr() { return cmp(); }
  function cmp() {
    let l = cat();
    while (peek() && peek().t === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(peek().v)) { const o = eat().v; l = { k: 'bin', o, l, r: cat() }; }
    return l;
  }
  function cat() { let l = add(); while (peek() && peek().t === 'op' && peek().v === '&') { eat(); l = { k: 'bin', o: '&', l, r: add() }; } return l; }
  function add() { let l = mul(); while (peek() && peek().t === 'op' && ['+', '-'].includes(peek().v)) { const o = eat().v; l = { k: 'bin', o, l, r: mul() }; } return l; }
  function mul() { let l = pow(); while (peek() && peek().t === 'op' && ['*', '/'].includes(peek().v)) { const o = eat().v; l = { k: 'bin', o, l, r: pow() }; } return l; }
  function pow() { let l = un(); while (peek() && peek().t === 'op' && peek().v === '^') { eat(); l = { k: 'bin', o: '^', l, r: un() }; } return l; }
  function un() {
    if (peek() && peek().t === 'op' && (peek().v === '-' || peek().v === '+')) { const o = eat().v; const e = un(); return o === '-' ? { k: 'neg', e } : e; }
    return prim();
  }
  function prim() {
    const t = eat();
    if (t.t === 'num') return { k: 'num', v: t.v };
    if (t.t === 'str') return { k: 'str', v: t.v };
    if (t.t === 'ref') return { k: 'ref', sh: t.sh, a: t.a, b: t.b };
    if (t.t === 'func') {
      const args = [];
      if (!(peek() && peek().t === 'op' && peek().v === ')')) {
        args.push(expr());
        while (peek() && peek().t === 'op' && peek().v === ',') { eat(); args.push(expr()); }
      }
      eat(')');
      return { k: 'func', n: t.v, args };
    }
    if (t.t === 'op' && t.v === '(') { const e = expr(); eat(')'); return e; }
    throw new Error(`Expresión inválida en «${src}»`);
  }
  const ast = expr();
  if (p !== toks.length) throw new Error(`Sobran tokens en «${src}»`);
  return ast;
}
function splitAddr(a) { const m = /^([A-Z]+)(\d+)$/.exec(a); let c = 0; for (const ch of m[1]) c = c * 26 + (ch.charCodeAt(0) - 64); return [c - 1, parseInt(m[2], 10)]; }
const cache = new Map();
function cellValue(sh, a, stack) {
  const key = `${sh}!${a}`;
  if (cache.has(key)) return cache.get(key);
  const cell = book[sh] && book[sh][a];
  let v = null;
  if (cell) {
    if (cell.f !== undefined) {
      if (stack.includes(key)) throw new Error(`Referencia circular: ${key}`);
      if (!cell.ast) cell.ast = parse(cell.f);
      v = evalNode(cell.ast, sh, [...stack, key]);
    } else v = cell.v === undefined ? null : cell.v;
  }
  cache.set(key, v);
  return v;
}
function rangeValues(node, ctx, stack) {
  const sh = node.sh || ctx;
  if (!book[sh]) throw new Error(`Hoja inexistente: ${sh}`);
  if (!node.b) return [[cellValue(sh, node.a, stack)]];
  const [c1, r1] = splitAddr(node.a); const [c2, r2] = splitAddr(node.b);
  const out = [];
  for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r += 1) {
    const row = [];
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c += 1) row.push(cellValue(sh, A(c, r), stack));
    out.push(row);
  }
  return out;
}
const num = (v) => {
  if (isErr(v)) return v;
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return ERR('#VALUE!');
};
function flatNums(args, ctx, stack) { // valores numéricos (rangos: ignora texto y vacíos)
  const out = [];
  for (const a of args) {
    if (a.k === 'ref' && a.b) { for (const row of rangeValues(a, ctx, stack)) for (const v of row) { if (isErr(v)) return v; if (typeof v === 'number') out.push(v); } }
    else if (a.k === 'ref') { const v = cellValue(a.sh || ctx, a.a, stack); if (isErr(v)) return v; if (typeof v === 'number') out.push(v); }
    else { const v = num(evalNode(a, ctx, stack)); if (isErr(v)) return v; out.push(v); }
  }
  return out;
}
function irr(values, guess) {
  let r = guess;
  for (let it = 0; it < 50; it += 1) {
    let f = 0; let df = 0;
    for (let t = 0; t < values.length; t += 1) { const d = (1 + r) ** t; f += values[t] / d; df += (-t * values[t]) / (d * (1 + r)); }
    if (!Number.isFinite(f) || !Number.isFinite(df) || df === 0) return ERR('#NUM!');
    const nr = r - f / df;
    if (!Number.isFinite(nr) || nr <= -1) return ERR('#NUM!');
    if (Math.abs(nr - r) < 1e-12) return nr;
    r = nr;
  }
  return ERR('#NUM!');
}
function truthy(v) { if (typeof v === 'string') return v.length > 0 && v.toUpperCase() !== 'FALSE'; return !!num(v); }
function evalNode(n, ctx, stack) {
  switch (n.k) {
    case 'num': return n.v;
    case 'str': return n.v;
    case 'ref': {
      if (n.b) return ERR('#VALUE!');
      return cellValue(n.sh || ctx, n.a, stack);
    }
    case 'neg': { const v = num(evalNode(n.e, ctx, stack)); return isErr(v) ? v : -v; }
    case 'bin': {
      const lv = evalNode(n.l, ctx, stack); const rv = evalNode(n.r, ctx, stack);
      if (isErr(lv)) return lv; if (isErr(rv)) return rv;
      if (n.o === '&') return `${lv ?? ''}${rv ?? ''}`;
      if (['=', '<>', '<', '>', '<=', '>='].includes(n.o)) {
        const a = typeof lv === 'string' ? lv.toUpperCase() : (lv ?? 0); const b = typeof rv === 'string' ? rv.toUpperCase() : (rv ?? 0);
        return { '=': a === b, '<>': a !== b, '<': a < b, '>': a > b, '<=': a <= b, '>=': a >= b }[n.o];
      }
      const a = num(lv); const b = num(rv);
      if (isErr(a)) return a; if (isErr(b)) return b;
      if (n.o === '+') return a + b; if (n.o === '-') return a - b; if (n.o === '*') return a * b;
      if (n.o === '/') return b === 0 ? ERR('#DIV/0!') : a / b;
      if (n.o === '^') return a ** b;
      throw new Error(`Operador ${n.o}`);
    }
    case 'func': {
      const N = n.n; const args = n.args;
      if (N === 'IF') { const c = evalNode(args[0], ctx, stack); if (isErr(c)) return c; return truthy(c) ? evalNode(args[1], ctx, stack) : (args[2] ? evalNode(args[2], ctx, stack) : false); }
      if (N === 'IFERROR') { const v = evalNode(args[0], ctx, stack); return isErr(v) ? evalNode(args[1], ctx, stack) : v; }
      if (N === 'AND') { for (const a of args) { const v = evalNode(a, ctx, stack); if (isErr(v)) return v; if (!truthy(v)) return false; } return true; }
      if (N === 'SUM') { const xs = flatNums(args, ctx, stack); return isErr(xs) ? xs : xs.reduce((s, x) => s + x, 0); }
      if (N === 'MIN' || N === 'MAX') { const xs = flatNums(args, ctx, stack); if (isErr(xs)) return xs; if (!xs.length) return 0; return N === 'MIN' ? Math.min(...xs) : Math.max(...xs); }
      if (N === 'COUNT') {
        let c = 0;
        for (const a of args) { if (a.k === 'ref') { for (const row of rangeValues(a, ctx, stack)) for (const v of row) if (typeof v === 'number') c += 1; } else if (typeof evalNode(a, ctx, stack) === 'number') c += 1; }
        return c;
      }
      if (N === 'NPV') { const rate = num(evalNode(args[0], ctx, stack)); if (isErr(rate)) return rate; const xs = flatNums(args.slice(1), ctx, stack); if (isErr(xs)) return xs; return xs.reduce((s, x, i) => s + x / (1 + rate) ** (i + 1), 0); }
      if (N === 'IRR') { const xs = flatNums([args[0]], ctx, stack); if (isErr(xs)) return xs; const g = args[1] ? num(evalNode(args[1], ctx, stack)) : 0.1; return irr(xs, g); }
      if (N === 'SUMPRODUCT') {
        const arrs = args.map((a) => rangeValues(a, ctx, stack).flat().map((v) => (typeof v === 'number' ? v : 0)));
        if (arrs.some((x) => x.length !== arrs[0].length)) return ERR('#VALUE!');
        return arrs[0].reduce((s, _, i) => s + arrs.reduce((p, x) => p * x[i], 1), 0);
      }
      if (N === 'ROUND') { const x = num(evalNode(args[0], ctx, stack)); const d = num(evalNode(args[1], ctx, stack)); return Math.round(x * 10 ** d) / 10 ** d; }
      if (N === 'ABS') { const x = num(evalNode(args[0], ctx, stack)); return isErr(x) ? x : Math.abs(x); }
      if (N === 'INDEX') { const vals = rangeValues(args[0], ctx, stack).flat(); const i = num(evalNode(args[1], ctx, stack)); return vals[i - 1] ?? ERR('#REF!'); }
      if (N === 'MATCH') {
        const target = evalNode(args[0], ctx, stack); const vals = rangeValues(args[1], ctx, stack).flat();
        const i = vals.findIndex((v) => v === target); return i < 0 ? ERR('#N/A') : i + 1;
      }
      throw new Error(`Función no soportada por el intérprete: ${N}`);
    }
    default: throw new Error(`Nodo ${n.k}`);
  }
}
// Evaluar todas las fórmulas del libro
for (const sh of sheetOrder) for (const a of Object.keys(book[sh])) if (book[sh][a].f !== undefined) {
  const v = cellValue(sh, a, []);
  book[sh][a].val = v;
}
const V = (sh, a) => { const v = cellValue(sh, a, []); return v; };

/* ------------------------------------------------------------------------------------------------
 * 14. Cálculo independiente en JavaScript (sin fórmulas) y comparación
 * ---------------------------------------------------------------------------------------------- */
const sum = (xs) => xs.reduce((s, x) => s + x, 0);
const procSec = (arr) => sum(arr.map((x) => x[3]));
const procDir = (arr) => sum(arr.map((x) => x[4]));
const presHoras = (cod) => { const it = PRESUPUESTO.find((x) => x[0] === cod); return it[5] + (it[6] ? sum(it[6]) : 0); };
function paramValues(s) {
  const o = {};
  for (const p of PARAMS) { if (p[0] === '__grupo') continue; const vals = p[4]; if (vals) o[p[0]] = vals[SCEN.indexOf(s)]; }
  if (s === 'base') { o.ms = procSec(PROCESO_ASIS) - procSec(PROCESO_TOBE); o.md = procDir(PROCESO_ASIS) - procDir(PROCESO_TOBE); }
  o.po = presHoras('C.1'); o.rev = presHoras('C.2'); o.capadm = presHoras('C.3'); o.capdoc = presHoras('C.4'); o.kt = presHoras('C.5');
  o.hexe = sum(PRESUPUESTO.filter((x) => x[2] === 'Real').map((x) => presHoras(x[0])));
  o.hplan = sum(PRESUPUESTO.filter((x) => x[2] === 'Planificado' && x[3] === 'Equipo EPE').map((x) => presHoras(x[0])));
  return o;
}
function modelo(p) {
  const B = {
    b1: p.ciclos * p.vol * (p.ms / 60 * p.hs + p.md / 60 * p.hd),
    b2: p.ciclos * p.vol * p.cuotas * p.mp / 60 * p.hs + p.hr * 12 * p.hs,
    b3: p.ma / 60 * p.dias * p.hs + p.vol * p.qp * p.meses * p.mq / 60 * p.pr * p.hs,
    b4: p.ciclos * p.precio * p.margen * (p.add + p.ret * p.frac),
    b5: p.vol * p.ciclos * p.precio * p.moro,
  };
  const b100 = sum(Object.values(B));
  const C = { c1: p.vercel * p.asientos * 12 * p.fx, c2: p.vps * p.fx, c3: p.firebase * p.fx, c4: p.ops * 12 * p.ht, c5: p.mant * 12 * p.ht };
  const opex = sum(Object.values(C));
  const i0a = (p.po * p.hd + p.rev * p.hd + p.capadm * p.hs + p.capdoc * p.hdoc + p.kt * p.ht) * (1 + p.cont);
  const aporte = p.hexe * p.ht + p.hplan * p.ht * (1 + p.cont);
  const alfa = [0, p.a1, p.a2, p.a3];
  const ben = alfa.map((a) => a * b100);
  const benLines = alfa.map((a) => Object.fromEntries(Object.entries(B).map(([k, v]) => [k, a * v])));
  const opexY = [0, opex, opex, opex];
  const costA = opexY.map((x, t) => x + (t === 0 ? i0a : 0));
  const costB = costA.map((x, t) => x + (t === 0 ? aporte : 0));
  const netA = ben.map((b, t) => b - costA[t]);
  const netB = ben.map((b, t) => b - costB[t]);
  const r = p.tasa;
  const pv = (xs) => sum(xs.map((x, t) => x / (1 + r) ** t));
  const payback = (net, disc) => {
    const flows = disc ? net.map((x, t) => x / (1 + r) ** t) : net;
    let cum = flows[0];
    for (let t = 1; t < flows.length; t += 1) { const nc = cum + flows[t]; if (cum < 0 && nc >= 0) return (t - 1) + (-cum) / flows[t]; cum = nc; }
    return 'No se recupera en 3 años';
  };
  const irrOr = (xs, g) => { const v = irr(xs, g); return isErr(v) ? 'No calculable' : v; };
  const ind = (net, cost, g) => ({
    van: pv(net), tir: irrOr(net, g), bc: pv(ben) / pv(cost),
    roi: (sum(ben) - sum(cost)) / sum(cost), pay: payback(net, false), payD: payback(net, true), i0: cost[0],
  });
  const u = p.ciclos * (p.ms / 60 * p.hs + p.md / 60 * p.hd) + p.ciclos * p.cuotas * p.mp / 60 * p.hs + p.qp * p.meses * p.mq / 60 * p.pr * p.hs + p.ciclos * p.precio * p.moro;
  const sa = p.a1 / (1 + r) + p.a2 / (1 + r) ** 2 + p.a3 / (1 + r) ** 3;
  const af = 1 / (1 + r) + 1 / (1 + r) ** 2 + 1 / (1 + r) ** 3;
  const A_ = ind(netA, costA, 0.1); const B_ = ind(netB, costB, -0.5);
  return {
    B, b100, C, opex, i0a, aporte, ben, benLines, costA, costB, netA, netB, A: A_, Bv: B_,
    vanAc: A_.van - p.hplan * p.ht * (1 + p.cont),
    u, sa, af,
    veqA: p.vol - A_.van / (u * sa), veqB: p.vol - B_.van / (u * sa),
    aeqA: (i0a + opex * af) / (b100 * af), aeqB: (i0a + aporte + opex * af) / (b100 * af),
    mat: alfa.map((a) => p.vol * p.ciclos * a),
  };
}
const PV = Object.fromEntries(SCEN.map((s) => [s, paramValues(s)]));
const M = Object.fromEntries(SCEN.map((s) => [s, modelo(PV[s])]));

// Comparación libro vs. JavaScript
const issues = [];
const close = (x, y, tol = 1e-6) => (typeof x === 'number' && typeof y === 'number' ? Math.abs(x - y) <= tol * Math.max(1, Math.abs(x), Math.abs(y)) : x === y);
function check(label, x, y) { if (!close(x, y)) issues.push(`${label}: libro=${JSON.stringify(x)} js=${JSON.stringify(y)}`); }
for (const s of SCEN) {
  const R = FB[s]; const m = M[s];
  for (let t = 0; t <= 3; t += 1) {
    const c = YC[t];
    check(`${s} beneficios año ${t}`, V(FL, A(c, R.ben)), m.ben[t]);
    check(`${s} costo A año ${t}`, V(FL, A(c, R.costA)), m.costA[t]);
    check(`${s} costo B año ${t}`, V(FL, A(c, R.costB)), m.costB[t]);
    for (const k of ['b1', 'b2', 'b3', 'b4', 'b5']) check(`${s} ${k} año ${t}`, V(FL, A(c, R[k])), m.benLines[t][k]);
  }
  const ci = 2 + SCEN.indexOf(s);
  check(`${s} VAN A`, V(IND, A(ci, IR.vanA)), m.A.van); check(`${s} TIR A`, V(IND, A(ci, IR.tirA)), m.A.tir);
  check(`${s} B/C A`, V(IND, A(ci, IR.bcA)), m.A.bc); check(`${s} ROI A`, V(IND, A(ci, IR.roiA)), m.A.roi);
  check(`${s} payback A`, V(IND, A(ci, IR.payA)), m.A.pay); check(`${s} payback desc A`, V(IND, A(ci, IR.payDA)), m.A.payD);
  check(`${s} VAN B`, V(IND, A(ci, IR.vanB)), m.Bv.van); check(`${s} TIR B`, V(IND, A(ci, IR.tirB)), m.Bv.tir);
  check(`${s} B/C B`, V(IND, A(ci, IR.bcB)), m.Bv.bc); check(`${s} ROI B`, V(IND, A(ci, IR.roiB)), m.Bv.roi);
  check(`${s} payback B`, V(IND, A(ci, IR.payB)), m.Bv.pay); check(`${s} payback desc B`, V(IND, A(ci, IR.payDB)), m.Bv.payD);
  check(`${s} VAN A contratando cierre`, V(IND, A(ci, IR.vanAc)), m.vanAc);
  check(`${s} V* A`, V(IND, A(ci, IR.veqA)), m.veqA); check(`${s} V* B`, V(IND, A(ci, IR.veqB)), m.veqB);
  check(`${s} alfa* A`, V(IND, A(ci, IR.aeqA)), m.aeqA); check(`${s} alfa* B`, V(IND, A(ci, IR.aeqB)), m.aeqB);
}
// Sensibilidad: recalcular cada variante en JS
const tornadoJs = TORNADO.map((t) => {
  const side = (which) => {
    const p = { ...PV.base };
    if (t.keys) for (const k of t.keys) p[k] = PV[which === 'low' ? 'pes' : 'opt'][k];
    if (t.literal) p[t.literal.key] = t.literal[which];
    return modelo(p).A.van;
  };
  return { label: t.label, lowTxt: t.lowTxt, highTxt: t.highTxt, low: side('low'), high: side('high') };
});
tornadoJs.forEach((t, i) => {
  check(`sensibilidad ${t.label} bajo`, V(SEN, A(6, TORNADO[i].row)), t.low);
  check(`sensibilidad ${t.label} alto`, V(SEN, A(10, TORNADO[i].row)), t.high);
});
// Alternativas en JS
const pb = PV.base; const af12 = 1 / 1.12 + 1 / 1.12 ** 2 + 1 / 1.12 ** 3;
const afBase = 1 / (1 + pb.tasa) + 1 / (1 + pb.tasa) ** 2 + 1 / (1 + pb.tasa) ** 3;
const altJs = [
  [0, 0], [pb.formset * pb.ht, pb.formmnt * 12 * pb.ht], [pb.saasmig * pb.ht, pb.saas * pb.vol * 12 * pb.fx],
  [M.base.i0a, M.base.opex], [pb.extdev * pb.ht, pb.extmnt * 12 * pb.ht],
].map(([i0, an]) => ({ i0, an, va: i0 + an * afBase }));
const scoreCost = (va) => (va <= 2000 ? 5 : va <= 5000 ? 4 : va <= 8000 ? 3 : va <= 12000 ? 2 : 1);
const W = CRIT.map((c) => c[1]);
const altTotals = altJs.map((a, i) => sum(SCORES[i].map((sc, j) => (sc === null ? scoreCost(a.va) : sc) * W[j])));
altJs.forEach((a, i) => {
  check(`alternativa ${i} VA`, V(ALT, A(3, ALT_ROW0 + i)), a.va);
  check(`alternativa ${i} total`, V(ALT, A(7, MAT_ROW0 + i)), altTotals[i]);
});
void af12;
// Proceso y presupuesto
check('proceso min AS-IS', V(PR, A(5, PRS.minAsis)), procSec(PROCESO_ASIS) + procDir(PROCESO_ASIS));
check('proceso min TO-BE', V(PR, A(5, PRS.minTobe)), procSec(PROCESO_TOBE) + procDir(PROCESO_TOBE));
const costAsisJs = procSec(PROCESO_ASIS) / 60 * pb.hs + procDir(PROCESO_ASIS) / 60 * pb.hd;
const costTobeJs = procSec(PROCESO_TOBE) / 60 * pb.hs + procDir(PROCESO_TOBE) / 60 * pb.hd;
check('proceso costo AS-IS', V(PR, A(5, PRS.costAsis)), costAsisJs);
check('proceso costo TO-BE', V(PR, A(5, PRS.costTobe)), costTobeJs);
const shareJs = M.base.B.b1 / M.base.b100;
const matY3Js = pb.vol * pb.ciclos * pb.a3;
const platJs = M.base.opex * shareJs / matY3Js;
check('proceso costo total TO-BE', V(PR, A(5, PRS.totalTobe)), costTobeJs + platJs);
const bacJs = PV.base.hexe * pb.ht + (PV.base.hplan * pb.ht + (M.base.i0a / (1 + pb.cont))) * (1 + pb.cont);
check('BAC', V(PRES, A(PRES_COL.costo, PT.bac)), bacJs);
check('BAC = inversión vista B base', V(PRES, A(PRES_COL.costo, PT.bac)), M.base.costB[0]);

if (issues.length) {
  console.error('ERROR: el libro y el cálculo independiente no coinciden:\n' + issues.join('\n'));
  process.exit(1);
}

/* ------------------------------------------------------------------------------------------------
 * 15. Escritura del .xlsx (fórmulas + valores en caché)
 * ---------------------------------------------------------------------------------------------- */
const wb = XLSX.utils.book_new();
wb.Props = {
  Title: 'Business Case — Plataforma Web Integral CERMAT', Subject: 'Gestión TI E2 (CE0113) y presupuesto E3',
  Author: 'Equipo EPE CERMAT (UPeU Juliaca, 2026-2)', CreatedDate: new Date('2026-10-24T12:00:00Z'),
};
for (const sh of sheetOrder) {
  const ws = {}; let maxC = 0; let maxR = 0;
  for (const [a, cell] of Object.entries(book[sh])) {
    const [c, r] = splitAddr(a); maxC = Math.max(maxC, c); maxR = Math.max(maxR, r);
    const o = {};
    if (cell.f !== undefined) {
      o.f = cell.f;
      const v = cell.val;
      if (isErr(v)) { o.t = 'e'; o.v = 0x24; }
      else if (typeof v === 'number') { o.t = 'n'; o.v = v; }
      else if (typeof v === 'boolean') { o.t = 'b'; o.v = v; }
      else { o.t = 's'; o.v = v === null ? '' : String(v); }
    } else if (typeof cell.v === 'number') { o.t = 'n'; o.v = cell.v; }
    else if (cell.v === null || cell.v === undefined) { o.t = 's'; o.v = ''; }
    else { o.t = 's'; o.v = String(cell.v); }
    if (cell.z) o.z = cell.z;
    ws[a] = o;
  }
  ws['!ref'] = `A1:${A(maxC, maxR)}`;
  if (colWidths[sh]) ws['!cols'] = colWidths[sh].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws, sh);
}
fs.mkdirSync(OUT_DIR, { recursive: true });
XLSX.writeFile(wb, OUT, { bookType: 'xlsx', compression: true });

/* ------------------------------------------------------------------------------------------------
 * 16. Resumen con formato para los documentos
 * ---------------------------------------------------------------------------------------------- */
const nf = (x, d = 0) => {
  if (typeof x !== 'number') return String(x);
  const s = Math.abs(x).toFixed(d).split('.');
  s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (x < 0 && Math.abs(x) >= 0.5 * 10 ** -d ? '−' : '') + s.join(',');
};
const S = (x) => (typeof x === 'number' ? `S/ ${nf(x)}` : x);
const PCT = (x, d = 1) => (typeof x === 'number' ? `${nf(x * 100, d)} %` : x);
const Y = (x) => (typeof x === 'number' ? `${nf(x, 1)} años` : x);
const resumen = {
  generado: OUT,
  escenarios: Object.fromEntries(SCEN.map((s) => {
    const m = M[s];
    return [s, {
      beneficios: m.ben.map((x) => S(x)), lineas: m.benLines.map((l) => Object.fromEntries(Object.entries(l).map(([k, v]) => [k, S(v)]))),
      opex: S(m.opex), costos: m.C ? Object.fromEntries(Object.entries(m.C).map(([k, v]) => [k, S(v)])) : null,
      inversionA: S(m.i0a), aporte: S(m.aporte), costA: m.costA.map(S), costB: m.costB.map(S), netA: m.netA.map(S), netB: m.netB.map(S),
      A: { van: S(m.A.van), tir: PCT(m.A.tir), bc: nf(m.A.bc, 2), roi: PCT(m.A.roi), pay: Y(m.A.pay), payD: Y(m.A.payD), i0: S(m.A.i0) },
      B: { van: S(m.Bv.van), tir: PCT(m.Bv.tir), bc: nf(m.Bv.bc, 2), roi: PCT(m.Bv.roi), pay: Y(m.Bv.pay), payD: Y(m.Bv.payD), i0: S(m.Bv.i0) },
      vanAc: S(m.vanAc), veqA: nf(m.veqA, 1), veqB: nf(m.veqB, 1), aeqA: PCT(m.aeqA), aeqB: PCT(m.aeqB), b100: S(m.b100), mat: m.mat.map((x) => nf(x, 1)),
    }];
  })),
  sensibilidad: tornadoJs.map((t) => ({ ...t, low: S(t.low), high: S(t.high), rango: S(Math.abs(t.high - t.low)) })).sort((a, b) => 0),
  sensibilidadOrden: [...tornadoJs].sort((a, b) => Math.abs(b.high - b.low) - Math.abs(a.high - a.low)).map((t) => `${t.label}: ${S(t.low)} a ${S(t.high)} (rango ${S(Math.abs(t.high - t.low))})`),
  alternativas: altJs.map((a, i) => ({ alt: ALTS[i][0], i0: S(a.i0), anual: S(a.an), va: S(a.va), puntajeCosto: scoreCost(a.va), total: nf(altTotals[i], 2) })),
  robustez: CRIT.map((_, j) => V(ALT, A(1 + j, ROB_WIN))),
  proceso: {
    minAsis: nf(procSec(PROCESO_ASIS) + procDir(PROCESO_ASIS), 1), minTobe: nf(procSec(PROCESO_TOBE) + procDir(PROCESO_TOBE), 1),
    minRed: PCT(V(PR, A(5, PRS.minRed))), costAsis: `S/ ${nf(costAsisJs, 2)}`, costTobe: `S/ ${nf(costTobeJs, 2)}`, costRed: PCT(V(PR, A(5, PRS.costRed))),
    matY3: nf(matY3Js, 1), anualAsis: S(V(PR, A(5, PRS.anualAsis))), anualTobe: S(V(PR, A(5, PRS.anualTobe))),
    share: PCT(shareJs), platPorMat: `S/ ${nf(platJs, 2)}`, totalTobe: `S/ ${nf(costTobeJs + platJs, 2)}`, totalRed: PCT(V(PR, A(5, PRS.totalRed))),
  },
  presupuesto: {
    horasEjecutadas: PV.base.hexe, horasPlanEquipo: PV.base.hplan,
    costoEjecutado: S(V(PRES, A(PRES_COL.costo, PT.exeEq))), costoPlanEquipo: S(V(PRES, A(PRES_COL.costo, PT.planEq))),
    costoPlanCermat: S(V(PRES, A(PRES_COL.costo, PT.planCer))), planTotal: S(V(PRES, A(PRES_COL.costo, PT.planTot))),
    contingencia: S(V(PRES, A(PRES_COL.costo, PT.cont))), bac: S(V(PRES, A(PRES_COL.costo, PT.bac))),
    mensual: MESES.map((m, j) => `${m}: ${S(V(PRES, A(PRES_COL.mes0 + j, PT.planTot)))} (acum. ${S(V(PRES, A(PRES_COL.mes0 + j, PT.acum)))}; con contingencia ${S(V(PRES, A(PRES_COL.mes0 + j, PT.acumCont)))})`),
    paquetes: PRESUPUESTO.map((x) => `${x[0]} ${x[2]} ${x[3]}: ${presHoras(x[0])} h = ${S(V(PRES, A(PRES_COL.costo, x.row)))}`),
  },
};
console.log(`OK: ${OUT}`);
console.log(`Fórmulas verificadas: ${sheetOrder.reduce((n, sh) => n + Object.values(book[sh]).filter((c) => c.f !== undefined).length, 0)} en ${sheetOrder.length} hojas; 0 diferencias con el cálculo independiente.`);
for (const s of SCEN) {
  const e = resumen.escenarios[s];
  console.log(`${SCEN_LABEL[s].padEnd(9)} | A: VAN ${e.A.van} · TIR ${e.A.tir} · B/C ${e.A.bc} · ROI ${e.A.roi} · Rec. ${e.A.pay} (desc. ${e.A.payD}) · I0 ${e.A.i0}`);
  console.log(`${''.padEnd(9)} | B: VAN ${e.B.van} · TIR ${e.B.tir} · B/C ${e.B.bc} · ROI ${e.B.roi} · Rec. ${e.B.pay} · I0 ${e.B.i0}`);
}
if (PRINT_JSON) console.log(JSON.stringify(resumen, null, 2));
