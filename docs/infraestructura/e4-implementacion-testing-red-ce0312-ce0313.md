# Entregable 4 (Semestre 2): Implementación y Testing de Red (CE0312-CE0313)

## Portada

| Campo | Detalle |
|---|---|
| Título | Implementación y testing de red — Sede principal CERMAT |
| Competencias | CE0312 (implementación de red), CE0313 (testing y control de red) |
| Semestre | 2 |
| Integrantes | David Robert Yucra Mamani (líder), Gladys Rosaura Yana Pari, Denilson Leeke Mamani Flores, Cárdenas Vilca Rennzo |
| Ciclo académico | 9° ciclo |
| Fecha | 2026-07-06 |

!!! warning "Estado de la evidencia"
    Este documento define la **configuración a implementar** y el **protocolo de pruebas** para el diseño de red del Entregable 1. Las capturas de pantalla, logs y resultados numéricos reales (latencia, throughput) deben adjuntarse en los anexos una vez ejecutada la implementación física en la sede — no se fabrican cifras de una red que aún no se ha desplegado.

## Resumen ejecutivo

A partir del diseño de red (VLAN 10/20/30/99, doble enlace a internet, redundancia con UPS) del [Entregable 1](e1-diseno-red-ce0311.md), este documento entrega las configuraciones concretas de dispositivos, el esquema de direccionamiento a aplicar, las reglas de control de acceso, y el protocolo de pruebas que deben ejecutarse para validar la red antes de ponerla en operación.

## Sección 1: Configuración de dispositivos

Plantilla de configuración (sintaxis genérica tipo Cisco/MikroTik, a adaptar al fabricante real del equipo adquirido):

```text
! --- Switch core: VLAN ---
vlan 10
 name ADMINISTRACION
vlan 20
 name ACADEMICO
vlan 30
 name INVITADOS
vlan 99
 name GESTION

! --- Firewall/router perimetral: reglas de aislamiento entre VLAN ---
rule vlan30 -> any        : allow (solo salida a internet)
rule vlan30 -> vlan10     : deny
rule vlan30 -> vlan20     : deny
rule vlan20 -> vlan10:api : allow (puerto de la API REST, para registrar asistencia QR)
rule vlan20 -> vlan10:*   : deny
rule vlan10 -> any        : allow
rule any    -> vlan99     : deny except vlan10
```

## Sección 2: Implementación de direccionamiento y routing

| VLAN | Red | Gateway | Rango DHCP |
|---|---|---|---|
| 10 — Administración | 10.10.10.0/24 | 10.10.10.1 | 10.10.10.100–10.10.10.200 |
| 20 — Académico | 10.10.20.0/24 | 10.10.20.1 | 10.10.20.100–10.10.20.200 |
| 30 — Invitados | 10.10.30.0/24 | 10.10.30.1 | 10.10.30.100–10.10.30.220 |
| 99 — Gestión | 10.10.99.0/28 | 10.10.99.1 | Asignación estática únicamente |

- **Routing:** estático entre VLAN en el router perimetral (redes pequeñas y fijas no requieren protocolo dinámico como OSPF).
- **Servidor local:** IP estática dentro de VLAN 10 (fuera del rango DHCP), para que la API y el failover del enlace a internet siempre lo referencien de forma predecible.

## Sección 3: Controles de acceso y estándares

- **ACL** aplicadas exactamente como se listó en la Sección 1 (aislamiento de VLAN 30 y limitación de VLAN 20 al puerto de la API).
- **Cumplimiento:** cableado categoría 6 (TIA/EIA-568), Ethernet 802.3, Wi-Fi 802.11ac/ax para VLAN 20 y 30 con SSID y contraseña independientes.

## Sección 4: Protocolo de pruebas y monitoreo

**Pruebas a ejecutar y documentar (adjuntar evidencia real en anexos):**

1. Conectividad punto a punto entre cada VLAN según la matriz de aislamiento (`ping`/`traceroute` desde un equipo de VLAN 30 hacia VLAN 10 → debe fallar; desde VLAN 20 hacia el puerto de la API en VLAN 10 → debe responder).
2. Prueba de failover: desconectar el enlace principal (ISP1) y confirmar que el tráfico conmuta al respaldo 4G/LTE sin intervención manual, midiendo el tiempo de corte.
3. Prueba de carga básica: throughput y latencia hacia Firebase/Firestore desde un equipo de VLAN 10 en horario pico (matrícula/pagos).
4. Monitoreo continuo vía SNMP sobre el switch y el router, con alertas ante caída de un enlace o saturación de un puerto.

**Plantilla de reporte de incidencias:**

| Fecha | Dispositivo/VLAN | Síntoma | Causa | Acción correctiva |
|---|---|---|---|---|
| _(a completar durante operación real)_ | | | | |

## Anexos

- Capturas de pruebas de conectividad — *pendiente de adjuntar tras implementación física*.
- Logs de monitoreo SNMP — *pendiente de adjuntar tras implementación física*.

## Rúbrica de evaluación

*(7 criterios — máximo 28 puntos, según guía oficial de evaluación de perfil de egreso)*

| Criterio | Excelente (4) | Bueno (3) | Regular (2) |
|---|---|---|---|
| Configuración de Dispositivos | Funcional y documentada con comandos precisos. | Funcional, pero documentación parcial. | Configurada básicamente, con errores. |
| Implementación de Direccionamiento IP | Estructurado y escalable. | Básico, funcional. | Parcial, con inconsistencias. |
| Configuración de Routing | Dinámico/estático implementado con optimización. | Implementado correctamente. | Básico, sin optimización. |
| Implementación de Controles de Acceso (ACL) | Seguros y justificados. | Aplicados, pero sin justificación profunda. | Parciales. |
| Cumplimiento de Estándares | Total, con evidencias. | Parcial, con referencias. | Mínimo. |
| Pruebas de Conectividad y Rendimiento | Completas con métricas cuantitativas. | Básicas, con métricas. | Parciales. |
| Implementación de Monitoreo y Documentación | Avanzada (SNMP), profesional. | Básica, adecuada. | Simple. |
