import React from 'react';
import { Spinner, Container } from 'react-bootstrap';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <Container className="d-flex justify-content-center align-items-center py-5">
      <div className="text-center">
        <Spinner animation="border" variant="primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3 text-muted">{message}</p>
      </div>
    </Container>
  );
};

export default Loading;