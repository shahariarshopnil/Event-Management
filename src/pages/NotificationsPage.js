import React, { useEffect } from 'react';
import { Container, ListGroup, Badge, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { FaBell, FaCheck, FaTrash } from 'react-icons/fa';
import { format } from 'date-fns';
import Loader from '../components/shared/Loader';
import Message from '../components/shared/Message';

// This assumes you have a notifications slice with getNotifications, markAsRead, and deleteNotification actions
// You may need to create these if they don't exist
const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { notifications, loading, error } = useSelector((state) => state.notifications || { notifications: [] });
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) {
      // Uncomment once you have the action implemented
      // dispatch(getNotifications());
    }
  }, [dispatch, userInfo]);

  const handleMarkAsRead = (id) => {
    // Uncomment once you have the action implemented
    // dispatch(markAsRead(id));
  };

  const handleDelete = (id) => {
    // Uncomment once you have the action implemented
    // dispatch(deleteNotification(id));
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <FaBell className="me-2" /> Notifications
        </h1>
        {notifications && notifications.length > 0 && (
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={() => {/* mark all as read */}}
          >
            <FaCheck className="me-1" /> Mark All as Read
          </Button>
        )}
      </div>
      
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : notifications && notifications.length > 0 ? (
        <ListGroup>
          {notifications.map((notification) => (
            <ListGroup.Item 
              key={notification._id} 
              className={`py-3 ${!notification.isRead ? 'bg-light' : ''}`}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="mb-1">
                    {!notification.isRead && (
                      <Badge bg="primary" pill className="me-2">
                        New
                      </Badge>
                    )}
                    <strong>{notification.title}</strong>
                  </div>
                  <p className="mb-1">{notification.message}</p>
                  <small className="text-muted">
                    {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                  </small>
                </div>
                <div className="d-flex">
                  {!notification.isRead && (
                    <Button 
                      variant="outline-success" 
                      size="sm" 
                      className="me-2"
                      onClick={() => handleMarkAsRead(notification._id)}
                    >
                      <FaCheck />
                    </Button>
                  )}
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => handleDelete(notification._id)}
                  >
                    <FaTrash />
                  </Button>
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <div className="text-center py-5">
          <div className="mb-3">
            <FaBell size={40} className="text-muted" />
          </div>
          <h3 className="h5">No Notifications</h3>
          <p className="text-muted">
            You don't have any notifications at the moment.
          </p>
        </div>
      )}
    </Container>
  );
};

export default NotificationsPage;
