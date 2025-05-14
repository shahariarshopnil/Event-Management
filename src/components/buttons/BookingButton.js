import React from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaTicketAlt } from 'react-icons/fa';

/**
 * A reusable booking button for packages and tickets
 * @param {Object} props - Component props
 * @param {string} props.eventId - ID of the event
 * @param {Object} [props.package] - Package object (optional)
 * @param {string} [props.packageId] - ID of the package (alternative to package object)
 * @param {boolean} [props.loading] - Loading state
 * @param {string} [props.variant] - Button variant (default: "primary")
 * @param {string} [props.size] - Button size (default: "md")
 * @param {string} [props.className] - Additional CSS classes
 * @param {Function} [props.onClick] - Custom onClick handler
 * @param {boolean} [props.directBooking] - Whether to book directly or go to booking page
 * @param {Function} [props.directBookingHandler] - Function to handle direct booking
 */
const BookingButton = ({
  eventId,
  package: pkg,
  packageId,
  loading = false,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  directBooking = false,
  directBookingHandler,
  children,
  ...rest
}) => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  
  // Get package details
  const packageObj = pkg || {};
  const price = packageObj.price ? packageObj.price : 0;
  const pkgId = packageId || packageObj._id;
  const isAvailable = packageObj.availableBookings 
    ? packageObj.availableBookings > 0 
    : true;

  const handleClick = (e) => {
    // If custom click handler is provided, use it
    if (onClick) {
      onClick(e);
      return;
    }
    
    // Check if user is logged in
    if (!userInfo) {
      toast.info('Please login to book tickets');
      navigate('/login');
      return;
    }
    
    // If package is not available, show message and return
    if (packageObj.availableBookings === 0) {
      toast.error('This package is sold out');
      return;
    }

    // Handle direct booking if enabled
    if (directBooking && directBookingHandler) {
      directBookingHandler(pkgId);
      return;
    }
    
    // Otherwise navigate to booking page with package pre-selected
    const url = pkgId
      ? `/book-tickets/${eventId}?package=${pkgId}`
      : `/book-tickets/${eventId}`;
      
    navigate(url);
  };
  
  // Determine button text
  const buttonText = () => {
    if (children) return children;
    if (loading) return 'Processing...';
    if (!isAvailable) return 'Sold Out';
    if (price) return `Book for ৳${price.toFixed(2)}`;
    return 'Book Now';
  };

  return (
    <Button
      variant={!isAvailable ? 'outline-secondary' : variant}
      size={size}
      className={`booking-button ${className}`}
      onClick={handleClick}
      disabled={loading || !isAvailable || !eventId}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner as="span" animation="border" size="sm" className="me-2" />
          Processing...
        </>
      ) : (
        <>
          <FaTicketAlt className="me-2" />
          {buttonText()}
        </>
      )}
    </Button>
  );
};

export default BookingButton;
