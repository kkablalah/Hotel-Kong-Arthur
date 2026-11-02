// T062: sikkerhed (NFR-10) og svartider (NFR-09). Eksporten på 30 sekunder måles i tableau-scriptet.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, request, createTestRoom, cleanup, bookingBody, pool } = require('./helper');

const INJECTION = "'; DROP TABLE bookings;--";
let api;
let server;
let roomId;

before(async () => {
  await cleanup();
  server = await startServer();
  api = (method, path, body) => request(server.baseUrl, method, path, body);
  roomId = await createTestRoom(31, 2);
});

after(async () => {
  await cleanup();
  await server.close();
  await pool.end();
});

async function tableCounts() {
  const [rows] = await pool.execute(
    `SELECT (SELECT COUNT(*) FROM stays) AS stays, (SELECT COUNT(*) FROM countries) AS countries`
  );
  return rows[0];
}

test('SQL-lignende input i et navn gemmes som almindelig tekst', async () => {
  const counts = await tableCounts();
  const created = await api('POST', '/api/bookings', bookingBody(roomId, {
    first_name: INJECTION,
    check_in_date: '2093-01-01',
    check_out_date: '2093-01-02',
  }));
  assert.equal(created.status, 201);
  assert.equal(created.body.first_name, INJECTION);
  assert.deepEqual(await tableCounts(), counts);
  assert.equal((await api('GET', `/api/bookings/${created.body.booking_id}`)).status, 200);
});

test('SQL-lignende input i dato og filter afvises med 400', async () => {
  const body = bookingBody(roomId, { check_in_date: INJECTION });
  assert.equal((await api('POST', '/api/bookings', body)).status, 400);
  assert.equal((await api('GET', `/api/bookings?room_id=${encodeURIComponent(INJECTION)}`)).status, 400);
  assert.equal((await api('GET', `/api/metrics/occupancy?start_date=${encodeURIComponent(INJECTION)}&end_date=2093-01-01`)).status, 400);
});

test('fejlsvar indeholder ingen stack traces eller databasedetaljer', async () => {
  const response = await api('POST', '/api/bookings', { first_name: INJECTION });
  assert.equal(response.status, 400);
  assert.doesNotMatch(response.text, /node_modules|\.js:\d+|sql|mysql|ER_/i);
});

async function elapsed(call) {
  const start = performance.now();
  const response = await call();
  return { ms: performance.now() - start, status: response.status };
}

test('nøgletal svarer inden for 2 sekunder', async () => {
  const paths = [
    '/api/metrics/occupancy?start_date=2093-01-01&end_date=2093-12-31',
    '/api/metrics/revenue?group_by=type_season',
    '/api/metrics/revenue?group_by=country',
    '/api/metrics/guests/countries',
    '/api/metrics/satisfaction?start_date=2093-01-01&end_date=2093-12-31',
    '/api/metrics/revpar?start_date=2093-01-01&end_date=2093-12-31',
    '/api/cocktail/sales',
    '/api/cocktail/sales/products',
    '/api/cocktail/sales/distribution',
  ];
  for (const path of paths) {
    const { ms, status } = await elapsed(() => api('GET', path));
    assert.equal(status, 200, path);
    assert.ok(ms < 2000, `${path}: ${ms} ms`);
  }
});

test('booking-CRUD svarer inden for 500 ms', async () => {
  const body = bookingBody(roomId, { check_in_date: '2094-01-01', check_out_date: '2094-01-02' });

  const create = await elapsed(async () => {
    const response = await api('POST', '/api/bookings', body);
    body.id = response.body.booking_id;
    return response;
  });
  const id = body.id;
  delete body.id;

  const calls = [
    create,
    await elapsed(() => api('GET', '/api/bookings')),
    await elapsed(() => api('GET', `/api/bookings/${id}`)),
    await elapsed(() => api('PUT', `/api/bookings/${id}`, body)),
    await elapsed(() => api('DELETE', `/api/bookings/${id}`)),
  ];
  for (const { ms } of calls) assert.ok(ms < 500, `${ms} ms`);
});
