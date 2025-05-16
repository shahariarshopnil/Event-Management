import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FaCalendarAlt, FaMapMarkerAlt, FaUser } from 'react-icons/fa';

const EventCard = ({ event }) => {
  // Function to determine badge color based on event status
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'upcoming':
        return 'primary';
      case 'ongoing':
        return 'success';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'danger';
      default:
        return 'info';
    }
  };

  return (
    <Card className="h-100 shadow-sm hover-shadow transition-all">
      <Link to={`/events/${event._id}`} className="text-decoration-none">
        <div className="position-relative">
          <Card.Img
            variant="top"
            src={
              event.eventImage.startsWith('http')
                ? event.eventImage
                : `http://localhost:5000/uploads/events/${event.eventImage}`
            }
            alt={event.title}
            style={{ height: '180px', objectFit: 'cover' }}
          />
          <Badge
            bg={getStatusBadgeVariant(event.status)}
            className="position-absolute top-0 end-0 m-2"
          >
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </Badge>
          {event.featured && (
            <Badge bg="warning" className="position-absolute top-0 start-0 m-2">
              Featured
            </Badge>
          )}
        </div>
      </Link>
      <Card.Body className="d-flex flex-column">
        <Link to={`/events/${event._id}`} className="text-decoration-none text-dark">
          <Card.Title className="fw-bold mb-2">{event.title}</Card.Title>
        </Link>
        
        <Card.Text className="text-muted small mb-2">
          <FaCalendarAlt className="me-1" />
          {format(new Date(event.date), 'PPP')} at {event.time}
        </Card.Text>
        
        <Card.Text className="text-muted small mb-2">
          <FaMapMarkerAlt className="me-1" />
          {event.location}, {event.city}
        </Card.Text>
        
        {event.organizer && (
          <Card.Text className="text-muted small mb-2">
            <FaUser className="me-1" />
            Organized by: {event.organizer.name}
          </Card.Text>
        )}
        
        <Card.Text className="mb-3 text-truncate">{event.shortDescription}</Card.Text>
        
        <div className="mt-auto d-flex justify-content-between align-items-center">
          <Badge bg="light" text="dark" className="border">
            {event.category ? event.category.name : 'General'}
          </Badge>
          <span className="fw-bold text-primary">
            ${event.price.toFixed(2)}
          </span>
        </div>
      </Card.Body>
    </Card>
  );
};

export default EventCard;
