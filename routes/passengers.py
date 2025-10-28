from flask import Blueprint, request, jsonify
from database.db import db

passengers_bp = Blueprint('passengers', __name__)

@passengers_bp.route('/', methods=['GET'])
def get_all_passengers():
    """Get all passengers"""
    try:
        query = """
            SELECT Passenger_ID, First_Name, Last_Name, Email, Phone 
            FROM Passenger 
            ORDER BY Passenger_ID
        """
        passengers = db.execute_query(query)
        return jsonify({'success': True, 'data': passengers}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@passengers_bp.route('/<int:passenger_id>', methods=['GET'])
def get_passenger(passenger_id):
    """Get a specific passenger by ID"""
    try:
        query = """
            SELECT Passenger_ID, First_Name, Last_Name, Email, Phone 
            FROM Passenger 
            WHERE Passenger_ID = %s
        """
        passenger = db.execute_query(query, (passenger_id,), fetch_one=True)
        
        if not passenger:
            return jsonify({'success': False, 'error': 'Passenger not found'}), 404
        
        return jsonify({'success': True, 'data': passenger}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@passengers_bp.route('/', methods=['POST'])
def create_passenger():
    """Create a new passenger"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'email']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
        
        query = """
            INSERT INTO Passenger (First_Name, Last_Name, Email, Phone)
            VALUES (%s, %s, %s, %s)
        """
        params = (
            data['first_name'],
            data['last_name'],
            data['email'],
            data.get('phone')
        )
        
        with db.get_cursor() as (cursor, connection):
            cursor.execute(query, params)
            passenger_id = cursor.lastrowid
        
        return jsonify({
            'success': True,
            'message': 'Passenger created successfully',
            'passenger_id': passenger_id
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@passengers_bp.route('/<int:passenger_id>', methods=['PUT'])
def update_passenger(passenger_id):
    """Update an existing passenger"""
    try:
        data = request.get_json()
        
        # Build dynamic update query
        update_fields = []
        params = []
        
        if 'first_name' in data:
            update_fields.append('First_Name = %s')
            params.append(data['first_name'])
        if 'last_name' in data:
            update_fields.append('Last_Name = %s')
            params.append(data['last_name'])
        if 'email' in data:
            update_fields.append('Email = %s')
            params.append(data['email'])
        if 'phone' in data:
            update_fields.append('Phone = %s')
            params.append(data['phone'])
        
        if not update_fields:
            return jsonify({'success': False, 'error': 'No fields to update'}), 400
        
        params.append(passenger_id)
        query = f"UPDATE Passenger SET {', '.join(update_fields)} WHERE Passenger_ID = %s"
        
        rows_affected = db.execute_update(query, params)
        
        if rows_affected == 0:
            return jsonify({'success': False, 'error': 'Passenger not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Passenger updated successfully'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@passengers_bp.route('/<int:passenger_id>', methods=['DELETE'])
def delete_passenger(passenger_id):
    """Delete a passenger"""
    try:
        query = "DELETE FROM Passenger WHERE Passenger_ID = %s"
        rows_affected = db.execute_update(query, (passenger_id,))
        
        if rows_affected == 0:
            return jsonify({'success': False, 'error': 'Passenger not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Passenger deleted successfully'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@passengers_bp.route('/<int:passenger_id>/bookings', methods=['GET'])
def get_passenger_bookings(passenger_id):
    """Get all bookings for a specific passenger"""
    try:
        query = """
            SELECT 
                b.Booking_ID, b.Date, b.Seat_No, b.Status,
                f.Flight_No, f.Departure_Time, f.Arrival_Time,
                al.Name AS Airline,
                a1.Name AS From_Airport, a1.City AS From_City,
                a2.Name AS To_Airport, a2.City AS To_City
            FROM Booking b
            JOIN Flight f ON b.Flight_ID = f.Flight_ID
            JOIN Airline al ON f.Airline_ID = al.Airline_ID
            JOIN Airport a1 ON f.From_Airport_ID = a1.Airport_ID
            JOIN Airport a2 ON f.To_Airport_ID = a2.Airport_ID
            WHERE b.Passenger_ID = %s
            ORDER BY b.Date DESC
        """
        bookings = db.execute_query(query, (passenger_id,))
        return jsonify({'success': True, 'data': bookings}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@passengers_bp.route('/<int:passenger_id>/booking-count', methods=['GET'])
def get_passenger_booking_count(passenger_id):
    """Get total booking count using MySQL function"""
    try:
        count = db.call_function('fn_PassengerBookingCount', [passenger_id])
        return jsonify({
            'success': True,
            'passenger_id': passenger_id,
            'booking_count': count
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500