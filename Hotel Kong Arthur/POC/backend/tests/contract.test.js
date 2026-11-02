// T056: openapi.yaml og Express-appens routes skal stemme overens (constitution princip III).
// Testen kræver ikke en database.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const yaml = require('js-yaml');
const { app, routers, specPath } = require('../src/presentation/app');
const { startServer, request, pool } = require('./helper');

const METHODS = ['get', 'post', 'put', 'delete', 'patch'];
let server;

function joinPath(mount, routePath) {
  const full = routePath === '/' ? mount : mount + routePath;
  return full.replace(/:(\w+)/g, '{$1}');
}

function routesOf(stack, mount) {
  return stack
    .filter((layer) => layer.route)
    .flatMap((layer) => Object.keys(layer.route.methods).map((method) => `${method} ${joinPath(mount, layer.route.path)}`));
}

function registeredRoutes() {
  const own = routesOf(app.router.stack, '');
  const mounted = Object.entries(routers).flatMap(([mount, router]) => routesOf(router.stack, mount));
  return new Set([...own, ...mounted]);
}

function documentedRoutes() {
  const spec = yaml.load(fs.readFileSync(specPath, 'utf8'));
  return new Set(
    Object.entries(spec.paths).flatMap(([path, item]) =>
      METHODS.filter((method) => item[method]).map((method) => `${method} ${path}`)
    )
  );
}

before(async () => {
  server = await startServer();
});

after(async () => {
  await server.close();
  await pool.end();
});

test('hvert dokumenteret endpoint har en route', () => {
  const routes = registeredRoutes();
  const missing = [...documentedRoutes()].filter((route) => !routes.has(route));
  assert.deepEqual(missing, []);
});

test('hver route er dokumenteret', () => {
  const documented = documentedRoutes();
  const missing = [...registeredRoutes()].filter((route) => !documented.has(route));
  assert.deepEqual(missing, []);
});

test('fejl følger det dokumenterede format uden interne detaljer', async () => {
  const cases = [
    ['GET', '/findes-ikke', 404, 'NOT_FOUND'],
    ['PUT', '/health', 405, 'METHOD_NOT_ALLOWED'],
    ['GET', '/api/bookings/abc', 400, 'VALIDATION_ERROR'],
    ['GET', '/api/metrics/occupancy', 400, 'VALIDATION_ERROR'],
    ['GET', '/api/metrics/occupancy?start_date=2026-13-45&end_date=2026-01-01', 400, 'VALIDATION_ERROR'],
    ['GET', '/api/metrics/revenue?group_by=forkert', 400, 'VALIDATION_ERROR'],
  ];
  for (const [method, path, status, code] of cases) {
    const response = await request(server.baseUrl, method, path);
    assert.equal(response.status, status, path);
    assert.equal(response.body.error.code, code, path);
    assert.equal(typeof response.body.error.message, 'string');
    assert.doesNotMatch(response.text, /node_modules|\.js:\d+|stack/i);
  }
});

test('ugyldig JSON giver 400 i samme format', async () => {
  const response = await fetch(`${server.baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ikke json',
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
});
