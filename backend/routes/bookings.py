from flask import Blueprint, request, jsonify
from database.db import db
from datetime import datetime, timedelta

bookings_bp = Blueprint('bookings', __name__)

def convert_ist_to_utc(ist_datetime_str):
    """Convert IST datetime string to UTC for consistent frontend handling"""
    try:
        if not ist_datetime_str:
            return None
        
        # Parse the IST datetime
        if isinstance(ist_datetime_str, str):
            ist_dt = datetime.strptime(ist_datetime_str, '%Y-%m-%d %H:%M:%S')
        else:
            ist_dt = ist_datetime_str
        
        # Convert IST (UTC+5:30) to UTC by subtracting 5 hours 30 minutes
        utc_dt = ist_dt - timedelta(hours=5, minutes=30)
        
        # Return in ISO format for frontend
        return utc_dt.strftime('%Y-%m-%dT%H:%M:%S.000Z')
    except Exception as e:
        print(f"Timezone conversion error: {e}")
        return ist_datetime_str

@bookings_bp.route('/', methods=['GET'])
def get_all_bookings():
    """Get all bookings with optional filters and timezone conversion"""
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
        
        # Convert booking times from IST to UTC for consistent frontend handling
        for booking in bookings:
            if booking.get('Booking_Time'):
                booking['Booking_Time'] = convert_ist_to_utc(booking['Booking_Time'])
                print(f"Converted booking {booking['Booking_ID']} time: {booking['Booking_Time']}")
        
        return jsonify({'success': True, 'data': bookings}), 200
    except Exception as e:
        print(f"Error fetching bookings: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@bookings_bp.route('/<int:booking_id>', methods=['GET'])
def get_booking(booking_id):
    """Get a specific booking by ID with timezone conversion"""
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
        
        # Convert booking time from IST to UTC
        if booking.get('Booking_Time'):
            booking['Booking_Time'] = convert_ist_to_utc(booking['Booking_Time'])
        
        return jsonify({'success': True, 'data': booking}), 200
    except Exception as e:
        print(f"Error fetching booking {booking_id}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@bookings_bp.route('/', methods=['POST'])
def create_booking():
    """Create a new booking with trigger validation and audit logging"""
    try:
        data = request.get_json()
        print(f"Received booking data: {data}")  # Debug log
        
        # Validate required fields
        required_fields = ['passenger_id', 'flight_id', 'seat_no']
        for field in required_fields:
            if field not in data:
                error_msg = f'Missing field: {field}'
                print(f"Validation error: {error_msg}")
                return jsonify({'success': False, 'error': error_msg}), 400
        
        # Validate data types
        try:
            passenger_id = int(data['passenger_id'])
            flight_id = int(data['flight_id'])
            seat_no = str(data['seat_no']).strip().upper()
        except (ValueError, TypeError) as ve:
            error_msg = 'Invalid data format for passenger_id or flight_id'
            print(f"Data type error: {error_msg}")
            return jsonify({'success': False, 'error': error_msg}), 400
        
        if not seat_no:
            error_msg = 'Seat number cannot be empty'
            print(f"Validation error: {error_msg}")
            return jsonify({'success': False, 'error': error_msg}), 400

        # OPTION 1: Check if flight is cancelled before creating booking
        flight_check = db.execute_query(
            "SELECT Status, Flight_No FROM Flight WHERE Flight_ID = %s", 
            (flight_id,), 
            fetch_one=True
        )
        
        if not flight_check:
            error_msg = 'Selected flight does not exist'
            print(f"Flight validation error: {error_msg}")
            return jsonify({'success': False, 'error': error_msg}), 400
            
        if flight_check['Status'] == 'Cancelled':
            error_msg = f'Cannot create booking on cancelled flight {flight_check["Flight_No"]}'
            print(f"Cancelled flight error: {error_msg}")
            return jsonify({'success': False, 'error': error_msg}), 400
        
        query = """
            INSERT INTO Booking (Date, Seat_No, Passenger_ID, Flight_ID, Status)
            VALUES (CURDATE(), %s, %s, %s, 'Booked')
        """
        params = (seat_no, passenger_id, flight_id)
        
        try:
            with db.get_cursor() as (cursor, connection):
                cursor.execute(query, params)
                booking_id = cursor.lastrowid
                
                # Log the booking creation in audit table
                try:
                    cursor.execute(
                        "INSERT INTO BookingAudit (Booking_ID, Operation, Details) VALUES (%s, %s, %s)",
                        (booking_id, 'INSERT', f"Manual booking created - Seat {seat_no} for passenger {passenger_id} on flight {flight_id}")
                    )
                except Exception as audit_error:
                    print(f"Audit logging failed (non-critical): {audit_error}")
                    pass  # Audit is optional
            
            print(f"Booking created successfully: {booking_id}")
            return jsonify({
                'success': True,
                'message': 'Booking created successfully',
                'booking_id': booking_id
            }), 201
            
        except Exception as insert_error:
            error_msg = str(insert_error)
            print(f"Database insert error: {error_msg}")  # Debug log
            
            # Parse trigger-specific errors with multiple patterns
            error_lower = error_msg.lower()
            
            if 'seat already booked' in error_lower:
                user_error = f'Seat {seat_no} is already booked on this flight'
            elif 'cannot insert booking: flight cancelled' in error_lower:
                user_error = 'Cannot book on a cancelled flight'
            elif 'duplicate entry' in error_lower and 'ux_booking_flight_seat' in error_lower:
                user_error = f'Seat {seat_no} is already booked on this flight'
            elif 'foreign key constraint fails' in error_lower:
                if 'passenger_id' in error_lower:
                    user_error = 'Invalid passenger selected'
                elif 'flight_id' in error_lower:
                    user_error = 'Invalid flight selected'
                else:
                    user_error = 'Invalid passenger or flight selection'
            elif 'check constraint' in error_lower:
                user_error = 'Invalid booking data provided'
            else:
                # Generic database error - show more detail for debugging
                user_error = f'Booking failed: {error_msg}'
            
            print(f"Returning user error: {user_error}")
            return jsonify({'success': False, 'error': user_error}), 400
        
    except Exception as e:
        error_msg = f'Server error while creating booking: {str(e)}'
        print(f"General error: {error_msg}")
        return jsonify({'success': False, 'error': error_msg}), 500

@bookings_bp.route('/<int:booking_id>', methods=['PUT'])
def update_booking(booking_id):
    """Update an existing booking with audit logging"""
    try:
        data = request.get_json()
        print(f"Updating booking {booking_id} with data: {data}")
        
        # OPTION 1: Get current booking details including flight info for validation
        current_booking = db.execute_query(
            """SELECT b.Flight_ID, b.Status as Current_Status, f.Status as Flight_Status, f.Flight_No 
               FROM Booking b 
               JOIN Flight f ON b.Flight_ID = f.Flight_ID 
               WHERE b.Booking_ID = %s""", 
            (booking_id,), 
            fetch_one=True
        )
        
        if not current_booking:
            return jsonify({'success': False, 'error': 'No changes detected. Please modify at least one field'}), 404
        
        update_fields = []
        params = []
        
        if 'seat_no' in data and data['seat_no']:
            update_fields.append('Seat_No = %s')
            params.append(data['seat_no'].strip().upper())
            
        if 'status' in data and data['status']:
            new_status = data['status']
            
            # OPTION 1: Prevent changing status to 'Booked' if flight is cancelled
            if new_status == 'Booked' and current_booking['Flight_Status'] == 'Cancelled':
                error_msg = f'Cannot change booking status to "Booked" on cancelled flight {current_booking["Flight_No"]}'
                print(f"Cancelled flight validation error: {error_msg}")
                return jsonify({'success': False, 'error': error_msg}), 400
                
            update_fields.append('Status = %s')
            params.append(new_status)
        
        if not update_fields:
            error_msg = 'No valid fields provided to update'
            print(f"Validation error: {error_msg}")
            return jsonify({'success': False, 'error': error_msg}), 400
        
        params.append(booking_id)
        query = f"UPDATE Booking SET {', '.join(update_fields)} WHERE Booking_ID = %s"
        
        try:
            with db.get_cursor() as (cursor, connection):
                cursor.execute(query, params)
                
                if cursor.rowcount == 0:
                    error_msg = 'No changes detected. Please modify at least one field'
                    print(f"Update error: {error_msg}")
                    return jsonify({'success': False, 'error': error_msg}), 404
                
                # Log the update in audit table
                try:
                    details = f"Updated booking {booking_id}: " + ", ".join([f"{field.split('=')[0].strip()}: {params[i]}" for i, field in enumerate(update_fields)])
                    cursor.execute(
                        "INSERT INTO BookingAudit (Booking_ID, Operation, Details) VALUES (%s, %s, %s)",
                        (booking_id, 'UPDATE', details)
                    )
                except Exception as audit_error:
                    print(f"Audit logging failed (non-critical): {audit_error}")
                    pass
        
            print(f"Booking {booking_id} updated successfully")
            return jsonify({
                'success': True,
                'message': 'Booking updated successfully'
            }), 200
            
        except Exception as update_error:
            error_msg = str(update_error)
            error_lower = error_msg.lower()
            print(f"Database update error: {error_msg}")
            
            if 'seat already booked' in error_lower:
                user_error = 'New seat is already booked on this flight'
            elif 'duplicate entry' in error_lower and 'ux_booking_flight_seat' in error_lower:
                user_error = 'New seat is already booked on this flight'
            else:
                user_error = f'Update failed: {error_msg}'
            
            print(f"Returning user error: {user_error}")
            return jsonify({'success': False, 'error': user_error}), 400
        
    except Exception as e:
        error_msg = f'Server error while updating booking: {str(e)}'
        print(f"General error: {error_msg}")
        return jsonify({'success': False, 'error': error_msg}), 500

@bookings_bp.route('/<int:booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    """Delete a booking with audit logging"""
    try:
        print(f"Attempting to delete booking: {booking_id}")
        
        # Get booking details for audit before deletion
        booking_details = db.execute_query(
            "SELECT Passenger_ID, Flight_ID, Seat_No FROM Booking WHERE Booking_ID = %s", 
            (booking_id,), 
            fetch_one=True
        )
        
        if not booking_details:
            error_msg = 'Booking not found'
            print(f"Delete error: {error_msg}")
            return jsonify({'success': False, 'error': error_msg}), 404
        
        with db.get_cursor() as (cursor, connection):
            # Log the deletion in audit table before deleting
            try:
                cursor.execute(
                    "INSERT INTO BookingAudit (Booking_ID, Operation, Details) VALUES (%s, %s, %s)",
                    (booking_id, 'DELETE', f"Deleted booking - Passenger: {booking_details['Passenger_ID']}, Flight: {booking_details['Flight_ID']}, Seat: {booking_details['Seat_No']}")
                )
            except Exception as audit_error:
                print(f"Audit logging failed (non-critical): {audit_error}")
                pass
            
            # Delete the booking
            cursor.execute("DELETE FROM Booking WHERE Booking_ID = %s", (booking_id,))
            
            if cursor.rowcount == 0:
                error_msg = 'Booking not found or already deleted'
                print(f"Delete error: {error_msg}")
                return jsonify({'success': False, 'error': error_msg}), 404
        
        print(f"Booking {booking_id} deleted successfully")
        return jsonify({
            'success': True,
            'message': 'Booking deleted successfully'
        }), 200
    except Exception as e:
        error_msg = f'Server error while deleting booking: {str(e)}'
        print(f"General error: {error_msg}")
        return jsonify({'success': False, 'error': error_msg}), 500

@bookings_bp.route('/audit', methods=['GET'])
def get_booking_audit():
    """Get booking audit log with timezone conversion"""
    try:
        query = """
            SELECT 
                ba.Audit_ID, ba.Booking_ID, ba.Operation, ba.Op_Time, ba.Details
            FROM BookingAudit ba
            ORDER BY ba.Op_Time DESC
            LIMIT 100
        """
        audit_logs = db.execute_query(query)
        
        # Convert audit timestamps from IST to UTC
        for log in audit_logs:
            if log.get('Op_Time'):
                log['Op_Time'] = convert_ist_to_utc(log['Op_Time'])
        
        print(f"Retrieved {len(audit_logs)} audit log entries with timezone conversion")
        return jsonify({'success': True, 'data': audit_logs}), 200
    except Exception as e:
        error_msg = f'Error fetching audit logs: {str(e)}'
        print(f"Audit fetch error: {error_msg}")
        return jsonify({'success': False, 'error': error_msg}), 500