<div align="center">
  <img src="public/maquigest-logo.png" alt="MaquiGest" width="280">

# MaquiGest — Web Application

**Plataforma web para la gestión del alquiler de maquinaria de construcción**

**CleanCode · Aplicaciones Open Source · UPC · NRC 7750**
</div>

## Descripción

MaquiGest centraliza el registro de maquinaria, las solicitudes de alquiler, las entregas y devoluciones, los mantenimientos y las suscripciones para empresas constructoras y arrendadoras. Esta aplicación Angular consume exclusivamente la API REST de [MaquiGest Platform](https://github.com/upc-pre-202620-1asi0729-7750-cleancode/maquigest-platform). No utiliza JSON Server ni una Fake API. La autenticación, autorización, persistencia y reglas de negocio definitivas se ejecutan en el backend.

## Funcionalidades

| Contexto | Funcionalidades |
|---|---|
| IAM | Registro, inicio/cierre de sesión, recuperación de contraseña, verificación de correo y recuperación de sesiones inválidas o expiradas. |
| Profiles | Consulta y edición de perfil de empresa. |
| Inventory | Registro, edición, búsqueda y disponibilidad de maquinaria. |
| Rentals | Solicitudes, cambios de periodo, aprobación/rechazo, alquileres activos, entregas y devoluciones; búsqueda geográfica opcional. |
| Maintenance | Mantenimiento, programación, seguimiento, incidencias e historial. |
| Subscriptions | Planes, restricciones por suscripción y redirección a Stripe Checkout de prueba con reconciliación de pago. |
| Shared | Layout, dashboard, navegación, traducciones, manejo de errores y bandeja unificada de notificaciones de los seis contextos. |

## Tecnologías y arquitectura

Angular 22, TypeScript 6, Angular Material/CDK, Router, formularios reactivos, Signals, HttpClient, RxJS, ngx-translate (es/en) y Vitest. El código se organiza en `src/app/{iam,profiles,inventory,rentals,maintenance,subscriptions,shared}`. Los módulos separan dominio (modelos y reglas), infraestructura (contratos HTTP, endpoints y ensambladores), aplicación (servicios/stores) y presentación (vistas, componentes y rutas), según corresponda. `shared` contiene componentes transversales; no reemplaza a los propietarios de las notificaciones en el backend. Los guards y controles visuales no sustituyen la autorización del servidor.

## Instalación local

Requisitos verificados: Node.js 24.21.0, npm 11.19.0 y Git. Iniciar primero el backend con MySQL según su README. Después:

```powershell
git clone https://github.com/upc-pre-202620-1asi0729-7750-cleancode/maquigest-webapp.git
cd maquigest-webapp
git switch develop
npm ci
npm start
```

Abrir `http://localhost:4200`. La API utiliza `/api/v1` en ambos entornos. `proxy.conf.json` reenvía las peticiones de desarrollo a `http://127.0.0.1:8080`; no se necesita una segunda API simulada. Usar una cuenta registrada en el backend real. Las integraciones externas dependen de las variables configuradas en el backend.

## Rutas principales

| Ruta | Funcionalidad |
|---|---|
| `/iam/sign-in`, `/iam/sign-up` | Autenticación y registro. |
| `/iam/recover-password`, `/iam/reset-password`, `/iam/verify-email` | Recuperación y verificación. |
| `/dashboard`, `/profiles/profile` | Panel y perfil. |
| `/inventory/equipment`, `/inventory/search` | Inventario y búsqueda. |
| `/rentals/requests`, `/rentals/active`, `/rentals/my-requests` | Solicitudes, alquileres y seguimiento. |
| `/maintenance`, `/maintenance/incidents` | Mantenimiento e incidencias. |
| `/subscriptions/plans` | Planes y suscripciones. |

La disponibilidad depende del rol, sesión y restricciones del módulo. El backend valida propiedad, autorización y reglas de negocio. La bandeja de notificaciones combina los seis endpoints; no requiere un nuevo bounded context. Stripe solo admite pagos de prueba; el buscador geográfico no equivale a rastreo GPS ni almacena ubicaciones en el alquiler.

## Compilación y pruebas

```powershell
npm ci
npm test -- --watch=false
npm run build
```

Resultado en `dist/maquigest-webapp/browser`. En el baseline `ac07e11`, las 16 suites (42 pruebas) y la compilación de producción pasaron. El bundle inicial fue de 600.05 kB (transferencia estimada 148.30 kB); existen advertencias de presupuesto de bundle y CSS. La auditoría npm identificó 7 paquetes afectados (1 al excluir dev). Los intentos de actualización produjeron conflictos de dependencias y no se publicaron; se conserva el lockfile validado. No se afirma que las vulnerabilidades estén corregidas.

## Despliegue

`vercel.json` configura primero la reescritura de `/api/v1/:path*` al backend HTTPS y después el fallback de la SPA a `/index.html`. Verificar que el destino coincide con el backend publicado en Northflank y que la salida de build y la rama de producción de Vercel son correctas. No incluir secretos de SendGrid, Stripe, Maps, JWT o MySQL en el frontend. El backend y su esquema deben estar preparados antes de publicar la WebApp. El ensayo local de producción no implica un nuevo despliegue cloud.

## GitFlow

`feature/*` y `fix/*` parten de `develop`; `develop` integra cambios validados; `release/*` prepara la versión y `main` recibe releases estables. Usar Conventional Commits (`type(scope): description.`) y Semantic Versioning. La versión de release se definirá al preparar los tags, no en este cambio documental.
