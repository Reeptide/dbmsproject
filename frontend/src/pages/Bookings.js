import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form, Alert, InputGroup } from 'react-bootstrap';
import { FaTicketAlt, FaPlus, FaEdit, FaTrash, FaSearch, FaExclamationTriangle, FaHistory, FaClock } from 'react-icons/fa';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [flights, setFlights] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editError, setEditError] = useState(null); // Added for edit-specific errors
  const [newBooking, setNewBooking] = useState({
    passenger_id: '',
    flight_id: '',
    seat_no: ''
  });
  const [editBooking, setEditBooking] = useState({
    seat_no: '',
    status: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Helper function to clear messages after delay
  const clearMessagesAfterDelay = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000); // Clear after 5 seconds
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data...');
      
      const [bookingsRes, flightsRes, passengersRes] = await Promise.all([
        fetch('http://localhost:5000/api/bookings/'),
        fetch('http://localhost:5000/api/flights/'),
        fetch('http://localhost:5000/api/passengers/')
      ]);

      const [bookingsResponse, flightsResponse, passengersResponse] = await Promise.all([
        bookingsRes.ok ? bookingsRes.json() : { data: [] },
        flightsRes.ok ? flightsRes.json() : { data: [] },
        passengersRes.ok ? passengersRes.json() : { data: [] }
      ]);
      
      console.log('Data fetched successfully');
      setBookings(bookingsResponse.data || []);
      setFlights(flightsResponse.data || []);
      setPassengers(passengersResponse.data || []);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Error loading data. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // CREATE - POST request with FIXED error handling
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    
    console.log('Starting create booking process...');
    
    // Clear previous messages immediately
    setError(null);
    setSuccess(null);
    
    try {
      // Validation
      if (!newBooking.passenger_id || !newBooking.flight_id || !newBooking.seat_no) {
        const errorMsg = 'Please fill in all required fields';
        console.log('Validation error:', errorMsg);
        setError(errorMsg);
        return;
      }

      const bookingData = {
        passenger_id: parseInt(newBooking.passenger_id),
        flight_id: parseInt(newBooking.flight_id),
        seat_no: newBooking.seat_no.trim().toUpperCase()
      };

      console.log('Creating booking with data:', bookingData);

      const response = await fetch('http://localhost:5000/api/bookings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      console.log('Response received. Status:', response.status);
      
      let responseData;
      try {
        responseData = await response.json();
        console.log('Response data parsed:', responseData);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        const errorMsg = `Server returned invalid response (Status: ${response.status})`;
        setError(errorMsg);
        return;
      }

      if (response.ok) {
        console.log('Booking created successfully');
        setSuccess('Booking created successfully with trigger validation and audit logging!');
        setShowModal(false);
        setNewBooking({ passenger_id: '', flight_id: '', seat_no: '' });
        fetchData();
        clearMessagesAfterDelay();
      } else {
        // Handle error response
        const errorMessage = responseData?.error || responseData?.message || `Request failed with status ${response.status}`;
        console.log('Setting error message:', errorMessage);
        
        // Force state update
        setError(errorMessage);
        
        // Also log to verify state was set
        console.log('Error state should now be:', errorMessage);
        
        // Don't close modal on error so user can see the error and retry
      }
    } catch (err) {
      console.error('Network/request error:', err);
      const errorMsg = `Network error: ${err.message}`;
      setError(errorMsg);
    }
  };

  // UPDATE - PUT request with proper error handling
  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setSuccess(null);
    setEditError(null);
    
    try {
      if (!editBooking.seat_no && !editBooking.status) {
        setEditError('Please update at least one field (seat number or status)');
        return;
      }

      const updateData = {};
      if (editBooking.seat_no) updateData.seat_no = editBooking.seat_no.trim().toUpperCase();
      if (editBooking.status) updateData.status = editBooking.status;

      console.log('Updating booking:', selectedBooking.Booking_ID, 'with data:', updateData);

      const response = await fetch(`http://localhost:5000/api/bookings/${selectedBooking.Booking_ID}`, {
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
        setSuccess(`Booking #${selectedBooking.Booking_ID} updated successfully!`);
        setShowEditModal(false);
        setSelectedBooking(null);
        setEditBooking({ seat_no: '', status: '' });
        setEditError(null);
        fetchData();
        clearMessagesAfterDelay();
      } else {
        const errorMessage = responseData?.error || responseData?.message || `Update failed with status ${response.status}`;
        console.log('Setting edit error message:', errorMessage);
        setEditError(errorMessage);
        console.log('editError state should now be:', errorMessage); // Debug line
      }
    } catch (err) {
      console.error('Network/request error during update:', err);
      const errorMsg = `Network error: ${err.message}`;
      setEditError(errorMsg);
    }
  };

  // DELETE - DELETE request
  const handleDeleteBooking = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      if (!selectedBooking) {
        setError('No booking selected for deletion');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/bookings/${selectedBooking.Booking_ID}`, {
        method: 'DELETE'
      });

      const responseData = await response.json();

      if (response.ok) {
        setSuccess(`Booking #${selectedBooking.Booking_ID} deleted successfully!`);
        setShowDeleteModal(false);
        setSelectedBooking(null);
        fetchData();
        clearMessagesAfterDelay();
      } else {
        const errorMessage = responseData.error || responseData.message || 'Failed to delete booking';
        setError(errorMessage);
      }
    } catch (err) {
      setError(`Delete error: ${err.message}`);
    }
  };

  // VIEW AUDIT LOG
  const handleViewAudit = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/bookings/audit');
      const responseData = await response.json();

      if (response.ok) {
        setAuditLogs(responseData.data || []);
        setShowAuditModal(true);
      } else {
        setError(responseData.error || 'Failed to fetch audit logs');
      }
    } catch (err) {
      setError(`Error fetching audit logs: ${err.message}`);
    }
  };

  const openEditModal = (booking) => {
    setSelectedBooking(booking);
    setEditBooking({
      seat_no: booking.Seat_No || '',
      status: booking.Status || ''
    });
    setEditError(null); // Clear any previous edit errors
    setShowEditModal(true);
  };

  const openDeleteModal = (booking) => {
    setSelectedBooking(booking);
    setShowDeleteModal(true);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Booked':
        return <Badge bg="success">Booked</Badge>;
      case 'Cancelled':
        return <Badge bg="danger">Cancelled</Badge>;
      default:
        return <Badge bg="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  const formatDateTime = (dateTime) => {
    try {
      const date = new Date(dateTime);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const formatBookingTime = (bookingTime) => {
    try {
      if (!bookingTime) return 'N/A';
      
      // Since database stores in local time (IST), treat as local time
      const date = new Date(bookingTime);
      
      return (
        <div>
          <div className="fw-bold text-primary">{date.toLocaleDateString()}</div>
          <small className="text-muted">{date.toLocaleTimeString()}</small>
        </div>
      );
    } catch (e) {
      return 'Invalid Time';
    }
  };

  // Simple local filter for quick search
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const filteredBookings = safeBookings.filter(booking => {
    const searchLower = searchTerm.toLowerCase();
    const passengerName = `${booking.First_Name || ''} ${booking.Last_Name || ''}`.toLowerCase();
    return (
      passengerName.includes(searchLower) ||
      (booking.Flight_No || '').toLowerCase().includes(searchLower) ||
      (booking.Seat_No || '').toLowerCase().includes(searchLower) ||
      (booking.Status || '').toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading bookings...</p>
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
              <h2><FaTicketAlt className="me-2 text-danger" />Booking Management</h2>
              <p className="text-muted">Complete booking management with booking timestamps and audit logging</p>
            </div>
            <div>
              <Button variant="warning" className="me-2" onClick={handleViewAudit}>
                <FaHistory className="me-1" /> Audit Log
              </Button>
              <Button variant="danger" onClick={() => setShowModal(true)}>
                <FaPlus className="me-1" /> Create Booking
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* ENHANCED ERROR AND SUCCESS ALERTS */}
      {error && (
        <Alert 
          variant="danger" 
          dismissible 
          onClose={() => setError(null)}
          className="mb-3"
          style={{ fontSize: '16px', fontWeight: 'bold' }}
        >
          <Alert.Heading className="h6">
            <FaExclamationTriangle className="me-2" />
            Booking Error
          </Alert.Heading>
          {error}
        </Alert>
      )}

      {success && (
        <Alert 
          variant="success" 
          dismissible 
          onClose={() => setSuccess(null)}
          className="mb-3"
          style={{ fontSize: '16px', fontWeight: 'bold' }}
        >
          <Alert.Heading className="h6">
            <FaTicketAlt className="me-2" />
            Success
          </Alert.Heading>
          {success}
        </Alert>
      )}

      {/* Simple Search Section */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Search Bookings</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search by passenger, flight, seat, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Form.Group>
        </Col>
        <Col md={6} className="d-flex align-items-end">
          <Button variant="outline-danger" onClick={fetchData} className="me-2">
            <FaSearch className="me-1" /> Refresh Data
          </Button>
          <Button variant="outline-warning" onClick={() => setSearchTerm('')}>
            Clear Search
          </Button>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">All Bookings ({filteredBookings.length})</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-4">
                  <FaTicketAlt size={48} className="text-muted mb-3" />
                  <p className="text-muted">No bookings found</p>
                  <Button variant="danger" onClick={() => setShowModal(true)}>
                    Create First Booking
                  </Button>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Passenger</th>
                      <th>Flight</th>
                      <th>Seat</th>
                      <th><FaClock className="me-1" />Booking Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking, index) => (
                      <tr key={booking.Booking_ID || index}>
                        <td>
                          <Badge bg="secondary">#{booking.Booking_ID}</Badge>
                        </td>
                        <td>
                          {booking.First_Name} {booking.Last_Name}
                        </td>
                        <td>
                          {booking.Flight_No} - {booking.Airline}
                        </td>
                        <td>
                          <Badge bg="info">{booking.Seat_No}</Badge>
                        </td>
                        <td style={{ minWidth: '130px' }}>
                          {formatBookingTime(booking.Booking_Time)}
                        </td>
                        <td>
                          {getStatusBadge(booking.Status)}
                        </td>
                        <td>
                          <Button 
                            size="sm" 
                            variant="outline-primary" 
                            className="me-1"
                            onClick={() => openEditModal(booking)}
                            title="Edit Booking"
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => openDeleteModal(booking)}
                            title="Delete Booking"
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

      {/* CREATE MODAL */}
      {showModal && (
        <div 
          className="modal d-block" 
          tabIndex="-1" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Booking</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowModal(false);
                    setError(null);
                    setSuccess(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleCreateBooking}>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <strong>Note:</strong> Booking creation uses trigger validation to prevent conflicts and automatically logs booking time.
                  </div>
                  
                  {/* MODAL ERROR DISPLAY */}
                  {error && (
                    <div className="alert alert-danger mb-3">
                      <strong>Error:</strong> {error}
                    </div>
                  )}
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Passenger *</label>
                        <select 
                          className="form-select"
                          value={newBooking.passenger_id}
                          onChange={(e) => setNewBooking({...newBooking, passenger_id: e.target.value})}
                          required
                        >
                          <option value="">Select Passenger</option>
                          {passengers.map(passenger => (
                            <option key={passenger.Passenger_ID} value={passenger.Passenger_ID}>
                              {passenger.First_Name} {passenger.Last_Name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Flight *</label>
                        <select 
                          className="form-select"
                          value={newBooking.flight_id}
                          onChange={(e) => setNewBooking({...newBooking, flight_id: e.target.value})}
                          required
                        >
                          <option value="">Select Flight</option>
                          {flights.map(flight => (
                            <option 
                              key={flight.Flight_ID} 
                              value={flight.Flight_ID}
                              disabled={flight.Status === 'Cancelled'}
                              style={{
                                color: flight.Status === 'Cancelled' ? '#dc3545' : 'inherit',
                                fontStyle: flight.Status === 'Cancelled' ? 'italic' : 'normal'
                              }}
                            >
                              {flight.Flight_No} - {flight.Airline} 
                              {flight.Status === 'Cancelled' && ' (CANCELLED - Cannot book)'}
                              {flight.Status === 'Delayed' && ' (DELAYED)'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Seat Number *</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="e.g., 12A"
                          value={newBooking.seat_no}
                          onChange={(e) => setNewBooking({...newBooking, seat_no: e.target.value.toUpperCase()})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Booking Time</label>
                        <div className="form-control-plaintext">
                          <FaClock className="me-2 text-muted" />
                          Will be set automatically to current time
                        </div>
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
                      setError(null);
                      setSuccess(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger">
                    Create Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL - FIXED WITH ERROR DISPLAY */}
      {showEditModal && selectedBooking && (
        <div 
          className="modal d-block" 
          tabIndex="-1" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-primary">
                  <FaEdit className="me-2" />
                  Edit Booking #{selectedBooking.Booking_ID}
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
              <form onSubmit={handleUpdateBooking}>
                <div className="modal-body">
                  <div className="bg-light p-3 rounded mb-3">
                    <strong>Current Details:</strong><br />
                    <strong>Passenger:</strong> {selectedBooking.First_Name} {selectedBooking.Last_Name}<br />
                    <strong>Flight:</strong> {selectedBooking.Flight_No} - {selectedBooking.Airline}<br />
                    <strong>Current Seat:</strong> {selectedBooking.Seat_No}<br />
                    <strong>Current Status:</strong> {selectedBooking.Status}<br />
                    <strong>Booked On:</strong> {formatDateTime(selectedBooking.Booking_Time)}
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
                        <label className="form-label">New Seat Number</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="e.g., 15A"
                          value={editBooking.seat_no}
                          onChange={(e) => setEditBooking({...editBooking, seat_no: e.target.value.toUpperCase()})}
                        />
                        <small className="text-muted">Leave empty to keep current seat</small>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select 
                          className="form-select"
                          value={editBooking.status}
                          onChange={(e) => setEditBooking({...editBooking, status: e.target.value})}
                        >
                          <option value="">Keep current status</option>
                          <option value="Booked">Booked</option>
                          <option value="Cancelled">Cancelled</option>
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
                    Update Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && selectedBooking && (
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
                    setError(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <strong>Warning!</strong> This action cannot be undone and will be logged in audit trail.
                </div>
                <p>Are you sure you want to delete this booking?</p>
                <div className="bg-light p-3 rounded">
                  <strong>Booking Details:</strong><br />
                  <strong>ID:</strong> #{selectedBooking.Booking_ID}<br />
                  <strong>Passenger:</strong> {selectedBooking.First_Name} {selectedBooking.Last_Name}<br />
                  <strong>Flight:</strong> {selectedBooking.Flight_No} - {selectedBooking.Airline}<br />
                  <strong>Seat:</strong> {selectedBooking.Seat_No}<br />
                  <strong>Status:</strong> {selectedBooking.Status}<br />
                  <strong>Booked On:</strong> {formatDateTime(selectedBooking.Booking_Time)}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setError(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={handleDeleteBooking}
                >
                  <FaTrash className="me-1" />
                  Delete Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT LOG MODAL */}
      {showAuditModal && (
        <div 
          className="modal d-block" 
          tabIndex="-1" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}}
        >
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-warning">
                  <FaHistory className="me-2" />
                  Booking Audit Log
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAuditModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <strong>Info:</strong> This shows all booking operations logged in the BookingAudit table.
                </div>
                {auditLogs.length === 0 ? (
                  <div className="text-center py-4">
                    <FaHistory size={48} className="text-muted mb-3" />
                    <p className="text-muted">No audit logs found</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Audit ID</th>
                          <th>Booking ID</th>
                          <th>Operation</th>
                          <th>Time</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log, index) => (
                          <tr key={log.Audit_ID || index}>
                            <td>
                              <Badge bg="secondary">#{log.Audit_ID}</Badge>
                            </td>
                            <td>
                              <Badge bg="primary">#{log.Booking_ID}</Badge>
                            </td>
                            <td>
                              <Badge bg={log.Operation === 'INSERT' ? 'success' : log.Operation === 'UPDATE' ? 'warning' : 'danger'}>
                                {log.Operation}
                              </Badge>
                            </td>
                            <td>
                              <small>{formatDateTime(log.Op_Time)}</small>
                            </td>
                            <td>
                              <small>{log.Details}</small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAuditModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default Bookings;