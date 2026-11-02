# Start her

Sådan får du systemet op at køre på en ny computer.

## Det skal du bruge

- Docker Desktop, som skal være startet
- Internet første gang, fordi Docker henter billeder
- Tableau Desktop til dashboardet

## Start systemet

Åbn PowerShell i mappen med denne fil:

```powershell
Copy-Item .env.example .env
```

Skift de to adgangskoder i `.env`, og kør så:

```powershell
docker-compose up --build
```

Første opstart kan tage flere minutter, fordi databasen oprettes.

| Hvad | Hvor |
|---|---|
| Bookingside | http://localhost:3000 |
| Swagger UI | http://localhost:8080 |
| API | http://localhost:8000 |
| Tableau-fil | `extracts\tableau_data.hyper`, opdateres hvert 60. sekund |

## Kontrollér, at alt virker

**Scriptet sletter databasen**, også nye bookinger, og starter forfra:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\verificer.ps1
```

Alle tests skal bestå, og tallene skal svare til kolonnen `forventet`.

## Luk ned

| Kommando | Hvad sker der |
|---|---|
| `docker-compose down` | Stopper systemet og beholder data |
| `docker-compose down -v` | Stopper systemet og sletter databasen |

## Det mangler I selv

- **Git:** opret et GitHub-repository i denne mappe, og lad alle 5 committe under eget navn. `.env` kommer ikke med.
- **Tableau-dashboard:** følg `tableau\dashboard\BYGGEVEJLEDNING.md`.
- **AI-beslutninger:** udfyld kolonnen "Status" i `docs\ai-decisions.md`.

Demoforløbet står i `docs\demo.md`. Antagelserne til underviseren står i `README.md`, og status står i `specs\hotel-kong-arthur\converge-resultat.md`.
