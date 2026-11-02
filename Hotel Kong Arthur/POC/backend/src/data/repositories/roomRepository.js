// Dataadgangslaget: al SQL for værelser (constitution princip I).
const { pool } = require('../db');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT r.room_id, r.room_number, r.capacity, t.name AS room_type
     FROM rooms r
     JOIN room_types t ON t.room_type_id = r.room_type_id
     ORDER BY r.room_number`
  );
  return rows;
}

async function findById(roomId) {
  const { rows } = await pool.query(
    'SELECT room_id, room_number, capacity FROM rooms WHERE room_id = $1',
    [roomId]
  );
  return rows[0] || null;
}

module.exports = { findAll, findById };
