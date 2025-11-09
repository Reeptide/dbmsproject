import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlane, FaUsers, FaTicketAlt, FaBuilding, FaMapMarkerAlt, FaChartBar } from 'react-icons/fa';

const Home = () => {
  const navigate = useNavigate();

  // Navigation handlers
  const handleNavigation = (path) => {
    navigate(path);
  };

  const backgroundStyle = {
    minHeight: '100vh',
    backgroundImage: 'url("/flight_image.jpg")', // Make sure image is in public folder
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    position: 'relative'
  };

  const overlayStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    minHeight: '100vh',
    position: 'relative',
    zIndex: 1
  };

  const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
  };

  const cardHoverStyle = {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
  };

  const titleStyle = {
    color: 'white',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
    fontWeight: 'bold'
  };

  const subtitleStyle = {
    color: 'rgba(255, 255, 255, 0.9)',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)'
  };

  return (
    <div style={backgroundStyle}>
      <div style={overlayStyle}>
        <div className="container">
          <div className="text-center py-5">
            <h1 className="display-4 mb-3" style={titleStyle}>
              <FaPlane className="me-3" />
              Flight Management System
            </h1>
            <p className="lead mb-5" style={subtitleStyle}>
              Comprehensive flight operations management platform
            </p>
          </div>

          <div className="row g-4 mb-5">
            <div className="col-lg-4 col-md-6">
              <div 
                className="card h-100 shadow-lg" 
                style={cardStyle}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardStyle)}
              >
                <div className="card-body text-center">
                  <FaPlane style={{ fontSize: '3rem', color: '#0d6efd' }} />
                  <h5 className="card-title mt-3">Flights</h5>
                  <p className="card-text text-muted">Manage flight schedules and operations</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleNavigation('/flights')}
                  >
                    View Flights
                  </button>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4 col-md-6">
              <div 
                className="card h-100 shadow-lg" 
                style={cardStyle}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardStyle)}
              >
                <div className="card-body text-center">
                  <FaUsers style={{ fontSize: '3rem', color: '#198754' }} />
                  <h5 className="card-title mt-3">Passengers</h5>
                  <p className="card-text text-muted">Manage passenger information</p>
                  <button 
                    className="btn btn-success"
                    onClick={() => handleNavigation('/passengers')}
                  >
                    View Passengers
                  </button>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4 col-md-6">
              <div 
                className="card h-100 shadow-lg" 
                style={cardStyle}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardStyle)}
              >
                <div className="card-body text-center">
                  <FaTicketAlt style={{ fontSize: '3rem', color: '#dc3545' }} />
                  <h5 className="card-title mt-3">Bookings</h5>
                  <p className="card-text text-muted">Manage flight reservations</p>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleNavigation('/bookings')}
                  >
                    View Bookings
                  </button>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4 col-md-6">
              <div 
                className="card h-100 shadow-lg" 
                style={cardStyle}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardStyle)}
              >
                <div className="card-body text-center">
                  <FaBuilding style={{ fontSize: '3rem', color: '#0dcaf0' }} />
                  <h5 className="card-title mt-3">Airlines</h5>
                  <p className="card-text text-muted">Manage airline companies</p>
                  <button 
                    className="btn btn-info"
                    onClick={() => handleNavigation('/airlines')}
                  >
                    View Airlines
                  </button>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4 col-md-6">
              <div 
                className="card h-100 shadow-lg" 
                style={cardStyle}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardStyle)}
              >
                <div className="card-body text-center">
                  <FaMapMarkerAlt style={{ fontSize: '3rem', color: '#ffc107' }} />
                  <h5 className="card-title mt-3">Airports</h5>
                  <p className="card-text text-muted">Manage airport locations</p>
                  <button 
                    className="btn btn-warning"
                    onClick={() => handleNavigation('/airports')}
                  >
                    View Airports
                  </button>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4 col-md-6">
              <div 
                className="card h-100 shadow-lg" 
                style={cardStyle}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardStyle)}
              >
                <div className="card-body text-center">
                  <FaChartBar style={{ fontSize: '3rem', color: '#212529' }} />
                  <h5 className="card-title mt-3">Analytics</h5>
                  <p className="card-text text-muted">View system analytics</p>
                  <button 
                    className="btn btn-dark"
                    onClick={() => handleNavigation('/analytics')}
                  >
                    View Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;