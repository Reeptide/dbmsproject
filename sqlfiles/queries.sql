-- ======================================================
-- Flight Management System: Complex SQL Queries
-- Compatible with MySQL Workbench 8.0 CE
-- ======================================================

USE flight_management;

-- ======================================================
-- 1️⃣ Airline operates Flights
-- ======================================================
-- Find total flights operated by each airline, grouped by flight status
SELECT 
  al.Name AS Airline,
  f.Status,
  COUNT(f.Flight_ID) AS Total_Flights
FROM Airline al
JOIN Flight f ON al.Airline_ID = f.Airline_ID
GROUP BY al.Name, f.Status
ORDER BY Total_Flights DESC;

-- ======================================================
-- 2️⃣ Airport departs / arrives relationships
-- ======================================================
-- List top 5 busiest airports (departures + arrivals)
SELECT 
  a.Name AS Airport,
  a.City,
  (SELECT COUNT(*) FROM Flight WHERE From_Airport_ID = a.Airport_ID) AS Departures,
  (SELECT COUNT(*) FROM Flight WHERE To_Airport_ID = a.Airport_ID) AS Arrivals,
  ((SELECT COUNT(*) FROM Flight WHERE From_Airport_ID = a.Airport_ID) +
   (SELECT COUNT(*) FROM Flight WHERE To_Airport_ID = a.Airport_ID)) AS TotalTraffic
FROM Airport a
ORDER BY TotalTraffic DESC
LIMIT 5;

-- ======================================================
-- 3️⃣ Passenger makes Booking
-- ======================================================
-- Find passengers who have made more than one booking (frequent flyers)
SELECT 
  p.First_Name,
  p.Last_Name,
  COUNT(b.Booking_ID) AS Total_Bookings
FROM Passenger p
JOIN Booking b ON p.Passenger_ID = b.Passenger_ID
GROUP BY p.Passenger_ID
HAVING COUNT(b.Booking_ID) > 1
ORDER BY Total_Bookings DESC;

-- ======================================================
-- 4️⃣ Airline employs Staff
-- ======================================================
-- List all airlines with total number of staff assigned
SELECT 
  al.Name AS Airline,
  COUNT(s.Staff_ID) AS Total_Employees
FROM Airline al
LEFT JOIN Staff s ON al.Airline_ID = s.Airline_ID
GROUP BY al.Name
ORDER BY Total_Employees DESC;

-- ======================================================
-- 5️⃣ Nested Query: Find flights with above-average bookings
-- ======================================================
SELECT 
  f.Flight_No,
  al.Name AS Airline,
  COUNT(b.Booking_ID) AS Total_Bookings
FROM Flight f
JOIN Airline al ON f.Airline_ID = al.Airline_ID
JOIN Booking b ON f.Flight_ID = b.Flight_ID
GROUP BY f.Flight_ID
HAVING COUNT(b.Booking_ID) > (
  SELECT AVG(BookCount)
  FROM (
    SELECT COUNT(*) AS BookCount
    FROM Booking
    GROUP BY Flight_ID
  ) AS sub
)
ORDER BY Total_Bookings DESC;

-- ======================================================
-- 6️⃣ Window Function: Rank airlines by booking volume
-- ======================================================
SELECT 
  al.Name AS Airline,
  COUNT(b.Booking_ID) AS Total_Bookings,
  RANK() OVER (ORDER BY COUNT(b.Booking_ID) DESC) AS Rank_By_Bookings
FROM Airline al
JOIN Flight f ON al.Airline_ID = f.Airline_ID
JOIN Booking b ON f.Flight_ID = b.Flight_ID
GROUP BY al.Airline_ID;

-- ======================================================
-- 7️⃣ Join multiple relationships: Passenger → Booking → Flight → Airline
-- ======================================================
-- Show passenger names, flight number, airline name, and booking status
SELECT 
  p.First_Name,
  p.Last_Name,
  f.Flight_No,
  al.Name AS Airline,
  b.Seat_No,
  b.Status AS Booking_Status
FROM Passenger p
JOIN Booking b ON p.Passenger_ID = b.Passenger_ID
JOIN Flight f ON b.Flight_ID = f.Flight_ID
JOIN Airline al ON f.Airline_ID = al.Airline_ID
ORDER BY p.First_Name, f.Flight_No;

-- ======================================================
-- 8️⃣ Correlated Subquery: Find passengers who only flew with one airline
-- ======================================================
SELECT 
  p.First_Name,
  p.Last_Name
FROM Passenger p
WHERE (
  SELECT COUNT(DISTINCT al.Airline_ID)
  FROM Booking b
  JOIN Flight f ON b.Flight_ID = f.Flight_ID
  JOIN Airline al ON f.Airline_ID = al.Airline_ID
  WHERE b.Passenger_ID = p.Passenger_ID
) = 1;

-- ======================================================
-- 9️⃣ Derived Table + Aggregation: Average delay per airline (if status used for delays)
-- ======================================================
SELECT 
  al.Name AS Airline,
  AVG(TIMESTAMPDIFF(MINUTE, f.Departure_Time, f.Arrival_Time)) AS Avg_Flight_Duration_Minutes
FROM Airline al
JOIN Flight f ON al.Airline_ID = f.Airline_ID
WHERE f.Status IN ('Completed','Delayed')
GROUP BY al.Airline_ID
ORDER BY Avg_Flight_Duration_Minutes DESC;

-- ======================================================
-- 🔟 Staff–Airport relationship (employ and have)
-- ======================================================
-- Find all staff members working at each airport and their airline
SELECT 
  s.First_Name,
  s.Last_Name,
  s.Role,
  al.Name AS Airline,
  a.Name AS Airport
FROM Staff s
JOIN Airline al ON s.Airline_ID = al.Airline_ID
JOIN Airport a ON s.Airport_ID = a.Airport_ID
ORDER BY a.City, al.Name;

-- ======================================================
-- 11️⃣ Complex Join: Flights between two specific cities on a date
-- ======================================================
SELECT 
  f.Flight_No,
  al.Name AS Airline,
  a1.City AS From_City,
  a2.City AS To_City,
  f.Departure_Time,
  f.Arrival_Time,
  f.Status
FROM Flight f
JOIN Airline al ON f.Airline_ID = al.Airline_ID
JOIN Airport a1 ON f.From_Airport_ID = a1.Airport_ID
JOIN Airport a2 ON f.To_Airport_ID = a2.Airport_ID
WHERE a1.City = 'Bangalore' AND a2.City = 'Delhi'
  AND DATE(f.Departure_Time) = '2025-11-01';

-- ======================================================
-- 12️⃣ Advanced Aggregation: Airline-wise passenger count
-- ======================================================
SELECT 
  al.Name AS Airline,
  COUNT(DISTINCT b.Passenger_ID) AS Unique_Passengers
FROM Airline al
JOIN Flight f ON al.Airline_ID = f.Airline_ID
JOIN Booking b ON f.Flight_ID = b.Flight_ID
GROUP BY al.Airline_ID
ORDER BY Unique_Passengers DESC;

-- ======================================================
-- 13️⃣ Find the most frequent flyer (max total bookings)
-- ======================================================
SELECT 
  p.First_Name,
  p.Last_Name,
  COUNT(b.Booking_ID) AS Total_Bookings
FROM Passenger p
JOIN Booking b ON p.Passenger_ID = b.Passenger_ID
GROUP BY p.Passenger_ID
ORDER BY Total_Bookings DESC
LIMIT 1;

-- ======================================================
-- 14️⃣ Find staff transfers (using StaffHistory table)
-- ======================================================
SELECT 
  s.First_Name,
  s.Last_Name,
  a1.Name AS Old_Airport,
  a2.Name AS New_Airport,
  sh.Changed_At,
  sh.Notes
FROM StaffHistory sh
JOIN Staff s ON sh.Staff_ID = s.Staff_ID
LEFT JOIN Airport a1 ON sh.Old_Airport_ID = a1.Airport_ID
LEFT JOIN Airport a2 ON sh.New_Airport_ID = a2.Airport_ID
ORDER BY sh.Changed_At DESC;

-- ======================================================
-- 15️⃣ View bookings per passenger including cancelled ones (using CASE)
-- ======================================================
SELECT 
  p.First_Name,
  p.Last_Name,
  SUM(CASE WHEN b.Status = 'Booked' THEN 1 ELSE 0 END) AS Active_Bookings,
  SUM(CASE WHEN b.Status = 'Cancelled' THEN 1 ELSE 0 END) AS Cancelled_Bookings
FROM Passenger p
LEFT JOIN Booking b ON p.Passenger_ID = b.Passenger_ID
GROUP BY p.Passenger_ID
ORDER BY Active_Bookings DESC;
