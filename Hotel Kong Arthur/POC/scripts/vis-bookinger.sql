-- De nyeste bookinger. Bruges i demoen for at vise, at data ligger i MySQL.
SELECT b.booking_id, r.room_number, t.name AS room_type, b.first_name, b.family_name,
       b.check_in_date, b.check_out_date, b.total_price
FROM bookings b
JOIN rooms r ON r.room_id = b.room_id
JOIN room_types t ON t.room_type_id = r.room_type_id
ORDER BY b.booking_id DESC
LIMIT 5;
