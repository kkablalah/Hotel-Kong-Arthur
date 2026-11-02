// Dataadgangslaget: drikkevarer og solgte enheder. Omsætningen beregnes i business-laget.
const { pool } = require('../db');

async function findDrinks() {
  const [rows] = await pool.execute(
    `SELECT d.name AS drink, c.name AS category, d.price_dkk, d.units_sold
     FROM drinks d
     JOIN drink_categories c ON c.category_id = d.category_id`
  );
  return rows;
}

module.exports = { findDrinks };
