import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Get event reviews
export const getEventReviews = createAsyncThunk(
  'reviews/getEventReviews',
  async (eventId, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/events/${eventId}/reviews`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Create a review
export const createReview = createAsyncThunk(
  'reviews/createReview',
  async (reviewData, { getState, rejectWithValue }) => {
    try {
      const {
        auth: { userInfo },
      } = getState();

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(
        `http://localhost:5000/api/events/${reviewData.event}/reviews`,
        { rating: reviewData.rating, comment: reviewData.comment },
        config
      );

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Reply to a review
export const replyToReview = createAsyncThunk(
  'reviews/replyToReview',
  async ({ reviewId, comment }, { getState, rejectWithValue }) => {
    try {
      const {
        auth: { userInfo },
      } = getState();

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(
        `http://localhost:5000/api/reviews/${reviewId}/replies`,
        { comment },
        config
      );

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Like a review
export const likeReview = createAsyncThunk(
  'reviews/likeReview',
  async (reviewId, { getState, rejectWithValue }) => {
    try {
      const {
        auth: { userInfo },
      } = getState();

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(
        `http://localhost:5000/api/reviews/${reviewId}/like`,
        {},
        config
      );

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

const reviewSlice = createSlice({
  name: 'reviews',
  initialState: {
    reviews: [],
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetReviewSuccess: (state) => {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get event reviews
      .addCase(getEventReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEventReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload;
      })
      .addCase(getEventReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create review
      .addCase(createReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.reviews = [action.payload, ...state.reviews];
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Reply to review
      .addCase(replyToReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(replyToReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.reviews = [...state.reviews, action.payload];
      })
      .addCase(replyToReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Like review
      .addCase(likeReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(likeReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        
        // Update the review in state
        const updatedReviewIndex = state.reviews.findIndex(
          (r) => r._id === action.payload._id
        );
        
        if (updatedReviewIndex !== -1) {
          state.reviews[updatedReviewIndex] = action.payload;
        }
      })
      .addCase(likeReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetReviewSuccess } = reviewSlice.actions;
export default reviewSlice.reducer;
