#!/usr/bin/env node
/**
 * generar-matrices-infra.mjs — Matrices XLSX de la línea de Infraestructura (CE03)
 *
 * Genera en docs/assets/infraestructura/ las matrices de los entregables S1-E1, S1-E2,
 * S2-E1, S2-E2 y S2-E3. Los datos de este archivo son la única fuente de las tablas
 * publicadas en docs/infraestructura/*.md: si se cambia un dato aquí, se regeneran las
 * matrices y se actualiza la tabla correspondiente del informe.
 *
 * Uso (desde perfil-egreso/):
 *   node scripts/generar-matrices-infra.mjs                  # genera los .xlsx
 *   node scripts/generar-matrices-infra.mjs --md <carpeta>   # además exporta las tablas en Markdown
 *                                                            # y un resumen.json con los conteos
 *
 * Requiere SheetJS (paquete xlsx) instalado en la raíz del repositorio de la plataforma
 * (academia-school-platform/node_modules/xlsx). El script no instala nada.
 * Otra ubicación: variable de entorno XLSX_PATH con la ruta a la carpeta del paquete.
 *
 * Contenido: sin datos personales, sin IP públicas y sin secretos.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ_DOCS = path.resolve(AQUI, '..'); // perfil-egreso/
const RAIZ_PROYECTO = path.resolve(RAIZ_DOCS, '..'); // academia-school-platform/
const SALIDA = path.join(RAIZ_DOCS, 'docs', 'assets', 'infraestructura');

function cargarXlsx() {
  const candidatos = [
    process.env.XLSX_PATH,
    path.join(RAIZ_PROYECTO, 'node_modules', 'xlsx'),
  ].filter(Boolean);
  const requerir = createRequire(path.join(RAIZ_PROYECTO, 'package.json'));
  for (const c of candidatos) {
    try {
      return requerir(c);
    } catch {
      /* siguiente candidato */
    }
  }
  console.error('No se encontró SheetJS (xlsx). Instálelo en la raíz del proyecto o defina XLSX_PATH.');
  process.exit(1);
}
const XLSX = cargarXlsx();

const VERSION = '2.0';
const FECHA = '2026-10-24';
const PROYECTO = 'Plataforma CERMAT — arquitectura de seguridad híbrida on-premise + nube';
const EQUIPO =
  'David Robert Yucra Mamani (líder), Gladys Rosaura Yana Pari, Denilson Leeke Mamani Flores, Cárdenas Vilca Rennzo';

// ════════════════════════════════════════════════════════════════════════════
// S1-E1 · CE0311 — Diseño de red
// ════════════════════════════════════════════════════════════════════════════

const vlans = {
  hoja: 'VLAN y subredes',
  columnas: ['VLAN', 'Zona', 'Nombre', 'Subred', 'Gateway', 'DHCP', 'Direcciones fijas', 'Uso', 'Confianza'],
  filas: [
    ['10', 'ADMIN', 'Administrativa', '10.10.10.0/24', '10.10.10.1', '10.10.10.100–10.10.10.199', '.10 estación ADMIN_TI (reserva DHCP); .20 impresora', 'Dirección, secretaría/admisión y caja', 'Media'],
    ['20', 'ACAD', 'Académica', '10.10.20.0/24', '10.10.20.1', '10.10.20.100–10.10.20.250', '—', 'Docentes y equipos de auxiliares para asistencia QR', 'Media'],
    ['30', 'GUEST', 'Invitados', '10.10.30.0/24', '10.10.30.1', '10.10.30.50–10.10.30.250', '—', 'Wi-Fi de visitantes, padres y alumnos, con aislamiento de clientes', 'Baja'],
    ['40', 'SRV', 'Servidores', '10.10.40.0/24', '10.10.40.1', 'Sin DHCP', '.10 VM-APP01; .20 VM-SIEM01; .30 VM-MON01; .40 VM-BKP01', 'Servicios internos', 'Alta'],
    ['50', 'DMZ', 'Zona desmilitarizada', '10.10.50.0/24', '10.10.50.1', 'Sin DHCP', '.10 VM-HPOT01', 'Servicios expuestos y señuelo', 'Baja (expuesta)'],
    ['99', 'MGMT', 'Gestión', '10.10.99.0/27', '10.10.99.1', 'Sin DHCP', '.2 switch; .3 y .4 AP; .5 UPS; .10 PVE01; .11 IPMI; .20 bastión', 'Administración de la infraestructura', 'Máxima'],
    ['—', 'NUBE', 'Red interna del VPS', '10.20.0.0/24', 'Enrutada por el túnel', 'Sin DHCP', '.1 VPS (interfaz dum0)', 'Extremo de nube del túnel IPsec', 'Alta'],
    ['—', 'WAN1', 'Internet por fibra', 'Asignada por el ISP', 'Gateway del ISP', 'DHCP o PPPoE del ISP', 'IP pública de la sede (por confirmar: fija, dinámica o CGNAT)', 'Salida principal', 'No confiable'],
    ['—', 'WAN2', 'Internet 4G/LTE', 'Red privada del router LTE', 'Router LTE', 'DHCP del router', '—', 'Salida alterna con conmutación', 'No confiable'],
  ],
};

const ZONAS_DESTINO = ['Internet', 'ADMIN', 'ACAD', 'GUEST', 'SRV', 'DMZ', 'MGMT', 'NUBE'];
const matrizZonas = {
  hoja: 'Matriz de zonas',
  columnas: ['Origen → destino', ...ZONAS_DESTINO],
  filas: [
    ['Internet', '—', 'D', 'D', 'D', 'D', 'L (FW-60)', 'D', 'D'],
    ['ADMIN (10)', 'P (FW-24)', 'P (misma VLAN)', 'D', 'D', 'L (FW-21, solo ADMIN_TI)', 'D', 'L (FW-20, solo ADMIN_TI)', 'D'],
    ['ACAD (20)', 'P (FW-13)', 'L (FW-11, impresora)', 'P (misma VLAN)', 'D', 'D', 'D', 'D', 'D'],
    ['GUEST (30)', 'L (FW-03)', 'D', 'D', 'D (aislamiento en AP)', 'D', 'D', 'D', 'D'],
    ['SRV (40)', 'L (FW-30, FW-33)', 'D', 'D', 'D', 'L (microsegmentación en Proxmox)', 'D', 'D', 'L (FW-32)'],
    ['DMZ (50)', 'D (FW-41)', 'D', 'D', 'D', 'L (FW-40, solo agente Wazuh)', '—', 'D', 'D'],
    ['MGMT (99)', 'L (FW-56)', 'D', 'D', 'D', 'L (FW-50 a FW-53)', 'L (FW-55)', 'P (misma VLAN)', 'L (FW-54)'],
    ['NUBE (10.20.0.0/24)', '— (salida propia del VPS)', 'D', 'D', 'D', 'L (FW-70 a FW-72)', 'D', 'D', '—'],
  ],
};

const reglasFw = {
  hoja: 'Reglas OPNsense',
  columnas: ['ID', 'Interfaz', 'Origen', 'Destino', 'Servicio', 'Acción', 'Registro', 'Propósito'],
  filas: [
    ['FW-01', 'GUEST', 'Red GUEST', 'Firewall (10.10.30.1)', 'DNS 53/tcp-udp', 'Permitir', 'No', 'Resolución DNS con Unbound y listas de bloqueo'],
    ['FW-02', 'GUEST', 'Red GUEST', 'Alias PRIVADAS (RFC 1918)', 'Cualquiera', 'Bloquear', 'Sí', 'Aislar a los invitados de las redes internas y de la VPN'],
    ['FW-03', 'GUEST', 'Red GUEST', 'Internet (no PRIVADAS)', '80/tcp, 443/tcp, 443/udp', 'Permitir con limitador de ancho de banda', 'No', 'Navegación'],
    ['FW-04', 'GUEST', 'Cualquiera', 'Cualquiera', 'Cualquiera', 'Bloquear', 'Sí', 'Política por defecto'],
    ['FW-10', 'ACAD', 'Red ACAD', 'Firewall (10.10.20.1)', 'DNS 53, NTP 123', 'Permitir', 'No', 'Servicios de infraestructura'],
    ['FW-11', 'ACAD', 'Red ACAD', 'Impresora 10.10.10.20', '9100/tcp, 631/tcp', 'Permitir', 'No', 'Impresión'],
    ['FW-12', 'ACAD', 'Red ACAD', 'Alias PRIVADAS', 'Cualquiera', 'Bloquear', 'Sí', 'Sin acceso a ADMIN, SRV, DMZ, MGMT ni VPN'],
    ['FW-13', 'ACAD', 'Red ACAD', 'Internet', '80/tcp, 443/tcp, 443/udp', 'Permitir', 'No', 'Plataforma (Vercel y Firebase) y navegación'],
    ['FW-20', 'ADMIN', 'ADMIN_TI (10.10.10.10)', 'Red MGMT', '22/tcp, 443/tcp, 8006/tcp', 'Permitir', 'Sí', 'Administración de switch, AP, UPS, firewall e hipervisor'],
    ['FW-21', 'ADMIN', 'ADMIN_TI (10.10.10.10)', 'Red SRV', '22/tcp, 443/tcp, 3001/tcp, 8007/tcp, 19999/tcp', 'Permitir', 'Sí', 'Consolas de Wazuh, Uptime Kuma, PBS y Netdata'],
    ['FW-22', 'ADMIN', 'Red ADMIN', 'Firewall (10.10.10.1)', 'DNS 53, NTP 123', 'Permitir', 'No', 'Servicios de infraestructura'],
    ['FW-23', 'ADMIN', 'Red ADMIN', 'Alias PRIVADAS', 'Cualquiera', 'Bloquear', 'Sí', 'Usuarios administrativos sin acceso a gestión ni a servidores'],
    ['FW-24', 'ADMIN', 'Red ADMIN', 'Internet', '80/tcp, 443/tcp, 443/udp', 'Permitir', 'No', 'Plataforma y servicios en la nube'],
    ['FW-30', 'SRV', 'VM-APP01 (10.10.40.10)', 'Internet', '443/tcp', 'Permitir', 'Sí', 'Verificación de tokens de Firebase (APIs de Google)'],
    ['FW-31', 'SRV', 'Red SRV', 'Firewall (10.10.40.1)', 'DNS 53, NTP 123', 'Permitir', 'No', 'Servicios de infraestructura'],
    ['FW-32', 'SRV', 'VM-BKP01 (10.10.40.40)', 'VPS 10.20.0.1', '22/tcp (SFTP)', 'Permitir', 'Sí', 'Extraer respaldos del VPS y guardar la copia externa cifrada'],
    ['FW-33', 'SRV', 'Red SRV', 'Internet', '80/tcp, 443/tcp', 'Permitir', 'No', 'Actualizaciones de paquetes'],
    ['FW-34', 'SRV', 'Red SRV', 'Cualquiera', 'Cualquiera', 'Bloquear', 'Sí', 'Política por defecto (ADMIN, ACAD, GUEST, DMZ y MGMT)'],
    ['FW-40', 'DMZ', 'VM-HPOT01 (10.10.50.10)', 'VM-SIEM01 (10.10.40.20)', '1514/tcp, 1515/tcp', 'Permitir', 'Sí', 'Enviar los eventos del honeypot al SIEM'],
    ['FW-41', 'DMZ', 'Red DMZ', 'Cualquiera', 'Cualquiera', 'Bloquear', 'Sí', 'Contención: el honeypot no inicia conexiones (prueba DMZ → DB)'],
    ['FW-50', 'MGMT', 'Bastión (10.10.99.20)', 'Red SRV', '22/tcp, 443/tcp', 'Permitir', 'Sí', 'Administración de servidores'],
    ['FW-51', 'MGMT', 'PVE01 (10.10.99.10)', 'VM-BKP01 (10.10.40.40)', '8007/tcp', 'Permitir', 'No', 'Respaldo de VM hacia Proxmox Backup Server'],
    ['FW-52', 'MGMT', 'Red MGMT', 'VM-SIEM01 (10.10.40.20)', '1514/tcp, 1515/tcp', 'Permitir', 'No', 'Agentes Wazuh del host y del bastión'],
    ['FW-53', 'MGMT', 'Red MGMT', 'VM-MON01 (10.10.40.30)', '19999/tcp', 'Permitir', 'No', 'Métricas Netdata del host'],
    ['FW-54', 'MGMT', 'Bastión (10.10.99.20)', 'VPS 10.20.0.1', '22/tcp', 'Permitir', 'Sí', 'Administración del VPS solo por la VPN'],
    ['FW-55', 'MGMT', 'Bastión (10.10.99.20)', 'VM-HPOT01 (10.10.50.10)', '22022/tcp', 'Permitir', 'Sí', 'Administración del honeypot (SSH real en puerto alterno)'],
    ['FW-56', 'MGMT', 'Red MGMT', 'Internet', '80/tcp, 443/tcp', 'Permitir', 'No', 'Actualizaciones de firmware y del hipervisor'],
    ['FW-57', 'MGMT', 'Red MGMT', 'Firewall (10.10.99.1)', 'DNS 53, NTP 123, 443/tcp', 'Permitir', 'No', 'Servicios de infraestructura e interfaz web del firewall'],
    ['FW-58', 'MGMT', 'Cualquiera', 'Cualquiera', 'Cualquiera', 'Bloquear', 'Sí', 'Política por defecto'],
    ['FW-60', 'WAN1/WAN2', 'Internet', 'IP de WAN, 22/tcp → NAT a 10.10.50.10:2222', '22/tcp', 'Permitir (reenvío)', 'Sí', 'Exposición del honeypot, solo si la sede tiene IP pública'],
    ['FW-61', 'WAN1/WAN2', 'Internet', 'Cualquiera', 'Cualquiera', 'Bloquear', 'Sí (muestreo)', 'Política por defecto; ningún otro reenvío de puertos'],
    ['FW-70', 'IPsec', 'VPS 10.20.0.1', 'VM-APP01 (10.10.40.10)', '3001/tcp, 8000/tcp', 'Permitir', 'Sí', 'Proxy inverso del VPS hacia la API y la analítica'],
    ['FW-71', 'IPsec', 'VPS 10.20.0.1', 'VM-SIEM01 (10.10.40.20)', '1514/tcp, 1515/tcp', 'Permitir', 'No', 'Agente Wazuh del VPS'],
    ['FW-72', 'IPsec', 'VPS 10.20.0.1', 'VM-MON01 (10.10.40.30)', '19999/tcp', 'Permitir', 'No', 'Métricas Netdata del VPS'],
    ['FW-73', 'IPsec', 'Cualquiera', 'Cualquiera', 'Cualquiera', 'Bloquear', 'Sí', 'Política por defecto del túnel'],
  ],
};

const reglasUfw = {
  hoja: 'Reglas UFW VPS',
  columnas: ['ID', 'Regla', 'Estado al 2026-10-24', 'Propósito'],
  filas: [
    ['UFW-01', 'default deny incoming', 'Implementado', 'Entrada denegada por defecto'],
    ['UFW-02', 'default allow outgoing', 'Implementado', 'Salida para actualizaciones y renovación de certificados'],
    ['UFW-03', 'allow 80/tcp', 'Implementado', 'Desafío HTTP-01 de Let\'s Encrypt y redirección a HTTPS'],
    ['UFW-04', 'allow 443/tcp', 'Implementado', 'Sitio y API del colegio; proxy hacia la sede (futuro)'],
    ['UFW-05', 'allow 22/tcp', 'Implementado (transitorio)', 'Administración; se reemplaza por UFW-08 cuando la VPN esté validada'],
    ['UFW-06', 'allow 500,4500/udp', 'Pendiente', 'IKEv2 y NAT-T del túnel'],
    ['UFW-07', 'allow in from 10.10.40.40 to 10.20.0.1 port 22 proto tcp', 'Pendiente', 'Extracción de respaldos (usuario SFTP restringido)'],
    ['UFW-08', 'allow in from 10.10.99.20 to 10.20.0.1 port 22 proto tcp', 'Pendiente', 'SSH solo desde el bastión por la VPN'],
    ['UFW-09', 'delete allow 22/tcp', 'Pendiente', 'Cierre de SSH a Internet; la consola del proveedor queda como acceso de emergencia'],
    ['UFW-10', 'limit 22/tcp + fail2ban', 'Pendiente', 'Mitigar fuerza bruta mientras SSH siga expuesto'],
  ],
};

const flujos = {
  hoja: 'Flujos',
  columnas: ['ID', 'Origen', 'Destino', 'Protocolo y puerto', 'Propósito', 'Ruta', 'Estado'],
  filas: [
    ['F-01', 'Usuarios (Internet o sede)', 'SPA en Vercel', 'HTTPS 443/tcp', 'Uso de la plataforma académica', 'Internet', 'Implementado'],
    ['F-02', 'Navegador', 'Firebase Auth, Firestore y Storage', 'HTTPS 443/tcp', 'Identidad y datos operativos', 'Internet', 'Implementado'],
    ['F-03', 'Navegador (admin, docente, auxiliar)', 'Nginx del VPS (api-academia.cermatschool.edu.pe)', 'HTTPS 443/tcp', 'Sincronización hacia MySQL, no bloqueante', 'Internet', 'Implementado (2026-10-24); prueba de punta a punta con respuesta 200'],
    ['F-04', 'VPS 10.20.0.1 (Nginx)', 'VM-APP01 10.10.40.10', 'HTTP 3001/tcp y 8000/tcp dentro de IPsec', 'Proxy inverso hacia la API y la analítica', 'Túnel IPsec', 'Pendiente (hoy Nginx entrega a la API y la analítica en 127.0.0.1 del mismo VPS)'],
    ['F-05', 'VM-APP01', 'APIs de Google (Firebase Admin)', 'HTTPS 443/tcp', 'Verificar tokens de identidad', 'Internet (NAT de OPNsense)', 'Implementado en el VPS (2026-10-24)'],
    ['F-06', 'API y analítica', 'MySQL 8', '3306/tcp en loopback', 'Persistencia relacional', 'Local', 'Implementado en el VPS (2026-10-24)'],
    ['F-07', 'Visitantes', 'Sitio y API del colegio (VPS)', 'HTTP 80/tcp → 301; HTTPS 443/tcp', 'Sistema de gestión del colegio', 'Internet', 'Implementado'],
    ['F-08', 'Laravel (PHP-FPM)', 'PostgreSQL 16', '5432/tcp en loopback', 'Datos del colegio', 'Local', 'Implementado'],
    ['F-09', 'OPNsense (WAN)', 'VPS (IP pública)', 'UDP 500 y 4500 (IKEv2, NAT-T)', 'Establecer el túnel', 'Internet', 'Pendiente'],
    ['F-10', 'VM-BKP01 10.10.40.40', 'VPS 10.20.0.1', 'SSH/SFTP 22/tcp dentro de IPsec', 'Extraer el pg_dump diario (modelo pull)', 'Túnel IPsec', 'Pendiente'],
    ['F-11', 'VM-BKP01 10.10.40.40', 'VPS 10.20.0.1', 'SFTP 22/tcp dentro de IPsec', 'Copia externa cifrada (restic) de los respaldos de MySQL', 'Túnel IPsec', 'Pendiente'],
    ['F-12', 'Bastión 10.10.99.20', 'VPS 10.20.0.1', 'SSH 22/tcp dentro de IPsec', 'Administración del VPS', 'Túnel IPsec', 'Pendiente'],
    ['F-13', 'Bastión 10.10.99.20', 'VM de SRV y DMZ', 'SSH 22/tcp y 22022/tcp', 'Administración de servidores', 'LAN (OPNsense)', 'Pendiente'],
    ['F-14', 'ADMIN_TI 10.10.10.10', 'PVE01, switch, AP, UPS y OPNsense', 'HTTPS 443/tcp y 8006/tcp; SSH 22/tcp', 'Gestión de la infraestructura', 'LAN (OPNsense)', 'Pendiente'],
    ['F-15', 'Agentes Wazuh (VM, host, VPS, honeypot, OPNsense)', 'VM-SIEM01 10.10.40.20', '1514/tcp (eventos), 1515/tcp (registro)', 'Centralización de eventos', 'LAN y túnel', 'Pendiente'],
    ['F-16', 'Netdata (host, VM-APP01, VPS)', 'VM-MON01 10.10.40.30', '19999/tcp', 'Métricas de capacidad', 'LAN y túnel', 'Pendiente'],
    ['F-17', 'Uptime Kuma (VM-MON01)', 'Vercel, VPS, API y túnel', 'HTTPS 443/tcp, ICMP', 'Disponibilidad y vigencia de certificados', 'Internet y túnel', 'Pendiente'],
    ['F-18', 'Internet', 'Honeypot 10.10.50.10', '22/tcp → 2222/tcp (NAT)', 'Captura de intentos de intrusión', 'Internet → DMZ', 'Pendiente (requiere IP pública en la sede)'],
    ['F-19', 'PVE01 10.10.99.10', 'VM-BKP01 10.10.40.40', '8007/tcp', 'Respaldo de VM', 'LAN (OPNsense)', 'Pendiente'],
    ['F-20', 'GitHub Actions', 'Firebase (reglas)', 'HTTPS 443/tcp', 'Publicación de reglas tras el CI', 'Internet', 'Implementado en código (requiere el secreto)'],
    ['F-21', 'Equipos ACAD', 'Impresora 10.10.10.20', '9100/tcp, 631/tcp', 'Impresión', 'LAN (OPNsense)', 'Pendiente'],
    ['F-22', 'Equipos de la sede', 'OPNsense (Unbound y NTP)', 'DNS 53, NTP 123', 'Resolución de nombres y hora', 'LAN', 'Pendiente'],
  ],
};

const componentesRed = {
  hoja: 'Componentes',
  columnas: ['ID', 'Componente', 'IP planeada', 'Zona', 'Función', 'Criticidad', 'Estado al 2026-10-24', 'Diagramas'],
  filas: [
    ['NET-01', 'Enlace de Internet por fibra (ISP principal)', 'IP asignada por el ISP', 'WAN1', 'Salida principal a Internet y terminación del túnel', 'Alta', 'Existente (tipo de IP por confirmar)', 'General, Lógica'],
    ['NET-02', 'ONT o módem del ISP en modo puente', 'Sin gestión expuesta', 'WAN1', 'Entrega el enlace de fibra al firewall', 'Alta', 'Existente (modo por confirmar)', 'General, Física'],
    ['NET-03', 'Router 4G/LTE de respaldo', 'Red privada del router LTE', 'WAN2', 'Salida alterna con conmutación automática', 'Media', 'Diseñado', 'General, Lógica, Física'],
    ['NET-04', 'Firewall perimetral OPNsense (VM-FW01)', 'WAN1 y WAN2 por DHCP/PPPoE; .1 en cada VLAN', 'Perímetro', 'Filtrado con estado, ruteo entre VLAN, NAT, DHCP, DNS, NTP e IPsec', 'Crítica', 'Diseñado', 'General, Lógica, Zonas, Hipervisor'],
    ['NET-05', 'Suricata (IDS/IPS en OPNsense)', 'IPS en WAN1/WAN2; IDS en la troncal interna', 'Perímetro', 'Detección y bloqueo de tráfico malicioso', 'Alta', 'Diseñado', 'General, Zonas'],
    ['NET-06', 'Switch gestionable de 24 puertos PoE+ (802.1Q, LACP)', '10.10.99.2', 'MGMT', 'Conmutación, VLAN y agregación de enlaces con el host', 'Crítica', 'Diseñado', 'General, Lógica, Física'],
    ['NET-07', 'Punto de acceso Wi-Fi 6 n.° 1', '10.10.99.3', 'MGMT', 'SSID por VLAN (10, 20 y 30)', 'Media', 'Diseñado', 'General, Lógica'],
    ['NET-08', 'Punto de acceso Wi-Fi 6 n.° 2', '10.10.99.4', 'MGMT', 'SSID por VLAN (10, 20 y 30)', 'Media', 'Diseñado', 'General, Lógica'],
    ['NET-09', 'UPS con interfaz de red (NUT)', '10.10.99.5', 'MGMT', 'Respaldo eléctrico y apagado ordenado', 'Alta', 'Diseñado', 'General, Física'],
    ['NET-10', 'Host hipervisor PVE01 (gestión)', '10.10.99.10', 'MGMT', 'Virtualización de las VM de red y de servidores', 'Crítica', 'Diseñado', 'General, Lógica, Física, Hipervisor'],
    ['NET-11', 'Gestión fuera de banda del host (IPMI)', '10.10.99.11', 'MGMT', 'Consola remota del servidor físico', 'Media', 'Diseñado', 'Lógica, Física'],
    ['NET-12', 'Bastión SSH (VM-BAS01)', '10.10.99.20', 'MGMT', 'Punto único de administración por SSH, incluida la VPN', 'Alta', 'Diseñado', 'General, Lógica, Zonas, Hipervisor'],
    ['NET-13', 'Servidor de aplicaciones (VM-APP01)', '10.10.40.10', 'SRV', 'API Node.js (3001), MySQL 8 (3306 local) y analítica FastAPI (8000)', 'Alta', 'Diseñado (hoy en el VPS)', 'General, Lógica, Zonas, Hipervisor'],
    ['NET-14', 'SIEM Wazuh (VM-SIEM01)', '10.10.40.20', 'SRV', 'Correlación de eventos, alertas e inventario de agentes', 'Alta', 'Diseñado', 'General, Lógica, Zonas, Hipervisor'],
    ['NET-15', 'Monitoreo (VM-MON01)', '10.10.40.30', 'SRV', 'Uptime Kuma (disponibilidad) y Netdata (métricas)', 'Media', 'Diseñado', 'General, Lógica, Zonas, Hipervisor'],
    ['NET-16', 'Respaldo (VM-BKP01, Proxmox Backup Server)', '10.10.40.40', 'SRV', 'Respaldo de VM y repositorio de copias del VPS', 'Alta', 'Diseñado', 'General, Lógica, Zonas, Hipervisor'],
    ['NET-17', 'Honeypot Cowrie (VM-HPOT01)', '10.10.50.10', 'DMZ', 'Señuelo SSH/Telnet para detectar ataques', 'Media', 'Diseñado', 'General, Lógica, Zonas, Hipervisor'],
    ['NET-18', 'Estación de administración TI (ADMIN_TI)', '10.10.10.10 (reserva DHCP)', 'ADMIN', 'Única estación de usuario con acceso a gestión', 'Alta', 'Diseñado', 'General, Lógica, Zonas'],
    ['NET-19', 'Equipos administrativos', '10.10.10.100–10.10.10.199', 'ADMIN', 'Operación de matrícula, pagos y reportes', 'Alta', 'Existentes (por inventariar)', 'General, Lógica'],
    ['NET-20', 'Impresora de red', '10.10.10.20', 'ADMIN', 'Impresión para ADMIN y ACAD', 'Baja', 'Por confirmar', 'General, Lógica'],
    ['NET-21', 'Equipos académicos (docentes y auxiliares)', '10.10.20.100–10.10.20.250', 'ACAD', 'Portales docente y auxiliar; lectura de QR', 'Media', 'Existentes (por inventariar)', 'General, Lógica'],
    ['NET-22', 'Clientes Wi-Fi de invitados', '10.10.30.50–10.10.30.250', 'GUEST', 'Acceso a Internet aislado', 'Baja', 'Diseñado', 'General, Lógica'],
    ['NET-23', 'VPS RackNerd (KVM, Ubuntu 24.04)', 'IP pública del VPS; 10.20.0.1 en dum0 (planificada)', 'NUBE', 'Sistema del colegio, capa relacional de la academia (desde el 2026-10-24), extremo VPN y proxy inverso', 'Crítica', 'Implementado (dum0 pendiente)', 'General, Zonas, Nube'],
    ['NET-24', 'Firewall de host UFW del VPS', '—', 'NUBE', 'Entrada denegada por defecto; 22, 80 y 443/tcp permitidos', 'Alta', 'Implementado', 'General, Zonas, Nube'],
    ['NET-25', 'Nginx con TLS (Let\'s Encrypt) en el VPS', 'IP pública del VPS: 80 → 301 y 443', 'NUBE', 'Servidor web, API del colegio, sitios api-academia y analitica-academia, y proxy inverso hacia la sede', 'Crítica', 'Implementado (proxy hacia la sede pendiente)', 'General, Zonas, Nube'],
    ['NET-26', 'strongSwan IKEv2 en el VPS', 'IP pública del VPS (UDP 500/4500); 10.20.0.1', 'NUBE', 'Extremo de nube del túnel IPsec', 'Alta', 'Diseñado', 'General, Zonas, Nube'],
    ['NET-27', 'Túnel IPsec sitio a sitio', '10.10.40.0/24 y 10.10.99.0/27 ↔ 10.20.0.0/24', 'VPN', 'Respaldo, administración, monitoreo y proxy entre sede y nube', 'Alta', 'Diseñado', 'General, Lógica, Zonas'],
    ['NET-28', 'DNS autoritativo (Punto.pe, servidores RCP)', 'Servicio del proveedor', 'Internet', 'Registros A, CNAME, MX y TXT del dominio', 'Alta', 'Implementado', 'General, Nube'],
    ['NET-29', 'Vercel (SPA de la academia)', 'Dominio *.vercel.app', 'PaaS', 'Entrega de la plataforma por HTTPS', 'Crítica', 'Implementado', 'General, Nube'],
    ['NET-30', 'Firebase (Auth, Firestore y Storage)', 'Servicio de Google', 'PaaS', 'Identidad y datos operativos', 'Crítica', 'Implementado', 'General, Nube'],
    ['NET-31', 'PC local (antes: API, MySQL y analítica con PM2)', 'Red actual de la sede, sin segmentar', 'Actual', 'Entorno anterior de la réplica; desde el 2026-10-24 solo pruebas de restauración', 'Media', 'Retirado (2026-10-24): la capa corre en el VPS', 'General'],
  ],
};

const pruebasPlaneadas = {
  hoja: 'Pruebas planeadas',
  columnas: ['ID', 'Prueba', 'Origen', 'Destino o servicio', 'Herramienta', 'Resultado esperado', 'Regla o requisito'],
  filas: [
    ['PC-01', 'Internet → DMZ', 'Equipo externo (datos móviles)', 'IP de WAN, 22/tcp (honeypot)', 'ssh; nmap -Pn -p 22', 'Sesión simulada de Cowrie y alerta en Wazuh; ningún otro puerto abierto', 'FW-60, FW-61'],
    ['PC-02', 'Internet → LAN', 'Equipo externo', 'IP de WAN, 1000 puertos más comunes', 'nmap -Pn -sS --top-ports 1000', 'Solo responde 22/tcp (honeypot); el resto filtrado', 'FW-61'],
    ['PC-03', 'DMZ → DB', 'VM-HPOT01 (10.10.50.10)', '10.10.40.10:3306', 'nc -vz -w 3', 'Bloqueado y registrado por el firewall', 'FW-41'],
    ['PC-04', 'Usuarios → MGMT', 'Equipo ADMIN (10.10.10.150) y equipo ACAD (10.10.20.120)', '10.10.99.10:8006 y 10.10.99.2:443', 'curl -k -m 5; nc -vz', 'Bloqueado y registrado', 'FW-12, FW-23'],
    ['PC-05', 'ADMIN → MGMT', 'ADMIN_TI (10.10.10.10)', '10.10.99.10:8006', 'Navegador; curl -k', 'Permitido (interfaz de Proxmox)', 'FW-20'],
    ['PC-06', 'Invitados → redes internas', 'Cliente GUEST', '10.10.10.0/24, 10.10.40.0/24 y 10.10.99.0/27', 'ping; nmap -sn', 'Sin respuesta; bloqueos registrados', 'FW-02'],
    ['PC-07', 'Invitados → Internet', 'Cliente GUEST', 'https://academia-school-platform.vercel.app', 'Navegador; curl -I', 'Permitido; DNS resuelto por el firewall', 'FW-01, FW-03'],
    ['PC-08', 'Aislamiento de clientes Wi-Fi', 'Cliente GUEST A', 'Cliente GUEST B', 'ping', 'Sin respuesta (aislamiento en el AP)', 'Configuración del AP'],
    ['PC-09', 'ACAD → impresora y ADMIN', 'Equipo ACAD', '10.10.10.20:9100 y 10.10.10.150', 'nc -vz', 'Impresora permitida; equipo ADMIN bloqueado', 'FW-11, FW-12'],
    ['PC-10', 'SRV → Internet', 'VM-APP01', 'APIs de Google 443/tcp; servidor SMTP 25/tcp', 'curl -I; nc -vz', '443 permitido; 25 bloqueado', 'FW-30, FW-34'],
    ['PC-11', 'Establecimiento del túnel', 'OPNsense ↔ VPS', 'IKEv2', 'swanctl --list-sas; estado IPsec en OPNsense', 'IKE_SA ESTABLISHED y CHILD_SA INSTALLED con AES_GCM_16_256 y ECP_384', 'Diseño VPN'],
    ['PC-12', 'VPN bidireccional', 'Bastión ↔ VPS', '10.20.0.1:22; desde el VPS, 10.10.40.10:3001/health', 'ssh; curl', 'Ambos sentidos responden dentro del túnel', 'FW-54, FW-70'],
    ['PC-13', 'Selectores de tráfico', 'VPS 10.20.0.1', '10.10.10.0/24 y 10.10.20.0/24', 'ping; nc -vz', 'Sin ruta por el túnel (redes no anunciadas)', 'Diseño VPN'],
    ['PC-14', 'Publicación de la API por el VPS', 'Internet', 'https://api-academia…/health y otra ruta', 'curl -I', '/health responde 200 a través del túnel; otras rutas 404', 'Nginx (proxy)'],
    ['PC-15', 'SSH del VPS tras el endurecimiento', 'Internet y bastión', 'IP pública del VPS:22 y 10.20.0.1:22', 'nc -vz; ssh', 'Bloqueado desde Internet; permitido desde el bastión', 'UFW-08, UFW-09'],
    ['PC-16', 'Conmutación de enlaces', 'Equipo ADMIN', 'Internet', 'ping continuo; desconectar WAN1', 'Recuperación en ≤ 60 s por WAN2; el túnel se restablece', 'Grupo de gateways'],
    ['PC-17', 'Detección IDS con firma de prueba', 'Equipo ACAD', 'http://testmynids.org/uid/index.html', 'curl', 'Alerta de Suricata SID 2100498 visible en Wazuh', 'Suricata'],
    ['PC-18', 'Detección de escaneo', 'Cliente GUEST', '10.10.30.1 (firewall)', 'nmap -sS -T4', 'Alertas ET SCAN en Suricata y en Wazuh', 'Suricata'],
    ['PC-19', 'Inicio de sesión en el honeypot', 'Equipo externo', 'Honeypot Cowrie', 'ssh root@<IP de WAN>', 'Evento cowrie.login en Wazuh con regla local de nivel ≥ 10', 'Cowrie y Wazuh'],
    ['PC-20', 'Caída de la API', 'VM-APP01', 'Uptime Kuma', 'pm2 stop cermat-api', 'Alerta en ≤ 2 min y recuperación registrada', 'Uptime Kuma'],
    ['PC-21', 'DNS forzado en invitados', 'Cliente GUEST', '8.8.8.8:53', 'nslookup', 'Bloqueado; solo resuelve el firewall', 'FW-01, FW-04'],
    ['PC-22', 'MTU por el túnel', 'VM-BKP01 → VPS', 'Transferencia SFTP de 100 MB', 'sftp; ping -M do -s 1332', 'Sin fragmentación ni cortes (MSS 1360)', 'Diseño VPN'],
  ],
};

const requisitos = {
  hoja: 'Requisitos',
  columnas: ['ID', 'Tipo', 'Requisito', 'Elemento de diseño', 'Sección', 'Verificación (S2)'],
  filas: [
    ['RQ-01', 'Organizacional', 'Datos de alumnos y pagos accesibles solo por roles autorizados', 'Zonas SRV y MGMT aisladas; reglas por rol en la capa PaaS', 'S1-E1 §8, §9', 'PC-03, PC-04'],
    ['RQ-02', 'Técnico', 'Separar el tráfico de invitados del administrativo y de los servidores', 'VLAN 30, FW-02 y aislamiento de clientes', 'S1-E1 §8', 'PC-06, PC-08'],
    ['RQ-03', 'Técnico', 'Gestión de la infraestructura solo desde estaciones autorizadas', 'VLAN 99, alias ADMIN_TI y bastión', 'S1-E1 §8, §13', 'PC-04, PC-05'],
    ['RQ-04', 'Técnico', 'Ningún servicio interno expuesto a Internet, salvo el señuelo', 'FW-61; NAT solo al honeypot; API publicada por el VPS', 'S1-E1 §9, §13', 'PC-02, PC-14'],
    ['RQ-05', 'Organizacional', 'Matrícula y pagos continúan ante una falla de la sede', 'Servicios críticos en PaaS; enlace WAN2', 'S1-E2 §11', 'PC-16, REC-10'],
    ['RQ-06', 'Técnico', 'Canal cifrado sede ↔ nube para respaldos y administración', 'IPsec IKEv2, AES-256-GCM, PFS', 'S1-E1 §10', 'PC-11, PC-12, PC-13'],
    ['RQ-07', 'Técnico', 'Respaldos 3-2-1 con restauración verificada', 'PBS, VPS y disco externo; restore.js', 'S1-E2 §11', 'REC-01 a REC-12'],
    ['RQ-08', 'Técnico', 'Detección de ataques y trazabilidad de eventos', 'Suricata, Cowrie y Wazuh', 'S1-E1 §14', 'PC-17, PC-18, PC-19'],
    ['RQ-09', 'Técnico', 'Alertas de disponibilidad de los servicios', 'Uptime Kuma con latido externo', 'S1-E2 §11', 'PC-20'],
    ['RQ-10', 'Técnico', 'Capacidad con margen ≥ 30 % para crecimiento', 'Host de 64 GB (47 % comprometido); presupuesto de RAM del VPS', 'S1-E2 §10', 'Medición en S2-E3 §9'],
    ['RQ-11', 'Organizacional', 'Cumplimiento de la Ley N.° 29733 (datos de menores)', 'Clasificación, cifrado en tránsito, mínimo privilegio', 'S2-E1', 'Auditoría interna'],
    ['RQ-12', 'Técnico', 'Administración del VPS solo por canal cifrado y restringido', 'UFW-08, UFW-09 y bastión', 'S1-E1 §13', 'PC-15'],
    ['RQ-13', 'Organizacional', 'Costo de licencias mínimo', 'Software libre: Proxmox VE, OPNsense, Wazuh, Suricata, Cowrie y strongSwan', 'S1-E2 §4, §7', 'Revisión de licencias'],
    ['RQ-14', 'Técnico', 'Escalable a nuevas sedes', 'Bloque 10.x.0.0/16 por sede; el VPS como concentrador VPN', 'S1-E1 §15', '—'],
    ['RQ-15', 'Técnico', 'Réplica relacional disponible 24/7', 'VM-APP01 y proxy en el VPS', 'S1-E2 §8', 'PC-14, PC-20'],
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// S1-E2 · CE0331 — Centro de datos híbrido
// ════════════════════════════════════════════════════════════════════════════

const componentesCd = {
  hoja: 'Componentes CD',
  columnas: ['ID', 'Componente', 'Entorno', 'Tipo', 'Función', 'Criticidad', 'Estado al 2026-10-24'],
  filas: [
    ['CD-01', 'Rack de 12U con puerta y cerradura', 'On-premise', 'Físico', 'Alojar equipos de red y cómputo', 'Alta', 'Diseñado'],
    ['CD-02', 'UPS de 1500 VA con interfaz de red o USB (NUT)', 'On-premise', 'Energía', 'Autonomía y apagado ordenado', 'Alta', 'Diseñado'],
    ['CD-03', 'Regleta o PDU de rack', 'On-premise', 'Energía', 'Distribución eléctrica', 'Media', 'Diseñado'],
    ['CD-04', 'Patch panel Cat 6 de 24 puertos y organizador', 'On-premise', 'Cableado', 'Terminación del cableado horizontal', 'Media', 'Diseñado'],
    ['CD-05', 'Switch gestionable de 24 puertos PoE+ (NET-06)', 'On-premise', 'Red', 'VLAN 802.1Q, LACP y PoE para los AP', 'Crítica', 'Diseñado'],
    ['CD-06', 'Servidor físico PVE01: 8 núcleos/16 hilos, 64 GB ECC, 2×1 TB SSD, 1×4 TB HDD, 4×1 GbE e IPMI', 'On-premise', 'Cómputo', 'Host de virtualización', 'Crítica', 'Diseñado'],
    ['CD-07', 'Proxmox VE (equivalente a VMware ESXi)', 'On-premise', 'Hipervisor', 'Ejecutar y aislar las VM', 'Crítica', 'Diseñado'],
    ['CD-08', 'bond0: LACP 802.3ad sobre NIC1 y NIC2 (equivale a NIC teaming)', 'On-premise', 'Red virtual', 'Agregación y redundancia de enlaces', 'Alta', 'Diseñado'],
    ['CD-09', 'vmbr0: bridge VLAN-aware sobre bond0 con VLAN 10, 20, 30, 40, 50 y 99 (equivale a vSwitch con port groups)', 'On-premise', 'Red virtual', 'Conmutador virtual troncal', 'Crítica', 'Diseñado'],
    ['CD-10', 'vmbr1 (NIC3, WAN1) y vmbr2 (NIC4, WAN2), sin IP del host', 'On-premise', 'Red virtual', 'Entregar los enlaces de Internet solo al firewall virtual', 'Alta', 'Diseñado'],
    ['CD-11', 'VM-FW01: OPNsense con Suricata', 'On-premise', 'VM', 'Firewall perimetral virtual, IDS/IPS y VPN', 'Crítica', 'Diseñado'],
    ['CD-12', 'VM-APP01: API Node.js, MySQL 8 y analítica FastAPI con PM2', 'On-premise', 'VM', 'Réplica relacional, reportes y analítica', 'Alta', 'Diseñado (hoy en el VPS)'],
    ['CD-13', 'VM-SIEM01: Wazuh (indexador, servidor y panel)', 'On-premise', 'VM', 'SIEM', 'Alta', 'Diseñado'],
    ['CD-14', 'VM-MON01: Uptime Kuma y Netdata (padre)', 'On-premise', 'VM', 'Disponibilidad y métricas', 'Media', 'Diseñado'],
    ['CD-15', 'VM-BKP01: Proxmox Backup Server', 'On-premise', 'VM', 'Respaldos deduplicados y verificados', 'Alta', 'Diseñado'],
    ['CD-16', 'VM-HPOT01: Cowrie', 'On-premise', 'VM', 'Honeypot en la DMZ', 'Media', 'Diseñado'],
    ['CD-17', 'VM-BAS01: bastión SSH', 'On-premise', 'VM', 'Administración centralizada', 'Alta', 'Diseñado'],
    ['CD-18', 'Almacenamiento local-zfs (espejo de 2×1 TB SSD)', 'On-premise', 'Almacenamiento', 'Discos de las VM; tolera la falla de un disco', 'Crítica', 'Diseñado'],
    ['CD-19', 'Datastore de respaldos (HDD de 4 TB)', 'On-premise', 'Almacenamiento', 'Segunda copia en un medio distinto', 'Alta', 'Diseñado'],
    ['CD-20', 'Disco externo USB cifrado (rotación mensual)', 'On-premise / fuera de la sede', 'Almacenamiento', 'Copia fuera de línea (regla 3-2-1)', 'Media', 'Diseñado'],
    ['CD-21', 'Enlace de fibra (NET-01)', 'On-premise', 'Conectividad', 'Salida principal', 'Alta', 'Existente (por confirmar)'],
    ['CD-22', 'Enlace 4G/LTE (NET-03)', 'On-premise', 'Conectividad', 'Salida alterna', 'Media', 'Diseñado'],
    ['CD-23', 'VPS RackNerd KVM: 2 vCPU, 2 GB RAM, 35 GB SSD, New York (equivale a EC2)', 'Nube IaaS', 'Cómputo', 'Servidor del colegio, capa relacional de la academia (desde el 2026-10-24) y extremo VPN', 'Crítica', 'Implementado'],
    ['CD-24', 'Ubuntu 24.04 LTS con UFW (equivale a Security Group)', 'Nube IaaS', 'SO y seguridad', 'Base con firewall de host', 'Crítica', 'Implementado'],
    ['CD-25', 'Nginx con Certbot (Let\'s Encrypt)', 'Nube IaaS', 'Servicio web', 'HTTPS, redirección y proxy inverso', 'Crítica', 'Implementado'],
    ['CD-26', 'Sistema del colegio: Angular y Laravel (PHP 8.4-FPM)', 'Nube IaaS', 'Aplicación', 'Gestión escolar', 'Alta', 'Implementado'],
    ['CD-27', 'PostgreSQL 16 solo en loopback, usuario de aplicación sin superusuario', 'Nube IaaS', 'Base de datos', 'Datos del colegio', 'Crítica', 'Implementado'],
    ['CD-28', 'strongSwan e interfaz dum0 10.20.0.1 (equivale a VPN Gateway y subred privada)', 'Nube IaaS', 'Red', 'Extremo del túnel IPsec', 'Alta', 'Diseñado'],
    ['CD-29', 'Vercel: SPA de la academia', 'Nube PaaS', 'Hosting', 'Entrega web con HTTPS y reversión de despliegues', 'Crítica', 'Implementado'],
    ['CD-30', 'Firebase Authentication con claims por rol', 'Nube PaaS', 'Identidad', 'Autenticación y roles', 'Crítica', 'Implementado'],
    ['CD-31', 'Cloud Firestore (22 colecciones con reglas por rol)', 'Nube PaaS', 'Base de datos', 'Fuente de verdad operativa', 'Crítica', 'Implementado (reglas corregidas publicadas el 2026-10-24)'],
    ['CD-32', 'Firebase Storage', 'Nube PaaS', 'Archivos', 'Imágenes y archivos', 'Media', 'Implementado'],
    ['CD-33', 'GitHub: repositorios y Actions (CI de 6 trabajos)', 'Nube SaaS', 'Código y CI', 'Control de versiones y verificación', 'Media', 'Implementado (primera ejecución en GitHub pendiente)'],
    ['CD-34', 'DNS autoritativo Punto.pe/RCP (equivale a Route 53)', 'Proveedor', 'DNS', 'Resolución del dominio', 'Alta', 'Implementado'],
    ['CD-35', 'Túnel IPsec sede ↔ VPS (NET-27)', 'Híbrido', 'Integración', 'Respaldo, administración, monitoreo y proxy', 'Alta', 'Diseñado'],
    ['CD-36', 'PC local con PM2 (entorno anterior de la capa)', 'On-premise (actual)', 'Cómputo', 'Desde el 2026-10-24 solo pruebas de restauración', 'Media', 'Retirado (2026-10-24): la capa corre en el VPS'],
  ],
};

const vms = [
  // [VM, rol, SO, vCPU, RAM GB, disco GB, red, justificación]
  ['VM-FW01', 'Firewall, IDS/IPS y VPN', 'OPNsense (serie estable vigente)', 2, 4, 40, 'vmbr1, vmbr2 y vmbr0 (troncal)', 'Suricata en modo IPS sobre dos WAN y tabla de estados; holgura para las reglas ET Open'],
  ['VM-APP01', 'API, MySQL y analítica', 'Ubuntu Server 24.04 LTS', 2, 4, 60, 'VLAN 40', 'Carga actual baja (8 matrículas y 7 registros de asistencia); buffer pool de MySQL de 1 GB; Node y Python'],
  ['VM-SIEM01', 'SIEM', 'Wazuh 4.x todo en uno sobre Ubuntu 24.04', 4, 8, 150, 'VLAN 40', 'Requisito publicado por Wazuh para 1–25 agentes (4 vCPU, 8 GB, 50 GB por 90 días) más margen de retención'],
  ['VM-MON01', 'Monitoreo', 'Ubuntu 24.04 con Docker', 2, 2, 30, 'VLAN 40', 'Uptime Kuma y Netdata padre con retención corta'],
  ['VM-BKP01', 'Respaldo', 'Proxmox Backup Server', 2, 4, 32, 'VLAN 40 (+ HDD de 4 TB)', 'Deduplicación, verificación y restauración de VM'],
  ['VM-HPOT01', 'Honeypot', 'Debian 12 mínimo con Cowrie', 1, 1, 16, 'VLAN 50', 'Interacción media, sin servicios reales'],
  ['VM-BAS01', 'Bastión', 'Debian 12 mínimo', 1, 1, 16, 'VLAN 99', 'Solo SSH con llaves y registro de sesiones'],
];
const totalVcpu = vms.reduce((s, v) => s + v[3], 0);
const totalRam = vms.reduce((s, v) => s + v[4], 0);
const totalDisco = vms.reduce((s, v) => s + v[5], 0);
const RAM_HOST = 64;
const RAM_SISTEMA = 6; // Proxmox (~2 GB) + ARC de ZFS limitado a 4 GB
const HILOS = 16;
const DISCO_UTIL_GB = 900; // espejo de 2×1 TB, capacidad útil aproximada
const pct = (a, b) => Math.round((a / b) * 100);

const dimVm = {
  hoja: 'Dimensionamiento VM',
  columnas: ['VM', 'Rol', 'Sistema', 'vCPU', 'RAM (GB)', 'Disco (GB)', 'Red', 'Justificación'],
  filas: [
    ...vms.map((v) => [v[0], v[1], v[2], String(v[3]), String(v[4]), String(v[5]), v[6], v[7]]),
    ['Total VM', '', '', String(totalVcpu), String(totalRam), `${totalDisco} (+ 4 TB de respaldo)`, '', ''],
  ],
};

const capacidadHost = {
  hoja: 'Capacidad del host',
  columnas: ['Recurso', 'Capacidad del host', 'Comprometido (año 1)', 'Utilización', 'Margen', 'Criterio de diseño'],
  filas: [
    ['CPU', `${HILOS} hilos (8 núcleos)`, `${totalVcpu} vCPU`, `${(totalVcpu / HILOS).toFixed(2).replace('.', ',')} vCPU por hilo`, 'Admite sobresuscripción hasta 2:1 en cargas ligeras', '≤ 2 vCPU por hilo'],
    ['RAM', `${RAM_HOST} GB ECC`, `${totalRam + RAM_SISTEMA} GB (${totalRam} de VM + ${RAM_SISTEMA} de sistema y ARC de ZFS)`, `${pct(totalRam + RAM_SISTEMA, RAM_HOST)} %`, `${100 - pct(totalRam + RAM_SISTEMA, RAM_HOST)} %`, '≤ 70 % comprometido; sin sobresuscripción de RAM'],
    ['Disco de VM', `~${DISCO_UTIL_GB} GB útiles (espejo 2×1 TB)`, `${totalDisco} GB (aprovisionamiento delgado)`, `${pct(totalDisco, DISCO_UTIL_GB)} %`, `${100 - pct(totalDisco, DISCO_UTIL_GB)} %`, '≤ 70 % (ZFS pierde rendimiento sobre el 80 %)'],
    ['Respaldo', '4 TB (HDD dedicado)', '~0,5 TB (supuesto: 7 diarios, 4 semanales y 6 mensuales deduplicados)', '~13 % (supuesto)', '~87 %', 'Verificar con el informe de deduplicación de PBS'],
    ['Red', '2 Gb/s (bond LACP) + 2 WAN', '< 100 Mb/s (supuesto)', '< 5 %', '> 95 %', 'Medir con Netdata en S2'],
  ],
};

const crecimiento = {
  hoja: 'Crecimiento',
  columnas: ['Escenario', 'Recursos adicionales', 'RAM comprometida resultante', '¿Cabe en el host?'],
  filas: [
    ['VM de pruebas (staging) de la plataforma', '2 vCPU, 4 GB, 60 GB', `${totalRam + RAM_SISTEMA + 4} GB (${pct(totalRam + RAM_SISTEMA + 4, RAM_HOST)} %)`, 'Sí'],
    ['Migrar el sistema del colegio desde el VPS si 2 GB no alcanzan', '2 vCPU, 4 GB, 60 GB', `${totalRam + RAM_SISTEMA + 8} GB (${pct(totalRam + RAM_SISTEMA + 8, RAM_HOST)} %), sumado al anterior`, 'Sí'],
    ['Wazuh con 26–50 agentes (otras sedes)', '+4 vCPU, +100 GB de disco', 'Sin cambio de RAM', 'Sí (CPU sobresuscrita 1,5:1)'],
    ['Segunda sede conectada por VPN al VPS', 'Sin VM nuevas (bloque 10.11.0.0/16)', 'Sin cambio', 'Sí'],
  ],
};

const ramVps = {
  hoja: 'RAM del VPS',
  columnas: ['Componente', 'RAM estimada (MB)', 'Estado', 'Fuente o forma de validar'],
  filas: [
    ['Ubuntu 24.04 base (systemd, sshd, journald, cron)', '250', 'Supuesto a validar', 'Estimación del equipo; medir con free -m y ps -eo rss,comm --sort=-rss'],
    ['Nginx (maestro y 2 workers)', '20', 'Supuesto a validar', 'ps -C nginx -o rss='],
    ['PHP 8.4-FPM (pm dinámico, ~5 procesos)', '200', 'Supuesto a validar', 'ps -C php-fpm8.4 -o rss='],
    ['PostgreSQL 16 (shared_buffers de 128 MB por defecto y conexiones)', '250', 'Supuesto a validar', 'ps -u postgres -o rss=; SHOW shared_buffers;'],
    ['Subtotal actual estimado', '720', 'Supuesto a validar', 'Línea base que se mide antes de agregar componentes'],
    ['strongSwan (charon)', '15', 'Supuesto a validar', 'Medir tras instalar'],
    ['Agente Wazuh', '50', 'Supuesto a validar', 'Medir tras instalar'],
    ['Netdata hijo sin base local (streaming)', '60', 'Supuesto a validar', 'Alternativa más ligera: node_exporter (~15 MB)'],
    ['Total proyectado', '845 de 2048 (≈ 41 %)', 'Supuesto a validar', 'Aceptación: MemAvailable ≥ 25 % en hora pico'],
    ['Capa de la academia (API Node, MySQL 8 y FastAPI)', '≈ 200 medidos (1,5 → 1,3 GiB disponibles)', 'Alojada en el VPS desde el 2026-10-24 (desvío del diseño)', 'free -h antes de instalar y con todo en marcha: 685 MiB usados y 1,3 GiB disponibles (manual de despliegue §9.0 y §9.4); MySQL con buffer de 128 MB y performance_schema desactivado; destino de diseño: VM-APP01 (riesgo R-08)'],
  ],
};

const supuestos = {
  hoja: 'Supuestos',
  columnas: ['ID', 'Supuesto', 'Valor', 'Estado', 'Fuente'],
  filas: [
    ['SUP-01', 'Equipos simultáneos en la sede principal', '12–18', 'Supuesto a validar', 'Levantamiento preliminar del equipo (jun-2026), sin medición'],
    ['SUP-02', 'Ancho de banda del enlace principal', '≥ 50 Mb/s', 'Supuesto a validar', 'Diseño de junio; confirmar con el contrato del ISP y una prueba de velocidad'],
    ['SUP-03', 'Tipo de IP pública de la sede', 'Desconocido (fija, dinámica o CGNAT)', 'Dato a confirmar', 'Consultar al ISP; condiciona la exposición del honeypot. El túnel siempre lo inicia la sede'],
    ['SUP-04', 'Latencia sede ↔ VPS (New York)', '90–150 ms', 'Supuesto a validar', 'Estimación; medir con mtr desde la sede'],
    ['SUP-05', 'Autonomía del UPS con la carga del rack (~200 W)', '20–30 min', 'Supuesto a validar', 'Hoja de datos del modelo elegido'],
    ['SUP-06', 'Consumo eléctrico del rack', '150–250 W', 'Supuesto a validar', 'Suma de consumos típicos de host, switch PoE, ONT y router LTE'],
    ['SUP-07', 'Volumen de datos de MySQL', '< 100 MB en 3 años', 'Supuesto a validar', 'Respaldo actual de 47 KB con datos de prueba; 8 matrículas reales'],
    ['SUP-08', 'Crecimiento de usuarios', 'Piloto con 8 perfiles; cada VLAN /24 admite hasta 253 equipos', 'Supuesto a validar', 'Conteos agregados de Firestore al 2026-10-24'],
    ['SUP-09', 'Retención de eventos en Wazuh', '90 días', 'Supuesto a validar', 'Requisito de Wazuh (50 GB por 90 días para 1–25 agentes)'],
    ['SUP-10', 'Frecuencia de cortes eléctricos en la sede', 'Frecuentes (no medido)', 'Supuesto a validar', 'Percepción del personal; registrar los eventos del UPS durante 3 meses'],
    ['SUP-11', 'Ubicación de los datos de Firestore', 'Desconocida', 'Dato a confirmar', 'Consola de Firebase (ubicación de la base)'],
    ['SUP-12', 'Plan de facturación de Firebase', 'Desconocido (Spark o Blaze)', 'Dato a confirmar', 'Condiciona la exportación programada gestionada'],
    ['SUP-13', 'Plan de Vercel', 'Desconocido', 'Dato a confirmar', 'El plan Hobby está limitado a uso personal no comercial según los términos del proveedor'],
    ['SUP-14', 'Uso real de RAM y disco del VPS', '1,9 GiB de RAM con 1,5 GiB disponibles y 28 GB libres antes de la capa de la academia; 1,3 GiB disponibles con ella en marcha', 'Medido (2026-10-24)', 'free -h y df -h en el VPS (manual de despliegue §9.0 y §9.4)'],
  ],
};

const rtoRpo = {
  hoja: 'RTO-RPO',
  columnas: ['Servicio', 'Ubicación', 'Criticidad', 'RTO objetivo', 'RPO objetivo', 'Mecanismo de recuperación', 'Validación (S2)'],
  filas: [
    ['Plataforma web (SPA)', 'Vercel', 'Crítica', '15 min', '0 (código en Git)', 'Promover el despliegue anterior en Vercel o revertir el commit', 'REC-10'],
    ['Identidad (Firebase Auth)', 'Firebase', 'Crítica', 'Según el proveedor', 'Según el proveedor', 'Exportación semanal de usuarios (firebase auth:export), cifrada', 'REC-11'],
    ['Datos operativos (Firestore)', 'Firebase', 'Crítica', '4 h', '24 h', 'Exportación diaria programada y restauración en un proyecto de prueba', 'REC-11'],
    ['API de sincronización y MySQL', 'VM-APP01 (hoy VPS del colegio)', 'Alta', '1 h', '24 h', 'backup.js diario (temporizador de systemd en el VPS) y restore.js; resincronización desde Firestore', 'REC-01 a REC-05, REC-13 y REC-14'],
    ['Analítica', 'VM-APP01 (hoy VPS del colegio)', 'Baja', '24 h', '24 h', 'Redespliegue desde Git', 'REC-07'],
    ['Sistema del colegio (web, API y PostgreSQL)', 'VPS', 'Alta', '8 h (reconstrucción completa); 2 h (solo base)', '24 h', 'pg_dump -Fc diario con SHA256SUMS y copia en la sede', 'REC-06, REC-08'],
    ['VPN sitio a sitio', 'OPNsense ↔ VPS', 'Media', '1 h (reconexión automática ≤ 2 min)', 'No aplica', 'DPD y reintento; configuración versionada', 'REC-09'],
    ['Firewall perimetral', 'VM-FW01', 'Crítica para la sede', '2 h', 'Último config.xml', 'Restaurar config.xml en una VM nueva; contingencia con el router del ISP', 'REC-12'],
    ['SIEM (Wazuh)', 'VM-SIEM01', 'Media', '24 h', '24 h', 'Restaurar la VM desde PBS', 'REC-07'],
    ['Monitoreo (Uptime Kuma y Netdata)', 'VM-MON01', 'Media', '8 h', '24 h', 'Restaurar la VM desde PBS', 'REC-07'],
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// S2-E1 · CE0321–CE0324 — SGSI
// ════════════════════════════════════════════════════════════════════════════

function criticidadPorValor(v) {
  if (v >= 9) return 'Crítica';
  if (v >= 7) return 'Alta';
  if (v >= 5) return 'Media';
  return 'Baja';
}

// [ID, activo, tipo, propietario, custodio, ubicación, clasificación, C, I, D, estado, evidencia (inventario final)]
const activosBase = [
  ['ACT-01', 'Datos personales de alumnos y apoderados (users, enrollments, students; réplica alumnos)', 'Información', 'Dirección de la academia', 'Equipo técnico', 'Firestore (Google) y réplica MySQL', 'Restringida', 3, 3, 2, 'Operativo', 'Reglas por rol en firestore.rules; 8 perfiles y 8 matrículas (conteo agregado al 2026-10-24)'],
  ['ACT-02', 'Datos de pagos (payments; tabla pagos)', 'Información', 'Dirección de la academia', 'Administrador del sistema', 'Firestore y MySQL', 'Restringida', 3, 3, 2, 'Operativo', '2 pagos confirmados (conteo agregado); triggers de auditoría en MySQL'],
  ['ACT-03', 'Registros de asistencia (attendanceLogs, attendanceDayState, parentAttendance; tabla asistencia)', 'Información', 'Dirección de la academia', 'Auxiliares y equipo técnico', 'Firestore y MySQL', 'Confidencial', 2, 3, 2, 'Operativo', '7 registros (conteo agregado); sp_registrar_asistencia idempotente'],
  ['ACT-04', 'Contenido público (ciclos, sedes, posts, recursos y talleres)', 'Información', 'Dirección de la academia', 'Administrador del sistema', 'Firestore y Storage', 'Pública', 1, 2, 2, 'Operativo', 'Sitio público en Vercel (200 OK, 2026-10-24)'],
  ['ACT-05', 'Configuración de servicios (config/services)', 'Información', 'Líder técnico', 'Administrador del sistema', 'Firestore', 'Interna', 2, 3, 2, 'Operativo', 'src/lib/syncService.ts lee config/services'],
  ['ACT-06', 'Reglas de seguridad de Firestore', 'Software y configuración', 'Líder técnico', 'Equipo técnico', 'Repositorio Git y Firebase', 'Interna', 1, 3, 3, 'Operativo (publicada 2026-10-24)', 'firestore.rules y 19 pruebas; versión corregida publicada el 2026-10-24 (reemplazó la del 22-jun-2026)'],
  ['ACT-07', 'Código fuente, pruebas y pipeline CI', 'Software', 'Líder técnico', 'Equipo técnico', 'GitHub (repositorio privado)', 'Interna', 2, 3, 2, 'Operativo', '.github/workflows/ci.yml (6 trabajos); 99 pruebas'],
  ['ACT-08', 'Secretos y credenciales (cuenta de servicio, contraseñas de BD, llaves SSH, credenciales de VPN)', 'Información', 'Líder técnico', 'Responsable de seguridad', 'Gestor de contraseñas y servidores', 'Restringida', 3, 3, 2, 'Operativo (clave rotada 2026-10-24)', 'db-crear-usuarios.js lee contraseñas del entorno; clave de servicio rotada (H-03 corregido)'],
  ['ACT-09', 'Respaldos (MySQL, PostgreSQL, Firestore y VM)', 'Información', 'Responsable de respaldos', 'Encargado de TI', 'VPS (respaldo diario de MySQL), PC (copia semanal), PBS y disco externo', 'Restringida', 3, 3, 3, 'Parcial (solo MySQL)', 'Temporizador academia-respaldo (diario, 03:00); REC-01, REC-02, REC-05, REC-13 y REC-14'],
  ['ACT-10', 'Datos del sistema del colegio (PostgreSQL cermat_produccion)', 'Información', 'Dirección del colegio', 'Líder técnico', 'VPS (New York)', 'Restringida', 3, 3, 3, 'Operativo', 'Manual del VPS (2026-10-17): 116 migraciones, base solo en loopback'],
  ['ACT-11', 'Registros de eventos (API, Nginx, autenticación, firewall, IDS y SIEM)', 'Información', 'Responsable de seguridad', 'Encargado de TI', 'VPS y VM-SIEM01', 'Confidencial', 2, 3, 2, 'Parcial (sin centralizar)', 'morgan en server/src/index.ts, con sus registros en PM2 del VPS; registros de Nginx en el VPS'],
  ['ACT-12', 'Documentación técnica y del SGSI', 'Información', 'Líder técnico', 'Equipo técnico', 'Repositorio público de documentación', 'Pública e interna', 1, 2, 1, 'Operativo', 'Este sitio de documentación'],
  ['ACT-13', 'Plataforma web de la academia (SPA en Vercel)', 'Servicio', 'Dirección de la academia', 'Líder técnico', 'Vercel', 'Pública', 1, 3, 3, 'Operativo', 'PR-13: HTTPS y HSTS con preload (2026-10-24)'],
  ['ACT-14', 'Firebase Authentication (cuentas y claims)', 'Servicio', 'Dirección de la academia', 'Líder técnico', 'Google Cloud', 'Restringida', 3, 3, 3, 'Operativo', 'Claim de administrador; invitaciones de un solo uso'],
  ['ACT-15', 'Cloud Firestore y Storage', 'Servicio', 'Dirección de la academia', 'Líder técnico', 'Google Cloud', 'Restringida', 3, 3, 3, 'Operativo', '22 colecciones con reglas por rol'],
  ['ACT-16', 'API de sincronización y servicio de analítica', 'Software', 'Líder técnico', 'Equipo técnico', 'VPS del colegio, usuario academia (destino de diseño: VM-APP01)', 'Interna', 2, 3, 2, 'Operativo (VPS desde 2026-10-24)', 'helmet, CORS y morgan en server/src/index.ts; 27 pruebas; HTTPS en api-academia y analitica-academia; prueba de punta a punta del 2026-10-24'],
  ['ACT-17', 'Base MySQL 8 (réplica relacional)', 'Software e información', 'Líder técnico', 'Equipo técnico', 'VPS del colegio (destino de diseño: VM-APP01)', 'Restringida', 3, 3, 2, 'Operativo (VPS desde 2026-10-24)', 'Roles de 04_seguridad.sql; 19 pruebas SQL; migración 05; respaldo diario'],
  ['ACT-18', 'Sistema de gestión del colegio (Angular y Laravel)', 'Software', 'Dirección del colegio', 'Líder técnico', 'VPS', 'Interna', 2, 3, 3, 'Operativo', 'PR-05: 200 en web y /up (2026-10-24)'],
  ['ACT-19', 'VPS RackNerd (Ubuntu 24.04, UFW, Nginx y Certbot)', 'Infraestructura', 'Dirección del colegio', 'Líder técnico', 'New York (proveedor)', 'Restringida', 3, 3, 3, 'Operativo', 'Manual del VPS; PR-01 a PR-09; desde el 2026-10-24 aloja también la capa de la academia (usuario academia)'],
  ['ACT-20', 'PC local con PM2 (servicios anteriores de la capa)', 'Infraestructura', 'Dirección de la academia', 'Líder técnico', 'PC local (ubicación por confirmar)', 'Restringida', 3, 2, 2, 'Retirado (2026-10-24)', 'pm2 stop y pm2 save el 2026-10-24; Laragon queda para pruebas de restauración (REC-14)'],
  ['ACT-21', 'Host hipervisor PVE01 y sus VM', 'Infraestructura', 'Dirección de la academia', 'Encargado de TI', 'Rack de la sede', 'Restringida', 3, 3, 3, 'Planificado', 'Diseño S1-E2; pendiente de implementación'],
  ['ACT-22', 'Firewall OPNsense con Suricata', 'Infraestructura', 'Dirección de la academia', 'Encargado de TI', 'VM-FW01', 'Confidencial', 2, 3, 3, 'Planificado', 'Diseño S1-E1 §13; pendiente'],
  ['ACT-23', 'Red local: switch, AP y cableado', 'Infraestructura', 'Dirección de la academia', 'Encargado de TI', 'Sede principal', 'Interna', 2, 2, 3, 'Planificado', 'Diseño S1-E1 §8; pendiente'],
  ['ACT-24', 'Túnel IPsec sede ↔ VPS', 'Infraestructura', 'Líder técnico', 'Encargado de TI', 'OPNsense y VPS', 'Confidencial', 3, 3, 2, 'Planificado', 'Diseño S1-E1 §10; pendiente'],
  ['ACT-25', 'SIEM Wazuh', 'Infraestructura', 'Responsable de seguridad', 'Encargado de TI', 'VM-SIEM01', 'Confidencial', 2, 3, 2, 'Planificado', 'Diseño S1-E1 §14; pendiente'],
  ['ACT-26', 'Monitoreo (Uptime Kuma y Netdata)', 'Infraestructura', 'Encargado de TI', 'Encargado de TI', 'VM-MON01', 'Interna', 1, 2, 2, 'Planificado', 'Diseño S1-E2 §11; pendiente'],
  ['ACT-27', 'Repositorio de respaldos (PBS) y disco externo', 'Infraestructura', 'Responsable de respaldos', 'Encargado de TI', 'Sede y custodia externa', 'Restringida', 3, 3, 3, 'Planificado', 'Diseño S1-E2 §11; pendiente'],
  ['ACT-28', 'Honeypot Cowrie', 'Infraestructura', 'Responsable de seguridad', 'Encargado de TI', 'VM-HPOT01 en la DMZ', 'Interna', 1, 2, 1, 'Planificado', 'Diseño S1-E1 §14; pendiente'],
  ['ACT-29', 'Dominio y DNS (cermatschool.edu.pe en Punto.pe)', 'Servicio', 'Dirección del colegio', 'Líder técnico', 'Punto.pe / RCP', 'Interna', 1, 3, 3, 'Operativo', 'PR-11 y PR-12 (NS en RCP, MX de Google; sin CAA, SPF ni DMARC)'],
  ['ACT-30', 'Cuentas administrativas de proveedores (Google/Firebase, GitHub, Vercel, RackNerd y Punto.pe)', 'Información y acceso', 'Dirección', 'Líder técnico', 'Proveedores en la nube', 'Restringida', 3, 3, 2, 'Operativo (MFA no verificado)', 'Revisión de MFA pendiente'],
  ['ACT-31', 'Equipos de usuario (PC administrativas, laptops y dispositivos de auxiliares)', 'Infraestructura', 'Dirección de la academia', 'Usuarios', 'Sede principal', 'Interna', 2, 2, 2, 'Operativo (por inventariar)', 'Antivirus activo en la PC local (cuarentena registrada en INC-03)'],
  ['ACT-32', 'Personal clave (administrador del sistema, encargado de TI y equipo técnico)', 'Personas', 'Dirección', '—', 'Sede y trabajo remoto', 'No aplica', 2, 2, 3, 'Operativo', 'Matriz RACI (S2-E1 §4.2)'],
  ['ACT-33', 'Cuarto de equipos, rack y UPS', 'Físico', 'Dirección de la academia', 'Encargado de TI', 'Sede principal, Azángaro', 'Interna', 1, 2, 3, 'Planificado', 'Diseño de rack (S1-E2 §5)'],
];

const activos = {
  hoja: 'Inventario',
  columnas: ['ID', 'Activo', 'Tipo', 'Propietario', 'Custodio', 'Ubicación', 'Clasificación', 'C', 'I', 'D', 'Valor (C+I+D)', 'Criticidad', 'Estado'],
  filas: activosBase.map((a) => {
    const valor = a[7] + a[8] + a[9];
    return [a[0], a[1], a[2], a[3], a[4], a[5], a[6], String(a[7]), String(a[8]), String(a[9]), String(valor), criticidadPorValor(valor), a[10]];
  }),
};

const inventarioFinal = {
  hoja: 'Inventario final',
  columnas: ['ID', 'Activo', 'Propietario', 'Ubicación', 'Criticidad', 'Estado al 2026-10-24', 'Evidencia'],
  filas: activosBase.map((a) => [a[0], a[1], a[3], a[5], criticidadPorValor(a[7] + a[8] + a[9]), a[10], a[11]]),
};

const criteriosActivos = {
  hoja: 'Criterios',
  columnas: ['Dimensión', 'Nivel 1', 'Nivel 2', 'Nivel 3'],
  filas: [
    ['Confidencialidad (C)', 'Pública: su divulgación no causa daño', 'Interna o confidencial: uso interno; su divulgación causa daño limitado', 'Restringida: datos personales, de menores, financieros o credenciales'],
    ['Integridad (I)', 'Un error no tiene consecuencias', 'Un error afecta la operación y se corrige', 'Un error tiene consecuencias económicas, legales o de seguridad'],
    ['Disponibilidad (D)', 'Tolera más de 1 semana sin servicio', 'Tolera hasta 1 día sin servicio', 'Se requiere de forma continua (máximo 4 h sin servicio)'],
    ['Criticidad (C+I+D)', '3–4: Baja', '5–6: Media; 7–8: Alta', '9: Crítica'],
  ],
};

// Riesgos: [ID, activos, amenaza, vulnerabilidad, impacto, P, I, origen,
//           opción, controles[], acciones, responsable, plazo, Pr, Ir, estado, política, evidencia, verificación]
const riesgosBase = [
  ['R-01', 'ACT-01, ACT-15', 'Recolección no autorizada de datos personales', 'Las reglas publicadas el 22-jun-2026 permitían, hasta el 2026-10-24, listar sin sesión las matrículas pagadas (nombres y teléfonos)', 'Exposición de datos de menores y apoderados; incumplimiento de la Ley N.° 29733', 5, 4, 'Hallazgo H-01 (auditoría 2026-10-24)',
    'Mitigar', ['5.15', '8.3', '5.34', '8.29', '8.32'], 'Publicar las reglas corregidas mediante el CI (19/19); verificar en producción que el listado sin sesión falla', 'Líder técnico', '2026-10-31', 1, 4, 'Tratado (2026-10-24): publicadas desde la consola; listar matrículas pagadas sin sesión → 403', 'POL-02, PRO-02', 'tests/firestore-rules/reglas.test.ts: 19/19 con las reglas corregidas; 10 fallaban con las de junio. Producción: listar matrículas pagadas sin sesión → 403 (2026-10-24)', 'Suite de reglas contra el ruleset publicado (KPI-01 = 0)'],
  ['R-02', 'ACT-14, ACT-15', 'Escalamiento de privilegios por un usuario registrado', 'Las reglas publicadas hasta el 2026-10-24 permitían crear un perfil de auxiliar o docente sin invitación', 'Acceso a funciones de asistencia y a datos de alumnos', 4, 4, 'Hallazgo H-01',
    'Mitigar', ['5.15', '5.18', '8.2', '8.29'], 'Publicar las reglas; revisar los 4 perfiles con rol docente o auxiliar contra sus invitaciones', 'Líder técnico', '2026-10-31', 1, 4, 'Tratado (2026-10-24): reglas publicadas; falta revisar los 4 perfiles existentes', 'POL-02', 'Grupo de 8 pruebas de roles en la suite de reglas; reglas publicadas el 2026-10-24', 'Revisión de perfiles y KPI-01'],
  ['R-03', 'ACT-13, ACT-15', 'Interrupción de la matrícula pública', 'Las reglas publicadas hasta el 2026-10-24 bloqueaban la lectura y el cupo que necesita la matrícula sin sesión', 'Pérdida de pre-matrículas e ingresos', 5, 3, 'Hallazgo H-01',
    'Mitigar', ['8.32', '8.29', '5.30'], 'Publicar las reglas y registrar una matrícula de prueba sin sesión en producción, anulándola después', 'Líder técnico', '2026-10-31', 1, 3, 'Tratado (2026-10-24): pre-matrícula de prueba sin sesión exitosa en producción', 'PRO-02', 'Grupo de 6 pruebas de matrícula pública con el código real de la app; pre-matrícula de prueba exitosa en producción (2026-10-24)', 'Matrícula de prueba sin sesión en producción'],
  ['R-04', 'ACT-06', 'Cambios de seguridad que no llegan a producción', 'El despliegue de reglas fallaba en silencio por una línea inválida y nadie verificaba lo publicado', 'Controles corregidos sin efecto durante meses', 4, 4, 'Hallazgo H-02',
    'Mitigar', ['8.32', '8.9', '8.25'], 'Publicar solo por CI tras las 19 pruebas; configurar el secreto; comparar cada mes el ruleset publicado con el repositorio', 'Líder técnico', '2026-11-07', 1, 4, 'En curso: reglas publicadas desde la consola el 2026-10-24; falta el secreto del CI y la comparación mensual', 'PRO-02', '.github/workflows/ci.yml (trabajo desplegar-reglas condicionado)', 'Primera ejecución del CI en GitHub; comparación mensual'],
  ['R-05', 'ACT-08, ACT-14, ACT-15', 'Uso indebido de una credencial de administrador del proyecto Firebase', 'La clave de la cuenta de servicio estuvo en copias ZIP versionadas en el repositorio privado (revocada el 2026-10-24)', 'Lectura y escritura total de datos y cuentas', 2, 5, 'Hallazgo H-03',
    'Mitigar', ['5.17', '8.12', '8.4', '5.26'], 'Revocar y rotar la clave en IAM; retirar todas las copias y depurar el historial; revisar los registros de auditoría de IAM; escaneo de secretos en el CI', 'Líder técnico', '2026-10-26', 1, 5, 'Tratado (2026-10-24): clave 283b43c3… eliminada y reemplazada por ddf50bfe…; falta el escaneo de secretos en el CI', 'POL-02, PRO-01', 'Clave 283b43c3… eliminada y reemplazada por ddf50bfe… (INC-02); fuera de la lista pública de claves de Google', 'Clave anterior revocada en IAM; gitleaks sin hallazgos (KPI-04)'],
  ['R-06', 'ACT-08, ACT-17', 'Acceso no autorizado a MySQL', 'Archivos de entorno versionados (hoy sin contraseñas; el equipo decidió mantenerlos en Git)', 'Lectura o alteración de la réplica', 2, 3, 'Hallazgo H-03',
    'Mitigar', ['5.17', '8.12'], 'Retirar los archivos del índice de Git, rotar las contraseñas y usar las cuentas de mínimo privilegio', 'Líder técnico', '2026-11-07', 1, 3, 'Tratado con riesgo aceptado (2026-10-24): los .env no tienen contraseñas y siguen versionados por decisión del equipo; las contraseñas MySQL irán fuera de ellos', 'POL-02', 'server/scripts/db-crear-usuarios.js (contraseñas por variables de entorno); .env versionados sin contraseñas', 'Ninguna contraseña en .env versionados (KPI-04)'],
  ['R-07', 'ACT-09, ACT-10, ACT-19', 'Pérdida de datos del colegio (falla del VPS, error humano o ransomware)', 'Respaldos externos diseñados pero no implantados; sin prueba de restauración', 'Pérdida irrecuperable de información escolar', 3, 5, 'Hallazgo H-04 (manual del VPS)',
    'Mitigar', ['8.13', '5.30', '8.14'], 'pg_dump -Fc diario con SHA256SUMS; copia semanal cifrada fuera del VPS por SCP (transitoria) y luego extracción diaria por el túnel; restauración mensual de prueba', 'Líder técnico', '2026-11-07', 3, 2, 'Pendiente', 'POL-04', 'Procedimiento diseñado en el manual del VPS', 'REC-06 conforme'],
  ['R-08', 'ACT-16, ACT-17, ACT-19', 'Agotamiento de memoria del VPS', '2 GB compartidos por Nginx, PHP-FPM, PostgreSQL y, desde el 2026-10-24, la capa de la academia; sin alertas', 'Caída del sitio y de la API del colegio y de la capa de la academia', 3, 3, 'Hallazgo H-05',
    'Mitigar', ['8.6', '8.16'], 'Línea base medida el 2026-10-24: 1,5 GiB disponibles antes de la capa de la academia y 1,3 GiB con ella en marcha, con MySQL de bajo consumo; swap de 1 GiB; alerta al 80 %; ampliar el plan si MemAvailable < 25 %', 'Encargado de TI', '2026-11-14', 2, 3, 'Tratado en parte (2026-10-24): línea base medida; faltan la alerta y el monitoreo', 'POL-03', 'Presupuesto de RAM (S1-E2 §10); manual de despliegue §9.0 y §9.4', 'Línea base con free -h; alerta de MemAvailable'],
  ['R-09', 'ACT-13, ACT-16, ACT-18, ACT-19', 'Indisponibilidad no detectada', 'Sin monitor externo ni alertas', 'Las fallas las descubren los usuarios', 4, 3, 'Hallazgo H-06',
    'Mitigar', ['8.16', '5.24'], 'Uptime Kuma con alertas y latido externo', 'Encargado de TI', '2026-11-14', 4, 2, 'Pendiente', 'PRO-01', '/health de la API y panel admin Infraestructura', 'PR-33 (alerta ≤ 2 min); KPI-07 y KPI-08'],
  ['R-10', 'ACT-01, ACT-02, ACT-03, ACT-15', 'Pérdida de datos operativos', 'Firestore sin respaldo programado ni prueba de restauración', 'Pérdida de matrículas, pagos y asistencia', 2, 5, 'Hallazgo H-07',
    'Mitigar', ['8.13', '5.23'], 'Exportación diaria (gestionada si el plan lo permite, o script con firebase-admin) y restauración en un proyecto de prueba', 'Líder técnico', '2026-11-21', 2, 2, 'Pendiente', 'POL-04', 'Brecha registrada en E4 §2.5', 'REC-11'],
  ['R-11', 'ACT-30', 'Toma de cuentas administrativas por phishing', 'MFA no verificado; el dominio sin SPF ni DMARC facilita la suplantación', 'Control total de los servicios en la nube', 3, 5, 'Hallazgo H-08 (verificación DNS 2026-10-24)',
    'Mitigar', ['5.17', '8.5', '6.3', '5.14'], 'MFA en las 5 cuentas (de preferencia llave FIDO2); SPF, DKIM y DMARC; capacitación', 'Dirección y líder técnico', '2026-10-31', 1, 5, 'Pendiente', 'POL-02, POL-05', 'PR-12 (sin SPF ni DMARC)', 'KPI-03 = 100 %; PR-12 conforme'],
  ['R-12', 'ACT-19', 'Acceso no autorizado por SSH', '22/tcp abierto a Internet; configuración de autenticación SSH no verificada', 'Compromiso del servidor y de PostgreSQL', 3, 5, 'Análisis (manual del VPS)',
    'Mitigar', ['8.5', '8.20', '8.2'], 'Verificar autenticación solo con llaves y sin root; fail2ban; SSH solo por la VPN desde el bastión', 'Líder técnico', '2026-11-07', 1, 5, 'Pendiente', 'POL-02', 'UFW activo (PR-01)', 'PR-28; sshd -T'],
  ['R-13', 'ACT-13, ACT-18, ACT-19', 'Reconocimiento y ataques del lado del cliente', 'Nginx revela su versión; el sitio del colegio no envía HSTS ni cabeceras de seguridad y la SPA solo envía HSTS', 'Facilita ataques dirigidos, clickjacking y degradación a HTTP', 3, 2, 'Hallazgo H-09 (verificación 2026-10-24)',
    'Mitigar', ['8.21', '8.9'], 'server_tokens off; HSTS, nosniff, frame-ancestors y Referrer-Policy en Nginx y en vercel.json', 'Líder técnico', '2026-11-07', 1, 2, 'Tratado (2026-10-24): 5 de 5 cabeceras y versión oculta en el Nginx del colegio; cabeceras de vercel.json en la SPA', 'POL-01', 'PR-10', 'PR-10 conforme'],
  ['R-14', 'ACT-29', 'Emisión indebida de certificados o suplantación DNS', 'Sin registros CAA ni DNSSEC', 'Suplantación del sitio institucional', 2, 3, 'Hallazgo H-09',
    'Mitigar', ['8.21', '8.24'], 'Registro CAA para Let\'s Encrypt; DNSSEC si el registro .pe y el proveedor lo permiten', 'Líder técnico', '2026-11-14', 1, 3, 'Pendiente', 'POL-03', 'PR-12', 'PR-12 conforme'],
  ['R-15', 'ACT-16, ACT-17, ACT-21', 'Movimiento lateral desde la red local', 'La sede no tiene firewall perimetral ni segmentación implantada', 'Acceso a servidores desde equipos infectados o de invitados', 3, 4, 'Análisis',
    'Mitigar', ['8.22', '8.20'], 'VLAN y reglas de OPNsense según S1-E1', 'Encargado de TI', 'Fase 2 (sujeta al hardware)', 1, 4, 'Planificado', 'POL-01', 'Diseño S1-E1 §8 a §13', 'PR-14 a PR-23'],
  ['R-16', 'ACT-11, ACT-22, ACT-25', 'Intrusión no detectada', 'Sin IDS/IPS, SIEM ni honeypot', 'Ataques sin detección ni evidencia', 3, 4, 'Análisis',
    'Mitigar', ['8.16', '8.15', '5.7'], 'Suricata, Wazuh y Cowrie', 'Responsable de seguridad', 'Fase 2', 2, 3, 'Planificado', 'PRO-01', 'Diseño S1-E1 §14', 'PR-30 a PR-32 y PR-37'],
  ['R-17', 'ACT-33, ACT-21', 'Cortes eléctricos', 'Sin UPS en la sede', 'Apagado abrupto y corrupción de datos locales', 4, 3, 'Análisis (SUP-10)',
    'Mitigar', ['7.11', '8.14'], 'UPS con NUT y apagado ordenado', 'Encargado de TI', 'Fase 2', 4, 1, 'Planificado', 'POL-04', 'Diseño S1-E2 §5', 'Prueba de apagado ordenado con NUT'],
  ['R-18', 'ACT-21', 'Falla del host único', 'Un solo servidor físico, sin clúster', 'Interrupción de los servicios locales', 2, 4, 'Análisis',
    'Aceptar con mitigación parcial', ['8.14', '8.13'], 'Espejo ZFS, respaldos en PBS y disco externo; los servicios críticos siguen en la nube', 'Dirección', 'Fase 2', 2, 3, 'Planificado (aceptación pendiente)', 'POL-04', 'Diseño S1-E2 §6 y §11', 'REC-07'],
  ['R-19', 'ACT-23', 'Caída del enlace de Internet de la sede', 'Un solo enlace', 'La sede pierde acceso a la plataforma', 3, 3, 'Análisis',
    'Mitigar', ['8.14', '5.30'], 'WAN2 4G/LTE con conmutación automática', 'Encargado de TI', 'Fase 2', 3, 1, 'Planificado', 'POL-04', 'Diseño S1-E1 §7', 'PR-29'],
  ['R-20', 'ACT-24', 'Interrupción del túnel', 'Dependencia del enlace de la sede', 'Sin respaldos externos, administración ni sincronización mientras dure', 3, 2, 'Análisis',
    'Mitigar', ['8.14', '8.16'], 'DPD y reintento, alerta y consola del proveedor como acceso de emergencia', 'Encargado de TI', 'Fase 2', 3, 1, 'Planificado', 'POL-04', 'Diseño S1-E1 §10', 'REC-09'],
  ['R-21', 'ACT-31, ACT-01', 'Ransomware o malware', 'Equipos de usuario sin control centralizado', 'Cifrado o robo de información', 3, 4, 'Análisis',
    'Mitigar', ['8.7', '8.1', '6.3', '8.13'], 'Antivirus, actualizaciones, cuentas sin privilegios de administrador y respaldos fuera de línea', 'Encargado de TI', '2026-12-15', 2, 3, 'Planificado', 'POL-05', 'Antivirus activo en la PC local', 'Revisión trimestral de equipos'],
  ['R-22', 'ACT-07, ACT-31', 'Interrupción de tareas por un falso positivo del antivirus', 'Ejecutar scripts SQL desde PowerShell con cmd se detectó como amenaza', 'Scripts en cuarentena y demora de pruebas', 3, 2, 'Incidente INC-03',
    'Mitigar', ['8.7', '5.37'], 'Ejecutar desde Git Bash; exclusión acotada a la carpeta; verificar el hash al restaurar desde cuarentena; reportar al fabricante', 'Líder técnico', 'Cumplido (procedimiento)', 1, 2, 'Implementado', 'PRO-01', 'server/src/db/README.md', 'Sin nuevas cuarentenas al ejecutar desde Git Bash'],
  ['R-23', 'ACT-32', 'Pérdida de capacidad operativa por concentración de conocimiento y accesos', 'Un solo integrante administra los servicios y figura como único autor del historial', 'Dependencia crítica de una persona', 3, 4, 'Hallazgo H-10',
    'Mitigar', ['5.2', '5.3', '5.37'], 'Manuales, cuentas nominativas para otro integrante, credenciales de emergencia custodiadas y revisión por un segundo integrante', 'Dirección y líder técnico', '2026-11-30', 2, 3, 'Pendiente', 'POL-01', 'Matriz RACI (§4.2)', 'Segundo integrante con accesos nominativos; 100 % de cambios revisados'],
  ['R-24', 'ACT-01', 'Sanción o reclamo por incumplimiento normativo', 'Formalidades de la Ley N.° 29733 no verificadas (banco de datos, aviso de privacidad, consentimiento de apoderados, transferencia internacional)', 'Multas y daño reputacional', 3, 4, 'Análisis (dato a confirmar)',
    'Mitigar', ['5.31', '5.34', '5.20'], 'Verificar la inscripción del banco de datos ante la ANPD, el aviso de privacidad y el consentimiento en la matrícula; revisar las condiciones de tratamiento de los proveedores', 'Dirección', '2026-12-15', 1, 4, 'Pendiente', 'POL-01', 'Clasificación de activos (§5)', 'Constancia de inscripción y aviso de privacidad publicado'],
  ['R-25', 'ACT-28', 'Uso del honeypot como plataforma de ataque', 'Servicio expuesto a Internet', 'Responsabilidad por ataques a terceros', 2, 3, 'Análisis',
    'Mitigar', ['8.22', '8.20'], 'DMZ sin salida (FW-41), Cowrie de interacción media, snapshots y revisión semanal', 'Responsable de seguridad', 'Fase 2', 1, 3, 'Planificado', 'POL-01', 'Regla FW-41 (diseño)', 'PR-16 (DMZ → DB bloqueado)'],
  ['R-26', 'ACT-33', 'Acceso físico no autorizado', 'Sin cuarto de equipos cerrado', 'Robo o manipulación de equipos', 2, 4, 'Análisis',
    'Mitigar', ['7.1', '7.2', '7.4'], 'Cuarto cerrado con llave, bitácora y cámara', 'Dirección', 'Fase 2', 1, 4, 'Planificado', 'POL-01', 'Diseño de rack (S1-E2 §5)', 'Bitácora de acceso'],
  ['R-27', 'ACT-09, ACT-17', 'Pérdida de los respaldos de MySQL junto con la base', 'Respaldos en el mismo servidor que la base; la copia fuera del VPS es manual y semanal', 'Sin recuperación ante una falla del equipo', 3, 4, 'Análisis',
    'Mitigar', ['8.13'], 'Respaldo diario con un temporizador de systemd en el VPS y copia semanal verificada en la PC (2026-10-24); falta la copia en PBS (3-2-1)', 'Líder técnico', '2026-11-14', 1, 3, 'Tratado en parte (2026-10-24): respaldo diario y copia semanal verificada; falta PBS', 'POL-04', 'server/scripts/backup.js; temporizador academia-respaldo', 'REC-05, REC-13 y REC-14; copias en el VPS y en la PC'],
  ['R-28', 'ACT-17', 'Réplica relacional incompleta', 'Sin reintentos: un envío que falla no se repite (INC-06); los datos anteriores a la sincronización se cargaron el 2026-10-24', 'Reportes con datos faltantes', 4, 2, 'Hecho verificado',
    'Mitigar', ['8.14', '8.16'], 'Servicio 24/7 en el VPS desde el 2026-10-24 (destino de diseño: VM-APP01); conciliación con v_conciliacion_pagos; carga inicial y resincronización desde Firestore', 'Líder técnico', 'Fase 2', 2, 2, 'Tratado en parte (2026-10-24): servicio 24/7 en el VPS y carga inicial hecha; faltan los reintentos', 'POL-04', 'Vista v_conciliacion_pagos', 'Conciliación con 0 filas'],
  ['R-29', 'ACT-13, ACT-15, ACT-16, ACT-17, ACT-19', 'Dependencia de proveedores', 'Cambio de condiciones, falta de pago o suspensión de la cuenta', 'Interrupción prolongada', 2, 4, 'Análisis',
    'Aceptar con controles', ['5.19', '5.22', '5.23'], 'Recordatorios de renovación, exportaciones periódicas y documentación para migrar', 'Dirección', 'Continuo', 2, 3, 'Aceptación pendiente', 'POL-03', 'Inventario de proveedores (§9.4)', 'Revisión anual de proveedores'],
];

function clasificarNivel(n) {
  if (n >= 15) return 'Crítico';
  if (n >= 10) return 'Alto';
  if (n >= 5) return 'Medio';
  return 'Bajo';
}

const riesgos = riesgosBase.map((r) => ({
  id: r[0], activos: r[1], amenaza: r[2], vulnerabilidad: r[3], impacto: r[4], p: r[5], i: r[6], origen: r[7],
  opcion: r[8], controles: r[9], acciones: r[10], responsable: r[11], plazo: r[12], pr: r[13], ir: r[14], estado: r[15],
  politica: r[16], evidencia: r[17], verificacion: r[18],
}));

const riesgosEvaluacion = {
  hoja: 'Evaluación',
  columnas: ['ID', 'Activos', 'Amenaza', 'Vulnerabilidad', 'Impacto', 'P', 'I', 'Nivel (P×I)', 'Clasificación', 'Origen'],
  filas: riesgos.map((r) => [r.id, r.activos, r.amenaza, r.vulnerabilidad, r.impacto, String(r.p), String(r.i), String(r.p * r.i), clasificarNivel(r.p * r.i), r.origen]),
};

const riesgosTratamiento = {
  hoja: 'Tratamiento',
  columnas: ['ID', 'Opción', 'Controles (Anexo A)', 'Acciones', 'Responsable', 'Plazo', 'Residual (P×I)', 'Nivel residual', 'Estado'],
  filas: riesgos.map((r) => [r.id, r.opcion, r.controles.join(', '), r.acciones, r.responsable, r.plazo, `${r.pr}×${r.ir} = ${r.pr * r.ir}`, clasificarNivel(r.pr * r.ir), r.estado]),
};

const criteriosRiesgo = {
  hoja: 'Criterios',
  columnas: ['Escala', 'Valor', 'Nombre', 'Descripción'],
  filas: [
    ['Probabilidad', '1', 'Rara', 'No se espera en 5 años'],
    ['Probabilidad', '2', 'Improbable', 'Podría ocurrir una vez en 2 a 5 años'],
    ['Probabilidad', '3', 'Posible', 'Una vez al año'],
    ['Probabilidad', '4', 'Probable', 'Varias veces al año'],
    ['Probabilidad', '5', 'Casi segura', 'Mensual, o la vulnerabilidad está activa y se explota sin conocimientos especiales'],
    ['Impacto', '1', 'Insignificante', 'Sin efecto en datos ni servicios'],
    ['Impacto', '2', 'Menor', 'Molestia operativa menor a 4 h; sin datos personales'],
    ['Impacto', '3', 'Moderado', 'Interrupción de un servicio crítico hasta 1 día o pérdida recuperable de hasta 24 h de datos'],
    ['Impacto', '4', 'Mayor', 'Exposición de datos personales de un grupo, interrupción mayor a 1 día o posible sanción'],
    ['Impacto', '5', 'Catastrófico', 'Exposición masiva de datos de menores, compromiso total de la plataforma o pérdida irrecuperable'],
    ['Nivel (P×I)', '1–4', 'Bajo', 'Aceptable; se revisa una vez al año'],
    ['Nivel (P×I)', '5–9', 'Medio', 'Aceptable con monitoreo y aprobación de la Dirección'],
    ['Nivel (P×I)', '10–14', 'Alto', 'Tratamiento en 30 días como máximo'],
    ['Nivel (P×I)', '15–25', 'Crítico', 'Tratamiento inmediato (7 días como máximo)'],
  ],
};

// Declaración de Aplicabilidad — ISO/IEC 27001:2022, Anexo A (93 controles)
// [control, nombre, aplicable, justificación, estado, evidencia o plan]
const soaBase = [
  // 5 · Controles organizacionales (37)
  ['5.1', 'Políticas de seguridad de la información', 'Sí', 'Requisito de la cláusula 5.2; marco de todo el SGSI', 'Parcial', 'Política POL-01 redactada (§9.1); aprobación de la Dirección pendiente'],
  ['5.2', 'Roles y responsabilidades de seguridad de la información', 'Sí', 'Equipo pequeño con funciones concentradas', 'Parcial', 'Matriz RACI (§4.2); designación formal pendiente'],
  ['5.3', 'Segregación de funciones', 'Sí', 'Un mismo integrante desarrolla y publica', 'Planificado', 'Revisión por un segundo integrante con .github/pull_request_template.md'],
  ['5.4', 'Responsabilidades de la dirección', 'Sí', 'La Dirección aprueba la política y acepta riesgos residuales', 'Planificado', 'Revisión por la dirección (§13.4) pendiente'],
  ['5.5', 'Contacto con las autoridades', 'Sí', 'Incidentes con datos personales y delitos informáticos', 'Planificado', 'Directorio de contactos en PRO-01 (ANPD, PNP-DIVINDAT, CSIRT nacional)'],
  ['5.6', 'Contacto con grupos de interés especial', 'Sí', 'Avisos de seguridad de los productos usados', 'Planificado', 'Suscripción a avisos de Ubuntu, OPNsense, Proxmox, Wazuh, Firebase y GitHub'],
  ['5.7', 'Inteligencia de amenazas', 'Sí', 'Detección basada en firmas y reputación', 'Planificado', 'Reglas ET Open y listas abuse.ch en Suricata; CTI de Wazuh'],
  ['5.8', 'Seguridad de la información en la gestión de proyectos', 'Sí', 'Los riesgos de seguridad deben entrar al backlog', 'Parcial', 'Ítems PB-04, PB-06, PB-08 y PB-11 del backlog (E4 §3.3)'],
  ['5.9', 'Inventario de información y otros activos asociados', 'Sí', 'Base de la evaluación de riesgos', 'Implementado', 's2-e1-inventario-activos.xlsx (33 activos); revisión trimestral'],
  ['5.10', 'Uso aceptable de la información y otros activos asociados', 'Sí', 'Personal, docentes e invitados usan la red y los datos', 'Parcial', 'POL-05 redactada (§9.6); difusión y aceptación pendientes'],
  ['5.11', 'Devolución de activos', 'Sí', 'Rotación de personal con accesos', 'Planificado', 'Lista de baja: retirar claims, llaves SSH y equipos el mismo día'],
  ['5.12', 'Clasificación de la información', 'Sí', 'Datos de menores y financieros', 'Implementado', 'Esquema de 4 niveles aplicado al inventario (§5)'],
  ['5.13', 'Etiquetado de la información', 'Sí', 'Respaldos y exportaciones con datos restringidos', 'Planificado', 'Prefijo de clasificación en nombres de respaldos y documentos'],
  ['5.14', 'Transferencia de información', 'Sí', 'Datos entre navegador, nube y sede', 'Parcial', 'TLS 1.2/1.3 verificado (PR-06, PR-13); túnel IPsec pendiente; correo sin SPF ni DMARC'],
  ['5.15', 'Control de acceso', 'Sí', 'Portales por rol y datos de menores', 'Parcial', 'Reglas por rol probadas 19/19 y publicadas el 2026-10-24; roles MySQL; UFW'],
  ['5.16', 'Gestión de identidades', 'Sí', 'Identidad única en Firebase y cuentas en servidores', 'Parcial', 'Invitaciones de un solo uso; usuario nominativo en el VPS; revisión de cuentas pendiente'],
  ['5.17', 'Información de autenticación', 'Sí', 'Contraseñas, llaves y cuentas de servicio', 'Parcial', 'Contraseñas de BD por variables de entorno; no conformidad NC-03 abierta'],
  ['5.18', 'Derechos de acceso', 'Sí', 'Altas, cambios y bajas de roles', 'Parcial', 'Claims de administrador y matriz de accesos (§10.2); revisión trimestral pendiente'],
  ['5.19', 'Seguridad de la información en las relaciones con los proveedores', 'Sí', 'Dependencia de 6 proveedores', 'Parcial', 'Proveedores identificados (§9.4); evaluación formal pendiente'],
  ['5.20', 'Tratamiento de la seguridad de la información en los acuerdos con proveedores', 'Sí', 'Tratamiento de datos personales por terceros', 'Planificado', 'Revisar términos y anexos de tratamiento de datos de Google, Vercel, RackNerd y Punto.pe'],
  ['5.21', 'Gestión de la seguridad de la información en la cadena de suministro de las TIC', 'Sí', 'Dependencias npm y pip', 'Parcial', 'package-lock.json y npm ci en el CI; auditoría de dependencias pendiente'],
  ['5.22', 'Seguimiento, revisión y gestión del cambio de los servicios de proveedores', 'Sí', 'Cambios de planes y condiciones', 'Planificado', 'Suscripción a páginas de estado y avisos de cambios de plan'],
  ['5.23', 'Seguridad de la información para el uso de servicios en la nube', 'Sí', 'Arquitectura con IaaS, PaaS y SaaS', 'Parcial', 'POL-03 (§9.4); respaldo de Firestore pendiente'],
  ['5.24', 'Planificación y preparación de la gestión de incidentes de seguridad de la información', 'Sí', 'Incidentes reales registrados', 'Parcial', 'PRO-01 (§9.3) y registro de incidentes; simulacro pendiente'],
  ['5.25', 'Evaluación y decisión sobre los eventos de seguridad de la información', 'Sí', 'Diferenciar eventos e incidentes', 'Parcial', 'Criterios de severidad (§11.2) aplicados a INC-01 a INC-06'],
  ['5.26', 'Respuesta a incidentes de seguridad de la información', 'Sí', 'Incidentes reales registrados (INC-01 a INC-06)', 'Parcial', 'INC-01, INC-02 e INC-06 contenidos y cerrados el 2026-10-24; falta el simulacro'],
  ['5.27', 'Aprendizaje de los incidentes de seguridad de la información', 'Sí', 'Evitar recurrencia', 'Implementado', 'Lecciones aprendidas aplicadas: publicación por CI y ejecución desde Git Bash (E4 §2.6 y §3.5)'],
  ['5.28', 'Recopilación de evidencias', 'Sí', 'Evidencia de hallazgos y de incidentes', 'Parcial', 'Ruleset de producción descargado en modo solo lectura; cadena de custodia por formalizar'],
  ['5.29', 'Seguridad de la información durante una interrupción', 'Sí', 'Operación en contingencia sin la sede', 'Planificado', 'Modo de contingencia: la operación sigue en la nube con los mismos controles'],
  ['5.30', 'Preparación de las TIC para la continuidad de negocio', 'Sí', 'RTO y RPO por servicio', 'Parcial', 'RTO/RPO definidos; restauración de MySQL probada; VPS, VM y Firestore pendientes'],
  ['5.31', 'Requisitos legales, estatutarios, reglamentarios y contractuales', 'Sí', 'Ley N.° 29733 y su reglamento', 'Parcial', 'Requisitos identificados; formalidades ante la ANPD por verificar'],
  ['5.32', 'Derechos de propiedad intelectual', 'Sí', 'Uso de software libre y dependencias', 'Parcial', 'Licencias libres (AGPL, BSD, GPL) identificadas; inventario de licencias pendiente'],
  ['5.33', 'Protección de los registros', 'Sí', 'Trazabilidad de pagos y cambios', 'Parcial', 'Tabla auditoria con triggers; historial de Git; retención centralizada pendiente'],
  ['5.34', 'Privacidad y protección de datos personales', 'Sí', 'Datos de menores y apoderados', 'Parcial', 'Reglas corregidas restringen lecturas; indicadores con conteos agregados; datos ficticios en pruebas'],
  ['5.35', 'Revisión independiente de la seguridad de la información', 'Sí', 'La auditoría interna la hizo el propio equipo', 'Planificado', 'Revisión por el jurado y por un integrante no autor; auditoría externa no prevista por costo'],
  ['5.36', 'Cumplimiento de las políticas, reglas y normas de seguridad de la información', 'Sí', 'Verificar que los controles se aplican', 'Parcial', 'Auditoría interna del 2026-10-24 con lista de verificación'],
  ['5.37', 'Procedimientos de operación documentados', 'Sí', 'Operación por pocas personas', 'Implementado', 'Manual del VPS (diario, semanal, mensual, diagnóstico y comandos prohibidos); server/src/db/README.md'],
  // 6 · Controles de personas (8)
  ['6.1', 'Investigación de antecedentes', 'Sí', 'Personal con acceso privilegiado', 'Planificado', 'Verificación de referencias proporcional al cargo'],
  ['6.2', 'Términos y condiciones del empleo', 'Sí', 'Responsabilidades de seguridad del personal', 'Planificado', 'Cláusula de confidencialidad y uso aceptable en los contratos'],
  ['6.3', 'Concienciación, educación y formación en seguridad de la información', 'Sí', 'Phishing y manejo de datos personales', 'Planificado', 'Sesión anual sobre phishing, contraseñas, MFA y uso aceptable'],
  ['6.4', 'Proceso disciplinario', 'Sí', 'Consecuencias de incumplir las políticas', 'Planificado', 'Referencia al reglamento interno de la institución'],
  ['6.5', 'Responsabilidades ante la finalización o cambio de empleo', 'Sí', 'Retiro oportuno de accesos', 'Planificado', 'Retiro de claims, roles y llaves el mismo día'],
  ['6.6', 'Acuerdos de confidencialidad o no divulgación', 'Sí', 'Acceso a datos personales', 'Parcial', 'Declaración de ética del equipo (§12.7) pendiente de firma; acuerdo para el personal pendiente'],
  ['6.7', 'Trabajo remoto', 'Sí', 'La plataforma se administra por Internet', 'Parcial', 'Administración web por HTTPS; administración de infraestructura solo por VPN y bastión (planificado)'],
  ['6.8', 'Notificación de eventos de seguridad de la información', 'Sí', 'Detección temprana por usuarios', 'Planificado', 'Canal de reporte (grupo del equipo y correo del administrador) y formulario de incidente'],
  // 7 · Controles físicos (14)
  ['7.1', 'Perímetros de seguridad física', 'Sí', 'Rack on-premise; en la nube lo asume el proveedor', 'Planificado', 'Cuarto de equipos cerrado (S1-E2 §5)'],
  ['7.2', 'Controles físicos de entrada', 'Sí', 'Acceso al cuarto de equipos', 'Planificado', 'Llave y bitácora de ingreso'],
  ['7.3', 'Seguridad de oficinas, despachos e instalaciones', 'Sí', 'Secretaría y caja atienden público', 'Planificado', 'Acceso restringido a oficinas con equipos administrativos'],
  ['7.4', 'Monitoreo de la seguridad física', 'Sí', 'Rack sin vigilancia', 'Planificado', 'Cámara orientada al rack, con aviso de videovigilancia'],
  ['7.5', 'Protección contra amenazas físicas y ambientales', 'Sí', 'Incendio, agua y temperatura', 'Planificado', 'Extintor de CO2, ubicación lejos de tuberías, sensor de temperatura'],
  ['7.6', 'Trabajo en áreas seguras', 'Sí', 'Visitas técnicas al cuarto de equipos', 'Planificado', 'Acompañamiento de terceros; prohibido comer o beber junto al rack'],
  ['7.7', 'Puesto de trabajo despejado y pantalla limpia', 'Sí', 'Datos personales en pantallas de atención', 'Planificado', 'Bloqueo automático de sesión a los 5 minutos'],
  ['7.8', 'Ubicación y protección de equipos', 'Sí', 'Equipos de red y cómputo', 'Planificado', 'Rack cerrado, UPS y ventilación'],
  ['7.9', 'Seguridad de los activos fuera de las instalaciones', 'Sí', 'Disco de respaldo externo y laptops', 'Planificado', 'Disco cifrado con custodia registrada fuera de la sede'],
  ['7.10', 'Soportes de almacenamiento', 'Sí', 'Respaldos con datos restringidos', 'Planificado', 'Cifrado del disco externo y registro de custodia'],
  ['7.11', 'Servicios de suministro', 'Sí', 'Cortes eléctricos', 'Planificado', 'UPS con NUT (Tier I con elementos de Tier II)'],
  ['7.12', 'Seguridad del cableado', 'Sí', 'Cableado estructurado de la sede', 'Planificado', 'Cat 6 en canaletas; patch panel etiquetado (TIA-568 y TIA-606)'],
  ['7.13', 'Mantenimiento de los equipos', 'Sí', 'Baterías del UPS y ventilación', 'Planificado', 'Mantenimiento semestral del UPS y limpieza del rack'],
  ['7.14', 'Eliminación o reutilización segura de los equipos', 'Sí', 'Discos con datos restringidos', 'Planificado', 'Borrado seguro según NIST SP 800-88 antes de reutilizar o desechar'],
  // 8 · Controles tecnológicos (34)
  ['8.1', 'Dispositivos de punto final de usuario', 'Sí', 'Equipos administrativos y de auxiliares', 'Parcial', 'Antivirus activo en la PC local (INC-03); estándar de equipos pendiente'],
  ['8.2', 'Derechos de acceso privilegiado', 'Sí', 'Administradores de nube y servidores', 'Parcial', 'Usuario no-root con sudo en el VPS; claim admin acotado; MFA no verificado'],
  ['8.3', 'Restricción del acceso a la información', 'Sí', 'Datos de menores', 'Parcial', 'Reglas corregidas publicadas el 2026-10-24; vistas MySQL para reportes'],
  ['8.4', 'Acceso al código fuente', 'Sí', 'Repositorio con configuración de seguridad', 'Parcial', 'Repositorio privado en GitHub; secretos en el historial (NC-03)'],
  ['8.5', 'Autenticación segura', 'Sí', 'Cuentas privilegiadas y servidores', 'Parcial', 'Firebase Auth y SSH; MFA no verificado; IKEv2 con certificados planificado'],
  ['8.6', 'Gestión de la capacidad', 'Sí', 'VPS de 2 GB compartido', 'Parcial', 'Línea base medida el 2026-10-24, antes y después de alojar la capa de la academia; faltan las alertas al 80 %'],
  ['8.7', 'Protección contra el malware', 'Sí', 'Ransomware en equipos de usuario', 'Parcial', 'Antivirus en la PC local; FIM y rootcheck de Wazuh planificados'],
  ['8.8', 'Gestión de las vulnerabilidades técnicas', 'Sí', 'Servidores expuestos y dependencias', 'Planificado', 'Auditoría de dependencias en el CI, actualizaciones automáticas de seguridad y detección de vulnerabilidades de Wazuh'],
  ['8.9', 'Gestión de la configuración', 'Sí', 'Reglas, migraciones y configuraciones de red', 'Parcial', 'Git, migraciones numeradas y reglas versionadas; configuraciones de red y CD por versionar en infra/'],
  ['8.10', 'Eliminación de la información', 'Sí', 'Retención de datos personales', 'Parcial', 'backup.js conserva 7 copias; política de retención de datos de exalumnos pendiente'],
  ['8.11', 'Enmascaramiento de datos', 'Sí', 'Pruebas e indicadores', 'Implementado', 'Datos ficticios en 90_datos_prueba.sql; indicadores solo con conteos agregados'],
  ['8.12', 'Prevención de la fuga de datos', 'Sí', 'Secretos en el repositorio', 'Planificado', 'gitleaks en el CI y escaneo de secretos de GitHub'],
  ['8.13', 'Copias de seguridad de la información', 'Sí', 'Pérdida de datos', 'Parcial', 'MySQL: respaldo diario en el VPS (temporizador de systemd desde el 2026-10-24), copia semanal verificada en la PC y restauraciones REC-05, REC-13 y REC-14. PostgreSQL del colegio, Firestore y VM pendientes'],
  ['8.14', 'Redundancia de las instalaciones de procesamiento de la información', 'Sí', 'Falla de disco, enlace o host', 'Planificado', 'Espejo ZFS, bond LACP y WAN2 LTE; PaaS con redundancia del proveedor'],
  ['8.15', 'Registro de eventos', 'Sí', 'Trazabilidad e investigación', 'Parcial', 'morgan en la API, registros de Nginx y autenticación en el VPS, auditoría MySQL; centralización en Wazuh pendiente'],
  ['8.16', 'Actividades de monitoreo', 'Sí', 'Detección de fallas y ataques', 'Parcial', '/health y panel admin Infraestructura; Uptime Kuma y Wazuh pendientes'],
  ['8.17', 'Sincronización del reloj', 'Sí', 'Correlación de eventos', 'Parcial', 'Fechas locales corregidas en la app; NTP del VPS por verificar (timedatectl); NTP de OPNsense planificado'],
  ['8.18', 'Uso de programas utilitarios privilegiados', 'Sí', 'Comandos destructivos en producción', 'Parcial', 'Lista de comandos prohibidos en el manual del VPS; sudo con registro'],
  ['8.19', 'Instalación del software en sistemas en producción', 'Sí', 'Cambios en servidores productivos', 'Parcial', 'Despliegue por CI y Vercel; procedimiento de actualización sin pérdida del manual'],
  ['8.20', 'Seguridad de las redes', 'Sí', 'Perímetro de la sede y del VPS', 'Parcial', 'UFW en el VPS implementado; OPNsense planificado'],
  ['8.21', 'Seguridad de los servicios de red', 'Sí', 'HTTPS, DNS y correo', 'Parcial', 'TLS 1.2/1.3 en todos los sitios; cabeceras de seguridad en la SPA y en el colegio (2026-10-24); CAA, SPF y DMARC pendientes'],
  ['8.22', 'Segregación de las redes', 'Sí', 'Red plana en la sede', 'Planificado', 'VLAN 10, 20, 30, 40, 50 y 99 (S1-E1 §8)'],
  ['8.23', 'Filtrado web', 'Sí', 'Malware en la navegación de invitados', 'Planificado', 'Listas de bloqueo DNS en Unbound para GUEST y ACAD'],
  ['8.24', 'Uso de la criptografía', 'Sí', 'Datos en tránsito y respaldos', 'Parcial', 'TLS verificado; SHA-256 en respaldos; IPsec AES-256-GCM y restic cifrado planificados'],
  ['8.25', 'Ciclo de vida de desarrollo seguro', 'Sí', 'Reglas y API con controles de acceso', 'Parcial', 'CI con pruebas; revisión entre pares pendiente'],
  ['8.26', 'Requisitos de seguridad de las aplicaciones', 'Sí', 'Autorización por rol y titularidad', 'Implementado', 'Requisitos de autorización probados (19 reglas, 18 API); validación con Zod'],
  ['8.27', 'Principios de ingeniería y arquitectura de sistemas seguros', 'Sí', 'Defensa en profundidad', 'Parcial', 'Mínimo privilegio en BD, sincronización no bloqueante y zonas del diseño'],
  ['8.28', 'Codificación segura', 'Sí', 'Inyección y fuga de errores', 'Parcial', 'execFileSync sin shell, errores sin detalles internos y helmet; 240 usos de any pendientes'],
  ['8.29', 'Pruebas de seguridad en el desarrollo y la aceptación', 'Sí', 'Fallas de autorización', 'Implementado', '19 pruebas de reglas, 27 de API y 19 de BD; suite ejecutada contra producción en solo lectura'],
  ['8.30', 'Desarrollo externalizado', 'No', 'No aplica: el desarrollo lo realiza el equipo; si se contrata a terceros se aplicará 5.20', 'No aplicable', '—'],
  ['8.31', 'Separación de los entornos de desarrollo, prueba y producción', 'Sí', 'Pruebas sin tocar datos reales', 'Parcial', 'Emulador de Firestore y bases cermat_prueba y cermat_db_verificacion; sin proyecto Firebase de staging'],
  ['8.32', 'Gestión de cambios', 'Sí', 'Reglas que nunca llegaron a producción', 'Parcial', 'Publicación condicionada en el CI; procedimiento de actualización del VPS; NC-02 abierta'],
  ['8.33', 'Información de prueba', 'Sí', 'Datos personales en pruebas', 'Implementado', 'Datos ficticios; el script de datos se niega a correr con datos reales'],
  ['8.34', 'Protección de los sistemas de información durante las pruebas de auditoría', 'Sí', 'Auditar sin afectar producción', 'Implementado', 'Ruleset descargado en solo lectura; restauraciones en base de verificación; restore.js se niega a escribir en producción'],
];

if (soaBase.length !== 93) {
  console.error(`La SoA debe tener 93 controles y tiene ${soaBase.length}.`);
  process.exit(1);
}

// Índice inverso control → riesgos (a partir del tratamiento)
const riesgosPorControl = {};
for (const r of riesgos) for (const c of r.controles) (riesgosPorControl[c] ??= []).push(r.id);

const soa = {
  hoja: 'SoA',
  columnas: ['Control', 'Nombre', 'Aplicable', 'Justificación', 'Riesgos tratados', 'Estado', 'Evidencia o plan'],
  filas: soaBase.map((c) => [c[0], c[1], c[2], c[3], (riesgosPorControl[c[0]] ?? []).join(', ') || '—', c[4], c[5]]),
};
const soaPorTema = (prefijo) => ({ ...soa, filas: soa.filas.filter((f) => f[0].startsWith(prefijo)) });

const ESTADOS_SOA = ['Implementado', 'Parcial', 'Planificado', 'No aplicable'];
const TEMAS = [
  ['5', 'Organizacionales'],
  ['6', 'De personas'],
  ['7', 'Físicos'],
  ['8', 'Tecnológicos'],
];
const soaResumen = {
  hoja: 'Resumen',
  columnas: ['Tema', 'Controles', ...ESTADOS_SOA],
  filas: [
    ...TEMAS.map(([p, nombre]) => {
      const del = soaBase.filter((c) => c[0].startsWith(`${p}.`));
      return [`${p}. ${nombre}`, String(del.length), ...ESTADOS_SOA.map((e) => String(del.filter((c) => c[4] === e).length))];
    }),
    ['Total', String(soaBase.length), ...ESTADOS_SOA.map((e) => String(soaBase.filter((c) => c[4] === e).length))],
  ],
};

const trazabilidad = {
  hoja: 'Trazabilidad',
  columnas: ['Riesgo', 'Descripción', 'Nivel inicial', 'Controles (SoA)', 'Política o procedimiento', 'Evidencia', 'Verificación', 'Nivel residual', 'Estado'],
  filas: riesgos.map((r) => [r.id, r.amenaza, `${r.p * r.i} (${clasificarNivel(r.p * r.i)})`, r.controles.join(', '), r.politica, r.evidencia, r.verificacion, `${r.pr * r.ir} (${clasificarNivel(r.pr * r.ir)})`, r.estado]),
};

// ════════════════════════════════════════════════════════════════════════════
// S2-E2 · CE0312–CE0313 — Implementación, pruebas y monitoreo de red
// ════════════════════════════════════════════════════════════════════════════

const PEND = 'Pendiente de ejecución';
const pruebasRed = {
  hoja: 'Pruebas',
  columnas: ['ID', 'Caso', 'Objetivo', 'Procedimiento o comando', 'Resultado esperado', 'Resultado obtenido', 'Estado', 'Evidencia'],
  filas: [
    ['PR-01', 'Política por defecto del firewall del VPS', 'Entrada denegada y solo puertos necesarios', 'sudo ufw status verbose', 'deny (incoming), allow (outgoing); 22, 80 y 443/tcp ALLOW', 'Conforme según el manual del propietario (2026-10-17)', 'Conforme', 'Manual del VPS; captura de ufw status verbose a adjuntar'],
    ['PR-02', 'Base de datos de la nube no expuesta', 'PostgreSQL solo en loopback', 'sudo ss -tlnp | grep 5432', 'Solo 127.0.0.1:5432 (y ::1)', 'Conforme según el manual (2026-10-17)', 'Conforme', 'Captura a adjuntar; verificación externa en PR-36'],
    ['PR-03', 'Redirección HTTP → HTTPS del dominio', 'Forzar cifrado', 'curl -sI http://cermatschool.edu.pe', '301 hacia https://', '301 Moved Permanently → https://cermatschool.edu.pe/ (2026-10-24)', 'Conforme', 'Anexo B de S2-E2'],
    ['PR-04', 'Redirección HTTP → HTTPS de www y api', 'Forzar cifrado', 'curl -sI http://www.cermatschool.edu.pe/ y http://api.cermatschool.edu.pe/up', '301 hacia https://', '301 en ambos (2026-10-24)', 'Conforme', 'Anexo B de S2-E2'],
    ['PR-05', 'Disponibilidad web y API del colegio', 'Servicio en línea', 'curl -sI https://cermatschool.edu.pe/, https://www…/ y https://api…/up', '200', '200 en los tres (2026-10-24)', 'Conforme', 'Anexo B de S2-E2'],
    ['PR-06', 'Protocolos TLS aceptados por el VPS', 'Rechazar TLS 1.0 y 1.1', 'openssl s_client -connect <host>:443 -tls1 | -tls1_1 | -tls1_2 | -tls1_3', '1.0 y 1.1 rechazados; 1.2 y 1.3 con cifrados AEAD', '1.0 y 1.1: alerta 70 (protocol_version) del servidor; 1.2: ECDHE-ECDSA-AES256-GCM-SHA384; 1.3: TLS_AES_256_GCM_SHA384 (dominio y api, 2026-10-24)', 'Conforme', 'Anexo B de S2-E2'],
    ['PR-07', 'Certificados vigentes', 'Emisor, SAN y vigencia correctos', 'openssl s_client … | openssl x509 -noout -issuer -enddate -ext subjectAltName', 'Emisor de confianza, SAN correcto y vigente', 'Let\'s Encrypt (YE1 y YE2); SAN: dominio y www, y api; vencen el 2027-01-15', 'Conforme', 'Anexo B de S2-E2'],
    ['PR-08', 'Renovación automática de certificados', 'Evitar vencimientos', 'sudo certbot renew --dry-run', 'Simulación exitosa', 'Exitosa según el manual (2026-10-17)', 'Conforme', 'Captura a adjuntar'],
    ['PR-09', 'Bloqueo de archivos ocultos', 'Evitar fuga de configuración', 'curl -s -o /dev/null -w "%{http_code}" https://<host>/.env', '403 o 404', '403 en dominio y api (2026-10-24)', 'Conforme', 'Anexo B de S2-E2'],
    ['PR-10', 'Cabeceras de seguridad HTTP', 'HSTS y cabeceras recomendadas por OWASP', 'curl -sI https://cermatschool.edu.pe/ y https://academia-school-platform.vercel.app/', 'HSTS, X-Content-Type-Options, protección contra framing, Referrer-Policy y Server sin versión', 'Primera medición: el colegio sin cabeceras de seguridad y con Server: nginx/<versión omitida> (Ubuntu); la SPA solo con HSTS. Tras los cambios del 2026-10-24: colegio con 5 de 5 cabeceras en la portada, www, /login, la API y los archivos estáticos, y Server: nginx sin versión; SPA con X-Content-Type-Options, Referrer-Policy, CSP frame-ancestors, Permissions-Policy y HSTS', 'Conforme', 'Anexo B de S2-E2; manual de despliegue §7.2; acción en R-13'],
    ['PR-11', 'Registros DNS', 'Delegación y registros esperados', 'nslookup -type=NS | MX | CNAME', 'NS de RCP; MX de Google; www → dominio', 'NS.RCP.NET.pe y NS2.RCP.NET.pe; 5 registros MX de Google; www CNAME al dominio (2026-10-24)', 'Conforme', 'Anexo B de S2-E2'],
    ['PR-12', 'Protección del dominio', 'CAA, SPF, DMARC y DNSSEC', 'Consultas DNS sobre HTTPS (tipos CAA, TXT, DS)', 'Registros presentes', 'Sin CAA, sin SPF, sin DMARC y sin DNSSEC (2026-10-24)', 'No conforme', 'Anexo B de S2-E2; acciones en R-11 y R-14'],
    ['PR-13', 'HTTPS de la plataforma de la academia (PaaS)', 'Redirección, HSTS y TLS', 'curl -sI http://… y https://…; openssl s_client', 'Redirección a HTTPS, HSTS y TLS ≥ 1.2', '308 a HTTPS; HSTS max-age=63072000; includeSubDomains; preload; 1.0 y 1.1 sin negociación; 1.2 y 1.3 aceptados; certificado *.vercel.app vigente hasta 2026-11-27 (renovación gestionada por Vercel)', 'Conforme', 'Anexo B de S2-E2'],
    ...pruebasPlaneadas.filas.map((pc, k) => [
      `PR-${String(14 + k).padStart(2, '0')}`,
      `${pc[1]} (${pc[0]})`,
      `Validar ${pc[6]}`,
      `${pc[4]} — origen: ${pc[2]}; destino: ${pc[3]}`,
      pc[5],
      PEND,
      'Pendiente',
      'A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha',
    ]),
    ['PR-36', 'Base de datos de la nube no alcanzable desde Internet', 'Confirmar desde afuera lo verificado en PR-02', 'nc -vz -w 3 <IP pública del VPS> 5432 (desde la sede o datos móviles)', 'Tiempo agotado o rechazo', PEND, 'Pendiente', 'A adjuntar: salida de nc con fecha'],
    ['PR-37', 'Fuerza bruta SSH detectada en el VPS', 'Detección de ataques reales sobre el servicio expuesto', 'Agente Wazuh en el VPS; revisar alertas de sshd (reglas 5710, 5712, 5716 y 5720)', 'Alertas con IP de origen y conteo', PEND, 'Pendiente', 'A adjuntar: captura del panel de Wazuh'],
    ['PR-38', 'HTTPS de los subdominios de la academia en el VPS', 'Cifrado y disponibilidad de la API y la analítica', 'curl -sI http://…; curl -s https://api-academia…/health y https://analitica-academia…/health; certbot renew --dry-run', '301 a HTTPS; /health con MySQL conectado; certificado vigente', '301 en ambos; "status":"ok" con MySQL conectado; certificado de Let\'s Encrypt para los dos subdominios, vence el 2027-01-23; renovación simulada correcta (2026-10-24)', 'Conforme', 'Manual de despliegue §9.5'],
    ['PR-39', 'Exposición de la capa de la academia', 'Solo Nginx atiende desde afuera y nada responde sin sesión', 'ss -lntp en el VPS; curl sin token; OPTIONS con un Origin ajeno', '3001, 8000 y 3306 solo en 127.0.0.1; 401 sin sesión; CORS solo para el origen de la academia', '3001 y 8000 solo en 127.0.0.1 y MySQL con bind-address 127.0.0.1; API 401 en /api/sync/payment y analítica 401 sin sesión; origen de Vercel permitido y origen ajeno rechazado (2026-10-24)', 'Conforme', 'Manual de despliegue §9.1, §9.4 y §9.5'],
  ],
};

const incidencias = {
  hoja: 'Incidencias',
  columnas: ['ID', 'Detección', 'Descripción', 'Clasificación', 'Severidad', 'Contención', 'Causa raíz', 'Lección aprendida', 'Estado', 'Vínculo SGSI'],
  filas: [
    ['INC-01', '2026-10-24', 'Reglas de Firestore publicadas el 22-jun-2026 con 3 fallas: listado público de matrículas pagadas, auto-asignación de rol y matrícula pública bloqueada', 'Incidente de seguridad: exposición potencial de datos personales y escalamiento de privilegios', 'S1 (alta)', 'Corrección con 19 pruebas; frontend y reglas publicados el 2026-10-24 y verificados como visitante sin sesión (listar matrículas pagadas → 403)', 'Una línea inválida impedía compilar y nadie verificaba el despliegue', 'Publicar solo por CI y verificar el ruleset publicado', 'Cerrado (2026-10-24)', 'R-01 a R-04; NC-01 y NC-02'],
    ['INC-02', '2026-10-24', 'Clave de cuenta de servicio y archivos de entorno en el repositorio privado (copias ZIP y archivos versionados)', 'Incidente de seguridad: credencial expuesta', 'S1 (alta)', 'Clave de enero (283b43c3…) eliminada y reemplazada por ddf50bfe…; contraseñas de las cuentas de teachers.json restablecidas; los .env (sin contraseñas) siguen versionados por decisión del equipo', 'Copias del proyecto subidas con secretos; control preventivo ausente', 'Escaneo de secretos en el CI y lista de revisión de cambios', 'Cerrado con riesgo residual aceptado (2026-10-24)', 'R-05 y R-06; NC-03'],
    ['INC-03', '2026-10-24', 'El antivirus puso en cuarentena scripts SQL al ejecutarlos desde PowerShell con cmd (IDP.Generic)', 'Evento de seguridad: falso positivo', 'S4 (baja)', 'Restaurar desde cuarentena, ejecutar desde Git Bash y exclusión acotada', 'Heurística del antivirus ante la cadena PowerShell → cmd', 'Procedimiento documentado en server/src/db/README.md', 'Cerrado', 'R-22'],
    ['INC-04', '2026-10-24', 'Sitio del colegio sin cabeceras de seguridad y con la versión de Nginx expuesta; SPA de la academia solo con HSTS', 'Observación de seguridad (no es incidente)', 'S4 (baja)', 'No requiere', 'Configuración por defecto', 'Academia: cabeceras publicadas con vercel.json. Colegio: fragmento de Nginx con 5 cabeceras y server_tokens off, aplicado y verificado el 2026-10-24 (S2-E2 §4.3)', 'Cerrado (2026-10-24)', 'R-13'],
    ['INC-05', '2026-10-24', 'Dominio sin SPF, DMARC, CAA ni DNSSEC', 'Observación de seguridad (no es incidente)', 'S3 (media)', 'No requiere', 'Configuración DNS inicial sin controles de correo', 'Lista de verificación de dominio', 'Abierto', 'R-11 y R-14'],
    ['INC-06', '2026-10-24', 'La sincronización con la API del VPS respondió 500 a las 20:40 y 20:42, y la migración que lo corregía quedó bloqueada más de 20 minutos', 'Incidente de disponibilidad e integridad de la réplica relacional; sin exposición de datos', 'S3 (media)', 'Detección: consola del panel ([sync] … respondió 500) y registros de PM2 (Data truncated for column \'turno\'). Contención: API y analítica detenidas desde otra ventana, lo que liberó la transacción abierta', 'Tres defectos de la base: etiqueta mañana dañada desde junio, rutinas del VPS con otra collation y transacción abierta tras errores de clase 01 (E4 §2.8)', 'Reproducir cada falla en una réplica antes de corregir; migrar con los servicios detenidos y una espera máxima de 60 s; la API cierra la conexión ante un error', 'Cerrado (2026-10-24 22:11)', 'R-27 y R-28; ACT-16 y ACT-17'],
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// S2-E3 · CE0332–CE0333 — Implementación y control del centro de datos
// ════════════════════════════════════════════════════════════════════════════

const recuperacion = {
  hoja: 'Registro',
  columnas: ['ID', 'Fecha y hora', 'Escenario', 'Componente', 'Procedimiento', 'RTO objetivo', 'RPO objetivo', 'RTO medido', 'Verificación', 'Resultado', 'Estado', 'Evidencia'],
  filas: [
    ['REC-01', '2026-10-24 02:23 (UTC−5)', 'Pérdida de la base relacional (restauración en base de verificación)', 'MySQL 8.0.30 de prueba (cermat_db con datos de prueba)', 'node scripts/backup.js y node scripts/restore.js', '< 1 h', '≤ 24 h', '0,38 s', 'SHA-256 verificado. Filas: alumnos 1, ciclos 1, matrículas 3, pagos 3, asistencia 3, auditoría 1, alertas 0, schema_migraciones 3. 10 rutinas, 6 triggers y 3 vistas; objetos completos', 'Recuperación completa', 'Ejecutado', 'registro-restauraciones.jsonl (respaldo cermat_db_2026-10-24T07-23-46.sql)'],
    ['REC-02', '2026-10-24 02:47 (UTC−5)', 'Igual que REC-01, tras las migraciones finales', 'MySQL 8.0.30 de prueba', 'node scripts/backup.js y node scripts/restore.js', '< 1 h', '≤ 24 h', '0,27 s', 'SHA-256 verificado. Asistencia 2 filas; 9 rutinas, 6 triggers y 3 vistas; objetos completos', 'Recuperación completa', 'Ejecutado', 'registro-restauraciones.jsonl (respaldo cermat_db_2026-10-24T07-47-34.sql)'],
    ['REC-03', '2026-10-24', 'Respaldo alterado (prueba negativa)', 'restore.js', 'Modificar el .sql y ejecutar restore.js', 'Rechazo', '—', '—', 'Mensaje: no coincide con su .sha256', 'Rechazado correctamente', 'Ejecutado', 'E2 §4.3'],
    ['REC-04', '2026-10-24', 'Restauración accidental sobre producción (prueba negativa)', 'restore.js', '--destino cermat_db sin --confirmar-produccion', 'Rechazo', '—', '—', 'Se niega a restaurar sobre la base productiva', 'Rechazado correctamente', 'Ejecutado', 'E2 §4.3'],
    ['REC-05', '2026-10-24 16:35 (UTC−5)', 'Restauración con la base real del equipo', 'MySQL 8.0.30 (PC local, cermat_db)', 'node scripts/backup.js (cuenta cermat_respaldo) y node scripts/restore.js hacia cermat_db_verificacion', '< 1 h', '≤ 24 h', '0,23 s', 'SHA-256 verificado. Filas: matrículas 1, pagos 1, schema_migraciones 3, resto 0. 9 rutinas, 6 triggers y 3 vistas; objetos completos', 'Recuperación completa', 'Ejecutado', 'registro-restauraciones.jsonl (respaldo cermat_db_2026-10-24T21-35-08.sql); captura de consola por adjuntar'],
    ['REC-06', 'Pendiente', 'Pérdida de la base del colegio', 'PostgreSQL 16 (VPS)', 'pg_dump -Fc y sha256sum; pg_restore --list; restaurar en base de verificación; comparar conteos (116 migraciones)', '2 h', '≤ 24 h', '—', '—', PEND, 'Pendiente', 'A adjuntar: salida de pg_restore y conteos'],
    ['REC-07', 'Pendiente', 'Pérdida de una VM', 'VM-APP01 en Proxmox', 'Restaurar desde PBS con un ID nuevo y red aislada; verificar /health', '2 h', '≤ 24 h', '—', '—', PEND, 'Pendiente', 'A adjuntar: registro de la tarea de PBS'],
    ['REC-08', 'Pendiente', 'Pérdida total del VPS (recurso de nube)', 'VPS', 'Reconstruir en una VM de prueba con el manual y el último respaldo; validar web y API', '8 h', '≤ 24 h', '—', '—', PEND, 'Pendiente', 'A adjuntar: bitácora con tiempos por paso'],
    ['REC-09', 'Pendiente', 'Interrupción simulada del túnel', 'IPsec OPNsense ↔ VPS', 'swanctl --terminate --ike sede-azangaro en el VPS, o desconectar WAN1', '≤ 2 min automático; 1 h manual', 'No aplica', '—', '—', PEND, 'Pendiente', 'A adjuntar: registro de IPsec y alerta de Uptime Kuma'],
    ['REC-10', 'Pendiente', 'Despliegue defectuoso del frontend', 'Vercel', 'Promover el despliegue anterior', '15 min', '0', '—', '—', PEND, 'Pendiente', 'A adjuntar: historial de despliegues'],
    ['REC-11', 'Pendiente', 'Pérdida de datos operativos', 'Firestore', 'Exportar e importar en emulador o proyecto de prueba; comparar conteos agregados', '4 h', '≤ 24 h', '—', '—', PEND, 'Pendiente', 'A adjuntar: conteos antes y después'],
    ['REC-12', 'Pendiente', 'Pérdida del firewall virtual', 'VM-FW01', 'VM nueva y restaurar config.xml; repetir PR-16 y PR-17', '2 h', 'Último config.xml', '—', '—', PEND, 'Pendiente', 'A adjuntar: captura y resultado de las pruebas'],
    ['REC-13', '2026-10-24', 'Recuperación en otro servidor: respaldo de la PC restaurado en el VPS', 'MySQL 8.0.46 (VPS, cermat_db)', 'sha256sum -c del respaldo cermat_db_2026-10-24T21-35-08.sql y restauración con mysql (manual de despliegue §9.3)', '< 1 h', '≤ 24 h', '0,33 s', 'Huella SHA-256 correcta. 8 tablas, 9 funciones y procedimientos, 6 triggers, 3 vistas y 1 pago. Hallazgo posterior: la base se creó con utf8mb4_unicode_ci y las rutinas quedaron con otra collation que las tablas (corregido el 2026-10-24 a las 22:06)', 'Recuperación completa; defecto de collation detectado después', 'Ejecutado', 'Manual de despliegue §9.3 y §9.6'],
    ['REC-14', '2026-10-24 22:22 (UTC−5)', 'Recuperación en otro servidor: respaldo diario del VPS restaurado en la PC', 'MySQL 8.0.30 (PC, cermat_db_verificacion)', 'Copia con scp de los 4 respaldos y sha256sum -c; node scripts/restore.js --archivo con el más reciente', '< 1 h', '≤ 24 h', '0,41 s', 'SHA-256 verificado. Filas: matrículas 2, pagos 1, ciclos 1, auditoría 2, schema_migraciones 4, resto 0. 9 rutinas, 6 triggers y 3 vistas; collation coherente (utf8mb4_0900_ai_ci); funciones y sp_estado_cuenta sin errores', 'Recuperación completa', 'Ejecutado', 'registro-restauraciones.jsonl (respaldo cermat_db_2026-10-25T03-18-26.sql)'],
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// Salida
// ════════════════════════════════════════════════════════════════════════════

const quitarMarcas = (t) => String(t).replace(/`/g, '');

function hoja(tabla) {
  const filas = [tabla.columnas, ...tabla.filas.map((f) => f.map(quitarMarcas))];
  const ws = XLSX.utils.aoa_to_sheet(filas);
  ws['!cols'] = tabla.columnas.map((_, c) => {
    const largo = Math.max(...filas.map((f) => String(f[c] ?? '').length));
    return { wch: Math.min(60, Math.max(8, largo + 2)) };
  });
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: filas.length - 1, c: tabla.columnas.length - 1 } }) };
  return ws;
}

function leeme(titulo, entregable, notas = []) {
  const filas = [
    ['Campo', 'Detalle'],
    ['Documento', titulo],
    ['Entregable', entregable],
    ['Proyecto', PROYECTO],
    ['Equipo', EQUIPO],
    ['Versión', `${VERSION} — ${FECHA}`],
    ['Generado por', 'perfil-egreso/scripts/generar-matrices-infra.mjs (los datos coinciden con las tablas del informe)'],
    ['Seguridad', 'Sin datos personales, sin IP públicas y sin secretos'],
    ['Estados', 'Implementado = con evidencia verificable; Diseñado/Planificado = con procedimiento, sin ejecutar; Pendiente de ejecución = aún sin resultado'],
    ...notas.map((n, k) => [`Nota ${k + 1}`, n]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(filas);
  ws['!cols'] = [{ wch: 14 }, { wch: 110 }];
  return ws;
}

function libro(archivo, titulo, entregable, tablas, notas) {
  const wb = XLSX.utils.book_new();
  wb.Props = { Title: titulo, Subject: entregable, Author: 'Equipo CERMAT — EPE 2026-2', CreatedDate: new Date(`${FECHA}T12:00:00Z`) };
  XLSX.utils.book_append_sheet(wb, leeme(titulo, entregable, notas), 'Leeme');
  for (const t of tablas) XLSX.utils.book_append_sheet(wb, hoja(t), t.hoja);
  const destino = path.join(SALIDA, archivo);
  XLSX.writeFile(wb, destino, { bookType: 'xlsx', compression: true });
  return destino;
}

fs.mkdirSync(SALIDA, { recursive: true });
const generados = [
  libro('s1-e1-matriz-componentes-red.xlsx', 'Matriz de componentes de red', 'S1-E1 · CE0311 — Análisis y diseño de red',
    [componentesRed, vlans, matrizZonas, reglasFw, reglasUfw, flujos, requisitos],
    ['Matriz de zonas: P = permitido, L = limitado a las reglas indicadas, D = denegado (política por defecto, con registro).']),
  libro('s1-e1-matriz-pruebas-conectividad.xlsx', 'Matriz de pruebas de conectividad planeadas', 'S1-E1 · CE0311 — Análisis y diseño de red',
    [pruebasPlaneadas], ['Se ejecutan en S2-E2 como PR-14 a PR-35.']),
  libro('s1-e2-matriz-componentes-dimensionamiento.xlsx', 'Matriz de componentes y dimensionamiento del centro de datos', 'S1-E2 · CE0331 — Análisis y diseño de centro de datos híbrido',
    [componentesCd, dimVm, capacidadHost, crecimiento, ramVps, supuestos, rtoRpo],
    ['Las cifras estimadas figuran como "Supuesto a validar" con su fuente.']),
  libro('s2-e1-inventario-activos.xlsx', 'Inventario de activos y clasificación C-I-D', 'S2-E1 · CE0321–CE0324 — SGSI', [criteriosActivos, activos]),
  libro('s2-e1-matriz-riesgos.xlsx', 'Matriz de evaluación y tratamiento de riesgos (ISO/IEC 27005)', 'S2-E1 · CE0321–CE0324 — SGSI',
    [criteriosRiesgo, riesgosEvaluacion, riesgosTratamiento]),
  libro('s2-e1-declaracion-aplicabilidad.xlsx', 'Declaración de Aplicabilidad (ISO/IEC 27001:2022, Anexo A)', 'S2-E1 · CE0321–CE0324 — SGSI',
    [soa, soaResumen, trazabilidad], ['La columna "Riesgos tratados" se calcula desde la matriz de tratamiento de riesgos.']),
  libro('s2-e2-plan-resultados-pruebas-red.xlsx', 'Plan y resultados de pruebas de red', 'S2-E2 · CE0312–CE0313 — Implementación, testing y monitoreo de red',
    [pruebasRed, incidencias], ['PR-01 a PR-13 tienen resultado real; las demás están pendientes de ejecución.']),
  libro('s2-e3-registro-prueba-recuperacion.xlsx', 'Registro de pruebas de recuperación', 'S2-E3 · CE0332–CE0333 — Implementación, gestión y control de centro de datos',
    [recuperacion], ['REC-01 a REC-04 se ejecutaron en una base de prueba aislada y REC-05 sobre la base real (2026-10-24). REC-13 y REC-14 son recuperaciones en otro servidor: de la PC al VPS y del VPS a la PC. La base real tiene muy pocas filas: el RTO debe volver a medirse cuando la réplica tenga volumen.']),
  libro('s2-e3-inventario-final-activos.xlsx', 'Inventario final de activos con evidencia', 'S2-E3 · CE0332–CE0333 — Implementación, gestión y control de centro de datos',
    [inventarioFinal]),
];

for (const g of generados) console.log(`✓ ${path.relative(RAIZ_DOCS, g)}`);

// ─── Exportación opcional en Markdown (verificación de coherencia con los informes) ───
const iMd = process.argv.indexOf('--md');
if (iMd > -1) {
  const dirMd = path.resolve(process.argv[iMd + 1] ?? 'tablas-md');
  fs.mkdirSync(dirMd, { recursive: true });
  const celda = (t) => String(t ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const md = (t) =>
    [`| ${t.columnas.map(celda).join(' | ')} |`, `|${t.columnas.map(() => '---').join('|')}|`, ...t.filas.map((f) => `| ${f.map(celda).join(' | ')} |`)].join('\n') + '\n';
  const tablas = {
    vlans, 'matriz-zonas': matrizZonas, 'reglas-fw': reglasFw, 'reglas-ufw': reglasUfw, flujos, 'componentes-red': componentesRed,
    'pruebas-planeadas': pruebasPlaneadas, requisitos, 'componentes-cd': componentesCd, 'dim-vm': dimVm, 'capacidad-host': capacidadHost,
    crecimiento, 'ram-vps': ramVps, supuestos, 'rto-rpo': rtoRpo, 'criterios-activos': criteriosActivos, activos,
    'criterios-riesgo': criteriosRiesgo, 'riesgos-evaluacion': riesgosEvaluacion, 'riesgos-tratamiento': riesgosTratamiento,
    soa, 'soa-5': soaPorTema('5.'), 'soa-6': soaPorTema('6.'), 'soa-7': soaPorTema('7.'), 'soa-8': soaPorTema('8.'),
    'soa-resumen': soaResumen, trazabilidad, 'pruebas-red': pruebasRed, incidencias, recuperacion, 'inventario-final': inventarioFinal,
  };
  for (const [nombre, t] of Object.entries(tablas)) fs.writeFileSync(path.join(dirMd, `${nombre}.md`), md(t));

  const contar = (arr, f) => arr.reduce((m, x) => ((m[f(x)] = (m[f(x)] ?? 0) + 1), m), {});
  const cuantos = (arr, f, v) => arr.filter((x) => f(x) === v).length;
  const resumen = {
    componentesRed: componentesRed.filas.length,
    flujos: flujos.filas.length,
    reglasFw: reglasFw.filas.length,
    pruebasPlaneadas: pruebasPlaneadas.filas.length,
    componentesCd: componentesCd.filas.length,
    vm: { cantidad: vms.length, vcpu: totalVcpu, ramGb: totalRam, discoGb: totalDisco, ramComprometidaGb: totalRam + RAM_SISTEMA, pctRam: pct(totalRam + RAM_SISTEMA, RAM_HOST), pctDisco: pct(totalDisco, DISCO_UTIL_GB) },
    activos: { total: activosBase.length, porCriticidad: contar(activos.filas, (f) => f[11]), porEstado: contar(activosBase, (a) => a[10]) },
    riesgos: {
      total: riesgos.length,
      inicial: contar(riesgos, (r) => clasificarNivel(r.p * r.i)),
      residual: contar(riesgos, (r) => clasificarNivel(r.pr * r.ir)),
      criticos: cuantos(riesgos, (r) => clasificarNivel(r.p * r.i), 'Crítico'),
      altos: cuantos(riesgos, (r) => clasificarNivel(r.p * r.i), 'Alto'),
      medios: cuantos(riesgos, (r) => clasificarNivel(r.p * r.i), 'Medio'),
      residualBajos: cuantos(riesgos, (r) => clasificarNivel(r.pr * r.ir), 'Bajo'),
      residualMedios: cuantos(riesgos, (r) => clasificarNivel(r.pr * r.ir), 'Medio'),
      hallazgosReales: riesgos.filter((r) => /Hallazgo|Incidente|Hecho/.test(r.origen)).length,
    },
    soa: {
      total: soaBase.length,
      aplicables: soaBase.filter((c) => c[2] === 'Sí').length,
      porEstado: contar(soaBase, (c) => c[4]),
      implementados: cuantos(soaBase, (c) => c[4], 'Implementado'),
      parciales: cuantos(soaBase, (c) => c[4], 'Parcial'),
      planificados: cuantos(soaBase, (c) => c[4], 'Planificado'),
      noAplicables: cuantos(soaBase, (c) => c[4], 'No aplicable'),
    },
    pruebasRed: {
      total: pruebasRed.filas.length,
      porEstado: contar(pruebasRed.filas, (f) => f[6]),
      conformes: cuantos(pruebasRed.filas, (f) => f[6], 'Conforme'),
      noConformes: cuantos(pruebasRed.filas, (f) => f[6], 'No conforme'),
      pendientes: cuantos(pruebasRed.filas, (f) => f[6], 'Pendiente'),
    },
    recuperacion: {
      total: recuperacion.filas.length,
      porEstado: contar(recuperacion.filas, (f) => f[10]),
      ejecutadas: cuantos(recuperacion.filas, (f) => f[10], 'Ejecutado'),
      pendientes: cuantos(recuperacion.filas, (f) => f[10], 'Pendiente'),
    },
    incidencias: incidencias.filas.length,
  };
  fs.writeFileSync(path.join(dirMd, 'resumen.json'), JSON.stringify(resumen, null, 2));
  console.log(`✓ Tablas Markdown y resumen.json en ${dirMd}`);
}
