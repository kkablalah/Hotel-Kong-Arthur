import pool from '../db.js';

const ROOM_CAPACITY = 214;

const products = [
  ['Margarita', 'Cocktail', 72.47, 2361],
  ['Mojito', 'Cocktail', 142.38, 3350],
  ['Old Fashioned', 'Cocktail', 129.17, 3154],
  ['Martini', 'Cocktail', 132.17, 3754],
  ['Daiquiri', 'Cocktail', 102.44, 3469],
  ['Negroni', 'Cocktail', 149.48, 2691],
  ['Whiskey Sour', 'Cocktail', 95.73, 3824],
  ['Cosmopolitan', 'Cocktail', 91.4, 2594],
  ['Mai Tai', 'Cocktail', 76.4, 2279],
  ['Pina Colada', 'Cocktail', 111.06, 3699],
  ['Bloody Mary', 'Cocktail', 127.2, 3632],
  ['Gin and Tonic', 'Cocktail', 127.06, 3602],
  ['Sidecar', 'Cocktail', 103.96, 2457],
  ['Manhattan', 'Cocktail', 86.61, 2413],
  ['Espresso Martini', 'Cocktail', 86.15, 3763],
  ['French 75', 'Cocktail', 134.31, 3168],
  ['Caipirinha', 'Cocktail', 106.43, 2802],
  ['Mint Julep', 'Cocktail', 143.54, 3653],
  ['Tom Collins', 'Cocktail', 104.27, 3344],
  ['Long Island Iced Tea', 'Cocktail', 146.23, 2068],
  ['Espresso', 'Coffee', 69.1, 14656],
  ['Americano', 'Coffee', 40.84, 13833],
  ['Latte', 'Coffee', 63.19, 11355],
  ['Cappuccino', 'Coffee', 50.87, 11676],
  ['Macchiato', 'Coffee', 61.41, 10389],
  ['Mocha', 'Coffee', 60.59, 13897],
  ['Flat White', 'Coffee', 33.43, 10249],
  ['Cortado', 'Coffee', 54.5, 10354],
  ['Iced Coffee', 'Coffee', 34.79, 10337],
  ['Affogato', 'Coffee', 63.6, 11135],
];

const historicalStays = [
  ['high', 'Grand Lit', 43, 401118],
  ['high', 'Junior Suite', 46, 570892],
  ['high', 'LOFT Suite', 40, 683198],
  ['high', 'Spa Executive', 42, 645705],
  ['high', 'Standard Double', 33, 317174],
  ['high', 'Standard Single', 38, 256712],
  ['high', 'Suite', 45, 693222],
  ['high', 'Superior Double', 46, 502549],
  ['low', 'Grand Lit', 37, 217585],
  ['low', 'Junior Suite', 39, 458261],
  ['low', 'LOFT Suite', 33, 536800],
  ['low', 'Spa Executive', 44, 453526],
  ['low', 'Standard Double', 49, 390570],
  ['low', 'Standard Single', 39, 239940],
  ['low', 'Suite', 46, 626488],
  ['low', 'Superior Double', 45, 430907],
  ['mid', 'Grand Lit', 38, 334030],
  ['mid', 'Junior Suite', 51, 596511],
  ['mid', 'LOFT Suite', 30, 475407],
  ['mid', 'Spa Executive', 52, 623165],
  ['mid', 'Standard Double', 35, 340456],
  ['mid', 'Standard Single', 40, 233792],
  ['mid', 'Suite', 46, 799961],
  ['mid', 'Superior Double', 43, 406065],
];

export const initializeAnalyticsSchema = async () => {
  const [columns] = await pool.query(
    `SELECT COUNT(*) AS found
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'nightly_rate'`
  );
  if (Number(columns[0].found) === 0) {
    await pool.query('ALTER TABLE bookings ADD COLUMN nightly_rate DECIMAL(10, 2) NOT NULL DEFAULT 1500 AFTER check_out');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS drink_products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      category ENUM('Cocktail', 'Coffee') NOT NULL,
      price_dkk DECIMAL(8, 2) NOT NULL,
      baseline_units INT UNSIGNED NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS drink_sales (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      quantity INT UNSIGNED NOT NULL,
      staff_member VARCHAR(100) NOT NULL,
      sold_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_drink_sales_product FOREIGN KEY (product_id) REFERENCES drink_products(id),
      INDEX idx_drink_sales_sold_at (sold_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS guest_feedback (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      guest_name VARCHAR(100) NULL,
      rating TINYINT UNSIGNED NOT NULL,
      comment VARCHAR(1000) NULL,
      submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_guest_feedback_submitted_at (submitted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS historical_stays (
      id INT AUTO_INCREMENT PRIMARY KEY,
      season ENUM('low', 'mid', 'high') NOT NULL,
      room_type VARCHAR(100) NOT NULL,
      stay_count INT UNSIGNED NOT NULL,
      revenue_dkk DECIMAL(14, 2) NOT NULL,
      UNIQUE KEY uq_historical_season_room (season, room_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(
    `INSERT IGNORE INTO drink_products (name, category, price_dkk, baseline_units)
     VALUES ${products.map(() => '(?, ?, ?, ?)').join(', ')}`,
    products.flat()
  );
  await pool.query(
    `INSERT IGNORE INTO historical_stays (season, room_type, stay_count, revenue_dkk)
     VALUES ${historicalStays.map(() => '(?, ?, ?, ?)').join(', ')}`,
    historicalStays.flat()
  );
};

const dateOnly = (value) => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const defaultPeriod = () => {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
};

export const getOverview = async (fromQuery, toQuery) => {
  const defaults = defaultPeriod();
  const from = fromQuery || defaults.from;
  const to = toQuery || defaults.to;
  if (!validDate(from) || !validDate(to) || from > to) {
    const error = new Error('from og to skal være gyldige datoer i formatet YYYY-MM-DD, og from skal være før eller lig med to');
    error.status = 400;
    throw error;
  }

  const fromDate = new Date(`${from}T00:00:00Z`);
  const toDate = new Date(`${to}T00:00:00Z`);
  const periodDays = Math.floor((toDate - fromDate) / 86400000) + 1;
  if (periodDays > 366) {
    const error = new Error('Datointervallet må højst være 366 dage');
    error.status = 400;
    throw error;
  }
  const afterTo = new Date(toDate.getTime() + 86400000).toISOString().slice(0, 10);

  const [bookings] = await pool.query(
    `SELECT room_number AS roomNumber, check_in AS checkIn, check_out AS checkOut, nightly_rate AS nightlyRate
     FROM bookings
     WHERE status <> 'cancelled' AND check_in < ? AND check_out > ?`,
    [afterTo, from]
  );

  const occupiedRoomNights = new Set();
  let roomRevenueDkk = 0;
  for (const booking of bookings) {
    const checkIn = dateOnly(booking.checkIn);
    const checkOut = dateOnly(booking.checkOut);
    const firstNight = checkIn > from ? checkIn : from;
    const lastNight = checkOut < afterTo ? checkOut : afterTo;
    const first = new Date(`${firstNight}T00:00:00Z`);
    const last = new Date(`${lastNight}T00:00:00Z`);
    const nights = Math.max(0, Math.floor((last - first) / 86400000));
    roomRevenueDkk += nights * Number(booking.nightlyRate);
    for (let day = 0; day < nights; day += 1) {
      const date = new Date(first.getTime() + day * 86400000).toISOString().slice(0, 10);
      occupiedRoomNights.add(`${booking.roomNumber}:${date}`);
    }
  }

  const [feedback] = await pool.query(
    'SELECT COUNT(*) AS count, AVG(rating) AS averageRating FROM guest_feedback'
  );
  const [menu] = await pool.query(
    `SELECT p.id, p.name, p.category, p.price_dkk AS priceDkk, p.baseline_units AS baselineUnits,
            COALESCE(SUM(s.quantity), 0) AS liveUnits
     FROM drink_products p
     LEFT JOIN drink_sales s ON s.product_id = p.id
     GROUP BY p.id
     ORDER BY p.category, p.name`
  );
  const [seasonRows] = await pool.query(
    `SELECT season, SUM(stay_count) AS stayCount, SUM(revenue_dkk) AS revenueDkk
     FROM historical_stays GROUP BY season
     ORDER BY FIELD(season, 'low', 'mid', 'high')`
  );
  const [roomTypeRows] = await pool.query(
    `SELECT room_type AS roomType, SUM(stay_count) AS stayCount, SUM(revenue_dkk) AS revenueDkk
     FROM historical_stays GROUP BY room_type ORDER BY revenueDkk DESC`
  );

  const categories = ['Cocktail', 'Coffee'].map((category) => {
    const categoryProducts = menu
      .filter((product) => product.category === category)
      .map((product) => {
        const units = Number(product.baselineUnits) + Number(product.liveUnits);
        const revenueDkk = units * Number(product.priceDkk);
        return {
          id: product.id,
          name: product.name,
          units,
          revenueDkk: Number(revenueDkk.toFixed(2)),
          baselineUnits: Number(product.baselineUnits),
          liveUnits: Number(product.liveUnits),
        };
      });
    const totalUnits = categoryProducts.reduce((total, product) => total + product.units, 0);
    const totalRevenueDkk = categoryProducts.reduce((total, product) => total + product.revenueDkk, 0);
    return {
      name: category,
      totalUnits,
      totalRevenueDkk: Number(totalRevenueDkk.toFixed(2)),
      products: categoryProducts.map((product) => ({
        ...product,
        sharePercent: totalUnits === 0 ? 0 : Number(((product.units / totalUnits) * 100).toFixed(2)),
      })),
    };
  });
  const historicalSeasons = seasonRows.map((row) => ({
    name: row.season,
    stays: Number(row.stayCount),
    revenueDkk: Number(Number(row.revenueDkk).toFixed(2)),
    averageStayRevenueDkk: Number((Number(row.revenueDkk) / Number(row.stayCount)).toFixed(2)),
  }));
  const historicalTotalStays = historicalSeasons.reduce((total, season) => total + season.stays, 0);
  const historicalTotalRevenueDkk = historicalSeasons.reduce((total, season) => total + season.revenueDkk, 0);

  return {
    period: { from, to, days: periodDays },
    occupancy: {
      occupiedRoomNights: occupiedRoomNights.size,
      capacityRoomNights: ROOM_CAPACITY * periodDays,
      totalRooms: ROOM_CAPACITY,
      ratePercent: Number(((occupiedRoomNights.size / (ROOM_CAPACITY * periodDays)) * 100).toFixed(2)),
    },
    bookings: bookings.length,
    roomRevenueDkk: Number(roomRevenueDkk.toFixed(2)),
    feedback: {
      count: Number(feedback[0].count),
      averageRating: feedback[0].averageRating === null ? null : Number(Number(feedback[0].averageRating).toFixed(2)),
    },
    historical: {
      sourceDescription: 'Aggregeret fra 1.000 historiske ophold; sæsondata mangler kalenderdatoer og bruges ikke i live-belægningen.',
      totalStays: historicalTotalStays,
      totalRevenueDkk: Number(historicalTotalRevenueDkk.toFixed(2)),
      seasons: historicalSeasons,
      roomTypes: roomTypeRows.map((row) => ({
        name: row.roomType,
        stays: Number(row.stayCount),
        revenueDkk: Number(Number(row.revenueDkk).toFixed(2)),
      })),
    },
    bar: {
      baselineDescription: 'Historiske menu-salg fra regnearket; ikke fordelt på medarbejder.',
      liveSalesDescription: 'Nye registreringer tilskrives Helene Christine.',
      categories,
    },
  };
};

export const getBarMenu = async () => {
  const [rows] = await pool.query(
    'SELECT id, name, category, price_dkk AS priceDkk FROM drink_products ORDER BY category, name'
  );
  return rows;
};

export const recordBarSale = async ({ productId, quantity, staffMember = 'Helene Christine' }) => {
  if (!Number.isInteger(Number(productId)) || Number(productId) < 1 ||
      !Number.isInteger(Number(quantity)) || Number(quantity) < 1 || Number(quantity) > 1000 ||
      typeof staffMember !== 'string' || staffMember.trim().length === 0 || staffMember.length > 100) {
    const error = new Error('productId, quantity (1-1000) og staffMember skal være gyldige');
    error.status = 400;
    throw error;
  }
  const [result] = await pool.query(
    'INSERT INTO drink_sales (product_id, quantity, staff_member) VALUES (?, ?, ?)',
    [productId, quantity, staffMember.trim()]
  );
  const [rows] = await pool.query(
    `SELECT s.id, s.product_id AS productId, p.name AS productName, s.quantity,
            s.staff_member AS staffMember, s.sold_at AS soldAt
     FROM drink_sales s JOIN drink_products p ON p.id = s.product_id
     WHERE s.id = ?`,
    [result.insertId]
  );
  return rows[0];
};

export const recordFeedback = async ({ guestName, rating, comment }) => {
  if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5 ||
      (guestName !== undefined && (typeof guestName !== 'string' || guestName.length > 100)) ||
      (comment !== undefined && (typeof comment !== 'string' || comment.length > 1000))) {
    const error = new Error('rating skal være 1-5, og navn/kommentar skal være tekst i tilladt længde');
    error.status = 400;
    throw error;
  }
  const [result] = await pool.query(
    'INSERT INTO guest_feedback (guest_name, rating, comment) VALUES (?, ?, ?)',
    [guestName?.trim() || null, Number(rating), comment?.trim() || null]
  );
  return { id: result.insertId, guestName: guestName?.trim() || null, rating: Number(rating), comment: comment?.trim() || null };
};
