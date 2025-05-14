import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  initPayment, 
  getPaymentHistory, 
  getPaymentDetails 
} from '../../services/paymentService';

// Initialize payment
export const initiatePayment = createAsyncThunk(
  'payment/initiate',
  async (paymentData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      // Add debugging
      console.log('Initiating payment with data:', paymentData);
      
      // Make sure we have a valid token
      if (!auth.userInfo || !auth.userInfo.token) {
        return rejectWithValue('Authentication token missing. Please log in again.');
      }
      
      const response = await initPayment(paymentData, auth.userInfo.token);
      console.log('Payment initiated successfully:', response);
      return response;
    } catch (error) {
      console.error('Payment initiation failed:', error);
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message || 'Payment initiation failed'
      );
    }
  }
);

// Get payment history
export const fetchPaymentHistory = createAsyncThunk(
  'payment/history',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await getPaymentHistory(auth.userInfo.token);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Get payment details
export const fetchPaymentDetails = createAsyncThunk(
  'payment/details',
  async (paymentId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await getPaymentDetails(paymentId, auth.userInfo.token);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const initialState = {
  loading: false,
  error: null,
  success: false,
  redirectUrl: null,
  transactionId: null,
  paymentHistory: [],
  currentPayment: null,
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    resetPaymentState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.redirectUrl = null;
      state.transactionId = null;
    },
    clearCurrentPayment: (state) => {
      state.currentPayment = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Initiate Payment
      .addCase(initiatePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initiatePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.redirectUrl = action.payload.data.redirectGatewayURL;
        state.transactionId = action.payload.data.transactionId;
      })
      .addCase(initiatePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Payment History
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentHistory = action.payload.data;
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Payment Details
      .addCase(fetchPaymentDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPayment = action.payload.data;
      })
      .addCase(fetchPaymentDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetPaymentState, clearCurrentPayment } = paymentSlice.actions;
export default paymentSlice.reducer;
