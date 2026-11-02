import pool, { databaseClient } from '../db.js';

const usesPostgres = databaseClient === 'postgres';
const parameter = (number) => (usesPostgres ? `$${number}` : '?');

const bookingColumns = usesPostgres
  ? 'id, guest_name AS "guestName", email, room_number AS "roomNumber", check_in AS "checkIn", check_out AS "checkOut", status, created_at AS "createdAt"'
  : 'id, guest_name AS guestName, email, room_number AS roomNumber, check_in AS checkIn, check_out AS checkOut, status, created_at AS createdAt';

const queryRows = async (sql, values = []) => {
  if (usesPostgres) {
    const result = await pool.query(sql, values);
    return result.rows;
  }

  const [rows] = await pool.query(sql, values);
  return rows;
};

const isValidId = (id) => {
  if (!/^[1-9]\d*$/.test(String(id))) return false;
  const value = Number(id);
  return Number.isSafeInteger(value) && value <= 2147483647;
};

export const getAll = async () => queryRows(
  `SELECT ${bookingColumns} FROM bookings ORDER BY created_at DESC`
);

export const getById = async (id) => {
  if (!isValidId(id)) return null;

  const rows = await queryRows(
    `SELECT ${bookingColumns} FROM bookings WHERE id = ${parameter(1)}`,
    [Number(id)]
  );
  return rows[0] || null;
};

export const insert = async ({ guestName, email, roomNumber, checkIn, checkOut, status }) => {
  const values = [guestName, email, roomNumber, checkIn, checkOut, status];
  const sql = `INSERT INTO bookings (guest_name, email, room_number, check_in, check_out, status)
    VALUES (${values.map((_, index) => parameter(index + 1)).join(', ')})`;

  if (usesPostgres) {
    const result = await pool.query(`${sql} RETURNING id`, values);
    return getById(result.rows[0].id);
  }

  const [result] = await pool.query(sql, values);
  return getById(result.insertId);
};

export const update = async (id, { guestName, email, roomNumber, checkIn, checkOut, status }) => {
  if (!isValidId(id)) return null;
  const existing = await getById(id);
  if (!existing) return null;

  const values = [guestName, email, roomNumber, checkIn, checkOut, status, Number(id)];
  await pool.query(
    `UPDATE bookings
     SET guest_name = ${parameter(1)},
         email = ${parameter(2)},
         room_number = ${parameter(3)},
         check_in = ${parameter(4)},
         check_out = ${parameter(5)},
         status = ${parameter(6)}
     WHERE id = ${parameter(7)}`,
    values
  );

  return getById(id);
};

export const remove = async (id) => {
  if (!isValidId(id)) return false;
  const existing = await getById(id);
  if (!existing) return false;

  await pool.query(`DELETE FROM bookings WHERE id = ${parameter(1)}`, [Number(id)]);
  return true;
};
