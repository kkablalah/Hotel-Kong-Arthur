// Dataadgangslaget: den eneste fil, der opretter forbindelse til MySQL (constitution princip I).
const path = require('node:path');
const mysql = require('mysql2/promise');

// Læser .env, hvis backenden startes uden for Docker. Værdier fra docker-compose vinder (B-04).
require('dotenv').config({ path: path.join(__dirname, '../../../.env'), quiet: true });

const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Mangler miljøvariabler: ${missing.join(', ')}`);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  connectionLimit: 10,
  dateStrings: true,
});

module.exports = { pool };
