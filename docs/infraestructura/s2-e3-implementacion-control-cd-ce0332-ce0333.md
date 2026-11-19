# S2-E3 · Implementación, Gestión y Control de Centro de Datos (CE0332–CE0333)

!!! abstract "CE0332 y CE0333 — Implementación, control y operación del centro de datos"
    Despliegue y operación del [centro de datos híbrido diseñado en el Semestre 1](s1-e2-diseno-centro-datos-hibrido-ce0331.md): entorno on-premise (Proxmox VE, equivalente a ESXi), nube (VPS equivalente a EC2 y servicios PaaS), identidades, inventario final, respaldo y recuperación, RTO/RPO, monitoreo y control de cambios. Lo **implementado** (VPS, PaaS y respaldo y restauración de MySQL) se distingue de lo **validado en un entorno virtual** el 2026-11-17, rotulado como SIMULACIÓN (reconstrucción del VPS, túnel y firewall: REC-08, REC-09 y REC-12), y de lo **pendiente de ejecución** (host, VM, VPN en la sede y respaldos del sistema del colegio y de Firestore).

## Portada

| Campo | Detalle |
|---|---|
| Título | Implementación, gestión y control del centro de datos híbrido de CERMAT |
| Entregable | Semestre 2 · Entregable 3 · CE0332 y CE0333 |
| Estudiantes | David Robert Yucra Mamani (líder), Gladys Rosaura Yana Pari, Denilson Leeke Mamani Flores, Cárdenas Vilca Rennzo |
| Semestre | 2026-2 (9° ciclo), UPeU campus Juliaca, sección g1 |
| Fecha | 2026-11-18 |
| Versión | 2.1 |

**Control de versiones**

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-07-06 | Servicios del servidor local, RAID, SLA y procedimientos (estructura anterior de la guía) |
| 2.0 | 2026-10-24 | Reescrito según la guía vigente: VPS como EC2 equivalente, procedimientos de Proxmox, identidades, inventario final con evidencia, registro de recuperación real, RTO/RPO medido y control de cambios |
| 2.1 | 2026-11-18 | Réplica reparable (§7.9, 2026-11-14); repositorio `infra/` (2026-11-16); procedimiento de validación del hipervisor en Hyper-V (§3.3); REC-08, REC-09 y REC-12 en SIMULACIÓN (2026-11-17); publicaciones del 2026-11-16 y del 2026-11-18 en el historial de cambios; informe también en DOCX y PDF |

**Productos obligatorios**

| Producto | Formato entregado | Ubicación | Criterio de aceptación (guía) | Estado |
|---|---|---|---|---|
| Informe de implementación, gestión y control de centro de datos | Página versionada; [DOCX](../assets/infraestructura/informes/S2_E3_Implementacion_Gestion_y_Control_de_Centro_de_Datos.docx) y [PDF](../assets/infraestructura/informes/S2_E3_Implementacion_Gestion_y_Control_de_Centro_de_Datos.pdf) generados desde ella | Este documento | Completo, versionado y coherente con el diseño de S1 | Entregado |
| Evidencias técnicas de configuración | Configuraciones sanitizadas y salidas de comandos | Secciones 3, 4, 5 y 7 | Incluye nube (VPC/EC2/SG/NACL/IAM equivalentes) e hipervisor (vSwitch/VLAN/VM equivalentes) | Parcial: nube con evidencia; hipervisor con procedimiento para la sede y script de validación en Hyper-V (`infra/cd/hyperv/`), todavía sin ejecutar |
| Registro de prueba de recuperación | XLSX y sección 7.7 | [s2-e3-registro-prueba-recuperacion.xlsx](../assets/infraestructura/s2-e3-registro-prueba-recuperacion.xlsx) | Al menos un ejercicio de recuperación completo, documentado | **Cumplido**: 10 ejercicios ejecutados (REC-01 a REC-05, REC-08, REC-09 y REC-12 a REC-14; REC-08, REC-09 y REC-12 en SIMULACIÓN); 4 pendientes (REC-06, REC-07, REC-10 y REC-11) |
| Repositorio técnico de centro de datos | Git | Sección 10 | Scripts, configuraciones sanitizadas, README y control de versiones sin secretos | Parcial: `infra/` (desde el 2026-11-16) con README, Nginx y cabeceras del VPS, Uptime Kuma, la red simulada, la detección, REC-08, el script de Hyper-V, scripts de prueba y evidencias fechadas, más el respaldo de Firestore verificado en el emulador; faltan las configuraciones reales de la sede (Proxmox, OPNsense y switch). Secretos del historial revocados el 2026-10-24 (NC-03 cerrada) |

## 1. Resumen ejecutivo de la implementación del centro de datos

| Componente del diseño | Estado | Evidencia |
|---|---|---|
| Nube IaaS: VPS (equivalente a EC2) con UFW (equivalente a Security Group), Nginx, TLS y PostgreSQL local | **Implementado** | Manual del propietario (2026-10-17); verificaciones PR-01 a PR-09 |
| Nube PaaS: Vercel y Firebase | **Implementado** | PR-13; 27 colecciones con reglas (22 al 2026-10-24); frontend y reglas publicados y verificados el 2026-10-24; frontend del 2026-11-16 en producción |
| Capa relacional de la academia en el VPS: API, MySQL y analítica con PM2 y systemd, publicadas por Nginx con HTTPS | **Implementado y verificado** | Manual de despliegue §9; PR-38 y PR-39; prueba de punta a punta del 2026-10-24 con respuesta 200 |
| Respaldo y restauración de MySQL con SHA-256 y RTO medido | **Implementado y probado** | REC-01 a REC-04 en una base de prueba (RTO de 0,27–0,38 s), REC-05 en la base real (0,23 s) y REC-13 y REC-14 en otro servidor (0,33 s y 0,41 s); respaldo diario en el VPS desde el 2026-10-24 |
| Identidades de mínimo privilegio en las bases | **Implementado** | 4 roles MySQL (error 1142 ante DML directo); usuario PostgreSQL sin superusuario |
| Host Proxmox, bridges con VLAN, bond y VM | Pendiente de ejecución | Procedimiento en la sección 3 |
| Red interna del VPS, strongSwan y NACL | Pendiente en el VPS real; la red interna y strongSwan, validados en el entorno virtual (2026-11-17) | Sección 4.4; S2-E2 §3 y §8 (PR-24 a PR-28 y REC-09) |
| Respaldo del sistema del colegio en el VPS y de Firestore | Pendiente de ejecución | Sección 7 (no conformidades NC-04 y NC-06) |
| Monitoreo de capacidad y alertas | Parcial | `/health` y rutinas del manual; Netdata y Uptime Kuma pendientes |

Desde el 2026-10-24 la capa relacional de la academia corre en el VPS: usuario `academia`, servicios solo en 127.0.0.1 y publicados por Nginx con HTTPS. La PC local (CD-36) quedó retirada. Es un desvío consciente del diseño, que la ubicaba en VM-APP01 y la excluía del VPS por la memoria (R-08). La medición dejó 1,3 GiB disponibles con todo en marcha (sección 9.3). El cumplimiento del diseño es completo en la nube y queda pendiente en la sede, por falta del hardware.

## 2. Trazabilidad con el diseño del centro de datos

| Elementos de S1-E2 | Implementación | Cambio o justificación |
|---|---|---|
| CD-01 a CD-22 (rack, UPS, host, Proxmox, bridges, VM, almacenamiento y enlaces) | Pendiente | Sujeto a la adquisición del hardware; el conmutador, las VLAN, las VM y su recuperación se validarán en Hyper-V (fase 1b, sección 3.3: script listo, todavía sin ejecutar) |
| CD-23 a CD-27 (VPS, Ubuntu con UFW, Nginx con Certbot, sistema del colegio y PostgreSQL) | Implementado | Desde el 2026-10-24 el VPS aloja también la capa relacional de la academia (desvío del diseño, sección 3.1) |
| CD-28 (strongSwan y `dum0`) | Pendiente en el VPS real | Requiere OPNsense en la sede; validado en el entorno virtual el 2026-11-17 (S2-E2 §3) |
| CD-29 a CD-32 (Vercel y Firebase) | Implementado | Reglas de Firestore corregidas publicadas y frontend con cabeceras de seguridad, verificados el 2026-10-24 (NC-01 cerrada) |
| CD-33 (GitHub y CI) | Implementado | El CI corre en GitHub con cada push (ejecuciones #22 y #25 en verde, E4 de Software §2.3); Vercel todavía publica sin esperar al CI (sección 10.4) |
| CD-34 (DNS) | Implementado | Se agregan CAA, SPF y DMARC (PR-12) |
| CD-35 (túnel) | Pendiente en la sede | Requiere OPNsense; validado en el entorno virtual el 2026-11-17 (PR-24 a PR-28 y REC-09) |
| CD-36 (PC local) | Retirada (2026-10-24) | La capa pasó al VPS; la PC queda para pruebas de restauración |
| VMware ESXi | Proxmox VE | Equivalencia técnica; sin costo de licencia |
| AWS (VPC, EC2, SG, NACL, IAM) | VPS, PaaS y controles equivalentes | Infraestructura ya contratada; sin cuenta de AWS |

## 3. Implementación del entorno on-premise

### 3.1 Estado actual (operativo en el VPS)

Desde el 2026-10-24, la API Node.js (`academia-api`, puerto 3001), la analítica FastAPI (`academia-analitica`, puerto 8000) y MySQL 8.0.46 corren en el VPS del colegio, bajo el usuario `academia` y en `/opt/academia`:

- PM2 los mantiene en línea y el servicio `pm2-academia` de systemd los arranca si el VPS se reinicia.
- Los tres escuchan solo en 127.0.0.1. Nginx publica la API y la analítica por HTTPS en `api-academia.cermatschool.edu.pe` y `analitica-academia.cermatschool.edu.pe`.
- MySQL usa un perfil de bajo consumo: buffer de 128 MB, `performance_schema` desactivado y 40 conexiones.
- El respaldo usa `server/scripts/backup.js` con un temporizador diario y la restauración `server/scripts/restore.js` (sección 7).
- Las capturas 13 a 18 de las [Evidencias del despliegue del 2026-10-24](evidencias-despliegue-2026-10-24.md) muestran la API por HTTPS y el panel de administración apuntando al VPS.

Antes corrían en una PC local con PM2 (CD-36), que quedó retirada. En la sede todavía no hay hipervisor, firewall perimetral ni segmentación.

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

### 3.3 Entorno de validación del hipervisor (fase 1b)

Mientras no exista el host de la sede, el hipervisor se valida en Hyper-V, que viene con Windows 10 Pro, en la PC del equipo. Como ESXi, Hyper-V es un hipervisor de tipo 1, y la guía de la línea de Infraestructura admite un entorno virtual ([S2-E2, sección 8](s2-e2-implementacion-red-ce0312-ce0313.md)). La evidencia lleva la palabra **SIMULACIÓN**. El procedimiento de Proxmox de la sección 3.2 sigue siendo el de la sede.

**Estado: script listo, todavía sin ejecutar.** `infra/cd/hyperv/entorno-hyperv.ps1` crea el conmutador, las VLAN y las VM, y deja la evidencia en `infra/logs/`; antes hay que activar Hyper-V en la PC. Hasta entonces no hay evidencia del hipervisor y REC-07 sigue pendiente.

| ESXi (guía) | Proxmox (diseño de la sede) | Hyper-V (validación) | Evidencia |
|---|---|---|---|
| vSwitch | Bridge `vmbr0` con VLAN | Conmutador virtual interno | `Get-VMSwitch` |
| Port group con VLAN | Etiqueta de VLAN en la NIC de la VM | VLAN de acceso en la NIC de cada VM | `Get-VMNetworkAdapterVlan`; ping dentro de la misma VLAN sí, entre VLAN distintas no |
| Máquina virtual | VM | 3 VM mínimas (Alpine Linux): SIM-SRV y SIM-SRV2 en la VLAN 40 y SIM-ADMIN en la VLAN 10 | `Get-VM` |
| Snapshot y respaldo de la VM | Snapshot y Proxmox Backup Server | Punto de control, exportación e importación | REC-07 |
| Métricas del host | Métricas de Proxmox | Medición de recursos por VM y contadores del host | `Measure-VM` y `Get-Counter` |

Pruebas de recuperación en el entorno de validación:

- **REC-07:** exportar la VM, borrarla, importarla como copia nueva y comprobar su servicio.
- **REC-08:** se hizo en contenedores, que equivalen a un servidor nuevo (sección 7.4): conforme el 2026-11-17, con un RTO de 1 min 30 s.
- **REC-09 y REC-12:** en la red virtual de Docker ([S2-E2, sección 8](s2-e2-implementacion-red-ce0312-ce0313.md)), conformes el 2026-11-17: el túnel se rearmó solo en 2 s y la configuración del firewall se restauró en 1 s.

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
| VPC: subred privada | `dum0` 10.20.0.0/24 | S2-E2 §3, paso 1 | Pendiente en el VPS real; validada en el entorno virtual (SIM-NUBE, S2-E2 §8) |
| Route tables | Tabla `main` y tabla 220 de strongSwan | `ip route show table 220` | Pendiente |
| NAT Gateway | No requerido | — | No aplica |
| IAM | Usuarios Linux, roles de bases, claims de Firebase y cuentas de servicio | Sección 5 | Parcial |

### 4.3 Servicios PaaS: implementados

| Servicio | Estado | Evidencia |
|---|---|---|
| Vercel (SPA) | En producción; último despliegue el 2026-10-15; redirección 308 a HTTPS y HSTS con preload | PR-13; panel de Vercel |
| Firebase Authentication | En producción; administradores por claim; invitaciones de un solo uso para el personal; cuentas de alumnos creadas por la API del VPS (desde el 2026-11-15) | `firestore.rules`; `server/src/routes/cuentas.ts`; 8 perfiles al 2026-10-24 |
| Cloud Firestore | 27 colecciones con reglas por rol; versión corregida probada 19/19 y publicada el 2026-10-24; 103 pruebas de reglas al 2026-11-18, día de la última publicación | `tests/firestore-rules/reglas.test.ts`; verificación sin sesión en producción ([E4 §2.7](../e4-calidad-operacion-ce024.md#27-cierre-en-produccion-2026-10-24) y [E4 §1.6](../e4-calidad-operacion-ce024.md#16-las-pruebas-detectan-defectos-reales)) |
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
4. **Proxy de la API hacia VM-APP01 por el túnel** (cuando la capa de la academia pase a la sede). Hoy `api-academia` ya se publica con HTTPS y apunta a 127.0.0.1:3001 del propio VPS (`infra/cd/nube/nginx/academia-api.conf`, PR-38); el bloque siguiente es el cambio para la fase 2, y la analítica sigue el mismo patrón hacia el puerto 8000:

    ```nginx
    limit_req_zone $binary_remote_addr zone=api_academia:10m rate=10r/s;
    server {
        listen 443 ssl;
        server_name api-academia.cermatschool.edu.pe;   # ya publicado con Certbot (PR-38)
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

    La API ya acepta `trust proxy` con la variable `TRUST_PROXY` (`server/src/index.ts`), que en el VPS vale `loopback` (manual de despliegue §9); con el proxy por el túnel se cambia a 10.20.0.1 para registrar la IP real del cliente.
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
| Google Cloud | Cuenta de servicio del CI con rol mínimo (*Firebase Rules Admin*), en el entorno protegido `produccion` | Definido en el CI, pero sin el secreto: la ejecución #25 omitió la publicación de reglas, que se publican desde la consola (2026-11-18) | `.github/workflows/ci.yml` |
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

| ID | Activo | Propietario | Ubicación | Criticidad | Estado al 2026-11-16 | Evidencia |
|---|---|---|---|---|---|---|
| ACT-01 | Datos personales de alumnos y apoderados (users, enrollments, students, fichasMatricula, documentosAlumnos; réplica alumnos) | Dirección de la academia | Firestore (Google) y réplica MySQL | Alta | Operativo | Reglas por rol en firestore.rules; documento del alumno solo para el administrador; 8 perfiles y 8 matrículas al 2026-10-24 y 10 matrículas al 2026-11-14 (conteos agregados) |
| ACT-02 | Datos de pagos (payments; tabla pagos) | Dirección de la academia | Firestore y MySQL | Alta | Operativo | 2 pagos confirmados (conteo agregado); triggers de auditoría en MySQL |
| ACT-03 | Registros de asistencia (attendanceLogs, attendanceDayState, parentAttendance; tabla asistencia) | Dirección de la academia | Firestore y MySQL | Alta | Operativo | 7 registros (conteo agregado); sp_registrar_asistencia idempotente |
| ACT-04 | Contenido público (ciclos, sedes, posts, recursos y talleres) | Dirección de la academia | Firestore y Storage | Media | Operativo | Sitio público en Vercel (200 OK, 2026-10-24) |
| ACT-05 | Configuración de servicios (config/services) | Líder técnico | Firestore | Alta | Operativo | src/lib/syncService.ts lee config/services |
| ACT-06 | Reglas de seguridad de Firestore | Líder técnico | Repositorio Git y Firebase | Alta | Operativo (última publicación 2026-11-18) | firestore.rules y 103 pruebas (19 al 2026-10-24); versión corregida publicada el 2026-10-24 (reemplazó la del 22-jun-2026); última publicación el 2026-11-18, desde la consola |
| ACT-07 | Código fuente, pruebas y pipeline CI | Líder técnico | GitHub (repositorio privado) | Alta | Operativo | .github/workflows/ci.yml (6 trabajos, ejecuciones #22 y #25 en verde); 378 pruebas (99 al 2026-10-24) |
| ACT-08 | Secretos y credenciales (cuenta de servicio, contraseñas de BD, llaves SSH, credenciales de VPN) | Líder técnico | Gestor de contraseñas y servidores | Alta | Operativo (clave rotada 2026-10-24) | db-crear-usuarios.js lee contraseñas del entorno; clave de servicio rotada (H-03 corregido) |
| ACT-09 | Respaldos (MySQL, PostgreSQL, Firestore y VM) | Responsable de respaldos | VPS (respaldo diario de MySQL), PC (copia semanal), PBS y disco externo | Crítica | Parcial (solo MySQL) | Temporizador `academia-respaldo` (diario, 03:00); REC-01, REC-02, REC-05, REC-13 y REC-14 |
| ACT-10 | Datos del sistema del colegio (PostgreSQL cermat_produccion) | Dirección del colegio | VPS (New York) | Crítica | Operativo | Manual del VPS (2026-10-17): 116 migraciones, base solo en loopback |
| ACT-11 | Registros de eventos (API, Nginx, autenticación, firewall, IDS y SIEM) | Responsable de seguridad | VPS y VM-SIEM01 | Alta | Parcial (sin centralizar) | morgan en server/src/index.ts, con sus registros en PM2 del VPS; registros de Nginx en el VPS |
| ACT-12 | Documentación técnica y del SGSI | Líder técnico | Repositorio público de documentación | Baja | Operativo | Este sitio de documentación |
| ACT-13 | Plataforma web de la academia (SPA en Vercel) | Dirección de la academia | Vercel | Alta | Operativo | PR-13: HTTPS y HSTS con preload (2026-10-24) |
| ACT-14 | Firebase Authentication (cuentas y claims) | Dirección de la academia | Google Cloud | Crítica | Operativo | Claim de administrador; invitaciones de un solo uso para el personal; cuentas de alumnos creadas por la API con contraseña inicial (R-30) |
| ACT-15 | Cloud Firestore y Storage | Dirección de la academia | Google Cloud | Crítica | Operativo | 27 colecciones con reglas por rol (22 al 2026-10-24) |
| ACT-16 | API de sincronización y servicio de analítica | Líder técnico | VPS del colegio, usuario `academia` (destino de diseño: VM-APP01) | Alta | Operativo (VPS desde 2026-10-24) | helmet, CORS y morgan en server/src/index.ts; 27 pruebas; HTTPS en `api-academia` y `analitica-academia`; prueba de punta a punta del 2026-10-24 |
| ACT-17 | Base MySQL 8 (réplica relacional) | Líder técnico | VPS del colegio (destino de diseño: VM-APP01) | Alta | Operativo (VPS desde 2026-10-24) | Roles de 04_seguridad.sql; 25 pruebas SQL; migraciones 05 y 06; respaldo diario; comparación y reparación nocturna desde el 2026-11-14 |
| ACT-18 | Sistema de gestión del colegio (Angular y Laravel) | Dirección del colegio | VPS | Alta | Operativo | PR-05: 200 en web y /up (2026-10-24) |
| ACT-19 | VPS RackNerd (Ubuntu 24.04, UFW, Nginx y Certbot) | Dirección del colegio | New York (proveedor) | Crítica | Operativo | Manual del VPS; PR-01 a PR-09; desde el 2026-10-24 aloja también la capa de la academia (usuario `academia`) |
| ACT-20 | PC local con PM2 (servicios anteriores de la capa) | Dirección de la academia | PC local (ubicación por confirmar) | Alta | Retirado (2026-10-24) | `pm2 stop` y `pm2 save` el 2026-10-24; Laragon queda para pruebas de restauración (REC-14) |
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

Estado del inventario: 19 activos operativos sin observaciones, 1 retirado (la PC local, el 2026-10-24), 9 planificados (infraestructura de la sede) y 4 operativos con observaciones (respaldos y registros parciales, MFA no verificado y equipos por inventariar). Las reglas de Firestore (ACT-06) y los secretos (ACT-08) dejaron de tener observaciones el 2026-10-24, y la API y MySQL (ACT-16 y ACT-17) pasaron de la PC al VPS ese mismo día.

## 7. Continuidad: respaldo, restauración y recuperación

### 7.1 Respaldo implementado (MySQL)

`server/scripts/backup.js` ejecuta `mysqldump --single-transaction --quick --routines --triggers --events --no-tablespaces` con la cuenta de solo lectura `cermat_respaldo`. La contraseña viaja en `MYSQL_PWD`, no como argumento. El script genera el `.sql` junto con su `.sha256` y conserva los 7 más recientes. Desde el 2026-10-24 se ejecuta a diario a las 03:00 de Perú con un temporizador de systemd en el VPS (`academia-respaldo.timer`). El temporizador reemplaza a la programación con PM2 que se proponía antes:

- Con `Persistent=true`, una ejecución perdida porque el VPS estaba apagado se hace al encender.
- Corre como `academia`, con prioridad baja, y deja los archivos con permiso 640.
- La primera ejecución, a las 22:18, generó `cermat_db_2026-10-25T03-18-26.sql` (el nombre va en hora UTC) en 0,2 s.

Una vez por semana los respaldos se copian a la PC con `scp` y se verifican con una restauración (REC-14). Esa es la copia fuera del VPS.

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

La base real tenía muy pocas filas: la réplica solo recibía los cambios nuevos, y los datos anteriores se cargaron recién a las 22:56 ([§7.8](#78-carga-inicial-de-la-replica-relacional-2026-10-24)). Aun con ellos el volumen es bajo (10 matrículas), así que el RTO mide sobre todo la estructura y debe volver a medirse cuando la réplica tenga volumen.

**REC-13, de la PC al VPS (2026-10-24).** El mismo respaldo de REC-05 (`cermat_db_2026-10-24T21-35-08.sql`) se copió al VPS y se verificó su huella. Se restauró en MySQL 8.0.46 en **0,33 s** (330 ms), con 8 tablas, 9 funciones y procedimientos, 6 triggers, 3 vistas y el pago. Fue la primera recuperación en otro servidor.

**Lo que esa prueba no detectó.** La base del VPS se creó con `utf8mb4_unicode_ci`. Las tablas del respaldo traen `utf8mb4_0900_ai_ci`, y las rutinas toman la collation de la base donde se crean. Contar objetos no lo mostró: la asistencia por QR, las funciones de saldo y `sp_estado_cuenta` fallaban con `Illegal mix of collations`. El defecto se corrigió el 2026-10-24 a las 22:06 ([E4 §2.8](../e4-calidad-operacion-ce024.md#28-analisis-del-incidente-sincronizacion-con-el-vps-inc-06)). Desde entonces `restore.js` crea la base con la collation de las tablas del respaldo y verifica que coincida con la de las rutinas (`collation_coherente` en el registro). La primera ejecución con esa verificación, en la PC a las 21:06, dio un RTO de 0,3 s con la collation coherente.

**REC-14, del VPS a la PC (2026-10-24, 22:22).** El primer respaldo del temporizador diario se copió a la PC con `scp`, junto con los otros 3 respaldos del VPS, y las 4 huellas coincidieron. `restore.js --archivo` lo restauró en `cermat_db_verificacion`:

```json
{"fecha":"2026-10-25T03:22:03.597Z","respaldo":"cermat_db_2026-10-25T03-18-26.sql","integridad":"sha256 verificado","destino":"cermat_db_verificacion","rto_segundos":0.41,"filas":{"alertas":0,"alumnos":0,"asistencia":0,"auditoria":2,"ciclos":1,"matriculas":2,"pagos":1,"schema_migraciones":4},"rutinas":9,"triggers":6,"vistas":3,"objetos_completos":true,"collation":"utf8mb4_0900_ai_ci","collation_coherente":true}
```

Además de contar objetos, en la copia restaurada se ejecutaron las funciones y `sp_estado_cuenta`, y no dieron errores. La copia funciona; no solo existe.

### 7.3 Recuperación de una VM (REC-07)

**Pendiente de ejecución.**

1. Desde PBS, restaurar el último respaldo de VM-APP01 con un ID nuevo.
2. Iniciarla con la red desconectada: `qm set <id> --net0 virtio,bridge=vmbr0,tag=40,link_down=1`.
3. Verificar por consola los servicios (`pm2 status` y `curl localhost:3001/health`).
4. Medir el tiempo total y eliminar la VM de prueba.

Criterio de aceptación: ≤ 2 h. Evidencia a adjuntar: registro de la tarea de PBS y captura de `/health`.

### 7.4 Recuperación de un recurso de nube (REC-06 y REC-08)

**REC-08: ejecutada el 2026-11-17 en el entorno de validación.** La capa de la academia (MySQL 8.0, API y analítica) se reconstruyó desde cero en contenedores de la PC del equipo, que hacen de servidor nuevo, con `infra/cd/rec08/rec08.sh`: huella del respaldo verificada, restauración en 708 ms, roles y cuentas con contraseñas de un solo uso, compilación desde el código y `/health` con MySQL conectado. **RTO de 1 min 30 s** frente a un objetivo de 8 h. **Hallazgo:** el respaldo más nuevo fuera del VPS tenía 567 horas (23 días) y no traía `sp_eliminar_asistencia`, agregado después; la copia semanal fuera del VPS no se hacía (NC-10 del SGSI). Evidencia: `infra/logs/2026-11-17/rec-08-simulacion.txt`.

**REC-06: pendiente de ejecución.** Primero se implantan los respaldos del PostgreSQL del colegio (NC-04):

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

**Ejecutada el 2026-11-17 en el entorno virtual.** En SIM-R1 se cortó el túnel con `swanctl --terminate --ike sede-nube` y el primer tráfico del bastión lo rearmó solo (acción *trap*) en **2 s**, frente al criterio de 2 min. Evidencia: `infra/logs/2026-11-17/rec-09-simulacion.txt`. En la sede (fase 2) se repite con OPNsense: en el VPS, `sudo swanctl --terminate --ike sede-azangaro`, o desconectar WAN1, midiendo con `journalctl -u strongswan -f` y con Uptime Kuma.

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
| REC-08 | 2026-11-17 13:48 (UTC−5) | Pérdida total del VPS (recurso de nube) | Capa de la academia reconstruida en contenedores de prueba (MySQL 8.0, Node 22 y Python 3.12): SIMULACIÓN de un servidor nuevo | infra/cd/rec08/rec08.sh: respaldo con huella verificada, restauración, 04_seguridad.sql, cuentas de un solo uso, compilación y arranque (manual §9.3 y §9.4) | 8 h | ≤ 24 h | 1 min 30 s | API y analítica con /health y MySQL conectado; 8 tablas, 9 rutinas, 6 triggers y 3 vistas; rutinas en utf8mb4_0900_ai_ci | Recuperación completa. Hallazgo: el respaldo más nuevo fuera del VPS tenía 567 h (RPO real muy por encima de 24 h) y no traía sp_eliminar_asistencia | Ejecutado | infra/logs/2026-11-17/rec-08-simulacion.txt |
| REC-09 | 2026-11-17 23:05 (UTC−5) | Interrupción simulada del túnel | IPsec SIM-R1 ↔ SIM-NUBE (strongSwan; equivale a OPNsense ↔ VPS) | swanctl --terminate --ike sede-nube; el primer tráfico del bastión rearma el túnel (start_action = trap) | ≤ 2 min automático; 1 h manual | No aplica | 2 s | IKE_SA nuevo ESTABLISHED y acceso del bastión al VPS por el túnel | Reconexión automática. SIMULACIÓN | Ejecutado | infra/logs/2026-11-17/rec-09-simulacion.txt |
| REC-10 | Pendiente | Despliegue defectuoso del frontend | Vercel | Promover el despliegue anterior | 15 min | 0 | — | — | Pendiente de ejecución | Pendiente | A adjuntar: historial de despliegues |
| REC-11 | Pendiente | Pérdida de datos operativos | Firestore | server/src/scripts/respaldoFirestore.ts exporta; restaurarFirestore.ts restaura en el emulador y compara conteos y huella del contenido | 4 h | ≤ 24 h | — | — | Pendiente de ejecución | Pendiente | Procedimiento verificado en el emulador con datos ficticios (2026-11-16: 237 documentos, huella idéntica, 0,63 s); falta correrlo con el respaldo real |
| REC-12 | 2026-11-17 23:05 (UTC−5) | Pérdida del firewall virtual | SIM-R1 con nftables (equivale a VM-FW01) | Respaldo con nft list ruleset; borrado total con nft flush ruleset; restauración con nft -f; repetir PR-16 y PR-17 | 2 h | Último respaldo | 1 s | Con el firewall vacío la DMZ llegaba a la base de datos; tras restaurar, PR-16 y PR-17 vuelven a bloquear | Recuperación completa. SIMULACIÓN | Ejecutado | infra/logs/2026-11-17/rec-12-simulacion.txt y rec-12-firewall-respaldo.nft |
| REC-13 | 2026-10-24 | Recuperación en otro servidor: respaldo de la PC restaurado en el VPS | MySQL 8.0.46 (VPS, `cermat_db`) | sha256sum -c del respaldo cermat_db_2026-10-24T21-35-08.sql y restauración con mysql (manual de despliegue §9.3) | < 1 h | ≤ 24 h | 0,33 s | Huella SHA-256 correcta. 8 tablas, 9 funciones y procedimientos, 6 triggers, 3 vistas y 1 pago. Hallazgo posterior: la base se creó con utf8mb4_unicode_ci y las rutinas quedaron con otra collation que las tablas (corregido el 2026-10-24 a las 22:06) | Recuperación completa; defecto de collation detectado después | Ejecutado | Manual de despliegue §9.3 y §9.6 |
| REC-14 | 2026-10-24 22:22 (UTC−5) | Recuperación en otro servidor: respaldo diario del VPS restaurado en la PC | MySQL 8.0.30 (PC, `cermat_db_verificacion`) | Copia con scp de los 4 respaldos y sha256sum -c; node scripts/restore.js --archivo con el más reciente | < 1 h | ≤ 24 h | 0,41 s | SHA-256 verificado. Filas: matrículas 2, pagos 1, ciclos 1, auditoría 2, schema_migraciones 4, resto 0. 9 rutinas, 6 triggers y 3 vistas; collation coherente (utf8mb4_0900_ai_ci); funciones y sp_estado_cuenta sin errores | Recuperación completa | Ejecutado | registro-restauraciones.jsonl (respaldo cermat_db_2026-10-25T03-18-26.sql) |

### 7.8 Carga inicial de la réplica relacional (2026-10-24)

La sincronización solo envía las altas y los cambios nuevos, así que la réplica no tenía lo que Firestore ya guardaba (R-28). A las 22:56, `server/src/scripts/cargaInicial.ts` lo copió una sola vez al MySQL del VPS:

- Usa las mismas validaciones que `/api/sync` (`server/src/sync/esquemas.ts`) y los mismos procedimientos, con la cuenta de la API. En la auditoría queda como `carga-inicial`.
- Va en orden (matrículas, pagos y asistencias) para que ningún pago cree una matrícula provisional.
- Calcula la hora de cada marcación en hora de Perú, aunque el VPS esté en UTC.
- Su salida solo muestra conteos y el inicio de cada ID, sin datos personales.
- El mismo bloque hizo antes un respaldo con el servicio de [§7.1](#71-respaldo-implementado-mysql). Si hubiera fallado, la carga no se habría ejecutado.

| Paso | Resultado |
|---|---|
| Pruebas del servidor, en la PC | 27 de 27, incluidas 7 de la conversión de documentos de Firestore |
| Ensayo en la PC sobre una copia del último respaldo del VPS | Dos escrituras seguidas: 10 matrículas (0 provisionales), 2 pagos y 7 asistencias. La segunda no agregó asistencias (idempotente) |
| Modo de prueba en el VPS, sin escribir | 10 matrículas, 2 pagos y 7 asistencias válidos; 0 rechazados |
| Carga con `--escribir` en el VPS | De 2 matrículas (1 provisional), 1 pago y 0 asistencias a **10 matrículas (0 provisionales), 2 pagos y 7 asistencias**; 0 errores |

La matrícula provisional que dejó la migración recibió sus datos reales. Entre las 10 matrículas está la pre-matrícula de prueba del 24-oct. El volumen sigue siendo bajo, así que el RTO de [§7.2](#72-restauracion-probada-ejercicios-reales) debe volver a medirse cuando la réplica crezca. Sigue pendiente el reintento de los envíos que fallan (PB-19 del [E4](../e4-calidad-operacion-ce024.md)).

### 7.9 Comparación y reparación nocturna de la réplica (2026-11-14)

La carga inicial cerró el hueco de los datos anteriores, pero un envío que fallara después seguía sin repetirse (R-28). Desde el 2026-11-14 el temporizador `academia-replica` (`deploy/systemd/`) corre cada noche a las 03:30 de Perú, después del respaldo de las 03:00:

1. `cargaInicial.js --escribir --dias 14` repara desde Firestore las matrículas, pagos y marcas que difieren, sin duplicar.
2. `conciliarAsistencias.js --escribir --dias 14` borra en MySQL, con `sp_eliminar_asistencia` y auditoría, las marcas que ya no existen en Firestore. Antes de borrar busca cada marca por id, y se frena si debe borrar más del 25 %.
3. `compararReplica.js` compara IDs y campos. Su resultado decide el estado del servicio: `SUCCESS` si coinciden y `failed` si quedan diferencias.

| Paso (VPS, 2026-11-14, 21:47) | Resultado |
|---|---|
| Paquete | 22 huellas SHA-256 correctas; respaldo previo `cermat_db_2026-11-15T02-47-37.sql` |
| Base y servicios | `03` y `04` con espera máxima de 60 s; 9 de 9 permisos `EXECUTE`; los dos `/health` con MySQL conectado |
| Primera comparación, sin límite de días | 3 diferencias, todas de milisegundos (`pagadoEn` de 2 pagos y `timestampUtc` de 1 marca) |
| Reparación y conciliación | 10 matrículas, 3 pagos y 7 marcas escritos, sin rechazos; ninguna marca que borrar |
| Comparación final | «Firestore y MySQL coinciden» |
| Temporizador | Habilitado; primera corrida `status=0/SUCCESS` |

Para volver atrás: `systemctl disable --now academia-replica.timer` y la API anterior, guardada en `dist.antes-replica-20261112`. Cada cambio queda en `auditoria`, y el respaldo de las 03:00 es anterior a la corrida.

## 8. RTO y RPO: objetivos frente a resultados

| Servicio | RTO objetivo | RTO obtenido | RPO objetivo | RPO evidenciado | Conclusión |
|---|---|---|---|---|---|
| MySQL (base de prueba) | < 1 h | 0,38 s (REC-01) y 0,27 s (REC-02) | ≤ 24 h | Respaldo bajo demanda | Cumple en la base de prueba |
| MySQL (base real) | < 1 h | 0,23 s (REC-05); 0,33 s en el VPS (REC-13) y 0,41 s del VPS a la PC (REC-14) | ≤ 24 h | Respaldo diario a las 03:00 en el VPS desde el 2026-10-24: RPO ≤ 24 h dentro del VPS. Fuera del VPS, la copia semanal no se hacía: el 2026-11-17 la más nueva tenía 23 días (NC-10) | Cumple en el VPS; **no cumple** fuera de él |
| PostgreSQL del colegio | 2 h | Pendiente (REC-06) | ≤ 24 h | Sin respaldos implantados: hoy el RPO no está acotado | **No cumple** (NC-04) |
| VM en PBS | 2 h | Pendiente (REC-07) | ≤ 24 h | Pendiente | — |
| VPS completo | 8 h | 1 min 30 s en la simulación (REC-08, 2026-11-17) | ≤ 24 h | 567 h: el respaldo más nuevo fuera del VPS tenía 23 días | Cumple el RTO; **no cumple** el RPO (NC-10) |
| VPN | ≤ 2 min automático | 2 s en la simulación (REC-09) | No aplica | — | Cumple en la simulación |
| SPA (Vercel) | 15 min | Pendiente (REC-10) | 0 | Código en Git | — |
| Firestore | 4 h | Pendiente (REC-11) | ≤ 24 h | Sin exportación programada | **No cumple** (NC-06) |

## 9. Monitoreo y control operativo

### 9.1 Implementado

- `GET /health` de la API y de la analítica (estado de MySQL y tiempo en línea), visible en el panel admin "Infraestructura".
- Temporizadores de systemd en el VPS: `academia-respaldo` (03:00) y `academia-replica` (03:30, desde el 2026-11-14). `systemctl list-timers` y `journalctl -u academia-replica.service` muestran si la réplica coincide con Firestore; un `failed` indica diferencias. Todavía no envía alertas.
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

**Parcial.** Comandos que se ejecutan en hora pico y en hora valle para validar el presupuesto de RAM de [S1-E2 §10.5](s1-e2-diseno-centro-datos-hibrido-ce0331.md):

```bash
free -m; swapon --show; df -h /; uptime
ps -eo rss,comm --sort=-rss | head -n 12
```

| Criterio de aceptación | Resultado obtenido | Evidencia a adjuntar |
|---|---|---|
| Valores registrados en dos horarios; MemAvailable ≥ 25 % antes de agregar agentes | Dos mediciones del 2026-10-24. Antes de la capa de la academia: 1,9 GiB de RAM con 1,5 GiB disponibles, swap de 1 GiB sin uso y 28 GB libres en disco. Con la capa en marcha (20:01): 685 MiB usados y 1,3 GiB disponibles (≈ 68 %). Falta medir en hora pico | Manual de despliegue §9.0 y §9.4 |

### 9.4 Eficiencia energética y disponibilidad

CE0333 pide evaluar la eficiencia energética y la disponibilidad de la operación.

**Hoy, en la nube.** La academia no tiene servidores propios encendidos. La plataforma corre en Vercel y Firebase, y la capa relacional usa unos 400 a 500 MB de RAM de un VPS que comparte con el sistema del colegio (manual §9.0). Le corresponde una fracción de un servidor de un centro de datos profesional, donde la eficiencia (PUE) es mejor que la de una sala pequeña: el promedio mundial informado por el Uptime Institute en 2023 fue 1,58, y los grandes proveedores de nube publican valores cercanos a 1,1.

**Con la sede (fase 2).** Los equipos del diseño suman de 130 a 230 W (S1-E2 §5.6). Con un consumo medio de 180 W encendidos todo el año son unos **1 577 kWh al año**; el costo sale de multiplicarlo por la tarifa del recibo de la sede (supuesto SUP-06 por validar). Medidas de eficiencia del diseño:

- un solo host con virtualización en lugar de un equipo por servicio;
- apagado ordenado por el UPS (NUT), primero los servicios no críticos;
- servicios públicos y bases de alta disponibilidad en la nube, no en la sede;
- el entorno de validación demostró que toda la red y la detección caben en unos 3 GB de RAM.

**Disponibilidad.** Los objetivos por servicio están en la sección 8. Hasta ahora solo hay verificaciones puntuales (`infra/scripts/salud-servicios.mjs`) y un incidente de disponibilidad de la réplica (INC-06). La disponibilidad mensual medida llega con Uptime Kuma (PR-33).

## 10. Control de cambios y gestión de configuración

### 10.1 Repositorio y estructura

**Ya versionado en Git:**

- `firestore.rules` con 103 pruebas (19 al 2026-10-24).
- `infra/`: configuración de infraestructura, scripts de prueba y evidencias (estructura abajo).
- `.github/workflows/ci.yml` (6 trabajos).
- `server/src/db/` (migraciones numeradas, pruebas y su README).
- `server/scripts/backup.js`, `restore.js` y `db-crear-usuarios.js`.
- `.github/pull_request_template.md`.
- En el repositorio de documentación: diagramas, matrices y `scripts/generar-matrices-infra.mjs`.

**Estructura de la configuración de infraestructura** (`infra/`, creada el 2026-11-16 y ampliada el 2026-11-17 con el entorno de validación), con carpetas separadas para diagramas, hipervisor (ESXi en la guía), nube (AWS en la guía), scripts y registros:

```text
infra/
├── README.md            # orden de despliegue, reconstrucción, qué no se versiona
├── diagramas/           # enlaces a los .drawio
├── cd/
│   ├── proxmox/         # host y VM de la sede (≡ ESXi); se completa en la fase 2
│   ├── hyperv/          # hipervisor del entorno de validación (≡ ESXi) y REC-07
│   ├── nube/            # Nginx y cabeceras del VPS, respaldo-pg.sh (≡ AWS)
│   ├── rec08/           # reconstrucción de la capa de la academia (REC-08)
│   ├── deteccion/       # Suricata, Cowrie, Loki y Grafana (≡ IDS y SIEM)
│   └── monitoreo/       # Uptime Kuma (≡ CloudWatch)
├── red/                 # ver S2-E2
├── scripts/             # verificación y respaldo
└── logs/                # salidas de pruebas y de restauración, con fecha
```

El README (`infra/README.md`) indica el propósito y el estado de cada carpeta, el orden de despliegue del entorno de validación y de la sede (host → OPNsense → bastión → SIEM → aplicaciones → respaldo → honeypot → túnel), qué secretos existen y dónde se guardan (nunca en Git) y cómo ejecutar las pruebas PR y REC.

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
| 2026-10-24 | Endurecimiento del Nginx del colegio: 5 cabeceras de seguridad y `server_tokens off` | VPS | Manual de despliegue §7; PR-10 |
| 2026-10-24 | Capa relacional de la academia en el VPS (usuario `academia`, Node 22, PM2, MySQL 8.0.46 y analítica en 127.0.0.1; Nginx con HTTPS en `api-academia` y `analitica-academia`) y panel de admin apuntando al VPS | VPS | Manual de despliegue §9; PR-38 y PR-39 |
| 2026-10-24 | Corrección de tres defectos de la base (migración 05, collation del VPS y transacciones abiertas tras un error) y de `restore.js`; servicios de la PC detenidos | MySQL del VPS y de la PC; API y analítica | Commit `d1e2383`; [E4 §2.8](../e4-calidad-operacion-ce024.md#28-analisis-del-incidente-sincronizacion-con-el-vps-inc-06) |
| 2026-10-24 | Respaldo diario con un temporizador de systemd en el VPS y copia semanal verificada en la PC | VPS y PC | REC-14 |
| 2026-10-24 | Carga inicial de Firestore a MySQL (10 matrículas, 2 pagos y 7 asistencias), con respaldo previo | MySQL del VPS | Commit `8d03fe1`; §7.8 |
| 2026-10-28/30 | Paneles, comprobantes con QR y seguridad de accesos; reglas publicadas después del frontend y migración de accesos en el VPS | Vercel, Firebase y VPS | Commit `bb02659`; manual §9.7.6 |
| 2026-11-12 20:52 | Paquete del VPS: `sp_eliminar_asistencia`, activación del alumno, cuentas desactivadas y alertas sin duplicar | MySQL, API y analítica del VPS | Manual §9.7.7; respaldo `cermat_db_2026-11-13T01-52-08.sql` |
| 2026-11-12 21:07 | Conciliación de las marcas borradas antes de esa entrega (nada que borrar) | MySQL del VPS | Commit `c410575`; manual §9.7.8 |
| 2026-11-14 21:47 | Réplica reparable y temporizador `academia-replica` | MySQL, API y systemd del VPS | Commit `22dba3a`; §7.9 |
| 2026-11-15/16 | Rutas `/api/cuentas` y `/api/usuarios` (Firebase Admin) para el acceso directo de alumnos | API del VPS | Commit `c7d6302`; manual §9.7.10; 401 sin sesión el 2026-11-16 |
| 2026-11-16 | Matrícula masiva por fila y migración `06` (descuento y cronograma); aplicación de la migración en el VPS no registrada aún | Repositorio y Vercel | Commit `f9447d8` |
| 2026-11-16 | Corrección de tipos y pruebas de esa entrega (372/372), publicada el mismo día; el CI volvió a verde (ejecución #25) | Repositorio y Vercel | Commit `95b270d`; [E4 de Software §1.3](../e4-calidad-operacion-ce024.md#13-reporte-de-ejecucion-2026-11-16) |
| 2026-11-16 | Repositorio técnico `infra/`: README, Nginx y cabeceras del VPS, reglas planeadas (CSV) y scripts de PR-12, PR-36, PR-40, PR-41 y REC-10 | Repositorio de la aplicación | `infra/README.md`; `infra/logs/2026-11-16/` |
| 2026-11-17 | Entorno de validación: red de la sede en Docker (firewall, DMZ, 2 WAN y VPN), detección (Suricata, Cowrie, Loki y Grafana) y reconstrucción del VPS en contenedores (REC-08) | PC del equipo (SIMULACIÓN) | `infra/logs/2026-11-17/` |
| 2026-11-18 | Recursos generales del alumno: frontend publicado por Vercel (bundle `index-DN35Sjy6.js`) y regla de Firestore publicada desde la consola a las 15:49, porque el CI no tiene el secreto `FIREBASE_SERVICE_ACCOUNT` | Vercel y Firebase | Commit `04dce19`; sin sesión, recursos generales del alumno → 403 y públicos → 200 ([E4 de Software §1.6](../e4-calidad-operacion-ce024.md#16-las-pruebas-detectan-defectos-reales)); manual de despliegue |

### 10.3 PRO-02 · Procedimiento de gestión de cambios

1. **Solicitud:** issue o PR con la plantilla (qué cambia, por qué y cómo revertirlo).
2. **Evaluación:** impacto en los riesgos y en la SoA; los cambios en reglas, firewall, VPN o bases son "de seguridad".
3. **Respaldo previo:** `backup.js`, `pg_dump`, `config.xml` o snapshot de la VM, según el componente.
4. **Prueba** en un entorno de prueba: emulador de Firestore, `cermat_prueba`, VM clonada o entorno simulado.
5. **Aprobación:** un segundo integrante; la Dirección en los cambios mayores.
6. **Ejecución** en una ventana acordada; en el VPS se sigue el procedimiento de actualización sin pérdida del manual.
7. **Verificación:** se repiten las pruebas PR o REC afectadas y se compara lo publicado con lo versionado.
8. **Cierre:** registro en el historial y actualización de la documentación y del inventario.

### 10.4 Hallazgos del control de cambios

- Un solo autor en el historial y mensajes de commit genéricos ("mejoras").
- Sin revisiones registradas en la plantilla de PR.
- El CI corre en GitHub (ejecuciones #22 y #25 en verde), pero Vercel publica `main` aunque falle: el 2026-11-16 se publicó `f9447d8` sin pasar las comprobaciones (E4 de Software §1.3).
- El CI no publica las reglas de Firestore: le falta el secreto `FIREBASE_SERVICE_ACCOUNT` y omite ese paso. Las del 2026-11-18 se publicaron desde la consola tras pasar sus 103 pruebas y se verificaron sin sesión (R-04).
- Secretos en el historial: revocados el 2026-10-24; los `.env`, sin contraseñas, siguen versionados por decisión del equipo.
- Dos despliegues bloqueados en Vercel que el push no mostraba; se resolvió el 2026-10-24 y desde entonces se verifica la versión en producción tras cada cambio.

Se trataron como NC-02 y NC-03 (cerradas el 2026-10-24) y NC-08 (abierta) del SGSI.

## 11. Resultados, conclusiones, limitaciones, mejoras futuras y referencias

### 11.1 Resultados

| Indicador | Valor |
|---|---|
| Componentes del CD en el diseño | 36 (los de nube, operativos; los de la sede, pendientes) |
| Activos en el inventario final con evidencia | 33 |
| Ejercicios de recuperación ejecutados / pendientes | 10 / 4 (REC-08, REC-09 y REC-12 en SIMULACIÓN) |
| RTO medido de MySQL | 0,23 s en la base real (REC-05); 0,33 s en el VPS (REC-13) y 0,41 s del VPS a la PC (REC-14); 0,27–0,38 s en la base de prueba (objetivo < 1 h) |
| Servicios con RPO actualmente no acotado | 2 (PostgreSQL del colegio y Firestore) |
| Réplica relacional después de la carga inicial | 10 matrículas (0 provisionales), 2 pagos y 7 asistencias |
| Réplica relacional al 2026-11-14 | 10 matrículas, 3 pagos y 7 asistencias; comparación con Firestore sin diferencias; reparación nocturna activa |

### 11.2 Conclusiones

1. La nube del diseño está operativa y con evidencia: el VPS equivale a EC2 con Security Group, TLS y la base no expuesta, y la plataforma PaaS funciona con HTTPS y HSTS.
2. La recuperación está demostrada para la base relacional con verificación de integridad y RTO medido, primero en una base de prueba y después en la base real (REC-05). Es el ejercicio completo que exige la guía. También se probó en otro servidor: de la PC al VPS (REC-13) y del VPS a la PC (REC-14). El respaldo diario quedó programado en el VPS el 2026-10-24, así que el RPO de MySQL ya está acotado a 24 h.
3. Las dos mayores brechas de continuidad son reales y prioritarias: el colegio y Firestore no tienen respaldo implantado, así que su RPO no está acotado.
4. El entorno on-premise tiene un procedimiento reproducible (red, VM, PBS y migración), listo para ejecutarse en cuanto exista el hardware.
5. Contar objetos no basta para dar por buena una restauración: REC-13 pasó con los objetos completos y aun así las rutinas fallaban por la collation. Desde el 2026-10-24 `restore.js` verifica la collation y la prueba ejecuta las funciones en la copia restaurada.
6. En el entorno virtual del 2026-11-17 se recuperaron el VPS completo (REC-08, 1 min 30 s), el túnel (REC-09, 2 s) y el firewall (REC-12, 1 s). REC-08 dejó un hallazgo real: el respaldo más nuevo fuera del VPS tenía 23 días (NC-10). El hipervisor y la recuperación de una VM (REC-07) siguen sin validar.

### 11.3 Limitaciones

- Sin el hardware de la sede no hay evidencia de hipervisor, VM ni VPN en la sede; la fase 1b la obtiene en la red virtual de Docker (ejecutada el 2026-11-17) y en Hyper-V (script listo, sin ejecutar), rotulada como simulación (sección 3.3 y S2-E2 §8).
- La base real tiene muy pocas filas aun después de la carga inicial (10 matrículas, 2 pagos y 7 asistencias), así que su RTO (0,23–0,41 s) debe volver a medirse cuando tenga volumen.
- La copia fuera del VPS es manual y semanal; falta automatizarla hacia PBS.
- Parte de la evidencia del VPS proviene del manual del propietario y faltan las capturas.

### 11.4 Mejoras futuras

- Repetir en la sede, con Proxmox y el hardware, lo validado en Hyper-V (fase 2).
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
