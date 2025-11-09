from flask import Blueprint, request, jsonify
from database.db import db
import re

airports_bp = Blueprint('airports', __name__)

@airports_bp.route('/', methods=['GET'])
def get_all_airports():
    """Get all airports with traffic and staff statistics"""
    try:
        query = """
            SELECT 
                a.Airport_ID, a.Name, a.City, a.Country,
                COALESCE(dep.departures, 0) as departures,
                COALESCE(arr.arrivals, 0) as arrivals,
                COALESCE(staff.total_staff, 0) as total_staff
            FROM Airport a
            LEFT JOIN (
                SELECT From_Airport_ID, COUNT(*) as departures
                FROM Flight 
                WHERE Status IN ('Scheduled', 'Delayed')
                GROUP BY From_Airport_ID
            ) dep ON a.Airport_ID = dep.From_Airport_ID
            LEFT JOIN (
                SELECT To_Airport_ID, COUNT(*) as arrivals
                FROM Flight 
                WHERE Status IN ('Scheduled', 'Delayed')
                GROUP BY To_Airport_ID
            ) arr ON a.Airport_ID = arr.To_Airport_ID
            LEFT JOIN (
                SELECT Airport_ID, COUNT(*) as total_staff
                FROM Staff
                GROUP BY Airport_ID
            ) staff ON a.Airport_ID = staff.Airport_ID
            ORDER BY a.Country, a.City
        """
        airports = db.execute_query(query)
        print(f"Retrieved {len(airports)} airports with statistics")
        return jsonify({'success': True, 'data': airports}), 200
    except Exception as e:
        print(f"Error fetching airports: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@airports_bp.route('/<int:airport_id>', methods=['GET'])
def get_airport(airport_id):
    """Get a specific airport by ID with statistics"""
    try:
        query = """
            SELECT 
                a.Airport_ID, a.Name, a.City, a.Country,
                COALESCE(dep.departures, 0) as departures,
                COALESCE(arr.arrivals, 0) as arrivals,
                COALESCE(staff.total_staff, 0) as total_staff
            FROM Airport a
            LEFT JOIN (
                SELECT From_Airport_ID, COUNT(*) as departures
                FROM Flight 
                WHERE Status IN ('Scheduled', 'Delayed') AND From_Airport_ID = %s
                GROUP BY From_Airport_ID
            ) dep ON a.Airport_ID = dep.From_Airport_ID
            LEFT JOIN (
                SELECT To_Airport_ID, COUNT(*) as arrivals
                FROM Flight 
                WHERE Status IN ('Scheduled', 'Delayed') AND To_Airport_ID = %s
                GROUP BY To_Airport_ID
            ) arr ON a.Airport_ID = arr.To_Airport_ID
            LEFT JOIN (
                SELECT Airport_ID, COUNT(*) as total_staff
                FROM Staff
                WHERE Airport_ID = %s
                GROUP BY Airport_ID
            ) staff ON a.Airport_ID = staff.Airport_ID
            WHERE a.Airport_ID = %s
        """
        airport = db.execute_query(query, (airport_id, airport_id, airport_id, airport_id), fetch_one=True)
        
        if not airport:
            return jsonify({'success': False, 'error': 'Airport not found'}), 404
        
        return jsonify({'success': True, 'data': airport}), 200
    except Exception as e:
        print(f"Error fetching airport {airport_id}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@airports_bp.route('/', methods=['POST'])
def create_airport():
    """Create a new airport with enhanced validation"""
    try:
        data = request.get_json()
        print(f"Creating airport with data: {data}")
        
        # Validate required fields
        required_fields = ['name', 'city', 'country']
        for field in required_fields:
            if field not in data or not data[field].strip():
                return jsonify({'success': False, 'error': f'Missing or empty field: {field}'}), 400
        
        # Clean and validate input data
        name = data['name'].strip()
        city = data['city'].strip()
        country = data['country'].strip()
        
        # Validate field lengths
        if len(name) > 255:
            return jsonify({'success': False, 'error': 'Airport name too long (maximum 255 characters)'}), 400
        if len(city) > 100:
            return jsonify({'success': False, 'error': 'City name too long (maximum 100 characters)'}), 400
        if len(country) > 100:
            return jsonify({'success': False, 'error': 'Country name too long (maximum 100 characters)'}), 400
        
        # Check if airport already exists in same city
        existing_airport = db.execute_query(
            "SELECT Airport_ID, Name FROM Airport WHERE Name = %s AND City = %s", 
            (name, city), 
            fetch_one=True
        )
        if existing_airport:
            return jsonify({'success': False, 'error': 'Airport with this name already exists in this city'}), 400
        
        # Check for similar airports (case-insensitive)
        similar_airport = db.execute_query(
            "SELECT Airport_ID, Name FROM Airport WHERE LOWER(Name) = LOWER(%s) AND LOWER(City) = LOWER(%s)", 
            (name, city), 
            fetch_one=True
        )
        if similar_airport:
            return jsonify({'success': False, 'error': f'Similar airport already exists: {similar_airport["Name"]} in {city}'}), 400
        
        query = """
            INSERT INTO Airport (Name, City, Country)
            VALUES (%s, %s, %s)
        """
        params = (name, city, country)
        
        with db.get_cursor() as (cursor, connection):
            cursor.execute(query, params)
            airport_id = cursor.lastrowid
        
        print(f"Airport created successfully with ID: {airport_id}")
        return jsonify({
            'success': True,
            'message': f'Airport {name} created successfully',
            'airport_id': airport_id
        }), 201
    except Exception as e:
        print(f"Error creating airport: {str(e)}")
        return jsonify({'success': False, 'error': f'Database error: {str(e)}'}), 500

@airports_bp.route('/<int:airport_id>', methods=['PUT'])
def update_airport(airport_id):
    """Update an existing airport with enhanced validation"""
    try:
        data = request.get_json()
        print(f"Updating airport {airport_id} with data: {data}")
        
        # Check if airport exists and get current details
        existing_airport = db.execute_query(
            "SELECT Airport_ID, Name, City, Country FROM Airport WHERE Airport_ID = %s", 
            (airport_id,), 
            fetch_one=True
        )
        if not existing_airport:
            return jsonify({'success': False, 'error': 'Airport not found'}), 404
        
        update_fields = []
        params = []
        changes_made = False
        
        if 'name' in data:
            name = data['name'].strip()
            if not name:
                return jsonify({'success': False, 'error': 'Airport name cannot be empty'}), 400
            
            if len(name) > 255:
                return jsonify({'success': False, 'error': 'Airport name too long (maximum 255 characters)'}), 400
            
            # Only update if actually changed
            if name != existing_airport['Name']:
                # Get city for duplicate check
                check_city = data.get('city', existing_airport['City']).strip()
                
                # Check for duplicate name in same city
                duplicate_check = db.execute_query(
                    "SELECT Airport_ID, Name FROM Airport WHERE Name = %s AND City = %s AND Airport_ID != %s", 
                    (name, check_city, airport_id), 
                    fetch_one=True
                )
                if duplicate_check:
                    return jsonify({'success': False, 'error': 'Airport with this name already exists in this city'}), 400
                
                update_fields.append('Name = %s')
                params.append(name)
                changes_made = True
            
        if 'city' in data:
            city = data['city'].strip()
            if not city:
                return jsonify({'success': False, 'error': 'City cannot be empty'}), 400
            
            if len(city) > 100:
                return jsonify({'success': False, 'error': 'City name too long (maximum 100 characters)'}), 400
            
            # Only update if actually changed
            if city != existing_airport['City']:
                update_fields.append('City = %s')
                params.append(city)
                changes_made = True
            
        if 'country' in data:
            country = data['country'].strip()
            if not country:
                return jsonify({'success': False, 'error': 'Country cannot be empty'}), 400
            
            if len(country) > 100:
                return jsonify({'success': False, 'error': 'Country name too long (maximum 100 characters)'}), 400
            
            # Only update if actually changed
            if country != existing_airport['Country']:
                update_fields.append('Country = %s')
                params.append(country)
                changes_made = True
        
        if not changes_made:
            return jsonify({'success': False, 'error': 'No changes detected. Please modify at least one field to update the airport.'}), 400
        
        params.append(airport_id)
        query = f"UPDATE Airport SET {', '.join(update_fields)} WHERE Airport_ID = %s"
        
        rows_affected = db.execute_update(query, params)
        
        if rows_affected == 0:
            return jsonify({'success': False, 'error': 'Airport not found'}), 404
        
        print(f"Airport {airport_id} updated successfully")
        return jsonify({
            'success': True,
            'message': f'Airport updated successfully'
        }), 200
    except Exception as e:
        print(f"Error updating airport: {str(e)}")
        return jsonify({'success': False, 'error': f'Database error: {str(e)}'}), 500

@airports_bp.route('/<int:airport_id>', methods=['DELETE'])
def delete_airport(airport_id):
    """Delete an airport with comprehensive safety checks"""
    try:
        print(f"Attempting to delete airport: {airport_id}")
        
        # Check if airport exists
        existing_airport = db.execute_query(
            "SELECT Name, City FROM Airport WHERE Airport_ID = %s", 
            (airport_id,), 
            fetch_one=True
        )
        if not existing_airport:
            return jsonify({'success': False, 'error': 'Airport not found'}), 404
        
        # Check if airport has active flights (departures)
        active_departures = db.execute_query(
            """
            SELECT COUNT(*) as count, GROUP_CONCAT(Flight_No) as flights
            FROM Flight 
            WHERE From_Airport_ID = %s AND Status IN ('Scheduled', 'Delayed')
            """, 
            (airport_id,), 
            fetch_one=True
        )
        
        if active_departures['count'] > 0:
            return jsonify({
                'success': False, 
                'error': f'Cannot delete airport with {active_departures["count"]} active departure flights. Cancel or reschedule flights first.'
            }), 400
        
        # Check if airport has active flights (arrivals)
        active_arrivals = db.execute_query(
            """
            SELECT COUNT(*) as count, GROUP_CONCAT(Flight_No) as flights
            FROM Flight 
            WHERE To_Airport_ID = %s AND Status IN ('Scheduled', 'Delayed')
            """, 
            (airport_id,), 
            fetch_one=True
        )
        
        if active_arrivals['count'] > 0:
            return jsonify({
                'success': False, 
                'error': f'Cannot delete airport with {active_arrivals["count"]} active arrival flights. Cancel or reschedule flights first.'
            }), 400
        
        # Check if airport has staff
        airport_staff = db.execute_query(
            """
            SELECT COUNT(*) as count, GROUP_CONCAT(CONCAT(First_Name, ' ', Last_Name)) as staff_names
            FROM Staff 
            WHERE Airport_ID = %s
            """, 
            (airport_id,), 
            fetch_one=True
        )
        
        if airport_staff['count'] > 0:
            return jsonify({
                'success': False, 
                'error': f'Cannot delete airport with {airport_staff["count"]} staff members. Transfer staff to other airports first.'
            }), 400
        
        # Check for any historical data that might prevent deletion
        historical_flights = db.execute_query(
            """
            SELECT COUNT(*) as count 
            FROM Flight 
            WHERE (From_Airport_ID = %s OR To_Airport_ID = %s) 
            AND Status IN ('Completed', 'Cancelled')
            """, 
            (airport_id, airport_id), 
            fetch_one=True
        )
        
        if historical_flights['count'] > 10:  # Allow some historical data
            return jsonify({
                'success': False, 
                'error': f'Cannot delete airport with extensive flight history ({historical_flights["count"]} historical flights). Archive the airport instead.'
            }), 400
        
        # All checks passed, proceed with deletion
        query = "DELETE FROM Airport WHERE Airport_ID = %s"
        rows_affected = db.execute_update(query, (airport_id,))
        
        if rows_affected == 0:
            return jsonify({'success': False, 'error': 'Airport not found'}), 404
        
        print(f"Airport {existing_airport['Name']} deleted successfully")
        return jsonify({
            'success': True,
            'message': f'Airport {existing_airport["Name"]} ({existing_airport["City"]}) deleted successfully'
        }), 200
    except Exception as e:
        print(f"Error deleting airport: {str(e)}")
        return jsonify({'success': False, 'error': f'Database error: {str(e)}'}), 500

@airports_bp.route('/<int:airport_id>/departures', methods=['GET'])
def get_airport_departures(airport_id):
    """Get all departing flights from an airport"""
    try:
        # Check if airport exists
        airport_check = db.execute_query(
            "SELECT Name FROM Airport WHERE Airport_ID = %s", 
            (airport_id,), 
            fetch_one=True
        )
        if not airport_check:
            return jsonify({'success': False, 'error': 'Airport not found'}), 404
        
        query = """
            SELECT 
                f.Flight_ID, f.Flight_No, f.Departure_Time, f.Arrival_Time, 
                f.Status, f.Capacity,
                al.Name AS Airline,
                a2.Name AS To_Airport, a2.City AS To_City,
                COUNT(b.Booking_ID) as booked_seats
            FROM Flight f
            JOIN Airline al ON f.Airline_ID = al.Airline_ID
            JOIN Airport a2 ON f.To_Airport_ID = a2.Airport_ID
            LEFT JOIN Booking b ON f.Flight_ID = b.Flight_ID AND b.Status = 'Booked'
            WHERE f.From_Airport_ID = %s
            GROUP BY f.Flight_ID
            ORDER BY f.Departure_Time
        """
        flights = db.execute_query(query, (airport_id,))
        return jsonify({
            'success': True, 
            'data': flights,
            'airport_name': airport_check['Name']
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@airports_bp.route('/<int:airport_id>/arrivals', methods=['GET'])
def get_airport_arrivals(airport_id):
    """Get all arriving flights to an airport"""
    try:
        # Check if airport exists
        airport_check = db.execute_query(
            "SELECT Name FROM Airport WHERE Airport_ID = %s", 
            (airport_id,), 
            fetch_one=True
        )
        if not airport_check:
            return jsonify({'success': False, 'error': 'Airport not found'}), 404
        
        query = """
            SELECT 
                f.Flight_ID, f.Flight_No, f.Departure_Time, f.Arrival_Time, 
                f.Status, f.Capacity,
                al.Name AS Airline,
                a1.Name AS From_Airport, a1.City AS From_City,
                COUNT(b.Booking_ID) as booked_seats
            FROM Flight f
            JOIN Airline al ON f.Airline_ID = al.Airline_ID
            JOIN Airport a1 ON f.From_Airport_ID = a1.Airport_ID
            LEFT JOIN Booking b ON f.Flight_ID = b.Flight_ID AND b.Status = 'Booked'
            WHERE f.To_Airport_ID = %s
            GROUP BY f.Flight_ID
            ORDER BY f.Arrival_Time
        """
        flights = db.execute_query(query, (airport_id,))
        return jsonify({
            'success': True, 
            'data': flights,
            'airport_name': airport_check['Name']
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@airports_bp.route('/<int:airport_id>/staff', methods=['GET'])
def get_airport_staff(airport_id):
    """Get all staff working at an airport"""
    try:
        # Check if airport exists
        airport_check = db.execute_query(
            "SELECT Name FROM Airport WHERE Airport_ID = %s", 
            (airport_id,), 
            fetch_one=True
        )
        if not airport_check:
            return jsonify({'success': False, 'error': 'Airport not found'}), 404
        
        query = """
            SELECT 
                s.Staff_ID, s.First_Name, s.Last_Name, s.Role,
                al.Name AS Airline,
                a.Name AS Airport_Name
            FROM Staff s
            JOIN Airline al ON s.Airline_ID = al.Airline_ID
            JOIN Airport a ON s.Airport_ID = a.Airport_ID
            WHERE s.Airport_ID = %s
            ORDER BY al.Name, s.Last_Name
        """
        staff = db.execute_query(query, (airport_id,))
        return jsonify({
            'success': True, 
            'data': staff,
            'airport_name': airport_check['Name']
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@airports_bp.route('/statistics', methods=['GET'])
def get_airport_statistics():
    """Get overall airport statistics"""
    try:
        stats_query = """
            SELECT 
                COUNT(*) as total_airports,
                COUNT(DISTINCT Country) as countries_served,
                (SELECT COUNT(*) FROM Flight WHERE Status IN ('Scheduled', 'Delayed')) as active_flights,
                (SELECT COUNT(*) FROM Staff) as total_staff
        """
        
        stats = db.execute_query(stats_query, fetch_one=True)
        
        # Get busiest airports
        busiest_query = """
            SELECT 
                a.Name,
                a.City,
                (COALESCE(dep.departures, 0) + COALESCE(arr.arrivals, 0)) as total_traffic
            FROM Airport a
            LEFT JOIN (
                SELECT From_Airport_ID, COUNT(*) as departures
                FROM Flight 
                WHERE Status IN ('Scheduled', 'Delayed')
                GROUP BY From_Airport_ID
            ) dep ON a.Airport_ID = dep.From_Airport_ID
            LEFT JOIN (
                SELECT To_Airport_ID, COUNT(*) as arrivals
                FROM Flight 
                WHERE Status IN ('Scheduled', 'Delayed')
                GROUP BY To_Airport_ID
            ) arr ON a.Airport_ID = arr.To_Airport_ID
            ORDER BY total_traffic DESC
            LIMIT 5
        """
        
        busiest = db.execute_query(busiest_query)
        
        return jsonify({
            'success': True,
            'data': {
                'overall_stats': stats,
                'busiest_airports': busiest
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500