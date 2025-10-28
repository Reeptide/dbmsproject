from flask import Blueprint, request, jsonify
from database.db import db

airlines_bp = Blueprint('airlines', __name__)

@airlines_bp.route('/', methods=['GET'])
def get_all_airlines():
    """Get all airlines"""
    try:
        query = """
            SELECT Airline_ID, Name, Contact_Info 
            FROM Airline 
            ORDER BY Name
        """
        airlines = db.execute_query(query)
        return jsonify({'success': True, 'data': airlines}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@airlines_bp.route('/<int:airline_id>', methods=['GET'])
def get_airline(airline_id):
    """Get a specific airline by ID"""
    try:
        query = """
            SELECT Airline_ID, Name, Contact_Info 
            FROM Airline 
            WHERE Airline_ID = %s
        """
        airline = db.execute_query(query, (airline_id,), fetch_one=True)
        
        if not airline:
            return jsonify({'success': False, 'error': 'Airline not found'}), 404
        
        return jsonify({'success': True, 'data': airline}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@airlines_bp.route('/', methods=['POST'])
def create_airline():
    """Create a new airline"""
    try:
        data = request.get_json()
        
        if 'name' not in data:
            return jsonify({'success': False, 'error': 'Missing field: name'}), 400
        
        query = """
            INSERT INTO Airline (Name, Contact_Info)
            VALUES (%s, %s)
        """
        params = (data['name'], data.get('contact_info'))
        
        with db.get_cursor() as (cursor, connection):
            cursor.execute(query, params)
            airline_id = cursor.lastrowid
        
        return jsonify({
            'success': True,
            'message': 'Airline created successfully',
            'airline_id': airline_id
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@airlines_bp.route('/<int:airline_id>', methods=['PUT'])
def update_airline(airline_id):
    """Update an existing airline"""
    try:
        data = request.get_json()
        
        update_fields = []
        params = []
        
        if 'name' in data:
            update_fields.append('Name = %s')
            params.append(data['name'])
        if 'contact_info' in data:
            update_fields.append('Contact_Info = %s')
            params.append(data['contact_info'])
        
        if not update_fields:
            return jsonify({'success': False, 'error': 'No fields to update'}), 400
        
        params.append(airline_id)
        query = f"UPDATE Airline SET {', '.join(update_fields)} WHERE Airline_ID = %s"
        
        rows_affected = db.execute_update(query, params)
        
        if rows_affected == 0:
            return jsonify({'success': False, 'error': 'Airline not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Airline updated successfully'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@airlines_bp.route('/<int:airline_id>', methods=['DELETE'])
def delete_airline(airline_id):
    """Delete an airline"""
    try:
        query = "DELETE FROM Airline WHERE Airline_ID = %s"
        rows_affected = db.execute_update(query, (airline_id,))
        
        if rows_affected == 0:
            return jsonify({'success': False, 'error': 'Airline not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Airline deleted successfully'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@airlines_bp.route('/<int:airline_id>/flights', methods=['GET'])
def get_airline_flights(airline_id):
    """Get all flights for a specific airline"""
    try:
        query = """
            SELECT 
                f.Flight_ID, f.Flight_No, f.Departure_Time, f.Arrival_Time, 
                f.Status, f.Capacity,
                a1.Name AS From_Airport, a1.City AS From_City,
                a2.Name AS To_Airport, a2.City AS To_City
            FROM Flight f
            JOIN Airport a1 ON f.From_Airport_ID = a1.Airport_ID
            JOIN Airport a2 ON f.To_Airport_ID = a2.Airport_ID
            WHERE f.Airline_ID = %s
            ORDER BY f.Departure_Time
        """
        flights = db.execute_query(query, (airline_id,))
        return jsonify({'success': True, 'data': flights}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@airlines_bp.route('/<int:airline_id>/staff', methods=['GET'])
def get_airline_staff(airline_id):
    """Get all staff for a specific airline"""
    try:
        query = """
            SELECT 
                s.Staff_ID, s.First_Name, s.Last_Name, s.Role,
                a.Name AS Airport, a.City AS Airport_City
            FROM Staff s
            JOIN Airport a ON s.Airport_ID = a.Airport_ID
            WHERE s.Airline_ID = %s
            ORDER BY s.Last_Name, s.First_Name
        """
        staff = db.execute_query(query, (airline_id,))
        return jsonify({'success': True, 'data': staff}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500