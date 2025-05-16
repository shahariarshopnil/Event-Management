import React from 'react';
import { Spinner } from 'react-bootstrap';

const Loader = ({ size, variant, fullScreen }) => {
  return fullScreen ? (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255,255,255,0.8)',
        zIndex: 9999,
      }}
    >
      <Spinner
        animation="border"
        role="status"
        variant={variant}
        style={{ width: size, height: size }}
      >
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  ) : (
    <Spinner
      animation="border"
      role="status"
      variant={variant}
      style={{ width: size, height: size }}
    >
      <span className="visually-hidden">Loading...</span>
    </Spinner>
  );
};

Loader.defaultProps = {
  size: '2rem',
  variant: 'primary',
  fullScreen: false,
};

export default Loader;
