from flask import Blueprint, request, jsonify
from database.db import db

airports_bp = Blueprint('airports', __name__)

@airports_bp.route('/', methods=['GET'])
def get_all_airports():
    """Get all airports"""
    try:
        query = """
            SELECT Airport_ID, Name, City, Country 
            FROM Airport 
            ORDER BY Country, City
        """
        airports = db.execute_query(query)
        return jsonify({'success': True, 'data': airports}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@airports_bp.route('/<int:airport_id>', methods=['GET'])
def get_airport(airport_id):
    """Get a specific airport by ID"""
    try:
        query = """
            SELECT Airport_ID, Name, City, Country 
            FROM Airport 
            WHERE Airport_ID = %s
        """
        airport = db.execute_query(query, (airport_id,), fetch_one=True)
        
        if not airport:
            return jsonify({'success': False, 'error': 'Airport not found'}), 404
        
        return jsonify({'success': True, 'data': airport}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@airports_bp.route('/', methods=['POST'])
def create_airport():
    """Create a new airport"""
    try:
        data = request.get_json()
        
        required_fields = ['name', 'city', 'country']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
        
        query = """
            INSERT INTO Airport (Name, City, Country)
            VALUES (%s, %s, %s)
        """
        params = (data['name'], data['city'], data['country'])
        
        with db.get_cursor() as (cursor, connection):
            cursor.execute(query, params)
            airport_id = cursor.lastrowid
        
        return jsonify({
            'success': True,
            'message': 'Airport created successfully',
            'airport_id': airport_id
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@airports_bp.route('/<int:airport_id>', methods=['PUT'])
def update_airport(airport_id):
    """Update an existing airport"""
    try:
        data = request.get_json()
        
        update_fields = []
        params = []
        
        if 'name' in data:
            update_fields.append('Name = %s')
            params.append(data['name'])
        if 'city' in data:
            update_fields.append('City = %s')
            params.append(data['city'])
        if 'country' in data:
            update_fields.append('Country = %s')
            params.append(data['country'])
        
        if not update_fields:
            return jsonify({'success': False, 'error': 'No fields to update'}), 400
        
        params.append(airport_id)
        query = f"UPDATE Airport SET {', '.join(update_fields)} WHERE Airport_ID = %s"
        
        rows_affected = db.execute_update(query, params)
        
        if rows_affected == 0:
            return jsonify({'success': False, 'error': 'Airport not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Airport updated successfully'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@airports_bp.route('/<int:airport_id>', methods=['DELETE'])
def delete_airport(airport_id):
    """Delete an airport"""
    try:
        query = "DELETE FROM Airport WHERE Airport_ID = %s"
        rows_affected = db.execute_update(query, (airport_id,))
        
        if rows_affected == 0:
            return jsonify({'success': False, 'error': 'Airport not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Airport deleted successfully'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@airports_bp.route('/<int:airport_id>/departures', methods=['GET'])
def get_airport_departures(airport_id):
    """Get all departing flights from an airport"""
    try:
        query = """
            SELECT 
                f.Flight_ID, f.Flight_No, f.Departure_Time, f.Arrival_Time, 
                f.Status,
                al.Name AS Airline,
                a2.Name AS To_Airport, a2.City AS To_City
            FROM Flight f
            JOIN Airline al ON f.Airline_ID = al.Airline_ID
            JOIN Airport a2 ON f.To_Airport_ID = a2.Airport_ID
            WHERE f.From_Airport_ID = %s
            ORDER BY f.Departure_Time
        """
        flights = db.execute_query(query, (airport_id,))
        return jsonify({'success': True, 'data': flights}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@airports_bp.route('/<int:airport_id>/arrivals', methods=['GET'])
def get_airport_arrivals(airport_id):
    """Get all arriving flights to an airport"""
    try:
        query = """
            SELECT 
                f.Flight_ID, f.Flight_No, f.Departure_Time, f.Arrival_Time, 
                f.Status,
                al.Name AS Airline,
                a1.Name AS From_Airport, a1.City AS From_City
            FROM Flight f
            JOIN Airline al ON f.Airline_ID = al.Airline_ID
            JOIN Airport a1 ON f.From_Airport_ID = a1.Airport_ID
            WHERE f.To_Airport_ID = %s
            ORDER BY f.Arrival_Time
        """
        flights = db.execute_query(query, (airport_id,))
        return jsonify({'success': True, 'data': flights}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@airports_bp.route('/<int:airport_id>/staff', methods=['GET'])
def get_airport_staff(airport_id):
    """Get all staff working at an airport"""
    try:
        query = """
            SELECT 
                s.Staff_ID, s.First_Name, s.Last_Name, s.Role,
                al.Name AS Airline
            FROM Staff s
            JOIN Airline al ON s.Airline_ID = al.Airline_ID
            WHERE s.Airport_ID = %s
            ORDER BY al.Name, s.Last_Name
        """
        staff = db.execute_query(query, (airport_id,))
        return jsonify({'success': True, 'data': staff}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500