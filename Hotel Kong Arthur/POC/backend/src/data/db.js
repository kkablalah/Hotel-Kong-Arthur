// Dataadgangslaget: den eneste fil, der opretter forbindelse til PostgreSQL (constitution princip I og IV).
const path = require('node:path');
const { Pool, types } = require('pg');

// Læser .env, hvis backenden startes uden for Docker. Værdier fra docker-compose vinder (B-04).
require('dotenv').config({ path: path.join(__dirname, '../../../.env'), quiet: true });

const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Mangler miljøvariabler: ${missing.join(', ')}`);
}

// Resten af backenden skal ikke mærke, hvilken database der bruges (princip IV).
// Datoer og tidspunkter er tekst, og COUNT(*) er et tal. Beløb (numeric) er allerede tekst i pg.
const asText = (value) => value;
types.setTypeParser(types.builtins.DATE, asText);
types.setTypeParser(types.builtins.TIMESTAMP, asText);
types.setTypeParser(types.builtins.INT8, Number);

const connections = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,
});

// Uden denne håndtering stopper hele backenden, hvis en ledig forbindelse mistes.
connections.on('error', (err) => {
  console.error('Fejl på en ledig databaseforbindelse:', err.message);
});

// Fejlklasse 22 i PostgreSQL betyder en ugyldig værdi, fx 30. februar eller et for stort id.
// status 400 får den eksisterende fejlhåndtering til at svare "Ugyldigt input" uden databasedetaljer.
async function query(text, params) {
  try {
    return await connections.query(text, params);
  } catch (err) {
    if (String(err.code).startsWith('22')) {
      throw Object.assign(new Error(err.message), { status: 400 });
    }
    throw err;
  }
}

const pool = { query, end: () => connections.end() };

module.exports = { pool };
