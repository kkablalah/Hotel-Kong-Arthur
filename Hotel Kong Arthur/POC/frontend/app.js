// Frontend uden framework. Alle kald går til /api, som Nginx sender videre til backenden.
const form = document.getElementById('booking-form');
const fieldNames = ['room_id', 'first_name', 'family_name', 'country_id', 'guest_count', 'check_in_date', 'check_out_date', 'total_price'];
let editingId = null;
let ratingBookingId = null;
let rooms = [];

function field(name) {
  return document.getElementById(name);
}

function showMessage(text, isError = false) {
  const box = document.getElementById('message');
  box.textContent = text;
  box.className = isError ? 'error' : '';
  box.hidden = !text;
}

// Henter JSON fra API'et. Ved fejl kastes API'ets egen besked og eventuelle detaljer.
async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json' },
  });
  if (response.status === 204) return null;

  const body = await response.json();
  if (!response.ok) {
    const details = (body.error.details || []).map((d) => `${d.field}: ${d.message}`);
    throw new Error([body.error.message, ...details].join('\n'));
  }
  return body;
}

function addOption(select, value, text) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = text;
  select.append(option);
}

async function loadChoices() {
  const [roomTypes, countries] = await Promise.all([api('/room-types'), api('/countries')]);
  rooms = await api('/rooms');

  const list = document.getElementById('room-types');
  list.replaceChildren(...roomTypes.map((t) => {
    const item = document.createElement('li');
    item.textContent = t.name;
    return item;
  }));

  field('room_id').replaceChildren();
  rooms.forEach((r) => addOption(field('room_id'), r.room_id, `${r.room_number}: ${r.room_type} (højst ${r.capacity} gæster)`));

  field('country_id').replaceChildren();
  addOption(field('country_id'), '', 'Ukendt');
  countries.forEach((c) => addOption(field('country_id'), c.country_id, c.name));

  document.getElementById('no-rooms').hidden = rooms.length > 0;
  document.getElementById('submit-button').disabled = rooms.length === 0;
}

function roomLabel(roomId) {
  const room = rooms.find((r) => r.room_id === roomId);
  return room ? String(room.room_number) : String(roomId);
}

function bookingRow(booking) {
  const row = document.createElement('tr');
  const cells = [
    booking.booking_id,
    roomLabel(booking.room_id),
    `${booking.first_name} ${booking.family_name}`,
    booking.guest_count,
    booking.check_in_date,
    booking.check_out_date,
    booking.total_price,
  ];
  cells.forEach((value) => {
    const cell = document.createElement('td');
    cell.textContent = value;
    row.append(cell);
  });

  const actions = document.createElement('td');
  actions.className = 'buttons';
  const edit = document.createElement('button');
  edit.textContent = 'Ret';
  edit.className = 'secondary';
  edit.addEventListener('click', () => startEdit(booking));
  const remove = document.createElement('button');
  remove.textContent = 'Slet';
  remove.className = 'secondary';
  remove.addEventListener('click', () => deleteBooking(booking));
  const rate = document.createElement('button');
  rate.textContent = 'Rating';
  rate.className = 'secondary';
  rate.addEventListener('click', () => startRating(booking));
  actions.append(edit, rate, remove);
  row.append(actions);
  return row;
}

async function loadBookings() {
  const bookings = await api('/bookings');
  document.getElementById('bookings').replaceChildren(...bookings.map(bookingRow));
  document.getElementById('no-bookings').hidden = bookings.length > 0;

  const running = await api('/metrics/revenue/running');
  document.getElementById('running').textContent =
    `Løbende indtjening fra nye bookinger: ${running.revenue_dkk} DKK (${running.bookings_count} bookinger)`;

  await loadSatisfaction();
}

async function loadSatisfaction() {
  const year = new Date().getFullYear();
  const result = await api(`/metrics/satisfaction?start_date=${year}-01-01&end_date=${year}-12-31`);
  document.getElementById('satisfaction').textContent = result.rating_count === 0
    ? `Kundetilfredshed for ophold i ${year}: ingen ratings endnu`
    : `Kundetilfredshed for ophold i ${year}: ${result.average_rating} ud af 5 (${result.rating_count} ratings)`;
}

function startRating(booking) {
  ratingBookingId = booking.booking_id;
  document.getElementById('rating-title').textContent =
    `Giv rating for booking ${booking.booking_id} (${booking.first_name} ${booking.family_name})`;
  document.getElementById('rating-section').hidden = false;
  showMessage('');
}

function resetRating() {
  ratingBookingId = null;
  document.getElementById('rating-form').reset();
  document.getElementById('rating-section').hidden = true;
}

async function saveRating(event) {
  event.preventDefault();
  const comment = field('comment').value.trim();
  try {
    await api(`/bookings/${ratingBookingId}/satisfaction`, {
      method: 'POST',
      body: JSON.stringify({ rating: Number(field('rating').value), comment: comment === '' ? null : comment }),
    });
    showMessage(`Rating for booking ${ratingBookingId} er gemt.`);
    resetRating();
    await loadSatisfaction();
  } catch (error) {
    showMessage(error.message, true);
  }
}

function startEdit(booking) {
  editingId = booking.booking_id;
  fieldNames.forEach((name) => {
    field(name).value = booking[name] ?? '';
  });
  document.getElementById('form-title').textContent = `Ret booking ${booking.booking_id}`;
  document.getElementById('submit-button').textContent = 'Gem ændringer';
  document.getElementById('cancel-button').hidden = false;
  showMessage('');
}

function resetForm() {
  editingId = null;
  form.reset();
  document.getElementById('form-title').textContent = 'Opret booking';
  document.getElementById('submit-button').textContent = 'Opret booking';
  document.getElementById('cancel-button').hidden = true;
}

function formValues() {
  return {
    room_id: Number(field('room_id').value),
    first_name: field('first_name').value,
    family_name: field('family_name').value,
    country_id: field('country_id').value === '' ? null : Number(field('country_id').value),
    guest_count: Number(field('guest_count').value),
    check_in_date: field('check_in_date').value,
    check_out_date: field('check_out_date').value,
    total_price: Number(field('total_price').value),
  };
}

async function saveBooking(event) {
  event.preventDefault();
  try {
    const body = JSON.stringify(formValues());
    if (editingId === null) {
      const created = await api('/bookings', { method: 'POST', body });
      showMessage(`Booking ${created.booking_id} er oprettet.`);
    } else {
      await api(`/bookings/${editingId}`, { method: 'PUT', body });
      showMessage(`Booking ${editingId} er rettet.`);
    }
    resetForm();
    await loadBookings();
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function deleteBooking(booking) {
  const text = `Vil du slette booking ${booking.booking_id} for ${booking.first_name} ${booking.family_name}, ${booking.check_in_date} til ${booking.check_out_date}?`;
  if (!window.confirm(text)) return;
  try {
    await api(`/bookings/${booking.booking_id}`, { method: 'DELETE' });
    showMessage(`Booking ${booking.booking_id} er slettet.`);
    if (editingId === booking.booking_id) resetForm();
    await loadBookings();
  } catch (error) {
    showMessage(error.message, true);
  }
}

form.addEventListener('submit', saveBooking);
document.getElementById('cancel-button').addEventListener('click', resetForm);
document.getElementById('rating-form').addEventListener('submit', saveRating);
document.getElementById('rating-cancel').addEventListener('click', resetRating);

loadChoices()
  .then(loadBookings)
  .catch((error) => showMessage(`Kunne ikke hente data: ${error.message}`, true));
