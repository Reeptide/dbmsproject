from flask import Blueprint, request, jsonify
from database.db import db
import re

staff_bp = Blueprint('staff', __name__)

@staff_bp.route('/', methods=['GET'])
def get_all_staff():
    """Get all staff members with enhanced details"""
    try:
        query = """
            SELECT 
                s.Staff_ID, s.First_Name, s.Last_Name, s.Role,
                s.Airline_ID, al.Name AS Airline,
                s.Airport_ID, a.Name AS Airport, a.City AS Airport_City, a.Country AS Airport_Country
            FROM Staff s
            JOIN Airline al ON s.Airline_ID = al.Airline_ID
            JOIN Airport a ON s.Airport_ID = a.Airport_ID
            ORDER BY s.Last_Name, s.First_Name
        """
        staff = db.execute_query(query)
        print(f"Retrieved {len(staff)} staff members")
        return jsonify({'success': True, 'data': staff}), 200
    except Exception as e:
        print(f"Error fetching staff: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@staff_bp.route('/<int:staff_id>', methods=['GET'])
def get_staff(staff_id):
    """Get a specific staff member by ID"""
    try:
        query = """
            SELECT 
                s.Staff_ID, s.First_Name, s.Last_Name, s.Role,
                s.Airline_ID, al.Name AS Airline,
                s.Airport_ID, a.Name AS Airport, a.City AS Airport_City, a.Country AS Airport_Country
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
        print(f"Error fetching staff {staff_id}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@staff_bp.route('/', methods=['POST'])
def create_staff():
    """Create a new staff member with enhanced validation"""
    try:
        data = request.get_json()
        print(f"Creating staff with data: {data}")
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'role', 'airline_id', 'airport_id']
        for field in required_fields:
            if field not in data or not str(data[field]).strip():
                return jsonify({'success': False, 'error': f'Missing or empty field: {field}'}), 400
        
        # Clean and validate input data
        first_name = data['first_name'].strip()
        last_name = data['last_name'].strip()
        role = data['role'].strip()
        airline_id = int(data['airline_id'])
        airport_id = int(data['airport_id'])
        
        # Validate field lengths
        if len(first_name) > 100:
            return jsonify({'success': False, 'error': 'First name too long (maximum 100 characters)'}), 400
        if len(last_name) > 100:
            return jsonify({'success': False, 'error': 'Last name too long (maximum 100 characters)'}), 400
        if len(role) > 100:
            return jsonify({'success': False, 'error': 'Role too long (maximum 100 characters)'}), 400
        
        # Validate name format (only letters, spaces, hyphens, apostrophes)
        name_pattern = r"^[a-zA-Z\s\-'\.]+$"
        if not re.match(name_pattern, first_name):
            return jsonify({'success': False, 'error': 'First name contains invalid characters'}), 400
        if not re.match(name_pattern, last_name):
            return jsonify({'success': False, 'error': 'Last name contains invalid characters'}), 400
        
        # Validate role
        valid_roles = [
            'Pilot', 'Flight Attendant', 'Ground Staff', 'Engineer', 
            'Cabin Crew', 'Technician', 'Security Officer', 
            'Check-in Staff', 'Flight Supervisor'
        ]
        if role not in valid_roles:
            return jsonify({'success': False, 'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'}), 400
        
        # Validate airline exists
        airline_check = db.execute_query(
            "SELECT Airline_ID, Name FROM Airline WHERE Airline_ID = %s", 
            (airline_id,), 
            fetch_one=True
        )
        if not airline_check:
            return jsonify({'success': False, 'error': 'Invalid airline selected'}), 400
        
        # Validate airport exists
        airport_check = db.execute_query(
            "SELECT Airport_ID, Name FROM Airport WHERE Airport_ID = %s", 
            (airport_id,), 
            fetch_one=True
        )
        if not airport_check:
            return jsonify({'success': False, 'error': 'Invalid airport selected'}), 400
        
        # Check for duplicate staff (same name, role, airline)
        duplicate_check = db.execute_query(
            """
            SELECT Staff_ID FROM Staff 
            WHERE LOWER(First_Name) = LOWER(%s) 
            AND LOWER(Last_Name) = LOWER(%s) 
            AND Role = %s 
            AND Airline_ID = %s
            """, 
            (first_name, last_name, role, airline_id), 
            fetch_one=True
        )
        if duplicate_check:
            return jsonify({'success': False, 'error': f'Staff member {first_name} {last_name} with role {role} already exists for {airline_check["Name"]}'}), 400
        
        query = """
            INSERT INTO Staff (First_Name, Last_Name, Role, Airline_ID, Airport_ID)
            VALUES (%s, %s, %s, %s, %s)
        """
        params = (first_name, last_name, role, airline_id, airport_id)
        
        with db.get_cursor() as (cursor, connection):
            cursor.execute(query, params)
            staff_id = cursor.lastrowid
        
        print(f"Staff created successfully with ID: {staff_id}")
        return jsonify({
            'success': True,
            'message': f'Staff member {first_name} {last_name} created successfully',
            'staff_id': staff_id
        }), 201
    except ValueError as ve:
        return jsonify({'success': False, 'error': 'Invalid airline or airport ID format'}), 400
    except Exception as e:
        print(f"Error creating staff: {str(e)}")
        return jsonify({'success': False, 'error': f'Database error: {str(e)}'}), 500

@staff_bp.route('/<int:staff_id>', methods=['PUT'])
def update_staff(staff_id):
    """Update an existing staff member with enhanced validation"""
    try:
        data = request.get_json()
        print(f"Updating staff {staff_id} with data: {data}")
        
        # Check if staff exists and get current details
        existing_staff = db.execute_query(
            """
            SELECT s.Staff_ID, s.First_Name, s.Last_Name, s.Role, s.Airline_ID, s.Airport_ID,
                   al.Name as Airline_Name, a.Name as Airport_Name
            FROM Staff s
            JOIN Airline al ON s.Airline_ID = al.Airline_ID
            JOIN Airport a ON s.Airport_ID = a.Airport_ID
            WHERE s.Staff_ID = %s
            """, 
            (staff_id,), 
            fetch_one=True
        )
        if not existing_staff:
            return jsonify({'success': False, 'error': 'Staff not found'}), 404
        
        update_fields = []
        params = []
        changes_made = False
        
        field_mapping = {
            'first_name': ('First_Name', existing_staff['First_Name']),
            'last_name': ('Last_Name', existing_staff['Last_Name']),
            'role': ('Role', existing_staff['Role']),
            'airline_id': ('Airline_ID', existing_staff['Airline_ID']),
            'airport_id': ('Airport_ID', existing_staff['Airport_ID'])
        }
        
        for json_field, (db_field, current_value) in field_mapping.items():
            if json_field in data:
                new_value = data[json_field]
                
                # Convert to appropriate type and validate
                if json_field in ['first_name', 'last_name', 'role']:
                    new_value = str(new_value).strip()
                    if not new_value:
                        return jsonify({'success': False, 'error': f'{json_field.replace("_", " ").title()} cannot be empty'}), 400
                    
                    # Validate length
                    if len(new_value) > 100:
                        return jsonify({'success': False, 'error': f'{json_field.replace("_", " ").title()} too long (maximum 100 characters)'}), 400
                    
                    # Validate name format for names
                    if json_field in ['first_name', 'last_name']:
                        name_pattern = r"^[a-zA-Z\s\-'\.]+$"
                        if not re.match(name_pattern, new_value):
                            return jsonify({'success': False, 'error': f'{json_field.replace("_", " ").title()} contains invalid characters'}), 400
                    
                    # Validate role
                    if json_field == 'role':
                        valid_roles = [
                            'Pilot', 'Flight Attendant', 'Ground Staff', 'Engineer', 
                            'Cabin Crew', 'Technician', 'Security Officer', 
                            'Check-in Staff', 'Flight Supervisor'
                        ]
                        if new_value not in valid_roles:
                            return jsonify({'success': False, 'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'}), 400
                
                elif json_field in ['airline_id', 'airport_id']:
                    try:
                        new_value = int(new_value)
                    except (ValueError, TypeError):
                        return jsonify({'success': False, 'error': f'Invalid {json_field.replace("_", " ")} format'}), 400
                    
                    # Validate foreign keys
                    if json_field == 'airline_id':
                        airline_check = db.execute_query(
                            "SELECT Airline_ID, Name FROM Airline WHERE Airline_ID = %s", 
                            (new_value,), 
                            fetch_one=True
                        )
                        if not airline_check:
                            return jsonify({'success': False, 'error': 'Invalid airline selected'}), 400
                    
                    if json_field == 'airport_id':
                        airport_check = db.execute_query(
                            "SELECT Airport_ID, Name FROM Airport WHERE Airport_ID = %s", 
                            (new_value,), 
                            fetch_one=True
                        )
                        if not airport_check:
                            return jsonify({'success': False, 'error': 'Invalid airport selected'}), 400
                
                # Only update if actually changed
                if new_value != current_value:
                    update_fields.append(f'{db_field} = %s')
                    params.append(new_value)
                    changes_made = True
        
        if not changes_made:
            return jsonify({'success': False, 'error': 'No changes detected. Please modify at least one field to update the staff member.'}), 400
        
        # Check for potential duplicates if relevant fields changed
        if any(field in data for field in ['first_name', 'last_name', 'role', 'airline_id']):
            first_name = data.get('first_name', existing_staff['First_Name']).strip()
            last_name = data.get('last_name', existing_staff['Last_Name']).strip()
            role = data.get('role', existing_staff['Role'])
            airline_id = data.get('airline_id', existing_staff['Airline_ID'])
            
            duplicate_check = db.execute_query(
                """
                SELECT Staff_ID FROM Staff 
                WHERE LOWER(First_Name) = LOWER(%s) 
                AND LOWER(Last_Name) = LOWER(%s) 
                AND Role = %s 
                AND Airline_ID = %s 
                AND Staff_ID != %s
                """, 
                (first_name, last_name, role, airline_id, staff_id), 
                fetch_one=True
            )
            if duplicate_check:
                return jsonify({'success': False, 'error': f'Another staff member {first_name} {last_name} with role {role} already exists for this airline'}), 400
        
        params.append(staff_id)
        query = f"UPDATE Staff SET {', '.join(update_fields)} WHERE Staff_ID = %s"
        
        rows_affected = db.execute_update(query, params)
        
        if rows_affected == 0:
            return jsonify({'success': False, 'error': 'Staff not found'}), 404
        
        print(f"Staff {staff_id} updated successfully")
        return jsonify({
            'success': True,
            'message': f'Staff member updated successfully'
        }), 200
    except Exception as e:
        print(f"Error updating staff: {str(e)}")
        return jsonify({'success': False, 'error': f'Database error: {str(e)}'}), 500

@staff_bp.route('/<int:staff_id>', methods=['DELETE'])
def delete_staff(staff_id):
    """Delete a staff member with enhanced validation"""
    try:
        print(f"Attempting to delete staff: {staff_id}")
        
        # Check if staff exists and get details
        existing_staff = db.execute_query(
            "SELECT First_Name, Last_Name, Role FROM Staff WHERE Staff_ID = %s", 
            (staff_id,), 
            fetch_one=True
        )
        if not existing_staff:
            return jsonify({'success': False, 'error': 'Staff not found'}), 404
        
        # Check if staff has any current responsibilities or assignments
        # This is a placeholder - you might want to add tables for staff assignments, etc.
        
        # Log staff deletion for audit if audit table exists
        try:
            with db.get_cursor() as (cursor, connection):
                # Try to insert audit record
                cursor.execute(
                    "INSERT INTO StaffAudit (Staff_ID, Action, Details, Changed_At) VALUES (%s, %s, %s, NOW())",
                    (staff_id, 'DELETE', f"Deleted staff: {existing_staff['First_Name']} {existing_staff['Last_Name']} ({existing_staff['Role']})")
                )
                
                # Delete staff
                cursor.execute("DELETE FROM Staff WHERE Staff_ID = %s", (staff_id,))
                
        except Exception as audit_error:
            # If audit table doesn't exist, just delete the staff
            print(f"Audit logging failed: {audit_error}")
            db.execute_update("DELETE FROM Staff WHERE Staff_ID = %s", (staff_id,))
        
        print(f"Staff {existing_staff['First_Name']} {existing_staff['Last_Name']} deleted successfully")
        return jsonify({
            'success': True,
            'message': f'Staff {existing_staff["First_Name"]} {existing_staff["Last_Name"]} deleted successfully'
        }), 200
    except Exception as e:
        print(f"Error deleting staff: {str(e)}")
        return jsonify({'success': False, 'error': f'Database error: {str(e)}'}), 500

@staff_bp.route('/transfer', methods=['POST'])
def transfer_staff():
    """Transfer staff using stored procedure sp_TransferStaff with enhanced validation"""
    try:
        data = request.get_json()
        print(f"Transferring staff with data: {data}")
        
        required_fields = ['staff_id', 'new_airport_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
        
        try:
            staff_id = int(data['staff_id'])
            new_airport_id = int(data['new_airport_id'])
        except (ValueError, TypeError):
            return jsonify({'success': False, 'error': 'Invalid staff ID or airport ID format'}), 400
        
        notes = data.get('notes', 'Staff transfer via management system').strip()
        if len(notes) > 500:
            return jsonify({'success': False, 'error': 'Notes too long (maximum 500 characters)'}), 400
        
        # Validate staff exists and get current details
        staff_check = db.execute_query(
            """
            SELECT s.Staff_ID, s.First_Name, s.Last_Name, s.Airport_ID, s.Role,
                   a.Name as Current_Airport, a.City as Current_City
            FROM Staff s
            JOIN Airport a ON s.Airport_ID = a.Airport_ID
            WHERE s.Staff_ID = %s
            """, 
            (staff_id,), 
            fetch_one=True
        )
        if not staff_check:
            return jsonify({'success': False, 'error': 'Staff member not found'}), 404
        
        # Check if trying to transfer to same airport
        if staff_check['Airport_ID'] == new_airport_id:
            return jsonify({'success': False, 'error': f'Staff member is already assigned to this airport ({staff_check["Current_Airport"]})'}), 400
        
        # Validate new airport exists
        airport_check = db.execute_query(
            "SELECT Airport_ID, Name, City FROM Airport WHERE Airport_ID = %s", 
            (new_airport_id,), 
            fetch_one=True
        )
        if not airport_check:
            return jsonify({'success': False, 'error': 'Invalid destination airport'}), 400
        
        # Call stored procedure with enhanced error handling
        try:
            db.call_procedure('sp_TransferStaff', [staff_id, new_airport_id, notes])
            
            print(f"Staff {staff_check['First_Name']} {staff_check['Last_Name']} transferred successfully from {staff_check['Current_Airport']} to {airport_check['Name']}")
            return jsonify({
                'success': True,
                'message': f'Staff {staff_check["First_Name"]} {staff_check["Last_Name"]} transferred successfully from {staff_check["Current_Airport"]} ({staff_check["Current_City"]}) to {airport_check["Name"]} ({airport_check["City"]}) using stored procedure'
            }), 200
        except Exception as proc_error:
            error_msg = str(proc_error)
            print(f"Stored procedure error: {error_msg}")
            
            if 'Staff not found' in error_msg:
                return jsonify({'success': False, 'error': 'Staff member not found'}), 404
            elif 'Airport not found' in error_msg:
                return jsonify({'success': False, 'error': 'Destination airport not found'}), 404
            else:
                return jsonify({'success': False, 'error': f'Transfer failed: {error_msg}'}), 400
                
    except Exception as e:
        print(f"Error transferring staff: {str(e)}")
        return jsonify({'success': False, 'error': f'Database error: {str(e)}'}), 500

@staff_bp.route('/<int:staff_id>/history', methods=['GET'])
def get_staff_history(staff_id):
    """Get transfer history for a staff member with enhanced validation"""
    try:
        # Validate staff exists
        staff_check = db.execute_query(
            "SELECT First_Name, Last_Name, Role FROM Staff WHERE Staff_ID = %s", 
            (staff_id,), 
            fetch_one=True
        )
        if not staff_check:
            return jsonify({'success': False, 'error': 'Staff not found'}), 404
        
        query = """
            SELECT 
                sh.History_ID,
                a1.Name AS Old_Airport, a1.City AS Old_City, a1.Country AS Old_Country,
                a2.Name AS New_Airport, a2.City AS New_City, a2.Country AS New_Country,
                sh.Changed_At,
                sh.Notes
            FROM StaffHistory sh
            LEFT JOIN Airport a1 ON sh.Old_Airport_ID = a1.Airport_ID
            LEFT JOIN Airport a2 ON sh.New_Airport_ID = a2.Airport_ID
            WHERE sh.Staff_ID = %s
            ORDER BY sh.Changed_At DESC
        """
        history = db.execute_query(query, (staff_id,))
        
        print(f"Retrieved {len(history)} transfer history records for staff {staff_id}")
        return jsonify({
            'success': True, 
            'data': history,
            'staff_name': f"{staff_check['First_Name']} {staff_check['Last_Name']}",
            'staff_role': staff_check['Role']
        }), 200
    except Exception as e:
        print(f"Error fetching staff history: {str(e)}")
        return jsonify({'success': False, 'error': f'Database error: {str(e)}'}), 500

@staff_bp.route('/statistics', methods=['GET'])
def get_staff_statistics():
    """Get comprehensive staff statistics"""
    try:
        stats_query = """
            SELECT 
                COUNT(*) as total_staff,
                COUNT(DISTINCT Role) as unique_roles,
                COUNT(DISTINCT Airline_ID) as airlines_with_staff,
                COUNT(DISTINCT Airport_ID) as airports_with_staff
            FROM Staff
        """
        
        stats = db.execute_query(stats_query, fetch_one=True)
        
        # Get staff by role
        role_query = """
            SELECT 
                Role,
                COUNT(*) as staff_count,
                GROUP_CONCAT(DISTINCT al.Name) as airlines
            FROM Staff s
            JOIN Airline al ON s.Airline_ID = al.Airline_ID
            GROUP BY Role
            ORDER BY staff_count DESC
        """
        
        roles = db.execute_query(role_query)
        
        # Get staff by airport
        airport_query = """
            SELECT 
                a.Name as airport_name,
                a.City,
                COUNT(s.Staff_ID) as staff_count,
                GROUP_CONCAT(DISTINCT s.Role) as roles
            FROM Airport a
            LEFT JOIN Staff s ON a.Airport_ID = s.Airport_ID
            GROUP BY a.Airport_ID
            HAVING staff_count > 0
            ORDER BY staff_count DESC
            LIMIT 10
        """
        
        airports = db.execute_query(airport_query)
        
        return jsonify({
            'success': True,
            'data': {
                'overall_stats': stats,
                'staff_by_role': roles,
                'staff_by_airport': airports
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@staff_bp.route('/by-airline/<int:airline_id>', methods=['GET'])
def get_staff_by_airline(airline_id):
    """Get all staff members for a specific airline"""
    try:
        # Validate airline exists
        airline_check = db.execute_query(
            "SELECT Name FROM Airline WHERE Airline_ID = %s", 
            (airline_id,), 
            fetch_one=True
        )
        if not airline_check:
            return jsonify({'success': False, 'error': 'Airline not found'}), 404
        
        query = """
            SELECT 
                s.Staff_ID, s.First_Name, s.Last_Name, s.Role,
                al.Name AS Airline,
                a.Name AS Airport, a.City AS Airport_City
            FROM Staff s
            JOIN Airline al ON s.Airline_ID = al.Airline_ID
            JOIN Airport a ON s.Airport_ID = a.Airport_ID
            WHERE s.Airline_ID = %s
            ORDER BY s.Last_Name, s.First_Name
        """
        staff = db.execute_query(query, (airline_id,))
        return jsonify({
            'success': True, 
            'data': staff,
            'airline_name': airline_check['Name']
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@staff_bp.route('/by-airport/<int:airport_id>', methods=['GET'])
def get_staff_by_airport(airport_id):
    """Get all staff members for a specific airport"""
    try:
        # Validate airport exists
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
                a.Name AS Airport, a.City AS Airport_City
            FROM Staff s
            JOIN Airline al ON s.Airline_ID = al.Airline_ID
            JOIN Airport a ON s.Airport_ID = a.Airport_ID
            WHERE s.Airport_ID = %s
            ORDER BY al.Name, s.Last_Name, s.First_Name
        """
        staff = db.execute_query(query, (airport_id,))
        return jsonify({
            'success': True, 
            'data': staff,
            'airport_name': airport_check['Name']
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500