from flask import Blueprint, request, jsonify
from database.db import db

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/above-average-bookings', methods=['GET'])
def above_average_bookings():
    """NESTED QUERY: Flights with above-average bookings"""
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

@analytics_bp.route('/passenger-bookings-detail', methods=['GET'])
def passenger_bookings_detail():
    """JOIN QUERY: Passenger names with flight details and airline (4-table join)"""
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

@analytics_bp.route('/unique-passengers-per-airline', methods=['GET'])
def unique_passengers_per_airline():
    """AGGREGATE QUERY: Airline-wise unique passenger count"""
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

@analytics_bp.route('/busiest-airports', methods=['GET'])
def busiest_airports():
    """COMPLEX AGGREGATE QUERY: Top 5 busiest airports (departures + arrivals)"""
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