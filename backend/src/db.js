import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = createPool({
  host: process.env.MYSQL_HOST || 'mysql',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'hoteluser',
  password: process.env.MYSQL_PASSWORD || 'hotelpass',
  database: process.env.MYSQL_DATABASE || 'hotel_db',
  connectionLimit: 10,
});

export default pool;
