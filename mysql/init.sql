CREATE DATABASE IF NOT EXISTS hotel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hotel_db;

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guest_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  room_number INT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status ENUM('confirmed', 'cancelled', 'checked_in', 'checked_out') DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_room (room_number),
  INDEX idx_status (status),
  INDEX idx_dates (check_in, check_out)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Eksempeldata til prototype
INSERT INTO bookings (guest_name, email, room_number, check_in, check_out, status) VALUES
('Anna Petersen', 'anna@example.com', 101, '2026-11-01', '2026-11-05', 'confirmed'),
('Lars Nielsen', 'lars@example.com', 202, '2026-11-10', '2026-11-12', 'checked_in'),
('Sofie Madsen', 'sofie@example.com', 305, '2026-11-15', '2026-11-20', 'confirmed');
