// Forretningslogik for bookinger: validering og dobbeltbooking (FR-01, BR-10).
const bookingRepository = require('../../data/repositories/bookingRepository');
const roomRepository = require('../../data/repositories/roomRepository');
const countryRepository = require('../../data/repositories/countryRepository');
const satisfactionRepository = require('../../data/repositories/satisfactionRepository');
const { validateBooking } = require('../validators/bookingValidator');
const { BusinessError } = require('../errors');

async function checkRules(input, ownBookingId) {
  const booking = { ...input, country_id: input.country_id ?? null };
  const room = await roomRepository.findById(booking.room_id);
  const errors = validateBooking(booking, room);

  if (booking.country_id !== null && !(await countryRepository.findById(booking.country_id))) {
    errors.push({ field: 'country_id', message: 'Landet findes ikke' });
  }
  if (errors.length > 0) {
    throw new BusinessError('VALIDATION_ERROR', 'Ugyldig booking', errors);
  }

  const overlapping = await bookingRepository.findOverlapping(
    booking.room_id,
    booking.check_in_date,
    booking.check_out_date,
    ownBookingId
  );
  if (overlapping.length > 0) {
    throw new BusinessError('CONFLICT', 'Værelset er allerede booket i perioden');
  }
  return booking;
}

async function get(bookingId) {
  const booking = await bookingRepository.findById(bookingId);
  if (!booking) throw new BusinessError('NOT_FOUND', 'Bookingen findes ikke');
  return booking;
}

function list(filters) {
  return bookingRepository.list(filters);
}

async function create(input) {
  const booking = await checkRules(input);
  const bookingId = await bookingRepository.create(booking);
  return get(bookingId);
}

async function update(bookingId, input) {
  await get(bookingId);
  const booking = await checkRules(input, bookingId);
  await bookingRepository.update(bookingId, booking);
  return get(bookingId);
}

async function remove(bookingId) {
  const removed = await bookingRepository.remove(bookingId);
  if (!removed) throw new BusinessError('NOT_FOUND', 'Bookingen findes ikke');
}

// BR-08: en rating skal høre til en eksisterende booking.
async function addRating(bookingId, input) {
  await get(bookingId);
  return satisfactionRepository.create(bookingId, input.rating, input.comment ?? null);
}

module.exports = { get, list, create, update, remove, addRating };
