import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form, Alert } from 'react-bootstrap';
import { FaMapMarkerAlt, FaPlus, FaEdit, FaTrash, FaSearch, FaGlobe, FaPlane, FaUsers, FaExclamationTriangle } from 'react-icons/fa';

const Airports = () => {
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal-specific error states
  const [createError, setCreateError] = useState(null);
  const [editError, setEditError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  
  const [newAirport, setNewAirport] = useState({
    name: '',
    city: '',
    country: ''
  });
  const [editAirport, setEditAirport] = useState({
    name: '',
    city: '',
    country: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const clearMessagesAfterDelay = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/airports/');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch airports`);
      }
      
      const responseData = await response.json();
      console.log('Airports API Response:', responseData);
      
      const airportsData = responseData.data || responseData;
      console.log('Extracted airports data:', airportsData);
      
      setAirports(Array.isArray(airportsData) ? airportsData : []);
      setError(null);
    } catch (err) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(`Error loading airports: ${errorMessage}`);
      setAirports([]);
      console.error('Airports fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAirport = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setSuccess(null);
    setCreateError(null);
    
    try {
      if (!newAirport.name.trim() || !newAirport.city.trim() || !newAirport.country.trim()) {
        setCreateError('Please fill in all required fields');
        return;
      }

      console.log('Creating airport:', newAirport);

      const response = await fetch('http://localhost:5000/api/airports/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAirport)
      });

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
        setSuccess('Airport created successfully!');
        setShowModal(false);
        setCreateError(null);
        setNewAirport({ name: '', city: '', country: '' });
        fetchData();
        clearMessagesAfterDelay();
      } else {
        const errorMessage = responseData?.error || responseData?.message || 'Failed to create airport';
        console.log('Setting create error:', errorMessage);
        setCreateError(errorMessage);
      }
    } catch (err) {
      console.error('Network/request error during create:', err);
      setCreateError(`Network error: ${err.message}`);
    }
  };

  const openEditModal = (airport) => {
    setSelectedAirport(airport);
    setEditAirport({
      name: airport.Name || '',
      city: airport.City || '',
      country: airport.Country || ''
    });
    setEditError(null); // Clear previous errors
    setShowEditModal(true);
  };

  const handleUpdateAirport = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setSuccess(null);
    setEditError(null);
    
    try {
      // Check if any fields were actually changed
      const nameChanged = editAirport.name && editAirport.name !== selectedAirport.Name;
      const cityChanged = editAirport.city && editAirport.city !== selectedAirport.City;
      const countryChanged = editAirport.country && editAirport.country !== selectedAirport.Country;
      
      if (!nameChanged && !cityChanged && !countryChanged) {
        setEditError('No changes detected. Please modify at least one field to update the airport.');
        return;
      }

      if (!editAirport.name.trim() || !editAirport.city.trim() || !editAirport.country.trim()) {
        setEditError('All fields are required');
        return;
      }

      console.log('Updating airport:', selectedAirport.Airport_ID, editAirport);

      const response = await fetch(`http://localhost:5000/api/airports/${selectedAirport.Airport_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editAirport)
      });

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
        setSuccess(`Airport ${selectedAirport.Name} updated successfully!`);
        setShowEditModal(false);
        setSelectedAirport(null);
        setEditError(null);
        setEditAirport({ name: '', city: '', country: '' });
        fetchData();
        clearMessagesAfterDelay();
      } else {
        const errorMessage = responseData?.error || responseData?.message || 'Failed to update airport';
        console.log('Setting edit error:', errorMessage);
        setEditError(errorMessage);
      }
    } catch (err) {
      console.error('Network/request error during update:', err);
      setEditError(`Network error: ${err.message}`);
    }
  };

  const openDeleteModal = (airport) => {
    setSelectedAirport(airport);
    setDeleteError(null); // Clear previous errors
    setShowDeleteModal(true);
  };

  const handleDeleteAirport = async () => {
    // Clear previous errors
    setError(null);
    setSuccess(null);
    setDeleteError(null);
    
    try {
      if (!selectedAirport) {
        setDeleteError('No airport selected for deletion');
        return;
      }

      console.log('Deleting airport:', selectedAirport.Airport_ID);

      const response = await fetch(`http://localhost:5000/api/airports/${selectedAirport.Airport_ID}`, {
        method: 'DELETE'
      });

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
        setSuccess(`Airport ${selectedAirport.Name} deleted successfully!`);
        setShowDeleteModal(false);
        setSelectedAirport(null);
        setDeleteError(null);
        fetchData();
        clearMessagesAfterDelay();
      } else {
        const errorMessage = responseData?.error || responseData?.message || 'Failed to delete airport';
        console.log('Setting delete error:', errorMessage);
        setDeleteError(errorMessage);
      }
    } catch (err) {
      console.error('Network/request error during delete:', err);
      setDeleteError(`Network error: ${err.message}`);
    }
  };

  const getTrafficBadge = (departures, arrivals) => {
    const total = (departures || 0) + (arrivals || 0);
    if (total === 0) return <Badge bg="secondary">No Traffic</Badge>;
    if (total < 5) return <Badge bg="info">Low Traffic</Badge>;
    if (total < 15) return <Badge bg="warning">Medium Traffic</Badge>;
    return <Badge bg="success">High Traffic</Badge>;
  };

  const safeAirports = Array.isArray(airports) ? airports : [];
  const filteredAirports = safeAirports.filter(airport => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (airport.Name || '').toLowerCase().includes(searchLower) ||
      (airport.City || '').toLowerCase().includes(searchLower) ||
      (airport.Country || '').toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading airports...</p>
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
              <h2><FaMapMarkerAlt className="me-2 text-warning" />Airport Management</h2>
              <p className="text-muted">Manage airport locations with real-time traffic and staff analytics</p>
            </div>
            <Button variant="warning" onClick={() => {
              setCreateError(null);
              setShowModal(true);
            }}>
              <FaPlus className="me-1" /> Add New Airport
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
          <Alert.Heading className="h6">
            <FaExclamationTriangle className="me-2" />
            Airport Management Error
          </Alert.Heading>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="mb-3">
          <Alert.Heading className="h6">
            <FaMapMarkerAlt className="me-2" />
            Success
          </Alert.Heading>
          {success}
        </Alert>
      )}

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Search Airports</Form.Label>
            <div className="position-relative">
              <Form.Control
                type="text"
                placeholder="Search by airport name, city, or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted" />
            </div>
          </Form.Group>
        </Col>
        <Col md={6} className="d-flex align-items-end">
          <Button variant="outline-warning" onClick={fetchData} className="ms-2">
            <FaSearch className="me-1" /> Refresh Data
          </Button>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">All Airports ({filteredAirports.length})</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {filteredAirports.length === 0 ? (
                <div className="text-center py-4">
                  <FaMapMarkerAlt size={48} className="text-muted mb-3" />
                  <p className="text-muted">
                    {safeAirports.length === 0 ? 'No airports found in database' : 'No airports match your search'}
                  </p>
                  <Button variant="warning" onClick={() => setShowModal(true)}>
                    {safeAirports.length === 0 ? 'Add First Airport' : 'Add New Airport'}
                  </Button>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Airport ID</th>
                      <th>Airport Name</th>
                      <th>Location</th>
                      <th>Flight Traffic</th>
                      <th>Staff Count</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAirports.map((airport, index) => (
                      <tr key={airport.Airport_ID || index}>
                        <td>
                          <Badge bg="secondary">#{airport.Airport_ID || 'N/A'}</Badge>
                        </td>
                        <td>
                          <strong className="text-warning">{airport.Name || 'N/A'}</strong>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaGlobe className="text-muted me-2" size={12} />
                            <small>{airport.City || 'N/A'}, {airport.Country || 'N/A'}</small>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Badge bg="primary">
                              <FaPlane size={10} className="me-1" />
                              ↗{airport.departures || 0}
                            </Badge>
                            <Badge bg="info">
                              <FaPlane size={10} className="me-1" />
                              ↙{airport.arrivals || 0}
                            </Badge>
                          </div>
                          <small className="text-muted">
                            Total: {(airport.departures || 0) + (airport.arrivals || 0)}
                          </small>
                        </td>
                        <td>
                          <Badge bg="success">
                            <FaUsers size={10} className="me-1" />
                            {airport.total_staff || 0}
                          </Badge>
                        </td>
                        <td>
                          {getTrafficBadge(airport.departures, airport.arrivals)}
                        </td>
                        <td>
                          <Button 
                            size="sm" 
                            variant="outline-primary" 
                            className="me-1"
                            onClick={() => openEditModal(airport)}
                            title="Edit Airport"
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => openDeleteModal(airport)}
                            title="Delete Airport"
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
                <h5 className="modal-title">Add New Airport</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowModal(false);
                    setCreateError(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleCreateAirport}>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <strong>Note:</strong> Airport names must be unique within the same city.
                  </div>
                  
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
                    <label className="form-label">Airport Name *</label>
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="Enter airport name (e.g., Kempegowda International Airport)"
                      value={newAirport.name}
                      onChange={(e) => {
                        setNewAirport({...newAirport, name: e.target.value});
                        if (createError) setCreateError(null);
                      }}
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">City *</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="Enter city (e.g., Bangalore)"
                          value={newAirport.city}
                          onChange={(e) => {
                            setNewAirport({...newAirport, city: e.target.value});
                            if (createError) setCreateError(null);
                          }}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Country *</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="Enter country (e.g., India)"
                          value={newAirport.country}
                          onChange={(e) => {
                            setNewAirport({...newAirport, country: e.target.value});
                            if (createError) setCreateError(null);
                          }}
                          required
                        />
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
                  <button type="submit" className="btn btn-warning">
                    Create Airport
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL - WITH ERROR DISPLAY */}
      {showEditModal && selectedAirport && (
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
                  Edit Airport: {selectedAirport.Name}
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
              <form onSubmit={handleUpdateAirport}>
                <div className="modal-body">
                  <div className="bg-light p-3 rounded mb-3">
                    <strong>Current Details:</strong><br />
                    <strong>ID:</strong> #{selectedAirport.Airport_ID}<br />
                    <strong>Name:</strong> {selectedAirport.Name}<br />
                    <strong>Location:</strong> {selectedAirport.City}, {selectedAirport.Country}<br />
                    <strong>Traffic:</strong> {(selectedAirport.departures || 0) + (selectedAirport.arrivals || 0)} flights<br />
                    <strong>Staff:</strong> {selectedAirport.total_staff || 0} employees
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
                    <label className="form-label">Airport Name *</label>
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="Enter airport name"
                      value={editAirport.name}
                      onChange={(e) => {
                        setEditAirport({...editAirport, name: e.target.value});
                        if (editError) setEditError(null);
                      }}
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">City *</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="Enter city"
                          value={editAirport.city}
                          onChange={(e) => {
                            setEditAirport({...editAirport, city: e.target.value});
                            if (editError) setEditError(null);
                          }}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Country *</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="Enter country"
                          value={editAirport.country}
                          onChange={(e) => {
                            setEditAirport({...editAirport, country: e.target.value});
                            if (editError) setEditError(null);
                          }}
                          required
                        />
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
                    Update Airport
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL - WITH ERROR DISPLAY */}
      {showDeleteModal && selectedAirport && (
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
                
                <p>Are you sure you want to delete this airport?</p>
                <div className="bg-light p-3 rounded">
                  <strong>Airport Details:</strong><br />
                  <strong>ID:</strong> #{selectedAirport.Airport_ID}<br />
                  <strong>Name:</strong> {selectedAirport.Name}<br />
                  <strong>Location:</strong> {selectedAirport.City}, {selectedAirport.Country}<br />
                  <strong>Current Traffic:</strong> {(selectedAirport.departures || 0) + (selectedAirport.arrivals || 0)} flights<br />
                  <strong>Staff Count:</strong> {selectedAirport.total_staff || 0} employees
                </div>
                <div className="mt-3">
                  <small className="text-muted">
                    Note: Cannot delete airports with active flights or assigned staff.
                  </small>
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
                  onClick={handleDeleteAirport}
                >
                  <FaTrash className="me-1" />
                  Delete Airport
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default Airports;