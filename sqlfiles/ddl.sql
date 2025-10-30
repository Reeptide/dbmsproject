-- ======================================================
-- Database: Flight Management System
-- ======================================================

CREATE DATABASE IF NOT EXISTS flight_management;
USE flight_management;

-- ======================================================
-- Table: Airport
-- ======================================================
CREATE TABLE Airport (
    Airport_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    City VARCHAR(100) NOT NULL,
    Country VARCHAR(100) NOT NULL
);

-- ======================================================
-- Table: Airline
-- ======================================================
CREATE TABLE Airline (
    Airline_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Contact_Info VARCHAR(150)
);

-- ======================================================
-- Table: Flight
-- ======================================================
CREATE TABLE Flight (
    Flight_ID INT AUTO_INCREMENT PRIMARY KEY,
    Flight_No VARCHAR(20) UNIQUE NOT NULL,
    Departure_Time DATETIME NOT NULL,
    Arrival_Time DATETIME NOT NULL,
    Status ENUM('Scheduled', 'Delayed', 'Cancelled', 'Completed') DEFAULT 'Scheduled',
    Airline_ID INT NOT NULL,
    From_Airport_ID INT NOT NULL,
    To_Airport_ID INT NOT NULL,
    FOREIGN KEY (Airline_ID) REFERENCES Airline(Airline_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (From_Airport_ID) REFERENCES Airport(Airport_ID) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (To_Airport_ID) REFERENCES Airport(Airport_ID) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ======================================================
-- Table: Passenger
-- ======================================================
CREATE TABLE Passenger (
    Passenger_ID INT AUTO_INCREMENT PRIMARY KEY,
    First_Name VARCHAR(100) NOT NULL,
    Last_Name VARCHAR(100) NOT NULL,
    Email VARCHAR(150) UNIQUE NOT NULL,
    Phone VARCHAR(15)
);

-- ======================================================
-- Table: Booking
-- ======================================================
CREATE TABLE Booking (
    Booking_ID INT AUTO_INCREMENT PRIMARY KEY,
    Date DATE NOT NULL,
    Seat_No VARCHAR(10) NOT NULL,
    Passenger_ID INT NOT NULL,
    Flight_ID INT NOT NULL,
    FOREIGN KEY (Passenger_ID) REFERENCES Passenger(Passenger_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Flight_ID) REFERENCES Flight(Flight_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ======================================================
-- Table: Staff
-- ======================================================
CREATE TABLE Staff (
    Staff_ID INT AUTO_INCREMENT PRIMARY KEY,
    First_Name VARCHAR(100) NOT NULL,
    Last_Name VARCHAR(100) NOT NULL,
    Role VARCHAR(50) NOT NULL,
    Airline_ID INT NOT NULL,
    Airport_ID INT NOT NULL,
    FOREIGN KEY (Airline_ID) REFERENCES Airline(Airline_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Airport_ID) REFERENCES Airport(Airport_ID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ======================================================
-- Optional: Sample Inserts (for testing)
-- ======================================================
INSERT INTO Airport (Name, City, Country) VALUES
('Kempegowda International Airport', 'Bangalore', 'India'),
('Indira Gandhi International Airport', 'Delhi', 'India');

INSERT INTO Airline (Name, Contact_Info) VALUES
('Air India', 'support@airindia.in'),
('IndiGo', 'help@goindigo.in');

INSERT INTO Flight (Flight_No, Departure_Time, Arrival_Time, Status, Airline_ID, From_Airport_ID, To_Airport_ID)
VALUES
('AI101', '2025-10-30 06:00:00', '2025-10-30 08:30:00', 'Scheduled', 1, 1, 2);

INSERT INTO Passenger (First_Name, Last_Name, Email, Phone) VALUES
('Narendhar', 'Subramanian', 'naren@example.com', '9876543210');

INSERT INTO Booking (Date, Seat_No, Passenger_ID, Flight_ID)
VALUES
('2025-10-28', '12A', 1, 1);

INSERT INTO Staff (First_Name, Last_Name, Role, Airline_ID, Airport_ID)
VALUES
('Niranjani', 'Hiremath', 'Flight Attendant', 1, 1);


SHOW TABLES;
SELECT * FROM Flight;