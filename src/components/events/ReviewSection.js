import React, { useState, useEffect } from 'react';
import { Card, Button, Form, ListGroup, Row, Col, Badge } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { FaStar, FaStarHalfAlt, FaRegStar, FaUser, FaReply, FaThumbsUp } from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

// These actions would need to be created in the reviewSlice
import { 
  getEventReviews, 
  createReview, 
  likeReview, 
  replyToReview 
} from '../../redux/slices/reviewSlice';

const ReviewSection = ({ eventId }) => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const { reviews, loading, error } = useSelector((state) => state.reviews || { reviews: [] });
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'positive', 'critical'
  
  // Check if the user has attended this event (can leave a review)
  const hasAttended = userInfo?.attendedEvents?.includes(eventId);
  
  // Check if user has already reviewed
  const hasReviewed = reviews?.some(review => 
    review.user._id === userInfo?._id && !review.isReply
  );
  
  useEffect(() => {
    if (eventId) {
      dispatch(getEventReviews(eventId));
    }
  }, [dispatch, eventId]);
  
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    
    if (!userInfo) {
      toast.info('Please log in to leave a review');
      return;
    }
    
    if (!hasAttended && !userInfo.isAdmin) {
      toast.info('Only attendees can leave reviews');
      return;
    }
    
    if (hasReviewed) {
      toast.info('You have already reviewed this event');
      return;
    }
    
    if (rating < 1 || comment.trim() === '') {
      toast.error('Please provide both rating and comment');
      return;
    }
    
    dispatch(createReview({
      event: eventId,
      rating,
      comment
    }));
    
    setRating(5);
    setComment('');
  };
  
  const handleReplySubmit = (reviewId) => {
    if (!userInfo) {
      toast.info('Please log in to reply');
      return;
    }
    
    if (replyText.trim() === '') {
      toast.error('Reply cannot be empty');
      return;
    }
    
    dispatch(replyToReview({
      reviewId,
      comment: replyText
    }));
    
    setReplyText('');
    setReplyingTo(null);
    setShowReplyForm(false);
  };
  
  const handleLike = (reviewId) => {
    if (!userInfo) {
      toast.info('Please log in to like reviews');
      return;
    }
    
    dispatch(likeReview(reviewId));
  };
  
  const toggleReplyForm = (reviewId) => {
    setReplyingTo(reviewId);
    setShowReplyForm(!showReplyForm);
    setReplyText('');
  };
  
  // Calculate average rating
  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    
    const totalRating = reviews
      .filter(review => !review.isReply)
      .reduce((sum, review) => sum + review.rating, 0);
    
    return totalRating / reviews.filter(review => !review.isReply).length;
  };
  
  // Filter reviews
  const getFilteredReviews = () => {
    if (!reviews) return [];
    
    let filteredReviews = reviews.filter(review => !review.isReply);
    
    switch (filter) {
      case 'positive':
        filteredReviews = filteredReviews.filter(review => review.rating >= 4);
        break;
      case 'critical':
        filteredReviews = filteredReviews.filter(review => review.rating <= 3);
        break;
      default:
        break;
    }
    
    return filteredReviews;
  };
  
  // Find replies for a review
  const getReplies = (reviewId) => {
    return reviews?.filter(review => 
      review.isReply && review.parentReview === reviewId
    ) || [];
  };
  
  // Rating stars renderer
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full_${i}`} className="text-warning" />);
    }
    
    if (halfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-warning" />);
    }
    
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty_${i}`} className="text-warning" />);
    }
    
    return stars;
  };
  
  // Rating selector
  const RatingSelector = () => {
    return (
      <div className="star-rating mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setRating(star)}
            style={{ cursor: 'pointer', fontSize: '1.5rem' }}
          >
            {star <= rating ? (
              <FaStar className="text-warning" />
            ) : (
              <FaRegStar className="text-warning" />
            )}
          </span>
        ))}
      </div>
    );
  };
  
  const averageRating = calculateAverageRating();
  const filteredReviews = getFilteredReviews();
  
  return (
    <div>
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-white">
          <h3 className="mb-0">Reviews</h3>
        </Card.Header>
        <Card.Body>
          {/* Review Stats */}
          <Row className="mb-4 align-items-center">
            <Col md={4} className="text-center border-end">
              <h1 className="display-4 mb-0">{averageRating.toFixed(1)}</h1>
              <div className="mb-2">{renderStars(averageRating)}</div>
              <p className="text-muted mb-0">
                {reviews?.filter(r => !r.isReply).length || 0} reviews
              </p>
            </Col>
            <Col md={8}>
              <Row>
                <Col xs={12} className="mb-3">
                  <div className="d-flex gap-2">
                    <Button 
                      variant={filter === 'all' ? 'primary' : 'outline-primary'} 
                      size="sm"
                      onClick={() => setFilter('all')}
                    >
                      All Reviews
                    </Button>
                    <Button 
                      variant={filter === 'positive' ? 'success' : 'outline-success'} 
                      size="sm"
                      onClick={() => setFilter('positive')}
                    >
                      Positive (4-5 ★)
                    </Button>
                    <Button 
                      variant={filter === 'critical' ? 'warning' : 'outline-warning'} 
                      size="sm"
                      onClick={() => setFilter('critical')}
                    >
                      Critical (1-3 ★)
                    </Button>
                  </div>
                </Col>
                
                {/* Rating Distribution */}
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews?.filter(r => 
                    !r.isReply && Math.round(r.rating) === star
                  ).length || 0;
                  
                  const percentage = reviews?.filter(r => !r.isReply).length 
                    ? (count / reviews.filter(r => !r.isReply).length) * 100 
                    : 0;
                  
                  return (
                    <Col xs={12} key={star} className="mb-1">
                      <div className="d-flex align-items-center">
                        <div style={{ width: '60px' }}>
                          {star} <FaStar className="text-warning" />
                        </div>
                        <div className="flex-grow-1 mx-2">
                          <div className="progress" style={{ height: '10px' }}>
                            <div
                              className="progress-bar bg-warning"
                              role="progressbar"
                              style={{ width: `${percentage}%` }}
                              aria-valuenow={percentage}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            />
                          </div>
                        </div>
                        <div style={{ width: '30px' }}>
                          {count}
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Col>
          </Row>

          {/* Write Review Form */}
          {userInfo && !hasReviewed && (hasAttended || userInfo.isAdmin) && (
            <Card className="mb-4 bg-light border">
              <Card.Body>
                <h4 className="mb-3">Write a Review</h4>
                <Form onSubmit={handleReviewSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Your Rating</Form.Label>
                    <RatingSelector />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Your Review</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience with this event..."
                      required
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit">
                    Submit Review
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          )}

          {/* Reviews List */}
          {loading ? (
            <p>Loading reviews...</p>
          ) : error ? (
            <p className="text-danger">{error}</p>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-5">
              <h5>No reviews yet</h5>
              <p className="text-muted">Be the first to review this event!</p>
            </div>
          ) : (
            <ListGroup variant="flush">
              {filteredReviews.map((review) => (
                <ListGroup.Item key={review._id} className="py-4 px-0 border-bottom">
                  <div className="d-flex">
                    <div className="me-3">
                      {review.user.profileImage ? (
                        <img
                          src={`/uploads/profiles/${review.user.profileImage}`}
                          alt={review.user.name}
                          className="rounded-circle"
                          width="50"
                          height="50"
                        />
                      ) : (
                        <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                          <FaUser />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <h5 className="mb-0">{review.user.name}</h5>
                        <small className="text-muted">
                          {format(new Date(review.createdAt), 'MMM d, yyyy')}
                        </small>
                      </div>
                      <div className="mb-2">
                        {renderStars(review.rating)}
                        {review.user.isVerified && (
                          <Badge bg="success" className="ms-2">Verified Attendee</Badge>
                        )}
                      </div>
                      <p>{review.comment}</p>
                      <div className="d-flex gap-3 mb-3">
                        <Button 
                          variant="link" 
                          className="p-0 text-muted" 
                          onClick={() => handleLike(review._id)}
                        >
                          <FaThumbsUp className={review.likes.includes(userInfo?._id) ? 'text-primary' : ''} /> 
                          <span className="ms-1">{review.likes.length || 0}</span>
                        </Button>
                        <Button 
                          variant="link" 
                          className="p-0 text-muted" 
                          onClick={() => toggleReplyForm(review._id)}
                        >
                          <FaReply /> Reply
                        </Button>
                      </div>
                      
                      {/* Reply Form */}
                      {replyingTo === review._id && showReplyForm && (
                        <div className="mt-3 mb-3 ps-4 border-start">
                          <Form.Group className="mb-2">
                            <Form.Control
                              as="textarea"
                              rows={2}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write your reply..."
                            />
                          </Form.Group>
                          <div className="d-flex gap-2">
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => setShowReplyForm(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="primary" 
                              size="sm" 
                              onClick={() => handleReplySubmit(review._id)}
                            >
                              Submit Reply
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Replies */}
                      {getReplies(review._id).length > 0 && (
                        <div className="mt-3 ps-4 border-start">
                          {getReplies(review._id).map((reply) => (
                            <div key={reply._id} className="mb-3 pb-3 border-bottom">
                              <div className="d-flex">
                                <div className="me-2">
                                  {reply.user.profileImage ? (
                                    <img
                                      src={`/uploads/profiles/${reply.user.profileImage}`}
                                      alt={reply.user.name}
                                      className="rounded-circle"
                                      width="35"
                                      height="35"
                                    />
                                  ) : (
                                    <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }}>
                                      <FaUser size={14} />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="d-flex align-items-center mb-1">
                                    <h6 className="mb-0 me-2">{reply.user.name}</h6>
                                    {reply.user._id === review.event.organizer && (
                                      <Badge bg="primary" className="me-2">Organizer</Badge>
                                    )}
                                    <small className="text-muted">
                                      {format(new Date(reply.createdAt), 'MMM d, yyyy')}
                                    </small>
                                  </div>
                                  <p className="mb-1">{reply.comment}</p>
                                  <Button 
                                    variant="link" 
                                    className="p-0 text-muted" 
                                    onClick={() => handleLike(reply._id)}
                                  >
                                    <FaThumbsUp className={reply.likes.includes(userInfo?._id) ? 'text-primary' : ''} /> 
                                    <span className="ms-1">{reply.likes.length || 0}</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ReviewSection;
