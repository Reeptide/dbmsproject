from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Import blueprints
from routes.passengers import passengers_bp
from routes.flights import flights_bp
from routes.airlines import airlines_bp
from routes.bookings import bookings_bp
from routes.staff import staff_bp
from routes.airports import airports_bp
from routes.analytics import analytics_bp
from routes.procedures import procedures_bp

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
app.config['JSON_SORT_KEYS'] = False
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True

# Register blueprints
app.register_blueprint(passengers_bp, url_prefix='/api/passengers')
app.register_blueprint(flights_bp, url_prefix='/api/flights')
app.register_blueprint(airlines_bp, url_prefix='/api/airlines')
app.register_blueprint(bookings_bp, url_prefix='/api/bookings')
app.register_blueprint(staff_bp, url_prefix='/api/staff')
app.register_blueprint(airports_bp, url_prefix='/api/airports')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(procedures_bp, url_prefix='/api/procedures')

# Root endpoint
@app.route('/')
def index():
    return jsonify({
        'message': 'Flight Management System API',
        'version': '1.0',
        'endpoints': {
            'passengers': '/api/passengers',
            'flights': '/api/flights',
            'airlines': '/api/airlines',
            'bookings': '/api/bookings',
            'staff': '/api/staff',
            'airports': '/api/airports',
            'analytics': '/api/analytics',
            'procedures': '/api/procedures'
        }
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)