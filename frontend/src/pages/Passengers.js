import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Alert, Badge, InputGroup } from 'react-bootstrap';
import { FaUsers, FaPlus, FaEdit, FaTrash, FaSearch, FaEnvelope, FaPhone, FaTicketAlt, FaExclamationTriangle, FaFilter, FaCalendar, FaUserPlus } from 'react-icons/fa';

const Passengers = () => {
  const [passengers, setPassengers] = useState([]);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [showBookingCountModal, setShowBookingCountModal] = useState(false);
  const [showQuickBookingModal, setShowQuickBookingModal] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [passengerBookings, setPassengerBookings] = useState([]);
  const [bookingCount, setBookingCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal-specific error states
  const [createError, setCreateError] = useState(null);
  const [editError, setEditError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [quickBookingError, setQuickBookingError] = useState(null);
  
  // Advanced search filters
  const [advancedSearch, setAdvancedSearch] = useState({
    name: '',
    email: '',
    min_bookings: 0
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  const [newPassenger, setNewPassenger] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });
  
  const [editPassenger, setEditPassenger] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });

  // Quick booking (passenger + booking in one go)
  const [quickBooking, setQuickBooking] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    flight_no: '',
    seat_no: ''
  });

  useEffect(() => {
    fetchPassengers();
    fetchFlights();
  }, []);

  // Helper function to clear messages after delay
  const clearMessagesAfterDelay = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  const fetchPassengers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/passengers/');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch passengers`);
      }
      
      const responseData = await response.json();
      const passengersData = responseData.data || responseData;
      setPassengers(Array.isArray(passengersData) ? passengersData : []);
      setError(null);
    } catch (err) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(`Error loading passengers: ${errorMessage}`);
      setPassengers([]);
      console.error('Passengers fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlights = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/flights/');
      if (response.ok) {
        const responseData = await response.json();
        const flightsData = responseData.data || responseData;
        setFlights(Array.isArray(flightsData) ? flightsData : []);
      }
    } catch (err) {
      console.error('Error fetching flights:', err);
    }
  };

  // GET BOOKING COUNT using MySQL function
  const handleGetBookingCount = async (passenger) => {
    try {
      console.log('Getting booking count for passenger:', passenger.Passenger_ID);

      const response = await fetch(`http://localhost:5000/api/passengers/${passenger.Passenger_ID}/booking-count`);
      const responseData = await response.json();

      if (response.ok) {
        setBookingCount(responseData.booking_count);
        setSelectedPassenger(passenger);
        setShowBookingCountModal(true);
        setSuccess(`Booking count fetched using MySQL function: ${responseData.booking_count}`);
        clearMessagesAfterDelay();
      } else {
        setError(responseData.error || 'Failed to get booking count');
      }
    } catch (err) {
      setError('Error getting booking count: ' + err.message);
    }
  };

  // CREATE PASSENGER + BOOKING using stored procedure with enhanced error handling
  const handleQuickBooking = async (e) => {
    e.preventDefault();
    
    // Clear previous errors and messages
    setError(null);
    setSuccess(null);
    setQuickBookingError(null);
    
    try {
      // Frontend validation - check required fields
      if (!quickBooking.first_name || !quickBooking.last_name || !quickBooking.email || 
          !quickBooking.phone || !quickBooking.flight_no || !quickBooking.seat_no) {
        setQuickBookingError('Please fill in all required fields including phone number');
        return;
      }

      console.log('Creating passenger with booking:', quickBooking);

      const response = await fetch('http://localhost:5000/api/passengers/create-with-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quickBooking)
      });

      console.log('Quick booking response status:', response.status);

      let responseData;
      try {
        responseData = await response.json();
        console.log('Quick booking response data:', responseData);
      } catch (parseError) {
        console.error('Failed to parse quick booking response JSON:', parseError);
        setQuickBookingError('Server returned an invalid response. Please try again.');
        return;
      }

      if (response.ok) {
        // Success case
        const method = responseData.method === 'stored_procedure' ? 'using stored procedure' : 
                     responseData.method === 'manual' ? 'using direct database calls' : '';
        setSuccess(`${responseData.message} ${method} (Booking ID: ${responseData.booking_id})`);
        setShowQuickBookingModal(false);
        setQuickBookingError(null);
        setQuickBooking({ first_name: '', last_name: '', email: '', phone: '', flight_no: '', seat_no: '' });
        fetchPassengers();
        clearMessagesAfterDelay();
      } else {
        // Error case - Handle all possible backend errors
        const errorMessage = responseData?.error || responseData?.message || 'Failed to create passenger with booking';
        
        console.error('Quick booking failed with error:', errorMessage);
        console.error('Response status:', response.status);
        
        // Set the error message that will be displayed in the modal
        setQuickBookingError(errorMessage);
        
        // Modal stays open so user can see error and fix it
      }
    } catch (err) {
      console.error('Network/request error during quick booking:', err);
      setQuickBookingError('Network error occurred. Please check your connection and try again.');
    }
  };

  // VIEW BOOKINGS - GET request
  const handleViewBookings = async (passenger) => {
    try {
      console.log('Fetching bookings for passenger:', passenger.Passenger_ID);

      const response = await fetch(`http://localhost:5000/api/passengers/${passenger.Passenger_ID}/bookings`);
      const responseData = await response.json();

      console.log('Bookings API response:', responseData);

      if (response.ok) {
        const bookingsData = responseData.data || [];
        console.log('Setting bookings data:', bookingsData);
        console.log('Setting selected passenger:', passenger);
        
        setPassengerBookings(bookingsData);
        setSelectedPassenger(passenger);
        setShowBookingsModal(true);
        
        console.log('Modal should now be visible');
      } else {
        setError(responseData.error || 'Failed to fetch bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Error fetching bookings: ' + err.message);
    }
  };

  // Advanced Search Function
  const handleAdvancedSearch = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (advancedSearch.name) params.append('name', advancedSearch.name);
      if (advancedSearch.email) params.append('email', advancedSearch.email);
      if (advancedSearch.min_bookings > 0) params.append('min_bookings', advancedSearch.min_bookings);
      
      const url = `http://localhost:5000/api/passengers/search?${params.toString()}`;
      console.log('Advanced search URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Search failed`);
      }
      
      const responseData = await response.json();
      console.log('Search Results:', responseData);
      
      const passengersData = responseData.data || responseData;
      setPassengers(Array.isArray(passengersData) ? passengersData : []);
      setError(null);
      
      setSuccess(`Found ${passengersData.length} passenger(s) matching your criteria`);
      clearMessagesAfterDelay();
    } catch (err) {
      setError(`Search failed: ${err.message}`);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setAdvancedSearch({ name: '', email: '', min_bookings: 0 });
    setSearchTerm('');
    fetchPassengers();
  };

  // CREATE - POST request with proper error handling
  const handleCreatePassenger = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setSuccess(null);
    setCreateError(null);
    
    try {
      // UPDATED VALIDATION - PHONE IS NOW REQUIRED
      if (!newPassenger.first_name || !newPassenger.last_name || !newPassenger.email || !newPassenger.phone) {
        setCreateError('Please fill in all required fields including phone number');
        return;
      }

      const response = await fetch('http://localhost:5000/api/passengers/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPassenger)
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
        setSuccess('Passenger created successfully!');
        setShowModal(false);
        setCreateError(null);
        setNewPassenger({ first_name: '', last_name: '', email: '', phone: '' });
        fetchPassengers();
        clearMessagesAfterDelay();
      } else {
        const errorMessage = responseData?.error || responseData?.message || 'Failed to create passenger';
        console.log('Setting create error:', errorMessage);
        setCreateError(errorMessage);
      }
    } catch (err) {
      console.error('Network/request error during create:', err);
      setCreateError(`Network error: ${err.message}`);
    }
  };

  // UPDATE - PUT request with proper error handling
  const handleUpdatePassenger = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setSuccess(null);
    setEditError(null);
    
    try {
      if (!editPassenger.first_name && !editPassenger.last_name && 
          !editPassenger.email && !editPassenger.phone) {
        setEditError('Please update at least one field');
        return;
      }

      const updateData = {};
      if (editPassenger.first_name) updateData.first_name = editPassenger.first_name;
      if (editPassenger.last_name) updateData.last_name = editPassenger.last_name;
      if (editPassenger.email) updateData.email = editPassenger.email;
      if (editPassenger.phone) updateData.phone = editPassenger.phone;

      const response = await fetch(`http://localhost:5000/api/passengers/${selectedPassenger.Passenger_ID}`, {
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
        setSuccess(`Passenger ${selectedPassenger.First_Name} ${selectedPassenger.Last_Name} updated successfully!`);
        setShowEditModal(false);
        setSelectedPassenger(null);
        setEditError(null);
        setEditPassenger({ first_name: '', last_name: '', email: '', phone: '' });
        fetchPassengers();
        clearMessagesAfterDelay();
      } else {
        const errorMessage = responseData?.error || responseData?.message || 'Failed to update passenger';
        console.log('Setting edit error:', errorMessage);
        setEditError(errorMessage);
      }
    } catch (err) {
      console.error('Network/request error during update:', err);
      setEditError(`Network error: ${err.message}`);
    }
  };

  // DELETE - DELETE request with proper error handling
  const handleDeletePassenger = async () => {
    // Clear previous errors
    setError(null);
    setSuccess(null);
    setDeleteError(null);
    
    try {
      if (!selectedPassenger) {
        setDeleteError('No passenger selected for deletion');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/passengers/${selectedPassenger.Passenger_ID}`, {
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
        setSuccess(`Passenger ${selectedPassenger.First_Name} ${selectedPassenger.Last_Name} deleted successfully!`);
        setShowDeleteModal(false);
        setSelectedPassenger(null);
        setDeleteError(null);
        fetchPassengers();
        clearMessagesAfterDelay();
      } else {
        const errorMessage = responseData?.error || responseData?.message || 'Failed to delete passenger';
        console.log('Setting delete error:', errorMessage);
        setDeleteError(errorMessage);
      }
    } catch (err) {
      console.error('Network/request error during delete:', err);
      setDeleteError(`Network error: ${err.message}`);
    }
  };

  const openEditModal = (passenger) => {
    setSelectedPassenger(passenger);
    setEditPassenger({
      first_name: passenger.First_Name || '',
      last_name: passenger.Last_Name || '',
      email: passenger.Email || '',
      phone: passenger.Phone || ''
    });
    setEditError(null); // Clear previous errors
    setShowEditModal(true);
  };

  const openDeleteModal = (passenger) => {
    setSelectedPassenger(passenger);
    setDeleteError(null); // Clear previous errors
    setShowDeleteModal(true);
  };

  const getBookingBadge = (count) => {
    if (count === 0) return <Badge bg="secondary">No bookings</Badge>;
    if (count === 1) return <Badge bg="info">1 booking</Badge>;
    if (count < 5) return <Badge bg="success">{count} bookings</Badge>;
    return <Badge bg="warning">{count} bookings (Frequent)</Badge>;
  };

  const getBookingStatusBadge = (status) => {
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
      return new Date(dateTime).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Simple local filter for quick search
  const safePassengers = Array.isArray(passengers) ? passengers : [];
  const filteredPassengers = safePassengers.filter(passenger => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${passenger.First_Name || ''} ${passenger.Last_Name || ''}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      (passenger.Email || '').toLowerCase().includes(searchLower) ||
      (passenger.Phone || '').includes(searchTerm)
    );
  });

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading passengers...</p>
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
              <h2><FaUsers className="me-2 text-success" />Passenger Management</h2>
              <p className="text-muted">Complete passenger management with unique email & phone validation</p>
            </div>
            <div>
              <Button variant="info" className="me-2" onClick={() => {
                setQuickBookingError(null);
                setShowQuickBookingModal(true);
              }}>
                <FaUserPlus className="me-1" /> Quick Booking
              </Button>
              <Button variant="success" onClick={() => {
                setCreateError(null);
                setShowModal(true);
              }}>
                <FaPlus className="me-1" /> Add Passenger
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <Alert.Heading className="h6">
            <FaExclamationTriangle className="me-2" />
            System Error
          </Alert.Heading>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          <Alert.Heading className="h6">
            <FaUsers className="me-2" />
            Success
          </Alert.Heading>
          {success}
        </Alert>
      )}

      {/* Search Section */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Quick Search</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button 
                variant="outline-success" 
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              >
                <FaFilter />
              </Button>
            </InputGroup>
          </Form.Group>
        </Col>
        <Col md={6} className="d-flex align-items-end">
          <Button variant="outline-success" onClick={fetchPassengers} className="me-2">
            <FaSearch className="me-1" /> Refresh Data
          </Button>
          <Button variant="outline-warning" onClick={clearSearch}>
            Clear Filters
          </Button>
        </Col>
      </Row>

      {/* Advanced Search Panel */}
      {showAdvancedSearch && (
        <Row className="mb-3">
          <Col>
            <Card className="border-info">
              <Card.Header className="bg-info text-white">
                <h6 className="mb-0"><FaFilter className="me-2" />Advanced Search</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-2">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Search by name..."
                        value={advancedSearch.name}
                        onChange={(e) => setAdvancedSearch({...advancedSearch, name: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-2">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Search by email..."
                        value={advancedSearch.email}
                        onChange={(e) => setAdvancedSearch({...advancedSearch, email: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-2">
                      <Form.Label>Minimum Bookings</Form.Label>
                      <Form.Select
                        value={advancedSearch.min_bookings}
                        onChange={(e) => setAdvancedSearch({...advancedSearch, min_bookings: parseInt(e.target.value)})}
                      >
                        <option value={0}>Any (0+)</option>
                        <option value={1}>Active passengers (1+)</option>
                        <option value={2}>Regular passengers (2+)</option>
                        <option value={5}>Frequent passengers (5+)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex gap-2">
                  <Button variant="info" onClick={handleAdvancedSearch}>
                    <FaSearch className="me-1" /> Search
                  </Button>
                  <Button variant="outline-secondary" onClick={clearSearch}>
                    Clear
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">All Passengers ({filteredPassengers.length})</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {filteredPassengers.length === 0 ? (
                <div className="text-center py-4">
                  <FaUsers size={48} className="text-muted mb-3" />
                  <p className="text-muted">
                    {safePassengers.length === 0 ? 'No passengers found in database' : 'No passengers match your search'}
                  </p>
                  <Button variant="success" onClick={() => setShowModal(true)}>
                    {safePassengers.length === 0 ? 'Add First Passenger' : 'Add New Passenger'}
                  </Button>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Passenger ID</th>
                      <th>Name</th>
                      <th>Contact Information</th>
                      <th>Booking History</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPassengers.map((passenger, index) => (
                      <tr key={passenger.Passenger_ID || index}>
                        <td>
                          <Badge bg="secondary">#{passenger.Passenger_ID || 'N/A'}</Badge>
                        </td>
                        <td>
                          <strong>{passenger.First_Name || ''} {passenger.Last_Name || ''}</strong>
                        </td>
                        <td>
                          <div>
                            <div className="d-flex align-items-center mb-1">
                              <FaEnvelope className="text-muted me-2" size={12} />
                              <small>{passenger.Email || 'N/A'}</small>
                            </div>
                            <div className="d-flex align-items-center">
                              <FaPhone className="text-muted me-2" size={12} />
                              <small>{passenger.Phone || 'N/A'}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            {getBookingBadge(passenger.booking_count || 0)}
                            <br />
                            <Button 
                              size="sm" 
                              variant="outline-secondary" 
                              className="mt-1"
                              onClick={() => handleGetBookingCount(passenger)}
                              title="Get exact count using MySQL function"
                            >
                              <FaCalendar size={10} /> Count
                            </Button>
                          </div>
                        </td>
                        <td>
                          <Button 
                            size="sm" 
                            variant="outline-primary" 
                            className="me-1"
                            onClick={() => openEditModal(passenger)}
                            title="Edit Passenger"
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-info" 
                            className="me-1"
                            onClick={() => handleViewBookings(passenger)}
                            title="View Bookings"
                          >
                            <FaTicketAlt />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => openDeleteModal(passenger)}
                            title="Delete Passenger"
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

      {/* CREATE MODAL - WITH PHONE UNIQUENESS & 10 DIGITS */}
      {showModal && (
        <div 
          className="modal d-block" 
          tabIndex="-1" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Passenger</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowModal(false);
                    setCreateError(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleCreatePassenger}>
                <div className="modal-body">
                  {/* ERROR DISPLAY FOR CREATE MODAL */}
                  {createError && (
                    <div 
                      className="alert alert-danger mb-3" 
                      role="alert"
                      style={{
                        backgroundColor: '#f8d7da',
                        borderColor: '#f5c6cb',
                        color: '#721c24',
                        border: '1px solid #f5c6cb',
                        borderRadius: '0.375rem',
                        padding: '0.75rem 1.25rem',
                        marginBottom: '1rem'
                      }}
                    >
                      <div className="d-flex align-items-start">
                        <FaExclamationTriangle className="me-2 mt-1" style={{color: '#721c24', minWidth: '16px'}} size={16} />
                        <div className="flex-grow-1">
                          <strong>Error:</strong> {createError}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">First Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter first name"
                          value={newPassenger.first_name}
                          onChange={(e) => {
                            setNewPassenger({...newPassenger, first_name: e.target.value});
                            if (createError) setCreateError(null);
                          }}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Last Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter last name"
                          value={newPassenger.last_name}
                          onChange={(e) => {
                            setNewPassenger({...newPassenger, last_name: e.target.value});
                            if (createError) setCreateError(null);
                          }}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter unique email address"
                      value={newPassenger.email}
                      onChange={(e) => {
                        setNewPassenger({...newPassenger, email: e.target.value});
                        if (createError) setCreateError(null);
                      }}
                      required
                    />
                    <div className="form-text">
                      Email must be unique and will be used for booking identification.
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="Enter exactly 10 digits"
                      value={newPassenger.phone}
                      onChange={(e) => {
                        // Allow only digits and limit to 10
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setNewPassenger({...newPassenger, phone: value});
                        if (createError) setCreateError(null);
                      }}
                      maxLength="10"
                      required
                    />
                    <div className="form-text">
                      Phone number must be exactly 10 digits and unique. 
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
                  <button type="submit" className="btn btn-success">
                    Create Passenger
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL - WITH PHONE UNIQUENESS & 10 DIGITS */}
      {showEditModal && selectedPassenger && (
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
                  Edit Passenger #{selectedPassenger.Passenger_ID}
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
              <form onSubmit={handleUpdatePassenger}>
                <div className="modal-body">
                  <div className="bg-light p-3 rounded mb-3">
                    <strong>Current Details:</strong><br />
                    <strong>Name:</strong> {selectedPassenger.First_Name} {selectedPassenger.Last_Name}<br />
                    <strong>Email:</strong> {selectedPassenger.Email}<br />
                    <strong>Phone:</strong> {selectedPassenger.Phone || 'Not provided'}<br />
                    <strong>Total Bookings:</strong> {selectedPassenger.booking_count || 0}
                  </div>

                  {/* ERROR DISPLAY FOR EDIT MODAL */}
                  {editError && (
                    <div 
                      className="alert alert-danger mb-3" 
                      role="alert"
                      style={{
                        backgroundColor: '#f8d7da',
                        borderColor: '#f5c6cb',
                        color: '#721c24',
                        border: '1px solid #f5c6cb',
                        borderRadius: '0.375rem',
                        padding: '0.75rem 1.25rem',
                        marginBottom: '1rem'
                      }}
                    >
                      <div className="d-flex align-items-start">
                        <FaExclamationTriangle className="me-2 mt-1" style={{color: '#721c24', minWidth: '16px'}} size={16} />
                        <div className="flex-grow-1">
                          <strong>Error:</strong> {editError}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Leave empty to keep current"
                          value={editPassenger.first_name}
                          onChange={(e) => {
                            setEditPassenger({...editPassenger, first_name: e.target.value});
                            if (editError) setEditError(null);
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Leave empty to keep current"
                          value={editPassenger.last_name}
                          onChange={(e) => {
                            setEditPassenger({...editPassenger, last_name: e.target.value});
                            if (editError) setEditError(null);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Leave empty to keep current"
                      value={editPassenger.email}
                      onChange={(e) => {
                        setEditPassenger({...editPassenger, email: e.target.value});
                        if (editError) setEditError(null);
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="Enter exactly 10 digits"
                      value={editPassenger.phone}
                      onChange={(e) => {
                        // Allow only digits and limit to 10
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setEditPassenger({...editPassenger, phone: value});
                        if (editError) setEditError(null);
                      }}
                      maxLength="10"
                      required
                    />
                    <div className="form-text">
                      Phone number must be exactly 10 digits and unique. 
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
                    Update Passenger
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL - WITH ERROR DISPLAY */}
      {showDeleteModal && selectedPassenger && (
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
                <div className="alert alert-warning">
                  <strong>Warning!</strong> This action cannot be undone.
                </div>

                {/* ERROR DISPLAY FOR DELETE MODAL */}
                {deleteError && (
                  <div 
                    className="alert alert-danger mb-3" 
                    role="alert"
                    style={{
                      backgroundColor: '#f8d7da',
                      borderColor: '#f5c6cb',
                      color: '#721c24',
                      border: '1px solid #f5c6cb',
                      borderRadius: '0.375rem',
                      padding: '0.75rem 1.25rem',
                      marginBottom: '1rem'
                    }}
                  >
                    <div className="d-flex align-items-start">
                      <FaExclamationTriangle className="me-2 mt-1" style={{color: '#721c24', minWidth: '16px'}} size={16} />
                      <div className="flex-grow-1">
                        <strong>Error:</strong> {deleteError}
                      </div>
                    </div>
                  </div>
                )}

                <p>Are you sure you want to delete this passenger?</p>
                <div className="bg-light p-3 rounded">
                  <strong>Passenger Details:</strong><br />
                  <strong>ID:</strong> #{selectedPassenger.Passenger_ID}<br />
                  <strong>Name:</strong> {selectedPassenger.First_Name} {selectedPassenger.Last_Name}<br />
                  <strong>Email:</strong> {selectedPassenger.Email}<br />
                  <strong>Phone:</strong> {selectedPassenger.Phone}<br />
                  <strong>Total Bookings:</strong> {selectedPassenger.booking_count || 0}
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
                  onClick={handleDeletePassenger}
                >
                  <FaTrash className="me-1" />
                  Delete Passenger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK BOOKING MODAL - WITH PHONE UNIQUENESS & 10 DIGITS */}
      {showQuickBookingModal && (
        <div 
          className="modal d-block" 
          tabIndex="-1" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-info">
                  <FaUserPlus className="me-2" />
                  Quick Booking (Passenger + Booking)
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowQuickBookingModal(false);
                    setQuickBookingError(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleQuickBooking}>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <strong>Note:</strong> This uses MySQL stored procedure with comprehensive validation to create passenger and booking in one transaction.
                  </div>

                  {/* FIXED ERROR DISPLAY - WORKS FOR ALL ERROR TYPES */}
                  {quickBookingError && (
                    <div 
                      className="alert alert-danger mb-3" 
                      role="alert"
                      style={{
                        backgroundColor: '#f8d7da',
                        borderColor: '#f5c6cb',
                        color: '#721c24',
                        border: '1px solid #f5c6cb',
                        borderRadius: '0.375rem',
                        padding: '0.75rem 1.25rem',
                        marginBottom: '1rem',
                        fontSize: '14px'
                      }}
                    >
                      <div className="d-flex align-items-start">
                        <FaExclamationTriangle 
                          className="me-2 mt-1" 
                          style={{color: '#721c24', minWidth: '16px'}} 
                          size={16} 
                        />
                        <div className="flex-grow-1">
                          <strong>Error:</strong> {quickBookingError}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">First Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter first name"
                          value={quickBooking.first_name}
                          onChange={(e) => {
                            setQuickBooking({...quickBooking, first_name: e.target.value});
                            // Clear error when user starts typing
                            if (quickBookingError) setQuickBookingError(null);
                          }}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Last Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter last name"
                          value={quickBooking.last_name}
                          onChange={(e) => {
                            setQuickBooking({...quickBooking, last_name: e.target.value});
                            if (quickBookingError) setQuickBookingError(null);
                          }}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Email *</label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="Enter unique email"
                          value={quickBooking.email}
                          onChange={(e) => {
                            setQuickBooking({...quickBooking, email: e.target.value});
                            if (quickBookingError) setQuickBookingError(null);
                          }}
                          required
                        />
                        <div className="form-text">
                          Must be unique - not used by another passenger
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Phone *</label>
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="Enter exactly 10 digits"
                          value={quickBooking.phone}
                          onChange={(e) => {
                            // Allow only digits and limit to 10
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setQuickBooking({...quickBooking, phone: value});
                            if (quickBookingError) setQuickBookingError(null);
                          }}
                          maxLength="10"
                          required
                        />
                        <div className="form-text">
                          Required: Exactly 10 digits and must be unique. 
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Flight Number *</label>
                        <select
                          className="form-select"
                          value={quickBooking.flight_no}
                          onChange={(e) => {
                            setQuickBooking({...quickBooking, flight_no: e.target.value});
                            if (quickBookingError) setQuickBookingError(null);
                          }}
                          required
                        >
                          <option value="">Select Flight</option>
                          {flights.map(flight => (
                            <option 
                              key={flight.Flight_ID} 
                              value={flight.Flight_No}
                              disabled={flight.Status === 'Cancelled'}
                              style={{
                                color: flight.Status === 'Cancelled' ? '#dc3545' : 'inherit',
                                fontStyle: flight.Status === 'Cancelled' ? 'italic' : 'normal'
                              }}
                            >
                              {flight.Flight_No} - {flight.Airline}
                              {flight.Status === 'Cancelled' && ' (CANCELLED)'}
                              {flight.Status === 'Delayed' && ' (DELAYED)'}
                              {flight.available_seats === 0 && ' (FULL)'}
                            </option>
                          ))}
                        </select>
                        <div className="form-text">
                          Only active flights with available seats are bookable
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Seat Number *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g., 12A"
                          value={quickBooking.seat_no}
                          onChange={(e) => {
                            setQuickBooking({...quickBooking, seat_no: e.target.value.toUpperCase()});
                            if (quickBookingError) setQuickBookingError(null);
                          }}
                          required
                        />
                        <div className="form-text">
                          Seat must be available on the selected flight
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
                      setShowQuickBookingModal(false);
                      setQuickBookingError(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-info">
                    <FaUserPlus className="me-1" />
                    Create Passenger & Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING COUNT MODAL (Shows MySQL Function Result) */}
      {showBookingCountModal && selectedPassenger && (
        <div 
          className="modal d-block" 
          tabIndex="-1" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-info">
                  <FaCalendar className="me-2" />
                  Booking Count (MySQL Function)
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowBookingCountModal(false)}
                ></button>
              </div>
              <div className="modal-body text-center">
                <div className="bg-light p-3 rounded mb-3">
                  <strong>Passenger:</strong> {selectedPassenger.First_Name} {selectedPassenger.Last_Name}<br />
                  <strong>ID:</strong> #{selectedPassenger.Passenger_ID}
                </div>
                
                <div className="alert alert-info">
                  <strong>Result from MySQL function <code>fn_PassengerBookingCount()</code>:</strong>
                </div>
                
                <h1 className="display-4 text-info">{bookingCount}</h1>
                <p className="text-muted">Active bookings</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowBookingCountModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOOKINGS MODAL */}
      {showBookingsModal && selectedPassenger && (
        <div 
          className="modal d-block" 
          tabIndex="-1" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}}
        >
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-info">
                  <FaTicketAlt className="me-2" />
                  Bookings for {selectedPassenger.First_Name} {selectedPassenger.Last_Name}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowBookingsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <strong>Passenger:</strong> {selectedPassenger.First_Name} {selectedPassenger.Last_Name} (ID: #{selectedPassenger.Passenger_ID})
                </div>
                
                {passengerBookings.length === 0 ? (
                  <div className="text-center py-4">
                    <FaTicketAlt size={48} className="text-muted mb-3" />
                    <p className="text-muted">No bookings found for this passenger</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Booking ID</th>
                          <th>Flight</th>
                          <th>Route</th>
                          <th>Seat</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {passengerBookings.map((booking, index) => (
                          <tr key={booking.Booking_ID || index}>
                            <td>
                              <Badge bg="secondary">#{booking.Booking_ID}</Badge>
                            </td>
                            <td>
                              <strong>{booking.Flight_No}</strong><br />
                              <small className="text-muted">{booking.Airline}</small>
                            </td>
                            <td>
                              <small>
                                {booking.From_City} → {booking.To_City}<br />
                                <span className="text-muted">
                                  {booking.From_Airport} → {booking.To_Airport}
                                </span>
                              </small>
                            </td>
                            <td>
                              <Badge bg="info">{booking.Seat_No}</Badge>
                            </td>
                            <td>
                              <small>{formatDateTime(booking.Date)}</small>
                            </td>
                            <td>
                              {getBookingStatusBadge(booking.Status)}
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
                  onClick={() => setShowBookingsModal(false)}
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

export default Passengers;