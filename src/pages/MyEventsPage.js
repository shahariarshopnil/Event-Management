import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Pagination, Table, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FaEdit, FaTrash, FaEye, FaUsers, FaCalendarPlus } from 'react-icons/fa';
import { getMyEvents, deleteEvent, resetEventSuccess } from '../redux/slices/eventSlice';
import Loader from '../components/shared/Loader';
import Message from '../components/shared/Message';

const MyEventsPage = () => {
  const dispatch = useDispatch();
  const { myEvents, loading, error, success, page, pages } = useSelector(
    (state) => state.events
  );

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    dispatch(getMyEvents());

    if (success) {
      dispatch(resetEventSuccess());
      toast.success('Event deleted successfully');
    }
  }, [dispatch, success]);

  const handlePageChange = (pageNumber) => {
    dispatch(getMyEvents(pageNumber));
  };

  const openDeleteModal = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const handleDeleteEvent = () => {
    if (eventToDelete) {
      dispatch(deleteEvent(eventToDelete._id));
      setShowDeleteModal(false);
    }
  };

  // Get status badge variant
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
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">My Events</h1>
        <Link to="/events/create">
          <Button variant="primary">
            <FaCalendarPlus className="me-2" /> Create New Event
          </Button>
        </Link>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : myEvents.length === 0 ? (
        <Card className="shadow-sm">
          <Card.Body className="p-5 text-center">
            <h3 className="mb-3">You haven't created any events yet</h3>
            <p className="text-muted mb-4">
              Get started by creating your first event. It's easy!
            </p>
            <Link to="/events/create">
              <Button variant="primary" size="lg">
                <FaCalendarPlus className="me-2" /> Create Your First Event
              </Button>
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Card className="shadow-sm mb-4">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Attendees</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myEvents.map((event) => (
                      <tr key={event._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={
                                event.eventImage.startsWith('http')
                                  ? event.eventImage
                                  : `http://localhost:5000/uploads/events/${event.eventImage}`
                              }
                              alt={event.title}
                              width="50"
                              height="50"
                              className="me-3 rounded"
                              style={{ objectFit: 'cover' }}
                            />
                            <div>
                              <h6 className="mb-0">{event.title}</h6>
                              <small className="text-muted">
                                {event.category?.name || 'General'}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          {format(new Date(event.date), 'MMM d, yyyy')}
                          <br />
                          <small className="text-muted">{event.time}</small>
                        </td>
                        <td>
                          <Badge bg={getStatusBadgeVariant(event.status)}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </Badge>
                          {event.featured && (
                            <Badge bg="warning" className="ms-2">
                              Featured
                            </Badge>
                          )}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="me-2">
                              {event.attendees?.filter(a => a.status === 'confirmed').length || 0}/
                              {event.maxAttendees}
                            </span>
                            <div 
                              className="progress flex-grow-1" 
                              style={{ height: '8px' }}
                            >
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{
                                  width: `${
                                    ((event.attendees?.filter(a => a.status === 'confirmed').length || 0) /
                                      event.maxAttendees) *
                                    100
                                  }%`,
                                }}
                                aria-valuenow={
                                  (event.attendees?.filter(a => a.status === 'confirmed').length || 0) /
                                  event.maxAttendees
                                }
                                aria-valuemin="0"
                                aria-valuemax="100"
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Link to={`/events/${event._id}`}>
                              <Button variant="outline-primary" size="sm">
                                <FaEye />
                              </Button>
                            </Link>
                            <Link to={`/events/edit/${event._id}`}>
                              <Button variant="outline-secondary" size="sm">
                                <FaEdit />
                              </Button>
                            </Link>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => openDeleteModal(event)}
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Pagination */}
          {pages > 1 && (
            <div className="d-flex justify-content-center">
              <Pagination>
                <Pagination.First
                  onClick={() => handlePageChange(1)}
                  disabled={page === 1}
                />
                <Pagination.Prev
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                />
                
                {[...Array(pages).keys()].map((x) => (
                  <Pagination.Item
                    key={x + 1}
                    active={x + 1 === page}
                    onClick={() => handlePageChange(x + 1)}
                  >
                    {x + 1}
                  </Pagination.Item>
                ))}
                
                <Pagination.Next
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pages}
                />
                <Pagination.Last
                  onClick={() => handlePageChange(pages)}
                  disabled={page === pages}
                />
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the event: <strong>{eventToDelete?.title}</strong>?</p>
          <p className="text-danger mb-0">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteEvent}>
            Delete Event
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MyEventsPage;
