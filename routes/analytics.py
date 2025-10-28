from flask import Blueprint, request, jsonify
from database.db import db

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/airline-flights', methods=['GET'])
def airline_flights():
    """Query 1: Total flights operated by each airline, grouped by status"""
    try:
        query = """
            SELECT 
                al.Name AS Airline,
                f.Status,
                COUNT(f.Flight_ID) AS Total_Flights
            FROM Airline al
            JOIN Flight f ON al.Airline_ID = f.Airline_ID
            GROUP BY al.Name, f.Status
            ORDER BY Total_Flights DESC
        """
        results = db.execute_query(query)
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_bp.route('/busiest-airports', methods=['GET'])
def busiest_airports():
    """Query 2: Top 5 busiest airports (departures + arrivals)"""
    try:
        limit = request.args.get('limit', 5, type=int)
        query = """
            SELECT 
                a.Name AS Airport,
                a.City,
                (SELECT COUNT(*) FROM Flight WHERE From_Airport_ID = a.Airport_ID) AS Departures,
                (SELECT COUNT(*) FROM Flight WHERE To_Airport_ID = a.Airport_ID) AS Arrivals,
                ((SELECT COUNT(*) FROM Flight WHERE From_Airport_ID = a.Airport_ID) +
                 (SELECT COUNT(*) FROM Flight WHERE To_Airport_ID = a.Airport_ID)) AS Total_Traffic
            FROM Airport a
            ORDER BY Total_Traffic DESC
            LIMIT %s
        """
        results = db.execute_query(query, (limit,))
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_bp.route('/frequent-flyers', methods=['GET'])
def frequent_flyers():
    """Query 3: Find passengers with more than one booking"""
    try:
        min_bookings = request.args.get('min_bookings', 1, type=int)
        query = """
            SELECT 
                p.Passenger_ID,
                p.First_Name,
                p.Last_Name,
                p.Email,
                COUNT(b.Booking_ID) AS Total_Bookings
            FROM Passenger p
            JOIN Booking b ON p.Passenger_ID = b.Passenger_ID
            WHERE b.Status = 'Booked'
            GROUP BY p.Passenger_ID
            HAVING COUNT(b.Booking_ID) > %s
            ORDER BY Total_Bookings DESC
        """
        results = db.execute_query(query, (min_bookings,))
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_bp.route('/airline-employees', methods=['GET'])
def airline_employees():
    """Query 4: List all airlines with total number of staff"""
    try:
        query = """
            SELECT 
                al.Name AS Airline,
                COUNT(s.Staff_ID) AS Total_Employees
            FROM Airline al
            LEFT JOIN Staff s ON al.Airline_ID = s.Airline_ID
            GROUP BY al.Name
            ORDER BY Total_Employees DESC
        """
        results = db.execute_query(query)
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_bp.route('/above-average-bookings', methods=['GET'])
def above_average_bookings():
    """Query 5: Flights with above-average bookings"""
    try:
        query = """
            SELECT 
                f.Flight_No,
                al.Name AS Airline,
                COUNT(b.Booking_ID) AS Total_Bookings
            FROM Flight f
            JOIN Airline al ON f.Airline_ID = al.Airline_ID
            JOIN Booking b ON f.Flight_ID = b.Flight_ID
            WHERE b.Status = 'Booked'
            GROUP BY f.Flight_ID
            HAVING COUNT(b.Booking_ID) > (
                SELECT AVG(BookCount)
                FROM (
                    SELECT COUNT(*) AS BookCount
                    FROM Booking
                    WHERE Status = 'Booked'
                    GROUP BY Flight_ID
                ) AS sub
            )
            ORDER BY Total_Bookings DESC
        """
        results = db.execute_query(query)
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_bp.route('/airline-rankings', methods=['GET'])
def airline_rankings():
    """Query 6: Rank airlines by booking volume using window function"""
    try:
        query = """
            SELECT 
                al.Name AS Airline,
                COUNT(b.Booking_ID) AS Total_Bookings,
                RANK() OVER (ORDER BY COUNT(b.Booking_ID) DESC) AS Rank_By_Bookings
            FROM Airline al
            JOIN Flight f ON al.Airline_ID = f.Airline_ID
            JOIN Booking b ON f.Flight_ID = b.Flight_ID
            WHERE b.Status = 'Booked'
            GROUP BY al.Airline_ID
        """
        results = db.execute_query(query)
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_bp.route('/passenger-bookings-detail', methods=['GET'])
def passenger_bookings_detail():
    """Query 7: Passenger names with flight details and airline"""
    try:
        query = """
            SELECT 
                p.Passenger_ID,
                p.First_Name,
                p.Last_Name,
                f.Flight_No,
                al.Name AS Airline,
                b.Seat_No,
                b.Status AS Booking_Status,
                f.Departure_Time,
                f.Arrival_Time
            FROM Passenger p
            JOIN Booking b ON p.Passenger_ID = b.Passenger_ID
            JOIN Flight f ON b.Flight_ID = f.Flight_ID
            JOIN Airline al ON f.Airline_ID = al.Airline_ID
            ORDER BY p.First_Name, f.Flight_No
        """
        results = db.execute_query(query)
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_bp.route('/single-airline-passengers', methods=['GET'])
def single_airline_passengers():
    """Query 8: Passengers who only flew with one airline"""
    try:
        query = """
            SELECT 
                p.Passenger_ID,
                p.First_Name,
                p.Last_Name,
                p.Email
            FROM Passenger p
            WHERE (
                SELECT COUNT(DISTINCT al.Airline_ID)
                FROM Booking b
                JOIN Flight f ON b.Flight_ID = f.Flight_ID
                JOIN Airline al ON f.Airline_ID = al.Airline_ID
                WHERE b.Passenger_ID = p.Passenger_ID
            ) = 1
        """
        results = db.execute_query(query)
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_bp.route('/avg-flight-duration', methods=['GET'])
def avg_flight_duration():
    """Query 9: Average flight duration per airline"""
    try:
        query = """
            SELECT 
                al.Name AS Airline,
                AVG(TIMESTAMPDIFF(MINUTE, f.Departure_Time, f.Arrival_Time)) AS Avg_Flight_Duration_Minutes
            FROM Airline al
            JOIN Flight f ON al.Airline_ID = f.Airline_ID
            WHERE f.Status IN ('Completed','Delayed','Scheduled')
            GROUP BY al.Airline_ID
            ORDER BY Avg_Flight_Duration_Minutes DESC
        """
        results = db.execute_query(query)
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_bp.route('/staff-airport-details', methods=['GET'])
def staff_airport_details():
    """Query 10: All staff members with their airport and airline"""
    try:
        query = """
            SELECT 
                s.Staff_ID,
                s.First_Name,
                s.Last_Name,
                s.Role,
                al.Name AS Airline,
                a.Name AS Airport,
                a.City AS Airport_City
            FROM Staff s
            JOIN Airline al ON s.Airline_ID = al.Airline_ID
            JOIN Airport a ON s.Airport_ID = a.Airport_ID
            ORDER BY a.City, al.Name
        """
        results = db.execute_query(query)
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_bp.route('/flights-between-cities', methods=['GET'])
def flights_between_cities():
    """Query 11: Flights between specific cities on a specific date"""
    try:
        from_city = request.args.get('from_city')
        to_city = request.args.get('to_city')
        date = request.args.get('date')
        
        if not all([from_city, to_city, date]):
            return jsonify({
                'success': False, 
                'error': 'Missing required parameters: from_city, to_city, date'
            }), 400
        
        query = """
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
            WHERE a1.City = %s AND a2.City = %s
              AND DATE(f.Departure_Time) = %s
        """
        results = db.execute_query(query, (from_city, to_city, date))
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_bp.route('/unique-passengers-per-airline', methods=['GET'])
def unique_passengers_per_airline():
    """Query 12: Airline-wise unique passenger count"""
    try:
        query = """
            SELECT 
                al.Name AS Airline,
                COUNT(DISTINCT b.Passenger_ID) AS Unique_Passengers
            FROM Airline al
            JOIN Flight f ON al.Airline_ID = f.Airline_ID
            JOIN Booking b ON f.Flight_ID = b.Flight_ID
            WHERE b.Status = 'Booked'
            GROUP BY al.Airline_ID
            ORDER BY Unique_Passengers DESC
        """
        results = db.execute_query(query)
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_bp.route('/most-frequent-flyer', methods=['GET'])
def most_frequent_flyer():
    """Query 13: Find the passenger with most bookings"""
    try:
        query = """
            SELECT 
                p.Passenger_ID,
                p.First_Name,
                p.Last_Name,
                p.Email,
                COUNT(b.Booking_ID) AS Total_Bookings
            FROM Passenger p
            JOIN Booking b ON p.Passenger_ID = b.Passenger_ID
            WHERE b.Status = 'Booked'
            GROUP BY p.Passenger_ID
            ORDER BY Total_Bookings DESC
            LIMIT 1
        """
        result = db.execute_query(query, fetch_one=True)
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_bp.route('/staff-transfers', methods=['GET'])
def staff_transfers():
    """Query 14: View staff transfer history"""
    try:
        query = """
            SELECT 
                s.Staff_ID,
                s.First_Name,
                s.Last_Name,
                a1.Name AS Old_Airport,
                a1.City AS Old_City,
                a2.Name AS New_Airport,
                a2.City AS New_City,
                sh.Changed_At,
                sh.Notes
            FROM StaffHistory sh
            JOIN Staff s ON sh.Staff_ID = s.Staff_ID
            LEFT JOIN Airport a1 ON sh.Old_Airport_ID = a1.Airport_ID
            LEFT JOIN Airport a2 ON sh.New_Airport_ID = a2.Airport_ID
            ORDER BY sh.Changed_At DESC
        """
        results = db.execute_query(query)
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_bp.route('/passenger-booking-summary', methods=['GET'])
def passenger_booking_summary():
    """Query 15: View active and cancelled bookings per passenger"""
    try:
        query = """
            SELECT 
                p.Passenger_ID,
                p.First_Name,
                p.Last_Name,
                p.Email,
                SUM(CASE WHEN b.Status = 'Booked' THEN 1 ELSE 0 END) AS Active_Bookings,
                SUM(CASE WHEN b.Status = 'Cancelled' THEN 1 ELSE 0 END) AS Cancelled_Bookings
            FROM Passenger p
            LEFT JOIN Booking b ON p.Passenger_ID = b.Passenger_ID
            GROUP BY p.Passenger_ID
            ORDER BY Active_Bookings DESC
        """
        results = db.execute_query(query)
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500