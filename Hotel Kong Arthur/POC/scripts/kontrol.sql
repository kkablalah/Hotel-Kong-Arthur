-- Kontrol af startdata. Bruges af scripts/verificer.ps1. Forventede tal står i kolonnen forventet.
SELECT 'countries' AS tabel, COUNT(*) AS antal, 20 AS forventet FROM countries
UNION ALL SELECT 'drink_categories', COUNT(*), 2 FROM drink_categories
UNION ALL SELECT 'drinks', COUNT(*), 30 FROM drinks
UNION ALL SELECT 'room_types', COUNT(*), 8 FROM room_types
UNION ALL SELECT 'stays', COUNT(*), 1000 FROM stays
UNION ALL SELECT 'stays_detailed (view)', COUNT(*), 1000 FROM stays_detailed
UNION ALL SELECT 'drink_sales (view)', COUNT(*), 30 FROM drink_sales
UNION ALL SELECT 'rooms', COUNT(*), 214 FROM rooms
UNION ALL SELECT 'bookings', COUNT(*), 0 FROM bookings
UNION ALL SELECT 'customer_satisfaction', COUNT(*), 0 FROM customer_satisfaction;

-- 4DC3BC6C6C6572 er Müller i UTF-8. Så er tegnsættet rigtigt, uanset hvad konsollen viser.
SELECT family_name, HEX(family_name) AS hex, '4DC3BC6C6C6572' AS forventet FROM stays WHERE stay_id = 21;

SELECT t.name AS vaerelsestype, COUNT(*) AS vaerelser, MIN(r.capacity) AS kapacitet
FROM rooms r JOIN room_types t ON t.room_type_id = r.room_type_id
GROUP BY t.name ORDER BY t.name;

SELECT SUM(days_rented) AS naetter, 5379 AS forventet FROM stays;
SELECT SUM(price) AS vaerelsesindtjening_dkk, '11234034.00' AS forventet FROM stays;
SELECT SUM(revenue_dkk) AS baromsaetning_dkk, '13448640.34' AS forventet FROM drink_sales;
