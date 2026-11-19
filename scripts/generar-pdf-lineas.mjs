#!/usr/bin/env node
/**
 * generar-pdf-lineas.mjs — Un PDF con toda la documentación de cada línea del perfil
 *
 * Parte de la página de impresión del sitio ya construido (la del plugin print-site, la misma
 * del PDF completo), deja solo las páginas de la línea, le pone una portada propia, rehace la
 * tabla de contenidos y la imprime con Chrome. El contenido es el mismo que el del sitio.
 * Salida: docs/assets/perfil-egreso-<línea>.pdf
 *
 * Uso (desde perfil-egreso/):
 *   mkdocs build --strict
 *   node scripts/generar-pdf-lineas.mjs [software] [infraestructura] [gestion] [carpeta-del-sitio]
 *   Sin línea genera Software e Infraestructura; la carpeta del sitio es site/ por defecto.
 *
 * Requiere Google Chrome y el paquete playwright (como generar-informes.mjs). No instala nada.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ_DOCS = path.resolve(AQUI, '..'); // perfil-egreso/
const RAIZ_PROYECTO = path.resolve(RAIZ_DOCS, '..'); // academia-school-platform/
const SALIDA = path.join(RAIZ_DOCS, 'docs', 'assets');
const SITIO_PUBLICADO = 'https://yucradavid.github.io/Perfil-de-egreso-Plataforma-Web-Integral-CERMAT/';
const EQUIPO = 'David Robert Yucra Mamani (líder) · Gladys Rosaura Yana Pari · Denilson Leeke Mamani Flores · Cárdenas Vilca Rennzo';

// Cada línea = un grupo de la navegación (su <section> en la página de impresión, por el título)
const LINEAS = {
  software: {
    archivo: 'perfil-egreso-ce02-ingenieria-de-software.pdf',
    grupo: 'B. Ingeniería de Software',
    titulo: 'Ingeniería de Software (CE02)',
    contenido: ['E1 · Requerimientos y diseño del sistema (CE021)', 'E2 · Plataforma de datos del sistema (CE022)', 'E3 · Sistema de software funcional integrado (CE023)', 'E4 · Gestión del proyecto y calidad de software (CE024)'],
  },
  infraestructura: {
    archivo: 'perfil-egreso-ce03-infraestructura-tecnologica.pdf',
    grupo: 'C. Infraestructura Tecnológica',
    titulo: 'Infraestructura Tecnológica (CE03)',
    contenido: ['Resumen del área', 'Semestre 1 · E1 Análisis y diseño de red (CE0311), E2 Diseño de centro de datos híbrido (CE0331) y producto final', 'Semestre 2 · E1 SGSI (CE0321–CE0324), E2 Implementación, testing y monitoreo de red (CE0312–CE0313), E3 Implementación y control de centro de datos (CE0332–CE0333), evidencias del despliegue y producto final'],
  },
  gestion: {
    archivo: 'perfil-egreso-ce01-gestion-de-ti.pdf',
    grupo: 'A. Gestión de Tecnologías de Información',
    titulo: 'Gestión de Tecnologías de Información (CE01)',
    contenido: ['Resumen del área', 'E1 Diagnóstico organizacional, E2 Business case, E3 Plan de gestión del proyecto, E4 Modelado de procesos y E5 Propuesta de solución TIC'],
  },
};

const argumentos = process.argv.slice(2);
const ELEGIDAS = argumentos.filter((a) => a in LINEAS);
const SITIO = path.resolve(argumentos.find((a) => !(a in LINEAS)) ?? path.join(RAIZ_DOCS, 'site'));

function cargarPlaywright() {
  const requerir = createRequire(path.join(RAIZ_PROYECTO, 'package.json'));
  const candidatos = [process.env.PLAYWRIGHT_PATH, path.join(RAIZ_PROYECTO, 'node_modules', 'playwright')];
  const npx = path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), '.npm'), 'npm-cache', '_npx');
  if (fs.existsSync(npx)) for (const d of fs.readdirSync(npx)) candidatos.push(path.join(npx, d, 'node_modules', 'playwright'));
  for (const c of candidatos.filter(Boolean)) if (fs.existsSync(path.join(c, 'package.json'))) return requerir(c);
  throw new Error('No se encontró playwright. Ejecuta `npx playwright --version` o define PLAYWRIGHT_PATH.');
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};
function servirSitio() {
  const servidor = http.createServer((req, res) => {
    let archivo = path.join(SITIO, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!archivo.startsWith(SITIO)) return res.writeHead(403).end();
    if (fs.existsSync(archivo) && fs.statSync(archivo).isDirectory()) archivo = path.join(archivo, 'index.html');
    if (!fs.existsSync(archivo)) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] ?? 'application/octet-stream' });
    fs.createReadStream(archivo).pipe(res);
  });
  return new Promise((ok) => servidor.listen(0, '127.0.0.1', () => ok(servidor)));
}

// Deja en la página de impresión solo el grupo de la línea, con portada y tabla de contenidos propias
function prepararLinea({ grupo, titulo, contenido, publicado, equipo, fecha }) {
  const raiz = document.getElementById('print-site-page');
  document.getElementById('print-site-banner')?.remove();
  const grupos = [...raiz.querySelectorAll(':scope > section.print-page')];
  const indice = grupos.find((s) => s.querySelector('#print-page-toc'));
  const elegido = grupos.find((s) => s.classList.contains('md-section') && s.querySelector(':scope > h1')?.textContent.trim().startsWith(grupo));
  if (!elegido) throw new Error(`No se encontró el grupo «${grupo}» en la página de impresión`);
  for (const s of grupos) if (s !== indice && s !== elegido) s.remove();
  // El título del grupo ya va en la portada
  elegido.querySelector(':scope > h1')?.remove();
  // Los enlaces internos que apuntaban a otras líneas llevan al sitio publicado
  for (const a of raiz.querySelectorAll('a[href^="#"]')) {
    const id = a.getAttribute('href').slice(1);
    if (id && !document.getElementById(id)) a.setAttribute('href', publicado);
  }
  // Portada
  const portada = document.createElement('section');
  portada.className = 'portada-linea';
  portada.innerHTML = `
    <p class="pl-sup">PERFIL DE EGRESO · EPE 2026-2 · INGENIERÍA DE SISTEMAS · UPeU CAMPUS JULIACA</p>
    <p class="pl-proyecto">Plataforma Web Integral de Gestión Académica CERMAT</p>
    <p class="pl-titulo">${titulo}</p>
    <p class="pl-sub">Documentación completa de la línea</p>
    <ul class="pl-lista">${contenido.map((c) => `<li>${c}</li>`).join('')}</ul>
    <p class="pl-dato"><b>Equipo:</b> ${equipo}</p>
    <p class="pl-dato"><b>Sistema en producción:</b> academia-school-platform.vercel.app</p>
    <p class="pl-dato"><b>Sitio de la documentación:</b> ${publicado}</p>
    <p class="pl-nota">Generado el ${fecha} a partir de las mismas páginas del sitio: su contenido es idéntico.</p>`;
  raiz.insertBefore(portada, raiz.firstChild);
  const estilo = document.createElement('style');
  estilo.textContent = `
    .portada-linea { break-after: page; page-break-after: always; padding-top: 30mm; font-family: Roboto, Arial, sans-serif; color: #17233B; }
    .portada-linea .pl-sup { font-size: 9pt; letter-spacing: .12em; color: #5A6B85; font-weight: 700; }
    .portada-linea .pl-proyecto { font-size: 15pt; color: #3b5bdb; font-weight: 700; margin-top: 18mm; }
    .portada-linea .pl-titulo { font-size: 30pt; font-weight: 800; line-height: 1.15; margin: 4mm 0 2mm; border-bottom: 3px solid #3b5bdb; padding-bottom: 4mm; }
    .portada-linea .pl-sub { font-size: 13pt; color: #5A6B85; margin-bottom: 10mm; }
    .portada-linea .pl-lista { font-size: 11pt; line-height: 1.7; margin: 0 0 12mm 5mm; }
    .portada-linea .pl-dato { font-size: 10pt; margin: 1.5mm 0; }
    .portada-linea .pl-nota { font-size: 9pt; color: #5A6B85; margin-top: 12mm; font-style: italic; }`;
  document.head.append(estilo);
  // Tabla de contenidos rehecha con solo las páginas de la línea
  const nav = document.querySelector('#print-page-toc nav');
  nav.querySelectorAll(':scope > ul').forEach((u) => u.remove());
  if (typeof window.generate_toc === 'function') window.generate_toc();
  return nav.querySelectorAll('a').length;
}

async function main() {
  const pagina = path.join(SITIO, 'print_page', 'index.html');
  if (!fs.existsSync(pagina)) throw new Error(`No hay página de impresión en ${SITIO}. Ejecuta antes: mkdocs build --strict`);
  const { chromium } = cargarPlaywright();
  const servidor = await servirSitio();
  const base = `http://127.0.0.1:${servidor.address().port}/`;
  const navegador = await chromium.launch({ channel: 'chrome', headless: true });
  const fecha = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Lima' });
  try {
    const contexto = await navegador.newContext({ colorScheme: 'light', viewport: { width: 1200, height: 900 } });
    // Material dibuja los diagramas en un shadow DOM cerrado; abierto, se puede comprobar que terminaron
    await contexto.addInitScript(() => {
      const original = Element.prototype.attachShadow;
      Element.prototype.attachShadow = function (init) { return original.call(this, { ...init, mode: 'open' }); };
    });
    for (const linea of ELEGIDAS.length ? ELEGIDAS : ['software', 'infraestructura']) {
      const cfg = LINEAS[linea];
      const p = await contexto.newPage();
      await p.goto(`${base}print_page/`, { waitUntil: 'load', timeout: 120000 });
      await p.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
      await p.waitForFunction(
        () => !document.querySelector('pre.mermaid') && [...document.querySelectorAll('div.mermaid')].every((d) => d.shadowRoot?.querySelector('svg')),
        null, { timeout: 120000 },
      );
      const entradas = await p.evaluate(prepararLinea, { ...cfg, publicado: SITIO_PUBLICADO, equipo: EQUIPO, fecha });
      await p.emulateMedia({ media: 'print' });
      await p.waitForTimeout(500);
      const destino = path.join(SALIDA, cfg.archivo);
      await p.pdf({ path: destino, format: 'A4', printBackground: true, preferCSSPageSize: true });
      console.log(`✓ ${cfg.archivo}: ${entradas} entradas en el índice · ${(fs.statSync(destino).size / 1048576).toFixed(1)} MB`);
      await p.close();
    }
  } finally {
    await navegador.close();
    servidor.close();
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
