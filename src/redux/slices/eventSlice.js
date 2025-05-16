import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  events: [],
  featuredEvents: [],
  upcomingEvents: [],
  myEvents: [],
  attendingEvents: [],
  event: null,
  loading: false,
  success: false,
  error: null,
  page: 1,
  pages: 1,
  total: 0,
};

// Get all events with filtering options
export const getEvents = createAsyncThunk(
  'events/getEvents',
  async (
    { keyword = '', category = '', date = '', maxPrice = '', status = '', pageNumber = '' },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/events?keyword=${keyword}&category=${category}&date=${date}&maxPrice=${maxPrice}&status=${status}&pageNumber=${pageNumber}`
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

// Get featured events
export const getFeaturedEvents = createAsyncThunk(
  'events/getFeaturedEvents',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/events/featured');
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

// Get upcoming events
export const getUpcomingEvents = createAsyncThunk(
  'events/getUpcomingEvents',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/events/upcoming');
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

// Get single event details
export const getEventDetails = createAsyncThunk(
  'events/getEventDetails',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/events/${id}`);
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

// Create new event
export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (eventData, { getState, rejectWithValue }) => {
    try {
      const {
        auth: { userInfo },
      } = getState();

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(
        'http://localhost:5000/api/events',
        eventData,
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

// Update an event
export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async ({ id, eventData }, { getState, rejectWithValue }) => {
    try {
      const {
        auth: { userInfo },
      } = getState();

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.put(
        `http://localhost:5000/api/events/${id}`,
        eventData,
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

// Delete an event
export const deleteEvent = createAsyncThunk(
  'events/deleteEvent',
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

      await axios.delete(`http://localhost:5000/api/events/${id}`, config);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Get user's events (for organizers)
export const getMyEvents = createAsyncThunk(
  'events/getMyEvents',
  async (pageNumber = '', { getState, rejectWithValue }) => {
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
        `http://localhost:5000/api/events/myevents?pageNumber=${pageNumber}`,
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

// Register for an event
export const registerForEvent = createAsyncThunk(
  'events/registerForEvent',
  async (id, { getState, rejectWithValue }) => {
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
        `http://localhost:5000/api/events/${id}/register`,
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

// Cancel event registration
export const cancelEventRegistration = createAsyncThunk(
  'events/cancelEventRegistration',
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

      const { data } = await axios.post(
        `http://localhost:5000/api/events/${id}/cancel`,
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

// Get events user is attending
export const getAttendingEvents = createAsyncThunk(
  'events/getAttendingEvents',
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

      const { data } = await axios.get(
        'http://localhost:5000/api/events/attending',
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

const eventSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearEventDetails: (state) => {
      state.event = null;
    },
    resetEventSuccess: (state) => {
      state.success = false;
    },
    clearEventError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all events
      .addCase(getEvents.pending, (state) => {
        state.loading = true;
      })
      .addCase(getEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.events;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
        state.total = action.payload.total;
      })
      .addCase(getEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get featured events
      .addCase(getFeaturedEvents.pending, (state) => {
        state.loading = true;
      })
      .addCase(getFeaturedEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.featuredEvents = action.payload;
      })
      .addCase(getFeaturedEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get upcoming events
      .addCase(getUpcomingEvents.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUpcomingEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.upcomingEvents = action.payload;
      })
      .addCase(getUpcomingEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get event details
      .addCase(getEventDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(getEventDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.event = action.payload;
      })
      .addCase(getEventDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create event
      .addCase(createEvent.pending, (state) => {
        state.loading = true;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update event
      .addCase(updateEvent.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.event = action.payload;
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete event
      .addCase(deleteEvent.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.myEvents = state.myEvents.filter(
          (event) => event._id !== action.payload
        );
        state.success = true;
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get my events
      .addCase(getMyEvents.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.myEvents = action.payload.events;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
        state.total = action.payload.total;
      })
      .addCase(getMyEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register for event
      .addCase(registerForEvent.pending, (state) => {
        state.loading = true;
      })
      .addCase(registerForEvent.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(registerForEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Cancel event registration
      .addCase(cancelEventRegistration.pending, (state) => {
        state.loading = true;
      })
      .addCase(cancelEventRegistration.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(cancelEventRegistration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get attending events
      .addCase(getAttendingEvents.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAttendingEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.attendingEvents = action.payload;
      })
      .addCase(getAttendingEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearEventDetails, resetEventSuccess, clearEventError } = eventSlice.actions;
export default eventSlice.reducer;
