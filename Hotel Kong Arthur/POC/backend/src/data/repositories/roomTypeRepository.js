// Dataadgangslaget: al SQL for værelsestyper (constitution princip I).
const { pool } = require('../db');

async function findAll() {
  const { rows } = await pool.query(
    'SELECT room_type_id, name FROM room_types ORDER BY room_type_id'
  );
  return rows;
}

module.exports = { findAll };
