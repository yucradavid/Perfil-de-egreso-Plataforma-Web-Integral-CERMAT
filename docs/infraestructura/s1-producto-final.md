# Producto Final S1 · Diseño Técnico Consolidado de Infraestructura Híbrida

!!! abstract "Expediente único del Semestre 1"
    Integra los dos entregables del semestre: el diseño de red ([S1-E1](s1-e1-analisis-diseno-red-ce0311.md), CE0311) y el diseño del centro de datos híbrido ([S1-E2](s1-e2-diseno-centro-datos-hibrido-ce0331.md), CE0331). Reúne diagramas, matrices, trazabilidad de requerimientos, conclusiones, referencias IEEE, anexos cruzados y la declaración de responsabilidad ética.

## Portada

| Campo | Detalle |
|---|---|
| Título | Diseño técnico consolidado de la infraestructura híbrida de CERMAT |
| Entregable | Producto final del Semestre 1 (CE0311 + CE0331) |
| Estudiantes | David Robert Yucra Mamani (líder), Gladys Rosaura Yana Pari, Denilson Leeke Mamani Flores, Cárdenas Vilca Rennzo |
| Semestre | 2026-2 (9° ciclo), UPeU campus Juliaca, sección g1 |
| Fecha | 2026-10-24 |
| Versión | 2.0 |

**Productos**

| Producto | Formato sugerido por la guía | Entregado | Estado |
|---|---|---|---|
| Expediente consolidado | PDF consolidado | Este documento y los dos entregables enlazados; el PDF se genera desde la vista de impresión del sitio (*Documentación completa*) | Contenido entregado; exportación a PDF a cargo del equipo |
| Diagramas | Draw.io y PDF/PNG | 4 archivos draw.io (6 páginas) y diagramas Mermaid | Entregado |
| Matrices | XLSX | 3 libros con 31 componentes de red, 36 del centro de datos y 22 pruebas planeadas | Entregado |

## Resumen ejecutivo

CERMAT tiene sus servicios críticos en la nube (la plataforma de la academia en Vercel y Firebase, y el sistema del colegio en un VPS), pero la capa local de la academia corre en una PC sin perímetro ni segmentación, y el VPS no tiene un canal privado con la sede. El diseño consolidado propone:

1. **Una sede segmentada y virtualizada.** Seis VLAN con política por defecto de denegar, OPNsense con Suricata como perímetro, honeypot en la DMZ y un host Proxmox VE (equivalente a ESXi) con 7 VM: 14 vCPU, 24 GB de RAM y 47 % de la memoria del host comprometida.
2. **Una nube equivalente a AWS sin costo adicional.** El VPS existente cumple el papel de EC2, UFW el de Security Group, una red interna 10.20.0.0/24 el de subred privada y strongSwan el de VPN Gateway.
3. **Una integración híbrida cifrada.** Un túnel IPsec IKEv2 con AES-256-GCM y PFS da respaldo cruzado 3-2-1, administración sin exponer SSH, telemetría hacia Wazuh y publicación de la API de la academia.
4. **Continuidad definida.** Cada servicio tiene RTO/RPO, mecanismo de recuperación y prueba asignada para el Semestre 2.

El diseño es **verificable**: cada componente tiene un ID (NET-xx, CD-xx) que aparece en las matrices y en los diagramas, y cada requisito se traza a un elemento de diseño y a una prueba (sección 6).

## 1. Índice del expediente

| Parte | Documento | Secciones principales |
|---|---|---|
| Diseño de red | [S1-E1 · CE0311](s1-e1-analisis-diseno-red-ce0311.md) | Organización y requisitos (2 a 6), topología general y lógica (7 y 8), zonas y perímetro (9 y 13), VPN (10), flujos (11), componentes (12), detección (14) |
| Diseño del centro de datos híbrido | [S1-E2 · CE0331](s1-e2-diseno-centro-datos-hibrido-ce0331.md) | On-premise (5), hipervisor (6), nube y equivalencias AWS (7), integración (8), componentes (9), dimensionamiento (10), continuidad (11) |
| Equivalencias y reglas comunes | [Resumen del área](index.md) | Codificación, reglas comunes y tabla de equivalencias |
| Este expediente | Producto final S1 | Trazabilidad, coherencia, referencias, anexos cruzados y declaración ética |

## 2. Síntesis del diseño de red

| Aspecto | Decisión | Detalle |
|---|---|---|
| Segmentación | 6 VLAN y una red de nube | ADMIN 10, ACAD 20, GUEST 30, SRV 40, DMZ 50, MGMT 99 y NUBE 10.20.0.0/24 |
| Direccionamiento | Jerárquico por sede (RFC 1918) | 10.10.0.0/16 para la sede principal; 10.11 y 10.12 reservadas; 10.20.0.0/16 para la nube |
| Ruteo | Router-on-a-stick en OPNsense | Grupo de gateways WAN1 → WAN2; rutas IPsec por política |
| Perímetro | OPNsense con política por defecto de denegar | 35 reglas con ID; NAT solo hacia el honeypot |
| VPN | IPsec IKEv2 sitio a sitio | AES-256-GCM, PRF SHA-256, DH 20/19, PFS, certificados y NAT-T |
| Detección | Suricata, Cowrie y Wazuh | IPS en las WAN, IDS interno, señuelo en la DMZ y correlación central |
| Flujos | 22 flujos documentados | Origen, destino, protocolo, puerto, ruta y estado |

## 3. Síntesis del diseño del centro de datos híbrido

| Aspecto | Decisión | Detalle |
|---|---|---|
| Sitio on-premise | Rack de 12U, Tier I con elementos de Tier II | UPS con NUT, doble WAN y espejo de discos |
| Hipervisor | Proxmox VE (equivalente a ESXi) | `vmbr0` VLAN-aware sobre `bond0` LACP; `vmbr1` y `vmbr2` para las WAN |
| VM | 7 VM | Firewall, aplicaciones, SIEM, monitoreo, respaldo, honeypot y bastión |
| Capacidad | 64 GB ECC, 2×1 TB SSD en espejo y 4 TB HDD | 47 % de RAM y 38 % de disco comprometidos |
| Nube IaaS | VPS de RackNerd (equivalente a EC2) | UFW como Security Group; NACL con nftables; `dum0` como subred privada |
| Nube PaaS | Vercel y Firebase | Vía crítica de la operación académica |
| Continuidad | Regla 3-2-1 con copias cruzadas sede ↔ nube | RTO/RPO por servicio; 12 pruebas de recuperación previstas |

## 4. Diagramas

| Diagrama | Archivo editable | Páginas | Secciones donde se explica |
|---|---|---|---|
| Topología general híbrida | [topologia-general-hibrida.drawio](../assets/infraestructura/diagramas/topologia-general-hibrida.drawio) | 1 | S1-E1 §7 |
| Topología lógica (VLAN y subredes) | [topologia-logica-vlan.drawio](../assets/infraestructura/diagramas/topologia-logica-vlan.drawio) | 1 | S1-E1 §8 |
| Zonas de seguridad y VPN | [zonas-seguridad-vpn.drawio](../assets/infraestructura/diagramas/zonas-seguridad-vpn.drawio) | 1 | S1-E1 §9 y §10 |
| Arquitectura del centro de datos híbrido | [arquitectura-centro-datos-hibrido.drawio](../assets/infraestructura/diagramas/arquitectura-centro-datos-hibrido.drawio) | 3 (rack y física, hipervisor, nube) | S1-E2 §5 a §7 |

## 5. Matrices

| Matriz | Archivo | Hojas |
|---|---|---|
| Componentes de red | [s1-e1-matriz-componentes-red.xlsx](../assets/infraestructura/s1-e1-matriz-componentes-red.xlsx) | Componentes, VLAN y subredes, matriz de zonas, reglas OPNsense, reglas UFW, flujos y requisitos |
| Pruebas de conectividad planeadas | [s1-e1-matriz-pruebas-conectividad.xlsx](../assets/infraestructura/s1-e1-matriz-pruebas-conectividad.xlsx) | 22 pruebas con resultado esperado y regla asociada |
| Componentes y dimensionamiento del CD | [s1-e2-matriz-componentes-dimensionamiento.xlsx](../assets/infraestructura/s1-e2-matriz-componentes-dimensionamiento.xlsx) | Componentes, VM, capacidad, crecimiento, RAM del VPS, supuestos y RTO/RPO |

Las tres se generan con `perfil-egreso/scripts/generar-matrices-infra.mjs`, que contiene los mismos datos que las tablas de los informes.

## 6. Trazabilidad de requerimientos

| ID | Tipo | Requisito | Elemento de diseño | Sección | Verificación (S2) |
|---|---|---|---|---|---|
| RQ-01 | Organizacional | Datos de alumnos y pagos accesibles solo por roles autorizados | Zonas SRV y MGMT aisladas; reglas por rol en la capa PaaS | S1-E1 §8, §9 | PC-03, PC-04 |
| RQ-02 | Técnico | Separar el tráfico de invitados del administrativo y de los servidores | VLAN 30, FW-02 y aislamiento de clientes | S1-E1 §8 | PC-06, PC-08 |
| RQ-03 | Técnico | Gestión de la infraestructura solo desde estaciones autorizadas | VLAN 99, alias ADMIN_TI y bastión | S1-E1 §8, §13 | PC-04, PC-05 |
| RQ-04 | Técnico | Ningún servicio interno expuesto a Internet, salvo el señuelo | FW-61; NAT solo al honeypot; API publicada por el VPS | S1-E1 §9, §13 | PC-02, PC-14 |
| RQ-05 | Organizacional | Matrícula y pagos continúan ante una falla de la sede | Servicios críticos en PaaS; enlace WAN2 | S1-E2 §11 | PC-16, REC-10 |
| RQ-06 | Técnico | Canal cifrado sede ↔ nube para respaldos y administración | IPsec IKEv2, AES-256-GCM, PFS | S1-E1 §10 | PC-11, PC-12, PC-13 |
| RQ-07 | Técnico | Respaldos 3-2-1 con restauración verificada | PBS, VPS y disco externo; restore.js | S1-E2 §11 | REC-01 a REC-12 |
| RQ-08 | Técnico | Detección de ataques y trazabilidad de eventos | Suricata, Cowrie y Wazuh | S1-E1 §14 | PC-17, PC-18, PC-19 |
| RQ-09 | Técnico | Alertas de disponibilidad de los servicios | Uptime Kuma con latido externo | S1-E2 §11 | PC-20 |
| RQ-10 | Técnico | Capacidad con margen ≥ 30 % para crecimiento | Host de 64 GB (47 % comprometido); presupuesto de RAM del VPS | S1-E2 §10 | Medición en S2-E3 §9 |
| RQ-11 | Organizacional | Cumplimiento de la Ley N.° 29733 (datos de menores) | Clasificación, cifrado en tránsito, mínimo privilegio | S2-E1 | Auditoría interna |
| RQ-12 | Técnico | Administración del VPS solo por canal cifrado y restringido | UFW-08, UFW-09 y bastión | S1-E1 §13 | PC-15 |
| RQ-13 | Organizacional | Costo de licencias mínimo | Software libre: Proxmox VE, OPNsense, Wazuh, Suricata, Cowrie y strongSwan | S1-E2 §4, §7 | Revisión de licencias |
| RQ-14 | Técnico | Escalable a nuevas sedes | Bloque 10.x.0.0/16 por sede; el VPS como concentrador VPN | S1-E1 §15 | — |
| RQ-15 | Técnico | Réplica relacional disponible 24/7 | VM-APP01 y proxy en el VPS | S1-E2 §8 | PC-14, PC-20 |

Cada requisito (RQ-xx) se origina en las necesidades de la organización (S1-E1 §2), se resuelve en un elemento de diseño y se verifica con una prueba que se ejecuta en el Semestre 2 ([S2-E2](s2-e2-implementacion-red-ce0312-ce0313.md) y [S2-E3](s2-e3-implementacion-control-cd-ce0332-ce0333.md)).

## 7. Coherencia entre el diseño de red y el del centro de datos

| Elemento de red (S1-E1) | Elemento del centro de datos (S1-E2) | Comprobación |
|---|---|---|
| NET-04 OPNsense | CD-11 VM-FW01 con `vmbr1`, `vmbr2` y troncal en `vmbr0` | Las interfaces de §13.2 coinciden con las redes virtuales de §6.2 |
| VLAN 10, 20, 30, 40, 50 y 99 | `bridge-vids` de `vmbr0` y etiquetas de las VM | Cada VM tiene la etiqueta de su zona |
| NET-13 a NET-17 y NET-12 | CD-12 a CD-17 | Mismas direcciones y roles |
| NET-27 túnel IPsec | CD-28 strongSwan + `dum0` y CD-35 | Mismas redes anunciadas (10.10.40.0/24 y 10.10.99.0/27 ↔ 10.20.0.0/24) |
| Reglas UFW-01 a UFW-10 | CD-24 UFW (Security Group) | El Security Group equivalente aplica las reglas del diseño de red |
| Flujos F-10 y F-11 (respaldo) | Regla 3-2-1 de S1-E2 §11.2 | Copias cruzadas por el túnel |
| Flujos F-03 y F-04 (API) | Integración por proxy inverso (S1-E2 §8) | La API se publica por el VPS sin exponer la sede |

## 8. Conclusiones

1. El diseño responde al problema real de CERMAT: servicios críticos en la nube sin perímetro en la sede y sin canal privado entre la sede y el VPS.
2. La equivalencia técnica con VMware ESXi y AWS se mantiene elemento por elemento, con costo de licencias cero y reutilizando el VPS existente.
3. La trazabilidad RQ → diseño → prueba permite que el jurado verifique en el Semestre 2 si cada decisión se cumplió.
4. Las limitaciones están declaradas: el hardware on-premise está por adquirir, el tipo de IP de la sede está por confirmar y las cifras de carga son supuestos a validar.

## 9. Referencias

[1] ISO/IEC 27001:2022, *Information security, cybersecurity and privacy protection — Information security management systems — Requirements*. Ginebra, Suiza: ISO, 2022.

[2] C. Kaufman, P. Hoffman, Y. Nir, P. Eronen y T. Kivinen, "Internet Key Exchange Protocol Version 2 (IKEv2)," RFC 7296, IETF, oct. 2014.

[3] J. Viega y D. McGrew, "The Use of Galois/Counter Mode (GCM) in IPsec Encapsulating Security Payload (ESP)," RFC 4106, IETF, jun. 2005.

[4] A. Huttunen, B. Swander, V. Volpe, L. DiBurro y M. Stenberg, "UDP Encapsulation of IPsec ESP Packets," RFC 3948, IETF, ene. 2005.

[5] Y. Rekhter, B. Moskowitz, D. Karrenberg, G. J. de Groot y E. Lear, "Address Allocation for Private Internets," RFC 1918, IETF, feb. 1996.

[6] E. Barker, Q. Dang, S. Frankel, K. Scarfone y P. Wouters, "Guide to IPsec VPNs," NIST SP 800-77 Rev. 1, jun. 2020.

[7] K. Scarfone y P. Hoffman, "Guidelines on Firewalls and Firewall Policy," NIST SP 800-41 Rev. 1, sep. 2009.

[8] K. Scarfone y P. Mell, "Guide to Intrusion Detection and Prevention Systems (IDPS)," NIST SP 800-94, feb. 2007.

[9] M. Swanson, P. Bowen, A. W. Phillips, D. Gallup y D. Lynes, "Contingency Planning Guide for Federal Information Systems," NIST SP 800-34 Rev. 1, may. 2010.

[10] *IEEE Standard for Local and Metropolitan Area Networks—Bridges and Bridged Networks*, IEEE Std 802.1Q-2022, 2022.

[11] *IEEE Standard for Local and Metropolitan Area Networks—Link Aggregation*, IEEE Std 802.1AX-2020, 2020.

[12] *Balanced Twisted-Pair Telecommunications Cabling and Components Standard*, ANSI/TIA-568.2-D, 2018.

[13] *Telecommunications Infrastructure Standard for Data Centers*, ANSI/TIA-942-B, 2017.

[14] Uptime Institute, "Tier Standard: Topology," Uptime Institute, 2018.

[15] ASHRAE TC 9.9, *Thermal Guidelines for Data Processing Environments*, 5.ª ed. Atlanta, GA, EE. UU.: ASHRAE, 2021.

[16] Proxmox Server Solutions GmbH, "Proxmox VE Administration Guide." [En línea]. Disponible en: https://pve.proxmox.com/pve-docs/

[17] Deciso B.V., "OPNsense Documentation." [En línea]. Disponible en: https://docs.opnsense.org/

[18] strongSwan Project, "swanctl.conf Reference." [En línea]. Disponible en: https://docs.strongswan.org/

[19] Wazuh Inc., "Wazuh Documentation." [En línea]. Disponible en: https://documentation.wazuh.com/

[20] Amazon Web Services, "Amazon VPC User Guide." [En línea]. Disponible en: https://docs.aws.amazon.com/vpc/

[21] Association for Computing Machinery, "ACM Code of Ethics and Professional Conduct," 2018. [En línea]. Disponible en: https://www.acm.org/code-of-ethics

## 10. Anexos cruzados

| Anexo | Contenido | Ubicación |
|---|---|---|
| A | Matriz de pruebas de conectividad planeadas | S1-E1, Anexo A, y [XLSX](../assets/infraestructura/s1-e1-matriz-pruebas-conectividad.xlsx) |
| B | Diagramas editables de red | S1-E1, Anexo B |
| C | Estándares aplicados a la red | S1-E1, Anexo C |
| D | Diagrama editable del centro de datos (3 páginas) | S1-E2, Anexo A |
| E | Matriz de componentes y dimensionamiento | S1-E2, Anexo B, y [XLSX](../assets/infraestructura/s1-e2-matriz-componentes-dimensionamiento.xlsx) |
| F | Supuestos con estado y fuente | S1-E2 §10.6 |
| G | Equivalencias tecnológicas | [Resumen del área](index.md) |
| H | Continuidad en la implementación | [S2-E3](s2-e3-implementacion-control-cd-ce0332-ce0333.md) |

## 11. Declaración de responsabilidad ética

Los integrantes del equipo declaramos, conforme al Código de Ética y Conducta Profesional de la ACM:

1. **Veracidad (ACM 1.3).** Este diseño distingue lo existente de lo propuesto. Las cifras no medidas figuran como supuestos a validar, con su fuente, y no se presentan resultados que no se hayan obtenido.
2. **Evitar daño y proteger la privacidad (ACM 1.2 y 1.6).** El diseño prioriza la protección de los datos de menores y apoderados: segmentación, cifrado y mínimo privilegio.
3. **Confidencialidad (ACM 1.7).** La documentación no contiene contraseñas, llaves, tokens, IP públicas, correos ni datos personales; los indicadores de uso son conteos agregados.
4. **Acceso autorizado (ACM 2.8).** Las pruebas previstas se ejecutarán solo sobre infraestructura propia de CERMAT y con autorización escrita de la Dirección.
5. **Sistemas robustos y seguros (ACM 2.9).** Las decisiones de diseño se justificaron con estándares (ISO/IEC 27001, NIST, IEEE, TIA) y se declararon sus riesgos residuales.
6. **Autoría.** El contenido es trabajo del equipo; las fuentes externas se citan en formato IEEE.

| Integrante | Firma | Fecha |
|---|---|---|
| David Robert Yucra Mamani | Pendiente de firma | — |
| Gladys Rosaura Yana Pari | Pendiente de firma | — |
| Denilson Leeke Mamani Flores | Pendiente de firma | — |
| Cárdenas Vilca Rennzo | Pendiente de firma | — |

La declaración ampliada de ética de seguridad del Semestre 2 está en [S2-E1 §12](s2-e1-sgsi-ce0321-ce0324.md).

## Rúbricas aplicables

La guía no define una rúbrica propia para el producto final del Semestre 1; se evalúa con las rúbricas de los entregables que integra.

**S1-E1 · CE0311 — Análisis y Diseño de Red**

| N° | Criterio de evaluación | Peso |
| ---: | --- | ---: |
| 1 | Contexto y alcance del diseño de red | 10% |
| 2 | Arquitectura lógica de red: VLAN, subredes y direccionamiento | 20% |
| 3 | Diseño de conectividad híbrida (VPN) | 15% |
| 4 | Diseño de seguridad perimetral: firewall, DMZ y segmentación | 20% |
| 5 | Diseño de detección: IDS/IPS y honeypot (planificación) | 10% |
| 6 | Diagrama de flujo de información y matriz de componentes | 10% |
| 7 | Calidad documental y trazabilidad del diseño | 8% |
| 8 | Sustentación del diseño | 7% |
|  | **Total** | **100%** |

**S1-E2 · CE0331 — Análisis y Diseño de Centro de Datos Híbrido**

| N° | Criterio de evaluación | Peso |
| ---: | --- | ---: |
| 1 | Contexto y alcance del diseño de infraestructura | 8% |
| 2 | Diseño de arquitectura on-premise (VMware ESXi) | 22% |
| 3 | Diseño de arquitectura AWS | 22% |
| 4 | Mecanismo de integración híbrida | 10% |
| 5 | Dimensionamiento, capacidad y justificación técnica | 12% |
| 6 | Matriz de componentes y trazabilidad | 10% |
| 7 | Disponibilidad y continuidad en el diseño | 8% |
| 8 | Calidad documental y sustentación | 8% |
|  | **Total** | **100%** |

Escala: Excelente 4, Logrado 3, En proceso 2, Insuficiente 1 y No evidenciado 0. Puntaje = peso × (nivel / 4).
