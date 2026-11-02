// Dataadgangslaget: henter bookinger, der rører perioden. Nætterne tælles i business-laget (BR-01).
const { pool } = require('../db');

async function findBookingsInPeriod(startDate, endDate) {
  const [rows] = await pool.execute(
    `SELECT check_in_date, check_out_date FROM bookings
     WHERE check_out_date > ? AND check_in_date <= ?`,
    [startDate, endDate]
  );
  return rows;
}

module.exports = { findBookingsInPeriod };
