// Dataadgangslaget: ophold og omsætning pr. land. Bookinger uden land vises som "Ukendt" (AC-08.4).
const { pool } = require('../db');

async function findStaysByCountry() {
  const [rows] = await pool.execute(
    `SELECT c.name AS country, COUNT(*) AS stays_count, SUM(s.price) AS revenue
     FROM stays s
     JOIN countries c ON c.country_id = s.country_id
     GROUP BY c.name`
  );
  return rows;
}

async function findBookingsByCountry(startDate, endDate) {
  const dateFilter = startDate ? 'WHERE b.check_in_date BETWEEN ? AND ?' : '';
  const params = startDate ? [startDate, endDate] : [];
  const [rows] = await pool.execute(
    `SELECT COALESCE(c.name, 'Ukendt') AS country, COUNT(*) AS stays_count, SUM(b.total_price) AS revenue
     FROM bookings b
     LEFT JOIN countries c ON c.country_id = b.country_id
     ${dateFilter}
     GROUP BY COALESCE(c.name, 'Ukendt')`,
    params
  );
  return rows;
}

module.exports = { findStaysByCountry, findBookingsByCountry };
