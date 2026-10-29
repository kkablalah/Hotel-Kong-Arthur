# Implementation Tasks: Historical Data Import

**Feature**: Historical Data Import | **Date**: 2026-10-28 | **Spec**: Feature/spec.md | **Plan**: Feature/plan.md

**Status**: Ready for Implementation (Phases 1-5 unblocked; Phase 6 blocked pending group approval)

**Constitution**: .specify/memory/constitution.md (v1.0.0)

**CORRECTION LOG**:
- **2026-10-28**: Corrected room_type from INT to VARCHAR(50) based on actual Excel file inspection. Changed duplicate detection strategy from row-level hash to file-level batch tracking with import_batches table. Reorganized tasks for proper incremental testing. Added comprehensive test scenarios.

---

## Overview

This document provides the complete, ordered implementation task list for the Historical Data Import feature. Tasks are organized into phases that align with the project's Spec Kit workflow and Constitution principles. The task list maintains strict separation between unblocked import functionality and blocked analytics integration.

**Key Principles Applied:**
- Principle II: Three-Layer Architecture (routes/services/db separation)
- Principle III: API Contract Integrity (OpenAPI documentation)
- Principle IV: Database Standard (MySQL, version-controlled schema)
- Principle V: Containerization (Docker Compose verified as existing)
- Principle VI: Data Analytics Accuracy (no fabricated data, **CORRECTED: room_type is STRING**)
- Principle VII: Booking Management Preservation (no changes to existing booking system)
- Principle IX: Code Quality Standard (validation, error handling, tests)
- Principle XI: Documentation Consistency

---

## Task Summary

| **Phase** | **Name** | **Task Count** | **Status** | **Dependencies** |
|----------|----------|---------------|------------|------------------|
| 1 | Setup & Infrastructure | 3 | Ready | None |
| 2 | Database Foundation | 4 | Ready | Phase 1 |
| 3 | Service Layer Core | 6 | Ready | Phase 2 |
| 4 | Service Layer Testing | 5 | Ready | Phase 3 |
| 5 | API Endpoints | 5 | Ready | Phase 3 |
| 6 | API Documentation | 4 | Ready | Phase 5 |
| 7 | Integration Testing | 5 | Ready | Phase 5 |
| 8 | Documentation & Polish | 4 | Ready | Phase 7 |
| 9 | Analytics Integration (BLOCKED) | 5 | Blocked | BL-01, BL-02, BL-03 |

**Total Tasks**: 41 (36 ready, 5 blocked)

---

## Key Implementation Decisions

### 1. Room Type Representation (CORRECTED)
- **Previous**: room_type as INT (1-8) based on erroneous research
- **Corrected**: room_type as VARCHAR(50) storing actual names from source
- **Values**: "Standard Single", "Standard Double", "Superior Double", "Grand Lit", "Junior Suite", "Suite", "LOFT Suite", "Spa Executive"
- **All tasks updated** to reflect STRING type

### 2. Duplicate Detection Strategy (CORRECTED)
- **Previous**: Row-level SHA-256 hash (would incorrectly flag identical rows within file)
- **Corrected**: File-level batch tracking with import_batches table
- **Implementation**: SHA-256 hash of entire file content stored in import_batches table
- **Benefits**:
  - Prevents re-importing same file
  - Detects modified files (same name, different content)
  - Preserves legitimate identical rows (different source_row_number)
  - Supports safe retry on failure

### 3. Database Schema Changes
- Added **import_batches** table for batch tracking
- Added **import_batch** field to historical_bookings and historical_drinks
- Added **source_row_number** field to historical_bookings and historical_drinks
- Changed **room_type** from INT to VARCHAR(50)

---

## Phase 1: Setup & Infrastructure

**Goal**: Establish project foundation for historical data import

**Independent Test Criteria**: Dependencies installed, file structure ready, Docker Compose verified

- [ ] T001 Create db/import.sql with import_batches, historical_bookings, and historical_drinks tables per corrected data-model.md (room_type VARCHAR(50), import_batch VARCHAR(64), source_row_number INT)
- [ ] T002 Update backend/package.json with xlsx dependency (only xlsx required; native validation)
- [ ] T003 Verify existing Docker-compose.yml (mixed case) is complete and functional - DO NOT MODIFY

**Dependencies**: None

---

## Phase 2: Database Foundation

**Goal**: Create database schema for historical data with proper indexes and constraints

**Independent Test Criteria**: Database tables created, indexes verified, schema matches data-model.md

- [ ] T004 Execute db/import.sql to create import_batches table with all fields (batch_id, file_name, file_size, file_hash, status, total_records, imported_count, rejected_count, duplicate_count, started_at, completed_at, error_message) and indexes (uk_file_hash UNIQUE, idx_file_name, idx_status)
- [ ] T005 Execute db/import.sql to create historical_bookings table with all fields including **room_type VARCHAR(50)** (CORRECTED), source_row_number, import_batch
- [ ] T006 Execute db/import.sql to create historical_drinks table with all fields including source_row_number, import_batch
- [ ] T007 Verify table creation, index structure, and field types in MySQL database

**Dependencies**: Phase 1

---

## Phase 3: Service Layer Core

**Goal**: Implement business logic for parsing, validating, and importing Excel files. This can be tested INDEPENDENTLY of HTTP routes.

**Independent Test Criteria**: Excel files parsed correctly, validation logic works, file hash calculation functional

- [ ] T008 Create backend/src/services/importService.js with file parsing using xlsx package
- [ ] T009 Implement calculateFileHash(filePath) function in importService.js returning SHA-256 of file content
- [ ] T010 Implement validateHistoricalBooking() in importService.js with all constraints: first_name required string 1-100, family_name required string 1-100, country optional string 1-100, **room_type optional string 1-50** (CORRECTED), days_rented optional int >=1, season optional enum low/mid/high, price optional decimal >=0
- [ ] T011 Implement validateHistoricalDrink() in importService.js with all constraints: drink_name required string 1-100, category required enum Cocktail/Coffee, price_dkk optional decimal >=0, units_sold optional int >=0
- [ ] T012 Implement extractRecordsFromExcel(filePath, expectedColumns) in importService.js returning array of record objects with source_row_number
- [ ] T013 Implement checkBatchDuplicate(fileHash) in importService.js querying import_batches table

**Dependencies**: Phase 2

**Testing**: Can be unit tested independently using test files (see Phase 4)

---

## Phase 4: Service Layer Testing

**Goal**: Test service layer logic before API integration

**Independent Test Criteria**: All service functions work correctly with test data

- [ ] T014 Create backend/tests/unit/importService.test.js with tests for validateHistoricalBooking() covering all constraints (required fields, string lengths, numeric ranges, enum values)
- [ ] T015 Create tests for validateHistoricalDrink() covering all constraints
- [ ] T016 Create tests for calculateFileHash() verifying consistent hash for same file
- [ ] T017 Create tests for extractRecordsFromExcel() verifying correct column mapping and source_row_number assignment
- [ ] T018 Create tests for checkBatchDuplicate() with mock database responses

**Dependencies**: Phase 3

**Note**: These tests can run independently without API or full database setup (use mocks)

---

## Phase 5: API Endpoints

**Goal**: Create REST API endpoints for data import and retrieval. Implemented AFTER service layer is testable.

**Independent Test Criteria**: Endpoints respond, import succeeds via API, data retrievable

- [ ] T019 Mount import routes in backend/src/app.js at /api/import with express-fileupload middleware
- [ ] T020 Create POST /api/import/hotel endpoint in backend/src/routes/import.js with file upload, batch check, validation, transaction, and report generation
- [ ] T021 Create POST /api/import/drinks endpoint in backend/src/routes/import.js (same pattern as hotel)
- [ ] T022 Create GET /api/import/hotel endpoint with filtering (country, season, room_type, batch_id, limit, offset)
- [ ] T023 Create GET /api/import/drinks endpoint with filtering (category, batch_id, limit, offset)

**Dependencies**: Phase 3 (service layer must be complete and tested)

---

## Phase 6: API Documentation

**Goal**: Maintain API contract integrity per Principle III

**Independent Test Criteria**: OpenAPI documentation accessible via Swagger UI, contracts match implementation

- [ ] T024 Extend backend/openapi.yaml with POST /api/import/hotel and POST /api/import/drinks endpoints per Feature/contracts/api.yaml
- [ ] T025 Extend backend/openapi.yaml with GET /api/import/hotel and GET /api/import/drinks endpoints
- [ ] T026 Update backend/openapi.yaml with **corrected** HistoricalBooking schema (room_type as string, source_row_number, import_batch)
- [ ] T027 Update backend/openapi.yaml with **corrected** HistoricalDrink schema (source_row_number, import_batch)
- [ ] T028 Add ImportBatch schema to backend/openapi.yaml
- [ ] T029 Verify Swagger UI at /api-docs displays all new endpoints correctly

**Dependencies**: Phase 5

---

## Phase 7: Integration Testing

**Goal**: Test complete import workflow end-to-end with actual database

**Independent Test Criteria**: Full import workflow works, transactions handled, errors handled

- [ ] T030 Create backend/tests/integration/import.test.js with test for successful hotel import (1001 records)
- [ ] T031 Create integration test for successful drinks import (30 records)
- [ ] T032 Create integration test for duplicate file detection (same file rejected with 409 Conflict)
- [ ] T033 Create integration test for modified file detection (same name, different content = new import)
- [ ] T034 Create integration test for transaction rollback (simulate DB failure, verify no partial import)

**Dependencies**: Phase 5, Phase 6

---

## Phase 8: Comprehensive Testing

**Goal**: Test all edge cases and error conditions

**Independent Test Criteria**: All test scenarios pass

- [ ] T035 Create test for invalid rows (validation errors with proper error messages and source_row_number)
- [ ] T036 Create test for missing file (400 Bad Request)
- [ ] T037 Create test for non-Excel file (400 Bad Request)
- [ ] T038 Create test for legitimate identical rows within file (all preserved with different source_row_number)
- [ ] T039 Verify existing booking CRUD operations still work (Principle VII regression test)

**Dependencies**: Phase 7

---

## Phase 9: Documentation & Polish

**Goal**: Complete documentation and final verification

**Independent Test Criteria**: Documentation complete, system ready for use

- [ ] T040 Update README.md with import instructions and usage examples
- [ ] T041 Create import data dictionary documentation in docs/ directory (field mappings, data sources, limitations)
- [ ] T042 Add data source identification documentation (source_file, import_batch, source_row_number fields)
- [ ] T043 Run complete end-to-end verification per quickstart.md scenarios

**Dependencies**: Phase 8

---

## Phase 10: Analytics Integration (BLOCKED - Pending Group Approval)

**Goal**: Implement analytics features that depend on blocked decisions

**Status**: BLOCKED - Cannot proceed until BL-01, BL-02, BL-03 are resolved

**Blocked By**:
- BL-01: Season Boundary Definitions (affects T044)
- BL-02: Helene Christine Attribution Method (affects T045, T046)
- BL-03: Synthetic Date Generation Policy (affects T047, T048)

- [ ] T044 [BLOCKED by BL-01] Implement GET /api/import/hotel/revenue-by-season endpoint with season-based calculations using calendar boundaries
- [ ] T045 [BLOCKED by BL-02] Implement GET /api/import/drinks/helene-christine endpoint with employee attribution per approved method
- [ ] T046 [BLOCKED by BL-02] Create demonstration data table for Helene Christine sales with explicit labeling
- [ ] T047 [BLOCKED by BL-03] Implement GET /api/import/hotel/annual-revenue endpoint with date generation per approved policy
- [ ] T048 [BLOCKED by BL-03] Add date fields or implement synthetic date assignment for annual reporting

---

## Phase 11: Outstanding Assignment Requirements

**Goal**: Track wider assignment requirements outside this feature scope

**Status**: OUTSTANDING - Part of wider assignment, not in this feature scope

- [ ] T049 OUTSTANDING: Update Tableau dashboard to connect to historical booking endpoints
- [ ] T050 OUTSTANDING: Update Tableau dashboard to connect to historical drinks endpoints
- [ ] T051 OUTSTANDING: Create Tableau visualizations for revenue by season (BLOCKED by BL-01)
- [ ] T052 OUTSTANDING: Create Tableau visualizations for Helene Christine sales (BLOCKED by BL-02)
- [ ] T053 OUTSTANDING: Create Tableau visualizations for annual revenue (BLOCKED by BL-03)
- [ ] T054 OUTSTANDING: Complete README.md with architecture diagram per Principle XI
- [ ] T055 OUTSTANDING: Complete CONTRIBUTE.md with development workflow

---

## Dependencies Matrix

### Task Dependencies

```
Phase 1: Setup & Infrastructure
  └── No dependencies (can start immediately)

Phase 2: Database Foundation
  └── Depends on: Phase 1

Phase 3: Service Layer Core
  └── Depends on: Phase 2

Phase 4: Service Layer Testing
  └── Depends on: Phase 3
  └── Can run independently with mocks

Phase 5: API Endpoints
  └── Depends on: Phase 3 (service layer complete)
  └── Service layer MUST be testable before API integration

Phase 6: API Documentation
  └── Depends on: Phase 5

Phase 7: Integration Testing
  └── Depends on: Phase 5, Phase 6

Phase 8: Comprehensive Testing
  └── Depends on: Phase 7

Phase 9: Documentation & Polish
  └── Depends on: Phase 8

Phase 10: Analytics Integration (BLOCKED)
  ├── T044 depends on: BL-01 approval
  ├── T045, T046 depend on: BL-02 approval
  └── T047, T048 depend on: BL-03 approval

Phase 11: Outstanding Requirements
  └── Outside this feature scope
```

### File Dependencies

```
db/import.sql
  ├── Created by: T001
  ├── Executed by: T004, T005, T006
  └── Verified by: T007

backend/package.json
  ├── Modified by: T002
  └── Depends on: Existing file

backend/src/services/importService.js (NEW)
  ├── Created by: T008-T013
  ├── Tested by: T014-T018
  └── Used by: T020, T021

backend/src/routes/import.js (NEW)
  ├── Created by: T019-T023
  ├── Mounted by: T019
  └── Depends on: importService.js (T008-T013)

backend/src/app.js
  ├── Modified by: T019 (mount import routes)
  └── Depends on: Existing file

backend/openapi.yaml
  ├── Modified by: T024-T029
  └── Depends on: Existing file

backend/tests/unit/importService.test.js (NEW)
  ├── Created by: T014-T018
  └── Depends on: importService.js

backend/tests/integration/import.test.js (NEW)
  ├── Created by: T030-T034
  └── Depends on: Full integration (Phase 5+)

backend/tests/integration/validation.test.js (NEW)
  ├── Created by: T035-T039
  └── Depends on: Full integration
```

---

## Duplicate Detection Policy (CORRECTED)

**Requirement**: Design an import strategy that:
- Prevents accidentally importing the same file twice
- Detects a modified file, including when the filename stays the same
- Preserves legitimate identical rows within a single file
- Supports a safe retry if an import fails
- Explains how partially completed imports are avoided

### Selected Strategy: File-Level Batch Tracking

**Approach**: Track import batches by file content hash in a dedicated import_batches table.

#### Implementation:

1. **File Hash Calculation**:
   - Calculate SHA-256 hash of the entire source file content
   - This hash uniquely identifies the file's content

2. **Batch Tracking**:
   - Store hash in `import_batches` table before processing
   - Check for existing batch with same hash
   - If found with status='completed': Reject with "File already imported"
   - If found with status='failed': Allow retry
   - If not found: Proceed with import

3. **Row-Level Tracking**:
   - Each record includes `source_row_number` (1-indexed, excludes header)
   - Each record includes `import_batch` (file hash)
   - This allows identifying which file and row each record came from

4. **Transaction Safety**:
   - Entire import runs in a single database transaction
   - On success: Commit and update import_batches status='completed'
   - On failure: Rollback and update import_batches status='failed'
   - No partial imports possible

5. **Preserving Identical Rows**:
   - Two identical rows within a file have the same field values
   - But they have different `source_row_number` values
   - Therefore, they are NOT treated as duplicates
   - Both rows are imported successfully

#### Why Previous Approach Was Wrong:
- Row-level SHA-256 hash would produce the same hash for identical rows
- This would incorrectly flag the second occurrence as a duplicate
- Legitimate data (two guests with same name in same room) would be lost

#### Trade-offs:
- ✅ Prevents duplicate file imports
- ✅ Detects modified files (same name, different content)
- ✅ Preserves legitimate identical rows within file
- ✅ Supports safe retry on failure
- ✅ Avoids partial imports via transactions
- ⚠️ Requires additional table (import_batches)
- ⚠️ Requires additional fields (source_row_number, import_batch)

---

## Room Type Preservation (CORRECTED)

**Requirement**: Check the actual Excel columns and values. Preserve room type names correctly; do not assume numeric room-type IDs exist in the source.

**Verified Data**:
The hotel dataset's Room Type column (column D) contains **STRING values** with the actual room type names:
- Standard Single
- Standard Double
- Superior Double
- Grand Lit
- Junior Suite
- Suite
- LOFT Suite
- Spa Executive

**Implementation**:
- Database field: `room_type VARCHAR(50)` (CORRECTED from INT)
- No conversion or mapping during import
- Preserve exact string values from source
- No numeric codes invented

**Why This Matters**:
- The research.md initially claimed room_type was numeric (1-8)
- Direct inspection of Excel file revealed this was incorrect
- Using INT would truncate or lose the actual room type names
- All documentation updated to reflect STRING type

---

## Data Source Identification

**Requirement**: Historical data must be clearly identified as such in the system

**Implementation**:
- `source_file` field: Contains the filename of the source Excel file
- `import_batch` field: SHA-256 hash of the source file content
- `source_row_number` field: Row number in the source file (1-indexed, excludes header)
- `import_timestamp` field: When the record was imported
- All historical data goes into separate tables (historical_bookings, historical_drinks)
- Operational bookings remain in the existing bookings table (per Principle VII)
- No mixing of historical and operational data

---

## Docker and MySQL Verification

**Verified**:
- ✅ `Docker-compose.yml` exists (note: mixed case filename)
- ✅ Contains properly configured services: mysql, backend, frontend
- ✅ MySQL service uses `mysql/init.sql` for initialization
- ✅ Backend depends on MySQL health check
- ✅ All services have health checks
- ✅ No `docker-compose.yml` (lowercase) exists - DO NOT create duplicate

**Decision**: Use existing Docker-compose.yml WITHOUT MODIFICATION
- Import functionality will be added to existing backend container
- No Docker configuration changes needed
- Existing MySQL initialization preserved

---

## API Scope Verification

**Verified**: All endpoints in contracts/api.yaml are necessary:
- POST /api/import/hotel - Import hotel data (required)
- POST /api/import/drinks - Import drinks data (required)
- GET /api/import/hotel - Query hotel data (required)
- GET /api/import/hotel/{id} - Query specific hotel record (required)
- GET /api/import/drinks - Query drinks data (required)
- GET /api/import/drinks/{id} - Query specific drink record (required)
- GET /api/import/status - Query import status (required)
- GET /api/import/batches - List import batches (required for duplicate detection)

**Blocked Endpoints**:
- GET /api/import/hotel/revenue-by-season - BLOCKED by BL-01
- GET /api/import/drinks/helene-christine - BLOCKED by BL-02
- GET /api/import/hotel/annual-revenue - BLOCKED by BL-03

**All endpoints documented in OpenAPI contract**

---

## Testing Coverage

### Test Scenarios Covered:
- ✅ Invalid rows and validation errors (T035)
- ✅ Missing files (T036)
- ✅ Non-Excel files (T037)
- ✅ Re-importing the same file (T032)
- ✅ Importing a modified file under the same filename (T033)
- ✅ Legitimate identical rows within a file (T038)
- ✅ Database failures and transaction rollback (T034)
- ✅ Interrupted imports and safe retries (handled by transaction rollback)
- ✅ Accurate import reports (included in all import tests)
- ✅ Regression testing for existing booking CRUD (T039)

---

## Blocked Items Status

### BL-01: Season Boundary Definitions
- **Status**: ⏳ BLOCKED - Requires group approval
- **Affects**: T044 (revenue-by-season endpoint)
- **Decision Required**: Exact calendar date boundaries for low, mid, and high seasons
- **Options**: See spec.md Section 11.2
- **Recommendation**: Option B (low=Jan-Apr, mid=May-Jun, high=Jul-Sep with Christmas as high)

### BL-02: Helene Christine Attribution Method
- **Status**: ⏳ BLOCKED - Requires group approval
- **Affects**: T045, T046 (Helene Christine endpoints and data)
- **Decision Required**: How to satisfy FR-07 when source data lacks employee attribution
- **Options**: See spec.md Section 11.2
- **Recommendation**: Option A (explicit demonstration data with clear labeling)

### BL-03: Synthetic Date Generation Policy
- **Status**: ⏳ BLOCKED - Requires group approval
- **Affects**: T047, T048 (annual revenue calculations)
- **Decision Required**: Whether to generate synthetic dates for historical records
- **Options**: See spec.md Section 11.2
- **Recommendation**: Option B (generate dates within specific year with disclaimers)

---

## Execution Order

### Immediate Start (No Dependencies)
**Can start immediately**:
- Phase 1: T001, T002, T003

### After Phase 1
**Can start**:
- Phase 2: T004, T005, T006, T007

### After Phase 2
**Can start**:
- Phase 3: T008-T013 (Service layer core)
- Phase 4: T014-T018 (Service layer testing - can start as soon as T008-T013 are defined)

### After Phase 3
**Can start**:
- Phase 5: T019-T023 (API endpoints - requires service layer)

### After Phase 5
**Can start**:
- Phase 6: T024-T029 (API documentation)
- Phase 7: T030-T034 (Integration testing)
- Phase 8: T035-T039 (Comprehensive testing)

### After Phase 8
**Can start**:
- Phase 9: T040-T043 (Documentation)

### Blocked (Pending Group Approval)
**Cannot start until approval**:
- Phase 10: T044 (BL-01), T045-T046 (BL-02), T047-T048 (BL-03)

### Outstanding (Wider Assignment)
**Outside this feature scope**:
- Phase 11: T049-T055

---

## Parallel Execution Opportunities

**Phase 3 (Service Layer Core)**: All tasks independent
- T008, T009, T010, T011, T012, T013 can run in parallel

**Phase 4 (Service Testing)**: All tests independent
- T014, T015, T016, T017, T018 can run in parallel

**Phase 5 (API Endpoints)**: All endpoints independent
- T019, T020, T021, T022, T023 can run in parallel

**Phase 6 (Documentation)**: All updates independent
- T024-T029 can run in parallel

**Phase 7 (Integration Testing)**: Tests can run in parallel
- T030-T034 can run in parallel

**Phase 8 (Comprehensive Testing)**: Tests can run in parallel
- T035-T039 can run in parallel

**Phase 9 (Documentation)**: All tasks independent
- T040-T043 can run in parallel

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)
**MVP includes**: Phases 1-9 (T001-T043) - Complete import functionality with comprehensive testing

**MVP enables**:
- Import historical hotel data (1001 records) with STRING room types
- Import historical drinks data (30 records)
- Prevent duplicate file imports
- Detect modified files
- Preserve legitimate identical rows
- Query imported data through API
- Verify data integrity
- All existing booking functionality preserved
- Comprehensive test coverage

**MVP excludes**:
- Season-based analytics (blocked by BL-01)
- Employee attribution (blocked by BL-02)
- Annual reporting (blocked by BL-03)
- Tableau integration (outstanding)

### Incremental Delivery

1. **Increment 1** (T001-T007): Setup + Database = Foundation ready
2. **Increment 2** (T008-T013): Service layer = Core logic ready
3. **Increment 3** (T014-T018): Service testing = Core logic verified
4. **Increment 4** (T019-T023): API endpoints = Import functionality ready
5. **Increment 5** (T024-T029): API documentation = Contract documented
6. **Increment 6** (T030-T039): Integration + comprehensive testing = Quality assured
7. **Increment 7** (T040-T043): Documentation = Production ready
8. **Increment 8** (T044-T048): Analytics = BLOCKED
9. **Increment 9** (T049-T055): Full assignment = OUTSTANDING

---

## Constitution Compliance Checklist

| **Principle** | **Tasks** | **Status** |
|--------------|----------|------------|
| I. Assignment Compliance | All tasks traceable to spec.md requirements | ✅ |
| II. Three-Layer Architecture | T008-T013 (services), T019-T023 (routes), T004-T007 (db) | ✅ |
| III. API Contract Integrity | T024-T029 (OpenAPI), T019-T023 (endpoints) | ✅ |
| IV. Database Standard | T004-T007 (MySQL tables), db/import.sql | ✅ |
| V. Containerization | T003 (Docker Compose verification - no changes) | ✅ |
| VI. Data Analytics Accuracy | No fabricated data, all source values preserved, **room_type corrected to STRING** | ✅ |
| VII. Booking Management Preservation | T039 (existing functionality verification) | ✅ |
| VIII. Technology Flexibility | No new languages, existing Node.js stack | ✅ |
| IX. Code Quality Standard | T008-T013 (validation), T014-T039 (tests) | ✅ |
| X. Code Evolution Policy | No changes to existing booking code | ✅ |
| XI. Documentation Consistency | T040-T043 (documentation updates) | ✅ |

---

## Task List Validation

**Format Compliance**: All tasks follow the required checklist format:
- ✅ Checkbox format: `- [ ]` 
- ✅ Task IDs: Sequential (T001-T055)
- ✅ Parallel markers: [P] not used (tasks organized by dependency)
- ✅ File paths: Specified for all implementation tasks

**Content Compliance**:
- ✅ All constraints from data-model.md quoted in validation tasks
- ✅ All blocked items clearly identified
- ✅ All wider assignment requirements identified as OUTSTANDING
- ✅ Duplicate detection strategy documented and corrected
- ✅ Room type preservation verified and corrected

---

## Files Changed

The following planning documents were updated to reflect corrections:

1. **Feature/research.md** - Corrected TR-02: Room Type is STRING, not numeric
2. **Feature/data-model.md** - Changed room_type from INT to VARCHAR(50), added import_batches table, added import_batch and source_row_number fields
3. **Feature/contracts/api.yaml** - Updated schemas to reflect STRING room_type, added ImportBatch schema, added import_batch and source_row_number fields
4. **Feature/quickstart.md** - Added test scenarios for duplicate detection, modified files, identical rows; updated room type expectations
5. **Feature/plan.md** - Updated to reflect corrected room type, new duplicate detection strategy, improved task organization
6. **Feature/tasks.md** - **This file**: Complete rewrite with corrected information, proper dependencies, comprehensive testing

---

## Next Steps

1. **Immediate**: Start Phase 1 tasks (T001-T003) - no dependencies
2. **Urgent**: Schedule group meeting to resolve BL-01, BL-02, BL-03
3. **Parallel**: After Phase 1, multiple developers can work on Phase 2-4 independently
4. **After Service Layer**: Phase 5 (API endpoints) can start
5. **Blocked**: Phase 10 tasks cannot start until group approval received
6. **Outstanding**: Phase 11 tasks are separate assignment requirements

**Ready for Implementation**: YES - Phases 1-9 (36 tasks) are ready to start immediately

**Blocked Items**: 5 tasks (T044-T048) pending group approval

**Outstanding Requirements**: 7 tasks (T049-T055) - wider assignment scope

---

## Selected Duplicate-Import Strategy

**Strategy**: File-level batch tracking with SHA-256 file content hash

**Why Selected**:
- Prevents re-importing same file content
- Detects modified files even with same filename
- Preserves legitimate identical rows (different source_row_number)
- Supports safe retry on failure
- Avoids partial imports via database transactions

**Implementation**: 
- import_batches table tracks all import operations
- Each record includes import_batch (file hash), source_row_number
- File hash calculated before processing
- Batch check prevents duplicate imports

## Corrected Room-Type Representation

**Previous**: room_type as INT (1-8) - INCORRECT
**Current**: room_type as VARCHAR(50) - CORRECTED

**Values**: "Standard Single", "Standard Double", "Superior Double", "Grand Lit", "Junior Suite", "Suite", "LOFT Suite", "Spa Executive"

**All tasks and documentation updated** to reflect STRING type.

## New Task Dependencies and Tests

**Dependencies Reorganized**:
- Service layer (Phase 3) can be tested independently (Phase 4)
- API endpoints (Phase 5) implemented after service layer is testable
- Integration testing (Phase 7) after API endpoints work
- Comprehensive testing (Phase 8) covers all edge cases

**Test Coverage Added**:
- Invalid rows
- Missing files
- Non-Excel files
- Duplicate file imports
- Modified file imports
- Legitimate identical rows
- Database failures
- Transaction rollback
- Regression testing

## Docker/MySQL Verification

**Verified**:
- Docker-compose.yml (mixed case) exists and is properly configured
- MySQL initialization uses mysql/init.sql
- All services have health checks
- No Docker configuration changes needed
- DO NOT create duplicate docker-compose.yml

## Unresolved Questions

The following require group approval:
- BL-01: Season boundary definitions
- BL-02: Helene Christine attribution method
- BL-03: Synthetic date generation policy

All other technical questions resolved through file inspection.

---

*This tasks.md was generated and corrected from Feature/spec.md, Feature/plan.md, Feature/data-model.md, Feature/research.md, Feature/contracts/api.yaml, and .specify/memory/constitution.md on 2026-10-28*
