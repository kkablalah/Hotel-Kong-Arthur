import * as bookingRepository from '../repositories/bookingRepository.js';

// --- Forretningslogiklag: validering og bookingregler ---

const VALID_STATUSES = new Set(['confirmed', 'cancelled', 'checked_in', 'checked_out']);
const MAX_INT = 2147483647;

const badRequest = (message) => {
  const error = new Error(message);
  error.status = 400;
  return error;
};

const isValidDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const year = Number(value.slice(0, 4));
  if (year < 1000 || year > 9999) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const validateBooking = (booking, { isUpdate = false } = {}) => {
  if (!booking || typeof booking !== 'object' || Array.isArray(booking)) {
    throw badRequest('Booking-data skal være et JSON-objekt.');
  }

  const guestName = typeof booking.guestName === 'string' ? booking.guestName.trim() : '';
  if (!guestName) {
    throw badRequest('guestName er påkrævet og må ikke være tomt.');
  }
  if (guestName.length > 100) {
    throw badRequest('guestName må højst være 100 tegn.');
  }

  const email = typeof booking.email === 'string' ? booking.email.trim() : '';
  if (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw badRequest('email skal være en gyldig e-mailadresse på højst 100 tegn.');
  }

  const roomNumber = booking.roomNumber;
  if (!Number.isInteger(roomNumber) || roomNumber < 1 || roomNumber > MAX_INT) {
    throw badRequest('roomNumber skal være et heltal større end 0.');
  }

  const { checkIn, checkOut } = booking;
  if (!isValidDate(checkIn)) {
    throw badRequest('checkIn skal være en gyldig dato i formatet YYYY-MM-DD.');
  }
  if (!isValidDate(checkOut)) {
    throw badRequest('checkOut skal være en gyldig dato i formatet YYYY-MM-DD.');
  }
  if (checkOut <= checkIn) {
    throw badRequest('checkOut skal være efter checkIn.');
  }

  const status = booking.status === undefined && !isUpdate ? 'confirmed' : booking.status;
  if (!VALID_STATUSES.has(status)) {
    throw badRequest(`status skal være en af: ${[...VALID_STATUSES].join(', ')}.`);
  }

  return { guestName, email, roomNumber, checkIn, checkOut, status };
};

export const getAllBookings = () => bookingRepository.getAll();

export const getBookingById = (id) => bookingRepository.getById(id);

export const createBooking = async (booking) => {
  const validated = validateBooking(booking);
  return bookingRepository.insert(validated);
};

export const updateBooking = async (id, booking) => {
  const validated = validateBooking(booking, { isUpdate: true });
  return bookingRepository.update(id, validated);
};

export const deleteBooking = (id) => bookingRepository.remove(id);
