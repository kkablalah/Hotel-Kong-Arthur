# Kontrakt: ændringer i `openapi/openapi.yaml`

Ingen nye stier og ingen nye felter i svarene (FR-002, FR-015). Kontrakten og koden ændres i samme commit (constitution III).

## Version

`info.version` går fra `0.4.0` til `0.5.0`.

## Grænser

| Sted i kontrakten | Ændring |
|---|---|
| `id` i `/api/bookings/{id}` og `/api/bookings/{id}/satisfaction` | `maximum: 2147483647` |
| `room_id` i `GET /api/bookings` | `maximum: 2147483647` |
| `BookingInput.room_id`, `BookingInput.country_id` | `maximum: 2147483647` |
| `BookingInput.total_price` | `maximum: 9999999999.99` |
| `BookingInput.first_name`, `family_name`, `RatingInput.comment` | `pattern`, der afviser nulbytes |
| `RequiredStartDate`, `RequiredEndDate`, `OptionalStartDate`, `OptionalEndDate`, `BookingInput.check_in_date`, `check_out_date` | `pattern`, der afviser år 0000, ud over `format: date` |

De eksisterende `enum` og heltalstyper afviser allerede nulbytes i de øvrige forespørgselsparametre. Det kontrolleres i `invalid-values.test.js`.

Følgende bevares: `aar` er 1000 til 9999, og `guest_count` er 1 til 4.

## Validatoren

`backend/src/presentation/app.js` sætter `ajvFormats` til `mode: 'full'`. `fast` er standard og godkender 30. februar.

## Fejlsvar

Alle endpoints med de felter, der er nævnt ovenfor, har allerede `400` med `Error`-formatet. Det kontrolleres, at det er tilfældet for alle.

```text
{ "error": { "code": "VALIDATION_ERROR", "message": "Ugyldigt input", "details": [...] } }
```

## Tekst

| Endpoint | Tekst, der tilføjes |
|---|---|
| `getRevenue`, `getCocktailProducts`, `getCocktailDistribution` | Sorteret faldende efter omsætning, ved lige værdier stigende efter navn (FR-003, FR-029) |
| `getGuestsByCountry` | Sorteret faldende efter antal ophold, ved lige værdier stigende efter land (FR-029) |
| `info.description` | De nye grænser og reglen om lige værdier |

## Uændret

Stier, metoder, statuskoder for gyldige kald og alle svarskemaer.
