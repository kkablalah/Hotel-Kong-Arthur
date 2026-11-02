-- 04_rooms_seed.sql: de 214 vaerelser. ANTAGELSE TIL UNDERVISER, ikke hotellets rigtige fordeling.
-- Antal pr. type: de 214 vaerelser er fordelt efter antal ophold pr. type i stays.
-- Kapacitet pr. type: "Max antal gaester" paa arthurhotels.dk/hotel-kong-arthur/vaerelser/,
-- hoejst 4 som i opgaven, saa LOFT Suite er 4 (hotellet oplyser 5).
-- Vaerelsesnumrene er kun loebenumre. Se docs/beslutninger.md, B-46 og B-47.
--
-- Ret tallene i listen herunder. Summen af antal skal vaere 214. Aendringer slaar
-- igennem efter docker-compose down -v, som ogsaa sletter nye bookinger.

INSERT INTO rooms (room_number, room_type_id, capacity)
WITH RECURSIVE
  fordeling (room_type, antal, kapacitet) AS (
    SELECT 'Standard Single', 25, 1
    UNION ALL SELECT 'Grand Lit', 25, 2
    UNION ALL SELECT 'Standard Double', 25, 2
    UNION ALL SELECT 'Superior Double', 29, 3
    UNION ALL SELECT 'Junior Suite', 29, 4
    UNION ALL SELECT 'Spa Executive', 30, 2
    UNION ALL SELECT 'Suite', 29, 4
    UNION ALL SELECT 'LOFT Suite', 22, 4
  ),
  tal (n) AS (
    SELECT 1
    UNION ALL SELECT n + 1 FROM tal WHERE n < 214
  )
SELECT ROW_NUMBER() OVER (ORDER BY t.room_type_id, tal.n), t.room_type_id, f.kapacitet
FROM fordeling f
JOIN tal ON tal.n <= f.antal
JOIN room_types t ON t.name = f.room_type
ORDER BY t.room_type_id, tal.n;
