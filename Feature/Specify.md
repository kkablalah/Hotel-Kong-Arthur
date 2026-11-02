# Specify – driftsdashboard og booking-POC

## Formål og brugere

Hotellets beslutningstagere skal kunne følge belægning, værelsesindtægt, gæstetilfredshed og barens salgsmix. Receptionen skal kunne vedligeholde bookinger og registrere nye bartransaktioner og gæstevurderinger.

## User stories og acceptkriterier

### US1 – Bookinger
Som receptionist ønsker jeg at oprette, redigere og slette bookinger, så systemet viser den aktuelle reservationstilstand.

- Booking kan læses, oprettes, ændres og slettes via REST API og browser.
- Udtjekning skal ligge efter indtjekning; ugyldige data afvises med HTTP 400.
- Et værelse kan ikke bookes overlappende; konflikten afvises med HTTP 409.
- En booking har gæst, e-mail, værelsesnummer, datoer, status og pris pr. nat.

### US2 – Belægning og værelsesindtægt
Som hoteladministrator ønsker jeg at vælge en periode og se belægning og værelsesindtægt, så jeg kan følge driften.

- API og dashboard viser valgt datointerval, belægningsprocent, bookinger og indtægt i DKK.
- Hotelkapaciteten er 214 værelser; belægning beregnes som optagne værelsesnætter / (214 × antal kalenderdage).
- Annullerede bookinger tæller ikke med. Datoerne i filteret er inklusive; udtjekningsdatoen tæller ikke som en overnatning.
- Historiske ophold vises særskilt fordelt på sæson og værelsestype; de blandes ikke med live-tal uden kalenderdatoer.

### US3 – Barens salgsmix
Som baransvarlig ønsker jeg at se fordelingen af cocktails og kaffe, så jeg kan forstå efterspørgslen på menuen.

- Dashboardet viser alle 20 cocktails og 10 kaffetyper med solgte enheder og procentandel inden for egen kategori.
- Nye salg kan registreres med produkt, antal og medarbejder og påvirker dashboardet uden genstart.
- Excel-tallene vises som historisk baseline; de tilskrives ikke en bestemt medarbejder.

### US4 – Gæstetilfredshed
Som hoteladministrator ønsker jeg at se gennemsnittet af gæsternes vurderinger, så jeg kan følge tilfredsheden.

- Feedback kan registreres på en skala fra 1 til 5.
- Dashboardet viser gennemsnit og antal svar; uden svar vises “Ingen data”.

### US5 – Livevisning og API
Som beslutningstager ønsker jeg at se opdaterede nøgletal, så dashboardet afspejler nye registreringer.

- Browseren genindlæser driftsdata mindst hvert 15. sekund.
- OpenAPI-kontrakten tilgås via Swagger UI.
- Frontend, backend og MySQL kan startes med Docker Compose.

## Ikke-funktionelle krav

- Input valideres i backend; SQL forespørgsler bruger parametre.
- Prototypevisningen er responsiv og anvendelig i en almindelig browser.
- KPI'er præsenteres med tydelige enheder og periode.