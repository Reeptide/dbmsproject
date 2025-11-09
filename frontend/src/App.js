import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import Flights from './pages/Flights';
import Passengers from './pages/Passengers';
import Bookings from './pages/Bookings';
import Airlines from './pages/Airlines';
import Airports from './pages/Airports';
import Staff from './pages/Staff';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Router>
      <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main className="main-content" style={{ flex: '1' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/flights" element={<Flights />} />
            <Route path="/passengers" element={<Passengers />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/airlines" element={<Airlines />} />
            <Route path="/airports" element={<Airports />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/dashboard" element={<Analytics />} />
          </Routes>
        </main>
        <Footer />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

export default App;