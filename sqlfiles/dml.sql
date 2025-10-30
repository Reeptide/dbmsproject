USE flight_management;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Truncate all tables (clears all data but keeps structure)
TRUNCATE TABLE Booking;
TRUNCATE TABLE Staff;
TRUNCATE TABLE Flight;
TRUNCATE TABLE Passenger;
TRUNCATE TABLE Airline;
TRUNCATE TABLE Airport;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

USE flight_management;

-- ======================================================
-- Populate Airport (10 entries)
-- ======================================================
INSERT INTO Airport (Name, City, Country) VALUES
('Kempegowda International Airport', 'Bangalore', 'India'),
('Indira Gandhi International Airport', 'Delhi', 'India'),
('Chhatrapati Shivaji International Airport', 'Mumbai', 'India'),
('Rajiv Gandhi International Airport', 'Hyderabad', 'India'),
('Netaji Subhas Chandra Bose International Airport', 'Kolkata', 'India'),
('Cochin International Airport', 'Kochi', 'India'),
('Chennai International Airport', 'Chennai', 'India'),
('Pune International Airport', 'Pune', 'India'),
('Sardar Vallabhbhai Patel International Airport', 'Ahmedabad', 'India'),
('Trivandrum International Airport', 'Trivandrum', 'India');

-- ======================================================
-- Populate Airline (10 entries)
-- ======================================================
INSERT INTO Airline (Name, Contact_Info) VALUES
('Air India', 'support@airindia.in'),
('IndiGo', 'help@goindigo.in'),
('SpiceJet', 'service@spicejet.com'),
('Vistara', 'info@airvistara.com'),
('Go First', 'care@gofirst.in'),
('Akasa Air', 'support@akasaair.com'),
('Alliance Air', 'help@allianceair.in'),
('AirAsia India', 'support@airasia.co.in'),
('Emirates', 'support@emirates.com'),
('Qatar Airways', 'contact@qatarairways.com');

-- ======================================================
-- Populate Flight (10 entries)
-- ======================================================
INSERT INTO Flight (Flight_No, Departure_Time, Arrival_Time, Status, Airline_ID, From_Airport_ID, To_Airport_ID)
VALUES
('AI101', '2025-11-01 06:00:00', '2025-11-01 08:30:00', 'Scheduled', 1, 1, 2),
('6E202', '2025-11-02 09:00:00', '2025-11-02 11:10:00', 'Scheduled', 2, 2, 3),
('SG303', '2025-11-03 07:30:00', '2025-11-03 09:45:00', 'Delayed', 3, 3, 4),
('UK404', '2025-11-04 10:00:00', '2025-11-04 12:20:00', 'Cancelled', 4, 4, 5),
('G805', '2025-11-05 14:00:00', '2025-11-05 16:30:00', 'Scheduled', 5, 5, 6),
('QP606', '2025-11-06 17:45:00', '2025-11-06 20:15:00', 'Completed', 6, 6, 7),
('9I707', '2025-11-07 08:15:00', '2025-11-07 10:30:00', 'Scheduled', 7, 7, 8),
('I508', '2025-11-08 13:30:00', '2025-11-08 15:45:00', 'Completed', 8, 8, 9),
('EK909', '2025-11-09 05:00:00', '2025-11-09 09:30:00', 'Scheduled', 9, 9, 10),
('QR010', '2025-11-10 12:00:00', '2025-11-10 16:45:00', 'Delayed', 10, 10, 1);

-- ======================================================
-- Populate Passenger (10 entries)
-- ======================================================
INSERT INTO Passenger (First_Name, Last_Name, Email, Phone) VALUES
('Narendhar', 'Subramanian', 'narendhar@example.com', '9876543210'),
('Niranjani', 'Hiremath', 'Niranjani@example.com', '9876501234'),
('Ravi', 'Kumar', 'ravi.kumar@example.com', '9876512345'),
('Priya', 'Sharma', 'priya.sharma@example.com', '9876523456'),
('Arjun', 'Patel', 'arjun.patel@example.com', '9876534567'),
('Sneha', 'Reddy', 'sneha.reddy@example.com', '9876545678'),
('Rahul', 'Mehta', 'rahul.mehta@example.com', '9876556789'),
('Divya', 'Nair', 'divya.nair@example.com', '9876567890'),
('Anjali', 'Menon', 'anjali.menon@example.com', '9876578901'),
('Karthik', 'Raj', 'karthik.raj@example.com', '9876589012');

-- ======================================================
-- Populate Booking (10 entries)
-- ======================================================
INSERT INTO Booking (Date, Seat_No, Passenger_ID, Flight_ID) VALUES
('2025-10-28', '12A', 1, 1),
('2025-10-28', '14C', 2, 2),
('2025-10-29', '15B', 3, 3),
('2025-10-29', '16A', 4, 4),
('2025-10-30', '11D', 5, 5),
('2025-10-31', '18C', 6, 6),
('2025-10-31', '19B', 7, 7),
('2025-11-01', '20A', 8, 8),
('2025-11-01', '22D', 9, 9),
('2025-11-02', '10B', 10, 10);

-- ======================================================
-- Populate Staff (10 entries)
-- ======================================================
INSERT INTO Staff (First_Name, Last_Name, Role, Airline_ID, Airport_ID) VALUES
('Niranjani', 'Hiremath', 'Flight Attendant', 1, 1),
('Rohit', 'Verma', 'Pilot', 2, 2),
('Meena', 'Das', 'Ground Staff', 3, 3),
('Arun', 'Rao', 'Engineer', 4, 4),
('Neha', 'Singh', 'Cabin Crew', 5, 5),
('Vikas', 'Joshi', 'Technician', 6, 6),
('Pooja', 'Kaur', 'Security Officer', 7, 7),
('Sanjay', 'Menon', 'Check-in Staff', 8, 8),
('Anita', 'Patel', 'Flight Supervisor', 9, 9),
('Kiran', 'Naidu', 'Pilot', 10, 10);

USE flight_management;
SELECT COUNT(*) FROM Airport;
SELECT COUNT(*) FROM Flight;
SELECT * FROM Booking LIMIT 5;
