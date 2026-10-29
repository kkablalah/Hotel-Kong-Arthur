# Hotel Kong Arthur Constitution

## Core Principles

### I. Assignment Compliance (NON-NEGOTIABLE)

Every implemented feature MUST satisfy the documented assignment requirements. The specification in `specs/Specify` is the authoritative source of truth for all functional and non-functional requirements. Mandatory requirements from `specs/Specify` and `UserStories.txt` cannot be silently removed, weakened, or bypassed. Every user story MUST have testable acceptance criteria that are verified before the story is considered complete. The Definition of Done from `specs/Specify` Section 11 MUST be followed for all work.

**Rationale**: This is a university assignment with explicit grading criteria. Non-compliance risks failing the assignment.

### II. Three-Layer Architecture (NON-NEGOTIABLE)

The backend MUST maintain a clear three-layer architecture consisting of: Presentation/API, Business Logic, and Data Access layers. The Presentation Layer (routes) handles HTTP requests and responses only and MUST NOT contain business logic. The Business Logic Layer (services) contains all domain rules, validations, and calculations, and MUST NOT make direct HTTP responses or database calls. The Data Access Layer (db) manages database connections and queries only and MUST NOT contain business rules. Layers MUST have clear, well-defined interfaces for communication. Cross-layer coupling MUST be minimized.

**Rationale**: The assignment explicitly requires three-layer architecture (NFR-01). This principle ensures maintainability, testability, and separation of concerns.

### III. API Contract Integrity (NON-NEGOTIABLE)

The backend MUST expose all functionality through a REST API using JSON format. The API contract MUST be documented using OpenAPI 3.0.x specification. OpenAPI documentation MUST be accessible through Swagger UI at `/api-docs` when the application is running. API documentation MUST remain consistent with the implementation. All endpoints MUST have documented request/response schemas, status codes, error formats, and examples. Breaking changes to the API MUST be avoided; if absolutely necessary, they require group approval, versioning, and migration planning.

**Rationale**: The assignment requires REST API with OpenAPI and Swagger UI (FR-12, NFR-02). Consistent API documentation is essential for the Tableau dashboard integration.

### IV. Database Standard (NON-NEGOTIABLE)

MySQL MUST be used as the primary database for the application. Database schema changes MUST be deliberate, maintainable, and consistent with application requirements and the assignment specifications. All database schema and seed data files MUST be version-controlled. Sample data MUST be provided for demonstration purposes. Production-like data structures MUST support all required metrics and calculations from `specs/Specify` Sections 6.1 and 6.2. Data integrity constraints MUST be enforced at the database level where appropriate.

**Rationale**: The assignment explicitly requires MySQL (NFR-03). Data structure decisions affect all analytics features.

### V. Containerization Requirement (NON-NEGOTIABLE)

The complete application MUST run using Docker and Docker Compose. The required system MUST be startable using a single `docker compose up` command from the repository root. All services (MySQL, backend, frontend) MUST be defined in the Docker Compose configuration. Health checks MUST be configured for all services to ensure proper startup ordering. The system MUST be fully reproducible from a fresh clone using only the documented setup procedure. Container images MUST be kept minimal and production-like.

**Rationale**: The assignment requires Docker-based execution (FR-13, NFR-04, NFR-05). Reproducibility is essential for grading.

### VI. Data Analytics Accuracy (NON-NEGOTIABLE)

The system MUST support all required hotel and cocktail bar metrics specified in `specs/Specify` Functional Requirements FR-03 through FR-10. All calculations MUST have explicit, documented definitions addressing the business rules BR-01 through BR-07. Undefined business rules MUST NOT be silently assumed; all calculations MUST be traceable to documented definitions. Metric calculations MUST be verifiable against underlying data. The solution MUST support the data required by the interactive Tableau dashboard (FR-11). Historical data from the provided CSV/Excel files MUST be importable and usable.

**Rationale**: Analytics are the core of the assignment. Invented data or undefined calculations would produce incorrect results and fail verification.

### VII. Booking Management Preservation (NON-NEGOTIABLE)

The browser-based frontend MUST support creating, viewing, updating, and deleting bookings through the backend API. Existing working booking functionality MUST be preserved; it can be refactored when adding new features, but MUST NOT be broken or have reduced functionality. Booking data integrity MUST be maintained (no orphaned records, valid date ranges, proper status transitions). The booking system MUST remain fully functional throughout the development of new features.

**Rationale**: The existing booking CRUD is complete and working. Breaking it would violate the assignment requirement for a functional booking system.

### VIII. Technology Flexibility

Node.js with Express and MySQL is the CURRENT backend implementation. This is NOT a mandatory architectural principle. The team CAN introduce other languages, frameworks, or tools for new features (e.g., Python for analytics) if the group reaches consensus. However, any new technology introduction MUST be justified, documented, and MUST NOT break existing functionality or violate other principles. The existing Node.js backend for booking management MUST remain operational.

**Rationale**: Group decision D1=B. This allows flexibility for implementing analytics features while preserving the working booking system.

### IX. Code Quality Standard

All code MUST be clear, maintainable, and follow consistent naming conventions. JavaScript code MUST use camelCase. SQL identifiers MUST use snake_case. All inputs MUST be validated and errors handled appropriately with meaningful error messages. Suitable tests MUST be added for all new and changed functionality; test coverage MUST verify both happy paths and error conditions. Unnecessary dependencies MUST be avoided. Unrelated refactoring MUST be minimized during feature development. Code reviews MUST verify compliance with these standards before merging.

**Rationale**: Maintains code health and reduces technical debt. Group decision D3=A makes tests mandatory.

### X. Code Evolution Policy

Existing working code (specifically the booking CRUD implementation) MUST have its functionality preserved. However, code CAN be refactored when adding new features or fixing bugs, provided that all existing functionality continues to work correctly and all tests pass. Refactoring MUST be justified and documented. Structural changes that affect multiple features require group discussion and approval.

**Rationale**: Group decision D2=B. This balances the need for code quality with the requirement to preserve working functionality.

### XI. Documentation Consistency

README.md, CONTRIBUTE.md, OpenAPI specification, and architecture documentation MUST remain consistent with the implementation. README.md MUST contain an architecture diagram as required by the assignment. API documentation MUST be kept up-to-date with implementation changes. All specifications (`specs/Specify`, Spec Kit artifacts in `.specify/`) MUST be maintained and version-controlled. Documentation updates MUST accompany code changes that affect documented behavior. Documentation MUST be written for both technical and non-technical stakeholders where appropriate.

**Rationale**: Clear documentation is required by the assignment (NFR-08) and essential for maintainability and grading.

## Development Workflow

### Specification-Driven Development

The team MUST follow the Spec Kit workflow for all new features: Constitution → Specify → Clarify → Plan → Tasks → Implement → Converge. Every feature MUST have a specification document before implementation begins. Clarification questions MUST be documented in the specification and answered before implementation. The `specs/Specify` document remains the master specification; any conflicts with generated Spec Kit artifacts MUST be resolved in favor of `specs/Specify` unless the group explicitly amends it.

### Implementation Process

Before implementing any feature, the team MUST verify that its requirements are clearly defined in `specs/Specify` or a generated Spec Kit specification. Implementation MUST be traceable to specific acceptance criteria. After major implementation phases, Converge MUST be run to verify completeness against the specification. All pull requests MUST reference the specific requirements being implemented.

### Branch and Review Strategy

Feature development SHOULD use feature branches. Pull requests MUST include: a clear description, references to the specification, screenshots or demonstration for UI changes, and verification that acceptance criteria are met. Code reviews MUST verify: compliance with this constitution, code quality standards, test coverage, and proper documentation updates. No code affecting the booking system can be merged without verification that existing functionality remains intact.

## Additional Constraints

### Data Handling

All historical data from the provided CSV and Excel files MUST be importable into the system. The import process MUST be documented. Data used for demonstrations MUST be clearly identified as either historical (from provided files) or sample (created for demonstration). The system MUST NOT present invented transactions as verified historical sales without clear disclaimers.

### Testing

All new functionality MUST have corresponding tests. Tests MUST verify: normal operation, edge cases, error handling, and data integrity. Existing code that is modified MUST have its tests updated. The test suite MUST be runnable locally and in CI/CD if configured. Test data MUST be isolated from production-like data.

### External Integrations

The Tableau dashboard integration MUST use data from the backend API. API endpoints specifically for Tableau MUST follow the same architectural principles as other endpoints. The dashboard MUST be able to retrieve all required metrics in a format suitable for Tableau consumption.

## Governance

This Constitution supersedes all other practices and documentation for the Hotel Kong Arthur project. All project participants MUST comply with these principles. Amendments to this Constitution require group discussion, documentation of the change rationale, and explicit approval from all team members. The Constitution version follows semantic versioning: MAJOR for backward-incompatible governance changes, MINOR for new principles or material expansions, PATCH for clarifications and wording improvements. All amendments MUST be documented in the version history.

**Version**: 1.0.0 | **Ratified**: 2026-10-28 | **Last Amended**: 2026-10-28
