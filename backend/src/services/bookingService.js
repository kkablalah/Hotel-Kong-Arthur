import pool from '../db.js';

// --- Forretningslogiklag: booking tjenester ---

export const getAllBookings = async () => {
  const [rows] = await pool.query(
    'SELECT id, guest_name AS guestName, email, room_number AS roomNumber, check_in AS checkIn, check_out AS checkOut, nightly_rate AS nightlyRate, status, created_at AS createdAt FROM bookings ORDER BY created_at DESC'
  );
  return rows;
};

export const getBookingById = async (id) => {
  const [rows] = await pool.query(
    'SELECT id, guest_name AS guestName, email, room_number AS roomNumber, check_in AS checkIn, check_out AS checkOut, nightly_rate AS nightlyRate, status, created_at AS createdAt FROM bookings WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

const dateOnly = (value) => value instanceof Date ? value.toISOString().slice(0, 10) : String(value || '').slice(0, 10);
const isValidDate = (value) => {
  const date = dateOnly(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
};

const validateStay = (checkIn, checkOut) => {
  const start = dateOnly(checkIn);
  const end = dateOnly(checkOut);
  if (!isValidDate(start) || !isValidDate(end) || end <= start) {
    const error = new Error('checkIn og checkOut skal være gyldige datoer, og checkOut skal være efter checkIn');
    error.status = 400;
    throw error;
  }
};

const validateRoomAvailability = async (roomNumber, checkIn, checkOut, status, excludeId) => {
  if (status === 'cancelled') return;

  const [conflicts] = await pool.query(
    `SELECT id FROM bookings
     WHERE room_number = ?
       AND status <> 'cancelled'
       AND check_in < ?
       AND check_out > ?
       AND id <> COALESCE(?, 0)
     LIMIT 1`,
    [roomNumber, checkOut, checkIn, excludeId]
  );
  if (conflicts.length > 0) {
    const error = new Error('Værelset er allerede booket i den valgte periode');
    error.status = 409;
    throw error;
  }
};

export const createBooking = async (booking) => {
  const { guestName, email, roomNumber, checkIn, checkOut, status = 'confirmed', nightlyRate = 1500 } = booking;

  validateStay(checkIn, checkOut);
  if (typeof guestName !== 'string' || guestName.trim().length === 0 || guestName.length > 100 ||
      typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100 ||
      !Number.isInteger(Number(roomNumber)) || Number(roomNumber) < 1 ||
      !Number.isFinite(Number(nightlyRate)) || Number(nightlyRate) <= 0 || Number(nightlyRate) > 99999999.99 ||
      !['confirmed', 'cancelled', 'checked_in', 'checked_out'].includes(status)) {
    const error = new Error('Ugyldige bookingoplysninger; kontroller navn, e-mail, værelse, pris og status');
    error.status = 400;
    throw error;
  }

  await validateRoomAvailability(roomNumber, checkIn, checkOut, status);

  const [result] = await pool.query(
    `INSERT INTO bookings (guest_name, email, room_number, check_in, check_out, nightly_rate, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [guestName, email, roomNumber, checkIn, checkOut, nightlyRate, status]
  );

  return getBookingById(result.insertId);
};

export const updateBooking = async (id, booking) => {
  const existing = await getBookingById(id);
  if (!existing) {
    return null;
  }
  if (Object.keys(booking).length === 0) {
    const error = new Error('Mindst ét felt skal ændres');
    error.status = 400;
    throw error;
  }

  const { guestName, email, roomNumber, checkIn, checkOut, nightlyRate, status } = booking;

  const checkInDate = checkIn !== undefined ? dateOnly(checkIn) : dateOnly(existing.checkIn);
  const checkOutDate = checkOut !== undefined ? dateOnly(checkOut) : dateOnly(existing.checkOut);
  const nextStatus = status !== undefined ? status : existing.status;

  validateStay(checkInDate, checkOutDate);
  if (nightlyRate !== undefined && (!Number.isFinite(Number(nightlyRate)) || Number(nightlyRate) <= 0 || Number(nightlyRate) > 99999999.99)) {
    const error = new Error('nightlyRate skal være et positivt tal');
    error.status = 400;
    throw error;
  }
  if (guestName !== undefined && (typeof guestName !== 'string' || guestName.trim().length === 0 || guestName.length > 100)) {
    const error = new Error('guestName skal være tekst med højst 100 tegn');
    error.status = 400;
    throw error;
  }
  if (email !== undefined && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100)) {
    const error = new Error('email skal være en gyldig e-mailadresse med højst 100 tegn');
    error.status = 400;
    throw error;
  }
  if (roomNumber !== undefined && (!Number.isInteger(Number(roomNumber)) || Number(roomNumber) < 1)) {
    const error = new Error('roomNumber skal være et positivt heltal');
    error.status = 400;
    throw error;
  }
  if (status !== undefined && !['confirmed', 'cancelled', 'checked_in', 'checked_out'].includes(status)) {
    const error = new Error('status er ugyldig');
    error.status = 400;
    throw error;
  }
  await validateRoomAvailability(
    roomNumber !== undefined ? roomNumber : existing.roomNumber,
    checkInDate,
    checkOutDate,
    nextStatus,
    id
  );

  await pool.query(
    `UPDATE bookings
     SET guest_name = COALESCE(?, guest_name),
         email = COALESCE(?, email),
         room_number = COALESCE(?, room_number),
         check_in = COALESCE(?, check_in),
         check_out = COALESCE(?, check_out),
         nightly_rate = COALESCE(?, nightly_rate),
         status = COALESCE(?, status)
     WHERE id = ?`,
    [guestName, email, roomNumber, checkIn, checkOut, nightlyRate, status, id]
  );

  return getBookingById(id);
};

export const deleteBooking = async (id) => {
  const existing = await getBookingById(id);
  if (!existing) {
    return false;
  }
  await pool.query('DELETE FROM bookings WHERE id = ?', [id]);
  return true;
};
