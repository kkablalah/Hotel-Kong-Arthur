const API = '/api/bookings';
const ANALYSIS_API = '/api/analysis';
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

const bookingsTab = document.getElementById('bookingsTab');
const analysisTab = document.getElementById('analysisTab');
const bookingsView = document.getElementById('bookingsView');
const analysisView = document.getElementById('analysisView');
const refreshAnalysis = document.getElementById('refreshAnalysis');
const analysisStatus = document.getElementById('analysisStatus');
const analysisError = document.getElementById('analysisError');
let analysisLoaded = false;
let analysisLoading = false;
let filterOptionsLoaded = false;

function activateView(view, shouldLoad = true) {
  const showAnalysis = view === 'analysis';
  bookingsView.classList.toggle('hidden', showAnalysis);
  analysisView.classList.toggle('hidden', !showAnalysis);
  bookingsTab.classList.toggle('is-active', !showAnalysis);
  analysisTab.classList.toggle('is-active', showAnalysis);
  bookingsTab.setAttribute('aria-selected', String(!showAnalysis));
  analysisTab.setAttribute('aria-selected', String(showAnalysis));
  if (showAnalysis && shouldLoad && !analysisLoaded && !analysisLoading) loadAnalysis();
}

bookingsTab.addEventListener('click', () => {
  if (window.location.hash !== '#bookings') window.location.hash = 'bookings';
  activateView('bookings');
});
analysisTab.addEventListener('click', () => {
  if (window.location.hash !== '#analysis') window.location.hash = 'analysis';
  activateView('analysis');
});
window.addEventListener('hashchange', () => {
  activateView(window.location.hash === '#analysis' ? 'analysis' : 'bookings');
});
refreshAnalysis.addEventListener('click', loadAnalysis);

const currencyFormatter = new Intl.NumberFormat('da-DK', {
  style: 'currency', currency: 'DKK', minimumFractionDigits: 2, maximumFractionDigits: 2,
});
const numberFormatter = new Intl.NumberFormat('da-DK');
const decimalFormatter = new Intl.NumberFormat('da-DK', {
  minimumFractionDigits: 0, maximumFractionDigits: 3,
});
const percentFormatter = new Intl.NumberFormat('da-DK', {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});

function formatCurrency(value) {
  return value === null || value === undefined ? '—' : currencyFormatter.format(Number(value));
}

function emptyTableRow(colspan, message = 'Ingen data matcher de valgte filtre.') {
  return `<tr><td class="analysis-empty" colspan="${colspan}">${escapeHtml(message)}</td></tr>`;
}

function populateFilter(selectId, values, allLabel) {
  const select = document.getElementById(selectId);
  const previous = select.value;
  select.innerHTML = `<option value="">${escapeHtml(allLabel)}</option>`
    + values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
  if (values.includes(previous)) select.value = previous;
}

async function analysisFetch(path, query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const suffix = params.size ? `?${params.toString()}` : '';
  const response = await fetch(`${ANALYSIS_API}${path}${suffix}`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `API-fejl (${response.status}).`);
  return body;
}

function currentHotelFilters() {
  return {
    country: document.getElementById('filterCountry').value,
    roomType: document.getElementById('filterRoomType').value,
    season: document.getElementById('filterSeason').value,
  };
}

function renderAnalysis(result) {
  const { summary, stayCounts, countryRevenue, roomSeason, topCountry, topRoom, average, barSummary, products, shares } = result;
  document.getElementById('hotelAmount').textContent = formatCurrency(summary.data.totalAmount);
  document.getElementById('barAmount').textContent = formatCurrency(barSummary.data.totalRevenue);
  document.getElementById('stayCount').textContent = numberFormatter.format(summary.data.registeredStays);
  document.getElementById('averageDays').textContent = average.data.averageDaysRented === null
    ? '—' : decimalFormatter.format(average.data.averageDaysRented);

  const revenueByCountry = new Map(countryRevenue.data.map((row) => [row.country, row]));
  document.getElementById('countryRows').innerHTML = stayCounts.data.length
    ? stayCounts.data.map((row) => {
      const revenue = revenueByCountry.get(row.country);
      return `<tr><td>${escapeHtml(row.country)}</td><td>${numberFormatter.format(row.registeredStays)}</td><td>${formatCurrency(revenue?.amount)}</td></tr>`;
    }).join('') : emptyTableRow(3);

  document.getElementById('roomSeasonRows').innerHTML = roomSeason.data.length
    ? roomSeason.data.map((row) => `<tr><td>${escapeHtml(row.roomType)}</td><td>${escapeHtml(row.season)}</td><td>${numberFormatter.format(row.registeredStays)}</td><td>${formatCurrency(row.amount)}</td></tr>`).join('')
    : emptyTableRow(4);

  renderLeaders('topCountry', topCountry.data);
  renderLeaders('topRoomType', topRoom.data);

  document.getElementById('productRows').innerHTML = products.data.length
    ? products.data.map((row) => `<tr><td>${escapeHtml(row.drinkName)}</td><td>${escapeHtml(row.category)}</td><td>${formatCurrency(row.unitPrice)}</td><td>${numberFormatter.format(row.unitsSold)}</td><td>${formatCurrency(row.revenue)}</td></tr>`).join('')
    : emptyTableRow(5);

  const categories = shares.data.categories;
  document.getElementById('categoryRows').innerHTML = categories.length
    ? categories.map((row) => `<tr><td>${escapeHtml(row.category)}<span class="share-track" aria-hidden="true"><span style="width:${Number(row.sharePercent)}%"></span></span></td><td>${numberFormatter.format(row.unitsSold)}</td><td>${percentFormatter.format(row.sharePercent)} %</td></tr>`).join('')
    : emptyTableRow(3);
  document.getElementById('categoryTotal').textContent = categories.length
    ? `I alt ${numberFormatter.format(shares.data.totalUnitsSold)} solgte enheder.`
    : 'Der er ingen kategoridata at vise.';

  document.getElementById('hotelBasis').textContent = `${summary.dataBasis.source} ${summary.dataBasis.measure} ${summary.dataBasis.assumptions.join(' ')}`;
  document.getElementById('barBasis').textContent = `${barSummary.dataBasis.source} ${barSummary.dataBasis.measure} ${barSummary.dataBasis.assumptions.join(' ')}`;
}

function renderLeaders(elementId, data) {
  const target = document.getElementById(elementId);
  if (!data.leaders.length) {
    target.innerHTML = '<p class="analysis-empty-copy">Ingen data matcher de valgte filtre.</p>';
    return;
  }
  target.innerHTML = `<p class="leader-amount">${formatCurrency(data.maximumAmount)}</p>`
    + data.leaders.map((leader) => `<div class="leader-row"><span>${escapeHtml(leader.value)}</span><span>${formatCurrency(leader.amount)}</span></div>`).join('');
}

async function loadAnalysis() {
  if (analysisLoading) return;
  analysisLoading = true;
  const filters = currentHotelFilters();
  const category = document.getElementById('filterCategory').value;
  refreshAnalysis.disabled = true;
  refreshAnalysis.setAttribute('aria-busy', 'true');
  analysisStatus.textContent = 'Henter analyser fra API’et …';
  analysisError.classList.add('hidden');

  try {
    const [summary, stayCounts, countryRevenue, roomSeason, topCountry, topRoom, average, barSummary, products, shares] = await Promise.all([
      analysisFetch('/hotel/summary', filters),
      analysisFetch('/hotel/stay-counts-by-country', filters),
      analysisFetch('/hotel/revenue-by-country', filters),
      analysisFetch('/hotel/revenue-by-room-type-season', filters),
      analysisFetch('/hotel/top-revenue', { ...filters, groupBy: 'country' }),
      analysisFetch('/hotel/top-revenue', { ...filters, groupBy: 'roomType' }),
      analysisFetch('/hotel/average-stay-length', filters),
      analysisFetch('/bar/summary', { category }),
      analysisFetch('/bar/products', { category }),
      analysisFetch('/bar/category-shares'),
    ]);

    if (!filterOptionsLoaded) {
      populateFilter('filterCountry', stayCounts.data.map((row) => row.country), 'Alle lande');
      populateFilter('filterRoomType', [...new Set(roomSeason.data.map((row) => row.roomType))].sort(), 'Alle værelsestyper');
      populateFilter('filterSeason', [...new Set(roomSeason.data.map((row) => row.season))].sort(), 'Alle sæsoner');
      populateFilter('filterCategory', shares.data.categories.map((row) => row.category), 'Alle kategorier');
      filterOptionsLoaded = true;
    }
    renderAnalysis({ summary, stayCounts, countryRevenue, roomSeason, topCountry, topRoom, average, barSummary, products, shares });
    analysisLoaded = true;
    analysisStatus.textContent = `Data opdateret ${new Intl.DateTimeFormat('da-DK', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}.`;
  } catch (error) {
    analysisError.textContent = `Analyserne kunne ikke hentes. ${error.message}`;
    analysisError.classList.remove('hidden');
    analysisStatus.textContent = 'Kontrollér forbindelsen, og prøv igen.';
  } finally {
    analysisLoading = false;
    refreshAnalysis.disabled = false;
    refreshAnalysis.removeAttribute('aria-busy');
  }
}

loadBookings();
activateView(window.location.hash === '#analysis' ? 'analysis' : 'bookings');
