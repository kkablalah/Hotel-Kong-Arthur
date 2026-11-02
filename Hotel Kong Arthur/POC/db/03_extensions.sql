-- 03_extensions.sql: tabeller, som de leverede filer 01 og 02 ikke har.
-- Indlaeses efter 01_schema.sql og 02_data.sql ved foerste opstart.
-- Filen indeholder ingen data. De 214 vaerelser indsaettes af 04_rooms_seed.sql.
-- Se docs/beslutninger.md, B-15 til B-22.

SET NAMES utf8mb4;

CREATE TABLE `rooms` (
  `room_id` int unsigned NOT NULL AUTO_INCREMENT,
  `room_number` smallint unsigned NOT NULL,
  `room_type_id` smallint unsigned NOT NULL,
  `capacity` tinyint unsigned NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`room_id`),
  UNIQUE KEY `room_number` (`room_number`),
  KEY `fk_rooms_room_type` (`room_type_id`),
  CONSTRAINT `fk_rooms_room_type` FOREIGN KEY (`room_type_id`) REFERENCES `room_types` (`room_type_id`),
  CONSTRAINT `chk_rooms_capacity` CHECK (`capacity` BETWEEN 1 AND 4)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bookings` (
  `booking_id` int unsigned NOT NULL AUTO_INCREMENT,
  `room_id` int unsigned NOT NULL,
  `first_name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `family_name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country_id` smallint unsigned NULL COMMENT 'NULL vises som Ukendt (AC-08.4)',
  `guest_count` tinyint unsigned NOT NULL COMMENT 'Graensen for det enkelte vaerelse tjekkes i business-laget (FR-01)',
  `check_in_date` date NOT NULL,
  `check_out_date` date NOT NULL,
  `total_price` decimal(12,2) NOT NULL COMMENT 'DKK inkl. skatter og gebyrer (BR-02)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`booking_id`),
  KEY `fk_bookings_room` (`room_id`),
  KEY `fk_bookings_country` (`country_id`),
  CONSTRAINT `fk_bookings_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`),
  CONSTRAINT `fk_bookings_country` FOREIGN KEY (`country_id`) REFERENCES `countries` (`country_id`),
  CONSTRAINT `chk_bookings_guest_count` CHECK (`guest_count` BETWEEN 1 AND 4),
  CONSTRAINT `chk_bookings_dates` CHECK (`check_in_date` < `check_out_date`),
  CONSTRAINT `chk_bookings_price` CHECK (`total_price` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customer_satisfaction` (
  `satisfaction_id` int unsigned NOT NULL AUTO_INCREMENT,
  `booking_id` int unsigned NOT NULL,
  `rating` tinyint unsigned NOT NULL,
  `comment` varchar(500) COLLATE utf8mb4_unicode_ci NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`satisfaction_id`),
  KEY `fk_satisfaction_booking` (`booking_id`),
  CONSTRAINT `fk_satisfaction_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_satisfaction_rating` CHECK (`rating` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
