# Flight Management System - Flask Backend API

A comprehensive REST API backend for a Flight Management System built with Flask and MySQL.

## 📋 Features

- **Complete CRUD Operations** for all entities (Passengers, Flights, Airlines, Bookings, Staff, Airports)
- **Stored Procedures Integration**:
  - `sp_CreateBooking` - Create bookings with validation
  - `sp_CancelFlight` - Cancel flights and associated bookings
  - `sp_TransferStaff` - Transfer staff between airports
- **MySQL Functions**:
  - `fn_GetAvailableSeats` - Get available seats for a flight
  - `fn_PassengerBookingCount` - Count bookings per passenger
- **15 Analytical Queries** for business intelligence
- **Modular Architecture** with Flask Blueprints
- **JSON API Responses** with proper error handling

## 🏗️ Project Structure

```
flight-management-backend/
│
├── app.py                      # Main Flask application
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (create from .env.example)
├── .env.example               # Example environment configuration
│
├── database/
│   └── db.py                  # Database connection & helper functions
│
└── routes/
    ├── passengers.py          # Passenger CRUD endpoints
    ├── flights.py             # Flight CRUD endpoints
    ├── airlines.py            # Airline CRUD endpoints
    ├── bookings.py            # Booking CRUD endpoints
    ├── staff.py               # Staff CRUD endpoints
    ├── airports.py            # Airport CRUD endpoints
    ├── procedures.py          # Stored procedure endpoints
    └── analytics.py           # Analytical query endpoints
```

## 🚀 Installation & Setup

### Prerequisites

- Python 3.8+
- MySQL 8.0 CE (with MySQL Workbench)
- Your database should be set up using the provided SQL files:
  - `ddl.sql` - Table definitions
  - `dml.sql` - Sample data
  - `fnsproctrig.sql` - Functions, procedures, and triggers

### Step 1: Clone or Download

Create a project directory and add all the files.

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Configure Database

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` with your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=flight_management
DB_PORT=3306
```

### Step 4: Ensure Database is Set Up

Make sure you've executed these SQL files in MySQL Workbench:
```sql
SOURCE ddl.sql;
SOURCE dml.sql;
SOURCE fnsproctrig.sql;
```

### Step 5: Run the Application

```bash
python app.py
```

The API will be available at: `http://localhost:5000`

## 📡 API Endpoints

### Root
- `GET /` - API information and available endpoints

### Passengers (`/api/passengers`)
- `GET /api/passengers` - Get all passengers
- `GET /api/passengers/<id>` - Get passenger by ID
- `POST /api/passengers` - Create new passenger
- `PUT /api/passengers/<id>` - Update passenger
- `DELETE /api/passengers/<id>` - Delete passenger
- `GET /api/passengers/<id>/bookings` - Get passenger's bookings
- `GET /api/passengers/<id>/booking-count` - Get booking count (uses MySQL function)

### Flights (`/api/flights`)
- `GET /api/flights` - Get all flights (supports filters: status, from_city, to_city, date)
- `GET /api/flights/<id>` - Get flight by ID
- `POST /api/flights` - Create new flight
- `PUT /api/flights/<id>` - Update flight
- `DELETE /api/flights/<id>` - Delete flight
- `GET /api/flights/<id>/available-seats` - Get available seats (uses MySQL function)
- `GET /api/flights/<id>/bookings` - Get flight's bookings

### Airlines (`/api/airlines`)
- `GET /api/airlines` - Get all airlines
- `GET /api/airlines/<id>` - Get airline by ID
- `POST /api/airlines` - Create new airline
- `PUT /api/airlines/<id>` - Update airline
- `DELETE /api/airlines/<id>` - Delete airline
- `GET /api/airlines/<id>/flights` - Get airline's flights
- `GET /api/airlines/<id>/staff` - Get airline's staff

### Bookings (`/api/bookings`)
- `GET /api/bookings` - Get all bookings (supports filters: status, passenger_id, flight_id)
- `GET /api/bookings/<id>` - Get booking by ID
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/<id>` - Update booking
- `DELETE /api/bookings/<id>` - Delete booking
- `POST /api/bookings/<id>/cancel` - Cancel a booking

### Staff (`/api/staff`)
- `GET /api/staff` - Get all staff
- `GET /api/staff/<id>` - Get staff by ID
- `POST /api/staff` - Create new staff
- `PUT /api/staff/<id>` - Update staff
- `DELETE /api/staff/<id>` - Delete staff
- `GET /api/staff/<id>/history` - Get staff transfer history

### Airports (`/api/airports`)
- `GET /api/airports` - Get all airports
- `GET /api/airports/<id>` - Get airport by ID
- `POST /api/airports` - Create new airport
- `PUT /api/airports/<id>` - Update airport
- `DELETE /api/airports/<id>` - Delete airport
- `GET /api/airports/<id>/departures` - Get departing flights
- `GET /api/airports/<id>/arrivals` - Get arriving flights
- `GET /api/airports/<id>/staff` - Get airport staff

### Stored Procedures (`/api/procedures`)
- `POST /api/procedures/create-booking` - Create booking using `sp_CreateBooking`
- `POST /api/procedures/cancel-flight` - Cancel flight using `sp_CancelFlight`
- `POST /api/procedures/transfer-staff` - Transfer staff using `sp_TransferStaff`

### Analytics (`/api/analytics`)
- `GET /api/analytics/airline-flights` - Flights by airline and status
- `GET /api/analytics/busiest-airports` - Top busiest airports
- `GET /api/analytics/frequent-flyers` - Passengers with multiple bookings
- `GET /api/analytics/airline-employees` - Staff count by airline
- `GET /api/analytics/above-average-bookings` - Flights with above-average bookings
- `GET /api/analytics/airline-rankings` - Airlines ranked by bookings
- `GET /api/analytics/passenger-bookings-detail` - Detailed passenger-booking info
- `GET /api/analytics/single-airline-passengers` - Passengers loyal to one airline
- `GET /api/analytics/avg-flight-duration` - Average flight duration by airline
- `GET /api/analytics/staff-airport-details` - Staff with airport assignments
- `GET /api/analytics/flights-between-cities` - Flights between specific cities
- `GET /api/analytics/unique-passengers-per-airline` - Unique passengers per airline
- `GET /api/analytics/most-frequent-flyer` - Passenger with most bookings
- `GET /api/analytics/staff-transfers` - Staff transfer history
- `GET /api/analytics/passenger-booking-summary` - Active/cancelled bookings per passenger

## 📝 Example API Calls

### Create a Passenger
```bash
curl -X POST http://localhost:5000/api/passengers \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "9876543210"
  }'
```

### Create Booking via Stored Procedure
```bash
curl -X POST http://localhost:5000/api/procedures/create-booking \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@example.com",
    "phone": "9876543211",
    "flight_no": "AI101",
    "seat_no": "14B"
  }'
```

### Get Available Seats
```bash
curl http://localhost:5000/api/flights/1/available-seats
```

### Cancel a Flight
```bash
curl -X POST http://localhost:5000/api/procedures/cancel-flight \
  -H "Content-Type: application/json" \
  -d '{"flight_no": "UK404"}'
```

### Get Frequent Flyers
```bash
curl http://localhost:5000/api/analytics/frequent-flyers?min_bookings=2
```

### Get Flights Between Cities
```bash
curl "http://localhost:5000/api/analytics/flights-between-cities?from_city=Bangalore&to_city=Delhi&date=2025-11-01"
```

## 🔧 Response Format

All endpoints return JSON responses in this format:

**Success:**
```json
{
  "success": true,
  "data": { ... } or [ ... ]
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🎯 Key Features

### 1. MySQL Function Integration
The API integrates MySQL functions directly:
- `fn_GetAvailableSeats(flight_id)` - Calculate available seats
- `fn_PassengerBookingCount(passenger_id)` - Count active bookings

### 2. Stored Procedure Integration
Executes stored procedures with proper parameter handling:
- `sp_CreateBooking` - Validates and creates bookings with business logic
- `sp_CancelFlight` - Cascades cancellation to all bookings
- `sp_TransferStaff` - Records transfer history

### 3. Complex Analytical Queries
15 pre-built analytical endpoints for business intelligence:
- Flight statistics by airline
- Airport traffic analysis
- Passenger behavior analysis
- Staff allocation reports

### 4. Flexible Filtering
Many endpoints support query parameters for filtering:
```
GET /api/flights?status=Scheduled&from_city=Bangalore&date=2025-11-01
GET /api/bookings?passenger_id=5&status=Booked
```

## 🛠️ Development

### Adding New Routes

1. Create a new file in `routes/` directory
2. Define your blueprint
3. Register it in `app.py`

Example:
```python
# routes/new_feature.py
from flask import Blueprint, jsonify
from database.db import db

new_feature_bp = Blueprint('new_feature', __name__)

@new_feature_bp.route('/test', methods=['GET'])
def test():
    return jsonify({'message': 'Hello'}), 200
```

```python
# app.py
from routes.new_feature import new_feature_bp
app.register_blueprint(new_feature_bp, url_prefix='/api/new-feature')
```

## 🐛 Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check `.env` credentials
- Ensure `flight_management` database exists

### Module Not Found Errors
```bash
pip install -r requirements.txt
```

### Port Already in Use
Change the port in `app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

## 📚 Tech Stack

- **Backend Framework**: Flask 3.0
- **Database**: MySQL 8.0 CE
- **Database Connector**: mysql-connector-python
- **CORS**: flask-cors
- **Environment**: python-dotenv

## 🎓 Learning Resources

This project demonstrates:
- RESTful API design
- Database connection pooling
- Stored procedure integration
- MySQL function calls from Python
- Error handling and validation
- Modular application architecture
- Blueprint-based route organization

## 📄 License

This is an educational project for learning Flask and MySQL integration.

## 👥 Credits

Developed for the Flight Management System database project.