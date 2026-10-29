import express from 'express';
import {
  calculateFileHash,
  validateHistoricalBooking,
  validateHistoricalDrink,
  extractRecordsFromExcel,
  checkBatchDuplicate
} from '../services/importService.js';
import pool from '../db.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// --- Presentation Layer: Import Routes ---
// All endpoints under /api/import prefix
// Uses express-fileupload middleware for file uploads

/**
 * POST /api/import/hotel
 * T020: Import historical hotel booking data from Excel file
 * 
 * Request: multipart/form-data with 'file' field
 * Response: 200 ImportReport, 400 Validation error, 409 Conflict (duplicate), 500 Server error
 */
router.post('/hotel', async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.files || !req.files.file) {
      return res.status(400).json({ 
        error: 'No file uploaded. Please include a file in the "file" field.' 
      });
    }

    const uploadedFile = req.files.file;
    
    // Validate file type
    if (!uploadedFile.name.toLowerCase().endsWith('.xlsx')) {
      // Clean up uploaded file
      fs.unlinkSync(uploadedFile.tempFilePath);
      return res.status(400).json({ 
        error: 'Invalid file format. Only .xlsx files are supported.' 
      });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (uploadedFile.size > maxSize) {
      fs.unlinkSync(uploadedFile.tempFilePath);
      return res.status(400).json({ 
        error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB.` 
      });
    }

    // Calculate file hash for duplicate detection
    const fileHash = calculateFileHash(uploadedFile.tempFilePath);
    const fileName = uploadedFile.name;
    const fileSize = uploadedFile.size;

    // Check for duplicate import (T013 integration)
    const existingBatch = await checkBatchDuplicate(fileHash);
    if (existingBatch && existingBatch.status === 'completed') {
      fs.unlinkSync(uploadedFile.tempFilePath);
      return res.status(409).json({ 
        error: 'File already imported. This file content has already been processed.',
        file_name: fileName,
        file_hash: fileHash,
        existing_batch: existingBatch.batch_id
      });
    }

    // Extract records from Excel file
    const expectedColumns = ['first_name', 'family_name', 'country', 'room_type', 'days_rented', 'season', 'price'];
    const records = extractRecordsFromExcel(uploadedFile.tempFilePath, expectedColumns);
    
    if (records.length === 0) {
      fs.unlinkSync(uploadedFile.tempFilePath);
      return res.status(400).json({ 
        error: 'No records found in the Excel file. Please verify the file structure.' 
      });
    }

    // Validate all records
    const validationResults = records.map(record => validateHistoricalBooking(record));
    const validRecords = [];
    const invalidRecords = [];
    
    validationResults.forEach((result, index) => {
      if (result.valid) {
        validRecords.push(records[index]);
      } else {
        invalidRecords.push({
          source_row_number: records[index].source_row_number,
          field: result.field,
          value: String(records[index][result.field] || ''),
          reason: result.reason
        });
      }
    });

    const totalRecords = records.length;
    const rejectedCount = invalidRecords.length;
    const importedCount = validRecords.length;

    // Prepare import batch record
    const batchId = fileHash; // Using file hash as batch_id
    const now = new Date();

    // Begin transaction for atomic import
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insert or update batch record
      if (existingBatch && existingBatch.status === 'failed') {
        // Retry: update existing batch
        await connection.query(
          `UPDATE import_batches 
           SET status = 'pending', started_at = ?, error_message = NULL
           WHERE batch_id = ?`,
          [now, batchId]
        );
      } else {
        // New import: insert batch record
        await connection.query(
          `INSERT INTO import_batches 
           (batch_id, file_name, file_size, file_hash, status, total_records, started_at)
           VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
          [batchId, fileName, fileSize, fileHash, totalRecords, now]
        );
      }

      // Import valid records
      if (validRecords.length > 0) {
        const importTimestamp = now;
        
        for (const record of validRecords) {
          // Map record fields to database columns
          const { first_name, family_name, country, room_type, days_rented, season, price, source_row_number } = record;
          
          await connection.query(
            `INSERT INTO historical_bookings 
             (first_name, family_name, country, room_type, days_rented, season, price, 
              source_file, source_row_number, import_batch, import_timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              first_name,
              family_name,
              country,
              room_type,
              days_rented,
              season,
              price,
              fileName,
              source_row_number,
              batchId,
              importTimestamp
            ]
          );
        }
      }

      // Update batch with final counts
      const completedAt = new Date();
      await connection.query(
        `UPDATE import_batches 
         SET status = 'completed', 
             imported_count = ?,
             rejected_count = ?,
             completed_at = ?
         WHERE batch_id = ?`,
        [importedCount, rejectedCount, completedAt, batchId]
      );

      // Commit transaction
      await connection.commit();

      // Clean up temp file
      fs.unlinkSync(uploadedFile.tempFilePath);

      // Return import report
      const report = {
        file_name: fileName,
        file_hash: fileHash,
        total_records: totalRecords,
        imported_count: importedCount,
        rejected_count: rejectedCount,
        duplicate_count: 0,
        errors: invalidRecords,
        batch_id: batchId,
        import_timestamp: completedAt.toISOString()
      };

      return res.status(200).json(report);
      
    } catch (err) {
      // Rollback on error
      await connection.rollback();
      
      // Update batch status to failed
      await connection.query(
        `UPDATE import_batches 
         SET status = 'failed', 
             error_message = ?,
             completed_at = ?
         WHERE batch_id = ?`,
        [err.message, new Date(), batchId]
      );
      
      // Clean up temp file
      try {
        fs.unlinkSync(uploadedFile.tempFilePath);
      } catch (cleanupErr) {
        console.error('Error cleaning up temp file:', cleanupErr.message);
      }
      
      // Re-throw for error handling
      throw err;
    } finally {
      connection.release();
    }
    
  } catch (err) {
    // Handle errors not related to transaction rollback
    if (!err.message.includes('Transaction')) {
      console.error('Import error:', err);
    }
    next(err);
  }
});

/**
 * POST /api/import/drinks
 * T021: Import historical cocktail bar sales data from Excel file
 * Same pattern as hotel import
 * 
 * Request: multipart/form-data with 'file' field
 * Response: 200 ImportReport, 400 Validation error, 409 Conflict (duplicate), 500 Server error
 */
router.post('/drinks', async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.files || !req.files.file) {
      return res.status(400).json({ 
        error: 'No file uploaded. Please include a file in the "file" field.' 
      });
    }

    const uploadedFile = req.files.file;
    
    // Validate file type
    if (!uploadedFile.name.toLowerCase().endsWith('.xlsx')) {
      fs.unlinkSync(uploadedFile.tempFilePath);
      return res.status(400).json({ 
        error: 'Invalid file format. Only .xlsx files are supported.' 
      });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (uploadedFile.size > maxSize) {
      fs.unlinkSync(uploadedFile.tempFilePath);
      return res.status(400).json({ 
        error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB.` 
      });
    }

    // Calculate file hash for duplicate detection
    const fileHash = calculateFileHash(uploadedFile.tempFilePath);
    const fileName = uploadedFile.name;
    const fileSize = uploadedFile.size;

    // Check for duplicate import
    const existingBatch = await checkBatchDuplicate(fileHash);
    if (existingBatch && existingBatch.status === 'completed') {
      fs.unlinkSync(uploadedFile.tempFilePath);
      return res.status(409).json({ 
        error: 'File already imported. This file content has already been processed.',
        file_name: fileName,
        file_hash: fileHash,
        existing_batch: existingBatch.batch_id
      });
    }

    // Extract records from Excel file
    const expectedColumns = ['drink_name', 'category', 'price_dkk', 'units_sold'];
    const records = extractRecordsFromExcel(uploadedFile.tempFilePath, expectedColumns);
    
    if (records.length === 0) {
      fs.unlinkSync(uploadedFile.tempFilePath);
      return res.status(400).json({ 
        error: 'No records found in the Excel file. Please verify the file structure.' 
      });
    }

    // Validate all records
    const validationResults = records.map(record => validateHistoricalDrink(record));
    const validRecords = [];
    const invalidRecords = [];
    
    validationResults.forEach((result, index) => {
      if (result.valid) {
        validRecords.push(records[index]);
      } else {
        invalidRecords.push({
          source_row_number: records[index].source_row_number,
          field: result.field,
          value: String(records[index][result.field] || ''),
          reason: result.reason
        });
      }
    });

    const totalRecords = records.length;
    const rejectedCount = invalidRecords.length;
    const importedCount = validRecords.length;

    // Prepare import batch record
    const batchId = fileHash;
    const now = new Date();

    // Begin transaction for atomic import
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insert or update batch record
      if (existingBatch && existingBatch.status === 'failed') {
        await connection.query(
          `UPDATE import_batches 
           SET status = 'pending', started_at = ?, error_message = NULL
           WHERE batch_id = ?`,
          [now, batchId]
        );
      } else {
        await connection.query(
          `INSERT INTO import_batches 
           (batch_id, file_name, file_size, file_hash, status, total_records, started_at)
           VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
          [batchId, fileName, fileSize, fileHash, totalRecords, now]
        );
      }

      // Import valid records
      if (validRecords.length > 0) {
        const importTimestamp = now;
        
        for (const record of validRecords) {
          const { drink_name, category, price_dkk, units_sold, source_row_number } = record;
          
          await connection.query(
            `INSERT INTO historical_drinks 
             (drink_name, category, price_dkk, units_sold, 
              source_file, source_row_number, import_batch, import_timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              drink_name,
              category,
              price_dkk,
              units_sold,
              fileName,
              source_row_number,
              batchId,
              importTimestamp
            ]
          );
        }
      }

      // Update batch with final counts
      const completedAt = new Date();
      await connection.query(
        `UPDATE import_batches 
         SET status = 'completed', 
             imported_count = ?,
             rejected_count = ?,
             completed_at = ?
         WHERE batch_id = ?`,
        [importedCount, rejectedCount, completedAt, batchId]
      );

      // Commit transaction
      await connection.commit();

      // Clean up temp file
      fs.unlinkSync(uploadedFile.tempFilePath);

      // Return import report
      const report = {
        file_name: fileName,
        file_hash: fileHash,
        total_records: totalRecords,
        imported_count: importedCount,
        rejected_count: rejectedCount,
        duplicate_count: 0,
        errors: invalidRecords,
        batch_id: batchId,
        import_timestamp: completedAt.toISOString()
      };

      return res.status(200).json(report);
      
    } catch (err) {
      // Rollback on error
      await connection.rollback();
      
      // Update batch status to failed
      await connection.query(
        `UPDATE import_batches 
         SET status = 'failed', 
             error_message = ?,
             completed_at = ?
         WHERE batch_id = ?`,
        [err.message, new Date(), batchId]
      );
      
      // Clean up temp file
      try {
        fs.unlinkSync(uploadedFile.tempFilePath);
      } catch (cleanupErr) {
        console.error('Error cleaning up temp file:', cleanupErr.message);
      }
      
      throw err;
    } finally {
      connection.release();
    }
    
  } catch (err) {
    if (!err.message.includes('Transaction')) {
      console.error('Import error:', err);
    }
    next(err);
  }
});

/**
 * GET /api/import/hotel
 * T022: List historical hotel bookings with filtering
 * 
 * Query Parameters: country, season, room_type, batch_id, limit, offset
 * Response: 200 { data: HistoricalBooking[], pagination: Pagination } or 400/500
 */
router.get('/hotel', async (req, res, next) => {
  try {
    const { country, season, room_type, batch_id, limit = 100, offset = 0 } = req.query;
    
    // Validate pagination parameters
    const parsedLimit = Math.min(parseInt(limit, 10) || 100, 1000);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);
    
    if (isNaN(parsedLimit) || isNaN(parsedOffset)) {
      return res.status(400).json({ 
        error: 'Invalid pagination parameters. limit and offset must be integers.' 
      });
    }

    // Build WHERE clause and parameters
    const whereClauses = [];
    const params = [];
    
    if (country) {
      whereClauses.push('country = ?');
      params.push(country);
    }
    
    if (season) {
      whereClauses.push('season = ?');
      params.push(season);
    }
    
    if (room_type) {
      whereClauses.push('room_type = ?');
      params.push(room_type);
    }
    
    if (batch_id) {
      whereClauses.push('import_batch = ?');
      params.push(batch_id);
    }

    // Count query
    const countWhere = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM historical_bookings ${countWhere}`, params);
    const total = countRows[0].total;

    // Data query with pagination
    const orderBy = 'ORDER BY id ASC';
    const limitClause = `LIMIT ${parsedLimit} OFFSET ${parsedOffset}`;
    const query = `SELECT * FROM historical_bookings ${countWhere} ${orderBy} ${limitClause}`;
    const [rows] = await pool.query(query, params);

    // Format response with pagination
    const response = {
      data: rows.map(row => ({
        id: row.id,
        first_name: row.first_name,
        family_name: row.family_name,
        country: row.country,
        room_type: row.room_type,
        days_rented: row.days_rented,
        season: row.season,
        price: row.price,
        source_file: row.source_file,
        source_row_number: row.source_row_number,
        import_batch: row.import_batch,
        import_timestamp: row.import_timestamp
      })),
      pagination: {
        limit: parsedLimit,
        offset: parsedOffset,
        total
      }
    };

    return res.status(200).json(response);
    
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/import/drinks
 * T023: List historical drink sales with filtering
 * 
 * Query Parameters: category, batch_id, limit, offset
 * Response: 200 { data: HistoricalDrink[], pagination: Pagination } or 400/500
 */
router.get('/drinks', async (req, res, next) => {
  try {
    const { category, batch_id, limit = 100, offset = 0 } = req.query;
    
    // Validate pagination parameters
    const parsedLimit = Math.min(parseInt(limit, 10) || 100, 1000);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);
    
    if (isNaN(parsedLimit) || isNaN(parsedOffset)) {
      return res.status(400).json({ 
        error: 'Invalid pagination parameters. limit and offset must be integers.' 
      });
    }

    // Build WHERE clause and parameters
    const whereClauses = [];
    const params = [];
    
    if (category) {
      whereClauses.push('category = ?');
      params.push(category);
    }
    
    if (batch_id) {
      whereClauses.push('import_batch = ?');
      params.push(batch_id);
    }

    // Count query
    const countWhere = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM historical_drinks ${countWhere}`, params);
    const total = countRows[0].total;

    // Data query with pagination
    const orderBy = 'ORDER BY id ASC';
    const limitClause = `LIMIT ${parsedLimit} OFFSET ${parsedOffset}`;
    const query = `SELECT * FROM historical_drinks ${countWhere} ${orderBy} ${limitClause}`;
    const [rows] = await pool.query(query, params);

    // Format response with pagination
    const response = {
      data: rows.map(row => ({
        id: row.id,
        drink_name: row.drink_name,
        category: row.category,
        price_dkk: row.price_dkk,
        units_sold: row.units_sold,
        source_file: row.source_file,
        source_row_number: row.source_row_number,
        import_batch: row.import_batch,
        import_timestamp: row.import_timestamp
      })),
      pagination: {
        limit: parsedLimit,
        offset: parsedOffset,
        total
      }
    };

    return res.status(200).json(response);
    
  } catch (err) {
    next(err);
  }
});

export default router;
