import pool from '../db.js';

// --- Forretningslogiklag: booking tjenester ---

export const getAllBookings = async () => {
  const [rows] = await pool.query(
    'SELECT id, guest_name AS guestName, email, room_number AS roomNumber, check_in AS checkIn, check_out AS checkOut, status, created_at AS createdAt FROM bookings ORDER BY created_at DESC'
  );
  return rows;
};

export const getBookingById = async (id) => {
  const [rows] = await pool.query(
    'SELECT id, guest_name AS guestName, email, room_number AS roomNumber, check_in AS checkIn, check_out AS checkOut, status, created_at AS createdAt FROM bookings WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

export const createBooking = async (booking) => {
  const { guestName, email, roomNumber, checkIn, checkOut, status = 'confirmed' } = booking;

  // Forretningsregel: check-out skal være efter check-in
  if (new Date(checkOut) <= new Date(checkIn)) {
    const error = new Error('check_out skal være efter check_in');
    error.status = 400;
    throw error;
  }

  const [result] = await pool.query(
    `INSERT INTO bookings (guest_name, email, room_number, check_in, check_out, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [guestName, email, roomNumber, checkIn, checkOut, status]
  );

  return getBookingById(result.insertId);
};

export const updateBooking = async (id, booking) => {
  const existing = await getBookingById(id);
  if (!existing) {
    return null;
  }

  const { guestName, email, roomNumber, checkIn, checkOut, status } = booking;

  const checkInDate = checkIn !== undefined ? checkIn : existing.checkIn;
  const checkOutDate = checkOut !== undefined ? checkOut : existing.checkOut;

  if (new Date(checkOutDate) <= new Date(checkInDate)) {
    const error = new Error('check_out skal være efter check_in');
    error.status = 400;
    throw error;
  }

  await pool.query(
    `UPDATE bookings
     SET guest_name = COALESCE(?, guest_name),
         email = COALESCE(?, email),
         room_number = COALESCE(?, room_number),
         check_in = COALESCE(?, check_in),
         check_out = COALESCE(?, check_out),
         status = COALESCE(?, status)
     WHERE id = ?`,
    [guestName, email, roomNumber, checkIn, checkOut, status, id]
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
