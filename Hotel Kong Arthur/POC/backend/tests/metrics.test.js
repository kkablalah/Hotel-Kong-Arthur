// T037, T042, T049: nøgletal kontrolleret mod SQL direkte i databasen (NFR-07).
// Tolerancer efter BR-02: 0,01 DKK for beløb og 0,1 procentpoint for procenter.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { seasonOf } = require('../src/business/season');
const { startServer, request, createTestRoom, cleanup, bookingBody, pool } = require('./helper');

let api;
let server;
let roomId;
let bookingId;

const closeTo = (actual, expected, tolerance, label) => {
  assert.ok(Math.abs(Number(actual) - Number(expected)) <= tolerance, `${label}: ${actual} mod ${expected}`);
};

before(async () => {
  await cleanup();
  server = await startServer();
  api = (method, path, body) => request(server.baseUrl, method, path, body);
  roomId = await createTestRoom(21, 2);

  // 3 nætter: 30/1, 31/1 og 1/2. Udtjekningsdagen 2/2 tæller ikke (BR-01).
  const created = await api('POST', '/api/bookings', bookingBody(roomId, {
    check_in_date: '2092-01-30',
    check_out_date: '2092-02-02',
    total_price: 3000,
  }));
  bookingId = created.body.booking_id;
});

after(async () => {
  await cleanup();
  await server.close();
  await pool.end();
});

test('sæsoner følger BR-03, også ved årsskiftet', () => {
  const expected = {
    '2092-01-05': 'high', '2092-01-06': 'low', '2092-03-31': 'low', '2092-04-01': 'mid',
    '2092-05-31': 'mid', '2092-06-01': 'high', '2092-08-31': 'high', '2092-09-01': 'mid',
    '2092-10-31': 'mid', '2092-11-01': 'low', '2092-12-19': 'low', '2092-12-20': 'high',
  };
  for (const [date, season] of Object.entries(expected)) assert.equal(seasonOf(date), season, date);
});

test('belægning tæller kun nætter i perioden, ikke udtjekningsdagen', async () => {
  const { body } = await api('GET', '/api/metrics/occupancy?start_date=2092-02-01&end_date=2092-02-29');
  assert.equal(body.occupied_room_nights, 1);
  assert.equal(body.available_room_nights, 214 * 29);
  closeTo(body.occupancy_pct, (1 / (214 * 29)) * 100, 0.1, 'belægning');
});

test('belægning stemmer med kontrolforespørgsel', async () => {
  const start = '2092-01-01';
  const end = '2092-12-31';
  const [rows] = await pool.execute(
    `SELECT COALESCE(SUM(DATEDIFF(LEAST(check_out_date, DATE_ADD(?, INTERVAL 1 DAY)), GREATEST(check_in_date, ?))), 0) AS nights
     FROM bookings WHERE check_out_date > ? AND check_in_date <= ?`,
    [end, start, start, end]
  );
  const { body } = await api('GET', `/api/metrics/occupancy?start_date=${start}&end_date=${end}`);
  assert.equal(body.occupied_room_nights, Number(rows[0].nights));
});

test('belægning i en tom periode er 0, og forkert rækkefølge giver 400', async () => {
  const empty = await api('GET', '/api/metrics/occupancy?start_date=2095-01-01&end_date=2095-01-31');
  assert.equal(empty.status, 200);
  assert.equal(empty.body.occupied_room_nights, 0);
  assert.equal(empty.body.occupancy_pct, 0);

  const wrong = await api('GET', '/api/metrics/occupancy?start_date=2095-02-01&end_date=2095-01-01');
  assert.equal(wrong.status, 400);
});

test('indtjening uden periode stemmer med SQL for alle grupperinger', async () => {
  const [control] = await pool.execute(
    `SELECT ROUND((SELECT COALESCE(SUM(price), 0) FROM stays) + (SELECT COALESCE(SUM(total_price), 0) FROM bookings), 2) AS total`
  );
  for (const groupBy of ['type', 'season', 'country', 'year', 'type_season']) {
    const { status, body } = await api('GET', `/api/metrics/revenue?group_by=${groupBy}`);
    assert.equal(status, 200);
    closeTo(body.total_dkk, control[0].total, 0.01, groupBy);
    const sum = body.rows.reduce((total, row) => total + Number(row.revenue_dkk), 0);
    closeTo(sum, control[0].total, 0.01, `${groupBy}, sum af rækker`);
    assert.equal(body.includes_history, true);
  }
});

test('indtjening er sorteret faldende, så den højeste kan findes', async () => {
  for (const groupBy of ['type', 'country']) {
    const { rows } = (await api('GET', `/api/metrics/revenue?group_by=${groupBy}`)).body;
    for (let i = 1; i < rows.length; i += 1) {
      assert.ok(Number(rows[i - 1].revenue_dkk) >= Number(rows[i].revenue_dkk));
    }
  }
});

test('indtjening pr. værelsestype pr. sæson stemmer med SQL', async () => {
  const [control] = await pool.execute(
    `SELECT t.name AS room_type, s.season, ROUND(SUM(s.price), 2) AS total
     FROM stays s JOIN room_types t ON t.room_type_id = s.room_type_id
     GROUP BY t.name, s.season`
  );
  const { rows } = (await api('GET', '/api/metrics/revenue?group_by=type_season')).body;
  for (const row of control) {
    const found = rows.find((r) => r.room_type === row.room_type && r.season === row.season);
    assert.ok(found, `${row.room_type} / ${row.season}`);
    assert.ok(Number(found.revenue_dkk) >= Number(row.total) - 0.01);
  }
});

test('med periode tæller kun bookinger, og sæsonen følger indtjekningsdatoen', async () => {
  const { body } = await api('GET', '/api/metrics/revenue?group_by=season&start_date=2092-01-01&end_date=2092-12-31');
  assert.equal(body.includes_history, false);
  assert.equal(body.total_dkk, '3000.00');
  assert.deepEqual(body.rows.map((r) => r.group), ['low']);
});

test('kun én af datoerne giver 400', async () => {
  assert.equal((await api('GET', '/api/metrics/revenue?group_by=type&start_date=2092-01-01')).status, 400);
});

test('nye bookinger tæller i det år, de tjekker ind, og et år uden indtjening giver 404', async () => {
  const found = await api('GET', '/api/metrics/revenue/annual?aar=2092');
  assert.equal(found.status, 200);
  assert.equal(found.body.year, 2092);
  assert.equal(found.body.revenue_dkk, '3000.00');
  assert.equal(found.body.stays_count, 0);
  assert.equal(found.body.bookings_count, 1);

  assert.equal((await api('GET', '/api/metrics/revenue/annual?aar=2096')).status, 404);
  assert.equal((await api('GET', '/api/metrics/revenue/annual?aar=abc')).status, 400);
});

test('historiske ophold hører til HISTORIK_AAR, som også er standardåret', async () => {
  const year = Number(process.env.HISTORIK_AAR || 2025);
  const [control] = await pool.execute(
    `SELECT ROUND((SELECT SUM(price) FROM stays)
       + (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE YEAR(check_in_date) = ?), 2) AS total`,
    [year]
  );
  const chosen = await api('GET', `/api/metrics/revenue/annual?aar=${year}`);
  assert.equal(chosen.status, 200);
  assert.equal(chosen.body.stays_count, 1000);
  closeTo(chosen.body.revenue_dkk, control[0].total, 0.01, 'årets indtjening');

  const standard = await api('GET', '/api/metrics/revenue/annual');
  assert.equal(standard.body.year, year);
  assert.equal(standard.body.revenue_dkk, chosen.body.revenue_dkk);
});

test('løbende indtjening tæller kun bookinger og ændrer sig med det samme', async () => {
  const [control] = await pool.execute(
    'SELECT ROUND(COALESCE(SUM(total_price), 0), 2) AS total, COUNT(*) AS antal FROM bookings'
  );
  const before = (await api('GET', '/api/metrics/revenue/running')).body;
  closeTo(before.revenue_dkk, control[0].total, 0.01, 'løbende indtjening');
  assert.equal(before.bookings_count, Number(control[0].antal));

  const created = await api('POST', '/api/bookings', bookingBody(roomId, {
    check_in_date: '2092-06-01',
    check_out_date: '2092-06-02',
    total_price: 500,
  }));
  const after = (await api('GET', '/api/metrics/revenue/running')).body;
  closeTo(after.revenue_dkk, Number(before.revenue_dkk) + 500, 0.01, 'efter ny booking');
  assert.equal(after.bookings_count, before.bookings_count + 1);

  await api('DELETE', `/api/bookings/${created.body.booking_id}`);
});

test('de 214 værelser følger seed-filen, og kapacitet er 1-4', async () => {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS antal, MIN(capacity) AS laveste, MAX(capacity) AS hoejeste FROM rooms WHERE room_number < 60000'
  );
  assert.equal(Number(rows[0].antal), 214);
  assert.equal(rows[0].laveste, 1);
  assert.equal(rows[0].hoejeste, 4);
});

test('gæster pr. land stemmer med SQL, og bookinger uden land vises som Ukendt', async () => {
  const [control] = await pool.execute(
    `SELECT (SELECT COUNT(*) FROM stays) + (SELECT COUNT(*) FROM bookings) AS total`
  );
  const { rows } = (await api('GET', '/api/metrics/guests/countries')).body;
  assert.equal(rows.reduce((sum, r) => sum + r.stays_count, 0), Number(control[0].total));
  assert.ok(rows.some((r) => r.country === 'Ukendt'));
});

test('kundetilfredshed er gennemsnittet for perioden og tom uden ratings', async () => {
  const url = `/api/bookings/${bookingId}/satisfaction`;
  const first = await api('POST', url, { rating: 4, comment: 'Fin' });
  assert.equal(first.status, 201);
  assert.equal(first.body.rating, 4);
  assert.equal(first.body.comment, 'Fin');
  assert.equal((await api('POST', url, { rating: 5 })).status, 201);

  for (const rating of [0, 6]) assert.equal((await api('POST', url, { rating })).status, 400);
  assert.equal((await api('POST', '/api/bookings/999999999/satisfaction', { rating: 4 })).status, 404);

  const path = '/api/metrics/satisfaction?start_date=2092-01-01&end_date=2092-12-31';

  const [control] = await pool.execute(
    `SELECT ROUND(AVG(s.rating), 2) AS average FROM customer_satisfaction s
     JOIN bookings b ON b.booking_id = s.booking_id
     WHERE b.check_in_date BETWEEN '2092-01-01' AND '2092-12-31'`
  );
  const { body } = await api('GET', path);
  assert.equal(body.rating_count, 2);
  closeTo(body.average_rating, control[0].average, 0.01, 'gennemsnit');

  const empty = await api('GET', '/api/metrics/satisfaction?start_date=2095-01-01&end_date=2095-12-31');
  assert.equal(empty.body.rating_count, 0);
  assert.equal(empty.body.average_rating, null);
});

test('RevPAR og ADR følger BR-09', async () => {
  const { body } = await api('GET', '/api/metrics/revpar?start_date=2092-01-01&end_date=2092-12-31');
  assert.equal(body.revenue_dkk, '3000.00');
  assert.equal(body.occupied_room_nights, 3);
  assert.equal(body.available_room_nights, 214 * 366);
  closeTo(body.revpar_dkk, 3000 / (214 * 366), 0.01, 'RevPAR');
  closeTo(body.adr_dkk, 1000, 0.01, 'ADR');

  const empty = await api('GET', '/api/metrics/revpar?start_date=2095-01-01&end_date=2095-12-31');
  assert.equal(empty.body.adr_dkk, null);
  assert.equal(empty.body.revpar_dkk, '0.00');
});
