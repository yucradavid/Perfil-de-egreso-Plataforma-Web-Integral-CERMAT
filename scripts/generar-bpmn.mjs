#!/usr/bin/env node
/**
 * Genera los modelos BPMN 2.0 del proceso de matrícula (Gestión TI, E4 - CE0132 y CE0133):
 *   perfil-egreso/docs/assets/gestion-ti/bpmn/matricula-as-is.bpmn
 *   perfil-egreso/docs/assets/gestion-ti/bpmn/matricula-to-be.bpmn
 *
 * Cada archivo incluye colaboración, pool, carriles (laneSet), tareas, compuertas, eventos, flujos,
 * anotaciones y el diagrama de intercambio (BPMN DI) con coordenadas, para abrirlo y editarlo en
 * bpmn.io o Camunda Modeler. Antes de escribir valida: ids únicos, referencias de flujos, incoming y
 * outgoing coherentes, cada nodo en un solo carril y dentro de él, una forma por elemento, una arista
 * por flujo y que cada arista empiece y termine en el borde de su origen y su destino.
 *
 * Uso, desde la raíz del repositorio: node perfil-egreso/scripts/generar-bpmn.mjs
 * No requiere dependencias.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT_DIR = path.join(ROOT, 'perfil-egreso', 'docs', 'assets', 'gestion-ti', 'bpmn');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const SIZE = {
  task: { w: 120, h: 80 },
  event: { w: 36, h: 36 },
  gateway: { w: 50, h: 50 },
};
const KIND = {
  startEvent: 'event', endEvent: 'event',
  task: 'task', manualTask: 'task', userTask: 'task', serviceTask: 'task', sendTask: 'task',
  exclusiveGateway: 'gateway', parallelGateway: 'gateway',
};

function buildModel(def) {
  const POOL_X = 160;
  const LANE_X = POOL_X + 30;
  const COL_X0 = 280;
  const COL_W = 150;
  const POOL_Y = def.poolY;
  // Carriles
  let y = POOL_Y;
  const lanes = def.lanes.map((l) => { const lane = { ...l, y, h: l.h }; y += l.h; return lane; });
  const poolH = y - POOL_Y;
  const maxCol = Math.max(...def.nodes.map((n) => n.col));
  const poolW = COL_X0 + maxCol * COL_W + 110 - POOL_X;
  const laneById = Object.fromEntries(lanes.map((l) => [l.id, l]));
  // Nodos con geometría
  const nodes = def.nodes.map((n) => {
    const kind = KIND[n.type];
    const { w, h } = SIZE[kind];
    const lane = laneById[n.lane];
    const cx = COL_X0 + n.col * COL_W;
    const cy = lane.y + (n.row === 'alt' ? lane.h - 55 : (lane.mainY ?? lane.h / 2));
    return { ...n, kind, w, h, cx, cy, x: cx - w / 2, y: cy - h / 2 };
  });
  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const pt = (n, side) => ({
    left: [n.x, n.cy], right: [n.x + n.w, n.cy], top: [n.cx, n.y], bottom: [n.cx, n.y + n.h],
  }[side]);
  // Flujos con ruteo ortogonal
  const flows = def.flows.map((f) => {
    const s = nodeById[f.from]; const t = nodeById[f.to];
    let wp;
    const route = f.route || 'auto';
    if (route === 'auto') {
      if (Math.abs(s.cy - t.cy) < 1) wp = [pt(s, 'right'), pt(t, 'left')];
      else {
        const [sx, sy] = pt(s, 'right'); const [tx, ty] = pt(t, 'left');
        const mx = f.midX ?? Math.round((sx + tx) / 2);
        wp = [[sx, sy], [mx, sy], [mx, ty], [tx, ty]];
      }
    } else if (route === 'down-right' || route === 'up-right') { // sale por abajo o arriba y entra por la izquierda
      const [sx, sy] = pt(s, route === 'down-right' ? 'bottom' : 'top'); const [tx, ty] = pt(t, 'left');
      wp = [[sx, sy], [sx, ty], [tx, ty]];
    } else if (route === 'right-down' || route === 'right-up') { // sale por la derecha y entra por arriba o abajo
      const [sx, sy] = pt(s, 'right'); const [tx, ty] = pt(t, route === 'right-down' ? 'top' : 'bottom');
      wp = [[sx, sy], [tx, sy], [tx, ty]];
    } else if (route === 'right-elbow') { // sale por la derecha, sube o baja en x fija y entra por la izquierda
      const [sx, sy] = pt(s, 'right'); const [tx, ty] = pt(t, 'left');
      const mx = s.cx + f.offset;
      wp = [[sx, sy], [mx, sy], [mx, ty], [tx, ty]];
    } else if (route === 'top-to-bottom' || route === 'bottom-to-top') {
      const a = pt(s, route === 'top-to-bottom' ? 'bottom' : 'top'); const b = pt(t, route === 'top-to-bottom' ? 'top' : 'bottom');
      wp = [a, b];
    }
    return { ...f, wp };
  });
  // Anotaciones
  const annotations = (def.annotations || []).map((a) => {
    const n = nodeById[a.attach];
    const w = a.w || 190; const h = a.h || 64;
    const above = a.where === 'above';
    const x = n.cx - w / 2 + (a.dx || 0);
    const yA = above ? POOL_Y - h - 40 : POOL_Y + poolH + 40;
    const nodePt = above ? pt(n, 'top') : pt(n, 'bottom');
    const annPt = above ? [nodePt[0], yA + h] : [nodePt[0], yA];
    return { ...a, w, h, x, y: yA, wp: [nodePt, annPt] };
  });
  return { ...def, POOL_X, POOL_Y, LANE_X, poolW, poolH, lanes, nodes, nodeById, flows, annotations };
}

function validate(m) {
  const errors = [];
  const ids = [m.collabId, m.participantId, m.processId, `LaneSet_${m.key}`, ...m.lanes.map((l) => l.id), ...m.nodes.map((n) => n.id), ...m.flows.map((f) => f.id), ...m.annotations.map((a) => a.id), ...m.annotations.map((a) => `Assoc_${a.id}`)];
  const seen = new Set();
  for (const id of ids) { if (seen.has(id)) errors.push(`id duplicado: ${id}`); seen.add(id); if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(id)) errors.push(`id no válido como NCName: ${id}`); }
  for (const f of m.flows) {
    if (!m.nodeById[f.from]) errors.push(`${f.id}: origen inexistente ${f.from}`);
    if (!m.nodeById[f.to]) errors.push(`${f.id}: destino inexistente ${f.to}`);
  }
  for (const n of m.nodes) {
    const inc = m.flows.filter((f) => f.to === n.id); const out = m.flows.filter((f) => f.from === n.id);
    if (n.type === 'startEvent' && (inc.length || out.length !== 1)) errors.push(`${n.id}: evento de inicio debe tener 0 entradas y 1 salida`);
    if (n.type === 'endEvent' && (out.length || inc.length < 1)) errors.push(`${n.id}: evento de fin debe tener entradas y 0 salidas`);
    if (n.kind === 'task' && (inc.length < 1 || out.length !== 1)) errors.push(`${n.id}: tarea con ${inc.length} entradas y ${out.length} salidas`);
    if (n.kind === 'gateway' && !(inc.length >= 2 || out.length >= 2)) errors.push(`${n.id}: compuerta sin bifurcación ni unión`);
    const lanesWith = m.lanes.filter((l) => l.id === n.lane);
    if (lanesWith.length !== 1) errors.push(`${n.id}: debe pertenecer a un carril`);
    const lane = lanesWith[0];
    if (lane && (n.y < lane.y || n.y + n.h > lane.y + lane.h)) errors.push(`${n.id}: fuera de los límites de su carril`);
    if (n.x < m.LANE_X || n.x + n.w > m.POOL_X + m.poolW) errors.push(`${n.id}: fuera del pool en x`);
  }
  const onBorder = (n, [x, y]) => {
    const tol = 0.5;
    const inX = x >= n.x - tol && x <= n.x + n.w + tol; const inY = y >= n.y - tol && y <= n.y + n.h + tol;
    const onV = Math.abs(x - n.x) <= tol || Math.abs(x - (n.x + n.w)) <= tol;
    const onH = Math.abs(y - n.y) <= tol || Math.abs(y - (n.y + n.h)) <= tol;
    return inX && inY && (onV || onH);
  };
  for (const f of m.flows) {
    if (!f.wp || f.wp.length < 2) { errors.push(`${f.id}: arista sin puntos`); continue; }
    if (!onBorder(m.nodeById[f.from], f.wp[0])) errors.push(`${f.id}: no parte del borde de ${f.from}`);
    if (!onBorder(m.nodeById[f.to], f.wp[f.wp.length - 1])) errors.push(`${f.id}: no llega al borde de ${f.to}`);
    for (let i = 1; i < f.wp.length; i += 1) {
      const [x1, y1] = f.wp[i - 1]; const [x2, y2] = f.wp[i];
      if (x1 !== x2 && y1 !== y2) errors.push(`${f.id}: segmento no ortogonal`);
    }
  }
  for (const a of m.annotations) if (!m.nodeById[a.attach]) errors.push(`${a.id}: anotación sin nodo`);
  return errors;
}

function toXml(m) {
  const L = [];
  const lbl = (n) => {
    if (n.kind === 'task') return '';
    const w = n.kind === 'gateway' ? 110 : 120; const h = 30;
    const x = n.cx - w / 2;
    const y = n.kind === 'gateway' ? n.y - h - 4 : n.y + n.h + 6;
    return `\n        <bpmndi:BPMNLabel>\n          <dc:Bounds x="${x}" y="${y}" width="${w}" height="${h}" />\n        </bpmndi:BPMNLabel>`;
  };
  L.push('<?xml version="1.0" encoding="UTF-8"?>');
  L.push(`<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="Definitions_${m.key}" targetNamespace="https://academia-school-platform.vercel.app/bpmn" exporter="generar-bpmn.mjs (Plataforma CERMAT)" exporterVersion="1.0">`);
  L.push(`  <bpmn:collaboration id="${m.collabId}">`);
  L.push(`    <bpmn:participant id="${m.participantId}" name="${esc(m.poolName)}" processRef="${m.processId}" />`);
  for (const a of m.annotations) {
    L.push(`    <bpmn:textAnnotation id="${a.id}">\n      <bpmn:text>${esc(a.text)}</bpmn:text>\n    </bpmn:textAnnotation>`);
  }
  for (const a of m.annotations) {
    L.push(`    <bpmn:association id="Assoc_${a.id}" associationDirection="None" sourceRef="${a.attach}" targetRef="${a.id}" />`);
  }
  L.push('  </bpmn:collaboration>');
  L.push(`  <bpmn:process id="${m.processId}" name="${esc(m.processName)}" isExecutable="false">`);
  L.push(`    <bpmn:documentation>${esc(m.doc)}</bpmn:documentation>`);
  L.push(`    <bpmn:laneSet id="LaneSet_${m.key}">`);
  for (const l of m.lanes) {
    L.push(`      <bpmn:lane id="${l.id}" name="${esc(l.name)}">`);
    for (const n of m.nodes.filter((x) => x.lane === l.id)) L.push(`        <bpmn:flowNodeRef>${n.id}</bpmn:flowNodeRef>`);
    L.push('      </bpmn:lane>');
  }
  L.push('    </bpmn:laneSet>');
  for (const n of m.nodes) {
    const inc = m.flows.filter((f) => f.to === n.id).map((f) => `      <bpmn:incoming>${f.id}</bpmn:incoming>`);
    const out = m.flows.filter((f) => f.from === n.id).map((f) => `      <bpmn:outgoing>${f.id}</bpmn:outgoing>`);
    const docs = n.doc ? [`      <bpmn:documentation>${esc(n.doc)}</bpmn:documentation>`] : [];
    L.push(`    <bpmn:${n.type} id="${n.id}"${n.name ? ` name="${esc(n.name)}"` : ''}>`);
    L.push(...docs, ...inc, ...out);
    L.push(`    </bpmn:${n.type}>`);
  }
  for (const f of m.flows) L.push(`    <bpmn:sequenceFlow id="${f.id}"${f.name ? ` name="${esc(f.name)}"` : ''} sourceRef="${f.from}" targetRef="${f.to}" />`);
  L.push('  </bpmn:process>');
  L.push(`  <bpmndi:BPMNDiagram id="BPMNDiagram_${m.key}" name="${esc(m.poolName)}">`);
  L.push(`    <bpmndi:BPMNPlane id="BPMNPlane_${m.key}" bpmnElement="${m.collabId}">`);
  L.push(`      <bpmndi:BPMNShape id="${m.participantId}_di" bpmnElement="${m.participantId}" isHorizontal="true">\n        <dc:Bounds x="${m.POOL_X}" y="${m.POOL_Y}" width="${m.poolW}" height="${m.poolH}" />\n      </bpmndi:BPMNShape>`);
  for (const l of m.lanes) {
    L.push(`      <bpmndi:BPMNShape id="${l.id}_di" bpmnElement="${l.id}" isHorizontal="true">\n        <dc:Bounds x="${m.LANE_X}" y="${l.y}" width="${m.poolW - 30}" height="${l.h}" />\n      </bpmndi:BPMNShape>`);
  }
  for (const n of m.nodes) {
    const marker = n.kind === 'gateway' && n.type === 'exclusiveGateway' ? ' isMarkerVisible="true"' : '';
    L.push(`      <bpmndi:BPMNShape id="${n.id}_di" bpmnElement="${n.id}"${marker}>\n        <dc:Bounds x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" />${lbl(n)}\n      </bpmndi:BPMNShape>`);
  }
  for (const a of m.annotations) {
    L.push(`      <bpmndi:BPMNShape id="${a.id}_di" bpmnElement="${a.id}">\n        <dc:Bounds x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" />\n      </bpmndi:BPMNShape>`);
  }
  for (const f of m.flows) {
    const pts = f.wp.map(([x, y]) => `        <di:waypoint x="${x}" y="${y}" />`).join('\n');
    let label = '';
    if (f.name) {
      const [x0, y0] = f.wp[0]; const [x1, y1] = f.wp[1];
      const lx = x0 === x1 ? x0 + 6 : Math.min(x0, x1) + 8; const ly = x0 === x1 ? Math.min(y0, y1) + 8 : y0 - 22;
      label = `\n        <bpmndi:BPMNLabel>\n          <dc:Bounds x="${lx}" y="${ly}" width="24" height="14" />\n        </bpmndi:BPMNLabel>`;
    }
    L.push(`      <bpmndi:BPMNEdge id="${f.id}_di" bpmnElement="${f.id}">\n${pts}${label}\n      </bpmndi:BPMNEdge>`);
  }
  for (const a of m.annotations) {
    const pts = a.wp.map(([x, y]) => `        <di:waypoint x="${x}" y="${y}" />`).join('\n');
    L.push(`      <bpmndi:BPMNEdge id="Assoc_${a.id}_di" bpmnElement="Assoc_${a.id}">\n${pts}\n      </bpmndi:BPMNEdge>`);
  }
  L.push('    </bpmndi:BPMNPlane>');
  L.push('  </bpmndi:BPMNDiagram>');
  L.push('</bpmn:definitions>');
  return `${L.join('\n')}\n`;
}

/* ------------------------------------------------------------------------------------------------
 * Modelo AS-IS: proceso manual (tiempos = supuestos a validar, E4 sección 4.3.4)
 * ---------------------------------------------------------------------------------------------- */
const ASIS = {
  key: 'MatriculaAsIs',
  collabId: 'Collaboration_MatriculaAsIs',
  participantId: 'Participant_AcademiaAsIs',
  processId: 'Process_MatriculaAsIs',
  poolName: 'Academia La Prepa Cermat: matrícula (AS-IS, proceso manual)',
  processName: 'Matrícula AS-IS',
  doc: 'Proceso de matrícula manual de la Academia La Prepa Cermat. Tiempos de personal por actividad: supuestos a validar con 10 trámites cronometrados (E4, sección 4.3.4). Total: 40 min (35 de secretaría y 5 de la Dirección). Equipo EPE CERMAT, 2026-10-24.',
  poolY: 160,
  lanes: [
    { id: 'Lane_Padre', name: 'Padre o postulante', h: 150 },
    { id: 'Lane_Secretaria', name: 'Secretaría', h: 150 },
    { id: 'Lane_Direccion', name: 'Dirección', h: 150 },
  ],
  nodes: [
    { id: 'Start_Interes', type: 'startEvent', name: 'Interés en matricular', lane: 'Lane_Padre', col: 0 },
    { id: 'Task_P1_Consultar', type: 'manualTask', name: 'Consultar en persona, por teléfono o WhatsApp', lane: 'Lane_Padre', col: 1 },
    { id: 'Task_A1_Informar', type: 'manualTask', name: 'A1 Informar oferta, horarios y precios (10 min)', lane: 'Lane_Secretaria', col: 2, doc: 'Supuesto: 10 min de secretaría.' },
    { id: 'Task_A2_Registrar', type: 'manualTask', name: 'A2 Registrar datos en cuaderno u hoja (6 min)', lane: 'Lane_Secretaria', col: 3, doc: 'Supuesto: 6 min. Problema: re-digitación y duplicados.' },
    { id: 'Task_A3_VerificarCupo', type: 'manualTask', name: 'A3 Verificar cupo en otra lista (4 min)', lane: 'Lane_Secretaria', col: 4, doc: 'Supuesto: 4 min. Problema: el cupo vive en un registro distinto al de la matrícula.' },
    { id: 'Gateway_HayCupo', type: 'exclusiveGateway', name: '¿Hay cupo?', lane: 'Lane_Secretaria', col: 5 },
    { id: 'Task_A3B_OfrecerOtro', type: 'manualTask', name: 'Ofrecer otro grupo o lista de espera', lane: 'Lane_Secretaria', col: 6 },
    { id: 'End_NoConcretada', type: 'endEvent', name: 'Matrícula no concretada', lane: 'Lane_Secretaria', col: 7 },
    { id: 'Task_A4_Autorizar', type: 'manualTask', name: 'A4 Revisar y autorizar en persona (5 min)', lane: 'Lane_Direccion', col: 7, doc: 'Supuesto: 5 min de la Dirección. Problema: espera de 1 a 3 días si no está disponible.' },
    { id: 'Gateway_Autoriza', type: 'exclusiveGateway', name: '¿Autoriza?', lane: 'Lane_Direccion', col: 8 },
    { id: 'End_Rechazada', type: 'endEvent', name: 'Matrícula rechazada', lane: 'Lane_Direccion', col: 9 },
    { id: 'Task_P2_Pagar', type: 'manualTask', name: 'Pagar en efectivo', lane: 'Lane_Padre', col: 9 },
    { id: 'Task_A5_Cobrar', type: 'manualTask', name: 'A5 Cobrar y emitir recibo físico (6 min)', lane: 'Lane_Secretaria', col: 10, doc: 'Supuesto: 6 min.' },
    { id: 'Task_A6_Conciliar', type: 'manualTask', name: 'A6 Conciliar el pago con el registro (3 min)', lane: 'Lane_Secretaria', col: 11, doc: 'Supuesto: 3 min. Problema: pago desconectado de la matrícula.' },
    { id: 'Task_A7_Confirmar', type: 'manualTask', name: 'A7 Confirmar al padre y agregar a la lista (6 min)', lane: 'Lane_Secretaria', col: 12, doc: 'Supuesto: 6 min. Problema: confirmación verbal, sin acceso digital.' },
    { id: 'End_Matriculado', type: 'endEvent', name: 'Matriculado sin confirmación digital', lane: 'Lane_Padre', col: 13 },
  ],
  flows: [
    { id: 'Flow_01', from: 'Start_Interes', to: 'Task_P1_Consultar' },
    { id: 'Flow_02', from: 'Task_P1_Consultar', to: 'Task_A1_Informar' },
    { id: 'Flow_03', from: 'Task_A1_Informar', to: 'Task_A2_Registrar' },
    { id: 'Flow_04', from: 'Task_A2_Registrar', to: 'Task_A3_VerificarCupo' },
    { id: 'Flow_05', from: 'Task_A3_VerificarCupo', to: 'Gateway_HayCupo' },
    { id: 'Flow_06_NoCupo', name: 'No', from: 'Gateway_HayCupo', to: 'Task_A3B_OfrecerOtro' },
    { id: 'Flow_07', from: 'Task_A3B_OfrecerOtro', to: 'End_NoConcretada' },
    { id: 'Flow_08_SiCupo', name: 'Sí', from: 'Gateway_HayCupo', to: 'Task_A4_Autorizar', route: 'down-right' },
    { id: 'Flow_09', from: 'Task_A4_Autorizar', to: 'Gateway_Autoriza' },
    { id: 'Flow_10_NoAutoriza', name: 'No', from: 'Gateway_Autoriza', to: 'End_Rechazada' },
    { id: 'Flow_11_SiAutoriza', name: 'Sí', from: 'Gateway_Autoriza', to: 'Task_P2_Pagar', route: 'up-right' },
    { id: 'Flow_12', from: 'Task_P2_Pagar', to: 'Task_A5_Cobrar' },
    { id: 'Flow_13', from: 'Task_A5_Cobrar', to: 'Task_A6_Conciliar' },
    { id: 'Flow_14', from: 'Task_A6_Conciliar', to: 'Task_A7_Confirmar' },
    { id: 'Flow_15', from: 'Task_A7_Confirmar', to: 'End_Matriculado' },
  ],
  annotations: [
    { id: 'Note_Redigitacion', attach: 'Task_A2_Registrar', where: 'above', text: 'Re-digitación en cuaderno, hojas y listas; sin control de duplicados' },
    { id: 'Note_Cupo', attach: 'Task_A3_VerificarCupo', where: 'above', dx: 50, text: 'Cupo en otro registro: riesgo de sobrecupo' },
    { id: 'Note_Espera', attach: 'Task_A4_Autorizar', where: 'below', text: 'Espera de 1 a 3 días por la autorización presencial (supuesto)' },
    { id: 'Note_Pago', attach: 'Task_A6_Conciliar', where: 'above', text: 'Pago desconectado de la matrícula: conciliación manual' },
    { id: 'Note_Confirmacion', attach: 'Task_A7_Confirmar', where: 'above', dx: 50, text: 'Confirmación verbal: sin acceso para el alumno ni código para el padre' },
  ],
};

/* ------------------------------------------------------------------------------------------------
 * Modelo TO-BE: proceso implementado en la plataforma (falta adopción y publicar reglas)
 * ---------------------------------------------------------------------------------------------- */
const TOBE = {
  key: 'MatriculaToBe',
  collabId: 'Collaboration_MatriculaToBe',
  participantId: 'Participant_AcademiaToBe',
  processId: 'Process_MatriculaToBe',
  poolName: 'Academia La Prepa Cermat: matrícula (TO-BE, Plataforma CERMAT)',
  processName: 'Matrícula TO-BE',
  doc: 'Proceso de matrícula rediseñado sobre la Plataforma CERMAT (implementado en src/features/enrollments/api.ts). Total de personal: 10,5 min por matrícula (supuesto a validar). Automatizaciones: validación transaccional de cupo, deduplicación por id determinístico, activación por invitación y sincronización conciliable. Equipo EPE CERMAT, 2026-10-24.',
  poolY: 160,
  lanes: [
    { id: 'Lane_Postulante', name: 'Postulante o padre', h: 150 },
    { id: 'Lane_Plataforma', name: 'Plataforma CERMAT (automático)', h: 150 },
    { id: 'Lane_Secretaria', name: 'Secretaría (panel)', h: 230, mainY: 75 },
    { id: 'Lane_Relacional', name: 'Capa relacional (API y MySQL)', h: 150 },
  ],
  nodes: [
    { id: 'Start_InteresLinea', type: 'startEvent', name: 'Interés en matricular', lane: 'Lane_Postulante', col: 0 },
    { id: 'Task_T1_PreMatricula', type: 'userTask', name: 'T1 Registrar la pre-matrícula en línea', lane: 'Lane_Postulante', col: 1 },
    { id: 'Start_EnSede', type: 'startEvent', name: 'Postulante en la sede', lane: 'Lane_Secretaria', col: 0 },
    { id: 'Task_T1B_RegistroRapido', type: 'userTask', name: 'T1 Registro rápido en el panel', lane: 'Lane_Secretaria', col: 1, doc: 'useQuickEnrollmentSubmit: mismas validaciones que el canal en línea. Promedio de T1 entre canales: 4 min de personal (supuesto).' },
    { id: 'Gateway_Canal', type: 'exclusiveGateway', name: '', lane: 'Lane_Plataforma', col: 2 },
    { id: 'Task_T2_Validar', type: 'serviceTask', name: 'T2 Validar ciclo, grupo, cupo y duplicado en una transacción', lane: 'Lane_Plataforma', col: 3, doc: 'createEnrollment: runTransaction; rechaza si enrolledCount >= capacity o si ya existe el id grupo__teléfono. Reglas: isEnrollmentCycleOpen, isEnrollmentGroupInCycle, isEnrollmentGroupCampusValid.' },
    { id: 'Gateway_Valida', type: 'exclusiveGateway', name: '¿Pre-matrícula válida?', lane: 'Lane_Plataforma', col: 4 },
    { id: 'Task_R1_Motivo', type: 'userTask', name: 'Ver el motivo del rechazo', lane: 'Lane_Postulante', col: 5 },
    { id: 'End_Rechazada', type: 'endEvent', name: 'Pre-matrícula rechazada', lane: 'Lane_Postulante', col: 6 },
    { id: 'Task_T2B_Crear', type: 'serviceTask', name: 'Crear matrícula pendiente (id grupo__teléfono) y descontar el cupo', lane: 'Lane_Plataforma', col: 5 },
    { id: 'Task_T3_Revisar', type: 'userTask', name: 'T3 Revisar la pre-matrícula y registrar el pago (4 min)', lane: 'Lane_Secretaria', col: 6 },
    { id: 'Gateway_Pago', type: 'exclusiveGateway', name: '¿Pago confirmado?', lane: 'Lane_Secretaria', col: 7 },
    { id: 'Task_T3B_Cancelar', type: 'userTask', name: 'Cancelar la matrícula y liberar el cupo', lane: 'Lane_Secretaria', col: 8, row: 'alt', doc: 'updateEnrollmentStatus libera el cupo en una transacción y registra cancelledBy y cancelledAt.' },
    { id: 'End_Cancelada', type: 'endEvent', name: 'Matrícula cancelada', lane: 'Lane_Secretaria', col: 9, row: 'alt' },
    { id: 'Task_T4_Aprobar', type: 'userTask', name: 'T4 Aprobar la matrícula (1 min)', lane: 'Lane_Secretaria', col: 8 },
    { id: 'Task_T4B_Invitacion', type: 'serviceTask', name: 'Generar invitación de 7 días y código de padres; registrar quién aprobó', lane: 'Lane_Plataforma', col: 9, doc: 'markPaidAndCreateStudentInvite: token aleatorio de 24 caracteres, id = SHA-256 del token, vence en 7 días; approvedBy y approvedAt.' },
    { id: 'Gateway_Paralelo', type: 'parallelGateway', name: '', lane: 'Lane_Plataforma', col: 10 },
    { id: 'Task_T5_EnviarEnlace', type: 'sendTask', name: 'T5 Enviar el enlace de activación (1 min)', lane: 'Lane_Secretaria', col: 11 },
    { id: 'Task_T8_Activar', type: 'userTask', name: 'Activar la cuenta con el enlace', lane: 'Lane_Postulante', col: 12 },
    { id: 'End_Activo', type: 'endEvent', name: 'Alumno activo y padre con código', lane: 'Lane_Postulante', col: 13 },
    { id: 'Task_T6_Replicar', type: 'serviceTask', name: 'T6 Registrar por procedimiento y conciliar', lane: 'Lane_Relacional', col: 11, doc: 'syncService (fire-and-forget) → API /api/sync → procedimientos almacenados con la cuenta cermat_api; v_conciliacion_pagos debe tener 0 filas.' },
    { id: 'End_Replica', type: 'endEvent', name: 'Réplica conciliable', lane: 'Lane_Relacional', col: 12 },
  ],
  flows: [
    { id: 'Flow_01', from: 'Start_InteresLinea', to: 'Task_T1_PreMatricula' },
    { id: 'Flow_02', from: 'Task_T1_PreMatricula', to: 'Gateway_Canal', route: 'right-down' },
    { id: 'Flow_03', from: 'Start_EnSede', to: 'Task_T1B_RegistroRapido' },
    { id: 'Flow_04', from: 'Task_T1B_RegistroRapido', to: 'Gateway_Canal', route: 'right-up' },
    { id: 'Flow_05', from: 'Gateway_Canal', to: 'Task_T2_Validar' },
    { id: 'Flow_06', from: 'Task_T2_Validar', to: 'Gateway_Valida' },
    { id: 'Flow_07_NoValida', name: 'No', from: 'Gateway_Valida', to: 'Task_R1_Motivo', route: 'up-right' },
    { id: 'Flow_08', from: 'Task_R1_Motivo', to: 'End_Rechazada' },
    { id: 'Flow_09_SiValida', name: 'Sí', from: 'Gateway_Valida', to: 'Task_T2B_Crear' },
    { id: 'Flow_10', from: 'Task_T2B_Crear', to: 'Task_T3_Revisar' },
    { id: 'Flow_11', from: 'Task_T3_Revisar', to: 'Gateway_Pago' },
    { id: 'Flow_12_NoPago', name: 'No', from: 'Gateway_Pago', to: 'Task_T3B_Cancelar', route: 'down-right' },
    { id: 'Flow_13', from: 'Task_T3B_Cancelar', to: 'End_Cancelada' },
    { id: 'Flow_14_SiPago', name: 'Sí', from: 'Gateway_Pago', to: 'Task_T4_Aprobar' },
    { id: 'Flow_15', from: 'Task_T4_Aprobar', to: 'Task_T4B_Invitacion' },
    { id: 'Flow_16', from: 'Task_T4B_Invitacion', to: 'Gateway_Paralelo' },
    { id: 'Flow_17', from: 'Gateway_Paralelo', to: 'Task_T5_EnviarEnlace', route: 'right-elbow', offset: 60 },
    { id: 'Flow_18', from: 'Gateway_Paralelo', to: 'Task_T6_Replicar', route: 'down-right' },
    { id: 'Flow_19', from: 'Task_T5_EnviarEnlace', to: 'Task_T8_Activar' },
    { id: 'Flow_20', from: 'Task_T8_Activar', to: 'End_Activo' },
    { id: 'Flow_21', from: 'Task_T6_Replicar', to: 'End_Replica' },
  ],
  annotations: [
    { id: 'Note_Transaccion', attach: 'Task_T2_Validar', where: 'above', text: 'Cupo y duplicado garantizados por transacción (6 pruebas de reglas de matrícula pública)' },
    { id: 'Note_Invitacion', attach: 'Task_T4B_Invitacion', where: 'above', text: 'Token aleatorio con hash SHA-256 como id; vence en 7 días; trazabilidad de la aprobación' },
    { id: 'Note_Conciliacion', attach: 'Task_T6_Replicar', where: 'below', text: 'Escritura solo por procedimientos; v_conciliacion_pagos = 0 filas indica que no se perdieron eventos' },
  ],
};

fs.mkdirSync(OUT_DIR, { recursive: true });
let failed = false;
for (const [def, file] of [[ASIS, 'matricula-as-is.bpmn'], [TOBE, 'matricula-to-be.bpmn']]) {
  const m = buildModel(def);
  const errors = validate(m);
  if (errors.length) { failed = true; console.error(`ERROR en ${file}:\n  ${errors.join('\n  ')}`); continue; }
  const xml = toXml(m);
  fs.writeFileSync(path.join(OUT_DIR, file), xml, 'utf8');
  console.log(`OK ${file}: ${m.lanes.length} carriles, ${m.nodes.length} nodos, ${m.flows.length} flujos, ${m.annotations.length} anotaciones; pool ${m.poolW}×${m.poolH}`);
}
if (failed) process.exit(1);
