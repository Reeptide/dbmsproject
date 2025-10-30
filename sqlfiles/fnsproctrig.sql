-- ======================================================
-- Flight Management System
-- Fully MySQL 8.0 CE compatible version (no syntax errors)
-- ======================================================

USE flight_management;

-- ======================================================
-- STEP 1: Add missing columns & indexes safely (no IF ... THEN)
-- ======================================================

-- Add Capacity column to Flight
SELECT COUNT(*) INTO @col_exists
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'Flight'
  AND column_name = 'Capacity';
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE Flight ADD COLUMN Capacity INT DEFAULT 180',
  'SELECT "Capacity column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add Status to Booking
SELECT COUNT(*) INTO @col_exists
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'Booking'
  AND column_name = 'Status';
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE Booking ADD COLUMN Status ENUM("Booked","Cancelled") DEFAULT "Booked"',
  'SELECT "Booking.Status already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add Booking_Time to Booking
SELECT COUNT(*) INTO @col_exists
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'Booking'
  AND column_name = 'Booking_Time';
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE Booking ADD COLUMN Booking_Time DATETIME DEFAULT CURRENT_TIMESTAMP',
  'SELECT "Booking.Booking_Time already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add unique index (Flight_ID, Seat_No)
SELECT COUNT(*) INTO @idx_exists
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND table_name = 'Booking'
  AND index_name = 'ux_booking_flight_seat';
SET @sql := IF(@idx_exists = 0,
  'CREATE UNIQUE INDEX ux_booking_flight_seat ON Booking (Flight_ID, Seat_No)',
  'SELECT "Index ux_booking_flight_seat already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ======================================================
-- STEP 2: Create helper tables
-- ======================================================

CREATE TABLE IF NOT EXISTS Notifications (
  Notification_ID INT AUTO_INCREMENT PRIMARY KEY,
  Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
  Recipient_Type ENUM('Passenger','Staff','Airline') NOT NULL,
  Recipient_ID INT NOT NULL,
  Message TEXT NOT NULL,
  Is_Read BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS BookingAudit (
  Audit_ID INT AUTO_INCREMENT PRIMARY KEY,
  Booking_ID INT,
  Operation ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  Op_Time DATETIME DEFAULT CURRENT_TIMESTAMP,
  Details TEXT
);

CREATE TABLE IF NOT EXISTS StaffHistory (
  History_ID INT AUTO_INCREMENT PRIMARY KEY,
  Staff_ID INT NOT NULL,
  Old_Airport_ID INT,
  New_Airport_ID INT,
  Changed_At DATETIME DEFAULT CURRENT_TIMESTAMP,
  Notes VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS PassengerAudit (
  Audit_ID INT AUTO_INCREMENT PRIMARY KEY,
  Passenger_ID INT NOT NULL,
  Action ENUM('DELETE','UPDATE') NOT NULL,
  Action_Time DATETIME DEFAULT CURRENT_TIMESTAMP,
  Details TEXT
);

-- ======================================================
-- STEP 3: FUNCTIONS
-- ======================================================
DELIMITER $$

DROP FUNCTION IF EXISTS fn_GetAvailableSeats $$
CREATE FUNCTION fn_GetAvailableSeats(p_flight_id INT) RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_capacity INT DEFAULT 0;
  DECLARE v_booked INT DEFAULT 0;
  SELECT Capacity INTO v_capacity FROM Flight WHERE Flight_ID = p_flight_id;
  IF v_capacity IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT COUNT(*) INTO v_booked FROM Booking WHERE Flight_ID = p_flight_id AND Status = 'Booked';
  RETURN GREATEST(0, v_capacity - v_booked);
END$$

DROP FUNCTION IF EXISTS fn_PassengerBookingCount $$
CREATE FUNCTION fn_PassengerBookingCount(p_passenger_id INT) RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_count INT DEFAULT 0;
  SELECT COUNT(*) INTO v_count FROM Booking WHERE Passenger_ID = p_passenger_id AND Status = 'Booked';
  RETURN v_count;
END$$

DELIMITER ;

-- ======================================================
-- STEP 4: PROCEDURES
-- ======================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_CreateBooking $$
CREATE PROCEDURE sp_CreateBooking(
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100),
  IN p_email VARCHAR(150),
  IN p_phone VARCHAR(15),
  IN p_flight_no VARCHAR(20),
  IN p_seat_no VARCHAR(10),
  OUT p_booking_id INT
)
BEGIN
  DECLARE v_passenger_id INT;
  DECLARE v_flight_id INT;
  DECLARE v_status VARCHAR(20);
  DECLARE v_available INT;
  DECLARE v_msg TEXT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_booking_id = NULL;
  END;

  START TRANSACTION;

  SELECT Passenger_ID INTO v_passenger_id FROM Passenger WHERE Email = p_email LIMIT 1;
  IF v_passenger_id IS NULL THEN
    INSERT INTO Passenger (First_Name, Last_Name, Email, Phone)
    VALUES (p_first_name, p_last_name, p_email, p_phone);
    SET v_passenger_id = LAST_INSERT_ID();
  END IF;

  SELECT Flight_ID, Status INTO v_flight_id, v_status FROM Flight WHERE Flight_No = p_flight_no LIMIT 1;
  IF v_flight_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Flight not found';
  END IF;

  IF v_status = 'Cancelled' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot book a cancelled flight';
  END IF;

  IF EXISTS (SELECT 1 FROM Booking WHERE Flight_ID = v_flight_id AND Seat_No = p_seat_no AND Status = 'Booked') THEN
    SET v_msg = CONCAT('Seat ', p_seat_no, ' already booked on this flight');
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
  END IF;

  IF EXISTS (SELECT 1 FROM Booking WHERE Flight_ID = v_flight_id AND Passenger_ID = v_passenger_id AND Status = 'Booked') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Passenger already has a booking on this flight';
  END IF;

  SET v_available = fn_GetAvailableSeats(v_flight_id);
  IF v_available <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No seats available';
  END IF;

  INSERT INTO Booking (Date, Seat_No, Passenger_ID, Flight_ID, Status)
  VALUES (CURDATE(), p_seat_no, v_passenger_id, v_flight_id, 'Booked');
  SET p_booking_id = LAST_INSERT_ID();

  INSERT INTO BookingAudit (Booking_ID, Operation, Details)
  VALUES (p_booking_id, 'INSERT',
          CONCAT('Booked seat ', p_seat_no, ' for passenger ', v_passenger_id, ' on flight ', v_flight_id));

  COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_CancelFlight $$
CREATE PROCEDURE sp_CancelFlight(IN p_flight_no VARCHAR(20))
BEGIN
  DECLARE v_flight_id INT;
  START TRANSACTION;
  SELECT Flight_ID INTO v_flight_id FROM Flight WHERE Flight_No = p_flight_no LIMIT 1;
  IF v_flight_id IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Flight not found';
  END IF;
  UPDATE Flight SET Status = 'Cancelled' WHERE Flight_ID = v_flight_id;
  UPDATE Booking SET Status = 'Cancelled' WHERE Flight_ID = v_flight_id AND Status = 'Booked';
  COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_TransferStaff $$
CREATE PROCEDURE sp_TransferStaff(
  IN p_staff_id INT,
  IN p_new_airport_id INT,
  IN p_notes VARCHAR(255)
)
BEGIN
  DECLARE v_old_airport INT;
  SELECT Airport_ID INTO v_old_airport FROM Staff WHERE Staff_ID = p_staff_id LIMIT 1;
  IF v_old_airport IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Staff not found';
  END IF;
  UPDATE Staff SET Airport_ID = p_new_airport_id WHERE Staff_ID = p_staff_id;
  INSERT INTO StaffHistory (Staff_ID, Old_Airport_ID, New_Airport_ID, Notes)
  VALUES (p_staff_id, v_old_airport, p_new_airport_id, p_notes);
END$$

DELIMITER ;

-- ======================================================
-- STEP 5: TRIGGERS
-- ======================================================
DELIMITER $$

DROP TRIGGER IF EXISTS trg_before_booking_insert $$
CREATE TRIGGER trg_before_booking_insert
BEFORE INSERT ON Booking
FOR EACH ROW
BEGIN
  DECLARE v_status VARCHAR(20);
  SELECT Status INTO v_status FROM Flight WHERE Flight_ID = NEW.Flight_ID;
  IF v_status = 'Cancelled' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot insert booking: flight cancelled';
  END IF;

  IF EXISTS (SELECT 1 FROM Booking WHERE Flight_ID = NEW.Flight_ID AND Seat_No = NEW.Seat_No AND Status = 'Booked') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Seat already booked';
  END IF;
END$$

DELIMITER ;
