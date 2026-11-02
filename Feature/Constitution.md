# Constitution – Hotel Kong Arthur

## Faste principper

1. Backendens præsentationslag eksponerer REST-endpoints med JSON.
2. Arkitekturen holdes i tre lag: routes (præsentation), services (forretningslogik) og SQLite (data).
3. API-kontrakten dokumenteres i OpenAPI og udstilles via Swagger UI.
4. Systemet bruger SQLite og skal kunne startes samlet med Docker Compose.
5. Validering og forretningsregler håndhæves i backend, også når data sendes uden om browseren.
6. Målinger skal vise deres datagrundlag og antagelser; manglende data må ikke fremstilles som faktiske målinger.
7. Prototypen skal kunne demonstreres lokalt uden eksterne SaaS-afhængigheder.

## Afgrænsning

Prototypen demonstrerer booking-CRUD, driftsnøgletal, registrering af barsalg og gæstefeedback. Tableau-publicering, produktionssikkerhed, betalinger og integration til hotellets eksisterende systemer er ikke en del af POC'en.