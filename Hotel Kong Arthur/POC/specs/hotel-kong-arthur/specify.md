Specify:

# Feature Specification: Hotel Kong Arthur Analytics Platform

## 1. Overview

### 1.1 Purpos

Hotel Kong Arthur needs a system that collects, manages, and presents hotel and cocktail bar data to support operational and business decisions.

The system must provide functionality for managing room bookings, keeping data up to date, calculating business metrics, and presenting the results through an interactive Tableau dashboard.

The solution must support both historical data and new data generated during operation.

### 1.2 Problem Statement

The available hotel data is primarily provided as static CSV and spreadsheet files. Static historical data alone cannot demonstrate how hotel performance changes as new bookings and sales occur.

The hotel therefore needs a prototype that can manage booking data, process hotel and cocktail bar information, calculate relevant metrics, and make the resulting data available for analysis.

### 1.3 Target Users

- **Receptionist:** Manages room bookings and keeps booking information up to date.
- **Hotel administrator:** Monitors occupancy, revenue, guest origins, and hotel performance.
- **Management:** Uses business metrics to identify trends and support decisions.
- **Bar manager or administrator:** Monitors cocktail bar sales and product performance.
- **Dashboard user:** Explores hotel and bar metrics through Tableau.

## 2. Goals

The system must enable users to:

1. Create, view, update, and delete room bookings.
2. Access current booking and hotel data without depending exclusively on static files.
3. Calculate and analyze hotel occupancy and revenue.
4. Compare hotel revenue across room types, seasons, and guest countries.
5. Identify the room types and guest countries associated with the highest revenue.
6. Calculate the hotel's revenue for a specified year.
7. Monitor cocktail bar sales, including sales attributed to Helene Christine.
8. Compare cocktail and coffee sales.
9. Explore relevant business metrics in an interactive Tableau dashboard.
10. Measure average customer satisfaction for a selected period.
11. Run the complete prototype using Docker Compose.

## 3. Scope

### 3.1 In Scope

- Room booking management.
- Access to booking and hotel data.
- Ongoing data updates.
- Hotel occupancy and revenue calculations.
- Analysis by room type, season, and guest country.
- Annual hotel revenue reporting.
- Cocktail bar sales analysis.
- Customer satisfaction analysis.
- An additional business metric selected by the development team.
- An interactive Tableau dashboard.
- A REST API using JSON.
- An OpenAPI specification accessible through Swagger UI.
- A MySQL database.
- A browser-based frontend for booking management.
- Docker-based execution of the complete system.

### 3.2 Out of Scope

Unless explicitly added by the team, the prototype does not include:

- Integration with the hotel's actual production booking system.
- Online payments or payment processing.
- Guest authentication and account management.
- Automatic booking confirmations by email or SMS.
- A production-ready reservation website for hotel guests.
- Forecasting or machine-learning-based revenue predictions.
- A complete replacement for the hotel's existing operational systems.

These exclusions are proposed scope boundaries, not additional requirements from the assignment.

## Clarifications

### Session 2026-10-26

- Q: How should hotel occupancy be calculated? → A: Occupied room-nights divided by available room-nights
- Q: What constitutes hotel room revenue? → A: Total booking value including taxes and fees
- Q: What are the exact boundaries for low, mid, and high season, including how December and Christmas are classified? → A: High: June-August + Dec 20-Jan 5, Mid: April-May + Sept-Oct, Low: Jan 6-Mar 31 + Nov 1-Dec 19
- Q: How many rooms belong to each of the eight room types? → A: Use the distribution from the provided hotel data repository
- Q: How should cocktail bar sales be attributed to Helene Christine? → A: Sales where employee_id = Helene Christine or transaction contains her identifier

### Session 2026-10-29 (godkendte beslutninger)

- Q: What does live data mean? → A: A change via POST/PUT/DELETE is visible in the next GET call without caching; the Tableau export runs every 60 seconds (EXPORT_INTERVAL_SECONDS=60)
- Q: How should cancellations, unavailable rooms, and overlapping bookings affect occupancy? → A: Occupancy = occupied room-nights / (214 × nights in period); only active (non-deleted) bookings count; a night d counts if check_in <= d < check_out (check-out day does not count)
- Q: How many guests may a booking have? → A: guest_count with 1 <= guest_count <= room capacity (capacity between 1 and 4, taken from the provided data)
- Q: Should cocktail and coffee percentages be based on quantities or revenue? → A: Both — revenue share as the primary figure and unit share as a supplementary figure (BR-07)
- Q: Which additional business metric will the team implement? → A: RevPAR (BR-09), with ADR as a supplementary metric
- Q: Which calendar year should the annual reports cover? → A: The year is a parameter (`?aar=`) defaulting to the most recent year with complete data (BR-04)
- Q: How frequently should Tableau refresh its data? → A: The export script runs every 60 seconds (EXPORT_INTERVAL_SECONDS=60); the dashboard reflects changes after the next extraction and a manual data-source reload
- Q: How is double booking defined? → A: Overlap if new.check_in < existing.check_out AND new.check_out > existing.check_in — same-day check-out/check-in is allowed; at least one night is required (BR-10)

## 4. Functional Requirements

### FR-01: Booking Management

The system must allow a receptionist to manage room bookings through a browser-based interface.

The system must support creating, viewing, updating, and deleting bookings.

A booking must specify the number of guests (guest_count). The system must reject a booking unless 1 <= guest_count <= the capacity of the booked room, where room capacity is between 1 and 4 guests. Capacity values are taken from the provided data and must not be invented (see section 6.1).

Two bookings on the same room must not overlap (see BR-10). Check-out and a new check-in on the same day is allowed, and every booking must cover at least one night.

### FR-02: Data Availability and Updates

The system must make hotel data available for ongoing use and analysis.

The solution must not depend exclusively on the original static CSV files to demonstrate current data.

New or modified data must be accessible through the system's data interface without requiring the entire historical dataset to be manually imported again.

Live data means that a change made through POST, PUT, or DELETE is visible in the next GET call without caching. The Tableau export runs every 60 seconds (EXPORT_INTERVAL_SECONDS=60); the dashboard is therefore at most one export interval plus a manual data-source reload behind the API.

### FR-03: Hotel Occupancy

The system must calculate hotel occupancy for a selected reporting period.

Users must be able to analyze occupancy over time.

The calculation must use the definition in BR-01, including the treatment of cancelled and unavailable bookings specified there.

### FR-04: Hotel Revenue

The system must calculate hotel revenue for a selected reporting period.

Revenue must be analyzable by:

- Room type.
- Season.
- Guest country.
- Calendar year.

The system must allow users to identify the room types and guest countries associated with the highest revenue.

The definition of recognized room revenue and the applicable reporting period must be documented before implementation.

### FR-05: Annual Hotel Revenue

The system must calculate the hotel's total revenue for a specified calendar year.

The year is supplied as a parameter (`?aar=`); if omitted, the default is the most recent year with complete data (BR-04).

The reporting period must be identifiable in the results.

The calculation must use the same revenue definition as the other hotel revenue reports.

### FR-06: Guest Origins

The system must present the distribution of hotel guests by country.

Users must be able to explore guest origins and compare revenue associated with different countries.

### FR-07: Cocktail Bar Sales

The system must provide an overview of cocktail bar sales.

The system must calculate the total sales attributed to Helene Christine for a specified year.

The reporting period and the attribution of sales to Helene Christine must be identifiable.

### FR-08: Sales by Product

The system must calculate and present revenue for individual drinks.

The analysis must support the cocktail bar's cocktail and coffee products.

Users must be able to identify the products associated with the highest sales revenue.

### FR-09: Cocktail and Coffee Distribution

The system must calculate the percentage distribution of cocktails and coffee sold by Helene Christine.

The distribution must show both the share of sales revenue (primary figure) and the share of units sold, so the two product categories can be compared (BR-07).

The definition of the percentage calculation must be documented (BR-07: revenue share and unit share).

### FR-10: Additional Business Metric

The team must implement at least one additional business metric that is relevant to hotel operations.

The selected additional metric is **RevPAR** (revenue per available room): total room revenue (BR-02) divided by (214 × the number of nights in the reporting period) (BR-09). **ADR** (average daily rate: total room revenue divided by occupied room-nights, BR-09) is presented as a supplementary metric.

The metric must have:

- A clearly stated business purpose.
- A documented calculation (BR-09).
- An identifiable reporting period.
- A presentation in the Tableau dashboard.

### FR-11: Interactive Tableau Dashboard

The system must provide an interactive Tableau dashboard based on data made available through the backend REST API.

The dashboard must present the hotel and cocktail bar metrics specified in this document.

Users must be able to explore the results and compare relevant dimensions, including room types, seasons, countries, products, and reporting periods where applicable.

The dashboard must clearly identify the metrics and reporting periods being displayed.

### FR-12: API Contract

The backend must expose its functionality through a REST API that exchanges JSON data.

The API must have an OpenAPI specification.

The specification must be accessible through Swagger UI.

### FR-13: Reproducible Execution

The complete prototype must be runnable using a single Docker Compose command.

The required application components and database must be included in the documented startup process.

The project must include sufficient documentation for another developer to understand and run the system.

### FR-14: Customer Satisfaction

The system must calculate the average customer satisfaction rating for a selected reporting period.

The calculation must use the definition in BR-08 and only include ratings linked to existing bookings.

The reporting period must be identifiable in the results.

## 5. User Stories and Acceptance Criteria

### US-01: Create a Booking

**As a receptionist, I want to create a room booking so that the system reflects new reservations.**

Priority: Must have.

Acceptance criteria:

- **AC-01.1:** Given that the receptionist enters valid booking information, when the receptionist submits the booking, then the system creates the booking and makes it available for subsequent retrieval.
- **AC-01.2:** Given that a booking has been created, when the receptionist views the booking list, then the new booking appears in the results.
- **AC-01.3:** Given that required booking information is missing or invalid, when the receptionist submits the booking, then the system rejects the request and communicates the validation error.
- **AC-01.4:** Given that a booking has been created, when the booking is retrieved through the API, then the returned information corresponds to the stored booking.
- **AC-01.5:** Given that a booking is submitted with a guest_count outside the interval 1 to the capacity of the booked room (capacity is between 1 and 4), when the receptionist submits the booking, then the system rejects the request with 400 and a validation error message.

### US-02: View Bookings

**As a receptionist, I want to view existing bookings so that I can access current reservation information.**

Priority: Must have.

Acceptance criteria:

- **AC-02.1:** Given that bookings exist, when the receptionist opens the booking overview, then the system displays the available bookings.
- **AC-02.2:** Given that a booking exists, when the receptionist requests that booking by its identifier, then the system returns the corresponding booking.
- **AC-02.3:** Given that no booking matches the requested identifier, when the receptionist requests the booking, then the system returns an appropriate not-found response.
- **AC-02.4:** Given that the booking overview is displayed, when a booking has been modified, then the updated information is shown after the overview is refreshed.

### US-03: Update a Booking

**As a receptionist, I want to update a booking so that corrections and changes are reflected in the system.**

Priority: Must have.

Acceptance criteria:

- **AC-03.1:** Given that a booking exists, when the receptionist submits valid changes, then the system stores the updated information.
- **AC-03.2:** Given that a booking has been updated, when it is retrieved again, then the updated values are returned.
- **AC-03.3:** Given that an update contains invalid booking information, when the receptionist submits it, then the system rejects the update and communicates the validation error.
- **AC-03.4:** Given that the requested booking does not exist, when the receptionist attempts to update it, then the system returns an appropriate not-found response.

### US-04: Delete a Booking

**As a receptionist, I want to delete a booking so that bookings that should no longer exist can be removed.**

Priority: Must have.

Acceptance criteria:

- **AC-04.1:** Given that a booking exists, when the receptionist confirms the deletion, then the booking is removed from the active booking records.
- **AC-04.2:** Given that a booking has been deleted, when it is requested through the API, then it is no longer returned as an existing booking.
- **AC-04.3:** Given that the requested booking does not exist, when the receptionist attempts to delete it, then the system returns an appropriate not-found response.
- **AC-04.4:** Given that a booking is selected for deletion, when the receptionist initiates the action, then the interface clearly identifies which booking is being deleted.

### US-05: Access Updated Hotel Data

**As a hotel administrator, I want to access updated hotel data so that my analysis reflects changes made during operation.**

Priority: Must have.

Acceptance criteria:

- **AC-05.1:** Given that new booking data has been successfully saved, when the data is requested through the API, then the new booking is available.
- **AC-05.2:** Given that an existing booking has been updated, when the data is requested again, then the updated booking information is returned.
- **AC-05.3:** Given that new data is added during a demonstration, when the relevant data is retrieved again, then the system reflects the change without requiring a complete manual reimport of the historical dataset.
- **AC-05.4:** The documented and verified data-update behavior states that changes made through POST/PUT/DELETE are visible in the next GET call without caching, and that the Tableau export runs every 60 seconds (EXPORT_INTERVAL_SECONDS=60).

### US-06: Analyze Hotel Occupancy

**As a hotel administrator, I want to see occupancy for a selected period so that I can understand how effectively the hotel's room capacity is being used.**

Priority: Must have.

Acceptance criteria:

- **AC-06.1:** Given that valid booking and room-capacity data exists for a reporting period, when occupancy is calculated, then the system returns an occupancy percentage based on the agreed formula.
- **AC-06.2:** Given that a reporting period is selected, when occupancy is displayed, then the result corresponds to that period.
- **AC-06.3:** Given that the relevant input data is unchanged, when occupancy is recalculated, then the result remains consistent.
- **AC-06.4:** Given that the reporting period contains no usable capacity data, when occupancy is requested, then the system handles the situation without producing a misleading percentage.

### US-07: Analyze Revenue by Room Type and Season

**As a hotel administrator, I want to compare revenue by room type and season so that I can identify which room categories generate the most revenue.**

Priority: Must have.

Acceptance criteria:

- **AC-07.1:** Given that revenue data exists, when revenue is grouped by room type, then the system returns revenue for each represented room type.
- **AC-07.2:** Given that revenue data can be associated with seasons, when revenue is grouped by season, then the system returns revenue for each represented season.
- **AC-07.3:** Given that the user compares room types, when the results are displayed, then the room types can be compared using the same revenue definition and reporting period.
- **AC-07.4:** Given that revenue results are presented, when the user identifies the highest-earning room type, then the result can be verified against the underlying data.
- **AC-07.5:** Season boundaries and the handling of dates that cross seasons follow the definitions agreed during Clarify.

### US-08: Analyze Revenue by Guest Country

**As a hotel administrator, I want to compare revenue by guest country so that I can identify which guest markets generate the most revenue.**

Priority: Must have.

Acceptance criteria:

- **AC-08.1:** Given that revenue data is associated with guest countries, when revenue is grouped by country, then the system returns revenue for each represented country.
- **AC-08.2:** Given that multiple countries are represented, when the results are displayed, then the countries can be compared using the same reporting period and revenue definition.
- **AC-08.3:** Given that the results are ordered by revenue, when the administrator views the report, then the country with the highest calculated revenue can be identified.
- **AC-08.4:** Given that country information is missing, when the revenue report is calculated, then records without a known country are shown as "Ukendt", are included in the totals, and are not silently assigned to an unrelated country.

### US-09: Calculate Annual Hotel Revenue

**As a hotel administrator, I want to see the hotel's revenue for a specified year so that I can evaluate annual business performance.**

Priority: Must have.

Acceptance criteria:

- **AC-09.1:** Given that revenue records exist for the selected year, when annual revenue is calculated, then the system returns the sum according to the agreed revenue definition.
- **AC-09.2:** Given that a year is selected, when annual revenue is displayed, then the reporting year is clearly identified (the year is supplied via `?aar=` and defaults to the most recent year with complete data, BR-04).
- **AC-09.3:** Given that the underlying revenue records remain unchanged, when annual revenue is recalculated, then the result remains consistent.
- **AC-09.4:** Given that no qualifying revenue records exist for the selected year, when annual revenue is requested, then the system communicates that no qualifying records were found or returns a defined zero value.

### US-10: Analyze Cocktail Bar Revenue

**As a bar administrator, I want to see the total sales revenue attributed to Helene Christine for a specified year so that I can evaluate her sales performance.**

Priority: Must have.

Acceptance criteria:

- **AC-10.1:** Given that qualifying sales records exist for the selected year and are attributed to Helene Christine, when total revenue is calculated, then the system returns their combined sales value.
- **AC-10.2:** Given that a reporting year is selected, when the result is displayed, then the year is clearly identified.
- **AC-10.3:** Given that sales records are added or corrected, when the calculation is performed again, then the result reflects the updated records.
- **AC-10.4:** Given that the underlying sales records are available, when total revenue is calculated, then the result can be verified against those records.

### US-11: Compare Sales by Drink

**As a bar administrator, I want to see revenue by drink so that I can identify the best-performing products.**

Priority: Must have.

Acceptance criteria:

- **AC-11.1:** Given that sales records contain product and revenue information, when revenue is grouped by drink, then the system returns the revenue associated with each represented product.
- **AC-11.2:** Given that multiple products have sales records, when the results are displayed, then their revenue can be compared.
- **AC-11.3:** Given that the products are ranked by revenue, when the administrator views the results, then the highest-revenue products can be identified.
- **AC-11.4:** Given that a product has no qualifying sales in the selected period, when the report is calculated, then it is handled consistently with the agreed reporting rules.

### US-12: Compare Cocktail and Coffee Sales

**As a bar administrator, I want to see the percentage distribution of cocktails and coffee sold by Helene Christine so that I can understand the composition of her sales.**

Priority: Must have.

Acceptance criteria:

- **AC-12.1:** Given that qualifying cocktail and coffee sales exist, when the distribution is calculated, then the system returns both the revenue share and the unit share for each category according to BR-07.
- **AC-12.2:** Given that both categories have qualifying sales, when their percentages are displayed, then the categories can be compared on both shares.
- **AC-12.3:** Given that the revenue share is calculated, then the percentage denominator is the total qualifying revenue across the included categories.
- **AC-12.4:** Given that the unit share is calculated, then the percentage denominator is the total qualifying units sold across the included categories.
- **AC-12.5:** Both calculation methods are documented so that the displayed percentages can be interpreted correctly; shares are percentages with 1 decimal (BR-02).

### US-13: Explore Business Metrics in Tableau

**As a management user, I want to explore hotel and cocktail bar metrics in Tableau so that I can identify trends and compare business performance.**

Priority: Must have.

Acceptance criteria:

- **AC-13.1:** Given that hotel data is available, when the dashboard is opened, then it displays guest origins, hotel revenue, revenue by room type and season, revenue by country, annual hotel revenue, customer satisfaction, and the selected additional metric.
- **AC-13.2:** Given that cocktail bar sales data is available, when the dashboard is opened, then it displays annual sales attributed to Helene Christine, revenue by drink, and the agreed cocktail-versus-coffee distribution.
- **AC-13.3:** Given that the user selects a supported reporting period or category, when the dashboard is filtered, then the relevant visualizations reflect the selection.
- **AC-13.4:** Given that the dashboard displays a metric, when the user examines it, then the metric's meaning and reporting period are identifiable.
- **AC-13.5:** Given that the dashboard and API use the same dataset and reporting rules, when a displayed metric is checked against an independently calculated result (SQL control queries using ROUND), then the values agree within a tolerance of 0.01 DKK for amounts and 0.1 percentage points for percentages (BR-02).
- **AC-13.6:** Given that the underlying data changes, when the dashboard retrieves or refreshes its data, then the dashboard reflects the change after the next extraction (the export runs every 60 seconds, EXPORT_INTERVAL_SECONDS=60) and a reload of the data source in Tableau.

### US-14: Understand the API

**As a developer, I want to access a documented API contract so that I can understand and use the system's available functionality.**

Priority: Must have.

Acceptance criteria:

- **AC-14.1:** Given that the application is running, when the developer opens Swagger UI, then the API documentation is accessible.
- **AC-14.2:** Given that an endpoint is documented in OpenAPI, then its purpose, supported request parameters, request body where applicable, and response format are described.
- **AC-14.3:** Given that an API request is made with valid input, when the endpoint processes it, then the response follows the documented contract.
- **AC-14.4:** Given that an API request contains invalid input, when the endpoint rejects it, then the response follows the documented error behavior.

### US-15: Start the Complete System

**As a developer or evaluator, I want to start the complete prototype with one Docker Compose command so that I can run and evaluate the system without manually starting individual components.**

Priority: Must have.

Acceptance criteria:

- **AC-15.1:** Given that the repository has been cloned and the documented prerequisites are satisfied, when the documented Docker Compose startup command is executed, then the required application components are started.
- **AC-15.2:** Given that the system has started successfully, when the developer accesses the application, then the booking interface is available.
- **AC-15.3:** Given that the system has started successfully, when the developer accesses Swagger UI, then the API documentation is available.
- **AC-15.4:** Given that the backend requires MySQL, when the application is ready for use, then the backend can communicate with the database.
- **AC-15.5:** Given that the project is started from a fresh clone, then the documented setup procedure is sufficient to reproduce the working environment.

### US-16: Analyze Customer Satisfaction

**As a hotel administrator, I want to see the average customer satisfaction rating for a selected period so that I can evaluate guest satisfaction and follow it over time.**

Priority: Must have.

Acceptance criteria:

- **AC-16.1:** Given that satisfaction ratings exist for the selected period, when average satisfaction is calculated, then the system returns the average rating according to BR-08.
- **AC-16.2:** Given that a reporting period is selected, when the result is displayed, then the period is clearly identified.
- **AC-16.3:** Given that the underlying ratings are unchanged, when the calculation is repeated, then the result remains consistent.
- **AC-16.4:** Given that no ratings exist for the selected period, when average satisfaction is requested, then the system communicates that no ratings were found or returns a defined zero value without producing a misleading average.

## 6. Data Requirements

### 6.1 Hotel Data

The system must support the data required to calculate and present:

- Room bookings.
- Room types.
- Number of guests per booking (guest_count).
- Booking dates and reporting periods.
- Guest countries.
- Room revenue.
- Seasonal revenue.
- Occupancy.
- Annual hotel revenue.
- Customer satisfaction ratings linked to bookings.

The assignment identifies eight room types:

1. Standard Enkeltværelse.
2. Grand Lit.
3. Standard Dobbeltværelse.
4. Superior Dobbeltværelse.
5. Junior Suite.
6. Spa Executive.
7. Suite.
8. LOFT Suite.

The assignment states that the hotel has 214 rooms and an approximate maximum capacity of 428 guests.

Each room has a capacity between 1 and 4 guests. Capacity values must be taken from the provided data; if the provided data does not contain room capacity, this must be clarified with the teacher as an open point — capacity values must not be invented.

The room distribution across the eight room types will be sourced from the provided hotel data repository. If the data is unavailable or incomplete, the system will use the documented distribution from that source as the authoritative reference.

### 6.2 Cocktail Bar Data

The system must support the data required to calculate:

- Sales transactions.
- Products sold.
- Sales quantities.
- Sales revenue.
- Sales attribution to Helene Christine.
- Annual sales totals.
- Revenue by drink.
- Cocktail and coffee distribution.

The assignment describes 20 cocktails and 10 coffee types.

The actual sales records, prices, quantities, and employee attribution must be supported by the available data or explicitly identified as demonstration data.

### 6.3 Historical and New Data

The existing CSV and spreadsheet files provide examples of historical data.

The system must be capable of demonstrating ongoing data updates in addition to presenting historical records.

Historical data and demonstration data must be distinguishable where necessary to avoid presenting invented transactions as verified historical sales.

## 7. Business Rules and Definitions

The following rules must be agreed and documented before the relevant functionality is implemented.

### BR-01: Occupancy

The occupancy calculation is defined as: occupied room-nights divided by (214 × the number of nights in the reporting period).

Only active (non-deleted) bookings count. A room-night on date d counts as occupied if check_in <= d < check_out — the check-out day does not count. Cancelled bookings are handled by deletion: a deleted booking does not count as occupied.

The reporting period can be any selected time range.

### BR-02: Room Revenue

Hotel room revenue is defined as the total booking value including all taxes and fees.

Amounts are stored as DECIMAL and returned in DKK with 2 decimals. Percentages are returned with 1 decimal. Control calculations use a tolerance of 0.01 DKK for amounts and 0.1 percentage points for percentages, against SQL control queries using ROUND.

This definition must be used consistently across all revenue reports (by room type, season, guest country, and annual) and dashboard visualizations.

### BR-03: Seasons

Season boundaries are defined as:
- **High season:** June 1 - August 31, plus December 20 - January 5
- **Mid-season:** April 1 - May 31, plus September 1 - October 31
- **Low season:** January 6 - March 31, plus November 1 - December 19

The Christmas period (December 20 - January 5) is classified as high season.

### BR-04: Annual Reporting

Annual hotel revenue and annual bar sales must refer to a clearly identified reporting year.

The reporting year is supplied as a parameter (`?aar=`); if omitted, the default is the most recent year with complete data in the dataset.

### BR-05: Room Capacity

The hotel has 214 rooms and an approximate maximum capacity of 428 guests.

The team must determine how individual rooms, room types, and guest capacity are represented in the data.

The number of rooms assigned to each of the eight room types is not specified in the assignment.

### BR-06: Bar Sales Attribution

Sales are attributed to Helene Christine when the transaction contains her employee_id or explicit identifier.

If the available data does not contain employee-level attribution, the system will use demonstration data that simulates this attribution and documents the simulation approach.

### BR-07: Sales Distribution

The cocktail-versus-coffee percentage distribution is calculated as both the share of sales revenue (primary figure) and the share of units sold. Both shares must be presented so the categories can be compared.

The revenue share denominator is the total qualifying revenue across the included categories; the unit share denominator is the total qualifying units sold. Shares are percentages with 1 decimal.

### BR-08: Customer Satisfaction

Customer satisfaction is defined as the average rating on a 1-5 scale from satisfaction records linked to existing bookings, calculated for a selected reporting period.

Ratings without a linked booking are excluded. If no qualifying ratings exist for the period, the system produces a defined empty result rather than a misleading average.

Since the provided data does not contain satisfaction ratings, the system uses clearly marked demonstration data for this metric (see section 6.3).

### BR-09: RevPAR and ADR

RevPAR (revenue per available room) is defined as: total room revenue (BR-02) divided by (214 × the number of nights in the reporting period).

ADR (average daily rate) is defined as: total room revenue divided by occupied room-nights (BR-01).

RevPAR is the selected additional business metric (FR-10); ADR is presented as a supplementary metric. Both use an identifiable reporting period and are presented in the Tableau dashboard.

### BR-10: Double Booking

Two bookings on the same room overlap if: new.check_in < existing.check_out AND new.check_out > existing.check_in.

Overlapping bookings must be rejected with 409 Conflict. Check-out and a new check-in on the same day is therefore allowed, and every booking must cover at least one night (check_in < check_out).

## 8. Non-Functional Requirements

### NFR-01: Architecture

The backend must follow a three-layer architecture.

### NFR-02: API

The system must expose a REST API that uses JSON.

The API contract must be provided through OpenAPI and accessible through Swagger UI.

### NFR-03: Database

The system must use MySQL.

### NFR-04: Deployment

The complete prototype must run using Docker containers and Docker Compose.

### NFR-05: Reproducibility

The project must include documentation that enables another developer to start the system using the documented procedure.

### NFR-06: Data Consistency

The API and Tableau dashboard must use consistent metric definitions and reporting rules.

### NFR-07: Verifiability

The system's calculations must be testable against underlying data or independently calculated reference results.

### NFR-08: Maintainability

The project must include a README, a contribution guide, and the required specification artifacts in the GitHub repository.

The development team must be able to explain and evaluate the implemented solution.

### NFR-09: Performance

Metrics endpoints must respond within 2 seconds, booking-CRUD endpoints within 500 milliseconds, and a complete .hyper export must finish within 30 seconds (measured on the demo dataset).

### NFR-10: Security

All database queries must be parameterized (no string-concatenated SQL), and all input must be validated. No secrets may be committed to git (constitution principle VI). Error responses must never contain stack traces or internal details.

The prototype deliberately has no login, roles, or access control. This is a conscious limitation and must be documented as a known weakness of the prototype.

## 9. Dependencies

The implementation depends on:

1. Access to the provided hotel data repository.
2. Identification of the fields available in the historical data.
3. Agreement on the definitions of occupancy, revenue, seasons, and annual reporting.
4. Identification of available cocktail bar sales data.
5. A defined method for demonstrating new data and live updates.
6. Agreement on the additional business metric.
7. An agreed contract between the backend API and Tableau.

## 10. Clarifications Required Before Implementation

The following questions must be resolved during Clarify.

| ID | Question | Why it matters |
|---|---|---|
| C-01 | What does live data mean for the prototype, and what update delay is acceptable? | **RESOLVED:** Change visible in next GET without caching; Tableau export every 60 seconds (EXPORT_INTERVAL_SECONDS=60) |
| C-02 | What are the exact boundaries of low, mid, and high season? | **RESOLVED:** High: Jun-Aug + Dec 20-Jan 5, Mid: Apr-May + Sep-Oct, Low: Jan 6-Mar 31 + Nov 1-Dec 19 |
| C-03 | How should December and the Christmas period be classified? | **RESOLVED:** Dec 20-Jan 5 = High season, Nov 1-Dec 19 = Low season |
| C-04 | How should occupancy be calculated? | **RESOLVED:** Occupied room-nights divided by (214 × nights in the period) — BR-01 |
| C-05 | How should cancellations, unavailable rooms, and overlapping bookings affect occupancy? | **RESOLVED:** Only active (non-deleted) bookings count; a night d counts if check_in <= d < check_out (check-out day does not count) |
| C-06 | What constitutes hotel revenue? | **RESOLVED:** Total booking value including taxes and fees |
| C-07 | Which calendar year should the initial annual revenue reports cover? | **RESOLVED:** Year is a `?aar=` parameter defaulting to the most recent year with complete data — BR-04 |
| C-08 | How many rooms belong to each of the eight room types? | **RESOLVED:** Use distribution from provided hotel data repository |
| C-09 | Which cocktail bar sales fields are available in the supplied data? | Determines whether historical bar revenue can be calculated directly. |
| C-10 | How should sales be attributed to Helene Christine? | **RESOLVED:** Sales where employee_id = Helene Christine or transaction contains her identifier |
| C-11 | Should cocktail and coffee percentages be based on quantities or revenue? | **RESOLVED:** Both — revenue share (primary) and unit share (supplementary) — BR-07 |
| C-12 | Which additional business metric will the team implement? | **RESOLVED:** RevPAR with ADR as supplementary metric — BR-09, FR-10 |
| C-13 | How should missing or incomplete historical data be handled? | Missing fields are covered by clearly marked demonstration data (BR-06, section 6.3); verify against the provided data. |
| C-14 | How frequently should Tableau refresh its data? | **RESOLVED:** Export script runs every 60 seconds (EXPORT_INTERVAL_SECONDS=60) |
| C-15 | How should customer satisfaction be measured? | **RESOLVED:** Average rating (1-5) from ratings linked to existing bookings, per selected period (BR-08) |

## 11. Definition of Done

A user story is considered complete when:

1. Its acceptance criteria have been verified.
2. Its behavior matches the agreed specification.
3. Relevant invalid inputs and error conditions have been tested.
4. The implementation has been reviewed by the team.
5. The feature works within the agreed system architecture.
6. Any relevant API documentation has been updated.
7. Any relevant dashboard metrics have been checked against the underlying data.
8. The team can explain the implementation and its limitations.

At the end of the project, the team must produce a Converge result that identifies which requirements have been implemented and which remain incomplete.

## 12. Success Criteria

The prototype is successful when:

- A receptionist can create, view, update, and delete bookings through the browser interface.
- Booking changes are available through the backend API.
- Hotel occupancy and revenue can be calculated according to documented definitions.
- Hotel revenue can be compared by room type, season, and guest country.
- Annual hotel revenue can be calculated for a specified year.
- Cocktail bar revenue, revenue by drink, and cocktail-versus-coffee distribution can be presented.
- At least one additional business metric is implemented.
- Average customer satisfaction can be calculated for a specified period and presented in the dashboard.
- The Tableau dashboard presents the required metrics and supports interactive exploration.
- The API contract is available through OpenAPI and Swagger UI.
- The complete prototype can be started using one Docker Compose command.
- The team can demonstrate and explain the implemented functionality.
