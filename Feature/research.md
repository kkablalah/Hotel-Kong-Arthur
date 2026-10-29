# Research Findings: Historical Data Import Feature

**Date**: 2026-10-28 | **Feature**: Historical Data Import | **Spec**: Feature/spec.md

This document resolves all NEEDS CLARIFICATION items identified during the planning process through inspection of the existing codebase, datasets, and constitution.

**CORRECTION LOG**: 
- **2026-10-28**: Corrected TR-02 Room Type data type from "numeric (1-8)" to "string" based on direct Excel file inspection. The source file contains actual room type names (e.g., "Spa Executive", "Grand Lit", "Standard Double"), NOT numeric codes.

---

## Technical Research

### TR-01: Existing Architecture Analysis

**Question**: What is the current three-layer architecture implementation?

**Findings**:
```
Presentation/API Layer (routes):
  Location: backend/src/routes/
  Files: bookings.js
  Responsibilities: HTTP request/response handling, Express middleware
  Constraints: No business logic, no database calls

Business Logic Layer (services):
  Location: backend/src/services/
  Files: bookingService.js
  Responsibilities: Domain rules, validation, calculations
  Constraints: No HTTP responses, no direct DB calls

Data Access Layer (db):
  Location: backend/src/db.js
  Responsibilities: MySQL connection pool, query execution
  Constraints: No business rules
```

**Decision**: Follow existing pattern for import functionality
- Import routes: `backend/src/routes/import.js` (Presentation)
- Import service: `backend/src/services/importService.js` (Business Logic)
- Database queries: Extended in `backend/src/db.js` or separate file (Data Access)

**Rationale**: Maintains consistency with existing codebase; preserves Principle II (Three-Layer Architecture)

**Alternatives considered**: None - existing pattern is optimal

---

### TR-02: Excel File Structure Verification

**Question**: What are the exact columns and data types in the source files?

**Findings - Hotel Dataset** (`Datasets/international_names_with_rooms_1000.xlsx`):
```
Total Rows: 1002 (1 header + 1001 data records)
Columns:
  A: First Name (string) - e.g., "Liam", "Zhang"
  B: Family Name (string) - e.g., "Smith", "Nguyen"
  C: Country (string) - e.g., "China", "Mexico", "Russia"
  D: Room Type (STRING) - values: "Spa Executive", "Grand Lit", "Standard Single", 
                             "LOFT Suite", "Suite", "Standard Double", 
                             "Junior Suite", "Superior Double"
  E: Days Rented (numeric) - integer values 1-18
  F: Season (string) - values: "low", "mid", "high"
  G: Price (numeric) - in DKK, e.g., 2577, 3360, 6420

Critical Observations:
  ✓ Season column EXISTS with actual values
  ✗ NO check-in/check-out date columns
  ✗ NO booking date/timestamp columns
  ✓ All values are present (no nulls in sample)
  ✓ Room Type is STRING (not numeric) - contains actual room type names
  ✓ 8 distinct room types found in dataset
```

**CORRECTION**: Previous version incorrectly stated "Room Type (numeric) - maps to 8 room types (1-8)". **Actual data**: Room Type column contains STRING values with the actual room type names. The eight room types match the assignment specification (specs/Specify Section 6.1):
1. Standard Single
2. Standard Double
3. Superior Double
4. Grand Lit
5. Junior Suite
6. Suite
7. LOFT Suite
8. Spa Executive

**Findings - Drinks Dataset** (`Datasets/drinks_menu_with_sales.xlsx`):
```
Total Rows: 31 (1 header + 30 data records)
Columns:
  A: Drink Name (string) - e.g., "Margarita", "Espresso"
  B: Category (string) - values: "Cocktail", "Coffee"
  C: Price (DKK) (numeric) - in DKK, e.g., 85, 45, 75
  D: Units Sold (numeric) - integer values, e.g., 150, 200, 75

Critical Observations:
  ✗ NO employee name/attribution column
  ✗ NO sales date/timestamp column
  ✓ Category values: "Cocktail" (20 records) or "Coffee" (10 records)
  ✓ 30 total drink records
```

**Decision**: 
- Import all columns exactly as provided
- No date generation or fabrication
- No employee attribution fabrication
- **Room Type**: Store as STRING, preserving the exact names from source

**Rationale**: Preserves Principle VI (Data Analytics Accuracy) - no invented data

**Alternatives considered**: None - data verification is definitive

---

### TR-03: Existing Database Schema

**Question**: What is the current database schema and how should historical data be stored?

**Findings - Existing Schema** (`mysql/init.sql`):
```sql
Database: hotel_db
Table: bookings
  Columns: id (INT AI PK), guest_name (VARCHAR 100), email (VARCHAR 100),
           room_number (INT), check_in (DATE), check_out (DATE),
           status (ENUM), created_at (TIMESTAMP)
  Indexes: room_number, status, (check_in, check_out)
```

**Findings - Data Differences**:
```
Historical Hotel Data vs. Operational Bookings:
  ✓ Both have guest information
  ✗ Historical: No check_in/check_out dates
  ✗ Historical: Has Season (low/mid/high) as STRING
  ✗ Historical: Has Price per stay (not per night)
  ✗ Historical: Has Days Rented
  ✗ Historical: Room Type is STRING (not INT room_number)
  ✗ Historical: No status field
  ✗ Historical: No email field
  ✓ Historical: Separate guest name into first_name and family_name

Historical Drinks Data:
  ✗ No equivalent in existing schema
  ✗ No employee attribution
  ✗ No date fields
```

**Decision**: Create separate tables `historical_bookings` and `historical_drinks`

**Rationale**: 
- Preserves Principle VII (Booking Management Preservation) - no changes to existing table
- Allows different schema for historical data
- Clear separation between operational and historical data
- Enables historical-specific metadata (source_file, import_batch, import_timestamp)

**Alternatives considered**:
- Add to existing bookings table: Would require nullable columns; violates separation
- JSON column approach: Less queryable; harder to validate

---

### TR-04: Existing API Structure

**Question**: How is the existing API structured and where should import endpoints be added?

**Findings** (`backend/src/app.js`):
```javascript
// Current structure:
app.use('/api', bookingRoutes);  // All booking endpoints
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Current endpoints (from openapi.yaml):
GET  /api/bookings         - List all bookings
POST /api/bookings         - Create booking
GET  /api/bookings/{id}    - Get booking by ID
PUT  /api/bookings/{id}    - Update booking
DEL  /api/bookings/{id}    - Delete booking
```

**Decision**: Add new route file `backend/src/routes/import.js` mounted at `/api/import`

**Proposed Endpoints**:
```
POST /api/import/hotel          - Import hotel historical data (file upload)
POST /api/import/drinks         - Import drinks historical data (file upload)
GET  /api/import/hotel          - List all historical bookings (with filtering)
GET  /api/import/hotel/{id}     - Get specific historical booking
GET  /api/import/drinks         - List all historical drink sales (with filtering)
GET  /api/import/drinks/{id}    - Get specific historical drink sale
GET  /api/import/status         - Get import status/report
```

**Rationale**: 
- Maintains existing `/api/bookings` separation
- Clear namespace for import operations
- Consistent with Principle III (API Contract Integrity)

**Alternatives considered**:
- Add to existing routes: Would violate single responsibility
- Different base path: Less consistent with existing structure

---

### TR-05: Docker Compose Configuration

**Question**: What is the current Docker Compose setup?

**Findings**:
```
File: Docker-compose.yml (note: mixed case filename exists)
Status: EXISTS and CONFIGURED

Existing Services:
  mysql: MySQL 8.0 with initialization from mysql/init.sql
    - Health check configured
    - Volume for data persistence
    - Port 3306 exposed
  
  backend: Node.js backend
    - Builds from backend/Dockerfile
    - Depends on mysql health
    - Environment variables for MySQL connection
    - Port 3000 exposed
    - Health check configured
  
  frontend: nginx serving static files
    - Builds from frontend/Dockerfile
    - Port 80 exposed
    - Depends on backend health

Volumes:
  hotel_mysql_data: Persistent MySQL data

Configuration Notes:
  - mysql service uses mysql/init.sql for initialization (01-init.sql via volume mount)
  - Backend connects to mysql service by hostname
  - All services have health checks
  - No docker-compose.yml (lowercase) - only Docker-compose.yml exists
```

**Decision**: Use existing Docker-compose.yml WITHOUT MODIFICATION

**Rationale**: 
- Principle V (Containerization Requirement) already satisfied
- All services properly configured
- Health checks ensure proper startup ordering
- No changes needed for import feature (import is part of backend service)

**Important**: Do NOT create duplicate docker-compose.yml or modify existing configuration. The import functionality will be added to the existing backend container.

---

### TR-06: OpenAPI/Swagger Setup

**Question**: How is OpenAPI currently configured and how should import endpoints be documented?

**Findings** (`backend/openapi.yaml`):
```yaml
OpenAPI: 3.0.3
Info: Hotel Kong Arthur - Booking API
Servers: 
  - http://localhost:3000/api (Local)
  - http://backend:3000/api (Docker)
Tags: [bookings]
Paths: /bookings (GET, POST), /bookings/{id} (GET, PUT, DELETE)
Components: Booking, BookingInput, Error schemas
```

**Decision**: Extend existing openapi.yaml with import endpoints and schemas

**New Components**:
```yaml
schemas:
  HistoricalBooking:
    type: object
    properties:
      id, first_name, family_name, country, room_type (STRING), 
      days_rented, season, price, source_file, import_batch, 
      import_timestamp
  
  HistoricalDrink:
    type: object
    properties:
      id, drink_name, category, price_dkk, units_sold, 
      source_file, import_batch, import_timestamp
  
  ImportReport:
    type: object
    properties:
      file_name, file_hash, total_records, imported_count, 
      rejected_count, duplicate_count, errors, timestamp
  
  ImportBatch:
    type: object
    properties:
      batch_id, file_name, file_hash, file_size, status, 
      started_at, completed_at, total_records, success_count, 
      error_count
```

**Rationale**: Principle III (API Contract Integrity) - consistent documentation

---

### TR-07: Frontend Integration

**Question**: How is the frontend currently structured?

**Findings** (`frontend/index.html`):
```
File: frontend/index.html (13,756 bytes)
Content: Single HTML file with embedded CSS and JavaScript
Functionality: Booking CRUD interface
Dependencies: Fetches from /api/bookings endpoints

Docker: nginx:alpine serving index.html
```

**Decision**: NO frontend changes for Historical Data Import

**Rationale**: 
- Import is a backend/data operation
- No user-facing import UI required by spec
- Can be triggered via API calls or CLI
- Principle VII - preserve existing frontend functionality

**Alternatives considered**:
- Add import UI: Not required by spec; adds unnecessary complexity

---

### TR-08: Error Handling Patterns

**Question**: How are errors currently handled in the backend?

**Findings** (`backend/src/app.js` and `bookingService.js`):
```javascript
// app.js error handling:
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Intern serverfejl', detail: err.message });
});

// bookingService.js validation:
if (new Date(checkOut) <= new Date(checkIn)) {
  const error = new Error('check_out skal være efter check_in');
  error.status = 400;
  throw error;
}

// routes/bookings.js error propagation:
try {
  const booking = await createBooking(req.body);
  res.status(201).json(booking);
} catch (err) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  next(err);
}
```

**Decision**: Follow existing pattern for import service:
- Validation errors: throw Error with status code (400 for client errors)
- Database errors: let propagate to global handler (500)
- Custom error format: `{ error: string, detail?: string }`

**Rationale**: Maintains consistency; Principle IX (Code Quality Standard)

---

### TR-09: Testing Patterns

**Question**: What testing approach is currently used?

**Findings**:
```
backend/package.json: No test scripts configured
Existing tests: None found in repository
Constitution: Principle IX - "Suitable tests MUST be added for all new and changed functionality"
Group Decision: D3=A makes tests mandatory
```

**Decision**: Implement Node.js native test runner

**Test Structure**:
```
backend/tests/
├── unit/
│   └── importService.test.js    # Unit tests for validation, hashing
├── integration/
│   ├── import.test.js           # Integration tests with test database
│   └── duplicateDetection.test.js # Duplicate detection scenarios
└── fixtures/
    ├── test_hotel_data.xlsx     # Test data with known content
    └── test_drinks_data.xlsx    # Test data with known content
```

**Rationale**: 
- Native test runner (Node.js 18+) - no additional dependencies
- Follows Principle IX - tests are mandatory
- Separation of unit and integration tests

---

### TR-10: Dependencies Analysis

**Question**: What are the existing dependencies and what new ones are needed?

**Findings** (`backend/package.json`):
```json
Existing:
  express: ^4.18.2
  mysql2: ^3.6.0
  cors: ^2.8.5
  swagger-ui-express: ^5.0.0
  yamljs: ^0.3.0
  dotenv: ^16.3.1
  nodemon: ^3.0.1 (dev)
```

**Decision - New Dependencies**:
```json
Production:
  xlsx: ^0.18.5          # Excel file parsing
  validator: ^13.11.0     # Data validation (optional, can use native validation)
  express-fileupload: ^1.4.0  # File upload middleware (optional, can use multer)
```

**Alternative Decision - Minimal Dependencies**:
Use only `xlsx` for Excel parsing and implement validation natively:
```json
Production:
  xlsx: ^0.18.5          # Excel file parsing (required)
```

**Rationale**: 
- Minimal additions to existing stack
- No conflicts with existing dependencies
- `xlsx` is sufficient for read-only Excel parsing
- Native validation reduces dependencies

**Alternatives considered**: See individual research items above

---

## Constitution Compliance Verification

All research decisions have been verified against the Hotel Kong Arthur Constitution:

- ✅ **Principle I**: All assignment requirements traceable; contradictions documented
- ✅ **Principle II**: Three-layer architecture maintained
- ✅ **Principle III**: API contract integrity preserved
- ✅ **Principle IV**: MySQL used; schema follows conventions
- ✅ **Principle V**: Docker Compose verified as existing and functional
- ✅ **Principle VI**: Historical data importable; analytics dependencies documented
- ✅ **Principle VII**: Existing booking functionality untouched
- ✅ **Principle VIII**: No new technologies introduced
- ✅ **Principle IX**: Code quality standards applied
- ✅ **Principle X**: Existing code preserved
- ✅ **Principle XI**: Documentation consistency maintained

---

## Blocked Items (Not Resolvable by Research)

The following items remain **blocked pending group approval** and cannot be resolved by technical research:

### BL-01: Season Boundary Definitions
**Status**: ⏳ Blocked
**Required for**: Calendar-based season calculations on new bookings
**Research finding**: Season labels exist in historical data as strings ("low", "mid", "high")
**No technical solution**: Requires business decision on date ranges

### BL-02: Helene Christine Attribution Method
**Status**: ⏳ Blocked  
**Required for**: FR-07 (calculate sales attributed to Helene Christine)
**Research finding**: Drinks dataset contains NO employee field
**No technical solution**: Requires business decision on demonstration data approach

### BL-03: Synthetic Date Generation Policy
**Status**: ⏳ Blocked
**Required for**: Annual revenue calculations (FR-05, FR-09, US-09)
**Research finding**: Historical records lack date fields
**No technical solution**: Requires business decision on whether to generate synthetic dates

---

## Summary

**Total Research Items**: 10
**Resolved**: 10 (with 1 correction)
**Blocked by Group Decisions**: 3 (BL-01, BL-02, BL-03)

**Conclusion**: All technical unknowns have been resolved. **CRITICAL CORRECTION**: Room Type is STRING, not numeric. All planning documents must be updated to reflect this. Remaining blocks are business/requirement decisions that must be made by the group. Implementation can proceed for Phase A (import functionality) without these decisions.

---

*This research document was generated and corrected during planning on 2026-10-28*
