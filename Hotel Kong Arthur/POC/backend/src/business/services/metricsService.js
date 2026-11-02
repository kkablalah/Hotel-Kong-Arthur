// Nøgletal for hotellet. Alle formler bor her (constitution princip I og VIII).
const occupancyRepository = require('../../data/repositories/occupancyRepository');
const revenueRepository = require('../../data/repositories/revenueRepository');
const guestsRepository = require('../../data/repositories/guestsRepository');
const satisfactionRepository = require('../../data/repositories/satisfactionRepository');
const { seasonOf } = require('../season');
const { historyYear } = require('../history');
const { toOre, oreToDkk, percent } = require('../money');
const { BusinessError } = require('../errors');

const TOTAL_ROOMS = 214;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const UNKNOWN_COUNTRY = 'Ukendt';

const toDayNumber = (isoDate) => Date.parse(`${isoDate}T00:00:00Z`) / MS_PER_DAY;

function checkPeriod(startDate, endDate) {
  if (startDate > endDate) {
    throw new BusinessError('VALIDATION_ERROR', 'start_date må ikke være efter end_date');
  }
}

// Perioden er med begge datoer, så 1.-31. januar er 31 nætter (B-29).
function nightsInPeriod(startDate, endDate) {
  return toDayNumber(endDate) - toDayNumber(startDate) + 1;
}

// BR-01: en nat d tæller, hvis check_in <= d < check_out.
function occupiedNights(bookings, startDate, endDate) {
  const firstNight = toDayNumber(startDate);
  const lastNight = toDayNumber(endDate);
  return bookings.reduce((sum, b) => {
    const from = Math.max(toDayNumber(b.check_in_date), firstNight);
    const to = Math.min(toDayNumber(b.check_out_date) - 1, lastNight);
    return sum + Math.max(0, to - from + 1);
  }, 0);
}

async function getOccupancy(startDate, endDate) {
  checkPeriod(startDate, endDate);
  const bookings = await occupancyRepository.findBookingsInPeriod(startDate, endDate);
  const occupied = occupiedNights(bookings, startDate, endDate);
  const available = TOTAL_ROOMS * nightsInPeriod(startDate, endDate);
  return {
    period: { start_date: startDate, end_date: endDate },
    occupied_room_nights: occupied,
    available_room_nights: available,
    occupancy_pct: percent(occupied, available),
  };
}

const groupers = {
  type: (r) => ({ group: r.room_type }),
  season: (r) => ({ group: r.season }),
  country: (r) => ({ group: r.country }),
  year: (r) => ({ group: String(r.year) }),
  type_season: (r) => ({ group: `${r.room_type} / ${r.season}`, room_type: r.room_type, season: r.season }),
};

// Samler ophold og bookinger til samme form. Ophold kan ikke placeres i en periode (B-30).
async function loadRevenueRows(startDate, endDate) {
  const bookings = await revenueRepository.findBookings(startDate, endDate);
  const rows = bookings.map((b) => ({
    room_type: b.room_type,
    country: b.country || UNKNOWN_COUNTRY,
    season: seasonOf(b.check_in_date),
    year: Number(b.check_in_date.slice(0, 4)),
    ore: toOre(b.total_price),
    count: 1,
  }));
  if (startDate) return rows;

  const stays = await revenueRepository.findStayTotals();
  return rows.concat(
    stays.map((s) => ({
      room_type: s.room_type,
      country: s.country,
      season: s.season,
      year: historyYear(),
      ore: toOre(s.revenue),
      count: Number(s.stays_count),
    }))
  );
}

async function getRevenue(groupBy, startDate, endDate) {
  if (Boolean(startDate) !== Boolean(endDate)) {
    throw new BusinessError('VALIDATION_ERROR', 'Angiv både start_date og end_date eller ingen af dem');
  }
  if (startDate) checkPeriod(startDate, endDate);

  const rows = await loadRevenueRows(startDate, endDate);
  const groups = new Map();
  for (const row of rows) {
    const fields = groupers[groupBy](row);
    const entry = groups.get(fields.group) || { ...fields, ore: 0, stays_count: 0 };
    entry.ore += row.ore;
    entry.stays_count += row.count;
    groups.set(fields.group, entry);
  }

  const sorted = [...groups.values()].sort((a, b) => b.ore - a.ore);
  const totalOre = sorted.reduce((sum, g) => sum + g.ore, 0);
  return {
    period: startDate ? { start_date: startDate, end_date: endDate } : null,
    includes_history: !startDate,
    group_by: groupBy,
    total_dkk: oreToDkk(totalOre),
    rows: sorted.map(({ ore, ...fields }) => ({ ...fields, revenue_dkk: oreToDkk(ore) })),
  };
}

// BR-04: ophold tæller i HISTORIK_AAR, og bookinger tæller i det år, de tjekker ind.
// Uden aar bruges HISTORIK_AAR, som er det eneste år med komplette data.
async function getAnnualRevenue(year) {
  const chosenYear = year === undefined ? historyYear() : Number(year);
  const bookings = await revenueRepository.findBookings(`${chosenYear}-01-01`, `${chosenYear}-12-31`);
  const stays = chosenYear === historyYear() ? await revenueRepository.findStayTotals() : [];
  if (bookings.length === 0 && stays.length === 0) {
    throw new BusinessError('NO_DATA', `Der er ingen indtjening i ${chosenYear}`);
  }
  const bookingOre = bookings.reduce((sum, b) => sum + toOre(b.total_price), 0);
  const stayOre = stays.reduce((sum, s) => sum + toOre(s.revenue), 0);
  return {
    year: chosenYear,
    revenue_dkk: oreToDkk(bookingOre + stayOre),
    stays_count: stays.reduce((sum, s) => sum + Number(s.stays_count), 0),
    bookings_count: bookings.length,
  };
}

// Løbende indtjening: kun nye bookinger, så en demo-booking kan ses med det samme.
async function getRunningRevenue() {
  const bookings = await revenueRepository.findBookings();
  return {
    revenue_dkk: oreToDkk(bookings.reduce((sum, b) => sum + toOre(b.total_price), 0)),
    bookings_count: bookings.length,
  };
}

async function getGuestsByCountry(startDate, endDate) {
  if (Boolean(startDate) !== Boolean(endDate)) {
    throw new BusinessError('VALIDATION_ERROR', 'Angiv både start_date og end_date eller ingen af dem');
  }
  if (startDate) checkPeriod(startDate, endDate);

  const bookings = await guestsRepository.findBookingsByCountry(startDate, endDate);
  const stays = startDate ? [] : await guestsRepository.findStaysByCountry();
  const countries = new Map();
  for (const row of [...stays, ...bookings]) {
    const entry = countries.get(row.country) || { country: row.country, stays_count: 0, ore: 0 };
    entry.stays_count += Number(row.stays_count);
    entry.ore += toOre(row.revenue);
    countries.set(row.country, entry);
  }
  const rows = [...countries.values()]
    .sort((a, b) => b.stays_count - a.stays_count)
    .map(({ ore, ...fields }) => ({ ...fields, revenue_dkk: oreToDkk(ore) }));
  return {
    period: startDate ? { start_date: startDate, end_date: endDate } : null,
    includes_history: !startDate,
    rows,
  };
}

async function getSatisfaction(startDate, endDate) {
  checkPeriod(startDate, endDate);
  const summary = await satisfactionRepository.findRatingSummary(startDate, endDate);
  const count = Number(summary.rating_count);
  return {
    period: { start_date: startDate, end_date: endDate },
    rating_count: count,
    average_rating: count === 0 ? null : Math.round(Number(summary.average_rating) * 100) / 100,
  };
}

// BR-09: RevPAR = omsætning / (214 x nætter), ADR = omsætning / belagte nætter.
async function getRevpar(startDate, endDate) {
  checkPeriod(startDate, endDate);
  const revenueRows = await revenueRepository.findBookings(startDate, endDate);
  const revenueOre = revenueRows.reduce((sum, b) => sum + toOre(b.total_price), 0);
  const bookings = await occupancyRepository.findBookingsInPeriod(startDate, endDate);
  const occupied = occupiedNights(bookings, startDate, endDate);
  const available = TOTAL_ROOMS * nightsInPeriod(startDate, endDate);
  return {
    period: { start_date: startDate, end_date: endDate },
    revenue_dkk: oreToDkk(revenueOre),
    available_room_nights: available,
    occupied_room_nights: occupied,
    revpar_dkk: oreToDkk(Math.round(revenueOre / available)),
    adr_dkk: occupied === 0 ? null : oreToDkk(Math.round(revenueOre / occupied)),
  };
}

module.exports = {
  getOccupancy,
  getRevenue,
  getAnnualRevenue,
  getRunningRevenue,
  getGuestsByCountry,
  getSatisfaction,
  getRevpar,
};
