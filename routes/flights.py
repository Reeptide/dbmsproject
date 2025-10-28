from flask import Blueprint, request, jsonify
from database.db import db
from datetime import datetime

flights_bp = Blueprint('flights', __name__)

@flights_bp.route('/', methods=['GET'])
def get_all_flights():
    """Get all flights with optional filters"""
    try:
        # Get query parameters for filtering
        status = request.args.get('status')
        from_city = request.args.get('from_city')
        to_city = request.args.get('to_city')
        date = request.args.get('date')
        
        query = """
            SELECT 
                f.Flight_ID, f.Flight_No, f.Departure_Time, f.Arrival_Time, f.Status,
                f.Capacity,
                al.Name AS Airline,
                a1.Name AS From_Airport, a1.City AS From_City, a1.Country AS From_Country,
                a2.Name AS To_Airport, a2.City AS To_City, a2.Country AS To_Country
            FROM Flight f
            JOIN Airline al ON f.Airline_ID = al.Airline_ID
            JOIN Airport a1 ON f.From_Airport_ID = a1.Airport_ID
            JOIN Airport a2 ON f.To_Airport_ID = a2.Airport_ID
            WHERE 1=1
        """
        params = []
        
        if status:
            query += " AND f.Status = %s"
            params.append(status)
        if from_city:
            query += " AND a1.City = %s"
            params.append(from_city)
        if to_city:
            query += " AND a2.City = %s"
            params.append(to_city)
        if date:
            query += " AND DATE(f.Departure_Time) = %s"
            params.append(date)
        
        query += " ORDER BY f.Departure_Time"
        
        flights = db.execute_query(query, params if params else None)
        return jsonify({'success': True, 'data': flights}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@flights_bp.route('/<int:flight_id>', methods=['GET'])
def get_flight(flight_id):
    """Get a specific flight by ID"""
    try:
        query = """
            SELECT 
                f.Flight_ID, f.Flight_No, f.Departure_Time, f.Arrival_Time, f.Status,
                f.Capacity,
                al.Airline_ID, al.Name AS Airline,
                a1.Airport_ID AS From_Airport_ID, a1.Name AS From_Airport, 
                a1.City AS From_City, a1.Country AS From_Country,
                a2.Airport_ID AS To_Airport_ID, a2.Name AS To_Airport, 
                a2.City AS To_City, a2.Country AS To_Country
            FROM Flight f
            JOIN Airline al ON f.Airline_ID = al.Airline_ID
            JOIN Airport a1 ON f.From_Airport_ID = a1.Airport_ID
            JOIN Airport a2 ON f.To_Airport_ID = a2.Airport_ID
            WHERE f.Flight_ID = %s
        """
        flight = db.execute_query(query, (flight_id,), fetch_one=True)
        
        if not flight:
            return jsonify({'success': False, 'error': 'Flight not found'}), 404
        
        return jsonify({'success': True, 'data': flight}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@flights_bp.route('/', methods=['POST'])
def create_flight():
    """Create a new flight"""
    try:
        data = request.get_json()
        
        required_fields = ['flight_no', 'departure_time', 'arrival_time', 
                          'airline_id', 'from_airport_id', 'to_airport_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
        
        query = """
            INSERT INTO Flight 
            (Flight_No, Departure_Time, Arrival_Time, Status, Airline_ID, 
             From_Airport_ID, To_Airport_ID, Capacity)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            data['flight_no'],
            data['departure_time'],
            data['arrival_time'],
            data.get('status', 'Scheduled'),
            data['airline_id'],
            data['from_airport_id'],
            data['to_airport_id'],
            data.get('capacity', 180)
        )
        
        with db.get_cursor() as (cursor, connection):
            cursor.execute(query, params)
            flight_id = cursor.lastrowid
        
        return jsonify({
            'success': True,
            'message': 'Flight created successfully',
            'flight_id': flight_id
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@flights_bp.route('/<int:flight_id>', methods=['PUT'])
def update_flight(flight_id):
    """Update an existing flight"""
    try:
        data = request.get_json()
        
        update_fields = []
        params = []
        
        field_mapping = {
            'flight_no': 'Flight_No',
            'departure_time': 'Departure_Time',
            'arrival_time': 'Arrival_Time',
            'status': 'Status',
            'capacity': 'Capacity'
        }
        
        for json_field, db_field in field_mapping.items():
            if json_field in data:
                update_fields.append(f'{db_field} = %s')
                params.append(data[json_field])
        
        if not update_fields:
            return jsonify({'success': False, 'error': 'No fields to update'}), 400
        
        params.append(flight_id)
        query = f"UPDATE Flight SET {', '.join(update_fields)} WHERE Flight_ID = %s"
        
        rows_affected = db.execute_update(query, params)
        
        if rows_affected == 0:
            return jsonify({'success': False, 'error': 'Flight not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Flight updated successfully'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@flights_bp.route('/<int:flight_id>', methods=['DELETE'])
def delete_flight(flight_id):
    """Delete a flight"""
    try:
        query = "DELETE FROM Flight WHERE Flight_ID = %s"
        rows_affected = db.execute_update(query, (flight_id,))
        
        if rows_affected == 0:
            return jsonify({'success': False, 'error': 'Flight not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Flight deleted successfully'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@flights_bp.route('/<int:flight_id>/available-seats', methods=['GET'])
def get_available_seats(flight_id):
    """Get available seats using MySQL function"""
    try:
        available = db.call_function('fn_GetAvailableSeats', [flight_id])
        
        if available is None:
            return jsonify({'success': False, 'error': 'Flight not found'}), 404
        
        return jsonify({
            'success': True,
            'flight_id': flight_id,
            'available_seats': available
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@flights_bp.route('/<int:flight_id>/bookings', methods=['GET'])
def get_flight_bookings(flight_id):
    """Get all bookings for a specific flight"""
    try:
        query = """
            SELECT 
                b.Booking_ID, b.Date, b.Seat_No, b.Status,
                p.Passenger_ID, p.First_Name, p.Last_Name, p.Email, p.Phone
            FROM Booking b
            JOIN Passenger p ON b.Passenger_ID = p.Passenger_ID
            WHERE b.Flight_ID = %s
            ORDER BY b.Seat_No
        """
        bookings = db.execute_query(query, (flight_id,))
        return jsonify({'success': True, 'data': bookings}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500