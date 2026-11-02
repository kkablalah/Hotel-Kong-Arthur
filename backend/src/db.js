import { Pool as PostgresPool, types as postgresTypes } from 'pg';
import { createPool as createMySqlPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// The old Compose stack sets MYSQL_HOST and keeps using its existing MySQL
// container. Uge 2 explicitly selects PostgreSQL with DB_CLIENT=postgres.
export const databaseClient = process.env.DB_CLIENT
  || (process.env.MYSQL_HOST ? 'mysql' : 'postgres');

let pool;

if (databaseClient === 'postgres') {
  // Preserve DATE values as YYYY-MM-DD strings in the REST responses.
  postgresTypes.setTypeParser(1082, (value) => value);
  pool = new PostgresPool({
    host: process.env.POSTGRES_HOST || 'postgres',
    port: Number.parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'hka_uge2',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'hka_uge2',
    max: 10,
  });
  pool.on('error', (error) => {
    console.error('PostgreSQL idle connection error:', error.message);
  });
} else if (databaseClient === 'mysql') {
  // Compatibility for the already-running legacy POC Compose stack.
  pool = createMySqlPool({
    host: process.env.MYSQL_HOST || 'mysql',
    port: Number.parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'hoteluser',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'hotel_db',
    connectionLimit: 10,
  });
} else {
  throw new Error(`Unsupported DB_CLIENT: ${databaseClient}`);
}

export default pool;
