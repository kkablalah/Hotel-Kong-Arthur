// Fælles hjælp til tests. Testene kører mod en rigtig MySQL: docker-compose exec backend npm test
const { app } = require('../src/presentation/app');
const { pool } = require('../src/data/db');

// Testværelser er kun til testene. De bruger høje numre og slettes igen af cleanup.
const TEST_ROOM_NUMBER_FROM = 60000;

function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      resolve({
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

async function request(baseUrl, method, path, body) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null, text };
}

async function createTestRoom(roomNumber, capacity) {
  const [types] = await pool.execute('SELECT room_type_id FROM room_types ORDER BY room_type_id LIMIT 1');
  const [result] = await pool.execute(
    'INSERT INTO rooms (room_number, room_type_id, capacity) VALUES (?, ?, ?)',
    [TEST_ROOM_NUMBER_FROM + roomNumber, types[0].room_type_id, capacity]
  );
  return result.insertId;
}

async function cleanup() {
  await pool.execute(
    'DELETE b FROM bookings b JOIN rooms r ON r.room_id = b.room_id WHERE r.room_number >= ?',
    [TEST_ROOM_NUMBER_FROM]
  );
  await pool.execute('DELETE FROM rooms WHERE room_number >= ?', [TEST_ROOM_NUMBER_FROM]);
}

function bookingBody(roomId, overrides = {}) {
  return {
    room_id: roomId,
    first_name: 'Test',
    family_name: 'Gæst',
    country_id: null,
    guest_count: 1,
    check_in_date: '2090-03-10',
    check_out_date: '2090-03-12',
    total_price: 2000,
    ...overrides,
  };
}

module.exports = { startServer, request, createTestRoom, cleanup, bookingBody, pool };
