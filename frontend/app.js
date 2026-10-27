const API = '/api/bookings';
const form = document.getElementById('bookingForm');
const tableBody = document.getElementById('bookingsBody');
const emptyState = document.getElementById('emptyState');
const statusMsg = document.getElementById('statusMsg');
const btnToggle = document.getElementById('btnToggleForm');
const btnSave = document.getElementById('btnSave');
const btnCancel = document.getElementById('btnCancel');
const fId = document.getElementById('fId');
const fields = ['fGuestName', 'fEmail', 'fRoomNumber', 'fCheckIn', 'fCheckOut', 'fStatus'];

let editingId = null;

function showMsg(text, type) {
  statusMsg.textContent = text;
  statusMsg.className = `message ${type === 'error' ? 'error' : 'success'}`;
  statusMsg.classList.remove('hidden');
  setTimeout(() => statusMsg.classList.add('hidden'), 4000);
}

function resetForm() {
  form.reset();
  fId.value = '';
  editingId = null;
  btnSave.textContent = 'Gem booking';
  fields.forEach((id) => {
    document.getElementById(id).disabled = false;
  });
  form.classList.add('hidden');
  btnToggle.innerHTML = '<span class="button-icon" aria-hidden="true">+</span> Opret booking';
  document.querySelectorAll('.edit-form').forEach((element) => element.classList.remove('show'));
}

btnToggle.addEventListener('click', () => {
  if (form.classList.contains('hidden')) {
    resetForm();
    form.classList.remove('hidden');
    btnToggle.textContent = 'Luk opret formular';
  } else {
    resetForm();
  }
});

btnCancel.addEventListener('click', resetForm);

async function loadBookings() {
  try {
    const response = await fetch(API);
    if (!response.ok) throw new Error('Kunne ikke hente bookinger');
    const bookings = await response.json();
    render(bookings);
  } catch (error) {
    console.error(error);
    showMsg(`Fejl ved indlæsning af bookinger: ${error.message}`, 'error');
  }
}

function render(bookings) {
  tableBody.innerHTML = '';
  if (!bookings || bookings.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  for (const booking of bookings) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${booking.id}</td>
      <td><strong>${escapeHtml(booking.guestName)}</strong></td>
      <td>${escapeHtml(booking.email)}</td>
      <td>${booking.roomNumber}</td>
      <td>${formatDate(booking.checkIn)}</td>
      <td>${formatDate(booking.checkOut)}</td>
      <td><span class="status ${booking.status}">${booking.status}</span></td>
      <td>${formatDateTime(booking.createdAt)}</td>
      <td class="actions"></td>
    `;
    tableBody.appendChild(row);

    const actions = row.querySelector('.actions');
    const editButton = document.createElement('button');
    editButton.textContent = 'Rediger';
    editButton.className = 'secondary';
    editButton.type = 'button';
    editButton.onclick = () => openEditForm(row);
    actions.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Slet';
    deleteButton.className = 'danger';
    deleteButton.type = 'button';
    deleteButton.onclick = () => deleteBooking(booking.id);
    actions.appendChild(deleteButton);

    const editForm = document.createElement('div');
    editForm.className = 'edit-form';
    editForm.innerHTML = `
      <div><label>Gæst</label><input type="text" class="eGuestName" value="${escapeHtml(booking.guestName)}" required /></div>
      <div><label>E-mail</label><input type="email" class="eEmail" value="${escapeHtml(booking.email)}" required /></div>
      <div><label>Værelse</label><input type="number" class="eRoomNumber" min="1" step="1" value="${booking.roomNumber}" required /></div>
      <div><label>Indtjek</label><input type="date" class="eCheckIn" value="${formatDateInput(booking.checkIn)}" required /></div>
      <div><label>Udtjek</label><input type="date" class="eCheckOut" value="${formatDateInput(booking.checkOut)}" required /></div>
      <div><label>Status</label><select class="eStatus">
        <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Bekræftet</option>
        <option value="checked_in" ${booking.status === 'checked_in' ? 'selected' : ''}>Indtjekket</option>
        <option value="checked_out" ${booking.status === 'checked_out' ? 'selected' : ''}>Udtjekket</option>
        <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Annulleret</option>
      </select></div>
      <div class="edit-actions">
        <button class="eSave" type="button">Gem ændringer</button>
        <button class="eCancel" type="button">Fortryd</button>
      </div>
    `;
    row.after(editForm);

    const saveEditButton = editForm.querySelector('.eSave');
    const cancelEditButton = editForm.querySelector('.eCancel');
    saveEditButton.onclick = () => {
      const updatedBooking = {
        guestName: editForm.querySelector('.eGuestName').value,
        email: editForm.querySelector('.eEmail').value,
        roomNumber: parseInt(editForm.querySelector('.eRoomNumber').value, 10),
        checkIn: editForm.querySelector('.eCheckIn').value,
        checkOut: editForm.querySelector('.eCheckOut').value,
        status: editForm.querySelector('.eStatus').value,
      };
      updateBooking(booking.id, updatedBooking);
    };
    cancelEditButton.onclick = () => editForm.classList.remove('show');
  }
}

function openEditForm(row) {
  document.querySelectorAll('.edit-form').forEach((element) => element.classList.remove('show'));
  row.nextElementSibling.classList.add('show');
}

async function createBooking(booking) {
  const response = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    showMsg(error.error || 'Kunne ikke oprette booking', 'error');
    throw new Error(error.error || 'create failed');
  }
  showMsg('Booking oprettet', 'success');
  resetForm();
  loadBookings();
}

async function updateBooking(id, booking) {
  const response = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    showMsg(error.error || 'Kunne ikke opdatere booking', 'error');
    throw new Error(error.error || 'update failed');
  }
  showMsg('Booking opdateret', 'success');
  loadBookings();
}

async function deleteBooking(id) {
  if (!confirm('Er du sikker på, at du vil slette denne booking?')) return;
  const response = await fetch(`${API}/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    showMsg('Kunne ikke slette booking', 'error');
    return;
  }
  showMsg('Booking slettet', 'success');
  loadBookings();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const booking = {
    guestName: document.getElementById('fGuestName').value,
    email: document.getElementById('fEmail').value,
    roomNumber: parseInt(document.getElementById('fRoomNumber').value, 10),
    checkIn: document.getElementById('fCheckIn').value,
    checkOut: document.getElementById('fCheckOut').value,
    status: document.getElementById('fStatus').value,
  };
  if (editingId) {
    updateBooking(editingId, booking);
  } else {
    createBooking(booking);
  }
});

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('da-DK');
}

function formatDateInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('da-DK');
}

function escapeHtml(text) {
  if (!text) return '';
  const element = document.createElement('div');
  element.textContent = text;
  return element.innerHTML;
}

loadBookings();
