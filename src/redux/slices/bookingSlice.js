import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  bookings: [],
  booking: null,
  organizerBookings: [],
  loading: false,
  success: false,
  error: null,
};

// Create a new booking
export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (bookingData, { getState, rejectWithValue }) => {
    try {
      console.log('Creating booking with data:', bookingData);
      
      const {
        auth: { userInfo },
      } = getState();
      
      if (!userInfo || !userInfo.token) {
        console.error('No user token available');
        return rejectWithValue('Please log in to book this event');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      // Ensure bookingData has the correct structure
      const processedBookingData = {
        event: bookingData.event,
        package: bookingData.package,
        numberOfTickets: bookingData.numberOfTickets || 1,
        paymentMethod: bookingData.paymentMethod || 'credit_card',
        specialRequirements: bookingData.specialRequirements || '',
      };
      
      console.log('Sending booking request with data:', processedBookingData);

      const { data } = await axios.post(
        '/api/bookings',
        processedBookingData,
        config
      );
      
      console.log('Booking created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating booking:', error);
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Get user's bookings
export const getUserBookings = createAsyncThunk(
  'bookings/getUserBookings',
  async (_, { getState, rejectWithValue }) => {
    try {
      const {
        auth: { userInfo },
      } = getState();

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.get('/api/bookings', config);
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

// Get booking by ID
export const getBookingById = createAsyncThunk(
  'bookings/getBookingById',
  async (id, { getState, rejectWithValue }) => {
    try {
      const {
        auth: { userInfo },
      } = getState();

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.get(
        `/api/bookings/${id}`,
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

// Cancel booking
export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async ({ id, reason }, { getState, rejectWithValue }) => {
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

      const { data } = await axios.put(
        `/api/bookings/${id}/cancel`,
        { reason },
        config
      );
      return { id, data };
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// This function was already defined above

// Get organizer bookings
export const getOrganizerBookings = createAsyncThunk(
  'bookings/getOrganizerBookings',
  async (eventId, { getState, rejectWithValue }) => {
    try {
      const {
        auth: { userInfo },
      } = getState();

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.get(
        '/api/bookings/organizer',
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

// Update booking status (for organizers)
export const updateBookingStatus = createAsyncThunk(
  'bookings/updateBookingStatus',
  async ({ id, status }, { getState, rejectWithValue }) => {
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

      const { data } = await axios.put(
        `/api/bookings/${id}/status`,
        { status },
        config
      );
      return { id, data, status };
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Schedule appointment for booking
export const scheduleAppointment = createAsyncThunk(
  'bookings/scheduleAppointment',
  async ({ id, appointmentTime }, { getState, rejectWithValue }) => {
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

      const { data } = await axios.put(
        `/api/bookings/${id}/appointment`,
        { appointmentTime },
        config
      );
      return { id, data };
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    resetBookingSuccess: (state) => {
      state.success = false;
      state.loading = false;
    },
    clearBookingDetails: (state) => {
      state.booking = null;
    },
    clearBookingError: (state) => {
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create booking
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.booking = action.payload;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get user bookings
      .addCase(getUserBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(getUserBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get booking by ID
      .addCase(getBookingById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.booking = action.payload;
      })
      .addCase(getBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Cancel booking
      .addCase(cancelBooking.pending, (state) => {
        state.loading = true;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        if (state.booking && state.booking._id === action.payload.id) {
          state.booking.bookingStatus = 'cancelled';
        }
        state.bookings = state.bookings.map((booking) => 
          booking._id === action.payload.id 
            ? { ...booking, bookingStatus: 'cancelled' } 
            : booking
        );
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get organizer bookings
      .addCase(getOrganizerBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(getOrganizerBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.organizerBookings = action.payload;
      })
      .addCase(getOrganizerBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update booking status
      .addCase(updateBookingStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.organizerBookings = state.organizerBookings.map((booking) =>
          booking._id === action.payload.id
            ? { ...booking, bookingStatus: action.payload.status }
            : booking
        );
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Schedule appointment
      .addCase(scheduleAppointment.pending, (state) => {
        state.loading = true;
      })
      .addCase(scheduleAppointment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        if (state.booking && state.booking._id === action.payload.id) {
          state.booking.appointmentTime = action.payload.appointmentTime;
        }
      })
      .addCase(scheduleAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetBookingSuccess, clearBookingDetails, clearBookingError } =
  bookingSlice.actions;
export default bookingSlice.reducer;
