# Implementation Plan: Historical Data Import

**Branch**: Feature | **Date**: 2026-10-28 | **Spec**: [Feature/spec.md](../../Feature/spec.md)

**CORRECTION LOG**:
- **2026-10-28**: Updated to reflect corrected room_type as STRING (not numeric). Added import_batch table for duplicate detection. Updated duplicate detection strategy from row-level hash to file-level batch tracking.

**Input**: Feature specification from `/home/ykke/Hotel-Kong-Arthur/Feature/spec.md`

**Note**: This implementation plan addresses the Historical Data Import feature for the Hotel Kong Arthur Analytics Platform. The plan respects all constitution principles and documents dependencies on unresolved group decisions (BL-01, BL-02, BL-03).

---

## Summary

The Historical Data Import feature will import historical hotel booking and cocktail bar sales data from provided Excel files (`Datasets/international_names_with_rooms_1000.xlsx` and `Datasets/drinks_menu_with_sales.xlsx`) into the MySQL database. The import will preserve all source data values without fabrication, create appropriate database tables, and make the data available through the existing REST API architecture. The feature will maintain strict separation between historical data (from source files) and demonstration data (created during operation).

**Key Decisions:**
- Use existing three-layer Node.js/Express architecture
- Create dedicated import service and routes
- Add new database tables for historical data AND import batch tracking
- **CORRECTED**: Room Type is STRING (e.g., "Spa Executive", "Standard Double"), NOT numeric codes
- Implement validation and duplicate detection at FILE level (not row level)
- Generate import reports with batch tracking
- Do NOT invent dates or employee attribution
- Block season-based and employee-specific analytics pending group approval (BL-01, BL-02)

---

## Technical Context

**Language/Version**: Node.js 18 (ES Modules) - Matched to existing backend implementation

**Primary Dependencies**: 
- express ^4.18.2 (existing)
- mysql2 ^3.6.0 (existing)
- cors ^2.8.5 (existing)
- swagger-ui-express ^5.0.0 (existing)
- yamljs ^0.3.0 (existing)
- dotenv ^16.3.1 (existing)
- **NEW**: xlsx ^0.18.5 (for Excel file parsing)

**Storage**: MySQL 8.0+ (existing) - New tables: `import_batches`, `historical_bookings`, `historical_drinks`

**Testing**: Node.js native test runner with assertion library (to be added)

**Target Platform**: Docker containers (Linux) with Docker Compose

**Project Type**: Web service (REST API backend)

**Performance Goals**: 
- Import 1001 hotel records + 30 drink records in < 5 seconds
- API response times < 100ms for data queries
- Support concurrent imports (1 at a time with queue)

**Constraints**: 
- Memory: < 512MB per container
- Database connections: Max 10 (existing pool configuration)
- File size: Excel files < 10MB
- No synthetic data generation without explicit approval

**Scale/Scope**: 
- 1001 historical hotel records
- 30 historical drink records
- 8 room types (STRING values): "Standard Single", "Standard Double", "Superior Double", "Grand Lit", "Junior Suite", "Suite", "LOFT Suite", "Spa Executive"
- 2 drink categories (Cocktail, Coffee)
- 3 seasons (low, mid, high)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle Compliance

| **Principle** | **Status** | **Justification** |
|--------------|------------|------------------|
| **I. Assignment Compliance** | ✅ PASS | All requirements traceable to Feature/spec.md; contradicting requirements documented in Section 12.1 |
| **II. Three-Layer Architecture** | ✅ PASS | Import routes (Presentation), import service (Business Logic), DB access (Data Access) |
| **III. API Contract Integrity** | ✅ PASS | New endpoints will have OpenAPI documentation; existing booking endpoints preserved |
| **IV. Database Standard** | ✅ PASS | MySQL used; new tables follow existing naming conventions (snake_case) |
| **V. Containerization** | ✅ PASS | Docker Compose verified as existing and functional; import functionality added to existing backend container |
| **VI. Data Analytics Accuracy** | ⚠️ PARTIAL | Historical data importable; analytics dependent on BL-01, BL-02, BL-03 resolution. **CORRECTED**: Room Type is STRING. |
| **VII. Booking Management Preservation** | ✅ PASS | No changes to existing bookings table; import uses separate tables |
| **VIII. Technology Flexibility** | ✅ PASS | Using existing Node.js/Express stack; no new languages/frameworks introduced |
| **IX. Code Quality Standard** | ✅ PASS | Will follow camelCase (JS), snake_case (SQL), validation, error handling |
| **X. Code Evolution Policy** | ✅ PASS | Existing booking code untouched; import feature is additive |
| **XI. Documentation Consistency** | ✅ PASS | OpenAPI, README, and spec artifacts will be updated |

### ⚠️ Blocked by Group Decisions

The following constitution principles have dependencies on unresolved group decisions:

- **VI. Data Analytics Accuracy**: Season-based calculations and employee attribution depend on BL-01, BL-02, BL-03
- **Additional Constraints - Data Handling**: Synthetic data generation blocked by BL-03

**Gate Status**: ✅ **PASS** - All constitution principles are either satisfied or have documented dependencies on blocked items. No violations without justification.

---

## Project Structure

### Documentation (this feature)

```text
Feature/
├── spec.md              # Feature specification (completed)
├── Clarify.md           # Clarification session record (completed)
├── plan.md              # This file (IN PROGRESS - CORRECTED)
├── research.md          # Phase 0 output (TO BE CREATED - CORRECTED)
├── data-model.md        # Phase 1 output (TO BE CREATED - CORRECTED)
├── contracts/           # Phase 1 output
│   └── api.yaml         # API contract for import endpoints (CORRECTED)
└── tasks.md             # Phase 2 output (TO BE CREATED)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── routes/
│   │   ├── bookings.js          # EXISTING - unchanged
│   │   └── import.js            # NEW - import endpoints (Presentation)
│   ├── services/
│   │   ├── bookingService.js     # EXISTING - unchanged
│   │   └── importService.js      # NEW - import business logic (Business Logic)
│   ├── db.js                    # EXISTING - unchanged (using pool from existing)
│   └── app.js                   # EXISTING - extended with import route
├── package.json                # EXISTING - updated with xlsx
└── Dockerfile                  # EXISTING - unchanged

frontend/
└── index.html                  # EXISTING - unchanged

db/
├── init.sql                    # EXISTING - unchanged (bookings table)
└── import.sql                  # NEW - historical data tables + import_batches

mysql/
└── init.sql                    # EXISTING - unchanged

Datasets/
├── international_names_with_rooms_1000.xlsx  # EXISTING - source file (Room Type = STRING)
└── drinks_menu_with_sales.xlsx                  # EXISTING - source file

docker-compose.yml             # EXISTING - DO NOT MODIFY (Docker-compose.yml exists, mixed case)

Note: Docker-compose.yml (mixed case) exists and is properly configured. DO NOT create duplicate docker-compose.yml.
```

**Structure Decision**: Single project with existing Node.js/Express backend. New import functionality added as separate routes and services. Existing booking system remains untouched.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| **Violation** | **Why Needed** | **Simpler Alternative Rejected Because** |
|---------------|----------------|------------------------------------------|
| N/A | N/A | All principles satisfied or dependencies documented |

---

## Phase 0: Research

### Research Tasks Resolved

All technical unknowns have been resolved through inspection of existing codebase and datasets.

#### R-01: Excel File Parsing
**Decision**: Use `xlsx` npm package (v0.18.5)
**Rationale**: 
- Most popular Excel parsing library for Node.js (1.5M weekly downloads)
- Supports both .xlsx and .xls formats
- Provides streaming API for large files
- Pure JavaScript (no native dependencies)
**Alternatives considered**: 
- `exceljs` - More features but heavier; not needed for read-only
- `sheetjs` - Browser-focused; server-side not optimal
- `node-xlsx` - Less maintained; fewer features

#### R-02: Data Validation Library
**Decision**: Implement native validation (no additional library)
**Rationale**:
- Reduces dependencies
- Validation logic is straightforward (type, length, range, enum checks)
- Consistent with existing patterns in bookingService.js
**Alternatives considered**:
- `validator` - Would add dependency; native validation sufficient
- `joi` - More powerful but heavier; overkill for this use case

#### R-03: File Upload Mechanism
**Decision**: Use multipart/form-data via Express built-in handling or minimal middleware
**Rationale**:
- Standard approach for file uploads in Express
- Can use `express-fileupload` or native `multer` if needed
- Easy integration with existing Express app
**Alternatives considered**:
- Direct file path configuration - Less flexible for production
- Base64 encoded in JSON - Inefficient for binary files

#### R-04: Database Schema Design
**Decision**: Create separate tables `import_batches`, `historical_bookings`, and `historical_drinks`

**Rationale**:
- **import_batches**: Tracks import operations for duplicate detection and audit
- **historical_bookings**: Stores hotel data with STRING room_type
- **historical_drinks**: Stores drink data
- Clear separation from operational `bookings` table (Principle VII)
- Different schema from operational tables (no dates, different fields)
- Allows historical-specific metadata (source_file, import_batch, source_row_number)
- Preserves existing booking table structure (Principle VII)

**CORRECTION**: room_type is VARCHAR(50), not INT. The source data contains actual room type names.

**Alternatives considered**:
- Add to existing tables - Would require nullable fields and violate separation
- Single historical_data table with JSON fields - Less queryable, harder to validate

#### R-05: Duplicate Detection Strategy
**Decision**: **FILE-LEVEL BATCH TRACKING** (not row-level hash)

**Rationale**:
- **Problem with row-level hash**: Would treat identical rows within a file as duplicates, which is WRONG (two guests with same name in same room is valid)
- **Solution**: Track import batches by file content hash
  - Calculate SHA-256 hash of entire source file
  - Store in `import_batches` table with status
  - Prevent re-importing same file content
  - Detect modified files (different hash)
  - Preserve legitimate identical rows (different source_row_number)
- **Implementation**:
  - Each import creates a batch record with file_hash
  - Each row gets source_row_number (1-indexed)
  - Batch status: pending, completed, failed
  - Entire import in single transaction

**Trade-offs**:
- ✅ Prevents duplicate file imports
- ✅ Detects modified files
- ✅ Preserves legitimate identical rows
- ✅ Supports safe retry
- ⚠️ Requires additional table (import_batches)
- ⚠️ Requires additional field (source_row_number, import_batch)

**Previous approach rejected**: Row-level SHA-256 hash would incorrectly flag identical rows within a file as duplicates.

#### R-06: Excel Column Mapping
**Decision**: Column position-based mapping with validation

**Rationale**:
- Source files have fixed, verified structure
- Hotel: A=First Name, B=Family Name, C=Country, D=Room Type (STRING), E=Days Rented, F=Season, G=Price
- Drinks: A=Drink Name, B=Category, C=Price (DKK), D=Units Sold
- **CORRECTED**: Column D in hotel file is Room Type as STRING, not numeric

**Alternatives considered**:
- Header-based mapping - Headers exist but position-based is more reliable for these files
- Configuration file - Unnecessary for fixed-format files

#### R-07: Transaction Strategy
**Decision**: Single transaction per import file with rollback on error
**Rationale**:
- Ensures all-or-nothing for each file
- Prevents partial imports on failure
- MySQL supports transactions for DML operations
**Alternatives considered**:
- Individual transactions per record - Too slow; no atomicity
- No transactions - Risk of partial imports

#### R-08: Import Report Format
**Decision**: JSON response with structured validation results
**Rationale**:
- Machine-readable for API consumers
- Includes batch_id for tracking
- Consistent with existing JSON API format (Principle III)
**Alternatives considered**:
- CSV/Excel report - Requires additional dependencies
- Database table - Overkill for one-time operation

---

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](./data-model.md) for complete entity definitions, fields, relationships, and validation rules.

**CORRECTIONS APPLIED**:
- Room Type changed from INT to VARCHAR(50)
- Added `import_batches` table for batch tracking
- Added `import_batch` and `source_row_number` fields to historical tables

### API Contracts

See [contracts/api.yaml](./contracts/api.yaml) for OpenAPI specification of new import endpoints.

**CORRECTIONS APPLIED**:
- Room Type schema updated to string
- Added ImportBatch schema
- Added source_row_number field to HistoricalBooking and HistoricalDrink
- Added import_batch field to HistoricalBooking and HistoricalDrink

### Quickstart Validation Guide

See [quickstart.md](./quickstart.md) for runnable validation scenarios.

**CORRECTIONS APPLIED**:
- Updated test scenarios for STRING room types
- Added scenarios for duplicate detection, modified files, identical rows

---

## Implementation Phases

### Phase A: Foundation (Can proceed WITHOUT group approval)
**Dependencies**: None blocked
**Estimated Effort**: 1-2 days

1. **A-01**: Create import_batches, historical_bookings, historical_drinks tables
2. **A-02**: Add xlsx dependency
3. **A-03**: Create import service with file hash calculation
4. **A-04**: Create import route with file upload endpoint
5. **A-05**: Implement batch tracking logic
6. **A-06**: Implement source_row_number tracking
7. **A-07**: Implement validation logic (with STRING room_type)
8. **A-08**: Implement transaction handling with rollback
9. **A-09**: Create import report generation
10. **A-10**: Add OpenAPI documentation for import endpoints
11. **A-11**: Verify existing booking functionality intact

### Phase B: Testing (Can proceed WITHOUT group approval)
**Dependencies**: Phase A complete
**Estimated Effort**: 1 day

1. **B-01**: Create unit tests for validation functions
2. **B-02**: Create unit tests for file hash calculation
3. **B-03**: Create integration tests for successful imports
4. **B-04**: Create integration tests for duplicate file detection
5. **B-05**: Create integration tests for modified file detection
6. **B-06**: Create integration tests for identical rows preservation
7. **B-07**: Create integration tests for transaction rollback
8. **B-08**: Create integration tests for validation errors
9. **B-09**: Verify regression tests for booking CRUD

### Phase C: Documentation & Polish (Can proceed WITHOUT group approval)
**Dependencies**: Phase A, Phase B complete
**Estimated Effort**: 1 day

1. **C-01**: Update README with import instructions
2. **C-02**: Update CONTRIBUTE.md with data loading procedures
3. **C-03**: Create import data dictionary
4. **C-04**: Final validation and cleanup

### Phase D: Analytics Integration (BLOCKED by group approval)
**Dependencies**: BL-01, BL-02, BL-03
**Estimated Effort**: 1-2 days (pending approval)

1. **D-01**: Implement season-based calculations (BLOCKED by BL-01)
2. **D-02**: Implement Helene Christine attribution (BLOCKED by BL-02)
3. **D-03**: Implement annual revenue calculations (BLOCKED by BL-03)
4. **D-04**: Update Tableau dashboard connections
5. **D-05**: Create analytics validation tests

---

## Dependencies and Risks

### Technical Dependencies

| **Dependency** | **Type** | **Status** | **Mitigation** |
|---------------|----------|------------|----------------|
| Node.js 18+ | Runtime | ✅ Available | Docker image specifies version |
| MySQL 8.0+ | Database | ✅ Available | Docker Compose configuration |
| xlsx npm package | Library | ⚠️ To be added | Add to package.json |
| Source Excel files | Data | ✅ Available | Committed to repository |

### Group Approval Dependencies

| **Blocked Item** | **Affects** | **Priority** | **Status** |
|----------------|------------|-------------|------------|
| BL-01 (Season Boundaries) | Season-based calculations, analytics | HIGH | ⏳ Pending group approval |
| BL-02 (Helene Christine Method) | Employee attribution, FR-07 | HIGH | ⏳ Pending group approval |
| BL-03 (Synthetic Dates) | Annual reporting, FR-05/FR-09 | HIGH | ⏳ Pending group approval |

### Risks

| **Risk** | **Likelihood** | **Impact** | **Mitigation** |
|----------|---------------|------------|----------------|
| Group approval delays | Medium | High | Schedule early group meeting; proceed with Phase A |
| Excel file format changes | Low | Medium | Validate file structure on import; fail gracefully |
| Database schema conflicts | Low | High | Use separate tables; preserve existing schema |
| Import performance issues | Low | Medium | Implement batch inserts; test with full dataset |
| Data integrity issues | Low | High | Use transactions; implement validation |
| Duplicate detection issues | Low | High | Use file-level hash + batch tracking; test thoroughly |

---

## Success Metrics

### Phase A Completion Criteria
- [ ] Import batches table created and tested
- [ ] Historical data tables created with correct schema (room_type = VARCHAR(50))
- [ ] Excel files parsed correctly with all records extracted
- [ ] Room type values preserved as STRING
- [ ] File hash calculation works correctly
- [ ] Batch tracking prevents duplicate imports
- [ ] Modified files detected via hash change
- [ ] Legitimate identical rows preserved (different source_row_number)
- [ ] Validation logic rejects invalid records
- [ ] Transaction rollback works on failure
- [ ] Import report generated with success/failure counts
- [ ] New endpoints documented in OpenAPI
- [ ] Existing booking CRUD functionality verified intact
- [ ] Unit tests pass for import service

### Phase B Completion Criteria
- [ ] All test scenarios from quickstart.md pass
- [ ] Duplicate file detection tested
- [ ] Modified file detection tested
- [ ] Identical rows preservation tested
- [ ] Validation error handling tested
- [ ] Transaction rollback tested
- [ ] Regression tests for booking CRUD pass

### Phase C Completion Criteria
- [ ] Documentation complete
- [ ] All validation scenarios verified
- [ ] System ready for production use

### Phase D Completion Criteria (Pending Approval)
- [ ] Season boundaries implemented and documented (BLOCKED by BL-01)
- [ ] Helene Christine attribution working (BLOCKED by BL-02)
- [ ] Annual calculations working (BLOCKED by BL-03)
- [ ] Tableau dashboard updated with new metrics

### Overall Feature Completion
- [ ] All historical data imported successfully
- [ ] Data available through API
- [ ] Analytics features working (where not blocked)
- [ ] Documentation complete
- [ ] Tests passing
- [ ] Docker Compose working

---

## Next Steps

1. **Immediate**: Review and approve this plan
2. **Urgent**: Schedule group discussion to resolve BL-01, BL-02, BL-03
3. **Phase A**: Begin implementation of unblocked import functionality
4. **Phase B**: Implement comprehensive testing
5. **Phase C**: Complete documentation
6. **Phase D**: Implement analytics integration after group approval

**Suggested Command**: `/speckit-tasks` to generate task breakdown from this plan

---

*This plan was generated and corrected during `/speckit-plan` execution on 2026-10-28*
