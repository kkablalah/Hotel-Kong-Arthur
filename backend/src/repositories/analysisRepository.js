import pool from '../db.js';

const HOTEL_FILTERS = {
  country: 'country',
  roomType: 'room_type',
  season: 'season',
};
const BAR_FILTERS = { category: 'category' };

function whereClause(filters = {}, fields = HOTEL_FILTERS) {
  const values = [];
  const clauses = [];
  for (const [key, column] of Object.entries(fields)) {
    if (filters[key] !== undefined) {
      values.push(filters[key]);
      clauses.push(`${column} = $${values.length}`);
    }
  }
  return { sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', values };
}

async function rows(sql, values = []) {
  const result = await pool.query(sql, values);
  return result.rows;
}

export const getHotelFilterValues = async (key) => {
  const column = HOTEL_FILTERS[key];
  if (!column) return [];
  const result = await rows(`SELECT DISTINCT ${column} AS value FROM hotel_stays ORDER BY value`);
  return result.map((row) => row.value);
};

export const getBarFilterValues = async (key) => {
  const column = BAR_FILTERS[key];
  if (!column) return [];
  const result = await rows(`SELECT DISTINCT ${column} AS value FROM drink_products ORDER BY value`);
  return result.map((row) => row.value);
};

export const getHotelSummary = async (filters) => {
  const where = whereClause(filters);
  const [result] = await rows(
    `SELECT COUNT(*)::int AS "registeredStays",
            ROUND(COALESCE(SUM(price), 0), 2)::text AS "totalAmount",
            AVG(days_rented)::text AS "averageDaysRented"
     FROM hotel_stays ${where.sql}`,
    where.values
  );
  return result;
};

export const getStayCountsByCountry = async (filters) => {
  const where = whereClause(filters);
  return rows(
    `SELECT country, COUNT(*)::int AS "registeredStays"
     FROM hotel_stays ${where.sql}
     GROUP BY country ORDER BY country`, where.values
  );
};

export const getHotelRevenueByCountry = async (filters) => {
  const where = whereClause(filters);
  return rows(
    `SELECT country, COUNT(*)::int AS "registeredStays", ROUND(SUM(price), 2)::text AS amount
     FROM hotel_stays ${where.sql}
     GROUP BY country ORDER BY country`, where.values
  );
};

export const getHotelRevenueByRoomTypeSeason = async (filters) => {
  const where = whereClause(filters);
  return rows(
    `SELECT room_type AS "roomType", season, COUNT(*)::int AS "registeredStays",
            ROUND(SUM(price), 2)::text AS amount
     FROM hotel_stays ${where.sql}
     GROUP BY room_type, season ORDER BY room_type, season`, where.values
  );
};

export const getTopHotelRevenue = async (groupBy, filters) => {
  const dimensions = { country: 'country', roomType: 'room_type' };
  const column = dimensions[groupBy];
  if (!column) throw new Error('Invalid hotel ranking dimension passed to repository');
  const where = whereClause(filters);
  return rows(
    `WITH grouped AS (
     SELECT ${column} AS label, SUM(price) AS raw_amount
       FROM hotel_stays ${where.sql}
       GROUP BY ${column}
     )
     SELECT label, ROUND(raw_amount, 2)::text AS amount FROM grouped
     WHERE raw_amount = (SELECT MAX(raw_amount) FROM grouped)
     ORDER BY label`, where.values
  );
};

export const getAverageStayLength = async (filters) => {
  const where = whereClause(filters);
  const [result] = await rows(
    `SELECT COUNT(*)::int AS "registeredStays", AVG(days_rented)::text AS "averageDaysRented"
     FROM hotel_stays ${where.sql}`,
    where.values
  );
  return result;
};

export const getBarSummary = async (filters = {}) => {
  const where = whereClause(filters, BAR_FILTERS);
  const [result] = await rows(
    `SELECT COUNT(*)::int AS "productCount",
            COALESCE(SUM(units_sold), 0)::bigint AS "unitsSold",
            ROUND(COALESCE(SUM(price * units_sold), 0), 2)::text AS "totalRevenue"
     FROM drink_products ${where.sql}`,
    where.values
  );
  return result;
};

export const getBarProducts = async (filters = {}) => {
  const where = whereClause(filters, BAR_FILTERS);
  return rows(
    `SELECT drink_name AS "drinkName", category, ROUND(price, 2)::text AS "unitPrice",
            units_sold AS "unitsSold", ROUND(price * units_sold, 2)::text AS revenue
     FROM drink_products ${where.sql}
     ORDER BY revenue DESC, drink_name`, where.values
  );
};

export const getBarCategoryShares = async () => rows(
  `SELECT category, SUM(units_sold)::bigint AS "unitsSold",
          COALESCE(SUM(SUM(units_sold)) OVER (), 0)::bigint AS "totalUnitsSold"
   FROM drink_products GROUP BY category ORDER BY category`
);
