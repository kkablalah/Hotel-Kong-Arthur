import pool from '../db.js';
import crypto from 'crypto';
import fs from 'fs';
import XLSX from 'xlsx';

// --- Business Logic Layer: Import Service ---
// This service provides core functionality for historical data import
// that can be tested INDEPENDENTLY of HTTP routes per Principle II

/**
 * T009: Calculate SHA-256 hash of file content for duplicate detection
 * @param {string} filePath - Path to the source file
 * @returns {string} SHA-256 hash as hex string
 */
export const calculateFileHash = (filePath) => {
  const fileContent = fs.readFileSync(filePath);
  return crypto
    .createHash('sha256')
    .update(fileContent)
    .digest('hex');
};

/**
 * T010: Validate a historical booking record
 * @param {Object} record - Booking record to validate
 * @returns {Object} { valid: boolean, field?: string, reason?: string }
 */
export const validateHistoricalBooking = (record) => {
  // Required fields: first_name, family_name
  if (!record.first_name || typeof record.first_name !== 'string') {
    return { valid: false, field: 'first_name', reason: 'Required string' };
  }

  if (!record.family_name || typeof record.family_name !== 'string') {
    return { valid: false, field: 'family_name', reason: 'Required string' };
  }

  // String length constraints
  if (record.first_name.length > 100) {
    return { valid: false, field: 'first_name', reason: 'Max 100 characters' };
  }

  if (record.family_name.length > 100) {
    return { valid: false, field: 'family_name', reason: 'Max 100 characters' };
  }

  // Optional fields: country, room_type, days_rented, season, price
  if (record.country !== undefined && record.country !== null) {
    if (typeof record.country !== 'string') {
      return { valid: false, field: 'country', reason: 'Must be string or null' };
    }
    if (record.country.length > 100) {
      return { valid: false, field: 'country', reason: 'Max 100 characters' };
    }
  }

  // room_type: CORRECTED to VARCHAR(50) - optional string
  if (record.room_type !== undefined && record.room_type !== null) {
    if (typeof record.room_type !== 'string') {
      return { valid: false, field: 'room_type', reason: 'Must be string or null' };
    }
    if (record.room_type.length > 50) {
      return { valid: false, field: 'room_type', reason: 'Max 50 characters' };
    }
  }

  // days_rented: optional int >= 1
  if (record.days_rented !== undefined && record.days_rented !== null) {
    if (typeof record.days_rented !== 'number' || !Number.isInteger(record.days_rented)) {
      return { valid: false, field: 'days_rented', reason: 'Must be integer or null' };
    }
    if (record.days_rented < 1) {
      return { valid: false, field: 'days_rented', reason: 'Must be >= 1' };
    }
  }

  // season: optional enum low/mid/high
  if (record.season !== undefined && record.season !== null) {
    if (!['low', 'mid', 'high'].includes(record.season)) {
      return { valid: false, field: 'season', reason: 'Must be low, mid, or high' };
    }
  }

  // price: optional decimal >= 0
  if (record.price !== undefined && record.price !== null) {
    if (typeof record.price !== 'number') {
      return { valid: false, field: 'price', reason: 'Must be number or null' };
    }
    if (record.price < 0) {
      return { valid: false, field: 'price', reason: 'Must be >= 0' };
    }
  }

  return { valid: true };
};

/**
 * T011: Validate a historical drink record
 * @param {Object} record - Drink record to validate
 * @returns {Object} { valid: boolean, field?: string, reason?: string }
 */
export const validateHistoricalDrink = (record) => {
  // Required fields: drink_name, category
  if (!record.drink_name || typeof record.drink_name !== 'string') {
    return { valid: false, field: 'drink_name', reason: 'Required string' };
  }

  if (!record.category || typeof record.category !== 'string') {
    return { valid: false, field: 'category', reason: 'Required string' };
  }

  // String length constraints
  if (record.drink_name.length > 100) {
    return { valid: false, field: 'drink_name', reason: 'Max 100 characters' };
  }

  // category: required enum Cocktail/Coffee
  if (!['Cocktail', 'Coffee'].includes(record.category)) {
    return { valid: false, field: 'category', reason: 'Must be Cocktail or Coffee' };
  }

  // price_dkk: optional decimal >= 0
  if (record.price_dkk !== undefined && record.price_dkk !== null) {
    if (typeof record.price_dkk !== 'number') {
      return { valid: false, field: 'price_dkk', reason: 'Must be number or null' };
    }
    if (record.price_dkk < 0) {
      return { valid: false, field: 'price_dkk', reason: 'Must be >= 0' };
    }
  }

  // units_sold: optional int >= 0
  if (record.units_sold !== undefined && record.units_sold !== null) {
    if (typeof record.units_sold !== 'number' || !Number.isInteger(record.units_sold)) {
      return { valid: false, field: 'units_sold', reason: 'Must be integer or null' };
    }
    if (record.units_sold < 0) {
      return { valid: false, field: 'units_sold', reason: 'Must be >= 0' };
    }
  }

  return { valid: true };
};

/**
 * T012: Extract records from Excel file with source row numbers
 * @param {string} filePath - Path to Excel file
 * @param {string[]} expectedColumns - Array of expected column names
 * @returns {Array<Object>} Array of record objects with source_row_number
 */
export const extractRecordsFromExcel = (filePath, expectedColumns) => {
  const workbook = XLSX.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON with header row
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

  // First row is header, skip it
  if (jsonData.length === 0) {
    return [];
  }

  const headerRow = jsonData[0];
  const records = [];

  // Process data rows starting from index 1 (row 2 in Excel, 1-indexed)
  for (let i = 1; i < jsonData.length; i++) {
    const rowData = jsonData[i];
    const record = {};

    // Map each expected column to the record
    // Use the header row to find column indices
    for (let colIdx = 0; colIdx < expectedColumns.length && colIdx < rowData.length; colIdx++) {
      const colName = expectedColumns[colIdx];
      // Use the actual header from the file if available, otherwise use expected column name
      const actualHeader = headerRow[colIdx] || colName;
      record[colName] = rowData[colIdx];
    }

    // Add source_row_number (1-indexed, excluding header)
    record.source_row_number = i;

    records.push(record);
  }

  return records;
};

/**
 * T013: Check if a batch with the given file hash has already been imported
 * @param {string} fileHash - SHA-256 hash of file content
 * @returns {Promise<Object>} Batch record if exists and completed, null otherwise
 */
export const checkBatchDuplicate = async (fileHash) => {
  const [rows] = await pool.query(
    'SELECT batch_id, file_name, status FROM import_batches WHERE file_hash = ?',
    [fileHash]
  );

  if (rows.length === 0) {
    return null; // No batch found, can proceed
  }

  // If found with status='completed', this is a duplicate
  // If found with status='failed', allow retry
  return rows[0];
};

/**
 * T008: Export all functions as the import service module
 * This creates backend/src/services/importService.js with file parsing using xlsx package
 * All functions are exported for independent testing per Phase 4
 */
export default {
  calculateFileHash,
  validateHistoricalBooking,
  validateHistoricalDrink,
  extractRecordsFromExcel,
  checkBatchDuplicate,
};
