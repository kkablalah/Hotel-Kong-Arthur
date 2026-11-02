// T023: bookingreglerne (FR-01, BR-10) testet gennem API'et.
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, request, createTestRoom, cleanup, bookingBody, pool } = require('./helper');

let api;
let server;
let roomId;

before(async () => {
  await cleanup();
  server = await startServer();
  api = (method, path, body) => request(server.baseUrl, method, path, body);
  roomId = await createTestRoom(1, 2);
});

beforeEach(async () => {
  await pool.execute('DELETE FROM bookings WHERE room_id = ?', [roomId]);
});

after(async () => {
  await cleanup();
  await server.close();
  await pool.end();
});

test('en oprettet booking returneres uændret', async () => {
  const created = await api('POST', '/api/bookings', bookingBody(roomId, { first_name: 'Müller' }));
  assert.equal(created.status, 201);

  const fetched = await api('GET', `/api/bookings/${created.body.booking_id}`);
  assert.equal(fetched.status, 200);
  assert.deepEqual(fetched.body, created.body);
  assert.equal(fetched.body.first_name, 'Müller');
  assert.equal(fetched.body.total_price, '2000.00');
  assert.equal(fetched.body.check_in_date, '2090-03-10');
});

test('overlappende booking på samme værelse giver 409', async () => {
  await api('POST', '/api/bookings', bookingBody(roomId));
  const overlap = await api('POST', '/api/bookings', bookingBody(roomId, {
    check_in_date: '2090-03-11',
    check_out_date: '2090-03-13',
  }));
  assert.equal(overlap.status, 409);
  assert.equal(overlap.body.error.code, 'CONFLICT');
});

test('ny indtjekning samme dag som udtjekning er tilladt', async () => {
  await api('POST', '/api/bookings', bookingBody(roomId));
  const next = await api('POST', '/api/bookings', bookingBody(roomId, {
    check_in_date: '2090-03-12',
    check_out_date: '2090-03-14',
  }));
  assert.equal(next.status, 201);
});

test('ny udtjekning samme dag som eksisterende indtjekning er tilladt', async () => {
  await api('POST', '/api/bookings', bookingBody(roomId));
  const earlier = await api('POST', '/api/bookings', bookingBody(roomId, {
    check_in_date: '2090-03-08',
    check_out_date: '2090-03-10',
  }));
  assert.equal(earlier.status, 201);
});

test('PUT må ikke give konflikt med bookingen selv, men giver 409 mod en anden', async () => {
  const first = await api('POST', '/api/bookings', bookingBody(roomId));
  const second = await api('POST', '/api/bookings', bookingBody(roomId, {
    check_in_date: '2090-03-20',
    check_out_date: '2090-03-22',
  }));

  const self = await api('PUT', `/api/bookings/${first.body.booking_id}`, bookingBody(roomId, { total_price: 2500 }));
  assert.equal(self.status, 200);
  assert.equal(self.body.total_price, '2500.00');

  const conflict = await api('PUT', `/api/bookings/${second.body.booking_id}`, bookingBody(roomId));
  assert.equal(conflict.status, 409);
});

test('check_in på eller efter check_out giver 400', async () => {
  for (const dates of [
    { check_in_date: '2090-03-12', check_out_date: '2090-03-12' },
    { check_in_date: '2090-03-13', check_out_date: '2090-03-12' },
  ]) {
    const response = await api('POST', '/api/bookings', bookingBody(roomId, dates));
    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  }
});

test('guest_count uden for 1 til værelsets kapacitet giver 400 med fejlbesked', async () => {
  const tooFew = await api('POST', '/api/bookings', bookingBody(roomId, { guest_count: 0 }));
  assert.equal(tooFew.status, 400);

  const tooMany = await api('POST', '/api/bookings', bookingBody(roomId, { guest_count: 3 }));
  assert.equal(tooMany.status, 400);
  assert.ok(tooMany.body.error.details.some((d) => d.field === 'guest_count'));

  const atLimit = await api('POST', '/api/bookings', bookingBody(roomId, { guest_count: 2 }));
  assert.equal(atLimit.status, 201);
});

test('total_price på 0 eller mindre giver 400', async () => {
  for (const total_price of [0, -5]) {
    const response = await api('POST', '/api/bookings', bookingBody(roomId, { total_price }));
    assert.equal(response.status, 400);
  }
});

test('værelse eller land, der ikke findes, giver 400', async () => {
  const noRoom = await api('POST', '/api/bookings', bookingBody(999999999));
  assert.equal(noRoom.status, 400);

  const noCountry = await api('POST', '/api/bookings', bookingBody(roomId, { country_id: 60000 }));
  assert.equal(noCountry.status, 400);
});

test('ukendt booking-id giver 404 ved GET, PUT og DELETE', async () => {
  const id = 999999999;
  assert.equal((await api('GET', `/api/bookings/${id}`)).status, 404);
  assert.equal((await api('PUT', `/api/bookings/${id}`, bookingBody(roomId))).status, 404);
  assert.equal((await api('DELETE', `/api/bookings/${id}`)).status, 404);
});

test('DELETE giver 204, og bookingen er væk bagefter', async () => {
  const created = await api('POST', '/api/bookings', bookingBody(roomId));
  const removed = await api('DELETE', `/api/bookings/${created.body.booking_id}`);
  assert.equal(removed.status, 204);
  assert.equal((await api('GET', `/api/bookings/${created.body.booking_id}`)).status, 404);
});
