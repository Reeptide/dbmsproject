import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form, Alert } from 'react-bootstrap';
import { FaBuilding, FaPlus, FaEdit, FaTrash, FaSearch, FaEnvelope, FaExclamationTriangle, FaPlane, FaUsers } from 'react-icons/fa';

const Airlines = () => {
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFlightsModal, setShowFlightsModal] = useState(false);
  const [selectedAirline, setSelectedAirline] = useState(null);
  const [airlineFlights, setAirlineFlights] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal-specific error states
  const [createError, setCreateError] = useState(null);
  const [editError, setEditError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  
  const [newAirline, setNewAirline] = useState({
    name: '',
    contact_info: ''
  });
  const [editAirline, setEditAirline] = useState({
    name: '',
    contact_info: ''
  });

  useEffect(() => {
    fetchAirlines();
  }, []);

  // Helper function to clear messages after delay
  const clearMessagesAfterDelay = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  const fetchAirlines = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/airlines/');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch airlines`);
      }
      
      const responseData = await response.json();
      console.log('Airlines API Response:', responseData);
      
      const airlinesData = responseData.data || responseData;
      console.log('Extracted airlines data:', airlinesData);
      
      setAirlines(Array.isArray(airlinesData) ? airlinesData : []);
      setError(null);
    } catch (err) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(`Error loading airlines: ${errorMessage}`);
      setAirlines([]);
      console.error('Airlines fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // CREATE - POST request with proper error handling
  const handleCreateAirline = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setSuccess(null);
    setCreateError(null);
    
    try {
      if (!newAirline.name.trim()) {
        setCreateError('Please fill in the airline name');
        return;
      }

      console.log('Creating airline:', newAirline);

      const response = await fetch('http://localhost:5000/api/airlines/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAirline)
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
        setSuccess('Airline created successfully!');
        setShowModal(false);
        setCreateError(null);
        setNewAirline({ name: '', contact_info: '' });
        fetchAirlines();
        clearMessagesAfterDelay();
      } else {
        const errorMessage = responseData?.error || responseData?.message || 'Failed to create airline';
        console.log('Setting create error:', errorMessage);
        setCreateError(errorMessage);
      }
    } catch (err) {
      console.error('Network/request error during create:', err);
      setCreateError(`Network error: ${err.message}`);
    }
  };

  // UPDATE - PUT request with proper error handling
const handleUpdateAirline = async (e) => {
  e.preventDefault();
  
  // Clear previous errors
  setError(null);
  setSuccess(null);
  setEditError(null);
  
  try {
    // Check if any fields were actually changed
    const nameChanged = editAirline.name && editAirline.name !== selectedAirline.Name;
    const contactChanged = editAirline.contact_info !== selectedAirline.Contact_Info;
    
    if (!nameChanged && !contactChanged) {
      setEditError('No changes detected. Please modify at least one field to update the airline.');
      return;
    }

    // Only send changed fields
    const updateData = {};
    if (nameChanged) updateData.name = editAirline.name;
    if (contactChanged) updateData.contact_info = editAirline.contact_info;

    console.log('Updating airline:', selectedAirline.Airline_ID, updateData);

    const response = await fetch(`http://localhost:5000/api/airlines/${selectedAirline.Airline_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      setEditError(`Server returned invalid response (Status: ${response.status})`);
      return;
    }

    if (response.ok) {
      setSuccess(`Airline ${selectedAirline.Name} updated successfully!`);
      setShowEditModal(false);
      setSelectedAirline(null);
      setEditError(null);
      setEditAirline({ name: '', contact_info: '' });
      fetchAirlines();
      clearMessagesAfterDelay();
    } else {
      const errorMessage = responseData?.error || responseData?.message || 'Failed to update airline';
      setEditError(errorMessage);
    }
  } catch (err) {
    setEditError(`Network error: ${err.message}`);
  }
};

  // DELETE - DELETE request with proper error handling
  const handleDeleteAirline = async () => {
    // Clear previous errors
    setError(null);
    setSuccess(null);
    setDeleteError(null);
    
    try {
      if (!selectedAirline) {
        setDeleteError('No airline selected for deletion');
        return;
      }

      console.log('Deleting airline:', selectedAirline.Airline_ID);

      const response = await fetch(`http://localhost:5000/api/airlines/${selectedAirline.Airline_ID}`, {
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
        setSuccess(`Airline ${selectedAirline.Name} deleted successfully!`);
        setShowDeleteModal(false);
        setSelectedAirline(null);
        setDeleteError(null);
        fetchAirlines();
        clearMessagesAfterDelay();
      } else {
        const errorMessage = responseData?.error || responseData?.message || 'Failed to delete airline';
        console.log('Setting delete error:', errorMessage);
        setDeleteError(errorMessage);
      }
    } catch (err) {
      console.error('Network/request error during delete:', err);
      setDeleteError(`Network error: ${err.message}`);
    }
  };

  // VIEW FLIGHTS - GET request
  const handleViewFlights = async (airline) => {
    try {
      console.log('Fetching flights for airline:', airline.Airline_ID);

      const response = await fetch(`http://localhost:5000/api/airlines/${airline.Airline_ID}/flights`);
      const responseData = await response.json();

      console.log('Flights API response:', responseData);

      if (response.ok) {
        const flightsData = responseData.data || [];
        setAirlineFlights(flightsData);
        setSelectedAirline(airline);
        setShowFlightsModal(true);
      } else {
        setError(responseData.error || 'Failed to fetch flights');
      }
    } catch (err) {
      console.error('Error fetching flights:', err);
      setError('Error fetching flights: ' + err.message);
    }
  };

  const openEditModal = (airline) => {
    console.log('Opening edit modal for:', airline);
    setSelectedAirline(airline);
    setEditAirline({
      name: airline.Name || '',
      contact_info: airline.Contact_Info || ''
    });
    setEditError(null); // Clear previous errors
    setShowEditModal(true);
  };

  const openDeleteModal = (airline) => {
    console.log('Opening delete modal for:', airline);
    setSelectedAirline(airline);
    setDeleteError(null); // Clear previous errors
    setShowDeleteModal(true);
  };

  const formatDateTime = (dateTime) => {
    try {
      return new Date(dateTime).toLocaleString();
    } catch (e) {
      return 'Invalid Date';
    }
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

  const safeAirlines = Array.isArray(airlines) ? airlines : [];
  const filteredAirlines = safeAirlines.filter(airline => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (airline.Name || '').toLowerCase().includes(searchLower) ||
      (airline.Contact_Info || '').toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border text-info" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading airlines...</p>
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
              <h2><FaBuilding className="me-2 text-info" />Airline Management</h2>
              <p className="text-muted">Manage airline partners and their flight operations</p>
            </div>
            <Button variant="info" onClick={() => {
              setCreateError(null);
              setShowModal(true);
            }}>
              <FaPlus className="me-1" /> Add New Airline
            </Button>
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
            <FaBuilding className="me-2" />
            Success
          </Alert.Heading>
          {success}
        </Alert>
      )}

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Search Airlines</Form.Label>
            <div className="position-relative">
              <Form.Control
                type="text"
                placeholder="Search by airline name or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted" />
            </div>
          </Form.Group>
        </Col>
        <Col md={6} className="d-flex align-items-end">
          <Button variant="outline-info" onClick={fetchAirlines} className="ms-2">
            <FaSearch className="me-1" /> Refresh Data
          </Button>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">All Airlines ({filteredAirlines.length})</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {filteredAirlines.length === 0 ? (
                <div className="text-center py-4">
                  <FaBuilding size={48} className="text-muted mb-3" />
                  <p className="text-muted">
                    {safeAirlines.length === 0 ? 'No airlines found in database' : 'No airlines match your search'}
                  </p>
                  <Button variant="info" onClick={() => setShowModal(true)}>
                    {safeAirlines.length === 0 ? 'Add First Airline' : 'Add New Airline'}
                  </Button>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Airline ID</th>
                      <th>Airline Name</th>
                      <th>Contact Information</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAirlines.map((airline, index) => (
                      <tr key={airline.Airline_ID || index}>
                        <td>
                          <Badge bg="secondary">#{airline.Airline_ID || 'N/A'}</Badge>
                        </td>
                        <td>
                          <strong className="text-info">{airline.Name || 'N/A'}</strong>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaEnvelope className="text-muted me-2" size={12} />
                            <small>{airline.Contact_Info || 'N/A'}</small>
                          </div>
                        </td>
                        <td>
                          <Button 
                            size="sm" 
                            variant="outline-primary" 
                            className="me-1"
                            onClick={() => openEditModal(airline)}
                            title="Edit Airline"
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-success" 
                            className="me-1"
                            onClick={() => handleViewFlights(airline)}
                            title="View Flights"
                          >
                            <FaPlane />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => openDeleteModal(airline)}
                            title="Delete Airline"
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

      {/* CREATE MODAL - WITH ERROR DISPLAY */}
      {showModal && (
        <div 
          className="modal d-block" 
          tabIndex="-1" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Airline</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowModal(false);
                    setCreateError(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleCreateAirline}>
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
                  
                  <div className="mb-3">
                    <label className="form-label">Airline Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter airline name (e.g., Air India, IndiGo)"
                      value={newAirline.name}
                      onChange={(e) => {
                        setNewAirline({...newAirline, name: e.target.value});
                        if (createError) setCreateError(null);
                      }}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Contact Information</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter contact email address"
                      value={newAirline.contact_info}
                      onChange={(e) => {
                        setNewAirline({...newAirline, contact_info: e.target.value});
                        if (createError) setCreateError(null);
                      }}
                    />
                    <div className="form-text">
                      Primary contact email for airline communications
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
                  <button type="submit" className="btn btn-info">
                    Create Airline
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL - WITH ERROR DISPLAY */}
      {showEditModal && selectedAirline && (
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
                  Edit Airline #{selectedAirline.Airline_ID}
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
              <form onSubmit={handleUpdateAirline}>
                <div className="modal-body">
                  <div className="bg-light p-3 rounded mb-3">
                    <strong>Current Details:</strong><br />
                    <strong>Name:</strong> {selectedAirline.Name}<br />
                    <strong>Contact:</strong> {selectedAirline.Contact_Info || 'Not provided'}
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
                  
                  <div className="mb-3">
                    <label className="form-label">Airline Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Leave empty to keep current"
                      value={editAirline.name}
                      onChange={(e) => {
                        setEditAirline({...editAirline, name: e.target.value});
                        if (editError) setEditError(null);
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Contact Information</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Leave empty to keep current"
                      value={editAirline.contact_info}
                      onChange={(e) => {
                        setEditAirline({...editAirline, contact_info: e.target.value});
                        if (editError) setEditError(null);
                      }}
                    />
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
                    Update Airline
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL - WITH ERROR DISPLAY */}
      {showDeleteModal && selectedAirline && (
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
                  <strong>Warning!</strong> This will permanently delete the airline and may affect existing flights.
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

                <p>Are you sure you want to delete this airline?</p>
                <div className="bg-light p-3 rounded">
                  <strong>Airline Details:</strong><br />
                  <strong>ID:</strong> #{selectedAirline.Airline_ID}<br />
                  <strong>Name:</strong> {selectedAirline.Name}<br />
                  <strong>Contact:</strong> {selectedAirline.Contact_Info || 'Not provided'}
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
                  onClick={handleDeleteAirline}
                >
                  <FaTrash className="me-1" />
                  Delete Airline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLIGHTS MODAL */}
      {showFlightsModal && selectedAirline && (
        <div 
          className="modal d-block" 
          tabIndex="-1" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}}
        >
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-success">
                  <FaPlane className="me-2" />
                  Flights for {selectedAirline.Name}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowFlightsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <strong>Airline:</strong> {selectedAirline.Name} (ID: #{selectedAirline.Airline_ID})
                </div>
                
                {airlineFlights.length === 0 ? (
                  <div className="text-center py-4">
                    <FaPlane size={48} className="text-muted mb-3" />
                    <p className="text-muted">No flights found for this airline</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Flight No</th>
                          <th>Route</th>
                          <th>Departure</th>
                          <th>Arrival</th>
                          <th>Capacity</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {airlineFlights.map((flight, index) => (
                          <tr key={flight.Flight_ID || index}>
                            <td>
                              <strong className="text-primary">{flight.Flight_No}</strong>
                            </td>
                            <td>
                              <small>
                                {flight.From_City} → {flight.To_City}<br />
                                <span className="text-muted">
                                  {flight.From_Airport} → {flight.To_Airport}
                                </span>
                              </small>
                            </td>
                            <td>
                              <small>{formatDateTime(flight.Departure_Time)}</small>
                            </td>
                            <td>
                              <small>{formatDateTime(flight.Arrival_Time)}</small>
                            </td>
                            <td>
                              <Badge bg="info">{flight.Capacity}</Badge>
                            </td>
                            <td>
                              {getStatusBadge(flight.Status)}
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
                  onClick={() => setShowFlightsModal(false)}
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

export default Airlines;