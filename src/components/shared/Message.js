import React from 'react';
import { Alert } from 'react-bootstrap';

const Message = ({ variant, children, dismissible, onClose }) => {
  return (
    <Alert variant={variant} dismissible={dismissible} onClose={onClose}>
      {children}
    </Alert>
  );
};

Message.defaultProps = {
  variant: 'info',
  dismissible: false,
};

export default Message;
