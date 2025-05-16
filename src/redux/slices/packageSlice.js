import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  packages: [],
  package: null,
  loading: false,
  success: false,
  error: null,
};

// Get all packages for an event
export const getEventPackages = createAsyncThunk(
  'packages/getEventPackages',
  async (eventId, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/packages/event/${eventId}`
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

// Get package by ID
export const getPackageById = createAsyncThunk(
  'packages/getPackageById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/packages/${id}`);
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

// Create a new package
export const createPackage = createAsyncThunk(
  'packages/createPackage',
  async (packageData, { getState, rejectWithValue }) => {
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
        'http://localhost:5000/api/packages',
        packageData,
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

// Update package
export const updatePackage = createAsyncThunk(
  'packages/updatePackage',
  async ({ id, packageData }, { getState, rejectWithValue }) => {
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
        `http://localhost:5000/api/packages/${id}`,
        packageData,
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

// Delete package
export const deletePackage = createAsyncThunk(
  'packages/deletePackage',
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

      await axios.delete(`http://localhost:5000/api/packages/${id}`, config);
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

const packageSlice = createSlice({
  name: 'packages',
  initialState,
  reducers: {
    resetPackageSuccess: (state) => {
      state.success = false;
    },
    clearPackageDetails: (state) => {
      state.package = null;
    },
    clearPackageError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all packages for an event
      .addCase(getEventPackages.pending, (state) => {
        state.loading = true;
      })
      .addCase(getEventPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.packages = action.payload;
      })
      .addCase(getEventPackages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get package by ID
      .addCase(getPackageById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getPackageById.fulfilled, (state, action) => {
        state.loading = false;
        state.package = action.payload;
      })
      .addCase(getPackageById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create package
      .addCase(createPackage.pending, (state) => {
        state.loading = true;
      })
      .addCase(createPackage.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.packages.push(action.payload);
      })
      .addCase(createPackage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update package
      .addCase(updatePackage.pending, (state) => {
        state.loading = true;
      })
      .addCase(updatePackage.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.package = action.payload;
        state.packages = state.packages.map((pkg) =>
          pkg._id === action.payload._id ? action.payload : pkg
        );
      })
      .addCase(updatePackage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete package
      .addCase(deletePackage.pending, (state) => {
        state.loading = true;
      })
      .addCase(deletePackage.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.packages = state.packages.filter(
          (pkg) => pkg._id !== action.payload
        );
      })
      .addCase(deletePackage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetPackageSuccess, clearPackageDetails, clearPackageError } =
  packageSlice.actions;
export default packageSlice.reducer;
