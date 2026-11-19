#!/usr/bin/env node
/**
 * generar-informes.mjs — Informes del perfil de egreso en Word y PDF
 *
 * La guía pide cada informe de Infraestructura (CE03) en "DOCX + PDF" y sugiere un documento
 * Word/PDF por entregable de Ingeniería de Software (CE02). Este script los genera a partir del
 * sitio ya construido, para que el contenido sea el mismo que el de la web:
 *   - PDF: la página del informe impresa con Chrome (diagramas Mermaid en vectores).
 *   - DOCX: el contenido de la página convertido con pandoc y la plantilla
 *     scripts/plantilla-informe.docx (A4, Calibri, tablas con bordes y pie con el título y el
 *     número de página; se crea con scripts/crear-plantilla-informe.py).
 *     Los diagramas Mermaid entran como imágenes capturadas ya dibujadas, las capturas del sitio
 *     se copian dentro del documento y los enlaces a otras páginas o archivos apuntan al sitio
 *     publicado.
 * Salida: docs/assets/software/informes/ y docs/assets/infraestructura/informes/.
 *
 * Uso (desde perfil-egreso/):
 *   mkdocs build --strict
 *   node scripts/generar-informes.mjs [software|infraestructura] [carpeta-del-sitio]
 *   Sin línea genera las dos; la carpeta del sitio es site/ por defecto.
 *
 * Requiere pandoc en el PATH, Google Chrome y el paquete playwright: se busca en
 * academia-school-platform/node_modules, en la variable PLAYWRIGHT_PATH (carpeta del paquete)
 * o en la caché de npx (por ejemplo, después de `npx playwright --version`). No instala nada.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ_DOCS = path.resolve(AQUI, '..'); // perfil-egreso/
const RAIZ_PROYECTO = path.resolve(RAIZ_DOCS, '..'); // academia-school-platform/
const PLANTILLA = path.join(AQUI, 'plantilla-informe.docx');
const SITIO_PUBLICADO = 'https://yucradavid.github.io/Perfil-de-egreso-Plataforma-Web-Integral-CERMAT/';
const AUTORES = ['David Robert Yucra Mamani (líder)', 'Gladys Rosaura Yana Pari', 'Denilson Leeke Mamani Flores', 'Cárdenas Vilca Rennzo'];
const PIE_PORTADA = 'Plataforma Web Integral CERMAT · Perfil de egreso EPE · UPeU campus Juliaca';

// Página del sitio → nombre del archivo. En CE03 son los nombres de los documentos fuente de la
// guía; en CE02, el código y el nombre del entregable. CE03 toma el entregable de su portada.
const LINEAS = {
  software: {
    salida: path.join(RAIZ_DOCS, 'docs', 'assets', 'software', 'informes'),
    informes: [
      { ruta: 'e1-definicion-sistema-ce021', archivo: 'CE021_S1_E1_Requerimientos_y_Diseno_del_Sistema', entregable: 'Ingeniería de Software (CE02) · CE021 · Semestre 1 · Entregable 1' },
      { ruta: 'e2-base-datos-ce022', archivo: 'CE022_S2_E2_Plataforma_de_Datos_del_Sistema', entregable: 'Ingeniería de Software (CE02) · CE022 · Semestre 2 · Entregable 2' },
      { ruta: 'e3-sistema-funcional-ce023', archivo: 'CE023_S2_E3_Sistema_de_Software_Funcional_Integrado', entregable: 'Ingeniería de Software (CE02) · CE023 · Semestre 2 · Entregable 3' },
      { ruta: 'e4-calidad-operacion-ce024', archivo: 'CE024_S2_E4_Gestion_del_Proyecto_y_Calidad_de_Software', entregable: 'Ingeniería de Software (CE02) · CE024 · Semestre 2 · Entregable 4' },
    ],
  },
  infraestructura: {
    salida: path.join(RAIZ_DOCS, 'docs', 'assets', 'infraestructura', 'informes'),
    informes: [
      { ruta: 'infraestructura/s1-e1-analisis-diseno-red-ce0311', archivo: 'S1_E1_Analisis_y_Diseno_de_Red' },
      { ruta: 'infraestructura/s1-e2-diseno-centro-datos-hibrido-ce0331', archivo: 'S1_E2_Analisis_y_Diseno_de_Centro_de_Datos_Hibrido' },
      { ruta: 'infraestructura/s1-producto-final', archivo: 'S1_Producto_Final_Diseno_Tecnico_Consolidado' },
      { ruta: 'infraestructura/s2-e1-sgsi-ce0321-ce0324', archivo: 'S2_E1_Planificacion_e_Implementacion_del_SGSI' },
      { ruta: 'infraestructura/s2-e2-implementacion-red-ce0312-ce0313', archivo: 'S2_E2_Implementacion_Testing_y_Monitoreo_de_Red' },
      { ruta: 'infraestructura/s2-e3-implementacion-control-cd-ce0332-ce0333', archivo: 'S2_E3_Implementacion_Gestion_y_Control_de_Centro_de_Datos' },
      { ruta: 'infraestructura/s2-producto-final', archivo: 'S2_Producto_Final_Informe_Integral_y_Operativo' },
    ],
  },
};

const argumentos = process.argv.slice(2);
const ELEGIDAS = argumentos.filter((a) => a in LINEAS);
const SITIO = path.resolve(argumentos.find((a) => !(a in LINEAS)) ?? path.join(RAIZ_DOCS, 'site'));

function cargarPlaywright() {
  const requerir = createRequire(path.join(RAIZ_PROYECTO, 'package.json'));
  const candidatos = [process.env.PLAYWRIGHT_PATH, path.join(RAIZ_PROYECTO, 'node_modules', 'playwright')];
  const npx = path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), '.npm'), 'npm-cache', '_npx');
  if (fs.existsSync(npx)) {
    for (const d of fs.readdirSync(npx)) candidatos.push(path.join(npx, d, 'node_modules', 'playwright'));
  }
  for (const c of candidatos.filter(Boolean)) {
    if (fs.existsSync(path.join(c, 'package.json'))) return requerir(c);
  }
  throw new Error('No se encontró playwright. Ejecuta `npx playwright --version` o define PLAYWRIGHT_PATH.');
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

// Servidor estático mínimo sobre la carpeta del sitio (solo en 127.0.0.1)
function servirSitio() {
  const servidor = http.createServer((req, res) => {
    let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let archivo = path.join(SITIO, ruta);
    if (!archivo.startsWith(SITIO)) return res.writeHead(403).end();
    if (fs.existsSync(archivo) && fs.statSync(archivo).isDirectory()) archivo = path.join(archivo, 'index.html');
    if (!fs.existsSync(archivo)) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] ?? 'application/octet-stream' });
    fs.createReadStream(archivo).pipe(res);
  });
  return new Promise((ok) => servidor.listen(0, '127.0.0.1', () => ok(servidor)));
}

// Convierte el artículo de la página en HTML simple para pandoc (se ejecuta en el navegador)
function extraerArticulo({ publicado, anchos }) {
  // Anchos de columna. Con anchos automáticos, Word parte palabras como "VLAN" en las tablas
  // anchas. Se aplica el reparto automático de tablas de CSS, pero medido con la letra de Word
  // (Calibri de 9 pt, encabezado en negrita) sobre el ancho útil de la página: cada columna recibe
  // al menos su palabra más larga y el resto se reparte según el largo de su texto.
  const ANCHO_TEXTO = 642; // 17 cm a 96 ppp
  const RELLENO = 14; // márgenes de celda de la plantilla, en px
  const lienzo = document.createElement('canvas').getContext('2d');
  const medir = (texto, negrita) => {
    lienzo.font = `${negrita ? 'bold ' : ''}12px Calibri, Carlito, sans-serif`;
    return lienzo.measureText(texto).width;
  };
  document.querySelectorAll('article.md-content__inner table').forEach((t) => {
    const filas = [...t.rows];
    const n = filas[0]?.cells.length ?? 0;
    if (!n || filas.some((f) => f.cells.length !== n)) return;
    const minimos = Array(n).fill(0);
    const maximos = Array(n).fill(0);
    filas.forEach((f, r) => [...f.cells].forEach((c, i) => {
      const texto = c.textContent.replace(/\s+/g, ' ').trim();
      // Un código largo (IP, hash, ruta) puede partirse: su mínimo se limita a 100 px.
      const palabra = Math.max(0, ...texto.split(' ').map((p) => Math.min(medir(p, r === 0), 100)));
      minimos[i] = Math.max(minimos[i], palabra + RELLENO);
      maximos[i] = Math.max(maximos[i], medir(texto, r === 0) + RELLENO);
    }));
    const suma = (v) => v.reduce((a, b) => a + b, 0);
    let anchos;
    if (suma(maximos) <= ANCHO_TEXTO) anchos = maximos.map((m) => (m * ANCHO_TEXTO) / suma(maximos));
    else if (suma(minimos) <= ANCHO_TEXTO) {
      const holgura = maximos.map((m, i) => m - minimos[i]);
      anchos = minimos.map((m, i) => m + ((ANCHO_TEXTO - suma(minimos)) * holgura[i]) / (suma(holgura) || 1));
    } else anchos = minimos.map((m) => (m * ANCHO_TEXTO) / suma(minimos));
    t.dataset.anchos = anchos.map((a) => ((a / ANCHO_TEXTO) * 100).toFixed(1)).join(',');
  });
  // Ancho con que se ve cada imagen en la página, para conservarlo en Word
  document.querySelectorAll('article.md-content__inner img').forEach((img) => {
    img.dataset.ancho = String(Math.round(img.getBoundingClientRect().width));
  });
  const articulo = document.querySelector('article.md-content__inner').cloneNode(true);
  articulo.querySelectorAll('table[data-anchos]').forEach((t) => {
    const grupo = document.createElement('colgroup');
    for (const p of t.dataset.anchos.split(',')) {
      const col = document.createElement('col');
      col.setAttribute('style', `width: ${p}%`);
      grupo.append(col);
    }
    t.prepend(grupo);
    t.removeAttribute('data-anchos');
  });
  // Word une dos tablas seguidas en una sola: se separan con un párrafo
  articulo.querySelectorAll('table').forEach((t) => {
    const envoltura = t.closest('.md-typeset__scrollwrap') ?? t;
    if (envoltura.nextElementSibling?.matches('table, .md-typeset__scrollwrap')) {
      const p = document.createElement('p');
      p.textContent = ' ';
      envoltura.after(p);
    }
  });
  // Capturas y figuras del sitio: el script las copia junto al HTML con un nombre local
  const imagenes = [];
  articulo.querySelectorAll('img').forEach((img) => {
    const u = new URL(img.getAttribute('src'), location.href);
    if (u.origin !== location.origin) return img.remove();
    const ruta = decodeURIComponent(u.pathname);
    const archivo = `imagen-${imagenes.length + 1}${ruta.slice(ruta.lastIndexOf('.')).toLowerCase()}`;
    imagenes.push({ ruta, archivo });
    img.setAttribute('src', archivo);
    img.setAttribute('width', String(Math.min(Number(img.dataset.ancho) || 640, 640)));
    for (const a of ['data-ancho', 'loading', 'class']) img.removeAttribute(a);
  });
  const titulo = articulo.querySelector('h1')?.textContent.replace('¶', '').trim() ?? document.title;
  articulo.querySelector('h1')?.remove();
  articulo.querySelectorAll('div.mermaid').forEach((d, i) => {
    const p = document.createElement('p');
    const img = document.createElement('img');
    img.setAttribute('src', `diagrama-${i + 1}.png`);
    img.setAttribute('width', String(Math.min(anchos[i], 640)));
    p.append(img);
    d.replaceWith(p);
  });
  articulo.querySelectorAll('.headerlink, .md-content__button, .md-source-file, button, nav, svg').forEach((e) => e.remove());
  // Bloques de código resaltados: solo el texto (los <pre> sueltos ya son simples)
  articulo.querySelectorAll('div.highlight').forEach((bloque) => {
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = (bloque.querySelector('code') ?? bloque).textContent.replace(/\n$/, '');
    pre.append(code);
    bloque.replaceWith(pre);
  });
  articulo.querySelectorAll('.admonition, details').forEach((a) => {
    const cita = document.createElement('blockquote');
    const t = a.querySelector(':scope > .admonition-title, :scope > summary');
    if (t) {
      const p = document.createElement('p');
      const b = document.createElement('strong');
      b.textContent = t.textContent.trim();
      p.append(b);
      cita.append(p);
      t.remove();
    }
    while (a.firstChild) cita.append(a.firstChild);
    a.replaceWith(cita);
  });
  articulo.querySelectorAll('a[href]').forEach((a) => {
    const u = new URL(a.getAttribute('href'), location.href);
    if (u.origin !== location.origin) return;
    a.setAttribute('href', u.pathname === location.pathname && u.hash ? u.hash : publicado + u.pathname.replace(/^\//, '') + u.hash);
  });
  const fila = (campo) => [...articulo.querySelectorAll('tr')].find((tr) => tr.cells[0]?.textContent.trim() === campo)?.cells[1]?.textContent.trim();
  return { titulo, entregable: fila('Entregable'), fecha: fila('Fecha'), version: fila('Versión'), imagenes, html: articulo.innerHTML };
}

// Copia al directorio de trabajo las imágenes del sitio que usa el informe. Word no muestra SVG
// en todas sus versiones: si el sitio tiene un PNG con el mismo nombre, se usa ese.
function copiarImagenes(imagenes, dir, html) {
  for (const { ruta, archivo } of imagenes) {
    let origen = path.join(SITIO, ruta);
    let destino = archivo;
    const png = origen.replace(/\.svg$/i, '.png');
    if (/\.svg$/i.test(origen) && fs.existsSync(png)) {
      origen = png;
      destino = archivo.replace(/\.svg$/i, '.png');
      html = html.replaceAll(`src="${archivo}"`, `src="${destino}"`);
    }
    if (!fs.existsSync(origen)) throw new Error(`Falta la imagen ${ruta} en el sitio construido`);
    fs.copyFileSync(origen, path.join(dir, destino));
  }
  return html;
}

async function main() {
  if (!fs.existsSync(path.join(SITIO, 'infraestructura'))) throw new Error(`No hay sitio construido en ${SITIO}. Ejecuta antes: mkdocs build --strict`);
  if (!fs.existsSync(PLANTILLA)) throw new Error(`Falta la plantilla ${PLANTILLA}`);
  execFileSync('pandoc', ['--version'], { stdio: 'ignore' });
  const trabajo = fs.mkdtempSync(path.join(os.tmpdir(), 'informes-perfil-'));

  const { chromium } = cargarPlaywright();
  const servidor = await servirSitio();
  const base = `http://127.0.0.1:${servidor.address().port}/`;
  const navegador = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const contexto = await navegador.newContext({ deviceScaleFactor: 2, colorScheme: 'light', viewport: { width: 1200, height: 900 } });
    // Material dibuja los diagramas en un shadow DOM cerrado; abierto, se pueden capturar uno por uno.
    await contexto.addInitScript(() => {
      const original = Element.prototype.attachShadow;
      Element.prototype.attachShadow = function (init) {
        return original.call(this, { ...init, mode: 'open' });
      };
    });
    const pagina = await contexto.newPage();
    for (const linea of ELEGIDAS.length ? ELEGIDAS : Object.keys(LINEAS)) {
      const { salida, informes } = LINEAS[linea];
      fs.mkdirSync(salida, { recursive: true });
      for (const informe of informes) {
        const dir = path.join(trabajo, informe.archivo);
        fs.mkdirSync(dir);
        // Mermaid y las fuentes vienen de CDN: si la red va lenta, basta con que la página cargue
        await pagina.goto(`${base}${informe.ruta}/`, { waitUntil: 'load', timeout: 120000 });
        await pagina.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
        await pagina.waitForFunction(
          () => !document.querySelector('pre.mermaid') && [...document.querySelectorAll('div.mermaid')].every((d) => d.shadowRoot?.querySelector('svg')),
          null,
          { timeout: 60000 },
        );
        // Las capturas se cargan solo al verlas: se esperan todas antes de medirlas
        await pagina.evaluate(async () => {
          const imgs = [...document.querySelectorAll('article img')];
          imgs.forEach((i) => i.setAttribute('loading', 'eager'));
          await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((ok) => { i.onload = ok; i.onerror = ok; }))));
        });
        // La barra superior es fija: en un diagrama más alto que la ventana saldría encima de él
        await pagina.addStyleTag({ content: '.md-header, .md-tabs { visibility: hidden !important; }' });
        const anchos = [];
        const diagramas = await pagina.$$('div.mermaid');
        for (const [i, d] of diagramas.entries()) {
          const svg = (await d.evaluateHandle((h) => h.shadowRoot.querySelector('svg'))).asElement();
          await svg.scrollIntoViewIfNeeded();
          anchos.push(Math.round((await svg.boundingBox()).width));
          await svg.screenshot({ path: path.join(dir, `diagrama-${i + 1}.png`) });
        }
        const datos = await pagina.evaluate(extraerArticulo, { publicado: SITIO_PUBLICADO, anchos });

        // PDF del informe. El número de página va en el pie propio; se apagan los de la hoja de estilos.
        await pagina.addStyleTag({ content: '@page { @bottom-right { content: none; } @bottom-center { content: none; } }' });
        const pie = `<div style="font-size:8px;width:100%;text-align:center;color:#777;font-family:Calibri,Arial,sans-serif">CERMAT · ${datos.titulo.replace(/&/g, '&amp;').replace(/</g, '&lt;')} · página <span class="pageNumber"></span> de <span class="totalPages"></span></div>`;
        await pagina.pdf({
          path: path.join(salida, `${informe.archivo}.pdf`),
          format: 'A4',
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: '<span></span>',
          footerTemplate: pie,
          margin: { top: '16mm', bottom: '18mm', left: '14mm', right: '14mm' },
        });

        // DOCX del informe
        const html = copiarImagenes(datos.imagenes, dir, datos.html);
        fs.writeFileSync(path.join(dir, 'informe.html'), `<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body>${html}</body></html>`);
        // El título lleva el estilo de carácter que cita el pie de página de la plantilla. El
        // campo STYLEREF de Word descarta el punto medio ("S1-E1 · Análisis" sale "S1-E1   Análisis"),
        // así que en el Word el separador es una raya.
        const markdown = datos.titulo.replace(/ · /g, ' — ').replace(/[\\`*_{}[\]<>#|~^$]/g, '\\$&');
        const meta = {
          title: `[${markdown}]{custom-style="Titulo del informe"}`,
          subtitle: [informe.entregable ?? datos.entregable, PIE_PORTADA].filter(Boolean).join(' — '),
          author: AUTORES,
          date: [datos.version && `Versión ${datos.version}`, datos.fecha].filter(Boolean).join(' · '),
          lang: 'es-PE',
        };
        fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta));
        execFileSync('pandoc', [
          'informe.html', '-f', 'html', '-t', 'docx',
          '--reference-doc', PLANTILLA,
          '--metadata-file', 'meta.json',
          '--shift-heading-level-by=-1',
          '-o', path.join(salida, `${informe.archivo}.docx`),
        ], { cwd: dir, stdio: ['ignore', 'inherit', 'inherit'] });

        const kb = (f) => `${Math.round(fs.statSync(path.join(salida, f)).size / 1024)} KB`;
        console.log(`✓ ${informe.archivo}: ${diagramas.length} diagramas, ${datos.imagenes.length} imágenes · DOCX ${kb(`${informe.archivo}.docx`)} · PDF ${kb(`${informe.archivo}.pdf`)}`);
      }
    }
  } finally {
    await navegador.close();
    servidor.close();
    fs.rmSync(trabajo, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
