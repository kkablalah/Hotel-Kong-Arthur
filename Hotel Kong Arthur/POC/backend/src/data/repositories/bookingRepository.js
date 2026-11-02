// Dataadgangslaget: al SQL for bookinger (constitution princip I). Alle værdier sendes som parametre.
const { pool } = require('../db');

const columns = `booking_id, room_id, first_name, family_name, country_id, guest_count,
  check_in_date, check_out_date, total_price, created_at, updated_at`;

async function findById(bookingId) {
  const [rows] = await pool.execute(`SELECT ${columns} FROM bookings WHERE booking_id = ?`, [bookingId]);
  return rows[0] || null;
}

async function list({ roomId, startDate, endDate }) {
  const where = [];
  const params = [];
  if (roomId !== undefined) {
    where.push('room_id = ?');
    params.push(roomId);
  }
  if (startDate !== undefined) {
    where.push('check_out_date > ?');
    params.push(startDate);
  }
  if (endDate !== undefined) {
    where.push('check_in_date <= ?');
    params.push(endDate);
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT ${columns} FROM bookings ${whereSql} ORDER BY check_in_date, booking_id`,
    params
  );
  return rows;
}

async function create(b) {
  const [result] = await pool.execute(
    `INSERT INTO bookings
       (room_id, first_name, family_name, country_id, guest_count, check_in_date, check_out_date, total_price)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [b.room_id, b.first_name, b.family_name, b.country_id, b.guest_count, b.check_in_date, b.check_out_date, b.total_price]
  );
  return result.insertId;
}

async function update(bookingId, b) {
  await pool.execute(
    `UPDATE bookings
     SET room_id = ?, first_name = ?, family_name = ?, country_id = ?, guest_count = ?,
         check_in_date = ?, check_out_date = ?, total_price = ?
     WHERE booking_id = ?`,
    [b.room_id, b.first_name, b.family_name, b.country_id, b.guest_count, b.check_in_date, b.check_out_date, b.total_price, bookingId]
  );
}

async function remove(bookingId) {
  const [result] = await pool.execute('DELETE FROM bookings WHERE booking_id = ?', [bookingId]);
  return result.affectedRows > 0;
}

// BR-10: overlap, hvis ny.check_in < eksisterende.check_out OG ny.check_out > eksisterende.check_in.
async function findOverlapping(roomId, checkIn, checkOut, excludeBookingId) {
  const [rows] = await pool.execute(
    `SELECT booking_id FROM bookings
     WHERE room_id = ? AND check_in_date < ? AND check_out_date > ? AND booking_id <> ?`,
    [roomId, checkOut, checkIn, excludeBookingId || 0]
  );
  return rows;
}

module.exports = { findById, list, create, update, remove, findOverlapping };
