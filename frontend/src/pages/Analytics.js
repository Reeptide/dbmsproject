import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Button, Table, Badge } from 'react-bootstrap';
import { FaChartBar, FaPlane, FaUsers, FaTicketAlt, FaBuilding, FaMapMarkerAlt, FaUserTie, FaPlay, FaDatabase, FaChartLine, FaArrowUp } from 'react-icons/fa';

const Analytics = () => {
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [activeQuery, setActiveQuery] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const responses = await Promise.all([
        fetch('http://localhost:5000/api/flights/'),
        fetch('http://localhost:5000/api/passengers/'),
        fetch('http://localhost:5000/api/bookings/'),
        fetch('http://localhost:5000/api/airlines/'),
        fetch('http://localhost:5000/api/airports/'),
        fetch('http://localhost:5000/api/staff/')
      ]);

      const failedRequests = responses.filter(r => !r.ok);
      if (failedRequests.length > 0) {
        console.warn(`${failedRequests.length} API requests failed`);
      }

      const [flightsResponse, passengersResponse, bookingsResponse, airlinesResponse, airportsResponse, staffResponse] = await Promise.all(
        responses.map(r => r.ok ? r.json() : { data: [], success: false })
      );

      const flightData = flightsResponse.data || flightsResponse;
      const passengerData = passengersResponse.data || passengersResponse;
      const bookingData = bookingsResponse.data || bookingsResponse;
      const airlineData = airlinesResponse.data || airlinesResponse;
      const airportData = airportsResponse.data || airportsResponse;
      const staffData = staffResponse.data || staffResponse;

      const safeFlightData = Array.isArray(flightData) ? flightData : [];
      const safePassengerData = Array.isArray(passengerData) ? passengerData : [];
      const safeBookingData = Array.isArray(bookingData) ? bookingData : [];
      const safeAirlineData = Array.isArray(airlineData) ? airlineData : [];
      const safeAirportData = Array.isArray(airportData) ? airportData : [];
      const safeStaffData = Array.isArray(staffData) ? staffData : [];

      setAnalytics({
        totalFlights: safeFlightData.length,
        totalPassengers: safePassengerData.length,
        totalBookings: safeBookingData.length,
        totalAirlines: safeAirlineData.length,
        totalAirports: safeAirportData.length,
        totalStaff: safeStaffData.length,
        activeFlights: safeFlightData.filter(f => f.Status === 'Scheduled').length,
        completedFlights: safeFlightData.filter(f => f.Status === 'Completed').length,
        cancelledFlights: safeFlightData.filter(f => f.Status === 'Cancelled').length
      });
      setError(null);
    } catch (err) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(`Error loading analytics data: ${errorMessage}`);
      console.error('Analytics fetch error:', err);
      
      setAnalytics({
        totalFlights: 0, totalPassengers: 0, totalBookings: 0,
        totalAirlines: 0, totalAirports: 0, totalStaff: 0,
        activeFlights: 0, completedFlights: 0, cancelledFlights: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // **4 Selected Queries based on requirements: 1 Nested, 1 Join, 2 Aggregate**
  const selectedQueries = [
    {
      id: 1,
      title: "Flights with Above-Average Bookings",
      type: "Nested Query",
      description: "Shows flights that have more bookings than the average across all flights using nested subqueries",
      endpoint: "/api/analytics/above-average-bookings",
      icon: FaPlane,
      color: "primary",
      sqlType: "Nested Query with HAVING clause"
    },
    {
      id: 2,
      title: "Passenger Flight Details",
      type: "Join Query", 
      description: "Complete passenger and flight information using multiple table joins (4 tables)",
      endpoint: "/api/analytics/passenger-bookings-detail",
      icon: FaUsers,
      color: "success",
      sqlType: "Multi-table JOIN query"
    },
    {
      id: 3,
      title: "Airline Passenger Statistics",
      type: "Aggregate Query",
      description: "Unique passenger count per airline using aggregation functions and GROUP BY",
      endpoint: "/api/analytics/unique-passengers-per-airline",
      icon: FaBuilding,
      color: "info",
      sqlType: "COUNT with GROUP BY aggregation"
    },
    {
      id: 4,
      title: "Busiest Airports Analysis",
      type: "Complex Aggregate Query",
      description: "Airport traffic analysis with departure and arrival counts using nested SELECT statements",
      endpoint: "/api/analytics/busiest-airports",
      icon: FaMapMarkerAlt,
      color: "warning",
      sqlType: "Complex aggregation with subqueries"
    }
  ];

  const executeQuery = async (query) => {
    try {
      setActiveQuery(query.id);
      setQueryResult(null);
      setShowResults(false);
      
      const response = await fetch(`http://localhost:5000${query.endpoint}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Query execution failed`);
      }
      
      const responseData = await response.json();
      const actualData = responseData.data || responseData;
      
      setQueryResult({
        data: actualData,
        query: query,
        timestamp: new Date().toLocaleString(),
        success: true
      });
      setShowResults(true);
    } catch (err) {
      setQueryResult({
        error: err.message.includes('HTTP') ? 
          'Query endpoint not implemented yet on backend' : 
          `Connection error: ${err.message}`,
        query: query,
        timestamp: new Date().toLocaleString(),
        success: false
      });
      setShowResults(true);
    } finally {
      setActiveQuery(null);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading analytics dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h1 className="display-6 mb-0">
                <FaChartBar className="me-3 text-primary" />
                Analytics Dashboard
              </h1>
              <p className="text-muted mt-2 mb-0">Advanced SQL Queries: Nested, Joins & Aggregations</p>
            </div>
            <Badge bg="success" className="fs-6 px-3 py-2">
              <FaDatabase className="me-2" />
              4 Selected Queries
            </Badge>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {/* Key Metrics */}
      <Row className="mb-5">
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                <FaPlane size={24} className="text-primary" />
              </div>
              <h3 className="text-primary mb-1">{analytics.totalFlights}</h3>
              <small className="text-muted text-uppercase fw-bold">Total Flights</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                <FaUsers size={24} className="text-success" />
              </div>
              <h3 className="text-success mb-1">{analytics.totalPassengers}</h3>
              <small className="text-muted text-uppercase fw-bold">Passengers</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                <FaTicketAlt size={24} className="text-danger" />
              </div>
              <h3 className="text-danger mb-1">{analytics.totalBookings}</h3>
              <small className="text-muted text-uppercase fw-bold">Bookings</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                <FaBuilding size={24} className="text-info" />
              </div>
              <h3 className="text-info mb-1">{analytics.totalAirlines}</h3>
              <small className="text-muted text-uppercase fw-bold">Airlines</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                <FaMapMarkerAlt size={24} className="text-warning" />
              </div>
              <h3 className="text-warning mb-1">{analytics.totalAirports}</h3>
              <small className="text-muted text-uppercase fw-bold">Airports</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={2} md={4} sm={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="bg-secondary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                <FaUserTie size={24} className="text-secondary" />
              </div>
              <h3 className="text-secondary mb-1">{analytics.totalStaff}</h3>
              <small className="text-muted text-uppercase fw-bold">Staff</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Selected Analytics Queries */}
      <Row className="mb-4">
        <Col>
          <h3 className="mb-4">
            <FaDatabase className="me-2 text-info" />
            Advanced SQL Analytics (4 Selected Queries)
          </h3>
          <p className="text-muted mb-4">
            Demonstrating complex database operations: <strong>1 Nested Query</strong>, <strong>1 Join Query</strong>, and <strong>2 Aggregate Queries</strong>
          </p>
        </Col>
      </Row>

      <Row>
        {selectedQueries.map((query) => (
          <Col lg={6} className="mb-4" key={query.id}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className={`bg-${query.color} bg-opacity-10 border-0`}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className={`mb-1 text-${query.color}`}>
                      <query.icon className="me-2" />
                      {query.title}
                    </h5>
                    <Badge bg={query.color} className="mb-2">{query.type}</Badge>
                  </div>
                </div>
                <small className="text-muted">{query.description}</small>
                <div className="mt-2">
                  <small className="text-info fw-bold">SQL Type: {query.sqlType}</small>
                </div>
              </Card.Header>
              <Card.Body className="p-3">
                <Button
                  variant={`${query.color}`}
                  size="lg"
                  onClick={() => executeQuery(query)}
                  disabled={activeQuery === query.id}
                  className="w-100"
                >
                  {activeQuery === query.id ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                      Executing Query...
                    </>
                  ) : (
                    <>
                      <FaPlay className="me-2" />
                      Execute {query.type}
                    </>
                  )}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Results Section */}
      {showResults && queryResult && (
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow">
              <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaChartLine className="me-2" />
                  {queryResult?.query?.title} - {queryResult?.query?.type}
                </h5>
                <Button variant="outline-light" size="sm" onClick={() => setShowResults(false)}>
                  Close
                </Button>
              </Card.Header>
              <Card.Body>
                {queryResult?.error ? (
                  <Alert variant="warning">
                    <strong>Query Not Available:</strong> {queryResult.error}
                    <br />
                    <small>This analysis endpoint needs to be implemented on the backend.</small>
                  </Alert>
                ) : (
                  <div>
                    <div className="mb-3 d-flex justify-content-between align-items-center">
                      <div>
                        <small className="text-muted">
                          <strong>Executed:</strong> {queryResult?.timestamp} | 
                          <strong> Results:</strong> {Array.isArray(queryResult?.data) ? queryResult.data.length : 'N/A'} rows
                        </small>
                      </div>
                      <Badge bg="info">{queryResult?.query?.sqlType}</Badge>
                    </div>
                    
                    {Array.isArray(queryResult?.data) && queryResult.data.length > 0 ? (
                      <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                        <Table responsive striped hover>
                          <thead className="table-light">
                            <tr>
                              {Object.keys(queryResult.data[0]).map((key) => (
                                <th key={key}>{key.replace(/_/g, ' ')}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {queryResult.data.slice(0, 50).map((row, index) => (
                              <tr key={index}>
                                {Object.values(row).map((value, i) => (
                                  <td key={i}>{value || 'N/A'}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                        {queryResult.data.length > 50 && (
                          <Alert variant="info" className="mt-3">
                            Showing first 50 results. Total: {queryResult.data.length} rows
                          </Alert>
                        )}
                      </div>
                    ) : (
                      <Alert variant="info">
                        No data returned from this analysis.
                      </Alert>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Analytics;