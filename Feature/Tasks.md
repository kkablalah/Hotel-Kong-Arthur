
# Tasks – POC

## US1: Bookinger
- [x] Behold eksisterende booking-CRUD og dokumentér bookingfelter i API-kontrakten.
- [x] Beregn pris pr. nat og afvis ugyldige datoer eller overlappende værelsesbookinger.
- [x] Vis bookingformular og redigering/sletning i browseren.

## US2: Driftsnøgletal
- [x] Beregn belægning for et inklusivt datointerval med 214 værelser som kapacitet.
- [x] Beregn værelsesindtægt fra pris pr. nat og overlappende overnatninger.
- [x] Gør nøgletal tilgængelige via REST og vis dem i dashboardet.
- [x] Vis sæsonfordelt historisk omsætning separat fra live-belægningen.

## US3: Bar
- [x] Indlæs de 20 cocktail- og 10 kaffeposter som historisk baseline.
- [x] Registrer live-salg i MySQL og vis procentfordelingen pr. produkt og kategori.
- [x] Vis tydeligt at baseline ikke kan henføres til Helene Christine.

## US4/US5: Feedback og drift
- [x] Registrer vurderinger og vis gennemsnit/antal eller “Ingen data”.
- [x] Opdater browserdashboardet automatisk hvert 15. sekund.
- [x] Proxy API og Swagger UI gennem frontend-containerens Nginx.
- [x] Dokumentér API'et og Docker Compose-start.
- [x] Byg containere og verificér booking-CRUD, validering, barsalg, feedback og analytics via API.
- [ ] Afklar/publish et interaktivt Tableau-dashboard.
- [ ] Importér tidsstemplede hotel- og tilfredshedsdata fra kildesystemer.
- [ ] Tilføj tests og produktionsmæssig adgangskontrol.
