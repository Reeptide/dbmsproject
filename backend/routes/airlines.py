from flask import Blueprint, request, jsonify
from database.db import db
import re

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
    """Create a new airline with enhanced validation"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'name' not in data or not data['name'].strip():
            return jsonify({'success': False, 'error': 'Missing field: name'}), 400
        
        airline_name = data['name'].strip()
        
        # Check if airline name already exists
        existing_airline = db.execute_query(
            "SELECT Airline_ID FROM Airline WHERE Name = %s", 
            (airline_name,), 
            fetch_one=True
        )
        if existing_airline:
            return jsonify({'success': False, 'error': 'Airline name already exists'}), 400
        
        # Validate email format if contact_info is provided
        contact_info = data.get('contact_info', '').strip()
        if contact_info:
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, contact_info):
                return jsonify({'success': False, 'error': 'Invalid email format'}), 400
        
        query = """
            INSERT INTO Airline (Name, Contact_Info)
            VALUES (%s, %s)
        """
        params = (airline_name, contact_info if contact_info else None)
        
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
    """Update an existing airline with enhanced validation"""
    try:
        data = request.get_json()
        
        # Check if airline exists and get current values
        existing = db.execute_query(
            "SELECT Airline_ID, Name, Contact_Info FROM Airline WHERE Airline_ID = %s", 
            (airline_id,), 
            fetch_one=True
        )
        if not existing:
            return jsonify({'success': False, 'error': 'Airline not found'}), 404
        
        update_fields = []
        params = []
        changes_made = False
        
        if 'name' in data:
            airline_name = data['name'].strip()
            if not airline_name:
                return jsonify({'success': False, 'error': 'Airline name cannot be empty'}), 400
            
            # Only update if actually changed
            if airline_name != existing['Name']:
                # Check if airline name already exists for another airline
                existing_name = db.execute_query(
                    "SELECT Airline_ID FROM Airline WHERE Name = %s AND Airline_ID != %s", 
                    (airline_name, airline_id), 
                    fetch_one=True
                )
                if existing_name:
                    return jsonify({'success': False, 'error': 'Airline name already exists'}), 400
                
                update_fields.append('Name = %s')
                params.append(airline_name)
                changes_made = True
            
        if 'contact_info' in data:
            contact_info = data['contact_info'].strip()
            if contact_info:
                # Validate email format
                email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                if not re.match(email_pattern, contact_info):
                    return jsonify({'success': False, 'error': 'Invalid email format'}), 400
            
            # Only update if actually changed
            if contact_info != (existing['Contact_Info'] or ''):
                update_fields.append('Contact_Info = %s')
                params.append(contact_info if contact_info else None)
                changes_made = True
        
        if not changes_made:
            return jsonify({'success': False, 'error': 'No changes detected. Please modify at least one field to update the airline.'}), 400
        
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
    """Delete an airline with flight dependency check"""
    try:
        # Check if airline exists
        airline = db.execute_query(
            "SELECT Name FROM Airline WHERE Airline_ID = %s", 
            (airline_id,), 
            fetch_one=True
        )
        if not airline:
            return jsonify({'success': False, 'error': 'Airline not found'}), 404
        
        # Check for existing flights
        flights = db.execute_query(
            "SELECT COUNT(*) as count FROM Flight WHERE Airline_ID = %s", 
            (airline_id,), 
            fetch_one=True
        )
        
        if flights['count'] > 0:
            return jsonify({
                'success': False, 
                'error': f'Cannot delete airline with {flights["count"]} existing flights. Delete or reassign flights first.'
            }), 400
        
        # Check for existing staff
        staff = db.execute_query(
            "SELECT COUNT(*) as count FROM Staff WHERE Airline_ID = %s", 
            (airline_id,), 
            fetch_one=True
        )
        
        if staff['count'] > 0:
            return jsonify({
                'success': False, 
                'error': f'Cannot delete airline with {staff["count"]} existing staff members. Reassign staff first.'
            }), 400
        
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
        # Check if airline exists first
        airline = db.execute_query(
            "SELECT Name FROM Airline WHERE Airline_ID = %s", 
            (airline_id,), 
            fetch_one=True
        )
        if not airline:
            return jsonify({'success': False, 'error': 'Airline not found'}), 404
        
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
        return jsonify({
            'success': True, 
            'data': flights,
            'airline_name': airline['Name']
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@airlines_bp.route('/<int:airline_id>/staff', methods=['GET'])
def get_airline_staff(airline_id):
    """Get all staff for a specific airline"""
    try:
        # Check if airline exists first
        airline = db.execute_query(
            "SELECT Name FROM Airline WHERE Airline_ID = %s", 
            (airline_id,), 
            fetch_one=True
        )
        if not airline:
            return jsonify({'success': False, 'error': 'Airline not found'}), 404
        
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
        return jsonify({
            'success': True, 
            'data': staff,
            'airline_name': airline['Name']
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500