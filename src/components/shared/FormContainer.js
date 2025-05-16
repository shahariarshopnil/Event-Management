import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const FormContainer = ({ children, title, maxWidth }) => {
  return (
    <Container>
      <Row className="justify-content-md-center my-4">
        <Col xs={12} md={maxWidth || 8}>
          <Card className="shadow-sm">
            {title && (
              <Card.Header as="h5" className="bg-primary text-white py-3">
                {title}
              </Card.Header>
            )}
            <Card.Body className="p-4">{children}</Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default FormContainer;
