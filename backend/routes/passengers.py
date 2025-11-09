from flask import Blueprint, request, jsonify
from database.db import db
import re

passengers_bp = Blueprint('passengers', __name__)

@passengers_bp.route('/', methods=['GET'])
def get_all_passengers():
    """Get all passengers with booking count"""
    try:
        query = """
            SELECT 
                p.Passenger_ID, p.First_Name, p.Last_Name, p.Email, p.Phone,
                COUNT(CASE WHEN b.Status = 'Booked' THEN 1 END) as booking_count
            FROM Passenger p
            LEFT JOIN Booking b ON p.Passenger_ID = b.Passenger_ID
            GROUP BY p.Passenger_ID, p.First_Name, p.Last_Name, p.Email, p.Phone
            ORDER BY p.Passenger_ID
        """
        passengers = db.execute_query(query)
        return jsonify({'success': True, 'data': passengers}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@passengers_bp.route('/<int:passenger_id>', methods=['GET'])
def get_passenger(passenger_id):
    """Get a specific passenger by ID with booking count"""
    try:
        query = """
            SELECT 
                p.Passenger_ID, p.First_Name, p.Last_Name, p.Email, p.Phone,
                COUNT(CASE WHEN b.Status = 'Booked' THEN 1 END) as booking_count
            FROM Passenger p
            LEFT JOIN Booking b ON p.Passenger_ID = b.Passenger_ID
            WHERE p.Passenger_ID = %s
            GROUP BY p.Passenger_ID, p.First_Name, p.Last_Name, p.Email, p.Phone
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
        
        # Validate required fields - PHONE IS NOW REQUIRED
        required_fields = ['first_name', 'last_name', 'email', 'phone']
        for field in required_fields:
            if field not in data or not data[field].strip():
                return jsonify({'success': False, 'error': f'Missing or empty field: {field}'}), 400
        
        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['email']):
            return jsonify({'success': False, 'error': 'Invalid email format'}), 400
        
        # Check if email already exists
        existing_passenger = db.execute_query(
            "SELECT Passenger_ID FROM Passenger WHERE Email = %s", 
            (data['email'],), 
            fetch_one=True
        )
        if existing_passenger:
            return jsonify({'success': False, 'error': 'Email already exists'}), 400
        
        # ENHANCED PHONE VALIDATION - EXACTLY 10 DIGITS ONLY
        phone = data['phone'].strip()
        if not phone:
            return jsonify({'success': False, 'error': 'Phone number is required'}), 400
        
        # Remove common formatting characters for validation
        clean_phone = phone.replace('-', '').replace(' ', '').replace('(', '').replace(')', '').replace('+', '')
        
        # Check if phone contains only digits after cleaning
        if not clean_phone.isdigit():
            return jsonify({'success': False, 'error': 'Phone number must contain only digits'}), 400
        
        # Check phone length - EXACTLY 10 DIGITS
        if len(clean_phone) != 10:
            return jsonify({'success': False, 'error': 'Phone number must be exactly 10 digits'}), 400
        
        # Check if phone number already exists
        existing_phone = db.execute_query(
            "SELECT Passenger_ID FROM Passenger WHERE Phone = %s", 
            (clean_phone,), 
            fetch_one=True
        )
        if existing_phone:
            return jsonify({'success': False, 'error': 'Phone number already exists'}), 400
        
        query = """
            INSERT INTO Passenger (First_Name, Last_Name, Email, Phone)
            VALUES (%s, %s, %s, %s)
        """
        params = (
            data['first_name'].strip(),
            data['last_name'].strip(),
            data['email'].strip().lower(),
            clean_phone  # Store only digits
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
        
        # Check if passenger exists
        existing = db.execute_query(
            "SELECT Passenger_ID FROM Passenger WHERE Passenger_ID = %s", 
            (passenger_id,), 
            fetch_one=True
        )
        if not existing:
            return jsonify({'success': False, 'error': 'No changes detected. Please modify at least one field'}), 404
        
        # Build dynamic update query
        update_fields = []
        params = []
        
        if 'first_name' in data:
            if not data['first_name'].strip():
                return jsonify({'success': False, 'error': 'First name cannot be empty'}), 400
            update_fields.append('First_Name = %s')
            params.append(data['first_name'].strip())
            
        if 'last_name' in data:
            if not data['last_name'].strip():
                return jsonify({'success': False, 'error': 'Last name cannot be empty'}), 400
            update_fields.append('Last_Name = %s')
            params.append(data['last_name'].strip())
            
        if 'email' in data:
            email = data['email'].strip().lower()
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, email):
                return jsonify({'success': False, 'error': 'Invalid email format'}), 400
            
            # Check if email already exists for another passenger
            existing_email = db.execute_query(
                "SELECT Passenger_ID FROM Passenger WHERE Email = %s AND Passenger_ID != %s", 
                (email, passenger_id), 
                fetch_one=True
            )
            if existing_email:
                return jsonify({'success': False, 'error': 'Email already exists'}), 400
            
            update_fields.append('Email = %s')
            params.append(email)
            
        if 'phone' in data:
            phone = data['phone'].strip()
            
            # ENHANCED PHONE VALIDATION FOR UPDATE - EXACTLY 10 DIGITS
            if not phone:
                return jsonify({'success': False, 'error': 'Phone number cannot be empty'}), 400
            
            # Remove common formatting characters for validation
            clean_phone = phone.replace('-', '').replace(' ', '').replace('(', '').replace(')', '').replace('+', '')
            
            # Check if phone contains only digits after cleaning
            if not clean_phone.isdigit():
                return jsonify({'success': False, 'error': 'Phone number must contain only digits'}), 400
            
            # Check phone length - EXACTLY 10 DIGITS
            if len(clean_phone) != 10:
                return jsonify({'success': False, 'error': 'Phone number must be exactly 10 digits'}), 400
            
            # Check if phone number already exists for another passenger
            existing_phone = db.execute_query(
                "SELECT Passenger_ID FROM Passenger WHERE Phone = %s AND Passenger_ID != %s", 
                (clean_phone, passenger_id), 
                fetch_one=True
            )
            if existing_phone:
                return jsonify({'success': False, 'error': 'Phone number already exists'}), 400
            
            update_fields.append('Phone = %s')
            params.append(clean_phone)
        
        if not update_fields:
            return jsonify({'success': False, 'error': 'No fields to update'}), 400
        
        params.append(passenger_id)
        query = f"UPDATE Passenger SET {', '.join(update_fields)} WHERE Passenger_ID = %s"
        
        rows_affected = db.execute_update(query, params)
        
        if rows_affected == 0:
            return jsonify({'success': False, 'error': 'No changes detected. Please modify at least one field'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Passenger updated successfully'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@passengers_bp.route('/<int:passenger_id>', methods=['DELETE'])
def delete_passenger(passenger_id):
    """Delete a passenger (with active booking check)"""
    try:
        # Check if passenger exists
        passenger = db.execute_query(
            "SELECT First_Name, Last_Name FROM Passenger WHERE Passenger_ID = %s", 
            (passenger_id,), 
            fetch_one=True
        )
        if not passenger:
            return jsonify({'success': False, 'error': 'Passenger not found'}), 404
        
        # Check for active bookings
        active_bookings = db.execute_query(
            "SELECT COUNT(*) as count FROM Booking WHERE Passenger_ID = %s AND Status = 'Booked'", 
            (passenger_id,), 
            fetch_one=True
        )
        
        if active_bookings['count'] > 0:
            return jsonify({
                'success': False, 
                'error': f'Cannot delete passenger with {active_bookings["count"]} active bookings. Cancel bookings first.'
            }), 400
        
        # Log passenger deletion for audit
        try:
            with db.get_cursor() as (cursor, connection):
                # Insert audit record
                cursor.execute(
                    "INSERT INTO PassengerAudit (Passenger_ID, Action, Details) VALUES (%s, %s, %s)",
                    (passenger_id, 'DELETE', f"Deleted passenger: {passenger['First_Name']} {passenger['Last_Name']}")
                )
                
                # Delete passenger
                cursor.execute("DELETE FROM Passenger WHERE Passenger_ID = %s", (passenger_id,))
                
        except Exception as audit_error:
            # If audit table doesn't exist, just delete the passenger
            db.execute_update("DELETE FROM Passenger WHERE Passenger_ID = %s", (passenger_id,))
        
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
        # Check if passenger exists
        passenger = db.execute_query(
            "SELECT First_Name, Last_Name FROM Passenger WHERE Passenger_ID = %s", 
            (passenger_id,), 
            fetch_one=True
        )
        if not passenger:
            return jsonify({'success': False, 'error': 'Passenger not found'}), 404
        
        query = """
            SELECT 
                b.Booking_ID, b.Date, b.Seat_No, b.Status, b.Booking_Time,
                f.Flight_No, f.Departure_Time, f.Arrival_Time, f.Status as Flight_Status,
                al.Name AS Airline,
                a1.Name AS From_Airport, a1.City AS From_City,
                a2.Name AS To_Airport, a2.City AS To_City
            FROM Booking b
            JOIN Flight f ON b.Flight_ID = f.Flight_ID
            JOIN Airline al ON f.Airline_ID = al.Airline_ID
            JOIN Airport a1 ON f.From_Airport_ID = a1.Airport_ID
            JOIN Airport a2 ON f.To_Airport_ID = a2.Airport_ID
            WHERE b.Passenger_ID = %s
            ORDER BY b.Date DESC, b.Booking_Time DESC
        """
        bookings = db.execute_query(query, (passenger_id,))
        return jsonify({
            'success': True, 
            'data': bookings,
            'passenger': {
                'name': f"{passenger['First_Name']} {passenger['Last_Name']}",
                'total_bookings': len(bookings)
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@passengers_bp.route('/<int:passenger_id>/booking-count', methods=['GET'])
def get_passenger_booking_count(passenger_id):
    """Get total booking count using MySQL function"""
    try:
        # Check if passenger exists
        passenger_exists = db.execute_query(
            "SELECT Passenger_ID FROM Passenger WHERE Passenger_ID = %s", 
            (passenger_id,), 
            fetch_one=True
        )
        if not passenger_exists:
            return jsonify({'success': False, 'error': 'Passenger not found'}), 404
        
        count = db.call_function('fn_PassengerBookingCount', [passenger_id])
        return jsonify({
            'success': True,
            'passenger_id': passenger_id,
            'booking_count': count
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@passengers_bp.route('/create-with-booking', methods=['POST'])
def create_passenger_with_booking():
    """Create passenger and booking with comprehensive business logic validation"""
    try:
        data = request.get_json()
        
        # Validate required fields - PHONE IS NOW REQUIRED
        required_fields = ['first_name', 'last_name', 'email', 'phone', 'flight_no', 'seat_no']
        for field in required_fields:
            if field not in data or not str(data[field]).strip():
                return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
        
        # Enhanced phone validation - EXACTLY 10 DIGITS
        phone = data['phone'].strip()
        if not phone:
            return jsonify({'success': False, 'error': 'Phone number is required'}), 400
        
        clean_phone = phone.replace('-', '').replace(' ', '').replace('(', '').replace(')', '').replace('+', '')
        
        if not clean_phone.isdigit():
            return jsonify({'success': False, 'error': 'Phone number must contain only digits'}), 400
        
        if len(clean_phone) != 10:
            return jsonify({'success': False, 'error': 'Phone number must be exactly 10 digits'}), 400
        
        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['email']):
            return jsonify({'success': False, 'error': 'Invalid email format'}), 400
        
        print(f"Attempting to create booking with data: {data}")
        
        # ==== COMPREHENSIVE BUSINESS LOGIC VALIDATION ====
        
        # 1. CHECK IF FLIGHT EXISTS AND GET STATUS
        flight_check = db.execute_query(
            "SELECT Flight_ID, Status, Flight_No, Capacity FROM Flight WHERE Flight_No = %s", 
            (data['flight_no'],), 
            fetch_one=True
        )
        
        if not flight_check:
            print(f"Flight not found: {data['flight_no']}")
            return jsonify({'success': False, 'error': 'Flight not found'}), 404
        
        flight_id = flight_check['Flight_ID']
        flight_status = flight_check['Status']
        flight_capacity = flight_check['Capacity']
        
        print(f"Flight found: {data['flight_no']}, Status: {flight_status}, Capacity: {flight_capacity}")
        
        # 2. CHECK IF FLIGHT IS CANCELLED
        if flight_status == 'Cancelled':
            print(f"Cannot book on cancelled flight: {data['flight_no']}")
            return jsonify({'success': False, 'error': 'Cannot book a cancelled flight'}), 400
        
        # 3. CHECK IF SEAT IS ALREADY BOOKED
        seat_check = db.execute_query(
            """SELECT b.Booking_ID, p.First_Name, p.Last_Name 
               FROM Booking b 
               JOIN Passenger p ON b.Passenger_ID = p.Passenger_ID
               WHERE b.Flight_ID = %s AND b.Seat_No = %s AND b.Status = 'Booked'""", 
            (flight_id, data['seat_no']), 
            fetch_one=True
        )
        
        if seat_check:
            print(f"Seat already booked: {data['seat_no']} on flight {data['flight_no']}")
            return jsonify({'success': False, 'error': 'Seat already booked on this flight'}), 400
        
        # 4. CHECK IF EMAIL ALREADY EXISTS
        email_check = db.execute_query(
            "SELECT Passenger_ID, First_Name, Last_Name FROM Passenger WHERE Email = %s", 
            (data['email'],), 
            fetch_one=True
        )
        
        if email_check:
            print(f"Email already exists: {data['email']}")
            return jsonify({'success': False, 'error': 'Email already exists. Use a different email address.'}), 400
        
        # 5. CHECK IF PHONE NUMBER ALREADY EXISTS
        phone_check = db.execute_query(
            "SELECT Passenger_ID, First_Name, Last_Name FROM Passenger WHERE Phone = %s", 
            (clean_phone,), 
            fetch_one=True
        )
        
        if phone_check:
            print(f"Phone number already exists: {clean_phone}")
            return jsonify({'success': False, 'error': 'Phone number already exists. Use a different phone number.'}), 400
        
        # 6. CHECK IF FLIGHT IS FULL
        booked_seats = db.execute_query(
            "SELECT COUNT(*) as count FROM Booking WHERE Flight_ID = %s AND Status = 'Booked'", 
            (flight_id,), 
            fetch_one=True
        )
        
        if booked_seats and booked_seats['count'] >= flight_capacity:
            print(f"Flight full: {data['flight_no']}, Booked: {booked_seats['count']}, Capacity: {flight_capacity}")
            return jsonify({'success': False, 'error': 'No seats available on this flight'}), 400
        
        print("All validations passed, proceeding with creation...")
        
        # ==== CALL STORED PROCEDURE WITH FALLBACK ====
        booking_id = None
        creation_method = 'unknown'
        first_name = data['first_name']
        last_name = data['last_name']
        
        try:
            # Try using stored procedure first
            with db.get_cursor() as (cursor, connection):
                cursor.callproc('sp_CreateBooking', [
                    data['first_name'],
                    data['last_name'], 
                    data['email'],
                    clean_phone,  # Use clean phone (digits only)
                    data['flight_no'],
                    data['seat_no'],
                    0  # placeholder for output parameter
                ])
                
                # Fetch any results from the procedure
                for result in cursor.stored_results():
                    rows = result.fetchall()
                    if rows:
                        print(f"Stored procedure results: {rows}")
                
                # Get the booking ID of the created booking
                booking_query = """
                    SELECT b.Booking_ID, b.Status, p.First_Name, p.Last_Name
                    FROM Booking b 
                    JOIN Passenger p ON b.Passenger_ID = p.Passenger_ID 
                    WHERE p.Email = %s 
                    ORDER BY b.Booking_ID DESC 
                    LIMIT 1
                """
                
                cursor.execute(booking_query, (data['email'],))
                booking_result = cursor.fetchone()
                
                if booking_result:
                    if isinstance(booking_result, tuple):
                        booking_id, booking_status, first_name, last_name = booking_result
                    else:
                        booking_id = booking_result['Booking_ID']
                        booking_status = booking_result['Status']
                        first_name = booking_result['First_Name']
                        last_name = booking_result['Last_Name']
                    
                    creation_method = 'stored_procedure'
                    print(f"Booking created via stored procedure: ID={booking_id}, Status={booking_status}")
        
        except Exception as proc_error:
            print(f"Stored procedure failed: {proc_error}")
            print("Falling back to manual creation...")
            
            # ==== MANUAL CREATION FALLBACK ====
            try:
                with db.get_cursor() as (cursor, connection):
                    # Create passenger
                    passenger_query = """
                        INSERT INTO Passenger (First_Name, Last_Name, Email, Phone)
                        VALUES (%s, %s, %s, %s)
                    """
                    cursor.execute(passenger_query, (
                        data['first_name'].strip(),
                        data['last_name'].strip(),
                        data['email'].strip().lower(),
                        clean_phone  # Store clean phone
                    ))
                    passenger_id = cursor.lastrowid
                    
                    # Create booking with current timestamp
                    booking_query = """
                        INSERT INTO Booking (Date, Seat_No, Passenger_ID, Flight_ID, Status, Booking_Time)
                        VALUES (CURDATE(), %s, %s, %s, 'Booked', NOW())
                    """
                    cursor.execute(booking_query, (data['seat_no'], passenger_id, flight_id))
                    booking_id = cursor.lastrowid
                    
                    creation_method = 'manual'
                    
                    print(f"Booking created manually: ID={booking_id}, Passenger ID={passenger_id}")
            
            except Exception as manual_error:
                print(f"Manual creation also failed: {manual_error}")
                return jsonify({'success': False, 'error': f'Booking creation failed: {str(manual_error)}'}), 500
        
        if booking_id:
            return jsonify({
                'success': True,
                'message': f'Passenger {first_name} {last_name} and booking created successfully',
                'booking_id': booking_id,
                'method': creation_method
            }), 201
        else:
            return jsonify({'success': False, 'error': 'Booking creation failed - no booking ID returned'}), 500
                
    except Exception as e:
        print(f"General error in create_passenger_with_booking: {str(e)}")
        return jsonify({'success': False, 'error': f'Server error: {str(e)}'}), 500

@passengers_bp.route('/search', methods=['GET'])
def search_passengers():
    """Search passengers with advanced filters"""
    try:
        name = request.args.get('name', '')
        email = request.args.get('email', '')
        min_bookings = request.args.get('min_bookings', 0, type=int)
        
        query = """
            SELECT 
                p.Passenger_ID, p.First_Name, p.Last_Name, p.Email, p.Phone,
                COUNT(CASE WHEN b.Status = 'Booked' THEN 1 END) as booking_count
            FROM Passenger p
            LEFT JOIN Booking b ON p.Passenger_ID = b.Passenger_ID
            WHERE 1=1
        """
        params = []
        
        if name:
            query += " AND (CONCAT(p.First_Name, ' ', p.Last_Name) LIKE %s)"
            params.append(f'%{name}%')
        if email:
            query += " AND p.Email LIKE %s"
            params.append(f'%{email}%')
        
        query += " GROUP BY p.Passenger_ID, p.First_Name, p.Last_Name, p.Email, p.Phone"
        
        if min_bookings > 0:
            query += f" HAVING booking_count >= %s"
            params.append(min_bookings)
        
        query += " ORDER BY booking_count DESC, p.Last_Name"
        
        passengers = db.execute_query(query, params)
        return jsonify({
            'success': True, 
            'data': passengers,
            'search_params': {
                'name': name,
                'email': email,
                'min_bookings': min_bookings
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500