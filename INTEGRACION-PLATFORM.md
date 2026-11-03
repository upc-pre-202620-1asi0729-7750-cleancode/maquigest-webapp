# MaquiGest WebApp — frontend Angular independiente

## Arquitectura y límites

Este repositorio contiene **solo el frontend Angular**. No contiene API simulada, `json-server`, servidor Node ni credenciales de demostración. La autenticación, la persistencia MySQL y las reglas de negocio corresponden al repositorio **`maquigest-platform` (Spring Boot)**. Las verificaciones de formularios en Angular solo orientan al usuario y no sustituyen la validación del backend.

**Fuente:** copia de `maquigest-webapp` rama `main`, ZIP de 08/10/2026, recibida el 03/11/2026; es obligatorio comparar esta versión con `origin/develop` antes de integrar cambios. No sobrescribir trabajo reciente de otras personas.

## Ejecutar localmente

Prerequisitos: Node.js compatible con Angular 22 y `npm`; backend Spring Boot local en `http://127.0.0.1:8080` (cuando sus endpoints estén implementados).

```powershell
npm ci
npm start
```

Abrir `http://localhost:4200`. Angular usa `src/environments/environment.development.ts` con URL relativa `/api/v1`; `proxy.conf.json` redirige las solicitudes `/api/v1/*` al backend local en puerto 8080. Si Spring Boot corre en otro puerto, cambiar **únicamente** `target` en `proxy.conf.json`. En despliegue, configurar un reverse proxy que sirva `/api/v1` desde Platform; no apuntar `/api/v1` a un fake server.

El frontend puede mostrar los formularios públicos sin backend, pero **no es operable de extremo a extremo** (login, listados, altas, aprobaciones) hasta que exista el backend real y su contrato HTTP sea compatible. No se incluyen tokens simulados para saltarse el login.

## Contrato HTTP inicial que Platform debe exponer

- `POST /api/v1/authentication/sign-in` con `{email,password}` → `{id,email,role,status,token}`.
- `POST /api/v1/authentication/sign-up` para registro.
- `POST /api/v1/authentication/password-recovery` para solicitud de recuperación: devolver mensaje neutro independientemente de si existe la cuenta, y procesar token/correo en el backend.
- Recursos `/api/v1/profiles`, `/equipment`, `/equipment-categories`, `/rental-requests`, `/rentals`, `/deliveries`, `/equipment-returns`, `/maintenances`, `/incidents`, `/subscription-plans`, `/user-subscriptions`, con métodos GET/POST/PATCH/PUT según caso de uso.

Para `Rentals`, la copia preparada ya reemplaza los cambios multi-endpoint por operaciones **atómicas del backend**:

- `POST /api/v1/rental-requests/{id}/approve` → devuelve `RentalRequestResource` actualizado y crea alquiler/reserva en transacción.
- `POST /api/v1/rental-requests/{id}/reject` → devuelve `RentalRequestResource` actualizado.
- `POST /api/v1/rentals/{id}/delivery` → `{deliveredAt,notes}`, devuelve `RentalResource` actualizado.
- `POST /api/v1/rentals/{id}/return` → `{returnedAt,notes,maintenanceRequired}`, devuelve `RentalResource` actualizado.

**Atención:** revisar los demás bounded contexts, especialmente `maintenance.store.ts` e `inventory.store.ts`, para mover cualquier operación de negocio multi-recurso a Platform. No confiar en estados, propietarios o roles calculados en el navegador. Los stores Angular deben limitarse a la orquestación UI, carga, notificaciones y mapeo de respuestas.

## Vistas y mockups

Se conservaron los bounded contexts de Angular (`iam`, `profiles`, `inventory`, `rentals`, `maintenance`, `subscriptions`, `shared`) y se añadieron las rutas `/iam/recover-password`, `/rentals/reservations`, `/rentals/my-reservations`, `/rentals/my-rentals`, `/maintenance/equipment/:equipmentId/history`. El dashboard ahora tiene indicadores y paneles. Las nuevas pantallas de reservas y alquileres son **vistas de lectura sobre el recurso de alquiler existente**; no crean reservaciones ficticias ni inventan datos.

Los mockups de referencia proceden de `maquigest-report/assets/images/chapter-4/webapp-*-mockup.png`. Todavía se requiere una comparación visual pantalla por pantalla y validación móvil. No se afirma fidelidad 100%.

## Validación y GitFlow

```powershell
npm ci
npm run build
npm test
```

El entorno de preparación no pudo completar `npm ci`/build por falta de paquetes descargables. Verificar en Windows antes de merge. Comparar `git diff origin/develop` y trasladar cambios por features a ramas basadas en `develop`; no subir el ZIP directamente a `main`.
