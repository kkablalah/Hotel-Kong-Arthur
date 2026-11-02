# Quickstart: validering i Converge

Sådan bevises kravene, når implementeringen er færdig. Resultatet skrives i `converge-resultat.md`. Kør fra `Hotel Kong Arthur/POC/`.

**Advarsel**: `docker-compose down -v` sletter alle nye bookinger og ratings.

## Forudsætninger

- Docker Desktop kører.
- `.env` er kopieret fra `.env.example`.
- Tagget `v1-mysql` findes.
- Underviserens svar om PostgreSQL 18 er noteret.

## 1. Ren opstart, kontroltal og tests

```text
powershell -ExecutionPolicy Bypass -File scripts\verificer.ps1
```

| Forventet | Krav |
|---|---|
| Alle services er sunde inden for 5 minutter | SC-009 |
| 1000 ophold, 5379 nætter, 11234034.00 DKK, 13448640.34 DKK | SC-001 |
| Cocktails 52,8 % og 34,5 %, kaffe 47,2 % og 65,5 % | SC-001 |
| 20 lande, 2 kategorier, 30 drikke, 8 typer og 214 værelser. Müller er `4DC3BC6C6C6572` | SC-003 |
| Alle tests består, også `invalid-values.test.js` og `tie-order.test.js` | SC-007, SC-008, SC-011, FR-029 |
| Første booking får id 1 | Afsnit 2 i planen |

## 2. Sammenligning med `v1-mysql`

```text
git worktree add <midlertidig mappe> v1-mysql
docker-compose -p hka-v1 up -d --build --wait      (i version 1's POC-mappe, med dens egen .env)
powershell -File scripts\optag-svar.ps1 -Mappe <svar-v1>
docker-compose -p hka-v1 down -v
docker-compose down -v
docker-compose up -d --wait
powershell -File scripts\optag-svar.ps1 -Mappe <svar-nyt> -Gentagelser 10
powershell -File scripts\sammenlign-svar.ps1 -V1 <svar-v1> -Nyt <svar-nyt>
git worktree remove <midlertidig mappe>
```

**Forventet**: 100 % ens, bortset fra `created_at` og `updated_at`. Rækker med samme sorteringsværdi er sorteret efter FR-029. De 10 gentagelser er ens (SC-002).

## 3. Presentation og business

```text
git diff v1-mysql -- backend/src/presentation backend/src/business
```

**Forventet**: Kun de filer, der står i planens afsnit 8. Hver ændring kobles til FR-021 eller FR-029 (FR-017).

## 4. Tableau-eksporten

Læs de 16 tabeller fra `.hyper`-filen i begge systemer under punkt 2.

**Forventet**: Samme tabeller, kolonner og værdier, højst 30 sekunder, og `git diff v1-mysql -- tableau` er tom (SC-010).

## 5. Nøgletalssiden

Åbn http://localhost:3000/noegletal.html, og hold browserens netværkslog åben.

| Handling | Forventet | Krav |
|---|---|---|
| Åbn siden | "Standard", 13 af 13 beregninger inden for 5 sekunder, 11.234.034,00 DKK for 2025 og 13.448.640,34 DKK | SC-005 |
| Læs N7-N10 | "Ingen data" og ingen 0 | FR-008 |
| Læs netværksloggen | Kun sidens egne filer og `/api` | SC-006 |
| Vælg 2025 og "Hele året" | Forklaringen viser forskellen på N6 og N1-N5 | FR-007 |
| Opret en booking, og tryk "Opdater" | Ændringen ses, og valgene er bevaret | FR-010 |
| Stop backenden, og tryk "Opdater" | "Kunne ikke hente tallet" og ingen gamle tal | FR-008 |
| Sammenlign med API'et | 13 af 13 er ens eller "Ingen data" efter reglen | SC-005 |

## 6. Demodata

```text
powershell -ExecutionPolicy Bypass -File scripts\demodata.ps1 -Indlaes
```

| Forventet | Krav |
|---|---|
| 150 bookinger, 900 nætter, mindst 782 (784 i skudår) | SC-013 |
| Siden viser "Indeholder demodata", og N7-N10 har værdier | FR-027 |
| 1000 ophold, 5379 nætter, 11234034.00 DKK for 2025 og alle bartal er uændrede | FR-028 |
| Ny kørsel af `-Indlaes` opretter intet | Edge Cases |

```text
powershell -ExecutionPolicy Bypass -File scripts\demodata.ps1 -Fjern
```

**Forventet**: "Indeholder demodata" er væk, og alle 13 beregninger er som før indlæsningen (SC-013).

## 7. Dokumentation

Søg efter `mysql` i `README.md`, `START-HER.md`, `CONTRIBUTE.md`, `docs/demo.md` og `scripts/`.

**Forventet**: Ingen vejledning beskriver MySQL som den database, systemet bruger (FR-020). Historik i `docs/beslutninger.md` og `docs/ai-decisions.md` må gerne nævne MySQL.
