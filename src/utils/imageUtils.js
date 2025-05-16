/**
 * Utility functions for handling images in the Event Management system
 */

// Default image path that exists in the React public folder
export const DEFAULT_PROFILE_IMAGE = '/logo192.png';
export const DEFAULT_EVENT_IMAGE = '/logo192.png';
export const DEFAULT_CATEGORY_IMAGE = '/logo192.png';

/**
 * Get profile image URL with fallback
 * @param {string} profileImage - The profile image filename or URL
 * @returns {string} - The complete image URL or fallback image
 */
export const getProfileImageUrl = (profileImage) => {
  if (!profileImage || profileImage === 'default-avatar.jpg') {
    return DEFAULT_PROFILE_IMAGE;
  }
  
  return profileImage.startsWith('http')
    ? profileImage
    : `http://localhost:5000/uploads/profiles/${profileImage}`;
};

/**
 * Get event image URL with fallback
 * @param {string} eventImage - The event image filename or URL
 * @returns {string} - The complete image URL or fallback image
 */
export const getEventImageUrl = (eventImage) => {
  if (!eventImage || eventImage === 'default-event.jpg') {
    return DEFAULT_EVENT_IMAGE;
  }
  
  return eventImage.startsWith('http')
    ? eventImage
    : `http://localhost:5000/uploads/events/${eventImage}`;
};

/**
 * Generic image error handler - attach to onError event of image elements
 * @param {Event} e - The error event
 */
export const handleImageError = (e) => {
  e.target.src = DEFAULT_PROFILE_IMAGE;
  e.target.onerror = null; // Prevent infinite error loop
};
