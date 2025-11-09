import React from 'react';

const Footer = () => {
  return (
    <footer style={{ 
      backgroundColor: '#343a40', 
      color: 'white', 
      padding: '2rem',
      marginTop: 'auto',
      textAlign: 'center'
    }}>
      <div>
        <h6>Flight Management System</h6>
        <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', opacity: '0.8' }}>
          A comprehensive flight operations management platform
        </p>
        <p style={{ margin: '1rem 0 0 0', fontSize: '0.8rem', opacity: '0.6' }}>
          © 2025 Flight Management System. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;