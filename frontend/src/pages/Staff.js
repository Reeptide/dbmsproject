import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form, Alert } from 'react-bootstrap';
import { FaUserTie, FaPlus, FaEdit, FaTrash, FaSearch, FaBuilding, FaMapMarkerAlt, FaExchangeAlt, FaHistory, FaExclamationTriangle } from 'react-icons/fa';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffHistory, setStaffHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal-specific error states
  const [createError, setCreateError] = useState(null);
  const [editError, setEditError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [transferError, setTransferError] = useState(null);
  
  const [newStaff, setNewStaff] = useState({
    first_name: '',
    last_name: '',
    role: '',
    airline_id: '',
    airport_id: ''
  });
  const [editStaff, setEditStaff] = useState({
    first_name: '',
    last_name: '',
    role: '',
    airline_id: '',
    airport_id: ''
  });
  const [transferData, setTransferData] = useState({
    new_airport_id: '',
    notes: ''
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
      const [staffRes, airlinesRes, airportsRes] = await Promise.all([
        fetch('http://localhost:5000/api/staff/'),
        fetch('http://localhost:5000/api/airlines/'),
        fetch('http://localhost:5000/api/airports/')
      ]);

      if (!staffRes.ok || !airlinesRes.ok || !airportsRes.ok) {
        throw new Error('One or more API requests failed');
      }

      const [staffResponse, airlinesResponse, airportsResponse] = await Promise.all([
        staffRes.json(),
        airlinesRes.json(),
        airportsRes.json()
      ]);

      console.log('API Responses:', { 
        staff: staffResponse, 
        airlines: airlinesResponse, 
        airports: airportsResponse 
      });

      const actualStaff = staffResponse.data || staffResponse;
      const actualAirlines = airlinesResponse.data || airlinesResponse;
      const actualAirports = airportsResponse.data || airportsResponse;

      setStaff(Array.isArray(actualStaff) ? actualStaff : []);
      setAirlines(Array.isArray(actualAirlines) ? actualAirlines : []);
      setAirports(Array.isArray(actualAirports) ? actualAirports : []);
      setError(null);
    } catch (err) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(`Error loading data: ${errorMessage}. Please check if backend is running.`);
      console.error('Fetch error:', err);
      
      setStaff([]);
      setAirlines([]);
      setAirports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setSuccess(null);
    setCreateError(null);
    
    try {
      if (!newStaff.first_name.trim() || !newStaff.last_name.trim() || !newStaff.role || 
          !newStaff.airline_id || !newStaff.airport_id) {
        setCreateError('Please fill in all required fields');
        return;
      }

      console.log('Creating staff:', newStaff);

      const response = await fetch('http://localhost:5000/api/staff/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff)
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
        setSuccess('Staff member created successfully!');
        setShowModal(false);
        setCreateError(null);
        setNewStaff({ first_name: '', last_name: '', role: '', airline_id: '', airport_id: '' });
        fetchData();
        clearMessagesAfterDelay();
      } else {
        const errorMessage = responseData?.error || responseData?.message || 'Failed to create staff member';
        console.log('Setting create error:', errorMessage);
        setCreateError(errorMessage);
      }
    } catch (err) {
      console.error('Network/request error during create:', err);
      setCreateError(`Network error: ${err.message}`);
    }
  };

  const openEditModal = (member) => {
    setSelectedStaff(member);
    setEditStaff({
      first_name: member.First_Name || '',
      last_name: member.Last_Name || '',
      role: member.Role || '',
      airline_id: member.Airline_ID || '',
      airport_id: member.Airport_ID || ''
    });
    setEditError(null); // Clear previous errors
    setShowEditModal(true);
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setSuccess(null);
    setEditError(null);
    
    try {
      // Check if any fields were actually changed
      const firstNameChanged = editStaff.first_name && editStaff.first_name !== selectedStaff.First_Name;
      const lastNameChanged = editStaff.last_name && editStaff.last_name !== selectedStaff.Last_Name;
      const roleChanged = editStaff.role && editStaff.role !== selectedStaff.Role;
      const airlineChanged = editStaff.airline_id && editStaff.airline_id !== selectedStaff.Airline_ID;
      const airportChanged = editStaff.airport_id && editStaff.airport_id !== selectedStaff.Airport_ID;
      
      if (!firstNameChanged && !lastNameChanged && !roleChanged && !airlineChanged && !airportChanged) {
        setEditError('No changes detected. Please modify at least one field to update the staff member.');
        return;
      }

      if (!editStaff.first_name.trim() || !editStaff.last_name.trim() || !editStaff.role || 
          !editStaff.airline_id || !editStaff.airport_id) {
        setEditError('Please fill in all required fields');
        return;
      }

      console.log('Updating staff:', selectedStaff.Staff_ID, editStaff);

      const response = await fetch(`http://localhost:5000/api/staff/${selectedStaff.Staff_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editStaff)
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
        setSuccess(`Staff member ${selectedStaff.First_Name} ${selectedStaff.Last_Name} updated successfully!`);
        setShowEditModal(false);
        setSelectedStaff(null);
        setEditError(null);
        setEditStaff({ first_name: '', last_name: '', role: '', airline_id: '', airport_id: '' });
        fetchData();
        clearMessagesAfterDelay();
      } else {
        const errorMessage = responseData?.error || responseData?.message || 'Failed to update staff member';
        console.log('Setting edit error:', errorMessage);
        setEditError(errorMessage);
      }
    } catch (err) {
      console.error('Network/request error during update:', err);
      setEditError(`Network error: ${err.message}`);
    }
  };

  const openDeleteModal = (member) => {
    setSelectedStaff(member);
    setDeleteError(null); // Clear previous errors
    setShowDeleteModal(true);
  };

  const handleDeleteStaff = async () => {
    // Clear previous errors
    setError(null);
    setSuccess(null);
    setDeleteError(null);
    
    try {
      if (!selectedStaff) {
        setDeleteError('No staff member selected for deletion');
        return;
      }

      console.log('Deleting staff:', selectedStaff.Staff_ID);

      const response = await fetch(`http://localhost:5000/api/staff/${selectedStaff.Staff_ID}`, {
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
        setSuccess(`Staff member ${selectedStaff.First_Name} ${selectedStaff.Last_Name} deleted successfully!`);
        setShowDeleteModal(false);
        setSelectedStaff(null);
        setDeleteError(null);
        fetchData();
        clearMessagesAfterDelay();
      } else {
        const errorMessage = responseData?.error || responseData?.message || 'Failed to delete staff member';
        console.log('Setting delete error:', errorMessage);
        setDeleteError(errorMessage);
      }
    } catch (err) {
      console.error('Network/request error during delete:', err);
      setDeleteError(`Network error: ${err.message}`);
    }
  };

  const openTransferModal = (member) => {
    setSelectedStaff(member);
    setTransferData({ new_airport_id: '', notes: '' });
    setTransferError(null); // Clear previous errors
    setShowTransferModal(true);
  };

  const handleTransferStaff = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setSuccess(null);
    setTransferError(null);
    
    try {
      if (!transferData.new_airport_id) {
        setTransferError('Please select a destination airport');
        return;
      }

      console.log('Transferring staff:', selectedStaff.Staff_ID, transferData);

      const response = await fetch('http://localhost:5000/api/staff/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: selectedStaff.Staff_ID,
          new_airport_id: transferData.new_airport_id,
          notes: transferData.notes || 'Staff transfer via management system'
        })
      });

      console.log('Transfer response status:', response.status);

      let responseData;
      try {
        responseData = await response.json();
        console.log('Transfer response data:', responseData);
      } catch (parseError) {
        console.error('Failed to parse transfer response JSON:', parseError);
        setTransferError(`Server returned invalid response (Status: ${response.status})`);
        return;
      }

      if (response.ok) {
        setSuccess('Staff transferred successfully using stored procedure with audit trail!');
        setShowTransferModal(false);
        setTransferData({ new_airport_id: '', notes: '' });
        setSelectedStaff(null);
        setTransferError(null);
        fetchData();
        clearMessagesAfterDelay();
      } else {
        const errorMessage = responseData?.error || responseData?.message || 'Failed to transfer staff';
        console.log('Setting transfer error:', errorMessage);
        setTransferError(errorMessage);
      }
    } catch (err) {
      console.error('Network/request error during transfer:', err);
      setTransferError(`Network error: ${err.message}`);
    }
  };

  const handleViewHistory = async (member) => {
    try {
      setSelectedStaff(member);
      setError(null);
      
      console.log('Fetching history for staff:', member.Staff_ID);

      const response = await fetch(`http://localhost:5000/api/staff/${member.Staff_ID}/history`);
      const responseData = await response.json();

      console.log('History API response:', responseData);

      if (response.ok) {
        setStaffHistory(responseData.data || []);
        setShowHistoryModal(true);
      } else {
        setError(responseData.error || 'Failed to fetch transfer history');
      }
    } catch (err) {
      console.error('Error fetching transfer history:', err);
      setError('Error fetching transfer history: ' + err.message);
    }
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      'Pilot': 'primary',
      'Flight Attendant': 'success',
      'Ground Staff': 'info',
      'Engineer': 'warning',
      'Cabin Crew': 'secondary',
      'Technician': 'dark',
      'Security Officer': 'danger',
      'Check-in Staff': 'info',
      'Flight Supervisor': 'primary'
    };
    return <Badge bg={roleColors[role] || 'secondary'}>{role || 'Unknown'}</Badge>;
  };

  const formatDateTime = (dateTime) => {
    try {
      return new Date(dateTime).toLocaleString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const safeStaff = Array.isArray(staff) ? staff : [];
  
  const filteredStaff = safeStaff.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${member.First_Name || ''} ${member.Last_Name || ''}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      (member.Role || '').toLowerCase().includes(searchLower) ||
      (member.Airline || '').toLowerCase().includes(searchLower) ||
      (member.Airport || '').toLowerCase().includes(searchLower) ||
      (member.Airport_City || '').toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border text-secondary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading staff...</p>
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
              <h2><FaUserTie className="me-2 text-secondary" />Staff Management System</h2>
              <p className="text-muted">Manage staff with transfer tracking using stored procedures and audit logging</p>
            </div>
            <Button variant="secondary" onClick={() => {
              setCreateError(null);
              setShowModal(true);
            }}>
              <FaPlus className="me-1" /> Add New Staff
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
          <Alert.Heading className="h6">
            <FaExclamationTriangle className="me-2" />
            Staff Management Error
          </Alert.Heading>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="mb-3">
          <Alert.Heading className="h6">
            <FaUserTie className="me-2" />
            Success
          </Alert.Heading>
          {success}
        </Alert>
      )}

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Search Staff</Form.Label>
            <div className="position-relative">
              <Form.Control
                type="text"
                placeholder="Search by name, role, airline, or airport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted" />
            </div>
          </Form.Group>
        </Col>
        <Col md={6} className="d-flex align-items-end">
          <Button variant="outline-secondary" onClick={fetchData} className="ms-2">
            <FaSearch className="me-1" /> Refresh Data
          </Button>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-secondary text-white">
              <h5 className="mb-0">All Staff Members ({filteredStaff.length})</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {filteredStaff.length === 0 ? (
                <div className="text-center py-4">
                  <FaUserTie size={48} className="text-muted mb-3" />
                  <p className="text-muted">
                    {safeStaff.length === 0 ? 'No staff members found in database' : 'No staff members match your search'}
                  </p>
                  <Button variant="secondary" onClick={() => setShowModal(true)}>
                    {safeStaff.length === 0 ? 'Add First Staff Member' : 'Add New Staff Member'}
                  </Button>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Staff ID</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Airline</th>
                      <th>Current Location</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((member, index) => (
                      <tr key={member.Staff_ID || index}>
                        <td>
                          <Badge bg="secondary">#{member.Staff_ID || 'N/A'}</Badge>
                        </td>
                        <td>
                          <strong>{member.First_Name || ''} {member.Last_Name || ''}</strong>
                        </td>
                        <td>{getRoleBadge(member.Role)}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaBuilding className="text-muted me-2" size={12} />
                            <small>{member.Airline || 'N/A'}</small>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaMapMarkerAlt className="text-muted me-2" size={12} />
                            <small>{member.Airport || 'N/A'}</small>
                            {member.Airport_City && (
                              <small className="text-muted ms-1">({member.Airport_City})</small>
                            )}
                          </div>
                        </td>
                        <td>
                          <Button 
                            size="sm" 
                            variant="outline-primary" 
                            className="me-1"
                            onClick={() => openEditModal(member)}
                            title="Edit Staff"
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-warning" 
                            className="me-1"
                            onClick={() => openTransferModal(member)}
                            title="Transfer Staff"
                          >
                            <FaExchangeAlt />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-info" 
                            className="me-1"
                            onClick={() => handleViewHistory(member)}
                            title="View Transfer History"
                          >
                            <FaHistory />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => openDeleteModal(member)}
                            title="Delete Staff"
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
                <h5 className="modal-title">Add New Staff Member</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowModal(false);
                    setCreateError(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleCreateStaff}>
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
                          value={newStaff.first_name}
                          onChange={(e) => {
                            setNewStaff({...newStaff, first_name: e.target.value});
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
                          value={newStaff.last_name}
                          onChange={(e) => {
                            setNewStaff({...newStaff, last_name: e.target.value});
                            if (createError) setCreateError(null);
                          }}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role *</label>
                    <select 
                      className="form-select"
                      value={newStaff.role}
                      onChange={(e) => {
                        setNewStaff({...newStaff, role: e.target.value});
                        if (createError) setCreateError(null);
                      }}
                      required
                    >
                      <option value="">Select role...</option>
                      <option value="Pilot">Pilot</option>
                      <option value="Flight Attendant">Flight Attendant</option>
                      <option value="Ground Staff">Ground Staff</option>
                      <option value="Engineer">Engineer</option>
                      <option value="Cabin Crew">Cabin Crew</option>
                      <option value="Technician">Technician</option>
                      <option value="Security Officer">Security Officer</option>
                      <option value="Check-in Staff">Check-in Staff</option>
                      <option value="Flight Supervisor">Flight Supervisor</option>
                    </select>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Airline *</label>
                        <select 
                          className="form-select"
                          value={newStaff.airline_id}
                          onChange={(e) => {
                            setNewStaff({...newStaff, airline_id: e.target.value});
                            if (createError) setCreateError(null);
                          }}
                          required
                        >
                          <option value="">Select airline...</option>
                          {airlines.map(airline => (
                            <option key={airline.Airline_ID} value={airline.Airline_ID}>
                              {airline.Name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Airport Assignment *</label>
                        <select 
                          className="form-select"
                          value={newStaff.airport_id}
                          onChange={(e) => {
                            setNewStaff({...newStaff, airport_id: e.target.value});
                            if (createError) setCreateError(null);
                          }}
                          required
                        >
                          <option value="">Select airport...</option>
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
                  <button type="submit" className="btn btn-secondary">
                    Create Staff Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL - WITH ERROR DISPLAY */}
      {showEditModal && selectedStaff && (
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
                  Edit Staff: {selectedStaff.First_Name} {selectedStaff.Last_Name}
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
              <form onSubmit={handleUpdateStaff}>
                <div className="modal-body">
                  <div className="bg-light p-3 rounded mb-3">
                    <strong>Current Details:</strong><br />
                    <strong>ID:</strong> #{selectedStaff.Staff_ID}<br />
                    <strong>Name:</strong> {selectedStaff.First_Name} {selectedStaff.Last_Name}<br />
                    <strong>Role:</strong> {selectedStaff.Role}<br />
                    <strong>Airline:</strong> {selectedStaff.Airline}<br />
                    <strong>Location:</strong> {selectedStaff.Airport} ({selectedStaff.Airport_City})
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
                        <label className="form-label">First Name *</label>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="Enter first name"
                          value={editStaff.first_name}
                          onChange={(e) => {
                            setEditStaff({...editStaff, first_name: e.target.value});
                            if (editError) setEditError(null);
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
                          value={editStaff.last_name}
                          onChange={(e) => {
                            setEditStaff({...editStaff, last_name: e.target.value});
                            if (editError) setEditError(null);
                          }}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role *</label>
                    <select 
                      className="form-select"
                      value={editStaff.role}
                      onChange={(e) => {
                        setEditStaff({...editStaff, role: e.target.value});
                        if (editError) setEditError(null);
                      }}
                      required
                    >
                      <option value="">Select role...</option>
                      <option value="Pilot">Pilot</option>
                      <option value="Flight Attendant">Flight Attendant</option>
                      <option value="Ground Staff">Ground Staff</option>
                      <option value="Engineer">Engineer</option>
                      <option value="Cabin Crew">Cabin Crew</option>
                      <option value="Technician">Technician</option>
                      <option value="Security Officer">Security Officer</option>
                      <option value="Check-in Staff">Check-in Staff</option>
                      <option value="Flight Supervisor">Flight Supervisor</option>
                    </select>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Airline *</label>
                        <select 
                          className="form-select"
                          value={editStaff.airline_id}
                          onChange={(e) => {
                            setEditStaff({...editStaff, airline_id: e.target.value});
                            if (editError) setEditError(null);
                          }}
                          required
                        >
                          <option value="">Select airline...</option>
                          {airlines.map(airline => (
                            <option key={airline.Airline_ID} value={airline.Airline_ID}>
                              {airline.Name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Airport Assignment *</label>
                        <select 
                          className="form-select"
                          value={editStaff.airport_id}
                          onChange={(e) => {
                            setEditStaff({...editStaff, airport_id: e.target.value});
                            if (editError) setEditError(null);
                          }}
                          required
                        >
                          <option value="">Select airport...</option>
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
                      setShowEditModal(false);
                      setEditError(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Staff
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL - WITH ERROR DISPLAY */}
      {showDeleteModal && selectedStaff && (
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
                
                <p>Are you sure you want to delete this staff member?</p>
                <div className="bg-light p-3 rounded">
                  <strong>Staff Details:</strong><br />
                  <strong>ID:</strong> #{selectedStaff.Staff_ID}<br />
                  <strong>Name:</strong> {selectedStaff.First_Name} {selectedStaff.Last_Name}<br />
                  <strong>Role:</strong> {selectedStaff.Role}<br />
                  <strong>Airline:</strong> {selectedStaff.Airline}<br />
                  <strong>Location:</strong> {selectedStaff.Airport} ({selectedStaff.Airport_City})
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
                  onClick={handleDeleteStaff}
                >
                  <FaTrash className="me-1" />
                  Delete Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL - WITH ERROR DISPLAY */}
      {showTransferModal && selectedStaff && (
        <div 
          className="modal d-block" 
          tabIndex="-1" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-warning">
                  <FaExchangeAlt className="me-2" />
                  Transfer Staff Member
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferError(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleTransferStaff}>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <strong>Transfer System</strong><br />
                    Uses stored procedure <code>sp_TransferStaff</code> to:
                    <ul className="mb-0 mt-2">
                      <li>Update staff location</li>
                      <li>Log transfer history in StaffHistory table</li>
                      <li>Maintain complete audit trail</li>
                    </ul>
                  </div>
                  
                  {/* ERROR DISPLAY FOR TRANSFER MODAL */}
                  {transferError && (
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
                          <strong>Error:</strong> {transferError}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-light p-3 rounded mb-3">
                    <strong>Staff Member:</strong> {selectedStaff.First_Name} {selectedStaff.Last_Name}<br />
                    <strong>Current Location:</strong> {selectedStaff.Airport} ({selectedStaff.Airport_City})<br />
                    <strong>Role:</strong> {selectedStaff.Role}<br />
                    <strong>Airline:</strong> {selectedStaff.Airline}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">New Airport Assignment *</label>
                    <select 
                      className="form-select"
                      value={transferData.new_airport_id}
                      onChange={(e) => {
                        setTransferData({...transferData, new_airport_id: e.target.value});
                        if (transferError) setTransferError(null);
                      }}
                      required
                    >
                      <option value="">Select new airport...</option>
                      {airports.filter(a => a.Airport_ID !== selectedStaff?.Airport_ID).map(airport => (
                        <option key={airport.Airport_ID} value={airport.Airport_ID}>
                          {airport.Name} ({airport.City})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Transfer Notes</label>
                    <textarea 
                      className="form-control"
                      rows={3}
                      placeholder="Enter reason for transfer or additional notes..."
                      value={transferData.notes}
                      onChange={(e) => {
                        setTransferData({...transferData, notes: e.target.value});
                        if (transferError) setTransferError(null);
                      }}
                    />
                    <small className="text-muted">
                      Optional notes will be logged in the transfer history
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowTransferModal(false);
                      setTransferError(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-warning">
                    <FaExchangeAlt className="me-1" />
                    Transfer Staff
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistoryModal && selectedStaff && (
        <div 
          className="modal d-block" 
          tabIndex="-1" 
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-info">
                  <FaHistory className="me-2" />
                  Transfer History: {selectedStaff.First_Name} {selectedStaff.Last_Name}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowHistoryModal(false);
                    setError(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <strong>Info:</strong> This shows all transfers logged in the StaffHistory table using the sp_TransferStaff stored procedure.
                </div>
                
                {error && (
                  <div className="alert alert-danger mb-3">
                    <strong>Error:</strong> {error}
                  </div>
                )}
                
                {staffHistory.length === 0 ? (
                  <div className="text-center py-4">
                    <FaHistory size={48} className="text-muted mb-3" />
                    <p className="text-muted">No transfer history found for this staff member</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>From</th>
                          <th>To</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffHistory.map((record, index) => (
                          <tr key={record.History_ID || index}>
                            <td>
                              <small>{formatDateTime(record.Changed_At)}</small>
                            </td>
                            <td>
                              <div>
                                <strong>{record.Old_Airport || 'N/A'}</strong>
                                {record.Old_City && <br />}
                                <small className="text-muted">{record.Old_City}</small>
                              </div>
                            </td>
                            <td>
                              <div>
                                <strong>{record.New_Airport || 'N/A'}</strong>
                                {record.New_City && <br />}
                                <small className="text-muted">{record.New_City}</small>
                              </div>
                            </td>
                            <td>
                              <small>{record.Notes || 'No notes'}</small>
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
                  onClick={() => {
                    setShowHistoryModal(false);
                    setError(null);
                  }}
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

export default Staff;