USE flight_management;

-- Insert bookings only for scheduled/completed flights (skip Flight 4)
INSERT INTO Booking (Date, Seat_No, Passenger_ID, Flight_ID) VALUES
('2025-10-28', '12A', 1, 1),  -- AI101 - Scheduled ✅
('2025-10-28', '14C', 2, 2),  -- 6E202 - Scheduled ✅
('2025-10-29', '15B', 3, 5),  -- G805 - Scheduled ✅ (using Flight 5 instead of 3)
('2025-10-29', '16A', 5, 6),  -- QP606 - Completed ✅ (using Flight 6)
('2025-10-30', '11D', 6, 7),  -- 9I707 - Scheduled ✅
('2025-10-31', '18C', 7, 8),  -- I508 - Completed ✅
('2025-10-31', '19B', 8, 9),  -- EK909 - Scheduled ✅
('2025-11-01', '20A', 9, 1),  -- AI101 - Another booking ✅
('2025-11-01', '22D', 10, 2), -- 6E202 - Another booking ✅
('2025-11-02', '10B', 1, 7);  -- 9I707 - Another booking ✅

INSERT INTO Staff (First_Name, Last_Name, Role, Airline_ID, Airport_ID) 
VALUES ('Niranjani', 'Hiremath', 'Flight Attendant', 1, 1);
INSERT INTO Staff (First_Name, Last_Name, Role, Airline_ID, Airport_ID) VALUES
('Rohit', 'Verma', 'Pilot', 2, 2),
('Meena', 'Das', 'Ground Staff', 3, 3),
('Arun', 'Rao', 'Engineer', 4, 4),
('Neha', 'Singh', 'Cabin Crew', 5, 5),
('Vikas', 'Joshi', 'Technician', 6, 6),
('Pooja', 'Kaur', 'Security Officer', 7, 7),
('Sanjay', 'Menon', 'Check-in Staff', 8, 8),
('Anita', 'Patel', 'Flight Supervisor', 9, 9),
('Kiran', 'Naidu', 'Pilot', 10, 10);

SELECT 
    @@global.time_zone as global_tz,
    @@session.time_zone as session_tz,
    NOW() as mysql_now,
    UTC_TIMESTAMP() as mysql_utc;