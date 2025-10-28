from flask import Blueprint, request, jsonify
from database.db import db

staff_bp = Blueprint('staff', __name__)

@staff_bp.route('/', methods=['GET'])
def get_all_staff():
    """Get all staff members"""
    try:
        query = """
            SELECT 
                s.Staff_ID, s.First_Name, s.Last_Name, s.Role,
                al.Name AS Airline,
                a.Name AS Airport, a.City AS Airport_City
            FROM Staff s
            JOIN Airline al ON s.Airline_ID = al.Airline_ID
            JOIN Airport a ON s.Airport_ID = a.Airport_ID
            ORDER BY s.Last_Name, s.First_Name
        """
        staff = db.execute_query(query)
        return jsonify({'success': True, 'data': staff}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@staff_bp.route('/<int:staff_id>', methods=['GET'])
def get_staff(staff_id):
    """Get a specific staff member by ID"""
    try:
        query = """
            SELECT 
                s.Staff_ID, s.First_Name, s.Last_Name, s.Role,
                s.Airline_ID, al.Name AS Airline,
                s.Airport_ID, a.Name AS Airport, a.City AS Airport_City
            FROM Staff s
            JOIN Airline al ON s.Airline_ID = al.Airline_ID
            JOIN Airport a ON s.Airport_ID = a.Airport_ID
            WHERE s.Staff_ID = %s
        """
        staff = db.execute_query(query, (staff_id,), fetch_one=True)
        
        if not staff:
            return jsonify({'success': False, 'error': 'Staff not found'}), 404
        
        return jsonify({'success': True, 'data': staff}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@staff_bp.route('/', methods=['POST'])
def create_staff():
    """Create a new staff member"""
    try:
        data = request.get_json()
        
        required_fields = ['first_name', 'last_name', 'role', 'airline_id', 'airport_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
        
        query = """
            INSERT INTO Staff (First_Name, Last_Name, Role, Airline_ID, Airport_ID)
            VALUES (%s, %s, %s, %s, %s)
        """
        params = (
            data['first_name'],
            data['last_name'],
            data['role'],
            data['airline_id'],
            data['airport_id']
        )
        
        with db.get_cursor() as (cursor, connection):
            cursor.execute(query, params)
            staff_id = cursor.lastrowid
        
        return jsonify({
            'success': True,
            'message': 'Staff created successfully',
            'staff_id': staff_id
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@staff_bp.route('/<int:staff_id>', methods=['PUT'])
def update_staff(staff_id):
    """Update an existing staff member"""
    try:
        data = request.get_json()
        
        update_fields = []
        params = []
        
        field_mapping = {
            'first_name': 'First_Name',
            'last_name': 'Last_Name',
            'role': 'Role',
            'airline_id': 'Airline_ID',
            'airport_id': 'Airport_ID'
        }
        
        for json_field, db_field in field_mapping.items():
            if json_field in data:
                update_fields.append(f'{db_field} = %s')
                params.append(data[json_field])
        
        if not update_fields:
            return jsonify({'success': False, 'error': 'No fields to update'}), 400
        
        params.append(staff_id)
        query = f"UPDATE Staff SET {', '.join(update_fields)} WHERE Staff_ID = %s"
        
        rows_affected = db.execute_update(query, params)
        
        if rows_affected == 0:
            return jsonify({'success': False, 'error': 'Staff not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Staff updated successfully'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@staff_bp.route('/<int:staff_id>', methods=['DELETE'])
def delete_staff(staff_id):
    """Delete a staff member"""
    try:
        query = "DELETE FROM Staff WHERE Staff_ID = %s"
        rows_affected = db.execute_update(query, (staff_id,))
        
        if rows_affected == 0:
            return jsonify({'success': False, 'error': 'Staff not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Staff deleted successfully'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@staff_bp.route('/<int:staff_id>/history', methods=['GET'])
def get_staff_history(staff_id):
    """Get transfer history for a staff member"""
    try:
        query = """
            SELECT 
                sh.History_ID,
                a1.Name AS Old_Airport, a1.City AS Old_City,
                a2.Name AS New_Airport, a2.City AS New_City,
                sh.Changed_At,
                sh.Notes
            FROM StaffHistory sh
            LEFT JOIN Airport a1 ON sh.Old_Airport_ID = a1.Airport_ID
            LEFT JOIN Airport a2 ON sh.New_Airport_ID = a2.Airport_ID
            WHERE sh.Staff_ID = %s
            ORDER BY sh.Changed_At DESC
        """
        history = db.execute_query(query, (staff_id,))
        return jsonify({'success': True, 'data': history}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500