import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form, Alert, ProgressBar } from 'react-bootstrap';
import { FaPlane, FaPlus, FaEdit, FaTrash, FaSearch, FaBan, FaExclamationTriangle } from 'react-icons/fa';

const Flights = () => {
  const [flights, setFlights] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal-specific error states
  const [createError, setCreateError] = useState(null);
  const [editError, setEditError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  
  const [newFlight, setNewFlight] = useState({
    flight_no: '',
    departure_time: '',
    arrival_time: '',
    capacity: 180,
    airline_id: '',
    from_airport_id: '',
    to_airport_id: ''
  });
  const [editFlight, setEditFlight] = useState({
    flight_no: '',
    departure_time: '',
    arrival_time: '',
    status: '',
    capacity: 180
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Helper function to clear messages after delay
  const clearMessagesAfterDelay = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [flightsRes, airlinesRes, airportsRes] = await Promise.all([
        fetch('http://localhost:5000/api/flights/'),
        fetch('http://localhost:5000/api/airlines/'),
        fetch('http://localhost:5000/api/airports/')
      ]);

      if (!flightsRes.ok || !airlinesRes.ok || !airportsRes.ok) {
        throw new Error('One or more API requests failed');
      }

      const [flightsResponse, airlinesResponse, airportsResponse] = await Promise.all([
        flightsRes.json(),
        airlinesRes.json(),
        airportsRes.json()
      ]);

      console.log('API Responses:', { 
        flights: flightsResponse, 
        airlines: airlinesResponse, 
        airports: airportsResponse 
      });

      const actualFlights = flightsResponse.data || flightsResponse;
      const actualAirlines = airlinesResponse.data || airlinesResponse;
      const actualAirports = airportsResponse.data || airportsResponse;

      setFlights(Array.isArray(actualFlights) ? actualFlights : []);
      setAirlines(Array.isArray(actualAirlines) ? actualAirlines : []);
      setAirports(Array.isArray(actualAirports) ? actualAirports : []);
      setError(null);
    } catch (err) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(`Error loading data: ${errorMessage}. Please check if backend is running.`);
      console.error('Fetch error:', err);
      
      setFlights([]);
      setAirlines([]);
      setAirports([]);
    } finally {
      setLoading(false);
    }
  };

  // CREATE - POST request with proper error handling
  const handleCreateFlight = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setSuccess(null);
    setCreateError(null);
    
    try {
      if (!newFlight.flight_no || !newFlight.departure_time || !newFlight.arrival_time || 
          !newFlight.airline_id || !newFlight.from_airport_id || !newFlight.to_airport_id) {
        setCreateError('Please fill in all required fields');
        return;
      }

      const flightData = {
        flight_no: newFlight.flight_no,
        departure_time: newFlight.departure_time,
        arrival_time: newFlight.arrival_time,
        capacity: parseInt(newFlight.capacity),
        airline_id: parseInt(newFlight.airline_id),
        from_airport_id: parseInt(newFlight.from_airport_id),
        to_airport_id: parseInt(newFlight.to_airport_id)
      };

      console.log('Creating flight:', flightData);

      const response = await fetch('http://localhost:5000/api/flights/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flightData)
      });

      console.log('Create response status:', response.status);

      let responseData;
      try {
        responseData = await response.json();
        console.log('Create response data:', responseData);
      } catch (parseError) {
        console.error('Failed to parse create response JSON:', parseError);
        setCreateError(`Server returned invalid response (Status: ${response.status})`);
        return;
      }

      if (response.ok) {
        setSuccess('Flight created successfully!');
        setShowModal(false);
        setCreateError(null);
        setNewFlight({
          flight_no: '', departure_time: '', arrival_time: '',
          capacity: 180, airline_id: '', from_airport_id: '', to_airport_id: ''
        });
        fetchData();
        clearMessagesAfterDelay();
      } else {
        const errorMessage = responseData?.error || responseData?.message || 'Failed to create flight';
        console.log('Setting create error:', errorMessage);
        setCreateError(errorMessage);
      }
    } catch (err) {
      console.error('Network/request error during create:', err);
      setCreateError(`Network error: ${err.message}`);
    }
  };

  // UPDATE - PUT request with proper error handling
  const handleUpdateFlight = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setSuccess(null);
    setEditError(null);
    
    try {
      if (!editFlight.flight_no && !editFlight.departure_time && !editFlight.arrival_time && 
          !editFlight.status && !editFlight.capacity) {
        setEditError('Please update at least one field');
        return;
      }

      const updateData = {};
      if (editFlight.flight_no) updateData.flight_no = editFlight.flight_no;
      if (editFlight.departure_time) updateData.departure_time = editFlight.departure_time;
      if (editFlight.arrival_time) updateData.arrival_time = editFlight.arrival_time;
      if (editFlight.status) updateData.status = editFlight.status;
      if (editFlight.capacity) updateData.capacity = parseInt(editFlight.capacity);

      console.log('Updating flight:', selectedFlight.Flight_ID, updateData);

      const response = await fetch(`http://localhost:5000/api/flights/${selectedFlight.Flight_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      console.log('Update response status:', response.status);

      let responseData;
      try {
        responseData = await response.json();
        console.log('Update response data:', responseData);
      } catch (parseError) {
        console.error('Failed to parse update response JSON:', parseError);
        setEditError(`Server returned invalid response (Status: ${response.status})`);
        return;
      }

      if (response.ok) {
        setSuccess(`Flight ${selectedFlight.Flight_No} updated successfully!`);
        setShowEditModal(false);
        setSelectedFlight(null);
        setEditError(null);
        setEditFlight({ flight_no: '', departure_time: '', arrival_time: '', status: '', capacity: 180 });
        fetchData();
        clearMessagesAfterDelay();
      } else {
        const errorMessage = responseData?.error || responseData?.message || 'Failed to update flight';
        console.log('Setting edit error:', errorMessage);
        setEditError(errorMessage);
      }
    } catch (err) {
      console.error('Network/request error during update:', err);
      setEditError(`Network error: ${err.message}`);
    }
  };

  // DELETE - DELETE request with proper error handling
  const handleDeleteFlight = async () => {
    // Clear previous errors
    setError(null);
    setSuccess(null);
    setDeleteError(null);
    
    try {
      if (!selectedFlight) {
        setDeleteError('No flight selected for deletion');
        return;
      }

      console.log('Deleting flight:', selectedFlight.Flight_ID);

      const response = await fetch(`http://localhost:5000/api/flights/${selectedFlight.Flight_ID}`, {
        method: 'DELETE'
      });

      console.log('Delete response status:', response.status);

      let responseData;
      try {
        responseData = await response.json();
        console.log('Delete response data:', responseData);
      } catch (parseError) {
        console.error('Failed to parse delete response JSON:', parseError);
        setDeleteError(`Server returned invalid response (Status: ${response.status})`);
        return;
      }

      if (response.ok) {
        setSuccess(`Flight ${selectedFlight.Flight_No} deleted successfully!`);
        setShowDeleteModal(false);
        setSelectedFlight(null);
        setDeleteError(null);
        fetchData();
        clearMessagesAfterDelay();
      } else {
        const errorMessage = responseData?.error || responseData?.message || 'Failed to delete flight';
        console.log('Setting delete error:', errorMessage);
        setDeleteError(errorMessage);
      }
    } catch (err) {
      console.error('Network/request error during delete:', err);
      setDeleteError(`Network error: ${err.message}`);
    }
  };

  // CANCEL FLIGHT - Using stored procedure with proper error handling
  const handleCancelFlight = async () => {
    // Clear previous errors
    setError(null);
    setSuccess(null);
    setCancelError(null);
    
    try {
      if (!selectedFlight) {
        setCancelError('No flight selected for cancellation');
        return;
      }

      console.log('Cancelling flight:', selectedFlight.Flight_No);

      const response = await fetch('http://localhost:5000/api/flights/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flight_no: selectedFlight.Flight_No })
      });

      console.log('Cancel response status:', response.status);

      let responseData;
      try {
        responseData = await response.json();
        console.log('Cancel response data:', responseData);
      } catch (parseError) {
        console.error('Failed to parse cancel response JSON:', parseError);
        setCancelError(`Server returned invalid response (Status: ${response.status})`);
        return;
      }

      if (response.ok) {
        setSuccess(`Flight ${selectedFlight.Flight_No} cancelled successfully! All bookings have been cancelled.`);
        setShowCancelModal(false);
        setSelectedFlight(null);
        setCancelError(null);
        fetchData();
        clearMessagesAfterDelay();
      } else {
        const errorMessage = responseData?.error || responseData?.message || 'Failed to cancel flight';
        console.log('Setting cancel error:', errorMessage);
        setCancelError(errorMessage);
      }
    } catch (err) {
      console.error('Network/request error during cancel:', err);
      setCancelError(`Network error: ${err.message}`);
    }
  };

  const openEditModal = (flight) => {
    console.log('Opening edit modal for:', flight);
    setSelectedFlight(flight);
    setEditFlight({
      flight_no: flight.Flight_No || '',
      departure_time: flight.Departure_Time ? flight.Departure_Time.slice(0, 16) : '',
      arrival_time: flight.Arrival_Time ? flight.Arrival_Time.slice(0, 16) : '',
      status: flight.Status || '',
      capacity: flight.Capacity || 180
    });
    setEditError(null); // Clear previous errors
    setShowEditModal(true);
  };

  const openDeleteModal = (flight) => {
    console.log('Opening delete modal for:', flight);
    setSelectedFlight(flight);
    setDeleteError(null); // Clear previous errors
    setShowDeleteModal(true);
  };

  const openCancelModal = (flight) => {
    console.log('Opening cancel modal for:', flight);
    setSelectedFlight(flight);
    setCancelError(null); // Clear previous errors
    setShowCancelModal(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Scheduled': 'primary',
      'Delayed': 'warning',
      'Cancelled': 'danger',
      'Completed': 'success'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status || 'Unknown'}</Badge>;
  };

  const getCapacityBar = (available, capacity) => {
    const booked = capacity - available;
    const percentage = (booked / capacity) * 100;
    const variant = percentage > 80 ? 'danger' : percentage > 60 ? 'warning' : 'success';
    
    return (
      <div>
        <ProgressBar 
          variant={variant} 
          now={percentage} 
          style={{ height: '8px' }}
        />
        <small className="text-muted">
          {booked}/{capacity} booked ({available} available)
        </small>
      </div>
    );
  };

  const formatDateTime = (dateTime) => {
    try {
      return new Date(dateTime).toLocaleString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const safeFlights = Array.isArray(flights) ? flights : [];
  
  const filteredFlights = safeFlights.filter(flight => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (flight.Flight_No || '').toLowerCase().includes(searchLower) ||
      (flight.Airline || '').toLowerCase().includes(searchLower) ||
      (flight.From_Airport || '').toLowerCase().includes(searchLower) ||
      (flight.To_Airport || '').toLowerCase().includes(searchLower) ||
      (flight.From_City || '').toLowerCase().includes(searchLower) ||
      (flight.To_City || '').toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading flights...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2><FaPlane className="me-2 text-primary" />Flight Management</h2>
              <p className="text-muted">Manage flight schedules with real-time capacity tracking</p>
            </div>
            <Button variant="primary" onClick={() => {
              setCreateError(null);
              setShowModal(true);
            }}>
              <FaPlus className="me-1" /> Add New Flight
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          <strong>Success:</strong> {success}
        </Alert>
      )}

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Search Flights</Form.Label>
            <div className="position-relative">
              <Form.Control
                type="text"
                placeholder="Search by flight number, airline, or airport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted" />
            </div>
          </Form.Group>
        </Col>
        <Col md={6} className="d-flex align-items-end">
          <Button variant="outline-primary" onClick={fetchData} className="ms-2">
            <FaSearch className="me-1" /> Refresh Data
          </Button>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">All Flights ({filteredFlights.length})</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {filteredFlights.length === 0 ? (
                <div className="text-center py-4">
                  <FaPlane size={48} className="text-muted mb-3" />
                  <p className="text-muted">
                    {safeFlights.length === 0 ? 'No flights found in database' : 'No flights match your search'}
                  </p>
                  <Button variant="primary" onClick={() => setShowModal(true)}>
                    {safeFlights.length === 0 ? 'Add First Flight' : 'Add New Flight'}
                  </Button>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Flight No</th>
                      <th>Airline</th>
                      <th>Route</th>
                      <th>Departure</th>
                      <th>Arrival</th>
                      <th>Capacity</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFlights.map((flight, index) => (
                      <tr key={flight.Flight_ID || index}>
                        <td>
                          <strong className="text-primary">{flight.Flight_No || 'N/A'}</strong>
                        </td>
                        <td>{flight.Airline || 'N/A'}</td>
                        <td>
                          <small>
                            {flight.From_City || 'N/A'} → {flight.To_City || 'N/A'}
                            <br />
                            <span className="text-muted">
                              {flight.From_Airport || 'N/A'} → {flight.To_Airport || 'N/A'}
                            </span>
                          </small>
                        </td>
                        <td>
                          <small>{formatDateTime(flight.Departure_Time)}</small>
                        </td>
                        <td>
                          <small>{formatDateTime(flight.Arrival_Time)}</small>
                        </td>
                        <td style={{ minWidth: '150px' }}>
                          {getCapacityBar(flight.available_seats || 0, flight.Capacity || 180)}
                        </td>
                        <td>{getStatusBadge(flight.Status)}</td>
                        <td>
                          <Button 
                            size="sm" 
                            variant="outline-primary" 
                            className="me-1"
                            onClick={() => openEditModal(flight)}
                            title="Edit Flight"
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-warning"
                            className="me-1"
                            onClick={() => openCancelModal(flight)}
                            disabled={flight.Status === 'Cancelled'}
                            title="Cancel Flight"
                          >
                            <FaBan />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => openDeleteModal(flight)}
                            title="Delete Flight"
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* CREATE MODAL - FIXED WITH ERROR DISPLAY */}
      {showModal && (
        <div 
          className="modal d-block" 
          tabIndex="-1" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Flight</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowModal(false);
                    setCreateError(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleCreateFlight}>
                <div className="modal-body">
                  {/* ERROR DISPLAY FOR CREATE MODAL */}
                  {createError && (
                    <div className="alert alert-danger mb-3" role="alert">
                      <strong><FaExclamationTriangle className="me-2" />Error:</strong> {createError}
                    </div>
                  )}
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Flight Number *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g., AI101"
                          value={newFlight.flight_no}
                          onChange={(e) => setNewFlight({...newFlight, flight_no: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Capacity</label>
                        <input
                          type="number"
                          className="form-control"
                          value={newFlight.capacity}
                          onChange={(e) => setNewFlight({...newFlight, capacity: parseInt(e.target.value)})}
                          min="1"
                          max="500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Departure Time *</label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={newFlight.departure_time}
                          onChange={(e) => setNewFlight({...newFlight, departure_time: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Arrival Time *</label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={newFlight.arrival_time}
                          onChange={(e) => setNewFlight({...newFlight, arrival_time: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Airline *</label>
                        <select
                          className="form-select"
                          value={newFlight.airline_id}
                          onChange={(e) => setNewFlight({...newFlight, airline_id: e.target.value})}
                          required
                        >
                          <option value="">Select Airline</option>
                          {airlines.map(airline => (
                            <option key={airline.Airline_ID} value={airline.Airline_ID}>
                              {airline.Name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">From Airport *</label>
                        <select
                          className="form-select"
                          value={newFlight.from_airport_id}
                          onChange={(e) => setNewFlight({...newFlight, from_airport_id: e.target.value})}
                          required
                        >
                          <option value="">Select Departure</option>
                          {airports.map(airport => (
                            <option key={airport.Airport_ID} value={airport.Airport_ID}>
                              {airport.Name} ({airport.City})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">To Airport *</label>
                        <select
                          className="form-select"
                          value={newFlight.to_airport_id}
                          onChange={(e) => setNewFlight({...newFlight, to_airport_id: e.target.value})}
                          required
                        >
                          <option value="">Select Arrival</option>
                          {airports.map(airport => (
                            <option key={airport.Airport_ID} value={airport.Airport_ID}>
                              {airport.Name} ({airport.City})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false);
                      setCreateError(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Flight
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL - FIXED WITH ERROR DISPLAY */}
      {showEditModal && selectedFlight && (
        <div 
          className="modal d-block" 
          tabIndex="-1" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-primary">
                  <FaEdit className="me-2" />
                  Edit Flight {selectedFlight.Flight_No}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditError(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleUpdateFlight}>
                <div className="modal-body">
                  <div className="bg-light p-3 rounded mb-3">
                    <strong>Current Details:</strong><br />
                    <strong>Flight:</strong> {selectedFlight.Flight_No}<br />
                    <strong>Airline:</strong> {selectedFlight.Airline}<br />
                    <strong>Route:</strong> {selectedFlight.From_City} → {selectedFlight.To_City}<br />
                    <strong>Status:</strong> {selectedFlight.Status}<br />
                    <strong>Available Seats:</strong> {selectedFlight.available_seats}/{selectedFlight.Capacity}
                  </div>

                  {/* ERROR DISPLAY FOR EDIT MODAL */}
                  {editError && (
                    <div className="alert alert-danger mb-3" role="alert">
                      <strong><FaExclamationTriangle className="me-2" />Error:</strong> {editError}
                    </div>
                  )}
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Flight Number</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Leave empty to keep current"
                          value={editFlight.flight_no}
                          onChange={(e) => setEditFlight({...editFlight, flight_no: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Capacity</label>
                        <input
                          type="number"
                          className="form-control"
                          value={editFlight.capacity}
                          onChange={(e) => setEditFlight({...editFlight, capacity: parseInt(e.target.value)})}
                          min="1"
                          max="500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Departure Time</label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={editFlight.departure_time}
                          onChange={(e) => setEditFlight({...editFlight, departure_time: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Arrival Time</label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={editFlight.arrival_time}
                          onChange={(e) => setEditFlight({...editFlight, arrival_time: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={editFlight.status}
                          onChange={(e) => setEditFlight({...editFlight, status: e.target.value})}
                        >
                          <option value="">Keep current status</option>
                          <option value="Scheduled">Scheduled</option>
                          <option value="Delayed">Delayed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditError(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Flight
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL FLIGHT MODAL - FIXED WITH ERROR DISPLAY */}
      {showCancelModal && selectedFlight && (
        <div 
          className="modal d-block" 
          tabIndex="-1" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-warning">
                  <FaBan className="me-2" />
                  Cancel Flight
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelError(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <strong>Warning!</strong> This will cancel the flight and automatically cancel all associated bookings.
                </div>

                {/* ERROR DISPLAY FOR CANCEL MODAL */}
                {cancelError && (
                  <div className="alert alert-danger mb-3" role="alert">
                    <strong><FaExclamationTriangle className="me-2" />Error:</strong> {cancelError}
                  </div>
                )}

                <p>Are you sure you want to cancel this flight?</p>
                <div className="bg-light p-3 rounded">
                  <strong>Flight Details:</strong><br />
                  <strong>Flight Number:</strong> {selectedFlight.Flight_No}<br />
                  <strong>Airline:</strong> {selectedFlight.Airline}<br />
                  <strong>Route:</strong> {selectedFlight.From_City} → {selectedFlight.To_City}<br />
                  <strong>Current Bookings:</strong> {(selectedFlight.Capacity || 180) - (selectedFlight.available_seats || 0)} passengers
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelError(null);
                  }}
                >
                  Keep Flight
                </button>
                <button 
                  type="button" 
                  className="btn btn-warning"
                  onClick={handleCancelFlight}
                >
                  <FaBan className="me-1" />
                  Cancel Flight
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL - FIXED WITH ERROR DISPLAY */}
      {showDeleteModal && selectedFlight && (
        <div 
          className="modal d-block" 
          tabIndex="-1" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">
                  <FaExclamationTriangle className="me-2" />
                  Confirm Delete
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteError(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-danger">
                  <strong>Danger!</strong> This will permanently delete the flight and may affect existing bookings.
                </div>

                {/* ERROR DISPLAY FOR DELETE MODAL */}
                {deleteError && (
                  <div className="alert alert-danger mb-3" role="alert">
                    <strong><FaExclamationTriangle className="me-2" />Error:</strong> {deleteError}
                  </div>
                )}

                <p>Are you sure you want to delete this flight?</p>
                <div className="bg-light p-3 rounded">
                  <strong>Flight Details:</strong><br />
                  <strong>Flight Number:</strong> {selectedFlight.Flight_No}<br />
                  <strong>Airline:</strong> {selectedFlight.Airline}<br />
                  <strong>Route:</strong> {selectedFlight.From_City} → {selectedFlight.To_City}<br />
                  <strong>Status:</strong> {selectedFlight.Status}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteError(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={handleDeleteFlight}
                >
                  <FaTrash className="me-1" />
                  Delete Flight
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default Flights;