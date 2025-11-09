from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)
#import blueprint
from routes.bookings import bookings_bp
#register blueprint
app.register_blueprint(bookings_bp, url_prefix='/api/bookings')

#import blueprint
from routes.flights import flights_bp
#register blueprint
app.register_blueprint(flights_bp, url_prefix='/api/flights')

#import blueprint
from routes.passengers import passengers_bp
#register blueprint
app.register_blueprint(passengers_bp, url_prefix='/api/passengers')

#import blueprint
from routes.staff import staff_bp
#register blueprint
app.register_blueprint(staff_bp, url_prefix='/api/staff')

#import blueprint
from routes.airlines import airlines_bp
#register blueprint
app.register_blueprint(airlines_bp, url_prefix='/api/airlines')

#import blueprint
from routes.analytics import analytics_bp
#register blueprint
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

#import blueprint
from routes.procedures import procedures_bp
#register blueprint
app.register_blueprint(procedures_bp, url_prefix='/api/procedures')


#import blueprint
from routes.airports import airports_bp
#register blueprint
app.register_blueprint(airports_bp, url_prefix='/api/airports')




# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'flight_management'),
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def get_db_connection():
    try:
        connection = pymysql.connect(**DB_CONFIG)
        return connection
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

@app.route('/')
def index():
    return jsonify({
        'message': 'Flight Management System API',
        'status': 'running',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat(),
        'endpoints': {
            'flights': '/api/flights/',
            'passengers': '/api/passengers/',
            'airlines': '/api/airlines/',
            'airports': '/api/airports/',
            'bookings': '/api/bookings/',
            'staff': '/api/staff/',
            'analytics': '/api/analytics/'
        }
    })

# ======================================================
# FLIGHTS ENDPOINTS
# ======================================================
@app.route('/api/flights/', methods=['GET'])
def get_flights():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        with connection.cursor() as cursor:
            query = """
            SELECT f.*, al.Name as airline_name, 
                   a1.Name as from_airport, a2.Name as to_airport,
                   (COALESCE(f.Capacity, 180) - 
                    COALESCE((SELECT COUNT(*) FROM Booking WHERE Flight_ID = f.Flight_ID AND Status = 'Booked'), 0)) as available_seats
            FROM Flight f
            LEFT JOIN Airline al ON f.Airline_ID = al.Airline_ID
            LEFT JOIN Airport a1 ON f.From_Airport_ID = a1.Airport_ID
            LEFT JOIN Airport a2 ON f.To_Airport_ID = a2.Airport_ID
            ORDER BY f.Departure_Time DESC
            """
            cursor.execute(query)
            flights = cursor.fetchall()
            print(f"DEBUG: Found {len(flights)} flights")
            return jsonify(flights)
    except Exception as e:
        print(f"DEBUG: Flights error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

# ======================================================
# PASSENGERS ENDPOINTS
# ======================================================
@app.route('/api/passengers/', methods=['GET'])
def get_passengers():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        with connection.cursor() as cursor:
            query = """
            SELECT p.*, 
                   COALESCE((SELECT COUNT(*) FROM Booking WHERE Passenger_ID = p.Passenger_ID AND Status = 'Booked'), 0) as booking_count
            FROM Passenger p
            ORDER BY p.First_Name, p.Last_Name
            """
            cursor.execute(query)
            passengers = cursor.fetchall()
            print(f"DEBUG: Found {len(passengers)} passengers")
            return jsonify(passengers)
    except Exception as e:
        print(f"DEBUG: Passengers error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

# ======================================================
# BOOKINGS ENDPOINTS - FIXED
# ======================================================
@app.route('/api/bookings/', methods=['GET'])
def get_bookings():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        with connection.cursor() as cursor:
            query = """
            SELECT b.*, 
                   CONCAT(COALESCE(p.First_Name, ''), ' ', COALESCE(p.Last_Name, '')) as passenger_name,
                   COALESCE(f.Flight_No, 'N/A') as flight_no,
                   COALESCE(al.Name, 'N/A') as airline_name
            FROM Booking b
            LEFT JOIN Passenger p ON b.Passenger_ID = p.Passenger_ID
            LEFT JOIN Flight f ON b.Flight_ID = f.Flight_ID
            LEFT JOIN Airline al ON f.Airline_ID = al.Airline_ID
            ORDER BY b.Date DESC
            """
            cursor.execute(query)
            bookings = cursor.fetchall()
            print(f"DEBUG: Found {len(bookings)} bookings")
            return jsonify(bookings)
    except Exception as e:
        print(f"DEBUG: Bookings error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

# ======================================================
# STAFF ENDPOINTS - FIXED
# ======================================================
@app.route('/api/staff/', methods=['GET'])
def get_staff():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        with connection.cursor() as cursor:
            query = """
            SELECT s.*, 
                   COALESCE(al.Name, 'N/A') as airline_name, 
                   COALESCE(a.Name, 'N/A') as airport_name, 
                   COALESCE(a.City, 'N/A') as airport_city
            FROM Staff s
            LEFT JOIN Airline al ON s.Airline_ID = al.Airline_ID
            LEFT JOIN Airport a ON s.Airport_ID = a.Airport_ID
            ORDER BY s.First_Name, s.Last_Name
            """
            cursor.execute(query)
            staff = cursor.fetchall()
            print(f"DEBUG: Found {len(staff)} staff members")
            return jsonify(staff)
    except Exception as e:
        print(f"DEBUG: Staff error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

# ======================================================
# AIRLINES ENDPOINTS
# ======================================================
@app.route('/api/airlines/', methods=['GET'])
def get_airlines():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        with connection.cursor() as cursor:
            query = """
            SELECT al.*, 
                   COUNT(DISTINCT f.Flight_ID) as total_flights,
                   COUNT(DISTINCT s.Staff_ID) as total_staff
            FROM Airline al
            LEFT JOIN Flight f ON al.Airline_ID = f.Airline_ID
            LEFT JOIN Staff s ON al.Airline_ID = s.Airline_ID
            GROUP BY al.Airline_ID, al.Name, al.Contact_Info
            ORDER BY al.Name
            """
            cursor.execute(query)
            airlines = cursor.fetchall()
            print(f"DEBUG: Found {len(airlines)} airlines")
            return jsonify(airlines)
    except Exception as e:
        print(f"DEBUG: Airlines error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

# ======================================================
# AIRPORTS ENDPOINTS
# ======================================================
@app.route('/api/airports/', methods=['GET'])
def get_airports():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        with connection.cursor() as cursor:
            query = """
            SELECT a.*,
                   (SELECT COUNT(*) FROM Flight WHERE From_Airport_ID = a.Airport_ID) as departures,
                   (SELECT COUNT(*) FROM Flight WHERE To_Airport_ID = a.Airport_ID) as arrivals,
                   COUNT(s.Staff_ID) as total_staff
            FROM Airport a
            LEFT JOIN Staff s ON a.Airport_ID = s.Airport_ID
            GROUP BY a.Airport_ID, a.Name, a.City, a.Country
            ORDER BY a.Name
            """
            cursor.execute(query)
            airports = cursor.fetchall()
            print(f"DEBUG: Found {len(airports)} airports")
            return jsonify(airports)
    except Exception as e:
        print(f"DEBUG: Airports error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

# ======================================================
# ANALYTICS ENDPOINTS
# ======================================================
@app.route('/api/analytics/airline-flights-by-status', methods=['GET'])
def airline_flights_by_status():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        with connection.cursor() as cursor:
            query = """
            SELECT al.Name AS Airline, f.Status, COUNT(f.Flight_ID) AS Total_Flights
            FROM Airline al
            JOIN Flight f ON al.Airline_ID = f.Airline_ID
            GROUP BY al.Name, f.Status
            ORDER BY Total_Flights DESC
            """
            cursor.execute(query)
            result = cursor.fetchall()
            return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/analytics/busiest-airports', methods=['GET'])
def busiest_airports():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        with connection.cursor() as cursor:
            query = """
            SELECT a.Name AS Airport, a.City,
                   (SELECT COUNT(*) FROM Flight WHERE From_Airport_ID = a.Airport_ID) AS Departures,
                   (SELECT COUNT(*) FROM Flight WHERE To_Airport_ID = a.Airport_ID) AS Arrivals,
                   ((SELECT COUNT(*) FROM Flight WHERE From_Airport_ID = a.Airport_ID) +
                    (SELECT COUNT(*) FROM Flight WHERE To_Airport_ID = a.Airport_ID)) AS TotalTraffic
            FROM Airport a
            ORDER BY TotalTraffic DESC
            LIMIT 5
            """
            cursor.execute(query)
            result = cursor.fetchall()
            return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/analytics/frequent-flyers', methods=['GET'])
def frequent_flyers():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        with connection.cursor() as cursor:
            query = """
            SELECT p.First_Name, p.Last_Name, COUNT(b.Booking_ID) AS Total_Bookings
            FROM Passenger p
            JOIN Booking b ON p.Passenger_ID = b.Passenger_ID
            WHERE b.Status = 'Booked'
            GROUP BY p.Passenger_ID, p.First_Name, p.Last_Name
            HAVING COUNT(b.Booking_ID) >= 1
            ORDER BY Total_Bookings DESC
            """
            cursor.execute(query)
            result = cursor.fetchall()
            return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)