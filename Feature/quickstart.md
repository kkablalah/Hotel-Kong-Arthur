# Quickstart Validation Guide: Historical Data Import

**Date**: 2026-10-28 | **Feature**: Historical Data Import | **Spec**: Feature/spec.md

**CORRECTION LOG**:
- **2026-10-28**: Updated to reflect corrected room_type as STRING (not numeric). Added test scenarios for duplicate import detection, modified files, and legitimate identical rows.

This guide provides runnable validation scenarios to prove the Historical Data Import feature works end-to-end. Use this to verify implementation before proceeding to testing and deployment.

**Note on Room Types**: The hotel dataset's Room Type column contains STRING values (e.g., "Spa Executive", "Grand Lit", "Standard Double"), NOT numeric codes. This was corrected based on direct Excel file inspection.

---

## Prerequisites

### Software Requirements
- Docker (v20.10+)
- Docker Compose (v2.0+)
- Node.js (v18+) - for local development
- MySQL client (optional) - for database inspection

### Repository Setup
```bash
# Clone the repository
git clone <repository-url>
cd Hotel-Kong-Arthur

# The feature files are in the Feature/ directory
# Source data files are in Datasets/
```

### Environment Variables
The backend uses the following environment variables (defined in `backend/src/db.js`):
- `MYSQL_HOST` - default: `mysql` (Docker service name)
- `MYSQL_PORT` - default: `3306`
- `MYSQL_USER` - default: `hoteluser`
- `MYSQL_PASSWORD` - default: `hotelpass`
- `MYSQL_DATABASE` - default: `hotel_db`
- `PORT` - default: `3000`

---

## Setup Instructions

### 1. Verify Existing Docker Compose Configuration

**Note**: The existing `Docker-compose.yml` (note: mixed case filename) is already configured with all services.

```bash
# Verify the file exists (note: mixed case)
ls -la Docker-compose.yml

# The file should contain mysql, backend, and frontend services
# DO NOT create a duplicate docker-compose.yml
```

### 2. Start the System with Docker Compose

```bash
# Build and start all services
docker compose build
docker compose up -d

# Verify services are running
docker compose ps
# Expected output:
#   NAME                SERVICE             STATUS              PORTS
#   hotel-kong-arthur-backend-1   backend    running   0.0.0.0:3000->3000/tcp
#   hotel-kong-arthur-frontend-1    frontend   running   0.0.0.0:8080->80/tcp
#   hotel-kong-arthur-mysql-1       mysql      running   0.0.0.0:3306->3306/tcp
```

### 3. Verify Backend Health
```bash
# Check backend health endpoint
curl http://localhost:3000/health
# Expected output:
# {"status":"ok","service":"hotel-kong-arthur-backend"}

# Check Swagger UI is accessible
# Open in browser: http://localhost:3000/api-docs
```

### 4. Verify Existing Booking Functionality (Principle VII)
```bash
# List existing bookings (should work before and after import)
curl http://localhost:3000/api/bookings
# Expected: JSON array of existing bookings (from mysql/init.sql)

# Verify booking CRUD still works
# (This ensures Principle VII - Booking Management Preservation is maintained)
```

---

## Validation Scenarios

### Scenario 1: Import Historical Hotel Data
**Purpose**: Verify hotel data import from Excel file with STRING room types

**Prerequisites**:
- Docker Compose services running
- Backend accessible at http://localhost:3000

**Steps**:

1. **Import the hotel data file**:
   ```bash
   curl -X POST http://localhost:3000/api/import/hotel \
     -H "Content-Type: multipart/form-data" \
     -F "file=@Datasets/international_names_with_rooms_1000.xlsx"
   ```

2. **Expected Response**:
   ```json
   {
     "file_name": "international_names_with_rooms_1000.xlsx",
     "file_hash": "a1b2c3...64chars",
     "total_records": 1001,
     "imported_count": 1001,
     "rejected_count": 0,
     "duplicate_count": 0,
     "errors": [],
     "batch_id": "a1b2c3...64chars",
     "import_timestamp": "2026-10-28T10:30:00.000Z"
   }
   ```

3. **Verify Data**:
   ```bash
   # List first 5 historical bookings
   curl "http://localhost:3000/api/import/hotel?limit=5"
   
   # Expected: JSON array with 5 HistoricalBooking objects
   # Each should have: id, first_name, family_name, country, 
   # room_type (STRING, e.g., "Standard Double"), days_rented, season, 
   # price, source_file, source_row_number, import_batch, import_timestamp
   ```

4. **Verify Room Type Values**:
   ```bash
   # Get all distinct room types
   curl "http://localhost:3000/api/import/hotel?limit=1001" | jq '[.[].room_type] | unique'
   
   # Expected: 8 distinct string values:
   # "Standard Single", "Standard Double", "Superior Double", 
   # "Grand Lit", "Junior Suite", "Suite", "LOFT Suite", "Spa Executive"
   ```

5. **Verify Specific Record**:
   ```bash
   # Get first record by ID
   curl http://localhost:3000/api/import/hotel/1
   
   # Expected: Single HistoricalBooking object with room_type as STRING
   ```

**Success Criteria**:
- ✅ Import completes without errors
- ✅ All 1001 records imported
- ✅ Room type values are STRING (not numeric)
- ✅ All 8 room type names present
- ✅ Season labels (low/mid/high) intact

---

### Scenario 2: Import Historical Drinks Data
**Purpose**: Verify drinks data import from Excel file

**Steps**:

1. **Import the drinks data file**:
   ```bash
   curl -X POST http://localhost:3000/api/import/drinks \
     -H "Content-Type: multipart/form-data" \
     -F "file=@Datasets/drinks_menu_with_sales.xlsx"
   ```

2. **Expected Response**:
   ```json
   {
     "file_name": "drinks_menu_with_sales.xlsx",
     "file_hash": "a1b2c3...64chars",
     "total_records": 30,
     "imported_count": 30,
     "rejected_count": 0,
     "duplicate_count": 0,
     "errors": [],
     "batch_id": "a1b2c3...64chars",
     "import_timestamp": "2026-10-28T10:35:00.000Z"
   }
   ```

3. **Verify Data**:
   ```bash
   # List all historical drinks
   curl "http://localhost:3000/api/import/drinks"
   
   # Expected: JSON array with 30 HistoricalDrink objects
   # Each should have: id, drink_name, category, price_dkk, units_sold,
   # source_file, source_row_number, import_batch, import_timestamp
   ```

4. **Verify Category Filtering**:
   ```bash
   # Get only Cocktail drinks
   curl "http://localhost:3000/api/import/drinks?category=Cocktail"
   
   # Expected: 20 records (20 cocktails in dataset)
   
   # Get only Coffee drinks
   curl "http://localhost:3000/api/import/drinks?category=Coffee"
   
   # Expected: 10 records (10 coffee types in dataset)
   ```

**Success Criteria**:
- ✅ Import completes without errors
- ✅ All 30 records imported
- ✅ Categories (Cocktail, Coffee) intact
- ✅ Filtering by category works
- ✅ No employee attribution fabricated

---

### Scenario 3: Re-import Same File (Duplicate Detection)
**Purpose**: Verify that importing the same file twice is rejected

**Prerequisites**:
- Scenario 1 or 2 already completed

**Steps**:

1. **Import the same hotel file again**:
   ```bash
   curl -X POST http://localhost:3000/api/import/hotel \
     -H "Content-Type: multipart/form-data" \
     -F "file=@Datasets/international_names_with_rooms_1000.xlsx"
   ```

2. **Expected Response**:
   ```json
   {
     "error": "File already imported",
     "detail": "File with hash a1b2c3...64chars was already imported on 2026-10-28T10:30:00.000Z"
   }
   ```
   **OR** HTTP 409 Conflict with similar message

3. **Verify No New Records**:
   ```bash
   # Count should still be 1001
   curl "http://localhost:3000/api/import/hotel" | jq 'length'
   # Expected: 1001 (not 2002)
   ```

**Success Criteria**:
- ✅ Import rejected with clear error message
- ✅ No duplicate records created
- ✅ Existing records unchanged

---

### Scenario 4: Import with Invalid Data
**Purpose**: Verify validation and error handling for invalid rows

**Prerequisites**:
- Create a test file with invalid data

**Steps**:

1. **Create test file with invalid data**:
   ```bash
   # Use a spreadsheet tool to create test_invalid.xlsx with:
   # Row 2 (header): First Name, Family Name, Country, Room Type, Days Rented, Season, Price
   # Row 3: Empty first_name, "Doe", "USA", "Standard Double", 5, "mid", 1000
   # Row 4: "John", "Smith", "France", "Invalid Room", 3, "mid", 2000
   # Row 5: "Jane", "Doe", "Germany", "Standard Double", -1, "low", 3000 (negative days)
   # Row 6: "Bob", "Smith", "UK", "Standard Double", 2, "invalid", 4000 (invalid season)
   # Save in Datasets/ directory
   ```

2. **Import invalid file**:
   ```bash
   curl -X POST http://localhost:3000/api/import/hotel \
     -H "Content-Type: multipart/form-data" \
     -F "file=@Datasets/test_invalid.xlsx"
   ```

3. **Expected Response**:
   ```json
   {
     "file_name": "test_invalid.xlsx",
     "file_hash": "different_hash...",
     "total_records": 4,
     "imported_count": 0,
     "rejected_count": 4,
     "duplicate_count": 0,
     "errors": [
       {
         "source_row_number": 2,
         "field": "first_name",
         "value": "",
         "reason": "Required field missing"
       },
       {
         "source_row_number": 3,
         "field": "room_type",
         "value": "Invalid Room",
         "reason": "Must be one of: Standard Single, Standard Double, Superior Double, Grand Lit, Junior Suite, Suite, LOFT Suite, Spa Executive"
       },
       {
         "source_row_number": 4,
         "field": "days_rented",
         "value": "-1",
         "reason": "Must be >= 1"
       },
       {
         "source_row_number": 5,
         "field": "season",
         "value": "invalid",
         "reason": "Must be low, mid, or high"
       }
     ],
     "batch_id": "different_hash...",
     "import_timestamp": "2026-10-28T10:40:00.000Z"
   }
   ```

**Success Criteria**:
- ✅ No records imported
- ✅ All 4 records rejected
- ✅ Error details provided for each rejection
- ✅ source_row_number included in errors

---

### Scenario 5: Import Modified File with Same Filename
**Purpose**: Verify that a modified file with the same filename is detected as new

**Prerequisites**:
- Create a modified version of the hotel data file

**Steps**:

1. **Create modified file**:
   ```bash
   # Copy original and modify one value
   cp Datasets/international_names_with_rooms_1000.xlsx Datasets/international_names_with_rooms_1000_modified.xlsx
   # Use Excel tool to change one guest's first name (e.g., change "Liam" to "Liam_Modified")
   # Save as Datasets/international_names_with_rooms_1000.xlsx (SAME filename)
   ```

2. **Import modified file**:
   ```bash
   curl -X POST http://localhost:3000/api/import/hotel \
     -H "Content-Type: multipart/form-data" \
     -F "file=@Datasets/international_names_with_rooms_1000.xlsx"
   ```

3. **Expected Response**:
   ```json
   {
     "file_name": "international_names_with_rooms_1000.xlsx",
     "file_hash": "NEW_DIFFERENT_HASH...",
     "total_records": 1001,
     "imported_count": 1001,
     "rejected_count": 0,
     "duplicate_count": 0,
     "errors": [],
     "batch_id": "NEW_DIFFERENT_HASH...",
     "import_timestamp": "2026-10-28T10:45:00.000Z"
   }
   ```

4. **Verify New Records**:
   ```bash
   # Count should now be 2002 (1001 original + 1001 new)
   curl "http://localhost:3000/api/import/hotel" | jq 'length'
   # Expected: 2002
   ```

**Success Criteria**:
- ✅ Import succeeds (different file hash detected)
- ✅ All 1001 records from modified file imported
- ✅ Total count increased by 1001
- ✅ Both batches trackable via batch_id

---

### Scenario 6: Legitimate Identical Rows within File
**Purpose**: Verify that identical rows within the same file are preserved (not treated as duplicates)

**Prerequisites**:
- Create a test file with intentional duplicate rows

**Steps**:

1. **Create test file with duplicate rows**:
   ```bash
   # Create test_duplicates.xlsx with:
   # Row 2: "John", "Doe", "USA", "Standard Double", 3, "mid", 1000
   # Row 3: "John", "Doe", "USA", "Standard Double", 3, "mid", 1000 (IDENTICAL to row 2)
   # Row 4: "Jane", "Smith", "UK", "Suite", 5, "high", 2000
   # Save in Datasets/
   ```

2. **Import file with duplicate rows**:
   ```bash
   curl -X POST http://localhost:3000/api/import/hotel \
     -H "Content-Type: multipart/form-data" \
     -F "file=@Datasets/test_duplicates.xlsx"
   ```

3. **Expected Response**:
   ```json
   {
     "file_name": "test_duplicates.xlsx",
     "file_hash": "...",
     "total_records": 3,
     "imported_count": 3,
     "rejected_count": 0,
     "duplicate_count": 0,  // 0 because duplicates are within same file
     "errors": [],
     "batch_id": "...",
     "import_timestamp": "..."
   }
   ```

4. **Verify All Rows Imported**:
   ```bash
   # Get all records from this batch
   curl "http://localhost:3000/api/import/hotel?batch_id=..." | jq 'length'
   # Expected: 3 (including both identical "John Doe" rows)
   
   # Verify source_row_number differs
   curl "http://localhost:3000/api/import/hotel?batch_id=..." | jq '.[] | {first_name, family_name, source_row_number}'
   # Expected: Two records with same name but different source_row_number (2 and 3)
   ```

**Success Criteria**:
- ✅ All 3 records imported (including identical rows)
- ✅ duplicate_count = 0 (not treated as duplicates)
- ✅ Different source_row_number for each row
- ✅ Legitimate data preserved

---

### Scenario 7: Import Status and History
**Purpose**: Verify import tracking and batch management

**Steps**:

1. **Check import batch list**:
   ```bash
   curl http://localhost:3000/api/import/batches
   ```

2. **Expected Response**:
   ```json
   {
     "data": [
       {
         "batch_id": "hash1...",
         "file_name": "international_names_with_rooms_1000.xlsx",
         "file_size": 48973,
         "file_hash": "hash1...",
         "status": "completed",
         "total_records": 1001,
         "imported_count": 1001,
         "rejected_count": 0,
         "duplicate_count": 0,
         "started_at": "2026-10-28T10:30:00.000Z",
         "completed_at": "2026-10-28T10:30:05.000Z"
       },
       {
         "batch_id": "hash2...",
         "file_name": "drinks_menu_with_sales.xlsx",
         "status": "completed",
         "total_records": 30,
         "imported_count": 30
       }
     ],
     "pagination": {
       "limit": 100,
       "offset": 0,
       "total": 2
     }
   }
   ```

3. **Verify specific batch**:
   ```bash
   curl "http://localhost:3000/api/import/batches?file_name=international_names_with_rooms_1000.xlsx"
   ```

**Success Criteria**:
- ✅ Import batches tracked
- ✅ Status, counts, and timestamps recorded
- ✅ Filtering by file_name works

---

### Scenario 8: Missing File Handling
**Purpose**: Verify error handling for missing or wrong files

**Steps**:

1. **Import non-existent file**:
   ```bash
   curl -X POST http://localhost:3000/api/import/hotel \
     -H "Content-Type: multipart/form-data" \
     -F "file=@nonexistent.xlsx"
   
   # Expected: 400 Bad Request with error about missing file
   ```

2. **Import non-Excel file**:
   ```bash
   curl -X POST http://localhost:3000/api/import/hotel \
     -H "Content-Type: multipart/form-data" \
     -F "file=@README.md"
   
   # Expected: 400 Bad Request with error about invalid file format
   ```

3. **Request with missing file parameter**:
   ```bash
   curl -X POST http://localhost:3000/api/import/hotel \
     -H "Content-Type: multipart/form-data"
   
   # Expected: 400 Bad Request with error about missing file
   ```

**Success Criteria**:
- ✅ Appropriate HTTP status codes (400)
- ✅ Clear error messages
- ✅ No server crashes

---

### Scenario 9: Database Failure and Rollback
**Purpose**: Verify transaction rollback on database failure

**Note**: This requires manually causing a database failure, which may not be safe in all environments.

**Steps (if safe to test)**:

1. **Cause database error** (simulate by modifying validation to reject all records):
   ```bash
   # This is a thought exercise - actual implementation should handle this
   # If database fails mid-import, transaction should rollback
   ```

2. **Verify via application logs**:
   ```bash
   docker compose logs backend
   # Expected: Error logged, transaction rolled back
   ```

3. **Verify no partial import**:
   ```bash
   # Count should be 0 or previous count, not partial
   curl "http://localhost:3000/api/import/hotel" | jq 'length'
   ```

**Success Criteria**:
- ✅ No partial imports (all or nothing)
- ✅ Error properly logged
- ✅ Database remains consistent

---

### Scenario 10: Database Verification
**Purpose**: Verify data was correctly stored in MySQL with proper schema

**Steps**:

1. **Connect to MySQL**:
   ```bash
   docker compose exec mysql mysql -u hoteluser -p hotel_db
   # Password: hotelpass
   ```

2. **Verify tables exist**:
   ```sql
   SHOW TABLES;
   -- Expected: bookings, historical_bookings, historical_drinks, import_batches
   ```

3. **Verify hotel data table**:
   ```sql
   SELECT COUNT(*) FROM historical_bookings;
   -- Expected: 1001 (or more if test files imported)
   
   SELECT room_type, COUNT(*) FROM historical_bookings GROUP BY room_type;
   -- Expected: 8 room types with counts
   ```

4. **Verify drinks data table**:
   ```sql
   SELECT COUNT(*) FROM historical_drinks;
   -- Expected: 30 (or more if test files imported)
   
   SELECT category, COUNT(*) FROM historical_drinks GROUP BY category;
   -- Expected: Cocktail=20, Coffee=10
   ```

5. **Verify import batches table**:
   ```sql
   SELECT * FROM import_batches;
   -- Expected: Rows for each successful import
   ```

6. **Verify indexes**:
   ```sql
   SHOW INDEX FROM historical_bookings;
   -- Expected: idx_source_file, idx_import_batch, idx_season, idx_room_type, idx_country, idx_country_season
   
   SHOW INDEX FROM import_batches;
   -- Expected: uk_file_hash (UNIQUE), idx_file_name, idx_status
   ```

**Success Criteria**:
- ✅ All tables created correctly
- ✅ Record counts match expectations
- ✅ Data values match source files
- ✅ Room types are STRING values
- ✅ Indexes created for performance

---

### Scenario 11: Verify Existing Functionality Intact
**Purpose**: Verify Principle VII (Booking Management Preservation)

**Steps**:

1. **List existing bookings**:
   ```bash
   curl http://localhost:3000/api/bookings
   ```

2. **Create a new booking**:
   ```bash
   curl -X POST http://localhost:3000/api/bookings \
     -H "Content-Type: application/json" \
     -d '{
       "guestName": "Test Guest",
       "email": "test@example.com",
       "roomNumber": 101,
       "checkIn": "2026-12-01",
       "checkOut": "2026-12-05"
     }'
   ```

3. **Verify booking created**:
   ```bash
   curl http://localhost:3000/api/bookings | jq '.[-1]'
   ```

4. **Update booking**:
   ```bash
   curl -X PUT http://localhost:3000/api/bookings/1 \
     -H "Content-Type: application/json" \
     -d '{"status": "checked_in"}'
   ```

5. **Delete booking**:
   ```bash
   curl -X DELETE http://localhost:3000/api/bookings/1
   ```

**Success Criteria**:
- ✅ All existing booking CRUD operations work
- ✅ No data corruption
- ✅ Response formats unchanged

---

### Scenario 12: Filtering and Querying
**Purpose**: Verify API filtering works correctly

**Steps**:

1. **Filter by country**:
   ```bash
   curl "http://localhost:3000/api/import/hotel?country=China"
   # Expected: All bookings with country = "China"
   ```

2. **Filter by season**:
   ```bash
   curl "http://localhost:3000/api/import/hotel?season=high"
   # Expected: All bookings with season = "high"
   ```

3. **Filter by room_type**:
   ```bash
   curl "http://localhost:3000/api/import/hotel?room_type=Standard Double"
   # Expected: All bookings with room_type = "Standard Double"
   ```

4. **Filter by batch**:
   ```bash
   curl "http://localhost:3000/api/import/hotel?batch_id=known_batch_id"
   # Expected: All records from that import batch
   ```

5. **Pagination**:
   ```bash
   curl "http://localhost:3000/api/import/hotel?limit=10&offset=0"
   # Expected: First 10 records
   ```

**Success Criteria**:
- ✅ All filters work correctly
- ✅ Pagination works
- ✅ Room type filtering uses STRING values

---

## Post-Validation Checklist

Use this checklist after running all scenarios:

- [ ] Docker Compose starts all services successfully
- [ ] Backend health endpoint responds
- [ ] Swagger UI is accessible
- [ ] Historical hotel data imports without errors
- [ ] All 1001 hotel records imported
- [ ] Room type values are STRING (not numeric)
- [ ] All 8 room types present in data
- [ ] Historical drinks data imports without errors
- [ ] All 30 drink records imported
- [ ] Duplicate file detection works (Scenario 3)
- [ ] Modified file detection works (Scenario 5)
- [ ] Legitimate identical rows preserved (Scenario 6)
- [ ] Invalid data is rejected with proper errors (Scenario 4)
- [ ] Import batch tracking works (Scenario 7)
- [ ] Missing files handled properly (Scenario 8)
- [ ] Database tables created correctly (Scenario 10)
- [ ] Data values match source files
- [ ] Room types match actual Excel values
- [ ] Existing booking CRUD still works (Scenario 11)
- [ ] Filtering and querying works (Scenario 12)

---

## Expected Outcomes

After successful validation:

1. ✅ **Import Functionality**: Both Excel files imported successfully
2. ✅ **Data Integrity**: All source values preserved exactly
3. ✅ **Room Type Handling**: Room types stored as STRING values
4. ✅ **Duplicate Detection**: File-level duplicate detection prevents re-imports
5. ✅ **Modified File Detection**: Changed files with same name detected via hash
6. ✅ **Identical Rows**: Legitimate duplicates within file preserved
7. ✅ **Validation**: Invalid data rejected with clear errors
8. ✅ **Batch Tracking**: All imports tracked with status
9. ✅ **API Access**: Imported data available through REST API
10. ✅ **Existing Functionality**: Booking CRUD operations still work
11. ✅ **Filtering**: All query filters work correctly
12. ✅ **Documentation**: OpenAPI specs match implementation

---

## Troubleshooting

### Common Issues

**Issue: Docker Compose fails to start MySQL**
- Solution: Check port 3306 is not already in use
- Solution: Increase Docker resources if MySQL fails to start

**Issue: Import endpoint returns 404**
- Solution: Verify backend is running: `curl http://localhost:3000/health`
- Solution: Check route is mounted in app.js

**Issue: Import hangs or times out**
- Solution: Check Docker logs: `docker compose logs backend`
- Solution: Verify file is accessible from container

**Issue: Database errors during import**
- Solution: Check MySQL logs: `docker compose logs mysql`
- Solution: Verify database connection in db.js

**Issue: Duplicate detection not working**
- Solution: Verify file hash calculation is consistent
- Solution: Check import_batches table for existing entries

**Issue: Room type values are numeric**
- Solution: Verify data-model.md was updated to use VARCHAR(50)
- Solution: Check database schema in historical_bookings table

---

## Cleanup

To reset the system for re-testing:

```bash
# Stop and remove containers
docker compose down

# Remove volumes (WARNING: deletes all data)
docker volume prune -f

# Remove imported data from database
docker compose exec mysql mysql -u hoteluser -photelpass hotel_db -e \
  "DELETE FROM historical_bookings; DELETE FROM historical_drinks; DELETE FROM import_batches;"
```

---

*This quickstart guide was generated and corrected during planning on 2026-10-28*
