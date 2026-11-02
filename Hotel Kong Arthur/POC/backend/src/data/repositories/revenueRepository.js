// Dataadgangslaget: omsætning fra historiske ophold (stays) og nye bookinger (bookings).
const { pool } = require('../db');

// stays har ingen datoer, kun den sæson, der står i de leverede data.
async function findStayTotals() {
  const [rows] = await pool.execute(
    `SELECT t.name AS room_type, c.name AS country, s.season,
            SUM(s.price) AS revenue, COUNT(*) AS stays_count
     FROM stays s
     JOIN room_types t ON t.room_type_id = s.room_type_id
     JOIN countries c ON c.country_id = s.country_id
     GROUP BY t.name, c.name, s.season`
  );
  return rows;
}

async function findBookings(startDate, endDate) {
  const dateFilter = startDate ? 'WHERE b.check_in_date BETWEEN ? AND ?' : '';
  const params = startDate ? [startDate, endDate] : [];
  const [rows] = await pool.execute(
    `SELECT t.name AS room_type, c.name AS country, b.check_in_date, b.total_price
     FROM bookings b
     JOIN rooms r ON r.room_id = b.room_id
     JOIN room_types t ON t.room_type_id = r.room_type_id
     LEFT JOIN countries c ON c.country_id = b.country_id
     ${dateFilter}`,
    params
  );
  return rows;
}

module.exports = { findStayTotals, findBookings };
