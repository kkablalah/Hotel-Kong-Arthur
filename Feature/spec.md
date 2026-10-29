# Feature Specification: Historical Data Import

## 1. Overview

### 1.1 Purpose

The Historical Data Import feature enables the Hotel Kong Arthur Analytics Platform to ingest and manage historical hotel booking and cocktail bar sales data from provided CSV and Excel files. This feature is essential for demonstrating the system's analytics capabilities with realistic data while supporting ongoing data updates.

### 1.2 Problem Statement

The hotel provides historical data in static spreadsheet files (CSV/Excel) containing:
- Hotel booking data: guest information, room types, seasons, pricing, and rental duration
- Cocktail bar sales data: drink names, categories, prices, and units sold

To demonstrate the analytics platform's full functionality, this historical data must be imported into the system database, made available through the REST API, and used for metric calculations. The system must distinguish between historical data (from provided files) and new data (created during demonstration).

### 1.3 Target Users

- **Hotel administrator**: Needs historical data for occupancy and revenue analysis
- **Bar administrator**: Needs historical sales data for product performance analysis
- **Management**: Needs historical metrics for trend analysis and decision support
- **Developer**: Needs imported data to be accessible through API endpoints

## 2. Goals

The Historical Data Import feature must:

1. Import historical hotel booking data from `Datasets/international_names_with_rooms_1000.xlsx`
2. Import historical cocktail bar sales data from `Datasets/drinks_menu_with_sales.xlsx`
3. Preserve the supplied data structure and values without fabrication
4. Make imported data available through existing API endpoints
5. Support all required analytics metrics using the imported data
6. Clearly distinguish historical data from demonstration data
7. Maintain data integrity and referential consistency

## 3. Scope

### 3.1 In Scope

- Data import process for provided historical datasets
- Data model extensions to support historical data fields
- Database seeding with historical records
- API endpoints to expose historical data
- Season-based calculations using supplied season labels
- Revenue calculations for historical bookings
- Sales analysis for historical cocktail bar data
- Documentation of data sources and limitations

### 3.2 Out of Scope

- Creation of synthetic dates for historical records
- Fabrication of employee attribution for cocktail bar sales
- Generation of historical data not present in the source files
- Real-time synchronization with external systems
- Data validation beyond what is present in the source files

## 4. Functional Requirements

### FR-01: Historical Hotel Data Import

The system must import hotel booking data from `Datasets/international_names_with_rooms_1000.xlsx`.

**Requirement:** The import must preserve all 7 columns exactly as provided: First Name, Family Name, Country, Room Type, Days Rented, Season, Price.

**Constraint:** No transformation or fabrication of data values during import.

The imported data must be stored in the MySQL database with appropriate schema.

### FR-02: Historical Drinks Data Import

The system must import cocktail bar sales data from `Datasets/drinks_menu_with_sales.xlsx`.

**Requirement:** The import must preserve all 4 columns exactly as provided: Drink Name, Category, Price (DKK), Units Sold.

**Constraint:** No transformation or fabrication of data values during import.

The imported data must be stored in the MySQL database with appropriate schema.

### FR-03: Season Label Preservation

The system must preserve the Season column values (low, mid, high) from the hotel dataset.

**Decision:** Season labels from the source data must be used for historical seasonal revenue calculations.

**Constraint:** Do not generate or infer dates from season labels for historical records.

For new bookings with actual dates, calendar-based season definitions must be used (pending BL-01 approval).

### FR-04: Data Source Identification

The system must clearly identify which data is historical (from provided files) versus demonstration data (created during operation).

**Requirement:** Historical data must be labeled or tagged to indicate its source.

**Constraint:** Historical data must not be presented as verified transactions without clear disclaimers.

### FR-05: Analytics Compatibility

Imported historical data must support all analytics features:
- Occupancy calculations (using available data)
- Revenue calculations by room type, season, and country
- Annual revenue reporting (only for records with valid years/dates)
- Cocktail bar sales analysis (aggregate only, no employee attribution)
- Revenue by drink calculations

**Constraint:** Annual calculations must only be performed where valid reporting years exist.

## 5. Data Requirements

### 5.1 Hotel Data Schema

**Source File:** `Datasets/international_names_with_rooms_1000.xlsx`

**Verified Columns (7 total):**
- **A - First Name**: Guest first name (string) - e.g., "Liam", "Zhang"
- **B - Family Name**: Guest family name (string) - e.g., "Smith", "Nguyen"
- **C - Country**: Guest country of origin (string) - e.g., "China", "Mexico"
- **D - Room Type**: Room type identifier (numeric) - maps to 8 room types
- **E - Days Rented**: Number of days (numeric) - e.g., 1, 2, 3, etc.
- **F - Season**: Season label (string) - values: low, mid, high
- **G - Price**: Room price (numeric) - in DKK

**Verified:** 1002 rows (1 header + 1001 data records)
**Verified:** Season column exists with actual values in the dataset
**Verified:** NO date columns present in the source file

### 5.2 Drinks Data Schema

**Source File:** `Datasets/drinks_menu_with_sales.xlsx`

**Verified Columns (4 total):**
- **A - Drink Name**: Name of the drink (string) - e.g., "Margarita", "Espresso"
- **B - Category**: Drink category (string) - values: Cocktail, Coffee
- **C - Price (DKK)**: Price in Danish Kroner (numeric)
- **D - Units Sold**: Number of units sold (numeric)

**Verified:** 31 rows (1 header + 30 data records)
**Verified:** NO employee attribution column present
**Verified:** NO date/sales timestamp column present

### 5.3 Data Gap Analysis

**Gap 1 - Employee Attribution:**
- **Finding:** Drinks dataset contains NO employee names or sales attribution fields
- **Impact:** Cannot satisfy FR-07 (Helene Christine sales calculation) from source data alone
- **Decision:** Do not fabricate attribution; requires group approval on approach (see BL-02)

**Gap 2 - Dates:**
- **Finding:** Neither dataset contains actual check-in/check-out dates or sales timestamps
- **Impact:** Cannot perform calendar-based reporting or annual calculations on historical data
- **Decision:** Keep historical data undated; synthetic dates require group approval (see BL-03)

**Gap 3 - Season Boundaries:**
- **Finding:** Season labels exist in hotel data, but exact calendar boundaries are undefined
- **Impact:** Cannot implement calendar-based season calculations for new bookings without definitions
- **Decision:** Use supplied labels for historical data; calendar definitions require group approval (see BL-01)

## 6. Business Rules and Definitions

### BR-01: Season Handling

For historical records:
- **Decision:** Use the Season column values (low, mid, high) exactly as provided in the dataset
- Season labels must be preserved and used for historical seasonal revenue calculations
- Do not generate or infer dates from season labels

For new bookings with actual dates:
- **Decision:** Use calendar-based season definitions
- Season boundaries must be documented and agreed upon by the group
- **Status:** Season boundary definitions are **blocked pending group approval** (see BL-01)

### BR-02: Revenue Calculation

Hotel revenue for historical records must be calculated using the Price field from the dataset.

The calculation method must be consistent across all revenue reports.

For annual hotel revenue (FR-05):
- **Decision:** Annual calculations are permitted only for records with valid reporting years or actual dates
- Historical records without dates cannot be assigned to a specific calendar year
- Synthetic date generation requires explicit group approval (see BL-03)

### BR-03: Data Attribution

**Helene Christine Attribution (FR-07):**
- **Decision:** Import the supplied drink data without assigning historical sales to Helene Christine
- Do not fabricate or invent historical employee attribution
- Keep aggregate drink sales and revenue calculations separate from employee-specific calculations
- **Status:** Method for satisfying the Helene Christine requirement is **blocked pending group approval** (see BL-02)

**General Principle:**
- Historical data from source files must not be modified or fabricated
- Demonstration data may be created separately with explicit labeling

## 7. Non-Functional Requirements

### NFR-01: Data Integrity

Imported data must maintain the exact values from the source files.

No data fabrication or invention is permitted for historical records.

### NFR-02: Data Distinguishability

Historical data must be clearly distinguishable from demonstration data.

Metadata or labeling must identify the source of each record.

### NFR-03: Import Documentation

The import process must be documented, including:
- Source file locations
- Data mapping
- Data transformations (if any)
- Limitations and assumptions

## 8. Dependencies

1. Access to the provided dataset files
2. Agreement on season boundary definitions (BL-01)
3. Decision on Helene Christine attribution method (BL-02)
4. Agreement on handling of undated historical records (BL-03)
5. Database schema to support historical data fields

## 9. Clarifications

### Session 2026-10-28

- Q: How should season labels from the historical hotel dataset be handled for calculations? → A: Preserve the supplied season labels (low, mid, high) and use them for historical seasonal revenue calculations. Do not generate historical dates from season labels. For new bookings with actual dates, use calendar-based season definitions. **Season boundaries require explicit group approval before implementation.**
- Q: How should Helene Christine sales attribution be handled given the drinks dataset lacks employee data? → A: Import the supplied drink data without assigning historical sales to Helene Christine. Do not fabricate historical employee attribution. Keep aggregate drink sales and revenue calculations separate from employee-specific calculations. **The method for satisfying the Helene Christine requirement is blocked pending group approval.**
- Q: How should historical data dating be handled when source files lack date fields? → A: Preserve the historical datasets as undated aggregate data. Do not assign an arbitrary reporting year to the supplied records. Do not generate synthetic dates without explicit group approval. Permit annual calculations only for records with a valid reporting year or actual dates. **Generating synthetic dates requires explicit group approval.**
- Q: What data is available in the source files for import? → A: Verified: Hotel dataset contains First Name, Family Name, Country, Room Type, Days Rented, Season (low/mid/high), Price - 1001 records. Drinks dataset contains Drink Name, Category, Price (DKK), Units Sold - 30 records. Neither dataset contains dates or employee attribution.

## 10. Open Questions (Pre-Clarification)

The following questions were identified as requiring clarification before implementation:

1. What are the exact date boundaries for low, mid, and high seasons?
2. How should the Helene Christine sales attribution requirement be satisfied given the absence of employee data in the source files?
3. Can annual revenue calculations be performed on historical data without actual dates?
4. How should historical data be labeled to distinguish it from demonstration data?
5. What is the acceptable approach for demonstrating live data updates alongside historical data?

## 11. Blocked Items Requiring Group Approval

The following decisions cannot be finalized without explicit group approval:

### BL-01: Season Boundary Definitions
**Decision Required:** Exact calendar date boundaries for low, mid, and high seasons.
**Impact:** Required for consistent seasonal revenue calculations for new bookings with actual dates.
**Current Status:** Season labels exist in historical data but date boundaries are undefined.
**Options:**
- A: Define low as Jan-Mar, Apr-May as mid, Jun-Aug as high, Sep-Oct as mid, Nov-Dec as low
- B: Define low as Jan-Apr, May-Jun as mid, Jul-Sep as high, Oct-Dec as low (with Christmas period as high)
- C: Use a different boundary definition
**Recommendation:** Option B aligns with the assignment description that "High season includes summer and the Christmas period."

### BL-02: Helene Christine Attribution Method
**Decision Required:** How to satisfy FR-07 (Helene Christine sales calculation) when source data lacks employee attribution.
**Impact:** Required to implement cocktail bar revenue by employee functionality.
**Current Status:** Drinks dataset has no employee field; fabricating attribution is prohibited.
**Options:**
- A: Create demonstration data with explicit Helene Christine attribution for a subset of sales
- B: Attribute all cocktail sales to Helene Christine as demonstration data
- C: Attribute a documented percentage of sales to Helene Christine based on business assumptions
- D: Implement employee tracking but leave historical data unassigned
**Recommendation:** Option A (explicit demonstration data) with clear labeling to distinguish from historical data.

### BL-03: Synthetic Date Generation
**Decision Required:** Whether to generate synthetic dates for historical records to enable annual reporting.
**Impact:** Required for annual revenue calculations (FR-05) on historical data.
**Current Status:** Historical records lack actual dates; generating dates is currently prohibited.
**Options:**
- A: Do not generate synthetic dates; annual calculations only for new bookings with dates
- B: Generate synthetic dates within a specific year (e.g., 2023) for demonstration purposes with clear disclaimers
- C: Generate synthetic dates spread across multiple years for more realistic demonstration
**Recommendation:** Option B with explicit labeling and documentation of the synthetic nature.

## 12. Assignment Compliance Analysis

### 11.1 Contradictions Identified

The following contradictions exist between the proposed decisions and the original assignment requirements:

**Contradiction 1 - Helene Christine Attribution (FR-07, US-10):**
- **Assignment Requirement:** "The system must calculate the total sales attributed to Helene Christine for a specified year."
- **Data Reality:** The drinks dataset contains NO employee attribution data.
- **Proposed Decision:** Do not fabricate historical employee attribution.
- **Resolution Needed:** Group must decide on acceptable demonstration approach (see BL-02).
- **Risk:** Cannot satisfy assignment requirement without fabricating data or creating demonstration data.

**Contradiction 2 - Annual Revenue (FR-05, FR-09, US-09):**
- **Assignment Requirement:** "The system must calculate the hotel's revenue for a specified calendar year."
- **Data Reality:** Hotel dataset contains NO date fields (only season labels).
- **Proposed Decision:** Do not assign arbitrary reporting years to historical records.
- **Resolution Needed:** Group must decide whether to generate synthetic dates or limit annual reporting to new bookings (see BL-03).
- **Risk:** Cannot satisfy assignment requirement for historical data without date generation.

**Contradiction 3 - Season Definitions (FR-04, US-07):**
- **Assignment Requirement:** "Revenue must be analyzable by season." and "High season includes summer and the Christmas period."
- **Data Reality:** Season labels exist in historical data, but exact date boundaries are undefined.
- **Proposed Decision:** Use supplied labels for historical data, calendar-based for new bookings.
- **Resolution Needed:** Group must define exact season boundaries (see BL-01).
- **Risk:** Season-based calculations for new bookings cannot be implemented without definitions.

### 11.2 Feature Readiness Assessment

**Status: PARTIALLY READY FOR PLAN**

The Historical Data Import feature specification is **ready to proceed to Plan** for the following aspects:
- ✓ Data import process and schema
- ✓ Preservation of source data values
- ✓ Season label usage for historical calculations
- ✓ Data source identification and labeling
- ✓ Aggregate analytics calculations

**Blocked Items Requiring Group Approval Before Plan:**
- ❌ Season boundary definitions (BL-01)
- ❌ Helene Christine attribution method (BL-02)
- ❌ Synthetic date generation policy (BL-03)

**Recommendation:** Proceed with /speckit-plan for unblocked items, but schedule group discussion to resolve BL-01, BL-02, and BL-03 before implementation of affected functionality.

## 13. Success Criteria

The Historical Data Import feature is successful when:

- [ ] Historical hotel booking data is imported and accessible through the API
- [ ] Historical cocktail bar sales data is imported and accessible through the API
- [ ] Season labels from the source data are preserved and used for calculations
- [ ] Revenue calculations work correctly with imported historical data
- [ ] Historical data is clearly identified as such in the system
- [ ] All analytics features produce correct results using historical data
- [ ] Documentation explains data sources and limitations
