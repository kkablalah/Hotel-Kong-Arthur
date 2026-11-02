// Dataadgangslaget: ratings knyttet til bookinger (BR-08).
const { pool } = require('../db');

// Perioden gælder bookingens indtjekningsdato.
async function findRatingSummary(startDate, endDate) {
  const { rows } = await pool.query(
    `SELECT AVG(s.rating) AS average_rating, COUNT(*) AS rating_count
     FROM customer_satisfaction s
     JOIN bookings b ON b.booking_id = s.booking_id
     WHERE b.check_in_date BETWEEN $1 AND $2`,
    [startDate, endDate]
  );
  return rows[0];
}

async function create(bookingId, rating, comment) {
  const { rows } = await pool.query(
    `INSERT INTO customer_satisfaction (booking_id, rating, comment)
     VALUES ($1, $2, $3)
     RETURNING satisfaction_id, booking_id, rating, comment, created_at`,
    [bookingId, rating, comment]
  );
  return rows[0];
}

module.exports = { findRatingSummary, create };
