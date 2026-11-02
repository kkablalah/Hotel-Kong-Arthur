// Forretningsregler for en booking (FR-01, BR-02, BR-10). Returnerer en liste af fejl.
function validateBooking(booking, room) {
  const errors = [];

  if (!room) {
    errors.push({ field: 'room_id', message: 'Værelset findes ikke' });
  }
  if (booking.check_in_date >= booking.check_out_date) {
    errors.push({ field: 'check_out_date', message: 'Udtjekning skal være efter indtjekning (mindst én nat)' });
  }
  if (booking.total_price <= 0) {
    errors.push({ field: 'total_price', message: 'Prisen skal være større end 0' });
  }
  if (booking.guest_count < 1) {
    errors.push({ field: 'guest_count', message: 'Der skal være mindst 1 gæst' });
  } else if (room && booking.guest_count > room.capacity) {
    errors.push({ field: 'guest_count', message: `Værelset har plads til højst ${room.capacity} gæster` });
  }

  return errors;
}

module.exports = { validateBooking };
