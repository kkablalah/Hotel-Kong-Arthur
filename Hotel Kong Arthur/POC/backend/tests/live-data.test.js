// T028: en ændring via POST, PUT eller DELETE kan ses i næste GET uden caching (C-01).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, request, createTestRoom, cleanup, bookingBody, pool } = require('./helper');

let api;
let server;
let roomId;
const period = '/api/metrics/occupancy?start_date=2091-05-01&end_date=2091-05-31';
const dates = { check_in_date: '2091-05-10', check_out_date: '2091-05-12' };

before(async () => {
  await cleanup();
  server = await startServer();
  api = (method, path, body) => request(server.baseUrl, method, path, body);
  roomId = await createTestRoom(11, 2);
});

after(async () => {
  await cleanup();
  await server.close();
  await pool.end();
});

test('ændringer ses straks i GET og i nøgletal', async () => {
  const before = await api('GET', period);

  const created = await api('POST', '/api/bookings', bookingBody(roomId, dates));
  assert.equal(created.status, 201);
  const id = created.body.booking_id;

  const list = await api('GET', `/api/bookings?room_id=${roomId}`);
  assert.ok(list.body.some((b) => b.booking_id === id));

  const afterCreate = await api('GET', period);
  assert.equal(afterCreate.body.occupied_room_nights, before.body.occupied_room_nights + 2);

  await api('PUT', `/api/bookings/${id}`, bookingBody(roomId, { ...dates, total_price: 3000 }));
  assert.equal((await api('GET', `/api/bookings/${id}`)).body.total_price, '3000.00');

  await api('DELETE', `/api/bookings/${id}`);
  assert.equal((await api('GET', period)).body.occupied_room_nights, before.body.occupied_room_nights);
});
