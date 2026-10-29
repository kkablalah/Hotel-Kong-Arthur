-- Historical Data Import Tables
-- Generated: 2026-10-28
-- Feature: Historical Data Import
-- CORRECTED: room_type changed from INT to VARCHAR(50)

USE hotel_db;

-- Import batches tracking table (for duplicate detection)
CREATE TABLE IF NOT EXISTS import_batches (
  batch_id VARCHAR(64) PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_size INT,
  file_hash VARCHAR(64) NOT NULL,
  status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  total_records INT,
  imported_count INT DEFAULT 0,
  rejected_count INT DEFAULT 0,
  duplicate_count INT DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  
  UNIQUE KEY uk_file_hash (file_hash),
  INDEX idx_file_name (file_name),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historical Bookings Table
-- CORRECTED: room_type is VARCHAR(50), not INT
CREATE TABLE IF NOT EXISTS historical_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  family_name VARCHAR(100) NOT NULL,
  country VARCHAR(100),
  room_type VARCHAR(50),
  days_rented INT,
  season ENUM('low', 'mid', 'high'),
  price DECIMAL(10,2),
  source_file VARCHAR(255) NOT NULL,
  source_row_number INT,
  import_batch VARCHAR(64) NOT NULL,
  import_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_source_file (source_file),
  INDEX idx_import_batch (import_batch),
  INDEX idx_source_row (source_row_number),
  INDEX idx_season (season),
  INDEX idx_room_type (room_type),
  INDEX idx_country (country),
  INDEX idx_country_season (country, season)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historical Drinks Table
CREATE TABLE IF NOT EXISTS historical_drinks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  drink_name VARCHAR(100) NOT NULL,
  category ENUM('Cocktail', 'Coffee') NOT NULL,
  price_dkk DECIMAL(10,2),
  units_sold INT,
  source_file VARCHAR(255) NOT NULL,
  source_row_number INT,
  import_batch VARCHAR(64) NOT NULL,
  import_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_source_file (source_file),
  INDEX idx_import_batch (import_batch),
  INDEX idx_source_row (source_row_number),
  INDEX idx_category (category),
  INDEX idx_drink_name (drink_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: No foreign keys to preserve independence and prevent cascade issues
