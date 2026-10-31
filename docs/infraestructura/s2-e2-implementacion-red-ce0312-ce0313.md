# S2-E2 · Implementación, Testing y Monitoreo de Red (CE0312–CE0313)

!!! abstract "CE0312 y CE0313 — Implementación, pruebas y control de red"
    Ejecución del [diseño de red del Semestre 1](s1-e1-analisis-diseno-red-ce0311.md): VPN, firewall, DMZ, segmentación, IDS/IPS, honeypot, monitoreo y pruebas reproducibles. Este documento separa lo **implementado con evidencia** (perímetro y TLS del VPS, DNS y HTTPS de la plataforma) de lo **pendiente de ejecución** (equipos de la sede, VPN, detección y monitoreo), que incluye procedimiento, criterio de aceptación y evidencia por adjuntar.

## Portada

| Campo | Detalle |
|---|---|
| Título | Implementación, pruebas y monitoreo de la red híbrida de CERMAT |
| Entregable | Semestre 2 · Entregable 2 · CE0312 y CE0313 |
| Estudiantes | David Robert Yucra Mamani (líder), Gladys Rosaura Yana Pari, Denilson Leeke Mamani Flores, Cárdenas Vilca Rennzo |
| Semestre | 2026-2 (9° ciclo), UPeU campus Juliaca, sección g1 |
| Fecha | 2026-10-24 |
| Versión | 2.0 |

**Control de versiones**

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-07-06 | Plantillas de configuración de VLAN y protocolo de pruebas (estructura anterior de la guía) |
| 2.0 | 2026-10-24 | Reescrito según la guía vigente: evidencia real del VPS y de las verificaciones externas, procedimientos de VPN, perímetro y detección, plan de 37 pruebas e incidencias |

**Productos obligatorios**

| Producto | Formato entregado | Ubicación | Criterio de aceptación (guía) | Estado |
|---|---|---|---|---|
| Informe de implementación, testing y monitoreo de red | Página versionada; PDF desde la vista de impresión | Este documento | Completo, versionado y coherente con el diseño de S1 | Entregado |
| Evidencias técnicas de configuración | Salidas de comandos, configuraciones sanitizadas y explicación de cada evidencia | Secciones 4 y 10 y Anexo B | Capturas legibles, configuraciones exportadas y propósito de cada evidencia | Parcial: evidencia real del VPS y externa; lo de la sede, pendiente |
| Plan y resultados de pruebas | XLSX y sección 8 | [s2-e2-plan-resultados-pruebas-red.xlsx](../assets/infraestructura/s2-e2-plan-resultados-pruebas-red.xlsx) | Pruebas positivas y negativas: permitido/denegado y detección | 11 conformes y 2 no conformes con resultado real; 24 pendientes |
| Repositorio técnico de red | Git | Sección 10.2 | Permite revisar o reconstruir la configuración sin credenciales | Parcial: estructura definida; configuraciones de la sede pendientes |

## 1. Resumen ejecutivo de la implementación de red

| Elemento del diseño | Estado | Evidencia |
|---|---|---|
| Perímetro de la nube (UFW: entrada denegada; 22, 80 y 443/tcp) | **Implementado** | Manual del VPS (2026-10-17), PR-01 |
| Base de datos de la nube no expuesta (PostgreSQL solo en loopback) | **Implementado** | PR-02 |
| HTTPS con redirección, TLS 1.2/1.3 y certificados vigentes en los 3 sitios del VPS | **Implementado y verificado** | PR-03 a PR-07 (2026-10-24); renovación PR-08 (manual) |
| HTTPS de los 2 subdominios de la academia en el VPS (`api-academia` y `analitica-academia`) | **Implementado y verificado** | PR-38 (2026-10-24) |
| Capa de la academia en el VPS: API y analítica solo en 127.0.0.1 detrás de Nginx, MySQL solo local y ningún dato sin sesión | **Implementado y verificado** | PR-39 (2026-10-24) |
| HTTPS, HSTS y TLS de la plataforma de la academia (Vercel) | **Implementado y verificado** | PR-13 (2026-10-24) |
| Bloqueo de archivos ocultos en Nginx | **Implementado y verificado** | PR-09 |
| DNS del dominio (NS, MX y CNAME) | **Implementado y verificado** | PR-11 |
| Cabeceras de seguridad HTTP y versión de Nginx oculta | **Implementado y verificado** | PR-10, repetida después del endurecimiento del 2026-10-24 (sección 4.3) |
| Protección del dominio (CAA, SPF, DMARC y DNSSEC) | **No conforme** | PR-12: acciones en la sección 4.3 |
| OPNsense, VLAN, DMZ y Wi-Fi de la sede | Pendiente de ejecución | Procedimiento en la sección 4.2 |
| VPN IPsec sede ↔ VPS | Pendiente de ejecución | Procedimiento en la sección 3 |
| Suricata, Cowrie y Wazuh | Pendiente de ejecución | Procedimiento en la sección 6 |
| Monitoreo con Uptime Kuma y Netdata | Pendiente de ejecución | Procedimiento en la sección 7.2 |

**Hallazgos.** Las verificaciones del 2026-10-24 confirman que el cifrado en tránsito es correcto en todos los sitios: TLS 1.0 y 1.1 se rechazan y TLS 1.2 y 1.3 usan cifrados AEAD. También revelaron dos brechas reales: el sitio del colegio no enviaba cabeceras de seguridad y exponía la versión de Nginx, lo que se corrigió el mismo día (PR-10 conforme), y el dominio no publica CAA, SPF, DMARC ni DNSSEC. Se registraron 6 incidencias: 3 incidentes (INC-01, INC-02 e INC-06, cerrados el 2026-10-24), 1 falso positivo cerrado y 2 observaciones (INC-04, cerrada, e INC-05, abierta).

**Cumplimiento del diseño.** De los 31 componentes de red del diseño, los de la nube (NET-23 a NET-25, NET-28 a NET-30) están operativos. Los de la sede y el túnel dependen del hardware (fase 2) o del laboratorio de validación propuesto (fase 1b). Desde el 2026-10-24 el VPS aloja también la capa relacional de la academia, que el diseño ubica en VM-APP01 (NET-13); la PC local (NET-31) quedó retirada.

## 2. Trazabilidad con el diseño de red

| Elemento de S1-E1 | Implementación | Cambio respecto del diseño | Justificación |
|---|---|---|---|
| UFW-01 a UFW-05 (Security Group del VPS) | Implementado | Ninguno | — |
| UFW-06 a UFW-10 (VPN, SSH solo por VPN y fail2ban) | Pendiente | El cierre de SSH a Internet espera a la validación de la VPN | Evitar quedar sin acceso; la consola del proveedor es el acceso de emergencia |
| NET-25 Nginx con TLS | Implementado | Cabeceras de seguridad y `server_tokens off` aplicadas el 2026-10-24; sitios `api-academia` y `analitica-academia` con HTTPS | Hallazgo PR-10 (cerrado) y capa de la academia en el VPS |
| NET-28 DNS | Implementado | Se agregan CAA, SPF, DKIM y DMARC | Hallazgo PR-12 |
| NET-04 OPNsense, VLAN y reglas FW-01 a FW-73 | Pendiente | Ninguno | Requiere el host (fase 2) o un laboratorio (fase 1b) |
| NET-27 túnel IPsec | Pendiente | Ninguno | Requiere OPNsense |
| NET-05, NET-14 y NET-17 (detección) | Pendiente | Ninguno | Requiere el host |
| NET-31 PC local | Retirada (2026-10-24) | La capa relacional pasó al VPS; la PC queda para pruebas de restauración | Servicio 24/7 sin depender de una PC encendida |

## 3. Implementación de la conectividad híbrida (VPN)

**Estado: pendiente de ejecución.** Requiere VM-FW01 (OPNsense). Los parámetros son los de [S1-E1 §10](s1-e1-analisis-diseno-red-ce0311.md).

**Paso 1. Red interna del VPS (`dum0`, equivalente a la subred privada).**

```ini
# /etc/systemd/network/10-dum0.netdev
[NetDev]
Name=dum0
Kind=dummy

# /etc/systemd/network/10-dum0.network
[Match]
Name=dum0

[Network]
Address=10.20.0.1/24
```

```bash
sudo networkctl reload
ip -br addr show dum0        # esperado: dum0 ... 10.20.0.1/24
```

**Paso 2. strongSwan y llave privada del VPS.** La llave se genera en el VPS y nunca sale de él.

```bash
sudo apt install strongswan-swanctl charon-systemd strongswan-pki
sudo sh -c 'pki --gen --type ecdsa --size 384 --outform pem > /etc/swanctl/private/vps.key.pem'
sudo chmod 600 /etc/swanctl/private/vps.key.pem
sudo pki --req --type priv --in /etc/swanctl/private/vps.key.pem \
     --dn "CN=vps.cermat.vpn" --san vps.cermat.vpn --outform pem > vps.csr.pem
```

**Paso 3. CA y certificados en OPNsense.** Crear la CA interna en *System → Trust → Authorities*: `CA-CERMAT-VPN`, ECDSA secp384r1, SHA-384, 10 años. Firmar `vps.csr.pem` como certificado de servidor por 2 años y emitir el certificado propio `fw-sede.cermat.vpn`. Solo se copian al VPS los certificados **públicos**: el del VPS a `/etc/swanctl/x509/` y el de la CA a `/etc/swanctl/x509ca/`.

**Paso 4. Configuración de strongSwan.** Archivo sin secretos:

```text
# /etc/swanctl/conf.d/sede.conf
connections {
  sede-azangaro {
    version = 2
    local_addrs = %any
    remote_addrs = %any              # la sede puede tener IP dinámica o CGNAT
    proposals = aes256gcm16-prfsha256-ecp384,aes256gcm16-prfsha256-ecp256
    encap = yes                      # NAT-T forzado (UDP 4500)
    dpd_delay = 30s
    rekey_time = 4h
    local {
      auth = pubkey
      certs = vps.crt.pem
      id = vps.cermat.vpn
    }
    remote {
      auth = pubkey
      id = fw-sede.cermat.vpn
      cacerts = ca-cermat-vpn.crt.pem
    }
    children {
      sede-net {
        local_ts = 10.20.0.0/24
        remote_ts = 10.10.40.0/24,10.10.99.0/27
        esp_proposals = aes256gcm16-ecp384,aes256gcm16-ecp256
        rekey_time = 1h
        dpd_action = clear
        start_action = none
      }
    }
  }
}
```

```bash
sudo systemctl enable --now strongswan
sudo swanctl --load-all
```

**Paso 5. Firewall del VPS.**

```bash
sudo ufw allow 500,4500/udp comment 'IKEv2 y NAT-T (UFW-06)'
sudo ufw allow in from 10.10.40.40 to 10.20.0.1 port 22 proto tcp comment 'Respaldo (UFW-07)'
sudo ufw allow in from 10.10.99.20 to 10.20.0.1 port 22 proto tcp comment 'Bastion por VPN (UFW-08)'
sudo ufw status numbered
```

**Paso 6. Conexión en OPNsense** (*VPN → IPsec → Connections*).

| Campo | Valor |
|---|---|
| Versión | IKEv2 |
| Direcciones locales y remotas | Interfaz WAN / IP pública del VPS |
| Propuestas | `aes256gcm16-prfsha256-ecp384` y `aes256gcm16-prfsha256-ecp256` |
| Encapsulación UDP y DPD | Activada; 30 s |
| Autenticación local | Llave pública, certificado `fw-sede.cermat.vpn` |
| Autenticación remota | Llave pública, CA `CA-CERMAT-VPN`, id `vps.cermat.vpn` |
| Child SA | Local 10.10.40.0/24 y 10.10.99.0/27; remota 10.20.0.0/24; ESP `aes256gcm16-ecp384`; acción de inicio *start*; DPD *restart* |

Después: reglas FW-70 a FW-73 en la pestaña IPsec y normalización con MSS máximo de 1360 en la interfaz IPsec.

**Paso 7. Verificación bidireccional.**

```bash
# En el VPS
sudo swanctl --list-sas          # esperado: sede-azangaro ESTABLISHED; sede-net INSTALLED, AES_GCM_16-256, ECP_384
ping -c 3 -I 10.20.0.1 10.10.40.10
curl -s --interface 10.20.0.1 http://10.10.40.10:3001/health    # esperado: {"status":"ok",...}
# En el bastión (10.10.99.20)
ssh <usuario>@10.20.0.1          # SSH al VPS por la VPN
ping -c 3 10.20.0.1
```

| Criterio de aceptación | Resultado obtenido | Evidencia a adjuntar |
|---|---|---|
| IKE_SA establecida y CHILD_SA instalada con AES-GCM-256 y ECP-384; respuesta en ambos sentidos; redes no anunciadas sin ruta (PR-24 a PR-26) | Pendiente de ejecución | Salida de `swanctl --list-sas`, captura del estado IPsec en OPNsense, salidas de `ping` y `curl` y registro de las reglas FW-70 a FW-73 |

## 4. Implementación de la seguridad perimetral

### 4.1 Implementado en la nube (VPS)

| Control | Configuración | Verificación | Resultado | Fuente |
|---|---|---|---|---|
| Firewall de host (equivalente a Security Group) | UFW con entrada denegada por defecto; 22, 80 y 443/tcp permitidos; salida permitida | `sudo ufw status verbose` | Conforme | Manual del propietario (2026-10-17), PR-01 |
| Segmentación por servicio (la base no es alcanzable) | PostgreSQL escucha solo en loopback | `sudo ss -tlnp` | Conforme | Manual, PR-02 |
| Cifrado en tránsito | Let's Encrypt en dominio, www y api; redirección 301; TLS 1.2/1.3 | `curl` y `openssl` | Conforme | Verificación del 2026-10-24, PR-03 a PR-07 |
| Renovación de certificados | Certbot con renovación automática | `certbot renew --dry-run` | Conforme | Manual, PR-08 |
| Superficie web mínima | Raíz pública solo en `backend/public`; bloqueo de archivos ocultos; `client_max_body_size 20M` | `curl https://<host>/.env` | 403 (conforme) | PR-09 |
| Permisos de la aplicación | Grupo `www-data`, sin 777; `.env` con permisos 640 | Revisión del manual | Conforme | Manual |
| Capa de la academia aislada (desde el 2026-10-24) | Usuario `academia` sin sudo en `/opt/academia`; API (3001) y analítica (8000) en 127.0.0.1; MySQL con `bind-address` 127.0.0.1; sitios propios de Nginx con HTTPS; secretos con permiso 600 | `ss -lntp`; `curl` sin sesión y con otro origen | Conforme | Manual de despliegue §9, PR-38 y PR-39 |

En la nube, el VPS cumple el papel de un servidor en DMZ: expone solo 80 y 443, las bases (PostgreSQL y MySQL) escuchan en loopback y la administración se cerrará al túnel.

### 4.2 Pendiente en la sede (OPNsense, switch y Wi-Fi)

**Estado: pendiente de ejecución** (fase 2, o laboratorio en la fase 1b).

1. **OPNsense (VM-FW01).** Instalar desde la imagen oficial en la VM 101 (sección 3 de S2-E3). Asignar WAN = vtnet0, WAN2 = vtnet1 y la troncal vtnet2 con las VLAN 10, 20, 30, 40, 50 y 99 (*Interfaces → Other Types → VLAN*), cada una con su dirección .1.
2. **Servicios.** DHCP por VLAN con los rangos y reservas de S1-E1 §8.1; Unbound con listas de bloqueo para GUEST y ACAD; NTP en todas las interfaces internas.
3. **Gateways.** Grupo con WAN1 en nivel 1 y WAN2 en nivel 2, con disparador por pérdida de paquetes o latencia alta; regla de salida a Internet usando el grupo.
4. **Alias.** `PRIVADAS` (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), `ADMIN_TI` (10.10.10.10), `BASTION` (10.10.99.20) y `VPS_INTERNO` (10.20.0.1).
5. **Reglas FW-01 a FW-73** en el orden de S1-E1 §13.5, con el ID en la descripción. Reenvío FW-60 solo si el ISP entrega IP pública.
6. **Endurecimiento.** Interfaz web y SSH solo en MGMT; administrador nominativo con TOTP; regla anti-bloqueo desactivada fuera de MGMT; respaldo cifrado de `config.xml` después de cada cambio.
7. **Switch.** Crear las VLAN; LAG LACP en los puertos 23 y 24 (troncal hacia PVE01); puertos 1 y 2 como troncal para los AP con VLAN nativa 99; puertos de acceso en VLAN 10 o 20; puerto 22 en VLAN 99 para IPMI; desactivar los puertos sin uso; gestión solo en VLAN 99.
8. **AP.** SSID CERMAT-ADMIN (VLAN 10), CERMAT-DOCENTES (VLAN 20) y CERMAT-INVITADOS (VLAN 30) con aislamiento de clientes; WPA3; gestión en VLAN 99.

| Criterio de aceptación | Resultado obtenido | Evidencia a adjuntar |
|---|---|---|
| PR-14 a PR-23 y PR-34 conformes; reglas exportadas iguales a S1-E1 §13.5 | Pendiente de ejecución | Captura de las reglas por interfaz, `config.xml` sanitizado (sin hashes ni llaves), configuración exportada del switch y capturas de los SSID |

### 4.3 Endurecimiento pendiente del VPS y del dominio (brechas reales)

**Cabeceras y versión del servidor (PR-10).** Archivo `/etc/nginx/conf.d/seguridad.conf`:

```nginx
server_tokens off;
```

En cada bloque `server` con TLS, probando primero que la aplicación Angular no se rompa:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "frame-ancestors 'self'" always;
```

```bash
sudo nginx -t && sudo systemctl reload nginx
curl -sI https://cermatschool.edu.pe/ | grep -iE 'strict-transport|x-content|referrer|content-security|^server'
```

Para la plataforma de la academia, el mismo conjunto (salvo HSTS, que Vercel ya envía) se declara en la sección `headers` de `vercel.json` del repositorio de la aplicación.

**Aplicado el 2026-10-24 (PR-10 conforme).** En el VPS se usó otra distribución de archivos: `server_tokens off` en `/etc/nginx/conf.d/ocultar-version.conf` y las 5 cabeceras (HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`) en `/etc/nginx/snippets/cabeceras-seguridad.conf`, incluido en los sitios del colegio. La ruta de `index.html` define su propio `add_header`, que en Nginx anula los heredados, así que ahí se incluye de nuevo. Resultado: 5 de 5 cabeceras en la portada, `www`, `/login`, la API y los archivos estáticos; `Server: nginx` sin versión; redirección a HTTPS intacta, y la página sigue sirviendo 17 911 bytes. El procedimiento, su verificación y su reversión están en el manual de despliegue de la plataforma (§7). Antes de aplicarlo se guardó una copia de `/etc/nginx`.

**SSH (R-12).**

```bash
sudo sshd -T | grep -Ei '^(passwordauthentication|permitrootlogin|pubkeyauthentication)'
# esperado: passwordauthentication no · permitrootlogin no · pubkeyauthentication yes
sudo apt install fail2ban && sudo fail2ban-client status sshd
```

**Dominio (PR-12)**, en el panel DNS de Punto.pe:

| Registro | Valor |
|---|---|
| `CAA` en el dominio | `0 issue "letsencrypt.org"` |
| `TXT` SPF en el dominio | `v=spf1 include:_spf.google.com ~all` |
| `TXT` DKIM en `google._domainkey` | Llave generada en la consola de Google Workspace |
| `TXT` DMARC en `_dmarc` | `v=DMARC1; p=none; rua=mailto:<buzón de reportes>`; pasar a `p=quarantine` tras 2–4 semanas sin rechazos legítimos |
| DNSSEC | Activar si el registro `.pe` y el proveedor DNS lo permiten |

| Criterio de aceptación | Resultado obtenido | Evidencia a adjuntar |
|---|---|---|
| PR-10 y PR-12 repetidas con resultado conforme; `sshd -T` con los valores esperados; fail2ban activo | PR-10 repetida y conforme (2026-10-24); PR-12, `sshd -T` y fail2ban pendientes | Salidas de `curl -sI`, `sshd -T`, `fail2ban-client` y de las consultas DNS |

## 5. Pruebas de segmentación

| Prueba de la guía | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| Internet → DMZ | PR-14 | Solo 22/tcp hacia el honeypot; ningún otro puerto | Pendiente de ejecución | Pendiente |
| Internet → LAN | PR-15 | Todo filtrado, sin reenvíos | Pendiente de ejecución | Pendiente |
| DMZ → DB | PR-16 | 10.10.50.10 → 10.10.40.10:3306 bloqueado y registrado por FW-41 | Pendiente de ejecución | Pendiente |
| Usuarios → MGMT | PR-17 | Equipos ADMIN sin rol TI y ACAD → 10.10.99.10:8006 bloqueados y registrados | Pendiente de ejecución | Pendiente |
| ADMIN → MGMT | PR-18 | ADMIN_TI → 10.10.99.10:8006 permitido | Pendiente de ejecución | Pendiente |

**Equivalentes ya verificados en la nube.**

- Internet → base de datos del colegio: PostgreSQL solo escucha en loopback (PR-02) y UFW deniega la entrada (PR-01). La comprobación desde afuera con `nc -vz` está pendiente (PR-36).
- Internet → archivos internos del servidor web: `/.env` responde 403 (PR-09).

Los comandos de cada prueba están en el Anexo A.

## 6. IDS/IPS, honeypot y detección

**Estado: pendiente de ejecución** (requiere VM-FW01, VM-HPOT01 y VM-SIEM01).

### 6.1 Suricata en OPNsense

1. En *Interfaces → Settings*, desactivar la descarga de CRC, TSO y LRO por hardware (requisito de netmap sobre virtio) y reiniciar.
2. En *Services → Intrusion Detection → Administration*: activar, modo IPS, *pattern matcher* Hyperscan si la CPU lo soporta, interfaces WAN y WAN2.
3. Descargar ET Open (categorías scan, exploit, malware, trojan y policy), abuse.ch SSL Blacklist y Feodo Tracker; programar la actualización diaria.
4. Política: descartar en exploit, malware y scan sobre las WAN; solo alertar en el resto durante el primer mes para afinar falsos positivos. Para ver el tráfico interno, agregar SRV y DMZ con reglas en modo alerta.
5. Enviar las alertas y el registro del firewall por syslog TCP a Wazuh (10.10.40.20:514).

### 6.2 Honeypot Cowrie (VM-HPOT01)

```bash
# SSH real en el puerto 22022, alcanzable solo desde el bastión (FW-55)
sudo sed -i 's/^#\?Port .*/Port 22022/' /etc/ssh/sshd_config && sudo systemctl restart ssh
sudo adduser --disabled-password --gecos "" cowrie
sudo -iu cowrie
git clone https://github.com/cowrie/cowrie && cd cowrie
python3 -m venv cowrie-env && . cowrie-env/bin/activate
python -m pip install --upgrade pip
python -m pip install -e .        # según la versión de Cowrie: pip install -r requirements.txt
cowrie start                      # escucha en 2222 (SSH) y 2223 (Telnet)
```

En OPNsense, el reenvío FW-60 (WAN 22/tcp → 10.10.50.10:2222) solo se activa si la sede tiene IP pública. Sin IP pública, el honeypot funciona como señuelo interno.

### 6.3 Wazuh (VM-SIEM01) y agentes

```bash
# Instalación todo en uno con el asistente oficial (versión vigente de la guía de inicio rápido)
curl -sO https://packages.wazuh.com/<versión>/wazuh-install.sh && sudo bash ./wazuh-install.sh -a
# La contraseña de administrador que muestra el asistente se guarda en el gestor de contraseñas, nunca en documentos.

# Agentes en Ubuntu o Debian (VM, host, VPS y honeypot), con el repositorio de Wazuh configurado
sudo WAZUH_MANAGER="10.10.40.20" apt-get install wazuh-agent
sudo systemctl enable --now wazuh-agent
```

Recepción de syslog de OPNsense en `/var/ossec/etc/ossec.conf` del servidor:

```xml
<remote>
  <connection>syslog</connection>
  <port>514</port>
  <protocol>tcp</protocol>
  <allowed-ips>10.10.40.1/32</allowed-ips>
  <local_ip>10.10.40.20</local_ip>
</remote>
```

Lectura de Cowrie en el agente del honeypot y reglas locales en el servidor (`/var/ossec/etc/rules/local_rules.xml`):

```xml
<!-- agente de VM-HPOT01 -->
<localfile>
  <log_format>json</log_format>
  <location>/home/cowrie/cowrie/var/log/cowrie/cowrie.json</location>
</localfile>

<!-- servidor Wazuh -->
<group name="cowrie,honeypot,">
  <rule id="100100" level="5">
    <decoded_as>json</decoded_as>
    <field name="eventid">^cowrie.session.connect$</field>
    <description>Honeypot: conexión desde $(src_ip)</description>
  </rule>
  <rule id="100101" level="10">
    <decoded_as>json</decoded_as>
    <field name="eventid">^cowrie.login</field>
    <description>Honeypot: intento de inicio de sesión con el usuario $(username) desde $(src_ip)</description>
  </rule>
  <rule id="100102" level="12">
    <decoded_as>json</decoded_as>
    <field name="eventid">^cowrie.command.input$</field>
    <description>Honeypot: comando ejecutado $(input)</description>
  </rule>
</group>
```

### 6.4 Evidencia de punta a punta

| Paso | Evidencia esperada |
|---|---|
| 1. Generar el evento controlado (PR-30, PR-31 o PR-32) | Comando ejecutado con hora |
| 2. Detección en el sensor | Alerta de Suricata (SID 2100498 o ET SCAN) o evento de Cowrie |
| 3. Ingesta en el SIEM | Alerta en Wazuh con la regla, el nivel y la IP de origen |
| 4. Notificación | Correo o mensaje del canal de alertas |
| 5. Registro | Fila del plan de pruebas con la hora de cada paso (relojes sincronizados por NTP) |

| Criterio de aceptación | Resultado obtenido | Evidencia a adjuntar |
|---|---|---|
| PR-30, PR-31, PR-32 y PR-37 conformes, con la cadena completa en menos de 1 minuto | Pendiente de ejecución | Capturas del panel de Wazuh, extracto de `eve.json` y de `cowrie.json` |

## 7. Monitoreo y visibilidad de red

### 7.1 Implementado hoy

| Señal | Mecanismo | Dónde | Estado |
|---|---|---|---|
| Disponibilidad de la API y de MySQL | `GET /health` con el estado de MySQL y el tiempo en línea | API y analítica | Implementado |
| Verificación manual de servicios | Panel admin "Infraestructura": prueba `/health` y activa o desactiva la sincronización | Plataforma | Implementado |
| Accesos HTTP a la API | `morgan` en formato *combined* | VPS (registros de PM2 del usuario `academia`) | Implementado, sin centralizar |
| Respaldo diario de MySQL | Temporizador `academia-respaldo` de systemd (03:00 en Perú) | VPS (`journalctl`) | Implementado (2026-10-24) |
| Registros del VPS | Nginx (acceso y error), `auth.log` y journald | VPS | Implementado, sin centralizar |
| Historial de despliegues | Panel de Vercel | Vercel | Disponible |
| Rutinas de operación | Revisión diaria, semanal y mensual del manual del VPS | VPS | Documentado |

### 7.2 Pendiente: centralización, paneles y alertas

- **Centralización de registros:** Wazuh recibe OPNsense, Suricata, Cowrie, el VPS, el host y las VM; retención de 90 días (SUP-09).
- **Paneles:** panel de Wazuh (alertas por nivel y origen), página de estado de Uptime Kuma y Netdata (CPU, RAM, disco y red por equipo).
- **Correlación:** reglas de Wazuh para fuerza bruta SSH (5710, 5712, 5716 y 5720), alertas de Suricata con su origen y eventos del honeypot (100100 a 100102).
- **Conservación de evidencias:** exportación semanal de alertas con su SHA-256, guardada en PBS en modo solo lectura.

**Monitores de Uptime Kuma (VM-MON01).**

| Monitor | Tipo | Objetivo | Intervalo | Alerta |
|---|---|---|---|---|
| Plataforma de la academia | HTTP(s) | https://academia-school-platform.vercel.app | 60 s | 2 fallas seguidas |
| Sitio del colegio | HTTP(s) | https://cermatschool.edu.pe | 60 s | 2 fallas seguidas |
| API del colegio | HTTP(s) | https://api.cermatschool.edu.pe/up | 60 s | 2 fallas seguidas |
| API de la academia | HTTP(s) con JSON | `/health` a través del proxy | 60 s | 2 fallas seguidas |
| Certificados | Vencimiento TLS | Los 3 dominios del VPS | Diario | Menos de 14 días |
| Túnel IPsec | Ping | 10.20.0.1 | 60 s | 3 fallas seguidas |
| Latido del VPS | Push | `cron` del VPS cada minuto | 60 s | Sin latido en 3 min |
| Latido del propio monitor | Servicio externo gratuito de latidos | Uptime Kuma | 5 min | Sin latido |

```bash
docker run -d --restart=unless-stopped -p 3001:3001 -v uptime-kuma:/app/data --name uptime-kuma louislam/uptime-kuma:1
```

Mientras no exista el host, Uptime Kuma puede correr de forma transitoria en la PC local con Docker para vigilar los servicios públicos y cerrar la no conformidad NC-05 antes del 2026-11-14.

| Criterio de aceptación | Resultado obtenido | Evidencia a adjuntar |
|---|---|---|
| PR-33 conforme (alerta en ≤ 2 min); los 8 monitores activos; registros de las 5 fuentes visibles en Wazuh | Pendiente de ejecución | Capturas de la página de estado, del panel de Wazuh y de Netdata |

## 8. Plan y resultados de pruebas técnicas

| ID | Caso | Objetivo | Procedimiento o comando | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| PR-01 | Política por defecto del firewall del VPS | Entrada denegada y solo puertos necesarios | sudo ufw status verbose | deny (incoming), allow (outgoing); 22, 80 y 443/tcp ALLOW | Conforme según el manual del propietario (2026-10-17) | Conforme | Manual del VPS; captura de ufw status verbose a adjuntar |
| PR-02 | Base de datos de la nube no expuesta | PostgreSQL solo en loopback | sudo ss -tlnp \| grep 5432 | Solo 127.0.0.1:5432 (y ::1) | Conforme según el manual (2026-10-17) | Conforme | Captura a adjuntar; verificación externa en PR-36 |
| PR-03 | Redirección HTTP → HTTPS del dominio | Forzar cifrado | curl -sI http://cermatschool.edu.pe | 301 hacia https:// | 301 Moved Permanently → https://cermatschool.edu.pe/ (2026-10-24) | Conforme | Anexo B de S2-E2 |
| PR-04 | Redirección HTTP → HTTPS de www y api | Forzar cifrado | curl -sI http://www.cermatschool.edu.pe/ y http://api.cermatschool.edu.pe/up | 301 hacia https:// | 301 en ambos (2026-10-24) | Conforme | Anexo B de S2-E2 |
| PR-05 | Disponibilidad web y API del colegio | Servicio en línea | curl -sI https://cermatschool.edu.pe/, https://www…/ y https://api…/up | 200 | 200 en los tres (2026-10-24) | Conforme | Anexo B de S2-E2 |
| PR-06 | Protocolos TLS aceptados por el VPS | Rechazar TLS 1.0 y 1.1 | openssl s_client -connect <host>:443 -tls1 \| -tls1_1 \| -tls1_2 \| -tls1_3 | 1.0 y 1.1 rechazados; 1.2 y 1.3 con cifrados AEAD | 1.0 y 1.1: alerta 70 (protocol_version) del servidor; 1.2: ECDHE-ECDSA-AES256-GCM-SHA384; 1.3: TLS_AES_256_GCM_SHA384 (dominio y api, 2026-10-24) | Conforme | Anexo B de S2-E2 |
| PR-07 | Certificados vigentes | Emisor, SAN y vigencia correctos | openssl s_client … \| openssl x509 -noout -issuer -enddate -ext subjectAltName | Emisor de confianza, SAN correcto y vigente | Let's Encrypt (YE1 y YE2); SAN: dominio y www, y api; vencen el 2027-01-15 | Conforme | Anexo B de S2-E2 |
| PR-08 | Renovación automática de certificados | Evitar vencimientos | sudo certbot renew --dry-run | Simulación exitosa | Exitosa según el manual (2026-10-17) | Conforme | Captura a adjuntar |
| PR-09 | Bloqueo de archivos ocultos | Evitar fuga de configuración | curl -s -o /dev/null -w "%{http_code}" https://<host>/.env | 403 o 404 | 403 en dominio y api (2026-10-24) | Conforme | Anexo B de S2-E2 |
| PR-10 | Cabeceras de seguridad HTTP | HSTS y cabeceras recomendadas por OWASP | curl -sI https://cermatschool.edu.pe/ y https://academia-school-platform.vercel.app/ | HSTS, X-Content-Type-Options, protección contra framing, Referrer-Policy y Server sin versión | Primera medición: el colegio sin cabeceras de seguridad y con Server: nginx/<versión omitida> (Ubuntu); la SPA solo con HSTS. Tras los cambios del 2026-10-24: colegio con 5 de 5 cabeceras en la portada, `www`, `/login`, la API y los archivos estáticos, y `Server: nginx` sin versión; SPA con X-Content-Type-Options, Referrer-Policy, CSP frame-ancestors, Permissions-Policy y HSTS | Conforme | Anexo B de S2-E2; manual de despliegue §7.2; acción en R-13 |
| PR-11 | Registros DNS | Delegación y registros esperados | nslookup -type=NS \| MX \| CNAME | NS de RCP; MX de Google; www → dominio | NS.RCP.NET.pe y NS2.RCP.NET.pe; 5 registros MX de Google; www CNAME al dominio (2026-10-24) | Conforme | Anexo B de S2-E2 |
| PR-12 | Protección del dominio | CAA, SPF, DMARC y DNSSEC | Consultas DNS sobre HTTPS (tipos CAA, TXT, DS) | Registros presentes | Sin CAA, sin SPF, sin DMARC y sin DNSSEC (2026-10-24) | No conforme | Anexo B de S2-E2; acciones en R-11 y R-14 |
| PR-13 | HTTPS de la plataforma de la academia (PaaS) | Redirección, HSTS y TLS | curl -sI http://… y https://…; openssl s_client | Redirección a HTTPS, HSTS y TLS ≥ 1.2 | 308 a HTTPS; HSTS max-age=63072000; includeSubDomains; preload; 1.0 y 1.1 sin negociación; 1.2 y 1.3 aceptados; certificado *.vercel.app vigente hasta 2026-11-27 (renovación gestionada por Vercel) | Conforme | Anexo B de S2-E2 |
| PR-14 | Internet → DMZ (PC-01) | Validar FW-60, FW-61 | ssh; nmap -Pn -p 22 — origen: Equipo externo (datos móviles); destino: IP de WAN, 22/tcp (honeypot) | Sesión simulada de Cowrie y alerta en Wazuh; ningún otro puerto abierto | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-15 | Internet → LAN (PC-02) | Validar FW-61 | nmap -Pn -sS --top-ports 1000 — origen: Equipo externo; destino: IP de WAN, 1000 puertos más comunes | Solo responde 22/tcp (honeypot); el resto filtrado | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-16 | DMZ → DB (PC-03) | Validar FW-41 | nc -vz -w 3 — origen: VM-HPOT01 (10.10.50.10); destino: 10.10.40.10:3306 | Bloqueado y registrado por el firewall | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-17 | Usuarios → MGMT (PC-04) | Validar FW-12, FW-23 | curl -k -m 5; nc -vz — origen: Equipo ADMIN (10.10.10.150) y equipo ACAD (10.10.20.120); destino: 10.10.99.10:8006 y 10.10.99.2:443 | Bloqueado y registrado | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-18 | ADMIN → MGMT (PC-05) | Validar FW-20 | Navegador; curl -k — origen: ADMIN_TI (10.10.10.10); destino: 10.10.99.10:8006 | Permitido (interfaz de Proxmox) | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-19 | Invitados → redes internas (PC-06) | Validar FW-02 | ping; nmap -sn — origen: Cliente GUEST; destino: 10.10.10.0/24, 10.10.40.0/24 y 10.10.99.0/27 | Sin respuesta; bloqueos registrados | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-20 | Invitados → Internet (PC-07) | Validar FW-01, FW-03 | Navegador; curl -I — origen: Cliente GUEST; destino: https://academia-school-platform.vercel.app | Permitido; DNS resuelto por el firewall | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-21 | Aislamiento de clientes Wi-Fi (PC-08) | Validar Configuración del AP | ping — origen: Cliente GUEST A; destino: Cliente GUEST B | Sin respuesta (aislamiento en el AP) | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-22 | ACAD → impresora y ADMIN (PC-09) | Validar FW-11, FW-12 | nc -vz — origen: Equipo ACAD; destino: 10.10.10.20:9100 y 10.10.10.150 | Impresora permitida; equipo ADMIN bloqueado | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-23 | SRV → Internet (PC-10) | Validar FW-30, FW-34 | curl -I; nc -vz — origen: VM-APP01; destino: APIs de Google 443/tcp; servidor SMTP 25/tcp | 443 permitido; 25 bloqueado | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-24 | Establecimiento del túnel (PC-11) | Validar Diseño VPN | swanctl --list-sas; estado IPsec en OPNsense — origen: OPNsense ↔ VPS; destino: IKEv2 | IKE_SA ESTABLISHED y CHILD_SA INSTALLED con AES_GCM_16_256 y ECP_384 | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-25 | VPN bidireccional (PC-12) | Validar FW-54, FW-70 | ssh; curl — origen: Bastión ↔ VPS; destino: 10.20.0.1:22; desde el VPS, 10.10.40.10:3001/health | Ambos sentidos responden dentro del túnel | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-26 | Selectores de tráfico (PC-13) | Validar Diseño VPN | ping; nc -vz — origen: VPS 10.20.0.1; destino: 10.10.10.0/24 y 10.10.20.0/24 | Sin ruta por el túnel (redes no anunciadas) | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-27 | Publicación de la API por el VPS (PC-14) | Validar Nginx (proxy) | curl -I — origen: Internet; destino: https://api-academia…/health y otra ruta | /health responde 200 a través del túnel; otras rutas 404 | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-28 | SSH del VPS tras el endurecimiento (PC-15) | Validar UFW-08, UFW-09 | nc -vz; ssh — origen: Internet y bastión; destino: IP pública del VPS:22 y 10.20.0.1:22 | Bloqueado desde Internet; permitido desde el bastión | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-29 | Conmutación de enlaces (PC-16) | Validar Grupo de gateways | ping continuo; desconectar WAN1 — origen: Equipo ADMIN; destino: Internet | Recuperación en ≤ 60 s por WAN2; el túnel se restablece | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-30 | Detección IDS con firma de prueba (PC-17) | Validar Suricata | curl — origen: Equipo ACAD; destino: http://testmynids.org/uid/index.html | Alerta de Suricata SID 2100498 visible en Wazuh | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-31 | Detección de escaneo (PC-18) | Validar Suricata | nmap -sS -T4 — origen: Cliente GUEST; destino: 10.10.30.1 (firewall) | Alertas ET SCAN en Suricata y en Wazuh | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-32 | Inicio de sesión en el honeypot (PC-19) | Validar Cowrie y Wazuh | ssh root@<IP de WAN> — origen: Equipo externo; destino: Honeypot Cowrie | Evento cowrie.login en Wazuh con regla local de nivel ≥ 10 | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-33 | Caída de la API (PC-20) | Validar Uptime Kuma | pm2 stop cermat-api — origen: VM-APP01; destino: Uptime Kuma | Alerta en ≤ 2 min y recuperación registrada | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-34 | DNS forzado en invitados (PC-21) | Validar FW-01, FW-04 | nslookup — origen: Cliente GUEST; destino: 8.8.8.8:53 | Bloqueado; solo resuelve el firewall | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-35 | MTU por el túnel (PC-22) | Validar Diseño VPN | sftp; ping -M do -s 1332 — origen: VM-BKP01 → VPS; destino: Transferencia SFTP de 100 MB | Sin fragmentación ni cortes (MSS 1360) | Pendiente de ejecución | Pendiente | A adjuntar: salida del comando, registro del firewall o alerta del SIEM con fecha |
| PR-36 | Base de datos de la nube no alcanzable desde Internet | Confirmar desde afuera lo verificado en PR-02 | nc -vz -w 3 <IP pública del VPS> 5432 (desde la sede o datos móviles) | Tiempo agotado o rechazo | Pendiente de ejecución | Pendiente | A adjuntar: salida de nc con fecha |
| PR-37 | Fuerza bruta SSH detectada en el VPS | Detección de ataques reales sobre el servicio expuesto | Agente Wazuh en el VPS; revisar alertas de sshd (reglas 5710, 5712, 5716 y 5720) | Alertas con IP de origen y conteo | Pendiente de ejecución | Pendiente | A adjuntar: captura del panel de Wazuh |
| PR-38 | HTTPS de los subdominios de la academia en el VPS | Cifrado y disponibilidad de la API y la analítica | `curl -sI http://…`; `curl -s https://api-academia…/health` y `https://analitica-academia…/health`; `certbot renew --dry-run` | 301 a HTTPS; `/health` con MySQL conectado; certificado vigente | 301 en ambos; `"status":"ok"` con MySQL conectado; certificado de Let's Encrypt para los dos subdominios, vence el 2027-01-23; renovación simulada correcta (2026-10-24) | Conforme | Manual de despliegue §9.5 |
| PR-39 | Exposición de la capa de la academia | Solo Nginx atiende desde afuera y nada responde sin sesión | `ss -lntp` en el VPS; `curl` sin token; `OPTIONS` con un `Origin` ajeno | 3001, 8000 y 3306 solo en 127.0.0.1; 401 sin sesión; CORS solo para el origen de la academia | 3001 y 8000 solo en 127.0.0.1 y MySQL con `bind-address` 127.0.0.1; API 401 en `/api/sync/payment` y analítica 401 sin sesión; origen de Vercel permitido y origen ajeno rechazado (2026-10-24) | Conforme | Manual de despliegue §9.1, §9.4 y §9.5 |

**Resumen:** 39 casos. 14 conformes y 1 no conforme con resultado real (PR-01 a PR-13, PR-38 y PR-39); 24 pendientes de ejecución (PR-14 a PR-37). Incluye pruebas positivas (permitido), negativas (denegado) y de detección.

## 9. Incidencias detectadas

| ID | Detección | Descripción | Clasificación | Severidad | Contención | Causa raíz | Lección aprendida | Estado | Vínculo SGSI |
|---|---|---|---|---|---|---|---|---|---|
| INC-01 | 2026-10-24 | Reglas de Firestore publicadas el 22-jun-2026 con 3 fallas: listado público de matrículas pagadas, auto-asignación de rol y matrícula pública bloqueada | Incidente de seguridad: exposición potencial de datos personales y escalamiento de privilegios | S1 (alta) | Corrección con 19 pruebas; frontend y reglas publicados el 2026-10-24 y verificados como visitante sin sesión (listar matrículas pagadas → 403) | Una línea inválida impedía compilar y nadie verificaba el despliegue | Publicar solo por CI y verificar el ruleset publicado | Cerrado (2026-10-24) | R-01 a R-04; NC-01 y NC-02 |
| INC-02 | 2026-10-24 | Clave de cuenta de servicio y archivos de entorno en el repositorio privado (copias ZIP y archivos versionados) | Incidente de seguridad: credencial expuesta | S1 (alta) | Clave de enero (`283b43c3…`) eliminada y reemplazada por `ddf50bfe…`; contraseñas de las cuentas de `teachers.json` restablecidas; los `.env` (sin contraseñas) siguen versionados por decisión del equipo | Copias del proyecto subidas con secretos; control preventivo ausente | Escaneo de secretos en el CI y lista de revisión de cambios | Cerrado con riesgo residual aceptado (2026-10-24) | R-05 y R-06; NC-03 |
| INC-03 | 2026-10-24 | El antivirus puso en cuarentena scripts SQL al ejecutarlos desde PowerShell con cmd (IDP.Generic) | Evento de seguridad: falso positivo | S4 (baja) | Restaurar desde cuarentena, ejecutar desde Git Bash y exclusión acotada | Heurística del antivirus ante la cadena PowerShell → cmd | Procedimiento documentado en server/src/db/README.md | Cerrado | R-22 |
| INC-04 | 2026-10-24 | Sitio del colegio sin cabeceras de seguridad y con la versión de Nginx expuesta; SPA de la academia solo con HSTS | Observación de seguridad (no es incidente) | S4 (baja) | No requiere | Configuración por defecto | Academia: cabeceras publicadas con `vercel.json`. Colegio: fragmento de Nginx con 5 cabeceras y `server_tokens off`, aplicado y verificado el 2026-10-24 (sección 4.3) | Cerrado (2026-10-24) | R-13 |
| INC-05 | 2026-10-24 | Dominio sin SPF, DMARC, CAA ni DNSSEC | Observación de seguridad (no es incidente) | S3 (media) | No requiere | Configuración DNS inicial sin controles de correo | Lista de verificación de dominio | Abierto | R-11 y R-14 |
| INC-06 | 2026-10-24 | La sincronización con la API del VPS respondió 500 a las 20:40 y 20:42, y la migración que lo corregía quedó bloqueada más de 20 minutos | Incidente de disponibilidad e integridad de la réplica relacional; sin exposición de datos | S3 (media) | Detección: consola del panel (`[sync] … respondió 500`) y registros de PM2 (`Data truncated for column 'turno'`). Contención: API y analítica detenidas desde otra ventana, lo que liberó la transacción abierta | Tres defectos de la base: etiqueta `mañana` dañada desde junio, rutinas del VPS con otra collation y transacción abierta tras errores de clase 01 ([E4 §2.8](../e4-calidad-operacion-ce024.md#28-analisis-del-incidente-sincronizacion-con-el-vps-inc-06)) | Reproducir cada falla en una réplica antes de corregir; migrar con los servicios detenidos y una espera máxima de 60 s; la API cierra la conexión ante un error | Cerrado (2026-10-24 22:11) | R-27 y R-28; ACT-16 y ACT-17 |

- **Clasificación:** según las severidades S1 a S4 del procedimiento de gestión de incidentes [PRO-01](s2-e1-sgsi-ce0321-ce0324.md) del SGSI.
- **Contención:** INC-01 se cerró el 2026-10-24 al publicar el frontend y las reglas, con verificación en producción. INC-02 se cerró el mismo día con la clave rotada y las contraseñas restablecidas, con riesgo residual aceptado por los `.env` versionados (no contienen contraseñas). INC-03 se cerró con un procedimiento. INC-06 se contuvo deteniendo la API y la analítica, lo que liberó la transacción abierta; la corrección se aplicó a las 22:06 y se cerró a las 22:11 con la prueba de punta a punta.
- **Lecciones aprendidas:**
    - Probar contra lo publicado, no solo contra el código.
    - Verificar cada despliegue.
    - Escanear secretos antes de versionar.
    - Ejecutar los scripts desde Git Bash.
    - Incluir cabeceras y registros DNS de seguridad en la lista de verificación de cada despliegue.
    - Reproducir cada falla en una réplica antes de corregir producción, y aplicar migraciones con los servicios detenidos.

## 10. Evidencias técnicas

### 10.1 Índice de evidencias

| ID | Evidencia | Propósito | Estado | Ubicación |
|---|---|---|---|---|
| EV-01 | Manual del propietario del VPS (2026-10-17) | Fuente de PR-01, PR-02 y PR-08 | Real; no se publica porque contiene datos de infraestructura del colegio | Resumen en la sección 4.1 |
| EV-02 | Salidas de las verificaciones externas del 2026-10-24 | Resultados de PR-03 a PR-07 y PR-09 a PR-13 | Real | Anexo B |
| EV-03 | Captura de `ufw status verbose` | Respaldo visual de PR-01 | A adjuntar | — |
| EV-04 | Captura de `ss -tlnp` | Respaldo visual de PR-02 | A adjuntar | — |
| EV-05 | Captura de `certbot renew --dry-run` | Respaldo visual de PR-08 | A adjuntar | — |
| EV-06 | Configuración sanitizada de Nginx | Revisar los bloqueos y el TLS | A adjuntar | `infra/red/vps/` |
| EV-07 | `swanctl.conf` aplicado | Reconstruir la VPN | Plantilla en la sección 3; pendiente de aplicar | `infra/red/vps/` |
| EV-08 | `config.xml` de OPNsense sanitizado y reglas exportadas | Reconstruir el perímetro | Pendiente | `infra/red/opnsense/` |
| EV-09 | Alertas de Suricata, Cowrie y Wazuh | Demostrar la detección | Pendiente | `infra/logs/` |
| EV-10 | Página de estado de Uptime Kuma | Demostrar el monitoreo | Pendiente | `infra/logs/` |
| EV-11 | Manual de despliegue de la academia (2026-10-24) | Fuente de PR-38, PR-39 y de la repetición de PR-10 | Real; en el repositorio privado de la plataforma | `deploy/MANUAL-DESPLIEGUE-CERMAT.md` |
| EV-12 | 18 capturas del 2026-10-24, con los datos personales tapados | Respaldo visual de PR-38 y PR-39 (capturas 13 a 18) y del cierre en producción | Real | [Evidencias del despliegue](evidencias-despliegue-2026-10-24.md) |

### 10.2 Repositorio técnico de red

Estructura propuesta, solo con configuraciones sanitizadas (sin hashes, llaves, contraseñas ni IP públicas):

```text
infra/
├── README.md        # orden de despliegue, cómo reconstruir y qué no se versiona
├── diagramas/       # copia de los .drawio de docs/assets/infraestructura/diagramas
├── red/
│   ├── opnsense/    # config.xml sanitizado y reglas exportadas
│   ├── switch/      # configuración exportada (VLAN, LAG, puertos)
│   └── vps/         # sede.conf (swanctl), reglas UFW y bloques de Nginx
├── cd/              # ver S2-E3
├── scripts/         # verificación (curl, openssl, nc) y respaldos
└── logs/            # salidas de pruebas con fecha, sin datos personales
```

**Estado actual:** ya están versionados `firestore.rules` con sus pruebas, `.github/workflows/ci.yml`, los scripts de base de datos (`server/src/db/*.sql`) y de respaldo (`server/scripts/*.js`); y, en el repositorio de esta documentación, los diagramas, las matrices y el script que las genera. **Pendiente:** crear `infra/` con las configuraciones a medida que se implementen. Topics del repositorio según el estándar de la escuela: `campus-juliaca`, `semestre-2026-2`, `linea-infraestructura`, `tipo-epe`, `seccion-g1` y `grupo-<n>-<nombre>`.

## 11. Conclusiones, limitaciones, mejoras futuras y referencias

### 11.1 Conclusiones

1. El perímetro implementado en la nube cumple el diseño: entrada denegada por defecto, base de datos no expuesta, TLS 1.2/1.3 con AEAD y redirección a HTTPS en todos los sitios, verificados con evidencia reproducible.
2. Las pruebas encontraron dos brechas reales (cabeceras HTTP y registros DNS de seguridad), con acción definida y criterio de cierre. La de cabeceras se cerró el mismo día (PR-10 conforme); la de DNS requiere el visto bueno del colegio.
3. La VPN, el perímetro de la sede y la detección tienen procedimiento, configuración sin secretos y criterio de aceptación, listos para ejecutarse en cuanto exista la plataforma on-premise.

### 11.2 Limitaciones

- La sede no tiene todavía el hardware del diseño, así que las pruebas PR-14 a PR-35 no tienen resultado.
- La verificación externa se limitó a consultas no intrusivas: no se escanearon puertos del VPS sin una autorización escrita.
- PR-01, PR-02 y PR-08 se basan en el manual del propietario; falta adjuntar las capturas.

### 11.3 Mejoras futuras

- Laboratorio de validación (fase 1b) para obtener evidencia de PR-14 a PR-35 antes de comprar el hardware.
- WPA3-Enterprise con RADIUS, firewall redundante con CARP y acceso remoto de administradores por VPN con TOTP.

### 11.4 Referencias

[1] C. Kaufman, P. Hoffman, Y. Nir, P. Eronen y T. Kivinen, "Internet Key Exchange Protocol Version 2 (IKEv2)," RFC 7296, IETF, oct. 2014.

[2] E. Barker, Q. Dang, S. Frankel, K. Scarfone y P. Wouters, "Guide to IPsec VPNs," NIST SP 800-77 Rev. 1, jun. 2020.

[3] K. Scarfone y P. Hoffman, "Guidelines on Firewalls and Firewall Policy," NIST SP 800-41 Rev. 1, sep. 2009.

[4] K. Scarfone y P. Mell, "Guide to Intrusion Detection and Prevention Systems (IDPS)," NIST SP 800-94, feb. 2007.

[5] E. Rescorla, "The Transport Layer Security (TLS) Protocol Version 1.3," RFC 8446, IETF, ago. 2018.

[6] K. Moriarty y S. Farrell, "Deprecating TLS 1.0 and TLS 1.1," RFC 8996, IETF, mar. 2021.

[7] J. Hodges, C. Jackson y A. Barth, "HTTP Strict Transport Security (HSTS)," RFC 6797, IETF, nov. 2012.

[8] P. Hallam-Baker, R. Stradling y J. Hoffman-Andrews, "DNS Certification Authority Authorization (CAA) Resource Record," RFC 8659, IETF, nov. 2019.

[9] M. Kucherawy y E. Zwicky, "Domain-based Message Authentication, Reporting, and Conformance (DMARC)," RFC 7489, IETF, mar. 2015.

[10] OWASP Foundation, "OWASP Secure Headers Project." [En línea]. Disponible en: https://owasp.org/www-project-secure-headers/

[11] strongSwan Project, "swanctl.conf Reference." [En línea]. Disponible en: https://docs.strongswan.org/

[12] Deciso B.V., "OPNsense Documentation: Intrusion Prevention System." [En línea]. Disponible en: https://docs.opnsense.org/

[13] Wazuh Inc., "Wazuh Documentation." [En línea]. Disponible en: https://documentation.wazuh.com/

[14] Cowrie Project, "Cowrie SSH/Telnet Honeypot." [En línea]. Disponible en: https://github.com/cowrie/cowrie

## Anexos

### Anexo A. Comandos de las pruebas de segmentación y detección

| Prueba | Desde | Comando | Resultado esperado |
|---|---|---|---|
| PR-14 | Equipo externo (datos móviles) | `nmap -Pn -p 22,80,443,3389 <IP de WAN>` y `ssh root@<IP de WAN>` | Solo 22/tcp abierto; sesión simulada de Cowrie |
| PR-15 | Equipo externo | `nmap -Pn -sS --top-ports 1000 <IP de WAN>` | Solo 22/tcp; el resto filtrado |
| PR-16 | VM-HPOT01 | `nc -vz -w 3 10.10.40.10 3306` | Tiempo agotado; bloqueo de FW-41 en el registro |
| PR-17 | 10.10.10.150 y 10.10.20.120 | `curl -k -m 5 https://10.10.99.10:8006` | Tiempo agotado; bloqueo de FW-23 o FW-12 en el registro |
| PR-18 | ADMIN_TI (10.10.10.10) | `curl -k -m 5 -o /dev/null -w "%{http_code}" https://10.10.99.10:8006` | 200 |
| PR-30 | Equipo ACAD | `curl http://testmynids.org/uid/index.html` | Alerta SID 2100498 en Wazuh |
| PR-31 | Cliente GUEST | `nmap -sS -T4 10.10.30.1` | Alertas ET SCAN |
| PR-32 | Equipo externo | `ssh root@<IP de WAN>` con una contraseña inventada | Regla 100101 en Wazuh |
| PR-36 | Sede o datos móviles | `nc -vz -w 3 <IP pública del VPS> 5432` | Tiempo agotado o rechazo |

Las pruebas que generan tráfico de ataque simulado (PR-14, PR-15, PR-31 y PR-32) se ejecutan solo con la autorización escrita descrita en [S2-E1 §12.3](s2-e1-sgsi-ce0321-ce0324.md).

### Anexo B. Salidas de las verificaciones externas (2026-10-24)

Ejecutadas desde la estación del equipo (Windows 10, Git Bash con `curl` y OpenSSL 3.2.3). Son consultas HTTP, TLS y DNS no intrusivas sobre dominios propios. Se omiten las direcciones IP y la versión exacta del servidor web.

```text
$ curl -sS -o /dev/null -D - http://cermatschool.edu.pe
HTTP/1.1 301 Moved Permanently
Server: nginx/<versión omitida> (Ubuntu)
Location: https://cermatschool.edu.pe/

$ curl -sS -o /dev/null -D - https://cermatschool.edu.pe/
HTTP/1.1 200 OK
Server: nginx/<versión omitida> (Ubuntu)
(cabeceras recibidas: Server, Date, Content-Type, Content-Length, Last-Modified,
 Connection, ETag, Cache-Control, Accept-Ranges; sin cabeceras de seguridad)

$ curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" http://www.cermatschool.edu.pe/
301 https://www.cermatschool.edu.pe/
$ curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" http://api.cermatschool.edu.pe/up
301 https://api.cermatschool.edu.pe/up
$ curl -sI https://www.cermatschool.edu.pe   -> HTTP/1.1 200 OK
$ curl -sI https://api.cermatschool.edu.pe/up -> HTTP/1.1 200 OK

$ curl -s -o /dev/null -w "%{http_code}\n" https://cermatschool.edu.pe/.env
403
$ curl -s -o /dev/null -w "%{http_code}\n" https://api.cermatschool.edu.pe/.env
403

$ openssl s_client -connect cermatschool.edu.pe:443 -servername cermatschool.edu.pe \
    | openssl x509 -noout -issuer -enddate -ext subjectAltName
issuer=C=US, O=Let's Encrypt, CN=YE1
notAfter=Jan 15 22:22:21 2027 GMT
X509v3 Subject Alternative Name: cermatschool.edu.pe, www.cermatschool.edu.pe
(api.cermatschool.edu.pe: issuer CN=YE2; notAfter=Jan 15 22:10:57 2027 GMT; SAN api.cermatschool.edu.pe)

$ openssl s_client -connect cermatschool.edu.pe:443 -tls1 -cipher 'DEFAULT@SECLEVEL=0'
... tlsv1 alert protocol version ... SSL alert number 70     (igual con -tls1_1 y en api)
$ openssl s_client -connect cermatschool.edu.pe:443 -tls1_2   -> TLSv1.2, Cipher is ECDHE-ECDSA-AES256-GCM-SHA384
$ openssl s_client -connect cermatschool.edu.pe:443 -tls1_3   -> TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384

$ nslookup -type=NS cermatschool.edu.pe
cermatschool.edu.pe  nameserver = NS.RCP.NET.pe
cermatschool.edu.pe  nameserver = NS2.RCP.NET.pe
$ nslookup -type=MX cermatschool.edu.pe
MX preference = 1  ASPMX.L.GOOGLE.COM · 5 ALT1/ALT2.ASPMX.L.GOOGLE.COM · 10 ALT3/ALT4.ASPMX.L.GOOGLE.COM
$ nslookup -type=CNAME www.cermatschool.edu.pe
www.cermatschool.edu.pe  canonical name = cermatschool.edu.pe

DNS sobre HTTPS (dns.google): CAA sin respuesta · DS sin respuesta (AD=false) ·
TXT: 2 registros, ninguno es SPF · _dmarc: sin registro DMARC

$ curl -sI http://academia-school-platform.vercel.app
HTTP/1.0 308 Permanent Redirect
Location: https://academia-school-platform.vercel.app/
$ curl -sI https://academia-school-platform.vercel.app
HTTP/1.1 200 OK
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
(sin X-Content-Type-Options, protección contra framing ni Referrer-Policy)
$ openssl ... academia-school-platform.vercel.app
issuer=C=US, O=Google Trust Services, CN=WR1 · notAfter=Nov 27 19:48:08 2026 GMT · SAN *.vercel.app
TLS 1.2: ECDHE-RSA-AES128-GCM-SHA256 · TLS 1.3: TLS_AES_128_GCM_SHA256 · TLS 1.0/1.1: sin negociación
```

**Verificación posterior (2026-10-24).** Después del endurecimiento de la sección 4.3, el colegio responde con 5 de 5 cabeceras de seguridad y `Server: nginx` sin versión, y la SPA con las cabeceras de `vercel.json` (PR-10 conforme). Los subdominios de la academia responden por HTTPS con un certificado de Let's Encrypt vigente hasta el 2027-01-23 (PR-38 y PR-39). El detalle está en el manual de despliegue de la plataforma (§7.2 y §9.5).

## Rúbrica de evaluación

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

Escala: Excelente 4, Logrado 3, En proceso 2, Insuficiente 1 y No evidenciado 0. Puntaje = peso × (nivel / 4).

**Dónde se evidencia cada criterio**

| Criterio | Secciones |
|---|---|
| 1 | 2 |
| 2 | 3 |
| 3 | 4 y 5 |
| 4 | 6 |
| 5 | 7 |
| 6 | 8 y Anexo A |
| 7 | 9, 10 y Anexo B |
| 8 | Exposición ante el jurado (pendiente) |
