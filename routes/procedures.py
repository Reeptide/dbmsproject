from flask import Blueprint, request, jsonify
from database.db import db

procedures_bp = Blueprint('procedures', __name__)

@procedures_bp.route('/create-booking', methods=['POST'])
def create_booking_procedure():
    """
    Create a booking using sp_CreateBooking stored procedure
    Expected JSON: {
        "first_name": "string",
        "last_name": "string", 
        "email": "string",
        "phone": "string",
        "flight_no": "string",
        "seat_no": "string"
    }
    """
    try:
        data = request.get_json()
        
        required_fields = ['first_name', 'last_name', 'email', 'flight_no', 'seat_no']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
        
        # Prepare parameters for stored procedure
        # sp_CreateBooking(first_name, last_name, email, phone, flight_no, seat_no, OUT booking_id)
        with db.get_cursor(dictionary=False) as (cursor, connection):
            # Call stored procedure
            args = [
                data['first_name'],
                data['last_name'],
                data['email'],
                data.get('phone', ''),
                data['flight_no'],
                data['seat_no'],
                0  # OUT parameter for booking_id
            ]
            
            result = cursor.callproc('sp_CreateBooking', args)
            booking_id = result[6]  # The OUT parameter
            
            if booking_id:
                return jsonify({
                    'success': True,
                    'message': 'Booking created successfully via stored procedure',
                    'booking_id': booking_id
                }), 201
            else:
                return jsonify({
                    'success': False,
                    'error': 'Booking creation failed'
                }), 400
                
    except Exception as e:
        error_msg = str(e)
        return jsonify({'success': False, 'error': error_msg}), 500

@procedures_bp.route('/cancel-flight', methods=['POST'])
def cancel_flight_procedure():
    """
    Cancel a flight using sp_CancelFlight stored procedure
    Expected JSON: {"flight_no": "string"}
    """
    try:
        data = request.get_json()
        
        if 'flight_no' not in data:
            return jsonify({'success': False, 'error': 'Missing field: flight_no'}), 400
        
        with db.get_cursor(dictionary=False) as (cursor, connection):
            cursor.callproc('sp_CancelFlight', [data['flight_no']])
            
        return jsonify({
            'success': True,
            'message': f'Flight {data["flight_no"]} cancelled successfully. All associated bookings have been cancelled.'
        }), 200
        
    except Exception as e:
        error_msg = str(e)
        return jsonify({'success': False, 'error': error_msg}), 500

@procedures_bp.route('/transfer-staff', methods=['POST'])
def transfer_staff_procedure():
    """
    Transfer staff to a new airport using sp_TransferStaff stored procedure
    Expected JSON: {
        "staff_id": int,
        "new_airport_id": int,
        "notes": "string"
    }
    """
    try:
        data = request.get_json()
        
        required_fields = ['staff_id', 'new_airport_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
        
        with db.get_cursor(dictionary=False) as (cursor, connection):
            cursor.callproc('sp_TransferStaff', [
                data['staff_id'],
                data['new_airport_id'],
                data.get('notes', '')
            ])
            
        return jsonify({
            'success': True,
            'message': f'Staff member {data["staff_id"]} transferred successfully to airport {data["new_airport_id"]}'
        }), 200
        
    except Exception as e:
        error_msg = str(e)
        return jsonify({'success': False, 'error': error_msg}), 500