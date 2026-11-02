import * as analysisRepository from '../repositories/analysisRepository.js';

const HOTEL_BASIS = {
  source: 'Datasets/international_names_with_rooms_1000.xlsx, ark Sheet1; 1.000 importerede kilderækker.',
  measure: 'Hver række tælles som ét registreret ophold; det er ikke nødvendigvis én unik gæst.',
  assumptions: [
    'Price behandles som samlet pris for ét ophold (POC-antagelse).',
    'Beløbet er ikke afgrænset til et kalenderår eller en anden dokumenteret periode.',
    'Season returneres som kildens etiket uden udledning af datoer.',
  ],
};
const BAR_BASIS = {
  source: 'Datasets/drinks_menu_with_sales.xlsx, ark Sheet1; 30 importerede produktrækker.',
  measure: 'Solgte enheder summeres fra Units Sold; omsætning beregnes som Price × Units Sold.',
  assumptions: [
    'Price (DKK) behandles som stykpris (POC-antagelse).',
    'Ingen salgsdato, kalenderperiode eller sælger er registreret; dette er ikke årsomsætning eller Helenes salg.',
  ],
};

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

async function parseFilters(query, allowedKeys, source) {
  const filters = {};
  for (const key of Object.keys(query)) {
    if (!allowedKeys.includes(key)) {
      throw badRequest(`Ugyldigt filter "${key}". Tilladte filtre: ${allowedKeys.join(', ') || 'ingen'}.`);
    }
    const value = query[key];
    if (typeof value !== 'string' || value.trim() === '' || value !== value.trim()) {
      throw badRequest(`Filteret "${key}" skal være én ikke-tom tekstværdi uden ekstra mellemrum.`);
    }
    const options = source === 'hotel'
      ? await analysisRepository.getHotelFilterValues(key)
      : await analysisRepository.getBarFilterValues(key);
    if (!options.includes(value)) {
      throw badRequest(`Ugyldig værdi for "${key}". Mulige værdier: ${options.join(', ') || 'ingen data'}.`);
    }
    filters[key] = value;
  }
  return filters;
}

const hotelResult = (data, filters = {}) => ({
  dataBasis: HOTEL_BASIS,
  filters,
  data,
});
const barResult = (data, filters = {}) => ({
  dataBasis: BAR_BASIS,
  filters,
  data,
});

export const getHotelSummary = async (query) => {
  const filters = await parseFilters(query, ['country', 'roomType', 'season'], 'hotel');
  const row = await analysisRepository.getHotelSummary(filters);
  return hotelResult({
    registeredStays: row.registeredStays,
    totalAmount: row.totalAmount,
    averageDaysRented: row.averageDaysRented === null ? null : Number(row.averageDaysRented),
  }, filters);
};

export const getStayCountsByCountry = async (query) => {
  const filters = await parseFilters(query, ['country', 'roomType', 'season'], 'hotel');
  const data = await analysisRepository.getStayCountsByCountry(filters);
  return hotelResult(data, filters);
};

export const getHotelRevenueByCountry = async (query) => {
  const filters = await parseFilters(query, ['country', 'roomType', 'season'], 'hotel');
  const data = await analysisRepository.getHotelRevenueByCountry(filters);
  return hotelResult(data, filters);
};

export const getHotelRevenueByRoomTypeSeason = async (query) => {
  const filters = await parseFilters(query, ['country', 'roomType', 'season'], 'hotel');
  const data = await analysisRepository.getHotelRevenueByRoomTypeSeason(filters);
  return hotelResult(data, filters);
};

export const getTopHotelRevenue = async (query) => {
  const { groupBy, ...rest } = query;
  if (typeof groupBy !== 'string' || !['country', 'roomType'].includes(groupBy)) {
    throw badRequest('Queryparameteren groupBy skal være "country" eller "roomType".');
  }
  const filters = await parseFilters(rest, ['country', 'roomType', 'season'], 'hotel');
  const leaders = await analysisRepository.getTopHotelRevenue(groupBy, filters);
  return hotelResult({
    groupBy,
    maximumAmount: leaders[0]?.amount ?? null,
    leaders: leaders.map(({ label, amount }) => ({ value: label, amount })),
  }, filters);
};

export const getAverageStayLength = async (query) => {
  const filters = await parseFilters(query, ['country', 'roomType', 'season'], 'hotel');
  const row = await analysisRepository.getAverageStayLength(filters);
  return hotelResult({
    registeredStays: row.registeredStays,
    averageDaysRented: row.averageDaysRented === null ? null : Number(row.averageDaysRented),
  }, filters);
};

export const getBarSummary = async (query) => {
  const filters = await parseFilters(query, ['category'], 'bar');
  const row = await analysisRepository.getBarSummary(filters);
  return barResult({
    productCount: row.productCount,
    unitsSold: Number(row.unitsSold),
    totalRevenue: row.totalRevenue,
  }, filters);
};

export const getBarProducts = async (query) => {
  const filters = await parseFilters(query, ['category'], 'bar');
  const data = await analysisRepository.getBarProducts(filters);
  return barResult(data, filters);
};

export const getBarCategoryShares = async (query = {}) => {
  await parseFilters(query, [], 'bar');
  const rows = await analysisRepository.getBarCategoryShares();
  const totalUnitsSold = rows.length ? Number(rows[0].totalUnitsSold) : 0;
  const categories = rows.map((row) => ({
    category: row.category,
    unitsSold: Number(row.unitsSold),
    totalUnitsSold,
    sharePercent: totalUnitsSold === 0 ? null : Number(row.unitsSold) / totalUnitsSold * 100,
  }));
  return barResult({ totalUnitsSold, categories });
};
