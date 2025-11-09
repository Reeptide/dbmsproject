from flask import Blueprint, request, jsonify
from database.db import db
from datetime import datetime

flights_bp = Blueprint('flights', __name__)

@flights_bp.route('/', methods=['GET'])
def get_all_flights():
    """Get all flights with optional filters and available seats calculation"""
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
                a2.Name AS To_Airport, a2.City AS To_City, a2.Country AS To_Country,
                (f.Capacity - COALESCE((
                    SELECT COUNT(*) FROM Booking b 
                    WHERE b.Flight_ID = f.Flight_ID AND b.Status = 'Booked'
                ), 0)) AS available_seats
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
    """Get a specific flight by ID with available seats"""
    try:
        query = """
            SELECT 
                f.Flight_ID, f.Flight_No, f.Departure_Time, f.Arrival_Time, f.Status,
                f.Capacity,
                al.Airline_ID, al.Name AS Airline,
                a1.Airport_ID AS From_Airport_ID, a1.Name AS From_Airport, 
                a1.City AS From_City, a1.Country AS From_Country,
                a2.Airport_ID AS To_Airport_ID, a2.Name AS To_Airport, 
                a2.City AS To_City, a2.Country AS To_Country,
                (f.Capacity - COALESCE((
                    SELECT COUNT(*) FROM Booking b 
                    WHERE b.Flight_ID = f.Flight_ID AND b.Status = 'Booked'
                ), 0)) AS available_seats
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
        
        # Validate departure time is in the future
        try:
            departure_time = datetime.fromisoformat(data['departure_time'].replace('T', ' '))
            arrival_time = datetime.fromisoformat(data['arrival_time'].replace('T', ' '))
            
            if departure_time <= datetime.now():
                return jsonify({'success': False, 'error': 'Departure time must be in the future'}), 400
            
            if arrival_time <= departure_time:
                return jsonify({'success': False, 'error': 'Arrival time must be after departure time'}), 400
                
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid date format'}), 400
        
        # Check if flight number already exists
        existing_flight = db.execute_query(
            "SELECT Flight_ID FROM Flight WHERE Flight_No = %s", 
            (data['flight_no'],), 
            fetch_one=True
        )
        if existing_flight:
            return jsonify({'success': False, 'error': 'Flight number already exists'}), 400
        
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
        
        # Check if flight exists
        existing_flight = db.execute_query(
            "SELECT Flight_ID, Status FROM Flight WHERE Flight_ID = %s", 
            (flight_id,), 
            fetch_one=True
        )
        if not existing_flight:
            return jsonify({'success': False, 'error': 'Flight not found'}), 404
        
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
                # Validate flight_no uniqueness if being updated
                if json_field == 'flight_no':
                    existing_flight_no = db.execute_query(
                        "SELECT Flight_ID FROM Flight WHERE Flight_No = %s AND Flight_ID != %s", 
                        (data[json_field], flight_id), 
                        fetch_one=True
                    )
                    if existing_flight_no:
                        return jsonify({'success': False, 'error': 'Flight number already exists'}), 400
                
                # Validate datetime fields
                if json_field in ['departure_time', 'arrival_time']:
                    try:
                        datetime.fromisoformat(data[json_field].replace('T', ' '))
                    except ValueError:
                        return jsonify({'success': False, 'error': f'Invalid {json_field} format'}), 400
                
                # Validate capacity
                if json_field == 'capacity':
                    if int(data[json_field]) < 1:
                        return jsonify({'success': False, 'error': 'Capacity must be at least 1'}), 400
                
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
    """Delete a flight (this will also delete associated bookings due to CASCADE)"""
    try:
        # Check if flight exists
        existing_flight = db.execute_query(
            "SELECT Flight_No FROM Flight WHERE Flight_ID = %s", 
            (flight_id,), 
            fetch_one=True
        )
        if not existing_flight:
            return jsonify({'success': False, 'error': 'Flight not found'}), 404
        
        # Check if there are active bookings
        active_bookings = db.execute_query(
            "SELECT COUNT(*) as count FROM Booking WHERE Flight_ID = %s AND Status = 'Booked'", 
            (flight_id,), 
            fetch_one=True
        )
        
        if active_bookings['count'] > 0:
            return jsonify({
                'success': False, 
                'error': f'Cannot delete flight with {active_bookings["count"]} active bookings. Cancel the flight first.'
            }), 400
        
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

@flights_bp.route('/cancel', methods=['POST'])
def cancel_flight():
    """Cancel a flight using stored procedure"""
    try:
        data = request.get_json()
        
        if 'flight_no' not in data:
            return jsonify({'success': False, 'error': 'Missing flight_no'}), 400
        
        # Call the stored procedure
        try:
            db.call_procedure('sp_CancelFlight', [data['flight_no']])
            return jsonify({
                'success': True,
                'message': f'Flight {data["flight_no"]} cancelled successfully. All associated bookings have been cancelled.'
            }), 200
        except Exception as proc_error:
            error_msg = str(proc_error)
            if 'Flight not found' in error_msg:
                return jsonify({'success': False, 'error': 'Flight not found'}), 404
            else:
                return jsonify({'success': False, 'error': error_msg}), 400
                
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
        # Check if flight exists
        flight = db.execute_query(
            "SELECT Flight_No FROM Flight WHERE Flight_ID = %s", 
            (flight_id,), 
            fetch_one=True
        )
        if not flight:
            return jsonify({'success': False, 'error': 'Flight not found'}), 404
        
        query = """
            SELECT 
                b.Booking_ID, b.Date, b.Seat_No, b.Status, b.Booking_Time,
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

@flights_bp.route('/search', methods=['GET'])
def search_flights():
    """Search flights with advanced filters"""
    try:
        # Get search parameters
        from_city = request.args.get('from_city')
        to_city = request.args.get('to_city')
        departure_date = request.args.get('departure_date')
        status = request.args.get('status', 'Scheduled')
        min_seats = request.args.get('min_seats', 1, type=int)
        
        query = """
            SELECT 
                f.Flight_ID, f.Flight_No, f.Departure_Time, f.Arrival_Time, f.Status,
                f.Capacity,
                al.Name AS Airline,
                a1.Name AS From_Airport, a1.City AS From_City,
                a2.Name AS To_Airport, a2.City AS To_City,
                (f.Capacity - COALESCE((
                    SELECT COUNT(*) FROM Booking b 
                    WHERE b.Flight_ID = f.Flight_ID AND b.Status = 'Booked'
                ), 0)) AS available_seats
            FROM Flight f
            JOIN Airline al ON f.Airline_ID = al.Airline_ID
            JOIN Airport a1 ON f.From_Airport_ID = a1.Airport_ID
            JOIN Airport a2 ON f.To_Airport_ID = a2.Airport_ID
            WHERE f.Status = %s
        """
        params = [status]
        
        if from_city:
            query += " AND a1.City = %s"
            params.append(from_city)
        if to_city:
            query += " AND a2.City = %s"
            params.append(to_city)
        if departure_date:
            query += " AND DATE(f.Departure_Time) = %s"
            params.append(departure_date)
        
        # Filter by minimum available seats
        query += f" HAVING available_seats >= %s"
        params.append(min_seats)
        
        query += " ORDER BY f.Departure_Time"
        
        flights = db.execute_query(query, params)
        return jsonify({
            'success': True, 
            'data': flights,
            'search_params': {
                'from_city': from_city,
                'to_city': to_city,
                'departure_date': departure_date,
                'status': status,
                'min_seats': min_seats
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@flights_bp.route('/statistics', methods=['GET'])
def get_flight_statistics():
    """Get flight statistics"""
    try:
        stats_query = """
            SELECT 
                COUNT(*) as total_flights,
                COUNT(CASE WHEN Status = 'Scheduled' THEN 1 END) as scheduled_flights,
                COUNT(CASE WHEN Status = 'Delayed' THEN 1 END) as delayed_flights,
                COUNT(CASE WHEN Status = 'Cancelled' THEN 1 END) as cancelled_flights,
                COUNT(CASE WHEN Status = 'Completed' THEN 1 END) as completed_flights,
                AVG(Capacity) as avg_capacity,
                SUM(Capacity) as total_capacity,
                SUM(Capacity - COALESCE((
                    SELECT COUNT(*) FROM Booking b 
                    WHERE b.Flight_ID = f.Flight_ID AND b.Status = 'Booked'
                ), 0)) as total_available_seats
            FROM Flight f
        """
        
        stats = db.execute_query(stats_query, fetch_one=True)
        
        # Get busiest routes
        routes_query = """
            SELECT 
                CONCAT(a1.City, ' → ', a2.City) as route,
                COUNT(*) as flight_count,
                AVG(f.Capacity) as avg_capacity
            FROM Flight f
            JOIN Airport a1 ON f.From_Airport_ID = a1.Airport_ID
            JOIN Airport a2 ON f.To_Airport_ID = a2.Airport_ID
            GROUP BY route
            ORDER BY flight_count DESC
            LIMIT 5
        """
        
        routes = db.execute_query(routes_query)
        
        return jsonify({
            'success': True,
            'data': {
                'overall_stats': stats,
                'busiest_routes': routes
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500