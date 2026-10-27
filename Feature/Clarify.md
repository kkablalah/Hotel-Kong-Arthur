# Clarify: Booking-POC

## Afgrænsning

Denne POC dækker oprettelse, visning, rettelse og sletning af bookinger i browseren. Bookingdata gemmes i MySQL. Analysefunktioner, Tableau, login, betaling og integration til hotellets produktionssystem er uden for POC'en.

## Beslutninger

### Bookingfelter og validering

Bookingens felter følger den eksisterende kode og API-kontrakt: `guestName`, `email`, `roomNumber`, `checkIn`, `checkOut` og `status`.

- `guestName`: påkrævet tekst, må ikke være tom.
- `email`: påkrævet og skal have gyldigt e-mailformat.
- `roomNumber`: påkrævet heltal større end 0.
- `checkIn` og `checkOut`: påkrævede gyldige datoer; `checkOut` skal være efter `checkIn`.
- `status`: `confirmed`, `cancelled`, `checked_in` eller `checked_out`. Ved oprettelse bruges `confirmed`, hvis status udelades.

Backend håndhæver valideringen for både POST og PUT og svarer med HTTP 400 og en forståelig fejl ved ugyldige data. Frontendens formularvalidering er en hjælp, ikke den eneste kontrol.

### Opdatering

`PUT /api/bookings/{id}` modtager hele bookingens feltsæt. Frontenden sender alle felterne ved rettelse. Backend validerer og gemmer bookingens samlede værdier. Hvis ID'et ikke findes, returneres HTTP 404.

### Browser til backend i Docker

Frontend beholder den relative API-adresse `/api/bookings`. Nginx serverer frontend og videresender `/api/`-kald til backend-servicen på port 3000. Frontend og backend forbindes på Docker Compose-netværket; browseren bruger frontendens adresse.

### Persistens

MySQL bruger en Docker-volumen til datadir, så bookinger bevares ved genstart af containere.

## Afklaringsstatus

Ovenstående beslutninger er tilstrækkelige til booking-POC'en. Specifikationens øvrige spørgsmål om sæsoner, belægning, omsætning, baromsætning og Tableau ligger uden for denne afgrænsning.
