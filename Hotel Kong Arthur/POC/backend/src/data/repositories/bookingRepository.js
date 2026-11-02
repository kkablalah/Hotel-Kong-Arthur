// Dataadgangslaget: al SQL for bookinger (constitution princip I). Alle værdier sendes som parametre.
const { pool } = require('../db');

const columns = `booking_id, room_id, first_name, family_name, country_id, guest_count,
  check_in_date, check_out_date, total_price, created_at, updated_at`;

async function findById(bookingId) {
  const { rows } = await pool.query(`SELECT ${columns} FROM bookings WHERE booking_id = $1`, [bookingId]);
  return rows[0] || null;
}

async function list({ roomId, startDate, endDate }) {
  const where = [];
  const params = [];
  if (roomId !== undefined) {
    params.push(roomId);
    where.push(`room_id = $${params.length}`);
  }
  if (startDate !== undefined) {
    params.push(startDate);
    where.push(`check_out_date > $${params.length}`);
  }
  if (endDate !== undefined) {
    params.push(endDate);
    where.push(`check_in_date <= $${params.length}`);
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT ${columns} FROM bookings ${whereSql} ORDER BY check_in_date, booking_id`,
    params
  );
  return rows;
}

async function create(b) {
  const { rows } = await pool.query(
    `INSERT INTO bookings
       (room_id, first_name, family_name, country_id, guest_count, check_in_date, check_out_date, total_price)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING booking_id`,
    [b.room_id, b.first_name, b.family_name, b.country_id, b.guest_count, b.check_in_date, b.check_out_date, b.total_price]
  );
  return rows[0].booking_id;
}

async function update(bookingId, b) {
  await pool.query(
    `UPDATE bookings
     SET room_id = $1, first_name = $2, family_name = $3, country_id = $4, guest_count = $5,
         check_in_date = $6, check_out_date = $7, total_price = $8
     WHERE booking_id = $9`,
    [b.room_id, b.first_name, b.family_name, b.country_id, b.guest_count, b.check_in_date, b.check_out_date, b.total_price, bookingId]
  );
}

async function remove(bookingId) {
  const { rowCount } = await pool.query('DELETE FROM bookings WHERE booking_id = $1', [bookingId]);
  return rowCount > 0;
}

// BR-10: overlap, hvis ny.check_in < eksisterende.check_out OG ny.check_out > eksisterende.check_in.
async function findOverlapping(roomId, checkIn, checkOut, excludeBookingId) {
  const { rows } = await pool.query(
    `SELECT booking_id FROM bookings
     WHERE room_id = $1 AND check_in_date < $2 AND check_out_date > $3 AND booking_id <> $4`,
    [roomId, checkOut, checkIn, excludeBookingId || 0]
  );
  return rows;
}

module.exports = { findById, list, create, update, remove, findOverlapping };
