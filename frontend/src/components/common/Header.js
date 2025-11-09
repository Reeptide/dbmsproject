import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header style={{ 
      backgroundColor: '#343a40', 
      padding: '1rem 2rem',
      //marginBottom: '2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <nav>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'white'
        }}>
          <div style={{ 
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            ✈️ Flight Management System
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none', padding: '0.5rem' }}>
              Home
            </Link>
            <Link to="/flights" style={{ color: 'white', textDecoration: 'none', padding: '0.5rem' }}>
              Flights
            </Link>
            <Link to="/passengers" style={{ color: 'white', textDecoration: 'none', padding: '0.5rem' }}>
              Passengers
            </Link>
            <Link to="/bookings" style={{ color: 'white', textDecoration: 'none', padding: '0.5rem' }}>
              Bookings
            </Link>
            <Link to="/airlines" style={{ color: 'white', textDecoration: 'none', padding: '0.5rem' }}>
              Airlines
            </Link>
            <Link to="/airports" style={{ color: 'white', textDecoration: 'none', padding: '0.5rem' }}>
              Airports
            </Link>
            <Link to="/staff" style={{ color: 'white', textDecoration: 'none', padding: '0.5rem' }}>
              Staff
            </Link>
            <Link to="/analytics" style={{ color: 'white', textDecoration: 'none', padding: '0.5rem' }}>
              Analytics
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;