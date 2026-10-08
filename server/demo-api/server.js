'use strict';

// API DE DEMOSTRACIÓN: exclusivamente datos ficticios. No usar en producción.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
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

// Identidades 100% ficticias, contraseñas de DEMOSTRACIÓN, nunca reales.
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
  if (origin && origins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(!origin || origins.has(origin) ? 204 : 403);
  }
  if (origin && !origins.has(origin)) {
    return res.status(403).json({ error: 'Origen no permitido para esta demo' });
  }
  // Protección mínima contra uso abusivo. No sustituye seguridad productiva.
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const old = rate.get(key);
  const item = !old || old.until < now ? { count: 0, until: now + 60000 } : old;
  item.count += 1;
  rate.set(key, item);
  if (item.count > 120) return res.status(429).json({ error: 'Demasiadas solicitudes' });
  next();
});
app.use(jsonServer.bodyParser);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'maquigest-demo-api' }));
app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok', demo: true }));

app.post('/api/v1/authentication/sign-in', (req, res) => {
  const { email, password } = req.body || {};
  const account = demoAccounts.find((user) =>
    user.email === email && user.password === password
  );
  if (!account) {
    return res.status(401).json({ error: 'Credenciales de demostración incorrectas' });
  }
  return res.json({
    id: account.id,
    email: account.email,
    role: account.role,
    status: account.status,
    token: account.token,
  });
});

app.post('/api/v1/authentication/sign-up', (_req, res) => res.status(403).json({
  error: 'Registro desactivado en la demostración pública. Utilice una cuenta de prueba.',
}));

// Endpoints de datos ficticios. Los GET no requieren identificación; todas las
// mutaciones requieren iniciar sesión con una de las cuentas demo.
app.use('/api/v1', (req, res, next) => {
  const resource = req.path.split('/').filter(Boolean)[0];
  if (!resources.has(resource)) return res.status(404).json({ error: 'Recurso desconocido' });
  if (writeMethods.has(req.method)) {
    const supplied = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!demoAccounts.some((user) => user.token === supplied)) {
      return res.status(401).json({ error: 'Sesión de demostración requerida' });
    }
    const size = Number(req.headers['content-length'] || 0);
    if (size > 65536) return res.status(413).json({ error: 'Petición demasiado grande' });
  }
  next();
});
app.use('/api/v1', router);
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.listen(port, '0.0.0.0', () => {
  console.log(`MaquiGest demo API: escuchando en el puerto ${port}`);
  console.log('ADVERTENCIA: Datos ficticios, sin persistencia ni autenticación productiva.');
});
