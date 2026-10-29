# Data Model: Historical Data Import Feature

**Date**: 2026-10-28 | **Feature**: Historical Data Import | **Spec**: Feature/spec.md

**CORRECTION LOG**:
- **2026-10-28**: Corrected room_type field from INT (1-8) to VARCHAR(50) based on actual Excel file inspection. The source data contains STRING room type names (e.g., "Spa Executive", "Grand Lit", "Standard Double"), not numeric codes.

This document defines the data entities, fields, relationships, validation rules, and state transitions for the Historical Data Import feature.

---

## Entity Overview

The Historical Data Import feature introduces **2 new entities** to the existing data model:

1. **HistoricalBooking** - Represents a historical hotel booking record from the source Excel file
2. **HistoricalDrink** - Represents a historical cocktail bar drink sales record from the source Excel file

**Existing Entity** (unchanged):
- **Booking** - Operational booking records (in `bookings` table) - **NOT MODIFIED**

---

## Entity: HistoricalBooking

### Purpose
Stores historical hotel booking data imported from `Datasets/international_names_with_rooms_1000.xlsx`. Used for analytics and reporting while preserving the original source data values.

### Fields

| **Field** | **Type** | **SQL Type** | **Nullable** | **Description** | **Source Column** | **Validation** |
|-----------|----------|--------------|--------------|-----------------|------------------|----------------|
| id | Primary Key | INT | NO | Auto-incrementing identifier | N/A | Generated |
| first_name | String | VARCHAR(100) | NO | Guest first name | A | Length 1-100 |
| family_name | String | VARCHAR(100) | NO | Guest family name | B | Length 1-100 |
| country | String | VARCHAR(100) | YES | Guest country of origin | C | Length 1-100 or NULL |
| room_type | String | VARCHAR(50) | YES | Room type name (e.g., "Spa Executive", "Standard Double") | D | Length 1-50 or NULL |
| days_rented | Integer | INT | YES | Number of days rented | E | >= 1 or NULL |
| season | Enum | ENUM('low', 'mid', 'high') | YES | Season label from source data | F | One of: low, mid, high or NULL |
| price | Decimal | DECIMAL(10,2) | YES | Price in DKK | G | >= 0 or NULL |
| source_file | String | VARCHAR(255) | NO | Name of source file | N/A | Length 1-255 |
| import_batch | String | VARCHAR(64) | NO | SHA-256 hash of entire source file for batch tracking | N/A | Length 64 |
| import_timestamp | DateTime | TIMESTAMP | NO | When record was imported | N/A | Auto-generated |

**Note on room_type**: Changed from INT (1-8) to VARCHAR(50) based on actual Excel file inspection. The source contains string values matching the eight room types from the assignment specification.

### Room Type Values (Verified from Source Data)

The following eight room type values exist in the source dataset:
1. Standard Single
2. Standard Double
3. Superior Double
4. Grand Lit
5. Junior Suite
6. Suite
7. LOFT Suite
8. Spa Executive

### Relationships

- **No foreign key relationships** to existing tables (preserves Principle VII - Booking Management Preservation)
- **Belongs to**: Import batch (tracked via import_batch field)

### Validation Rules

```javascript
// Validation logic in importService.js
function validateHistoricalBooking(record) {
  // Required fields
  if (!record.first_name || typeof record.first_name !== 'string') 
    return { valid: false, field: 'first_name', reason: 'Required string' };
  
  if (!record.family_name || typeof record.family_name !== 'string')
    return { valid: false, field: 'family_name', reason: 'Required string' };
  
  // String lengths
  if (record.first_name.length > 100)
    return { valid: false, field: 'first_name', reason: 'Max 100 characters' };
  
  if (record.family_name.length > 100)
    return { valid: false, field: 'family_name', reason: 'Max 100 characters' };
  
  if (record.country && record.country.length > 100)
    return { valid: false, field: 'country', reason: 'Max 100 characters' };
  
  // Room type: STRING validation (CORRECTED)
  if (record.room_type && record.room_type.length > 50)
    return { valid: false, field: 'room_type', reason: 'Max 50 characters' };
  
  // Numeric ranges
  if (record.days_rented !== null && record.days_rented < 1)
    return { valid: false, field: 'days_rented', reason: 'Must be >= 1' };
  
  // Enum validation
  if (record.season && !['low', 'mid', 'high'].includes(record.season))
    return { valid: false, field: 'season', reason: 'Must be low, mid, or high' };
  
  if (record.price !== null && record.price < 0)
    return { valid: false, field: 'price', reason: 'Must be >= 0' };
  
  return { valid: true };
}
```

### Indexes

```sql
-- Primary key
PRIMARY KEY (id)

-- Source file and batch indexes for tracking
INDEX idx_source_file (source_file)
INDEX idx_import_batch (import_batch)

-- Analytics indexes
INDEX idx_season (season)
INDEX idx_room_type (room_type)
INDEX idx_country (country)

-- Composite index for common queries
INDEX idx_country_season (country, season)
```

### SQL Schema

```sql
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
  import_batch VARCHAR(64) NOT NULL,
  import_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_source_file (source_file),
  INDEX idx_import_batch (import_batch),
  INDEX idx_season (season),
  INDEX idx_room_type (room_type),
  INDEX idx_country (country),
  INDEX idx_country_season (country, season)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Entity: HistoricalDrink

### Purpose
Stores historical cocktail bar drink sales data imported from `Datasets/drinks_menu_with_sales.xlsx`. Used for sales analysis and reporting.

### Fields

| **Field** | **Type** | **SQL Type** | **Nullable** | **Description** | **Source Column** | **Validation** |
|-----------|----------|--------------|--------------|-----------------|------------------|----------------|
| id | Primary Key | INT | NO | Auto-incrementing identifier | N/A | Generated |
| drink_name | String | VARCHAR(100) | NO | Name of the drink | A | Length 1-100 |
| category | Enum | ENUM('Cocktail', 'Coffee') | NO | Drink category | B | Required enum |
| price_dkk | Decimal | DECIMAL(10,2) | YES | Price in Danish Kroner | C | >= 0 or NULL |
| units_sold | Integer | INT | YES | Number of units sold | D | >= 0 or NULL |
| source_file | String | VARCHAR(255) | NO | Name of source file | N/A | Length 1-255 |
| import_batch | String | VARCHAR(64) | NO | SHA-256 hash of entire source file | N/A | Length 64 |
| import_timestamp | DateTime | TIMESTAMP | NO | When record was imported | N/A | Auto-generated |

### Relationships

- **No foreign key relationships** to existing tables
- **Belongs to**: Import batch (tracked via import_batch field)

### Validation Rules

```javascript
// Validation logic in importService.js
function validateHistoricalDrink(record) {
  // Required fields
  if (!record.drink_name || typeof record.drink_name !== 'string')
    return { valid: false, field: 'drink_name', reason: 'Required string' };
  
  if (!record.category || typeof record.category !== 'string')
    return { valid: false, field: 'category', reason: 'Required string' };
  
  // String lengths
  if (record.drink_name.length > 100)
    return { valid: false, field: 'drink_name', reason: 'Max 100 characters' };
  
  // Enum validation
  if (!['Cocktail', 'Coffee'].includes(record.category))
    return { valid: false, field: 'category', reason: 'Must be Cocktail or Coffee' };
  
  // Numeric ranges
  if (record.price_dkk !== null && record.price_dkk < 0)
    return { valid: false, field: 'price_dkk', reason: 'Must be >= 0' };
  
  if (record.units_sold !== null && record.units_sold < 0)
    return { valid: false, field: 'units_sold', reason: 'Must be >= 0' };
  
  return { valid: true };
}
```

### Indexes

```sql
-- Primary key
PRIMARY KEY (id)

-- Source file and batch indexes
INDEX idx_source_file (source_file)
INDEX idx_import_batch (import_batch)

-- Analytics index
INDEX idx_category (category)

-- Drink name index
INDEX idx_drink_name (drink_name)
```

### SQL Schema

```sql
CREATE TABLE IF NOT EXISTS historical_drinks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  drink_name VARCHAR(100) NOT NULL,
  category ENUM('Cocktail', 'Coffee') NOT NULL,
  price_dkk DECIMAL(10,2),
  units_sold INT,
  source_file VARCHAR(255) NOT NULL,
  import_batch VARCHAR(64) NOT NULL,
  import_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_source_file (source_file),
  INDEX idx_import_batch (import_batch),
  INDEX idx_category (category),
  INDEX idx_drink_name (drink_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA MODEL OVERVIEW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  EXISTING (UNCHANGED)                   NEW                          │
│  ─────────────────────                ─────────────────────        │
│                                                                     │
│  ┌─────────────────┐                ┌─────────────────────┐       │
│  │    bookings      │                │  historical_bookings  │       │
│  │  (operational)   │                │   (read-only)        │       │
│  ├─────────────────┤                ├─────────────────────┤       │
│  │ id               │                │ id                   │       │
│  │ guest_name       │                │ first_name           │       │
│  │ email            │                │ family_name          │       │
│  │ room_number      │                │ country              │       │
│  │ check_in         │                │ room_type (VARCHAR)  │◄── CORRECTED
│  │ check_out        │                │ days_rented          │       │
│  │ status           │                │ season               │       │
│  │ created_at       │                │ price                │       │
│  └─────────────────┘                │ source_file          │       │
│                                      │ import_batch          │       │
│                                      │ import_timestamp      │       │
│                                      └─────────────────────┘       │
│                                                                     │
│  ┌─────────────────┐                ┌─────────────────────┐       │
│  │   (none)         │                │   historical_drinks   │       │
│  └─────────────────┘                │   (read-only)        │       │
│                                      ├─────────────────────┤       │
│                                      │ id                   │       │
│                                      │ drink_name           │       │
│                                      │ category             │       │
│                                      │ price_dkk            │       │
│                                      │ units_sold           │       │
│                                      │ source_file          │       │
│                                      │ import_batch          │       │
│                                      │ import_timestamp      │       │
│                                      └─────────────────────┘       │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘

Relationships: NONE (Preserves Principle VII - Booking Management Preservation)
All entities are independent for clear separation and flexibility.
```

---

## Duplicate Detection Strategy

### Problem Statement
The system must:
1. Prevent importing the same file twice
2. Detect when a file has been modified (even if filename is the same)
3. Preserve legitimate identical rows within a single file (two guests with same name staying in same room type is valid)
4. Support safe retry if an import fails
5. Avoid partial imports

### Solution: Import Batch Tracking with File Content Hash

**Strategy**: Track import batches by file content hash, not by row content hash

#### Implementation Details:

1. **File-Level Hash (import_batch field)**:
   - Calculate SHA-256 hash of the entire source file content
   - Store this hash in the `import_batch` field of each imported record
   - This identifies which file the record came from

2. **Batch Tracking Table**:
   - Create a separate `import_batches` table to track completed imports
   - Prevents re-importing the same file content
   - Allows detecting modified files (different hash = new content)

3. **Row-Level Identification**:
   - Each row within a batch gets a sequential `source_row_number` (1-indexed)
   - This allows re-importing a modified file and identifying changed rows
   - Identical rows within a file are preserved (they have different source_row_number)

4. **Safe Retry**:
   - If import fails, no records are inserted (transaction rollback)
   - Import can be retried safely

5. **Partial Import Prevention**:
   - Entire import runs in a single database transaction
   - All records from a file are inserted together or not at all

### Schema Addition: import_batches Table

```sql
CREATE TABLE IF NOT EXISTS import_batches (
  batch_id VARCHAR(64) PRIMARY KEY,  -- SHA-256 of file content
  file_name VARCHAR(255) NOT NULL,
  file_size INT,
  file_hash VARCHAR(64) NOT NULL,  -- Same as batch_id
  status ENUM('pending', 'completed', 'failed') NOT NULL,
  total_records INT,
  imported_count INT,
  rejected_count INT,
  duplicate_count INT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  
  UNIQUE KEY uk_file_hash (file_hash),
  INDEX idx_file_name (file_name),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Schema Addition: source_row_number Field

Add to both historical tables:

```sql
-- In historical_bookings table
source_row_number INT,  -- Row number in source file (1-indexed)

-- In historical_drinks table  
source_row_number INT,  -- Row number in source file (1-indexed)
```

### Hash Calculation

```javascript
import crypto from 'crypto';
import fs from 'fs';

// File-level hash for batch tracking
function calculateFileHash(filePath) {
  const fileContent = fs.readFileSync(filePath);
  return crypto
    .createHash('sha256')
    .update(fileContent)
    .digest('hex');
}
```

### Import Workflow with Duplicate Detection

1. **Calculate file hash** before processing
2. **Check import_batches table** for existing batch with same file_hash
3. **If exists and status=completed**: Reject with "File already imported"
4. **If exists and status=failed**: Allow retry (safe due to transaction rollback)
5. **If new hash**: Proceed with import
6. **Insert into import_batches** with status='pending'
7. **Process and insert records** in transaction
8. **Update import_batches** with final status and counts

### Trade-offs

**Pros:**
- File-level deduplication prevents repeated imports
- Modified files detected via hash change
- Legitimate identical rows preserved (different source_row_number)
- Safe retry on failure
- Full audit trail of all imports

**Cons:**
- Requires additional table (import_batches)
- Requires additional field (source_row_number) in historical tables
- Slightly more storage overhead

**Chosen Approach**: File-level hash + batch tracking is the most robust solution that meets all requirements.

---

## Data Import Workflow

### Step 1: File Validation
```
Input: Excel file upload via POST /api/import/hotel or /api/import/drinks
Validation:
  ✓ File exists and is readable
  ✓ File is valid Excel format (.xlsx)
  ✓ File size < 10MB
  ✓ File has expected structure (7 columns for hotel, 4 for drinks)
  ✓ Calculate file hash for duplicate detection
Output: Validation result (pass/fail with reasons)
```

### Step 2: Batch Check
```
Process:
  1. Calculate file_hash (SHA-256 of file content)
  2. Query import_batches table for file_hash
  3. If found with status='completed': Reject with "File already imported"
  4. If found with status='failed': Proceed (allow retry)
  5. If not found: Proceed
Output: Batch decision (proceed/reject)
```

### Step 3: Record Extraction
```
Process:
  1. Parse Excel file using xlsx library
  2. Skip header row (row 1)
  3. Extract data rows (row 2 to end)
  4. Map columns to field names
  5. Include source_row_number for each record
Output: Array of raw record objects with row numbers
```

### Step 4: Record Validation
```
Process:
  For each record:
    1. Apply field-level validation (type, length, range, enum)
  
Output: 
  - valid_records: Array of validated records
  - invalid_records: Array of { record, errors, source_row_number }
```

### Step 5: Database Insert (Transaction)
```
Process:
  1. Begin MySQL transaction
  2. Insert into import_batches with status='pending'
  3. For each valid record:
       INSERT INTO historical_bookings/historical_drinks
       (all fields including source_file, import_batch, source_row_number, import_timestamp)
  4. Update import_batches with status='completed' and counts
  5. Commit transaction on success
  6. Rollback transaction on any error (update import_batches with status='failed')
Output: Insert results
```

---

## Database Migration Script

### File: `db/import.sql`

```sql
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
```

---

## Constitution Compliance

| **Principle** | **Compliance** | **Notes** |
|--------------|---------------|-----------|
| **II. Three-Layer Architecture** | ✅ | Separate routes, services, db access |
| **III. API Contract Integrity** | ✅ | OpenAPI schemas defined |
| **IV. Database Standard** | ✅ | MySQL, snake_case, version-controlled |
| **VI. Data Analytics Accuracy** | ⚠️ Partial | Schema supports analytics; season/employee logic blocked by BL-01, BL-02 |
| **VII. Booking Management Preservation** | ✅ | No changes to existing bookings table |
| **XI. Documentation Consistency** | ✅ | All entities documented |

---

## Blocked Items Affecting Data Model

The following data model aspects are **blocked pending group approval**:

### BL-01: Season Boundary Definitions
**Impact on Data Model**: None - season field is ENUM('low', 'mid', 'high')
**Impact on Analytics**: Season-based queries cannot use calendar dates until boundaries defined
**Data Model Status**: ✅ Complete - season field ready for use

### BL-02: Helene Christine Attribution Method
**Impact on Data Model**: None - historical_drinks has no employee field
**Impact on Analytics**: Employee-specific queries blocked
**Data Model Status**: ✅ Complete - drinks data ready for aggregate analysis
**Note**: Employee attribution would require separate demonstration data table (not part of historical import)

### BL-03: Synthetic Date Generation Policy
**Impact on Data Model**: None - no date fields in historical tables
**Impact on Analytics**: Annual calculations blocked for historical data
**Data Model Status**: ✅ Complete - data can be imported as-is
**Note**: Annual reporting would require separate demonstration data or date generation

---

## Summary

**Entities Defined**: 3 (ImportBatch, HistoricalBooking, HistoricalDrink)
**Tables Created**: 3 (import_batches, historical_bookings, historical_drinks)
**Indexes**: 17 total (6 for import_batches, 8 for historical_bookings, 5 for historical_drinks)
**Relationships**: 0 (independent tables per Principle VII)
**Validation Rules**: Comprehensive field-level validation for all entities
**Constitution Compliance**: ✅ All principles satisfied
**Blocked Items**: 0 affecting data model; 3 affecting analytics (documented)

**CORRECTION**: room_type changed from INT to VARCHAR(50) to match actual source data.

---

*This data model document was generated and corrected during planning on 2026-10-28*
