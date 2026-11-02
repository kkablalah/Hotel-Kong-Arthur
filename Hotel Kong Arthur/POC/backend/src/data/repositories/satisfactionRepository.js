// Dataadgangslaget: ratings knyttet til bookinger (BR-08).
const { pool } = require('../db');

// Perioden gælder bookingens indtjekningsdato.
async function findRatingSummary(startDate, endDate) {
  const [rows] = await pool.execute(
    `SELECT AVG(s.rating) AS average_rating, COUNT(*) AS rating_count
     FROM customer_satisfaction s
     JOIN bookings b ON b.booking_id = s.booking_id
     WHERE b.check_in_date BETWEEN ? AND ?`,
    [startDate, endDate]
  );
  return rows[0];
}

async function create(bookingId, rating, comment) {
  const [result] = await pool.execute(
    'INSERT INTO customer_satisfaction (booking_id, rating, comment) VALUES (?, ?, ?)',
    [bookingId, rating, comment]
  );
  const [rows] = await pool.execute(
    'SELECT satisfaction_id, booking_id, rating, comment, created_at FROM customer_satisfaction WHERE satisfaction_id = ?',
    [result.insertId]
  );
  return rows[0];
}

module.exports = { findRatingSummary, create };
