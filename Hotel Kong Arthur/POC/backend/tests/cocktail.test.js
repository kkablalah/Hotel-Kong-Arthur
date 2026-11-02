// T047: nøgletal for baren kontrolleret mod SQL (BR-02, BR-07).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, request, pool } = require('./helper');

const YEAR = Number(process.env.HISTORIK_AAR || 2025);
let api;
let server;

before(async () => {
  server = await startServer();
  api = (method, path, body) => request(server.baseUrl, method, path, body);
});

after(async () => {
  await server.close();
  await pool.end();
});

test('Helenes samlede salg stemmer med SQL', async () => {
  const [control] = await pool.execute(
    'SELECT ROUND(SUM(revenue_dkk), 2) AS total, SUM(units_sold) AS units FROM drink_sales'
  );
  const { status, body } = await api('GET', '/api/cocktail/sales');
  assert.equal(status, 200);
  assert.equal(body.employee, 'Helene Christine');
  assert.equal(body.year, YEAR);
  assert.ok(Math.abs(Number(body.total_dkk) - Number(control[0].total)) <= 0.01);
  assert.equal(body.units_sold, Number(control[0].units));
});

test('barsalget hører til HISTORIK_AAR, og andre år giver 404', async () => {
  for (const path of ['/api/cocktail/sales', '/api/cocktail/sales/products', '/api/cocktail/sales/distribution']) {
    assert.equal((await api('GET', `${path}?aar=${YEAR}`)).status, 200, path);
    assert.equal((await api('GET', `${path}?aar=${YEAR - 1}`)).status, 404, path);
    assert.equal((await api('GET', `${path}?aar=abc`)).status, 400, path);
  }
});

test('omsætning pr. drink dækker alle drikke og er sorteret faldende', async () => {
  const [control] = await pool.execute('SELECT drink, revenue_dkk FROM drink_sales');
  const { body } = await api('GET', '/api/cocktail/sales/products');
  assert.equal(body.length, control.length);
  for (let i = 1; i < body.length; i += 1) {
    assert.ok(Number(body[i - 1].revenue_dkk) >= Number(body[i].revenue_dkk));
  }
  for (const row of control) {
    const found = body.find((d) => d.drink === row.drink);
    assert.ok(Math.abs(Number(found.revenue_dkk) - Number(row.revenue_dkk)) <= 0.01, row.drink);
  }
});

test('fordelingen har begge andele, og de stemmer med SQL', async () => {
  const [control] = await pool.execute(
    `SELECT category,
            ROUND(SUM(revenue_dkk) / (SELECT SUM(revenue_dkk) FROM drink_sales) * 100, 1) AS revenue_share,
            ROUND(SUM(units_sold) / (SELECT SUM(units_sold) FROM drink_sales) * 100, 1) AS unit_share
     FROM drink_sales GROUP BY category`
  );
  const { body } = await api('GET', '/api/cocktail/sales/distribution');
  assert.equal(body.rows.length, control.length);
  for (const row of control) {
    const found = body.rows.find((c) => c.category === row.category);
    assert.ok(Math.abs(found.revenue_share_pct - Number(row.revenue_share)) <= 0.1, row.category);
    assert.ok(Math.abs(found.unit_share_pct - Number(row.unit_share)) <= 0.1, row.category);
  }
});
