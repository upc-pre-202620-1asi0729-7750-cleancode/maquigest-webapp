'use strict';

// API DE DEMOSTRACIÓN: exclusivamente datos ficticios. No usar en producción.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const jsonServer = require('json-server');

const app = jsonServer.create();
const port = Number(process.env.PORT || 3000);
const seed = path.join(__dirname, 'seed.json');
const demoDatabase = path.join(os.tmpdir(), `maquigest-demo-${process.pid}.json`);
fs.copyFileSync(seed, demoDatabase);
const router = jsonServer.router(demoDatabase);

const origins = new Set([
  'https://maquigest-webapp-cleancode.vercel.app',
  'http://localhost:4200',
]);

const previewOriginPattern = /^https:\/\/maquigest-webapp-cleancode-[a-z0-9-]+-jamsy06\.vercel\.app$/;
const isAllowedOrigin = (origin) => origins.has(origin) || previewOriginPattern.test(origin);

// Cuentas ficticias predefinidas.
const demoAccounts = [
  {
    id: 1,
    email: 'alquiler.demo@maquigest.example',
    password: 'MaquiGestDemo2026!',
    role: 'rental_company',
    status: 'active',
    token: 'maquigest-demo-token-rental-1',
  },
  {
    id: 2,
    email: 'constructora.demo@maquigest.example',
    password: 'MaquiGestDemo2026!',
    role: 'construction_company',
    status: 'active',
    token: 'maquigest-demo-token-construction-2',
  },
];

const resources = new Set([
  'profiles', 'equipment', 'equipment-categories', 'rental-requests',
  'rentals', 'deliveries', 'equipment-returns', 'subscription-plans',
  'user-subscriptions', 'maintenances', 'incidents',
]);

const writeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const rate = new Map();

app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');

  const origin = req.headers.origin;

  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(!origin || isAllowedOrigin(origin) ? 204 : 403);
  }

  if (origin && !isAllowedOrigin(origin)) {
    return res.status(403).json({ error: 'Origen no permitido para esta demo' });
  }

  // Límite básico de solicitudes para la demostración.
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const old = rate.get(key);
  const item = !old || old.until < now
    ? { count: 0, until: now + 60000 }
    : old;

  item.count += 1;
  rate.set(key, item);

  if (item.count > 120) {
    return res.status(429).json({ error: 'Demasiadas solicitudes' });
  }

  next();
});

app.use(jsonServer.bodyParser);

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'maquigest-demo-api' })
);

app.get('/api/v1/health', (_req, res) =>
  res.json({ status: 'ok', demo: true })
);

// Inicio de sesión: cuentas ficticias y cuentas temporales registradas.
app.post('/api/v1/authentication/sign-in', (req, res) => {
  const { email, password } = req.body || {};

  const account = demoAccounts.find((user) =>
    user.email === email && user.password === password
  );

  if (!account) {
    return res.status(401).json({
      error: 'Credenciales de demostración incorrectas',
    });
  }

  return res.json({
    id: account.id,
    email: account.email,
    role: account.role,
    status: account.status,
    token: account.token,
  });
});

// Registro temporal para la demo. No introducir información real.
app.post('/api/v1/authentication/sign-up', (req, res) => {
  const body = req.body || {};

  const firstName =
    typeof body.firstName === 'string' ? body.firstName.trim() : '';

  const lastName =
    typeof body.lastName === 'string' ? body.lastName.trim() : '';

  const email =
    typeof body.email === 'string'
      ? body.email.trim().toLowerCase()
      : '';

  const password =
    typeof body.password === 'string' ? body.password : '';

  const companyName =
    typeof body.companyName === 'string'
      ? body.companyName.trim()
      : '';

  const role = body.role;

  if (
    !firstName || firstName.length > 60 ||
    !lastName || lastName.length > 100 ||
    !companyName || companyName.length > 120 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 8 ||
    password.length > 128 ||
    !['rental_company', 'construction_company'].includes(role)
  ) {
    return res.status(400).json({
      error: 'Datos de registro de prueba inválidos',
    });
  }

  if (demoAccounts.some((user) => user.email === email)) {
    return res.status(409).json({
      error: 'El correo ya está registrado',
    });
  }

  if (demoAccounts.length >= 32) {
    return res.status(429).json({
      error: 'Límite de cuentas demo alcanzado',
    });
  }

  const profiles = router.db.get('profiles');

  const existingProfileIds = profiles.value().map(
    (profile) => Number(profile.id) || 0
  );

  const existingAccountIds = demoAccounts.map(
    (user) => Number(user.id) || 0
  );

  const id = Math.max(
    0,
    ...existingProfileIds,
    ...existingAccountIds
  ) + 1;

  // Crear el perfil asociado al nuevo usuario.
  profiles.push({
    id,
    userId: id,
    firstName,
    lastName,
    contactEmail: email,
    phoneNumber: '',
    companyName,
    address: {
      street: '',
      district: '',
      city: '',
      country: 'Peru',
      latitude: 0,
      longitude: 0,
    },
  }).write();

  // Cuenta en memoria: desaparece al reiniciar Render.
  demoAccounts.push({
    id,
    email,
    password,
    role,
    status: 'active',
    token: `maquigest-demo-${crypto.randomBytes(24).toString('hex')}`,
  });

  return res.status(201).json({
    id,
    firstName,
    lastName,
    email,
    companyName,
    role,
    status: 'active',
  });
});

// Recursos ficticios de la aplicación.
app.use('/api/v1', (req, res, next) => {
  const resource = req.path.split('/').filter(Boolean)[0];

  if (!resources.has(resource)) {
    return res.status(404).json({
      error: 'Recurso desconocido',
    });
  }

  if (writeMethods.has(req.method)) {
    const supplied = (
      req.headers.authorization || ''
    ).replace(/^Bearer\s+/i, '');

    if (!demoAccounts.some((user) => user.token === supplied)) {
      return res.status(401).json({
        error: 'Sesión de demostración requerida',
      });
    }

    const size = Number(req.headers['content-length'] || 0);

    if (size > 65536) {
      return res.status(413).json({
        error: 'Petición demasiado grande',
      });
    }
  }

  next();
});

app.use('/api/v1', router);

app.use((_req, res) =>
  res.status(404).json({ error: 'Ruta no encontrada' })
);

app.listen(port, '0.0.0.0', () => {
  console.log(`MaquiGest demo API: escuchando en el puerto ${port}`);
  console.log('ADVERTENCIA: Datos ficticios, sin persistencia ni autenticación productiva.');
});
