# Flight Management System - Full Stack Application

A comprehensive Flight Management System with a React frontend and Flask backend API, featuring MySQL database integration with stored procedures, functions, and advanced analytics.

## 📋 Features

### Backend Features
- **Complete CRUD Operations** for all entities (Passengers, Flights, Airlines, Bookings, Staff, Airports)
- **Stored Procedures Integration**:
  - `sp_CreateBooking` - Create bookings with validation
  - `sp_CancelFlight` - Cancel flights and associated bookings
  - `sp_TransferStaff` - Transfer staff between airports
- **MySQL Functions**:
  - `fn_GetAvailableSeats` - Get available seats for a flight
  - `fn_PassengerBookingCount` - Count bookings per passenger
- **4 Analytical Queries** for business intelligence
- **Modular Architecture** with Flask Blueprints
- **JSON API Responses** with proper error handling

### Frontend Features
- **Modern React Interface** with component-based architecture
- **Responsive Design** using Bootstrap 5 and React Bootstrap
- **Modal-based CRUD Operations** with comprehensive error handling
- **Form Validation** with real-time feedback
- **Search and Filter Functionality** for all management pages
- **Bootstrap Tables** with basic data display
- **Error State Management** with modal-specific error handling
- **Loading States** with spinner indicators
- **Navigation** with React Router integration
- **Unique Validation** for emails and phone numbers (10-digit requirement)

## 🏗️ Project Structure

```
flight-management-system/
│
├── backend/                    # Flask Backend
│   ├── app.py                 # Main Flask application
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables
│   ├── .env.example          # Example environment configuration
│   │
│   ├── database/
│   │   └── db.py             # Database connection & helper functions
│   │
│   └── routes/
│       ├── passengers_api.py  # Passenger CRUD endpoints
│       ├── flights_api.py     # Flight CRUD endpoints
│       ├── airlines_api.py    # Airline CRUD endpoints
│       ├── bookings_api.py    # Booking CRUD endpoints
│       ├── staff_management.py# Staff CRUD endpoints
│       ├── airports_api.py    # Airport CRUD endpoints
│       ├── procedures.py      # Stored procedure endpoints
│       └── analytics.py       # Analytical query endpoints
│
├── frontend/                   # React Frontend
│   ├── public/
│   │   ├── index.html
|   |   ├── flight_image.jpg
│   │   ├── favicon.ico
│   │   ├── logo192.png
│   │   ├── logo512.png
│   │   ├── manifest.json
│   │   └── robots.txt
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Header.js
│   │   │   │   ├── Footer.js
│   │   │   │   └── Loading.js
│   │   │   │
│   │   │   └── pages/
│   │   │       ├── Airlines.js
│   │   │       ├── Airports.js
│   │   │       ├── Analytics.js
│   │   │       ├── Bookings.js
│   │   │       ├── Flights.js
│   │   │       ├── Home.js
│   │   │       ├── Passengers.js
│   │   │       └── Staff.js
│   │   │
│   │   ├── services/
│   │   │   ├── api.js            # Axios API service
│   │   │   └── flightService.js  # Flight-specific API calls
│   │   │
│   │   ├── styles/
│   │   │   └── components/
│   │   │
│   │   ├── App.js                # Main React application
│   │   ├── App.css              # Global styles
│   │   ├── index.js             # React entry point
│   │   ├── index.css            # Root styles
│   │   └── logo.svg
│   │
│   ├── .env                      # Frontend environment variables
│   ├── .gitignore               # Git ignore file
│   ├── package.json             # Node.js dependencies
│   ├── package-lock.json        # Locked dependency versions
│   ├── README.md                # This file
│   └── tsconfig.json            # TypeScript configuration
│
└── sqlfiles/                   # Database Schema & Scripts
    ├── ddl.sql                 # Database Data Definition Language (Tables, Indexes)
    ├── dml.sql                 # Database Data Manipulation Language (Sample Data)
    ├── extrainsert.sql         # Additional sample data inserts
    ├── fnsproctrig.sql         # Functions, Stored Procedures & Triggers
    ├── queries.sql             # Analytical queries and reports
    ├── postman_collection.json # API testing collection for Postman
    └── README.md               # Database setup instructions
```

## 🚀 Installation & Setup

### Prerequisites

- Python 3.8+
- MySQL 8.0 CE (with MySQL Workbench)
- Your database should be set up using the provided SQL files:
  - `ddl.sql` - Table definitions
  - `dml.sql` - Sample data
  - `fnsproctrig.sql` - Functions, procedures, and triggers
  - `extrainsert.sql` - Extra insertations into the tables

### Backend Setup
### Step 1: Clone or Download

Create a project directory and add all the files.Go to the backend folder
```bash
cd backend
```

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

### Frontend Setup

#### Step 1: Navigate to Frontend Directory
```bash
cd frontend
```
#### Step 2: Install React and Core Dependencies
```bash
# 1.Install core dependencies with latest available versions
npm install --legacy-peer-deps react-router-dom@6.8.0 axios@1.3.0 react-hook-form@7.43.0 react-toastify@9.1.0 bootstrap@5.2.3 react-bootstrap@2.7.0 react-icons@4.8.0 date-fns@2.29.0 react-router-bootstrap@0.26.2
# 2. Install table and charting libraries
npm install --legacy-peer-deps @tanstack/react-table@8.7.0 recharts@2.5.0 react-select@5.7.0 react-datepicker@4.10.0
```
#### Step 3: Configure API Endpoint
```bash
# Create .env file for frontend
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```
#### Step 4: Start Frontend Development Server
```bash
npm start
```

The Frontend will be available at: `http://localhost:3000`

## 📡 API Endpoints

### Root
- `GET /` - API information and available endpoints

### Passengers (`/api/passengers`)
- `GET /api/passengers` - Get all passengers with booking count
- `POST /api/passengers` - Create new passenger (unique email/phone, 10-digit phone validation)
- `PUT /api/passengers/<id>` - Update passenger (change detection)
- `DELETE /api/passengers/<id>` - Delete passenger (prevents deletion with active bookings)
- `GET /api/passengers/<id>/bookings` - Get passenger's bookings
- `GET /api/passengers/<id>/booking-count` - Get booking count (uses MySQL function)
- `POST /api/passengers/create-with-booking` - Create passenger and booking using stored procedure
- `GET /api/passengers/search` - Advanced search with filters

### Flights (`/api/flights`)
- `GET /api/flights` - Get all flights with filtering support
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
- `GET /api/bookings` - Get all bookings with filtering support
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
- `POST /api/staff/transfer` - Transfer staff using stored procedure with audit trail
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

### 1. Enhanced Error Handling
- Modal-Specific Errors: Separate error states for create, edit, delete operations
- Auto-Clear Errors: Errors disappear when user starts typing
- Modal Persistence: Modals stay open on errors for easy correction
- Clear Error Messages: Specific, actionable error descriptions
### 2. Business Logic Validation
- Change Detection: Prevents API calls when no actual changes made
- Unique Constraints: Email and phone number uniqueness validation
- Foreign Key Validation: Ensures referenced records exist
- Dependency Checks: Prevents deletion of records with dependencies
### 3. MySQL Integration
- Stored Procedures: `sp_CreateBooking`, `sp_TransferStaff` with proper parameter handling
- MySQL Functions: `fn_GetAvailableSeats`, `fn_PassengerBookingCount` integration
- Transaction Management: Ensure data consistency
- Audit Trail: Staff transfer history using stored procedures
### 4. User Experience
- Loading States: Spinner indicators during API calls
- Responsive Design: Bootstrap-based responsive layout
- Form Validation: Real-time validation feedback
- Search Functionality: Filter and search capabilities

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
- **Backend**
- **Framework**: Flask 3.0
- **Database**: MySQL 8.0 CE
- **Database Connector**: mysql-connector-python
- **CORS**: flask-cors
- **Environment**: python-dotenv
- **Architecture**: Blueprint-based modular design
- **Frontend**
- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **UI Framework**: Bootstrap 5 + React Bootstrap
- **Icons**: React Icons
- **Styling**: CSS and Bootstrap classes
- **State Management**: React useState and useEffect hooks

## 🎓 Learning Resources

- Full-stack development with React and Flask
- RESTful API design with proper HTTP status codes
- Database integration with stored procedures and functions
- Modern React patterns with hooks and functional components
- Error handling at both frontend and backend levels
- Form validation and user experience optimization
- Data visualization with interactive charts
- Responsive design with Bootstrap
- Modular architecture and code organization

## 📄 License

This is an educational project for learning full-stack web development with React, Flask, and MySQL.

## 👥 Credits

Developed for the Flight Management System database project.
