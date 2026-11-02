# Clarify – beslutninger og åbne punkter

| Emne | POC-beslutning |
|---|---|
| “Live” | Nye API-registreringer gemmes straks i SQLite; browser-dashboardet henter igen hvert 15. sekund. |
| Belægningsperiode | `from` og `to` er inklusive kalenderdatoer. En booking optager nætter fra check-in til, men ikke inklusive, check-out. |
| Belægningsformel | Unikke værelsesnætter i perioden divideret med 214 gange periodens antal dage. Annullerede bookinger udelades. |
| Indtægt | Registreret pris pr. nat gange antal overlappende nætter. Dette er bookingindtægt, ikke dokumenteret betalt indtægt. |
| Sæson | Regnearket har sæsonetiketter, men bookingdatoer mangler. Sæsonanalyse er derfor ikke implementeret i POC'en. |
| Barhistorik | Excel-filen indeholder aggregerede mængder og priser, men ingen salgstidspunkter eller medarbejder. De er historisk baseline. |
| Helene Christine | Nye registreringer fra POC-dashboardet tilskrives Helene Christine og hendes procentfordeling beregnes særskilt fra live-salg. Baseline kan ikke opdeles på medarbejdere. |
| Tilfredshed | Kildedata indeholder ingen vurderinger. POC'en indsamler nye vurderinger fra 1 til 5; historisk tilfredshed vises ikke. |
| Tableau | Opgaven efterspørger et interaktivt Tableau-dashboard. POC'en leverer et browserdashboard og API-data; en Tableau-workbook kræver Tableau Desktop/Server og er ikke inkluderet. |
| Database | Kravet om ikke at bruge MySQL løses med SQLite som vedvarende databasefil i Docker-volume. Der er ingen databasecontainer. |
| Analyse-API | Analyseberegninger udstilles som separate GET-endpoints; overview-endpointet beholdes for bagudkompatibilitet. |

## Afklaringer til næste iteration

- Skal værelsespriser og bookingindtægt følge hotellets faktiske pris-/sæsonmodel?
- Skal barsalg have medarbejdervalg og kunde-/transaktions-ID fra et kassesystem?
- Hvilken Tableau-version og publiceringsplatform skal bruges til den afleveringsklare workbook?
- Skal allerede indtastede data fra den tidligere MySQL-volume migreres til SQLite?
- Hvilken kanal og samtykkeproces skal bruges til at indsamle gæstefeedback?