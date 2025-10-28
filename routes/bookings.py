from flask import Blueprint, request, jsonify
from database.db import db

bookings_bp = Blueprint('bookings', __name__)

@bookings_bp.route('/', methods=['GET'])
def get_all_bookings():
    """Get all bookings with optional filters"""
    try:
        status = request.args.get('status')
        passenger_id = request.args.get('passenger_id')
        flight_id = request.args.get('flight_id')
        
        query = """
            SELECT 
                b.Booking_ID, b.Date, b.Seat_No, b.Status, b.Booking_Time,
                p.Passenger_ID, p.First_Name, p.Last_Name, p.Email,
                f.Flight_ID, f.Flight_No, f.Departure_Time, f.Arrival_Time,
                al.Name AS Airline,
                a1.City AS From_City, a2.City AS To_City
            FROM Booking b
            JOIN Passenger p ON b.Passenger_ID = p.Passenger_ID
            JOIN Flight f ON b.Flight_ID = f.Flight_ID
            JOIN Airline al ON f.Airline_ID = al.Airline_ID
            JOIN Airport a1 ON f.From_Airport_ID = a1.Airport_ID
            JOIN Airport a2 ON f.To_Airport_ID = a2.Airport_ID
            WHERE 1=1
        """
        params = []
        
        if status:
            query += " AND b.Status = %s"
            params.append(status)
        if passenger_id:
            query += " AND b.Passenger_ID = %s"
            params.append(passenger_id)
        if flight_id:
            query += " AND b.Flight_ID = %s"
            params.append(flight_id)
        
        query += " ORDER BY b.Date DESC, b.Booking_Time DESC"
        
        bookings = db.execute_query(query, params if params else None)
        return jsonify({'success': True, 'data': bookings}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bookings_bp.route('/<int:booking_id>', methods=['GET'])
def get_booking(booking_id):
    """Get a specific booking by ID"""
    try:
        query = """
            SELECT 
                b.Booking_ID, b.Date, b.Seat_No, b.Status, b.Booking_Time,
                p.Passenger_ID, p.First_Name, p.Last_Name, p.Email, p.Phone,
                f.Flight_ID, f.Flight_No, f.Departure_Time, f.Arrival_Time, f.Status AS Flight_Status,
                al.Name AS Airline,
                a1.Name AS From_Airport, a1.City AS From_City,
                a2.Name AS To_Airport, a2.City AS To_City
            FROM Booking b
            JOIN Passenger p ON b.Passenger_ID = p.Passenger_ID
            JOIN Flight f ON b.Flight_ID = f.Flight_ID
            JOIN Airline al ON f.Airline_ID = al.Airline_ID
            JOIN Airport a1 ON f.From_Airport_ID = a1.Airport_ID
            JOIN Airport a2 ON f.To_Airport_ID = a2.Airport_ID
            WHERE b.Booking_ID = %s
        """
        booking = db.execute_query(query, (booking_id,), fetch_one=True)
        
        if not booking:
            return jsonify({'success': False, 'error': 'Booking not found'}), 404
        
        return jsonify({'success': True, 'data': booking}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bookings_bp.route('/', methods=['POST'])
def create_booking():
    """Create a new booking (manual - without stored procedure)"""
    try:
        data = request.get_json()
        
        required_fields = ['passenger_id', 'flight_id', 'seat_no']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
        
        query = """
            INSERT INTO Booking (Date, Seat_No, Passenger_ID, Flight_ID, Status)
            VALUES (CURDATE(), %s, %s, %s, 'Booked')
        """
        params = (
            data['seat_no'],
            data['passenger_id'],
            data['flight_id']
        )
        
        with db.get_cursor() as (cursor, connection):
            cursor.execute(query, params)
            booking_id = cursor.lastrowid
        
        return jsonify({
            'success': True,
            'message': 'Booking created successfully',
            'booking_id': booking_id
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bookings_bp.route('/<int:booking_id>', methods=['PUT'])
def update_booking(booking_id):
    """Update an existing booking"""
    try:
        data = request.get_json()
        
        update_fields = []
        params = []
        
        if 'seat_no' in data:
            update_fields.append('Seat_No = %s')
            params.append(data['seat_no'])
        if 'status' in data:
            update_fields.append('Status = %s')
            params.append(data['status'])
        
        if not update_fields:
            return jsonify({'success': False, 'error': 'No fields to update'}), 400
        
        params.append(booking_id)
        query = f"UPDATE Booking SET {', '.join(update_fields)} WHERE Booking_ID = %s"
        
        rows_affected = db.execute_update(query, params)
        
        if rows_affected == 0:
            return jsonify({'success': False, 'error': 'Booking not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Booking updated successfully'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bookings_bp.route('/<int:booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    """Delete a booking"""
    try:
        query = "DELETE FROM Booking WHERE Booking_ID = %s"
        rows_affected = db.execute_update(query, (booking_id,))
        
        if rows_affected == 0:
            return jsonify({'success': False, 'error': 'Booking not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Booking deleted successfully'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bookings_bp.route('/<int:booking_id>/cancel', methods=['POST'])
def cancel_booking(booking_id):
    """Cancel a booking (update status to Cancelled)"""
    try:
        query = "UPDATE Booking SET Status = 'Cancelled' WHERE Booking_ID = %s AND Status = 'Booked'"
        rows_affected = db.execute_update(query, (booking_id,))
        
        if rows_affected == 0:
            return jsonify({'success': False, 'error': 'Booking not found or already cancelled'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Booking cancelled successfully'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500