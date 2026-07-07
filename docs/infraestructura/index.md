# C. Área de Infraestructura Tecnológica (CE03)

!!! abstract "Competencia CE03"
    Diseña y ejecuta proyectos de infraestructura tecnológica para contribuir en la solución de problemas de la organización siguiendo estándares internacionales y presenta formalmente sus resultados demostrando una actitud ética de la ACM.

## Objeto de diseño

La Plataforma CERMAT usa una **arquitectura técnica híbrida** (ver [Brief EPE](../brief-epe.md#7-enfoque-de-solucion)): una capa cloud (Firebase) para la operación web en tiempo real, y una capa **local**, on-premise, en la sede principal de Academia La Prepa Cermat (Azángaro), que aloja:

- La API REST complementaria (Node.js + Express).
- La base de datos relacional complementaria (MySQL) para reportes y continuidad operativa.
- El servicio de analítica (Python + FastAPI).
- El gestor de procesos y respaldos automáticos (PM2 + backups).

Esa capa local **es** el objeto de este proyecto de infraestructura: necesita una red que la conecte de forma segura con los equipos administrativos de la sede, un plan de seguridad de la información, y un pequeño centro de datos (rack/cuarto de servidores) que la aloje con disponibilidad y continuidad adecuadas al tamaño real de la institución (una academia privada de educación básica, no una empresa de gran escala).

## Competencia de Infraestructura Tecnológica

| Sub-competencia | Descripción |
|---|---|
| **CE031 — Conectividad** | Diseña, implementa y valida infraestructuras de red organizacionales, asegurando segmentación, disponibilidad, rendimiento y cumplimiento de normas de conectividad. |
| **CE032 — Gestión de la Seguridad de la Información** | Planifica e implementa controles de seguridad basados en estándares internacionales (ISO 27001, NIST), gestionando riesgos, continuidad operativa y mejora continua. |
| **CE033 — Implementación de Centro de Datos** | Diseña y despliega servicios de infraestructura y centro de datos, integrando virtualización, almacenamiento, alta disponibilidad y monitoreo. |

## Entregables

| # | Entregable | Sub-competencias | Semestre |
|---|---|---|---|
| 1 | [Diseño de Red](e1-diseno-red-ce0311.md) | CE0311 | 1 |
| 2 | [Planificación de Seguridad](e2-planificacion-seguridad-ce0321.md) | CE0321 | 1 |
| 3 | [Diseño de Centro de Datos](e3-diseno-centro-datos-ce0331.md) | CE0331 | 1 |
| 4 | [Implementación y Testing de Red](e4-implementacion-testing-red-ce0312-ce0313.md) | CE0312, CE0313 | 2 |
| 5 | [Implementación, Monitoreo y Ética de Seguridad](e5-implementacion-monitoreo-etica-ce0322-ce0324.md) | CE0322, CE0323, CE0324 | 2 |
| 6 | [Implementación y Control de Centro de Datos](e6-implementacion-control-cd-ce0332-ce0333.md) | CE0332, CE0333 | 2 |

!!! note "Alcance declarado"
    Este proyecto documenta el **diseño y plan de implementación** de la infraestructura de red, seguridad y centro de datos que soporta la capa local de la Plataforma CERMAT. Se dimensiona de forma realista para una sede educativa (no una empresa de gran escala), y se declara explícitamente qué partes están **implementadas** (los servicios de software: API, MySQL, PM2) y cuáles son **diseño/plan de implementación física** (red, rack, controles físicos de seguridad).
