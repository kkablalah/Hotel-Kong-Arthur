// Dataadgangslaget: al SQL for lande (constitution princip I).
const { pool } = require('../db');

async function findAll() {
  const [rows] = await pool.execute('SELECT country_id, name FROM countries ORDER BY name');
  return rows;
}

async function findById(countryId) {
  const [rows] = await pool.execute(
    'SELECT country_id, name FROM countries WHERE country_id = ?',
    [countryId]
  );
  return rows[0] || null;
}

module.exports = { findAll, findById };
