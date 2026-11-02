# Byggevejledning: Tableau-dashboard

Vejledningen dækker T054 og T055 (AC-13.1 til AC-13.6). Alle tal er beregnet af backenden, så der skal ikke laves beregnede felter i Tableau (constitution VIII).

Regn med 1-2 timer. Del gerne arkene ud i gruppen, så I alle kan forklare dem.

## Før du starter

1. Start systemet: `docker-compose up -d --wait`.
2. Tjek, at `extracts\tableau_data.hyper` findes.

## Vigtigt om filen

- **Tableau kan låse filen.** Eksporten gemmer ikke, når filen er låst, og prøver igen hvert minut. Så længe du bygger, får du derfor måske ikke nye tal, og det er i orden.
- **Brug Live, ikke Extract.** En Extract-kopi løste ikke låsen.
- **Sæt kun én tabel på hver datakilde.** Tabellerne har ingen fælles felter at koble på, og flere af dem hedder `Revenue Dkk`.
- **Brug aldrig `Total Dkk` i en `revenue_by_*`-tabel.** Det står på hver række og bliver for stort, når det summeres. Brug `Revenue Dkk`.

## Sådan laver du en datakilde

Gentag for hver tabel i oversigten herunder:

1. Vælg **Data → New Data Source → To a File → More...**, og åbn `extracts\tableau_data.hyper`.
2. Hvis der ligger en anden tabel på lærredet, så vælg pilen på tabellen og **Remove**.
3. Træk tabellen fra listen ind på lærredet.
4. Lad **Connection** stå på **Live**.

Hurtigere: højreklik på en færdig datakilde, vælg **Duplicate**, og skift tabellen ud.

## De 12 ark

Opret et ark med **New Worksheet**, vælg datakilden i listen til venstre, og giv arket navnet herunder. "Rows" og "Columns" er felterne øverst, og "Text" og "Color" ligger i boksen **Marks**.

### Hotel

| Nr. | Arkets navn | Tabel | Sådan bygges det |
|---:|---|---|---|
| 1 | Indtjening pr. værelsestype | `revenue_by_type` | Rows: `Group`. Columns: `Revenue Dkk`. Sortér faldende. Label: `Revenue Dkk` |
| 2 | Indtjening pr. type og sæson | `revenue_by_type_season` | Rows: `Room Type`. Columns: `Season`. Color og Text: `Revenue Dkk`. Filter: `Season` og `Room Type` |
| 3 | Indtjening pr. land | `revenue_by_country` | Rows: `Group`. Columns: `Revenue Dkk`. Sortér faldende. Filter: `Group` |
| 4 | Ophold pr. land | `guests_by_country` | Rows: `Country`. Columns: `Stays Count`. Sortér faldende. Filter: `Country` |
| 5 | Årets indtjening | `revenue_annual` | Text: `Revenue Dkk` og `Year` |
| 6 | Løbende indtjening | `revenue_running` | Text: `Revenue Dkk` og `Bookings Count` |
| 7 | Belægning pr. måned | `occupancy_by_month` | Columns: `Period Start`. Rows: `Occupancy Pct`. Vælg Line under **Marks**. Filter: `Period Start` |
| 8 | Kundetilfredshed | `satisfaction_year` | Text: `Average Rating`, `Rating Count` og `Period Start` |
| 9 | RevPAR og ADR | `revpar_year` | Text: `Revpar Dkk`, `Adr Dkk` og `Period Start` |

### Cocktailbar

| Nr. | Arkets navn | Tabel | Sådan bygges det |
|---:|---|---|---|
| 10 | Helene Christines salg | `bar_helene_sales` | Text: `Total Dkk`, `Units Sold` og `Year` |
| 11 | Omsætning pr. drink | `bar_sales_by_drink` | Rows: `Drink`. Columns: `Revenue Dkk`. Color: `Category`. Sortér faldende. Filter: `Category` |
| 12 | Cocktails og kaffe | `bar_distribution` | Rows: `Measure Names` filtreret til `Revenue Share Pct` og `Unit Share Pct`. Columns: `Measure Values`. Color: `Category`. Label: `Measure Values` |

**Tre detaljer:**

- **`Year`:** hvis den viser 2.025, så højreklik på den, og vælg **Dimension**, så den vises som 2025.
- **Sortering:** klik på sorteringsikonet på aksen.
- **Procenter:** `Revenue Share Pct` er allerede en procent (52,8), så den skal ikke ganges med 100 eller formateres som procent.

## Titler (AC-13.4)

Hvert ark skal vise, hvad tallet er, og hvilken periode det gælder. Dobbeltklik på titlen og skriv fx:

| Ark | Titel |
|---|---|
| 1-4 | Historiske ophold (2025) og nye bookinger |
| 5 | Årets indtjening (brug feltet `Year` i titlen) |
| 6 | Løbende indtjening fra nye bookinger |
| 7-9 | Nye bookinger, indeværende år |
| 10-12 | Barsalg 2025 (antagelse) |

## Dashboards

1. Vælg **New Dashboard**, kald det **Hotel**, og træk ark 1-9 ind.
2. Vælg **New Dashboard**, kald det **Cocktailbar**, og træk ark 10-12 ind.
3. Vis filtrene: klik på et ark, vælg pilen, så **Filters**, og vælg feltet.
4. Tilføj et tekstfelt med **Text** på begge dashboards:

   > Tallene er beregnet i backenden. Tableau opdateres ved eksport og genindlæsning, så dashboardet er ikke real-time. Værelser, år og barsalg er antagelser, se README.

## Gem

1. **Til demoen:** vælg **File → Save As**, og gem som `tableau\dashboard\hotel_dashboard.twb` (Tableau Workbook).
2. **Til afleveringen:** vælg **File → Save As**, og gem som `tableau\dashboard\hotel_dashboard.twbx` (Tableau Packaged Workbook).

Demoen skal køre på `.twb`, som læser filen i `extracts`. Vi har ikke testet, om `.twbx` henter nye tal.

Flyttes `.twb` til en anden computer, kan Tableau spørge efter filen. Vælg så `extracts\tableau_data.hyper` på den computer.

## Kontrol (T055)

Sammenlign hvert ark med API'et:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\kontroltal.ps1
```

Tallene skal passe inden for 0,01 DKK og 0,1 procentpoint (BR-02). Arkene viser det seneste, eksporten har gemt, så luk Tableau, vent 70 sekunder, og åbn igen, før I sammenligner.

## Dækning af kravene

| Krav | Ark |
|---|---|
| Hvor gæsterne kommer fra | 4 |
| Indtjening pr. værelsestype og sæson | 1, 2 |
| Indtjening pr. land | 3 |
| Hvilke værelser og lande tjener mest | 1, 3 |
| Årets indtjening | 5 |
| Belægning | 7 |
| Kundetilfredshed | 8 |
| Selvvalgt nøgletal | 9 |
| Helenes salg for året | 10 |
| Omsætning pr. drink | 11 |
| Fordeling af cocktails og kaffe | 12 |
| Filtre (AC-13.3) | 2, 3, 4, 7, 11 |
