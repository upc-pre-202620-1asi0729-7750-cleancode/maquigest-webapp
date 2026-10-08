<div align="center">
  <img src="public/maquigest-logo.png" alt="MaquiGest" width="280">

# MaquiGest — Web Application

**Plataforma web para la gestión del alquiler de maquinaria de construcción**

**CleanCode** · Aplicaciones Open Source · UPC · NRC 7750

[Landing Page](https://github.com/upc-pre-202620-1asi0729-7750-cleancode/maquigest-website) · [Informe del proyecto](https://github.com/upc-pre-202620-1asi0729-7750-cleancode/maquigest-report) · [Historial de commits](https://github.com/upc-pre-202620-1asi0729-7750-cleancode/maquigest-webapp/commits/develop/)
</div>

---

## Descripción

**MaquiGest** es una aplicación web orientada a pequeñas y medianas empresas que participan en el alquiler de maquinaria de construcción. Centraliza el registro y la consulta de equipos, las solicitudes de alquiler, el seguimiento de operaciones, los planes de suscripción y la gestión del mantenimiento.

El proyecto separa las responsabilidades por *bounded contexts*, siguiendo principios de **Domain-Driven Design (DDD)**. Utiliza **Angular**, **TypeScript** y una **Fake API basada en JSON Server** para el desarrollo y las pruebas locales.

> **Estado:** primera versión `v1.0.0` en preparación. El frontend funciona con una API de desarrollo local; el despliegue público completo requiere configurar un backend accesible desde Internet.

## Funcionalidades

| Contexto | Funcionalidades principales |
|---|---|
| **IAM** | Registro, inicio y cierre de sesión, persistencia de sesión, guards de navegación y control de acceso por roles. |
| **Profiles** | Consulta y edición de perfiles de empresa. |
| **Inventory** | Registro y actualización de maquinaria, categorías, detalle, búsqueda y consulta de disponibilidad. |
| **Rentals** | Solicitudes de alquiler, aprobación o rechazo, consulta de solicitudes, alquileres activos, entregas y devoluciones. |
| **Subscriptions** | Consulta y gestión de planes, suscripciones y restricciones de acceso a funcionalidades. |
| **Maintenance** | Registro y programación de mantenimientos; reporte, seguimiento y resolución de incidencias. |
| **Shared** | Componentes compartidos, navegación, manejo de errores e internacionalización en español e inglés. |

### Flujos de negocio implementados

- **US20–US22 — Rentals:** consulta de alquileres activos, seguimiento de solicitudes, entregas y devoluciones.
- **US23–US24 — Maintenance:** registro y programación de mantenimientos de equipos.
- **US25 — Equipment Incidents:** registro de incidencias, bloqueo de disponibilidad cuando corresponda, resolución y reactivación bajo validaciones de negocio.
- **Sincronización entre contextos:** consultas y operaciones coordinadas mediante puertos y adaptadores ACL para evitar dependencias directas entre módulos.

> Las restricciones implementadas en el frontend y en la Fake API son apropiadas para desarrollo y demostración. No sustituyen controles de autenticación, autorización y concurrencia de un backend productivo.

## Tecnologías

- **Angular 22** y **TypeScript 6**.
- **Angular Material / CDK** para componentes de interfaz.
- **Angular Router**, formularios reactivos y **Signals** para navegación y estado.
- **HttpClient** para comunicación HTTP.
- **ngx-translate** para español (`es`) e inglés (`en`).
- **JSON Server 0.17** como API REST simulada.
- **Vitest** para pruebas unitarias mediante Angular CLI.
- **Git, GitHub y GitFlow** para control de versiones.

## Arquitectura

Cada *bounded context* organiza el código por responsabilidades: `domain`, `infrastructure`, `application` y `presentation`. Los módulos se comunican mediante contratos y adaptadores cuando necesitan datos de otro contexto.

```text
maquigest-webapp/
├── public/
│   ├── i18n/                    # Traducciones es/en
│   ├── maquigest-logo.png
│   └── maquigest-symbol.png
├── server/
│   ├── db.json                  # Datos de demostración de la Fake API
│   └── routes.json              # Reescritura de rutas /api/v1
├── src/
│   ├── app/
│   │   ├── iam/
│   │   ├── profiles/
│   │   ├── inventory/
│   │   ├── rentals/
│   │   ├── subscriptions/
│   │   ├── maintenance/
│   │   ├── shared/
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   └── environments/
│       ├── environment.ts
│       └── environment.development.ts
├── angular.json
├── package.json
└── README.md
```

### Principios de diseño

1. **Domain:** entidades, objetos de valor, enumeraciones y reglas del negocio.
2. **Infrastructure:** endpoints HTTP, ensambladores, contratos y adaptadores de integración.
3. **Application:** stores y coordinación de casos de uso.
4. **Presentation:** vistas, formularios, componentes y rutas.

Se emplean **ports** y **Anti-Corruption Layers (ACL)** para integrar Inventory, Rentals, Maintenance, Profiles y Subscriptions sin acoplar directamente sus modelos de dominio.

## Requisitos

- **Node.js** en una versión compatible con Angular 22.
- **npm** (el proyecto declara `npm@11.19.0`).
- **Git** y un editor de código, como Visual Studio Code o IntelliJ IDEA.

## Instalación y ejecución local

### 1. Clonar el repositorio

```powershell
git clone https://github.com/upc-pre-202620-1asi0729-7750-cleancode/maquigest-webapp.git
cd maquigest-webapp
git switch develop
npm ci
```

### 2. Iniciar la Fake API

En una primera terminal PowerShell:

```powershell
npx json-server --watch server/db.json --routes server/routes.json --port 3000
```

La API de desarrollo se expone en `http://localhost:3000/api/v1` mediante las reglas definidas en `server/routes.json`.

### 3. Iniciar Angular

En una segunda terminal PowerShell:

```powershell
npm start
```

Abrir **http://localhost:4200** en el navegador.

**Nota:** los datos de `server/db.json` se pueden modificar durante las pruebas. Es recomendable guardar una copia antes de probar operaciones de escritura; no publicar credenciales reales ni información sensible en este archivo.

## Rutas principales

| Ruta | Descripción |
|---|---|
| `/iam/sign-in` | Inicio de sesión. |
| `/iam/sign-up` | Registro de cuenta. |
| `/dashboard` | Panel principal. |
| `/profiles/profile` | Perfil de empresa. |
| `/inventory/equipment` | Inventario de maquinaria. |
| `/inventory/search` | Búsqueda de equipos. |
| `/rentals/requests` | Gestión de solicitudes de alquiler. |
| `/rentals/active` | Alquileres activos. |
| `/rentals/my-requests` | Seguimiento de solicitudes propias. |
| `/maintenance` | Gestión de mantenimientos. |
| `/maintenance/incidents` | Gestión de incidencias. |
| `/subscriptions/plans` | Planes y suscripciones. |

La disponibilidad de las rutas y operaciones depende de la sesión, el rol y las restricciones de acceso del módulo correspondiente.

## Compilación y pruebas

```powershell
# Generar la compilación de producción
npm run build

# Ejecutar las pruebas unitarias
npm test
```

El resultado compilado se genera en `dist/`. Un build satisfactorio no implica que la API esté lista para producción: son comprobaciones distintas.

## Configuración de la API

Los endpoints se configuran en:

- `src/environments/environment.development.ts`: URL base local `http://localhost:3000/api/v1`.
- `src/environments/environment.ts`: configuración de producción, pendiente de apuntar a una API pública operativa.
- `server/routes.json`: reglas de reescritura utilizadas con JSON Server.

**Para publicar en Vercel:** configurar una API HTTPS accesible, revisar la URL base en producción, habilitar el CORS necesario en la API y asegurar el fallback de rutas de la SPA. **Vercel no ejecutará automáticamente el JSON Server local del proyecto.**

## Flujo de trabajo GitFlow

```text
feature/* ──> develop ──> release/1.0.0 ──> main
                 ^               |
                 └───────────────┘
                           tag: v1.0.0 (al publicar)
```

- `feature/*`: implementación de historias de usuario y correcciones.
- `develop`: integración continua del equipo.
- `release/1.0.0`: preparación y validación de la primera versión.
- `main`: versión estable destinada a publicación.
- `v1.0.0`: tag que se creará cuando la release esté validada.

Consultar los autores y commits registrados en `develop`:

```powershell
git shortlog -sne origin/develop
git log origin/develop --no-merges --format="%h | %an <%ae> | %s"
git log origin/develop --first-parent --merges --oneline
```

## Equipo — CleanCode

| Integrante / identidad Git | GitHub |
|---|---|
| James Delgado | [@JAmsy06](https://github.com/JAmsy06) |
| Bruno | [@TartaroZ](https://github.com/TartaroZ) |
| Miroslav | [@Miroa123](https://github.com/Miroa123) |
| Carlos | [@CarlossUPC](https://github.com/CarlossUPC) |
| Eshnikeee | [@Eshnikeee](https://github.com/Eshnikeee) |

La relación de autores de cada commit puede consultarse directamente en el [historial de `develop`](https://github.com/upc-pre-202620-1asi0729-7750-cleancode/maquigest-webapp/commits/develop/).

## Repositorios relacionados

- [MaquiGest — Landing Page](https://github.com/upc-pre-202620-1asi0729-7750-cleancode/maquigest-website)
- [MaquiGest — Informe académico](https://github.com/upc-pre-202620-1asi0729-7750-cleancode/maquigest-report)

---

<div align="center">
  <strong>MaquiGest · CleanCode · Universidad Peruana de Ciencias Aplicadas</strong>
</div>
