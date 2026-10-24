# S2-E3 · Implementación, Gestión y Control de Centro de Datos (CE0332–CE0333)

!!! abstract "CE0332 y CE0333 — Implementación, control y operación del centro de datos"
    Despliegue y operación del [centro de datos híbrido diseñado en el Semestre 1](s1-e2-diseno-centro-datos-hibrido-ce0331.md): entorno on-premise (Proxmox VE, equivalente a ESXi), nube (VPS equivalente a EC2 y servicios PaaS), identidades, inventario final, respaldo y recuperación, RTO/RPO, monitoreo y control de cambios. Lo **implementado** (VPS, PaaS y respaldo y restauración de MySQL) se distingue de lo **pendiente de ejecución** (host, VM, VPN y respaldos del VPS y de Firestore).

## Portada

| Campo | Detalle |
|---|---|
| Título | Implementación, gestión y control del centro de datos híbrido de CERMAT |
| Entregable | Semestre 2 · Entregable 3 · CE0332 y CE0333 |
| Estudiantes | David Robert Yucra Mamani (líder), Gladys Rosaura Yana Pari, Denilson Leeke Mamani Flores, Cárdenas Vilca Rennzo |
| Semestre | 2026-2 (9° ciclo), UPeU campus Juliaca, sección g1 |
| Fecha | 2026-10-24 |
| Versión | 2.0 |

**Control de versiones**

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-07-06 | Servicios del servidor local, RAID, SLA y procedimientos (estructura anterior de la guía) |
| 2.0 | 2026-10-24 | Reescrito según la guía vigente: VPS como EC2 equivalente, procedimientos de Proxmox, identidades, inventario final con evidencia, registro de recuperación real, RTO/RPO medido y control de cambios |

**Productos obligatorios**

| Producto | Formato entregado | Ubicación | Criterio de aceptación (guía) | Estado |
|---|---|---|---|---|
| Informe de implementación, gestión y control de centro de datos | Página versionada; PDF desde la vista de impresión | Este documento | Completo, versionado y coherente con el diseño de S1 | Entregado |
| Evidencias técnicas de configuración | Configuraciones sanitizadas y salidas de comandos | Secciones 3, 4, 5 y 7 | Incluye nube (VPC/EC2/SG/NACL/IAM equivalentes) e hipervisor (vSwitch/VLAN/VM equivalentes) | Parcial: nube con evidencia; hipervisor con procedimiento pendiente |
| Registro de prueba de recuperación | XLSX y sección 7.7 | [s2-e3-registro-prueba-recuperacion.xlsx](../assets/infraestructura/s2-e3-registro-prueba-recuperacion.xlsx) | Al menos un ejercicio de recuperación completo, documentado | **Cumplido**: 4 ejercicios ejecutados (REC-01 a REC-04); 8 pendientes |
| Repositorio técnico de centro de datos | Git | Sección 10 | Scripts, configuraciones sanitizadas, README y control de versiones sin secretos | Parcial: scripts versionados; carpeta `infra/` por crear; secretos del historial revocados el 2026-10-24 (NC-03 cerrada) |

## 1. Resumen ejecutivo de la implementación del centro de datos

| Componente del diseño | Estado | Evidencia |
|---|---|---|
| Nube IaaS: VPS (equivalente a EC2) con UFW (equivalente a Security Group), Nginx, TLS y PostgreSQL local | **Implementado** | Manual del propietario (2026-10-17); verificaciones PR-01 a PR-09 |
| Nube PaaS: Vercel y Firebase | **Implementado** | PR-13; 22 colecciones con reglas; último despliegue del frontend el 2026-10-15 |
| Respaldo y restauración de MySQL con SHA-256 y RTO medido | **Implementado y probado** | REC-01 a REC-04 en una base de prueba (RTO de 0,27–0,38 s) y REC-05 en la base real (RTO de 0,23 s); falta programar el respaldo diario |
| Identidades de mínimo privilegio en las bases | **Implementado** | 4 roles MySQL (error 1142 ante DML directo); usuario PostgreSQL sin superusuario |
| Host Proxmox, bridges con VLAN, bond y VM | Pendiente de ejecución | Procedimiento en la sección 3 |
| Red interna del VPS, strongSwan y NACL | Pendiente de ejecución | Sección 4.4 y S2-E2 §3 |
| Respaldo del VPS y de Firestore | Pendiente de ejecución | Sección 7 (no conformidades NC-04 y NC-06) |
| Monitoreo de capacidad y alertas | Parcial | `/health` y rutinas del manual; Netdata y Uptime Kuma pendientes |

La capa local de la academia sigue en una PC con PM2 (CD-36) hasta que exista VM-APP01. El cumplimiento del diseño es completo en la nube y queda pendiente en la sede, por falta del hardware.

## 2. Trazabilidad con el diseño del centro de datos

| Elementos de S1-E2 | Implementación | Cambio o justificación |
|---|---|---|
| CD-01 a CD-22 (rack, UPS, host, Proxmox, bridges, VM, almacenamiento y enlaces) | Pendiente | Sujeto a la adquisición del hardware; se propone un laboratorio (fase 1b) para ensayar el procedimiento |
| CD-23 a CD-27 (VPS, Ubuntu con UFW, Nginx con Certbot, sistema del colegio y PostgreSQL) | Implementado | Sin cambios |
| CD-28 (strongSwan y `dum0`) | Pendiente | Requiere OPNsense en la sede |
| CD-29 a CD-32 (Vercel y Firebase) | Implementado | Reglas de Firestore corregidas publicadas y frontend con cabeceras de seguridad, verificados el 2026-10-24 (NC-01 cerrada) |
| CD-33 (GitHub y CI) | Implementado en código | La primera ejecución en GitHub está pendiente |
| CD-34 (DNS) | Implementado | Se agregan CAA, SPF y DMARC (PR-12) |
| CD-35 (túnel) | Pendiente | Requiere OPNsense |
| CD-36 (PC local) | Operativa, transitoria | Se mantiene hasta migrar a VM-APP01 |
| VMware ESXi | Proxmox VE | Equivalencia técnica; sin costo de licencia |
| AWS (VPC, EC2, SG, NACL, IAM) | VPS, PaaS y controles equivalentes | Infraestructura ya contratada; sin cuenta de AWS |

## 3. Implementación del entorno on-premise

### 3.1 Estado actual (operativo, transitorio)

La API Node.js (`cermat-api`, puerto 3001, gestionada con `npm run pm2:start`), el servicio de analítica FastAPI (puerto 8000) y MySQL 8 corren en una PC local. El respaldo usa `server/scripts/backup.js` y la restauración `server/scripts/restore.js` (sección 7). No hay hipervisor, firewall perimetral ni segmentación.

### 3.2 Procedimiento de despliegue en Proxmox VE

**Estado: pendiente de ejecución.**

**Paso 1. Instalación.** Instalar Proxmox VE desde la ISO oficial en PVE01, con ZFS RAID1 sobre los dos SSD. Configurar el repositorio sin suscripción y actualizar (`apt update && apt full-upgrade`).

**Paso 2. Red** (equivalente a vSwitch, port groups y NIC teaming). Archivo `/etc/network/interfaces`; los nombres `nic1` a `nic4` se sustituyen por los reales (`ip link`):

```text
auto lo
iface lo inet loopback

iface nic1 inet manual
iface nic2 inet manual

auto bond0
iface bond0 inet manual
    bond-slaves nic1 nic2
    bond-mode 802.3ad
    bond-miimon 100
    bond-xmit-hash-policy layer2+3

auto vmbr0
iface vmbr0 inet manual
    bridge-ports bond0
    bridge-stp off
    bridge-fd 0
    bridge-vlan-aware yes
    bridge-vids 10 20 30 40 50 99

auto vmbr0.99
iface vmbr0.99 inet static
    address 10.10.99.10/27
    gateway 10.10.99.1

auto vmbr1
iface vmbr1 inet manual
    bridge-ports nic3
    bridge-stp off
    bridge-fd 0
#   WAN1: sin IP del host

auto vmbr2
iface vmbr2 inet manual
    bridge-ports nic4
    bridge-stp off
    bridge-fd 0
#   WAN2: sin IP del host
```

```bash
ifreload -a && ip -br link show master vmbr0 && cat /proc/net/bonding/bond0
```

**Paso 3. Almacenamiento.** Compresión y límite del ARC de ZFS; HDD de 4 TB en paso directo a VM-BKP01:

```bash
zfs set compression=lz4 rpool
echo "options zfs zfs_arc_max=4294967296" > /etc/modprobe.d/zfs.conf && update-initramfs -u
qm set 150 -scsi1 /dev/disk/by-id/<id-del-hdd>
```

**Paso 4. Máquinas virtuales.** Se adjunta la ISO de cada sistema con `--ide2 local:iso/<archivo>,media=cdrom`:

```bash
qm create 101 --name vm-fw01 --ostype other --cores 2 --memory 4096 --scsihw virtio-scsi-single \
  --scsi0 local-zfs:40 --net0 virtio,bridge=vmbr1 --net1 virtio,bridge=vmbr2 \
  --net2 "virtio,bridge=vmbr0,trunks=10;20;30;40;50;99" --onboot 1 --startup order=1
qm create 120 --name vm-bas01  --ostype l26 --cores 1 --memory 1024 --scsi0 local-zfs:16  --net0 virtio,bridge=vmbr0,tag=99 --onboot 1 --startup order=2
qm create 130 --name vm-siem01 --ostype l26 --cores 4 --memory 8192 --scsi0 local-zfs:150 --net0 virtio,bridge=vmbr0,tag=40 --onboot 1 --startup order=3
qm create 110 --name vm-app01  --ostype l26 --cores 2 --memory 4096 --scsi0 local-zfs:60  --net0 virtio,bridge=vmbr0,tag=40 --onboot 1 --startup order=4
qm create 150 --name vm-bkp01  --ostype l26 --cores 2 --memory 4096 --scsi0 local-zfs:32  --net0 virtio,bridge=vmbr0,tag=40 --onboot 1 --startup order=5
qm create 140 --name vm-mon01  --ostype l26 --cores 2 --memory 2048 --scsi0 local-zfs:30  --net0 virtio,bridge=vmbr0,tag=40 --onboot 1 --startup order=5
qm create 160 --name vm-hpot01 --ostype l26 --cores 1 --memory 1024 --scsi0 local-zfs:16  --net0 virtio,bridge=vmbr0,tag=50 --onboot 1 --startup order=6
qm list
```

**Paso 5. Firewall virtual e IDS.** Se instala OPNsense con Suricata en VM-FW01 según [S2-E2 §4.2 y §6.1](s2-e2-implementacion-red-ce0312-ce0313.md). Se activa el firewall de Proxmox en las VM de la VLAN 40 para microsegmentar: solo 1514/1515 hacia VM-SIEM01, 19999 hacia VM-MON01 y 8007 hacia VM-BKP01 desde PVE01.

**Paso 6. Migrar la capa de la academia a VM-APP01.**

```bash
# En VM-APP01 (Ubuntu 24.04): Node 22, MySQL 8, Python 3.11 y PM2 instalados
node scripts/restore.js --archivo <último respaldo>.sql --destino cermat_db --confirmar-produccion
node scripts/db-crear-usuarios.js            # lee las contraseñas de variables de entorno
npm run build && npm run pm2:start && pm2 startup systemd && pm2 save
pm2 start scripts/backup.js --name cermat-backup --cron "0 2 * * *" --no-autorestart
```

Luego se ajusta `CORS_ORIGINS` al dominio de Vercel y, desde el panel de administración, se cambia la URL de la API y de la analítica (`config/services`) a los subdominios publicados por el proxy del VPS (sección 4.4).

**Paso 7. Respaldo de VM en PBS.** Agregar el almacenamiento PBS en *Datacenter → Storage* con su huella digital. Programar un trabajo diario a las 03:00 para todas las VM, con retención de 7 diarias, 4 semanales y 3 mensuales, cifrado del cliente (la llave se guarda fuera de línea) y verificación semanal.

| Criterio de aceptación | Resultado obtenido | Evidencia a adjuntar |
|---|---|---|
| `qm list` con las 7 VM y sus etiquetas; `bond0` con 2 enlaces activos; VM-APP01 responde `/health`; primer respaldo de PBS verificado | Pendiente de ejecución | Captura del resumen del host, `/etc/network/interfaces` sanitizado, salida de `qm list` y de `/proc/net/bonding/bond0` y registro del trabajo de PBS |

## 4. Implementación del entorno de nube

### 4.1 VPS (equivalente a EC2): implementado

| Elemento | Configuración | Fuente |
|---|---|---|
| Proveedor y plan | RackNerd, VPS KVM (US$ 35,99 al año) | Manual del propietario |
| Recursos y región | 2 vCPU, 2 GB de RAM, 35 GB SSD; New York, EE. UU. | Manual |
| Sistema operativo | Ubuntu 24.04 LTS de 64 bits | Manual |
| Administración | Usuario Linux no-root con sudo; SSH (22/tcp) | Manual |
| Frontend | Angular compilado, servido por Nginx en el dominio y en www | Manual; PR-05 |
| Backend | Laravel con PHP 8.4-FPM en el subdominio `api`, con comprobación `/up` | Manual; PR-05 |
| Base de datos | PostgreSQL 16.15 solo en loopback; base `cermat_produccion`; usuario de aplicación propietario de su base, sin superusuario | Manual; PR-02 |
| Esquema | Importado en una transacción; 116 migraciones aplicadas | Manual |
| Permisos | Grupo `www-data`, sin 777; `.env` con permisos 640 | Manual |
| Firewall de host | UFW: entrada denegada; 22, 80 y 443/tcp | Manual; PR-01 |
| TLS | Let's Encrypt (Certbot) en el dominio, www y api; redirección de HTTP a HTTPS; renovación automática probada | Manual; PR-03 a PR-08 |
| DNS | Punto.pe (servidores de RCP): A para el dominio y `api`, CNAME para `www`; MX de Google y TXT conservados | Manual; PR-11 |

### 4.2 Equivalencias AWS con su evidencia

| Elemento AWS | Implementación | Evidencia | Estado |
|---|---|---|---|
| EC2 | VPS KVM | Sección 4.1 | Implementado |
| Security Group | UFW | PR-01 | Implementado |
| NACL | nftables sin estado o filtro del proveedor | Sección 4.4 | Pendiente |
| VPC: subred pública e Internet Gateway | Interfaz pública y enrutamiento del proveedor | Sitios accesibles (PR-05) | Implementado (provisto) |
| VPC: subred privada | `dum0` 10.20.0.0/24 | S2-E2 §3, paso 1 | Pendiente |
| Route tables | Tabla `main` y tabla 220 de strongSwan | `ip route show table 220` | Pendiente |
| NAT Gateway | No requerido | — | No aplica |
| IAM | Usuarios Linux, roles de bases, claims de Firebase y cuentas de servicio | Sección 5 | Parcial |

### 4.3 Servicios PaaS: implementados

| Servicio | Estado | Evidencia |
|---|---|---|
| Vercel (SPA) | En producción; último despliegue el 2026-10-15; redirección 308 a HTTPS y HSTS con preload | PR-13; panel de Vercel |
| Firebase Authentication | En producción; administradores por claim; invitaciones de un solo uso | `firestore.rules`; 8 perfiles |
| Cloud Firestore | 22 colecciones con reglas por rol; versión corregida probada 19/19 y publicada el 2026-10-24 | `tests/firestore-rules/reglas.test.ts`; verificación sin sesión en producción ([E4 §2.7](../e4-calidad-operacion-ce024.md#27-cierre-en-produccion-2026-10-24)) |
| Firebase Storage | En producción | Consola de Firebase |

### 4.4 Pendiente en la nube

**Estado: pendiente de ejecución.**

1. **Red interna y VPN:** procedimiento de S2-E2 §3.
2. **NACL** con nftables sin estado, sustituyendo `eth0` por la interfaz real y validando antes que no afecte al tráfico IPsec:

    ```text
    # /etc/nftables.d/nacl.nft
    table netdev nacl {
      chain ingreso {
        type filter hook ingress device "eth0" priority -500; policy accept;
        ip saddr { 0.0.0.0/8, 127.0.0.0/8, 169.254.0.0/16, 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24, 224.0.0.0/4, 240.0.0.0/4 } drop
        tcp flags & (fin|syn) == (fin|syn) drop
        tcp flags & (syn|rst) == (syn|rst) drop
      }
    }
    ```

3. **Memoria:** medir la línea base (sección 9.3) y crear un archivo de intercambio de 2 GB si `swapon --show` no muestra ninguno.
4. **Proxy de la API de la academia.** Ejemplo para el subdominio propuesto; la analítica sigue el mismo patrón hacia el puerto 8000:

    ```nginx
    limit_req_zone $binary_remote_addr zone=api_academia:10m rate=10r/s;
    server {
        listen 443 ssl;
        server_name api-academia.cermatschool.edu.pe;   # propuesto; certificado con Certbot
        server_tokens off;
        location = /health { proxy_pass http://10.10.40.10:3001/health; proxy_bind 10.20.0.1; }
        location /api/ {
            limit_req zone=api_academia burst=20 nodelay;
            proxy_pass http://10.10.40.10:3001;
            proxy_bind 10.20.0.1;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_connect_timeout 5s;
            proxy_read_timeout 15s;
            client_max_body_size 1m;
        }
        location / { return 404; }
    }
    ```

    En el código de la API debe configurarse `trust proxy` para registrar la IP real del cliente; es un cambio pendiente en el repositorio de la aplicación.
5. **Agentes:** Wazuh y Netdata hijo (S2-E2 §6.3 y §7.2).

| Criterio de aceptación | Resultado obtenido | Evidencia a adjuntar |
|---|---|---|
| `nft list ruleset` con la tabla `nacl`; PR-27 conforme (`/health` responde 200 por el proxy y otras rutas 404); MemAvailable ≥ 25 % tras los agentes | Pendiente de ejecución | Salidas de `nft list ruleset`, `curl -I` y `free -m` antes y después |

## 5. Gestión de identidades y accesos

| Ámbito | Control | Estado | Evidencia |
|---|---|---|---|
| VPS | Usuario Linux no-root con sudo | Implementado | Manual |
| VPS | SSH solo con llaves y sin root | Por verificar | `sshd -T` (S2-E2 §4.3) |
| VPS | Secretos de Laravel en `.env` con permisos 640 | Implementado | Manual |
| PostgreSQL | Usuario de aplicación propietario de su base, sin superusuario | Implementado | Manual (`\du`) |
| MySQL | 4 roles de mínimo privilegio; `cermat_api` sin DML directo | Implementado en la base de prueba y en la base real (2026-10-24): cuentas `cermat_api`, `cermat_analitica` y `cermat_respaldo`, con contraseñas solo en `.env.local` no versionados | `server/src/db/04_seguridad.sql`; error 1142 verificado en la base real |
| MySQL | Contraseñas solo en variables de entorno, con un mínimo de 12 caracteres | Implementado en los scripts | `server/scripts/db-crear-usuarios.js` |
| Firebase | Claim de administrador; roles solo con invitación vigente | Implementado y publicado (2026-10-24) | `firestore.rules` y 8 pruebas de roles |
| Google Cloud | Cuenta de servicio del CI con rol mínimo (*Firebase Rules Admin*), en el entorno protegido `produccion` | Definido en el CI; configuración del secreto por confirmar | `.github/workflows/ci.yml` |
| Google Cloud | Rotación de la clave expuesta en copias ZIP | Hecho (2026-10-24): clave `283b43c3…` eliminada y reemplazada por `ddf50bfe…` | NC-03 |
| Proveedores | MFA en Google, GitHub, Vercel, RackNerd y Punto.pe | No verificado | NC-07 |
| Proxmox, OPNsense y Wazuh | Usuarios nominativos con TOTP; root solo por consola | Planificado | Sección 3 |
| VPN | Certificados X.509 propios; llaves privadas fuera de Git | Planificado | S2-E2 §3 |

**Equivalencia con AWS IAM.**

| AWS IAM | Equivalente en este proyecto |
|---|---|
| Usuarios y grupos | Usuarios Linux nominativos y el grupo `sudo` |
| Roles y políticas | Roles de MySQL y PostgreSQL; claims de Firebase; roles IAM de las cuentas de servicio de Google Cloud |
| MFA | Segundo factor en las consolas y TOTP en Proxmox, OPNsense y Wazuh |
| Rotación de credenciales | Calendario de [S2-E1 §10.4](s2-e1-sgsi-ce0321-ce0324.md) |
| Llaves de acceso | Llaves SSH ed25519 por persona; secretos de GitHub con rol mínimo |

**Accesos administrativos.** Al hipervisor y al firewall solo se entra desde ADMIN_TI o el bastión, por la VLAN 99 (FW-20, FW-50). Al VPS, solo desde el bastión por la VPN, una vez cerrado 22/tcp a Internet (UFW-08 y UFW-09). La revisión trimestral de accesos sigue S2-E1 §10.5.

## 6. Inventario final de activos

| ID | Activo | Propietario | Ubicación | Criticidad | Estado al 2026-10-24 | Evidencia |
|---|---|---|---|---|---|---|
| ACT-01 | Datos personales de alumnos y apoderados (users, enrollments, students; réplica alumnos) | Dirección de la academia | Firestore (Google) y réplica MySQL | Alta | Operativo | Reglas por rol en firestore.rules; 8 perfiles y 8 matrículas (conteo agregado al 2026-10-24) |
| ACT-02 | Datos de pagos (payments; tabla pagos) | Dirección de la academia | Firestore y MySQL | Alta | Operativo | 2 pagos confirmados (conteo agregado); triggers de auditoría en MySQL |
| ACT-03 | Registros de asistencia (attendanceLogs, attendanceDayState, parentAttendance; tabla asistencia) | Dirección de la academia | Firestore y MySQL | Alta | Operativo | 7 registros (conteo agregado); sp_registrar_asistencia idempotente |
| ACT-04 | Contenido público (ciclos, sedes, posts, recursos y talleres) | Dirección de la academia | Firestore y Storage | Media | Operativo | Sitio público en Vercel (200 OK, 2026-10-24) |
| ACT-05 | Configuración de servicios (config/services) | Líder técnico | Firestore | Alta | Operativo | src/lib/syncService.ts lee config/services |
| ACT-06 | Reglas de seguridad de Firestore | Líder técnico | Repositorio Git y Firebase | Alta | Operativo (publicada 2026-10-24) | firestore.rules y 19 pruebas; versión corregida publicada el 2026-10-24 (reemplazó la del 22-jun-2026) |
| ACT-07 | Código fuente, pruebas y pipeline CI | Líder técnico | GitHub (repositorio privado) | Alta | Operativo | .github/workflows/ci.yml (6 trabajos); 90 pruebas |
| ACT-08 | Secretos y credenciales (cuenta de servicio, contraseñas de BD, llaves SSH, credenciales de VPN) | Líder técnico | Gestor de contraseñas y servidores | Alta | Operativo (clave rotada 2026-10-24) | db-crear-usuarios.js lee contraseñas del entorno; clave de servicio rotada (H-03 corregido) |
| ACT-09 | Respaldos (MySQL, PostgreSQL, Firestore y VM) | Responsable de respaldos | PC local, VPS, PBS y disco externo | Crítica | Parcial (solo MySQL) | backup.js y restore.js; REC-01, REC-02 y REC-05 (base real) |
| ACT-10 | Datos del sistema del colegio (PostgreSQL cermat_produccion) | Dirección del colegio | VPS (New York) | Crítica | Operativo | Manual del VPS (2026-10-17): 116 migraciones, base solo en loopback |
| ACT-11 | Registros de eventos (API, Nginx, autenticación, firewall, IDS y SIEM) | Responsable de seguridad | VPS, PC local y VM-SIEM01 | Alta | Parcial (sin centralizar) | morgan en server/src/index.ts; registros de Nginx en el VPS |
| ACT-12 | Documentación técnica y del SGSI | Líder técnico | Repositorio público de documentación | Baja | Operativo | Este sitio de documentación |
| ACT-13 | Plataforma web de la academia (SPA en Vercel) | Dirección de la academia | Vercel | Alta | Operativo | PR-13: HTTPS y HSTS con preload (2026-10-24) |
| ACT-14 | Firebase Authentication (cuentas y claims) | Dirección de la academia | Google Cloud | Crítica | Operativo | Claim de administrador; invitaciones de un solo uso |
| ACT-15 | Cloud Firestore y Storage | Dirección de la academia | Google Cloud | Crítica | Operativo | 22 colecciones con reglas por rol |
| ACT-16 | API de sincronización y servicio de analítica | Líder técnico | PC local (destino: VM-APP01) | Alta | Transitorio | helmet, CORS y morgan en server/src/index.ts; 18 pruebas |
| ACT-17 | Base MySQL 8 (réplica relacional) | Líder técnico | PC local (destino: VM-APP01) | Alta | Transitorio | Roles de 04_seguridad.sql; 19 pruebas SQL |
| ACT-18 | Sistema de gestión del colegio (Angular y Laravel) | Dirección del colegio | VPS | Alta | Operativo | PR-05: 200 en web y /up (2026-10-24) |
| ACT-19 | VPS RackNerd (Ubuntu 24.04, UFW, Nginx y Certbot) | Dirección del colegio | New York (proveedor) | Crítica | Operativo | Manual del VPS; PR-01 a PR-09 |
| ACT-20 | PC local con PM2 (servicios transitorios) | Dirección de la academia | PC local (ubicación por confirmar) | Alta | Transitorio | npm run pm2:start en server/package.json |
| ACT-21 | Host hipervisor PVE01 y sus VM | Dirección de la academia | Rack de la sede | Crítica | Planificado | Diseño S1-E2; pendiente de implementación |
| ACT-22 | Firewall OPNsense con Suricata | Dirección de la academia | VM-FW01 | Alta | Planificado | Diseño S1-E1 §13; pendiente |
| ACT-23 | Red local: switch, AP y cableado | Dirección de la academia | Sede principal | Alta | Planificado | Diseño S1-E1 §8; pendiente |
| ACT-24 | Túnel IPsec sede ↔ VPS | Líder técnico | OPNsense y VPS | Alta | Planificado | Diseño S1-E1 §10; pendiente |
| ACT-25 | SIEM Wazuh | Responsable de seguridad | VM-SIEM01 | Alta | Planificado | Diseño S1-E1 §14; pendiente |
| ACT-26 | Monitoreo (Uptime Kuma y Netdata) | Encargado de TI | VM-MON01 | Media | Planificado | Diseño S1-E2 §11; pendiente |
| ACT-27 | Repositorio de respaldos (PBS) y disco externo | Responsable de respaldos | Sede y custodia externa | Crítica | Planificado | Diseño S1-E2 §11; pendiente |
| ACT-28 | Honeypot Cowrie | Responsable de seguridad | VM-HPOT01 en la DMZ | Baja | Planificado | Diseño S1-E1 §14; pendiente |
| ACT-29 | Dominio y DNS (cermatschool.edu.pe en Punto.pe) | Dirección del colegio | Punto.pe / RCP | Alta | Operativo | PR-11 y PR-12 (NS en RCP, MX de Google; sin CAA, SPF ni DMARC) |
| ACT-30 | Cuentas administrativas de proveedores (Google/Firebase, GitHub, Vercel, RackNerd y Punto.pe) | Dirección | Proveedores en la nube | Alta | Operativo (MFA no verificado) | Revisión de MFA pendiente |
| ACT-31 | Equipos de usuario (PC administrativas, laptops y dispositivos de auxiliares) | Dirección de la academia | Sede principal | Media | Operativo (por inventariar) | Antivirus activo en la PC local (cuarentena registrada en INC-03) |
| ACT-32 | Personal clave (administrador del sistema, encargado de TI y equipo técnico) | Dirección | Sede y trabajo remoto | Alta | Operativo | Matriz RACI (S2-E1 §4.2) |
| ACT-33 | Cuarto de equipos, rack y UPS | Dirección de la academia | Sede principal, Azángaro | Media | Planificado | Diseño de rack (S1-E2 §5) |

Estado del inventario: 17 activos operativos sin observaciones, 3 transitorios (PC local, API y MySQL locales), 9 planificados (infraestructura de la sede) y 4 operativos con observaciones (respaldos y registros parciales, MFA no verificado y equipos por inventariar). Las reglas de Firestore (ACT-06) y los secretos (ACT-08) dejaron de tener observaciones el 2026-10-24.

## 7. Continuidad: respaldo, restauración y recuperación

### 7.1 Respaldo implementado (MySQL)

`server/scripts/backup.js` ejecuta `mysqldump --single-transaction --quick --routines --triggers --events --no-tablespaces` con la cuenta de solo lectura `cermat_respaldo`. La contraseña viaja en `MYSQL_PWD`, no como argumento. El script genera el `.sql` junto con su `.sha256` y conserva los 7 más recientes. Se programa con `pm2 start scripts/backup.js --name cermat-backup --cron "0 2 * * *" --no-autorestart`; esa programación en la PC productiva **está por verificar**.

### 7.2 Restauración probada (ejercicios reales)

`server/scripts/restore.js` verifica el `.sha256`, restaura en `cermat_db_verificacion`, mide el RTO, compara filas, rutinas, triggers y vistas con el origen y anota cada prueba en `registro-restauraciones.jsonl`. Se niega a restaurar sobre la base productiva sin `--confirmar-produccion`.

Registro real de las dos ejecuciones del 2026-10-24, en una instancia MySQL 8.0.30 aislada con datos de prueba. Contiene solo conteos, sin datos personales; las horas están en UTC (07:23 UTC equivale a 02:23 en Perú):

```json
{"fecha":"2026-10-24T07:23:48.414Z","respaldo":"cermat_db_2026-10-24T07-23-46.sql","integridad":"sha256 verificado","destino":"cermat_db_verificacion","rto_segundos":0.38,"filas":{"alertas":0,"alumnos":1,"asistencia":3,"auditoria":1,"ciclos":1,"matriculas":3,"pagos":3,"schema_migraciones":3},"rutinas":10,"triggers":6,"vistas":3,"objetos_completos":true}
{"fecha":"2026-10-24T07:47:35.344Z","respaldo":"cermat_db_2026-10-24T07-47-34.sql","integridad":"sha256 verificado","destino":"cermat_db_verificacion","rto_segundos":0.27,"filas":{"alertas":0,"alumnos":1,"asistencia":2,"auditoria":1,"ciclos":1,"matriculas":3,"pagos":3,"schema_migraciones":3},"rutinas":9,"triggers":6,"vistas":3,"objetos_completos":true}
```

El origen cambió entre las dos ejecuciones porque se ajustaron las migraciones (de ahí la diferencia en rutinas y filas); en ambas, la base restaurada coincidió con su origen. También se verificó que la restauración rechaza un archivo alterado y que no escribe sobre la base productiva sin confirmación (REC-03 y REC-04). **Limitación:** son bases de prueba con pocas filas.

**REC-05, base real (2026-10-24, 16:35 en Perú):** después de aplicar las migraciones en `cermat_db`, `backup.js` generó el respaldo con la cuenta de solo lectura `cermat_respaldo` y `restore.js` lo restauró en `cermat_db_verificacion`. Registro de la ejecución (solo conteos):

```json
{"fecha":"2026-10-24T21:35:08.790Z","respaldo":"cermat_db_2026-10-24T21-35-08.sql","integridad":"sha256 verificado","destino":"cermat_db_verificacion","rto_segundos":0.23,"filas":{"alertas":0,"alumnos":0,"asistencia":0,"auditoria":0,"ciclos":0,"matriculas":1,"pagos":1,"schema_migraciones":3},"rutinas":9,"triggers":6,"vistas":3,"objetos_completos":true}
```

La base real tiene hoy muy pocas filas porque la réplica solo recibe eventos cuando la capa local está encendida. Por eso el RTO de 0,23 s mide sobre todo la estructura y debe volver a medirse cuando la réplica tenga volumen.

### 7.3 Recuperación de una VM (REC-07)

**Pendiente de ejecución.**

1. Desde PBS, restaurar el último respaldo de VM-APP01 con un ID nuevo.
2. Iniciarla con la red desconectada: `qm set <id> --net0 virtio,bridge=vmbr0,tag=40,link_down=1`.
3. Verificar por consola los servicios (`pm2 status` y `curl localhost:3001/health`).
4. Medir el tiempo total y eliminar la VM de prueba.

Criterio de aceptación: ≤ 2 h. Evidencia a adjuntar: registro de la tarea de PBS y captura de `/health`.

### 7.4 Recuperación de un recurso de nube (REC-06 y REC-08)

**Pendiente de ejecución.** Primero se implantan los respaldos del VPS (NC-04):

```bash
#!/usr/bin/env bash
# /usr/local/sbin/respaldo-pg.sh — usuario postgres, desde cron a las 01:30
set -euo pipefail
DEST=/var/backups/pg
ARCHIVO="cermat_produccion_$(date +%F).dump"
pg_dump -Fc -d cermat_produccion -f "$DEST/$ARCHIVO"
pg_restore --list "$DEST/$ARCHIVO" > /dev/null        # comprueba que el archivo es legible
( cd "$DEST" && sha256sum "$ARCHIVO" >> SHA256SUMS )
find "$DEST" -name 'cermat_produccion_*.dump' -mtime +7 -delete
```

```text
# /etc/cron.d/respaldo-pg
30 1 * * * postgres /usr/local/sbin/respaldo-pg.sh
```

Mientras no exista el túnel, se copia cada semana el último volcado a un medio cifrado fuera del VPS. Después, VM-BKP01 lo extrae cada día por el túnel (flujo F-10).

**REC-06 — Restauración en una base de verificación:**

```bash
sudo -u postgres createdb -O <usuario_app> cermat_verificacion
sudo -u postgres pg_restore -d cermat_verificacion --no-owner --role=<usuario_app> /var/backups/pg/<archivo>.dump
sudo -u postgres psql -d cermat_verificacion -c "SELECT count(*) FROM migrations;"   # esperado: 116
sudo -u postgres dropdb cermat_verificacion
```

**REC-08 — Reconstrucción completa del VPS:** en una VM de prueba con Ubuntu 24.04, seguir el manual de despliegue, restaurar el último volcado y validar la web y la API apuntando un archivo `hosts` local a la VM. Se registra el tiempo de cada paso. Criterio: ≤ 8 h.

### 7.5 Recuperación de la VPN ante una interrupción simulada (REC-09)

**Pendiente de ejecución.** En el VPS, `sudo swanctl --terminate --ike sede-azangaro`, o bien desconectar WAN1 en la sede. OPNsense, con acción de inicio *start* y DPD *restart*, debe restablecer el túnel solo. Se mide el tiempo con `journalctl -u strongswan -f` y con la alerta y recuperación de Uptime Kuma. Criterio: ≤ 2 min. Evidencia: extracto del registro con las horas.

### 7.6 Firestore y frontend (REC-10 y REC-11)

**Pendiente de ejecución.**

- **Firestore:** si el plan es Blaze, `gcloud firestore export gs://<bucket>/<fecha>` programado a diario y `gcloud firestore import` en un proyecto de prueba. Si es Spark, un script con `firebase-admin` que exporte las colecciones a JSON cifrado y las cargue en el emulador. En ambos casos se comparan los conteos con los indicadores agregados (8 matrículas, 2 pagos, 7 registros de asistencia y 8 perfiles). Los usuarios se respaldan con `firebase auth:export` y el archivo, que incluye hashes de contraseñas, se cifra.
- **Vercel:** promover el despliegue anterior desde el panel y medir el tiempo (criterio: ≤ 15 min).

### 7.7 Registro de pruebas de recuperación

| ID | Fecha y hora | Escenario | Componente | Procedimiento | RTO objetivo | RPO objetivo | RTO medido | Verificación | Resultado | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|---|---|
| REC-01 | 2026-10-24 02:23 (UTC−5) | Pérdida de la base relacional (restauración en base de verificación) | MySQL 8.0.30 de prueba (cermat_db con datos de prueba) | node scripts/backup.js y node scripts/restore.js | < 1 h | ≤ 24 h | 0,38 s | SHA-256 verificado. Filas: alumnos 1, ciclos 1, matrículas 3, pagos 3, asistencia 3, auditoría 1, alertas 0, schema_migraciones 3. 10 rutinas, 6 triggers y 3 vistas; objetos completos | Recuperación completa | Ejecutado | registro-restauraciones.jsonl (respaldo cermat_db_2026-10-24T07-23-46.sql) |
| REC-02 | 2026-10-24 02:47 (UTC−5) | Igual que REC-01, tras las migraciones finales | MySQL 8.0.30 de prueba | node scripts/backup.js y node scripts/restore.js | < 1 h | ≤ 24 h | 0,27 s | SHA-256 verificado. Asistencia 2 filas; 9 rutinas, 6 triggers y 3 vistas; objetos completos | Recuperación completa | Ejecutado | registro-restauraciones.jsonl (respaldo cermat_db_2026-10-24T07-47-34.sql) |
| REC-03 | 2026-10-24 | Respaldo alterado (prueba negativa) | restore.js | Modificar el .sql y ejecutar restore.js | Rechazo | — | — | Mensaje: no coincide con su .sha256 | Rechazado correctamente | Ejecutado | E2 §4.3 |
| REC-04 | 2026-10-24 | Restauración accidental sobre producción (prueba negativa) | restore.js | --destino cermat_db sin --confirmar-produccion | Rechazo | — | — | Se niega a restaurar sobre la base productiva | Rechazado correctamente | Ejecutado | E2 §4.3 |
| REC-05 | 2026-10-24 16:35 (UTC−5) | Restauración con la base real del equipo | MySQL 8.0.30 (PC local, `cermat_db`) | node scripts/backup.js (cuenta `cermat_respaldo`) y node scripts/restore.js hacia cermat_db_verificacion | < 1 h | ≤ 24 h | 0,23 s | SHA-256 verificado. Filas: matrículas 1, pagos 1, schema_migraciones 3, resto 0. 9 rutinas, 6 triggers y 3 vistas; objetos completos | Recuperación completa | Ejecutado | registro-restauraciones.jsonl (respaldo cermat_db_2026-10-24T21-35-08.sql); captura de consola por adjuntar |
| REC-06 | Pendiente | Pérdida de la base del colegio | PostgreSQL 16 (VPS) | pg_dump -Fc y sha256sum; pg_restore --list; restaurar en base de verificación; comparar conteos (116 migraciones) | 2 h | ≤ 24 h | — | — | Pendiente de ejecución | Pendiente | A adjuntar: salida de pg_restore y conteos |
| REC-07 | Pendiente | Pérdida de una VM | VM-APP01 en Proxmox | Restaurar desde PBS con un ID nuevo y red aislada; verificar /health | 2 h | ≤ 24 h | — | — | Pendiente de ejecución | Pendiente | A adjuntar: registro de la tarea de PBS |
| REC-08 | Pendiente | Pérdida total del VPS (recurso de nube) | VPS | Reconstruir en una VM de prueba con el manual y el último respaldo; validar web y API | 8 h | ≤ 24 h | — | — | Pendiente de ejecución | Pendiente | A adjuntar: bitácora con tiempos por paso |
| REC-09 | Pendiente | Interrupción simulada del túnel | IPsec OPNsense ↔ VPS | swanctl --terminate --ike sede-azangaro en el VPS, o desconectar WAN1 | ≤ 2 min automático; 1 h manual | No aplica | — | — | Pendiente de ejecución | Pendiente | A adjuntar: registro de IPsec y alerta de Uptime Kuma |
| REC-10 | Pendiente | Despliegue defectuoso del frontend | Vercel | Promover el despliegue anterior | 15 min | 0 | — | — | Pendiente de ejecución | Pendiente | A adjuntar: historial de despliegues |
| REC-11 | Pendiente | Pérdida de datos operativos | Firestore | Exportar e importar en emulador o proyecto de prueba; comparar conteos agregados | 4 h | ≤ 24 h | — | — | Pendiente de ejecución | Pendiente | A adjuntar: conteos antes y después |
| REC-12 | Pendiente | Pérdida del firewall virtual | VM-FW01 | VM nueva y restaurar config.xml; repetir PR-16 y PR-17 | 2 h | Último config.xml | — | — | Pendiente de ejecución | Pendiente | A adjuntar: captura y resultado de las pruebas |

## 8. RTO y RPO: objetivos frente a resultados

| Servicio | RTO objetivo | RTO obtenido | RPO objetivo | RPO evidenciado | Conclusión |
|---|---|---|---|---|---|
| MySQL (base de prueba) | < 1 h | 0,38 s (REC-01) y 0,27 s (REC-02) | ≤ 24 h | Respaldo bajo demanda | Cumple en la base de prueba |
| MySQL (base real) | < 1 h | 0,23 s (REC-05) | ≤ 24 h | Respaldo bajo demanda; el respaldo diario falta programarlo, así que hoy el RPO no está acotado | RTO cumple; RPO pendiente de programar |
| PostgreSQL del colegio | 2 h | Pendiente (REC-06) | ≤ 24 h | Sin respaldos implantados: hoy el RPO no está acotado | **No cumple** (NC-04) |
| VM en PBS | 2 h | Pendiente (REC-07) | ≤ 24 h | Pendiente | — |
| VPS completo | 8 h | Pendiente (REC-08) | ≤ 24 h | Pendiente | — |
| VPN | ≤ 2 min automático | Pendiente (REC-09) | No aplica | — | — |
| SPA (Vercel) | 15 min | Pendiente (REC-10) | 0 | Código en Git | — |
| Firestore | 4 h | Pendiente (REC-11) | ≤ 24 h | Sin exportación programada | **No cumple** (NC-06) |

## 9. Monitoreo y control operativo

### 9.1 Implementado

- `GET /health` de la API y de la analítica (estado de MySQL y tiempo en línea), visible en el panel admin "Infraestructura".
- Rutinas del manual del VPS:
    - **Diaria:** acceso, respaldos, disco y errores.
    - **Semanal:** actualizaciones, registros y certificados.
    - **Mensual:** restauración de prueba, capacidad y accesos.
- Tabla de diagnóstico por síntoma (502, 500, 503, 403, 413 y certificados) y lista de comandos prohibidos como reparación (`migrate:fresh`, reimportar el esquema, `key:generate`, `chmod 777`, abrir PostgreSQL).
- Panel de Vercel y consola de Firebase para el uso de los servicios PaaS.

### 9.2 Métricas y alertas planeadas (equivalente a CloudWatch)

| Métrica | Fuente | Umbral de alerta | Acción |
|---|---|---|---|
| CPU del host PVE01 | Netdata | > 85 % durante 10 min | Revisar las VM; redistribuir recursos |
| RAM del host | Netdata | > 80 % | Revisar el ARC de ZFS y las VM |
| Disco `local-zfs` | Netdata y `zpool list` | > 70 % advertencia; > 80 % crítico | Depurar o ampliar |
| Estado del espejo ZFS | `zpool status` (ZED) | DEGRADED | Reemplazar el disco en 72 h |
| Datastore de PBS | PBS | > 80 % o verificación fallida | Depuración, recolección de basura y revisión |
| RAM del VPS | Netdata y Wazuh | MemAvailable < 25 % | Riesgo R-08 |
| Disco del VPS | Netdata | > 80 % | Rotar registros y respaldos |
| Certificados | Uptime Kuma | Vencen en menos de 14 días | Revisar Certbot |
| Disponibilidad web y de API | Uptime Kuma | 2 fallas seguidas | PRO-01 |
| Túnel IPsec | Uptime Kuma | 3 minutos sin respuesta | REC-09 |
| UPS | NUT | En batería más de 5 min o carga < 30 % | Apagado ordenado |
| Eventos de seguridad | Wazuh | Nivel ≥ 10 | Notificación inmediata |

Equivalencias: Netdata cubre las métricas de host (CPU, RAM, disco y red) que daría CloudWatch Metrics; Uptime Kuma, las comprobaciones sintéticas y alarmas; Wazuh, los registros y eventos (CloudWatch Logs).

### 9.3 Línea base de capacidad del VPS

**Pendiente de ejecución.** Comandos que se ejecutan en hora pico y en hora valle para validar el presupuesto de RAM de [S1-E2 §10.5](s1-e2-diseno-centro-datos-hibrido-ce0331.md):

```bash
free -m; swapon --show; df -h /; uptime
ps -eo rss,comm --sort=-rss | head -n 12
```

| Criterio de aceptación | Resultado obtenido | Evidencia a adjuntar |
|---|---|---|
| Valores registrados en dos horarios; MemAvailable ≥ 25 % antes de agregar agentes | Pendiente de ejecución | Salida de los comandos con fecha y hora |

## 10. Control de cambios y gestión de configuración

### 10.1 Repositorio y estructura

**Ya versionado en Git:**

- `firestore.rules` con 19 pruebas.
- `.github/workflows/ci.yml` (6 trabajos).
- `server/src/db/` (migraciones numeradas, pruebas y su README).
- `server/scripts/backup.js`, `restore.js` y `db-crear-usuarios.js`.
- `.github/pull_request_template.md`.
- En el repositorio de documentación: diagramas, matrices y `scripts/generar-matrices-infra.mjs`.

**Estructura propuesta para la configuración de infraestructura**, con carpetas separadas para diagramas, hipervisor (ESXi en la guía), nube (AWS en la guía), scripts y registros:

```text
infra/
├── README.md            # orden de despliegue, reconstrucción, qué no se versiona
├── diagramas/           # .drawio
├── cd/
│   ├── proxmox/         # interfaces sanitizado, comandos qm, trabajos de PBS (≡ ESXi)
│   └── nube/            # inventario del VPS, UFW, nftables, Nginx, respaldo-pg.sh (≡ AWS)
├── red/                 # ver S2-E2
├── scripts/             # verificación y respaldo
└── logs/                # salidas de pruebas y de restauración, con fecha
```

El README debe indicar el propósito de cada carpeta, el orden de despliegue (host → OPNsense → bastión → SIEM → aplicaciones → túnel), cómo reconstruir cada componente, qué secretos existen y dónde se guardan (nunca en Git), y cómo ejecutar las pruebas PR y REC.

### 10.2 Historial de cambios relevantes

| Fecha | Cambio | Componente | Evidencia |
|---|---|---|---|
| 2026-06-22 | Publicación de las reglas de Firestore que estuvieron en producción hasta el 2026-10-24 | Firestore | Ruleset identificado por id y fecha (E4 §1.6) |
| 2026-06-22 | Respaldo de MySQL `cermat_db_2026-06-22T16-29-01.sql` | MySQL (PC local) | Carpeta `backups/` del repositorio |
| 2026-10-15 | Frontend que estuvo en producción hasta el 2026-10-24 (fecha de su cabecera Last-Modified) | Vercel | Historial de despliegues |
| 2026-10-17 | Despliegue del sistema del colegio: Nginx, TLS, UFW y PostgreSQL | VPS | Manual del propietario |
| 2026-10-24 | Migraciones MySQL 02 a 04, scripts de respaldo y restauración, CI y corrección de reglas (publicada el mismo día, ver la fila siguiente) | Repositorio de la aplicación | Commit `05fbe9e` |
| 2026-10-24 | Frontend publicado (commit `c06f5a2`) con cabeceras de seguridad, tras dos despliegues bloqueados en Vercel; reglas de Firestore publicadas; clave de servicio rotada; `www.cermatschool.edu.pe` retirado del proyecto de Vercel | Vercel, Firebase y Google Cloud | [E4 §2.7](../e4-calidad-operacion-ce024.md#27-cierre-en-produccion-2026-10-24) |
| 2026-10-24 | Reestructuración de la documentación de infraestructura, matrices y diagramas | Repositorio de documentación | Este conjunto de documentos |

### 10.3 PRO-02 · Procedimiento de gestión de cambios

1. **Solicitud:** issue o PR con la plantilla (qué cambia, por qué y cómo revertirlo).
2. **Evaluación:** impacto en los riesgos y en la SoA; los cambios en reglas, firewall, VPN o bases son "de seguridad".
3. **Respaldo previo:** `backup.js`, `pg_dump`, `config.xml` o snapshot de la VM, según el componente.
4. **Prueba** en un entorno de prueba: emulador de Firestore, `cermat_prueba`, VM clonada o laboratorio.
5. **Aprobación:** un segundo integrante; la Dirección en los cambios mayores.
6. **Ejecución** en una ventana acordada; en el VPS se sigue el procedimiento de actualización sin pérdida del manual.
7. **Verificación:** se repiten las pruebas PR o REC afectadas y se compara lo publicado con lo versionado.
8. **Cierre:** registro en el historial y actualización de la documentación y del inventario.

### 10.4 Hallazgos del control de cambios

- Un solo autor en el historial y mensajes de commit genéricos ("mejoras").
- Sin revisiones registradas en la plantilla de PR.
- El CI aún no se ejecutó en GitHub.
- Secretos en el historial: revocados el 2026-10-24; los `.env`, sin contraseñas, siguen versionados por decisión del equipo.
- Dos despliegues bloqueados en Vercel que el push no mostraba; se resolvió el 2026-10-24 y desde entonces se verifica la versión en producción tras cada cambio.

Se trataron como NC-02 y NC-03 (cerradas el 2026-10-24) y NC-08 (abierta) del SGSI.

## 11. Resultados, conclusiones, limitaciones, mejoras futuras y referencias

### 11.1 Resultados

| Indicador | Valor |
|---|---|
| Componentes del CD en el diseño | 36 (los de nube, operativos; los de la sede, pendientes) |
| Activos en el inventario final con evidencia | 33 |
| Ejercicios de recuperación ejecutados / pendientes | 5 / 7 |
| RTO medido de MySQL | 0,23 s en la base real (REC-05) y 0,27–0,38 s en la base de prueba (objetivo < 1 h) |
| Servicios con RPO actualmente no acotado | 2 (PostgreSQL del colegio y Firestore) |

### 11.2 Conclusiones

1. La nube del diseño está operativa y con evidencia: el VPS equivale a EC2 con Security Group, TLS y la base no expuesta, y la plataforma PaaS funciona con HTTPS y HSTS.
2. La recuperación está demostrada para la base relacional con verificación de integridad y RTO medido, primero en una base de prueba y después en la base real (REC-05). Es el ejercicio completo que exige la guía; falta programar el respaldo diario para acotar el RPO.
3. Las dos mayores brechas de continuidad son reales y prioritarias: el colegio y Firestore no tienen respaldo implantado, así que su RPO no está acotado.
4. El entorno on-premise tiene un procedimiento reproducible (red, VM, PBS y migración), listo para ejecutarse en cuanto exista el hardware.

### 11.3 Limitaciones

- Sin el hardware de la sede no hay evidencia de hipervisor, VM ni VPN.
- La base real tiene hoy muy pocas filas, así que su RTO (0,23 s) debe volver a medirse cuando la réplica tenga volumen.
- Parte de la evidencia del VPS proviene del manual del propietario y faltan las capturas.

### 11.4 Mejoras futuras

- Laboratorio de validación con Proxmox (fase 1b).
- Segundo host y clúster cuando la operación lo justifique.
- Respaldo inmutable fuera del sitio.
- Pruebas de restauración automatizadas, con su resultado publicado en Uptime Kuma.

### 11.5 Referencias

[1] Proxmox Server Solutions GmbH, "Proxmox VE Administration Guide." [En línea]. Disponible en: https://pve.proxmox.com/pve-docs/

[2] Proxmox Server Solutions GmbH, "Proxmox Backup Server Documentation." [En línea]. Disponible en: https://pbs.proxmox.com/docs/

[3] PostgreSQL Global Development Group, "pg_dump" y "pg_restore," *PostgreSQL 16 Documentation*. [En línea]. Disponible en: https://www.postgresql.org/docs/16/

[4] Oracle Corporation, "mysqldump — A Database Backup Program," *MySQL 8.0 Reference Manual*. [En línea]. Disponible en: https://dev.mysql.com/doc/refman/8.0/en/

[5] M. Swanson, P. Bowen, A. W. Phillips, D. Gallup y D. Lynes, "Contingency Planning Guide for Federal Information Systems," NIST SP 800-34 Rev. 1, may. 2010.

[6] Amazon Web Services, "Amazon VPC User Guide" y "Amazon EC2 User Guide." [En línea]. Disponible en: https://docs.aws.amazon.com/

[7] Netdata Inc., "Netdata Documentation." [En línea]. Disponible en: https://learn.netdata.cloud/

[8] Uptime Kuma, "Uptime Kuma." [En línea]. Disponible en: https://github.com/louislam/uptime-kuma

[9] Google, "Export and import data — Cloud Firestore." [En línea]. Disponible en: https://firebase.google.com/docs/firestore/manage-data/export-import

[10] ISO/IEC 27001:2022, *Information security, cybersecurity and privacy protection — Information security management systems — Requirements*. Ginebra, Suiza: ISO, 2022.

## Anexos

| Anexo | Contenido | Ubicación |
|---|---|---|
| A | Registro de pruebas de recuperación | [s2-e3-registro-prueba-recuperacion.xlsx](../assets/infraestructura/s2-e3-registro-prueba-recuperacion.xlsx) |
| B | Inventario final de activos con evidencia | [s2-e3-inventario-final-activos.xlsx](../assets/infraestructura/s2-e3-inventario-final-activos.xlsx) |
| C | Diagrama del centro de datos (rack, hipervisor y nube) | [arquitectura-centro-datos-hibrido.drawio](../assets/infraestructura/diagramas/arquitectura-centro-datos-hibrido.drawio) |
| D | Scripts de respaldo y restauración | `server/scripts/backup.js` y `server/scripts/restore.js` del repositorio de la aplicación |
| E | Base de datos: migraciones, roles y pruebas | `server/src/db/` y [E2 de Ingeniería de Software](../e2-base-datos-ce022.md) |

## Rúbrica de evaluación

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

**Dónde se evidencia cada criterio**

| Criterio | Secciones |
|---|---|
| 1 | 2 |
| 2 | 3 (Proxmox VE como equivalente de ESXi) |
| 3 | 4 (VPS y PaaS como equivalentes de AWS) |
| 4 | 5 |
| 5 | 6 |
| 6 | 7 y 8 |
| 7 | 9 |
| 8 | 10, anexos y exposición ante el jurado (pendiente) |
