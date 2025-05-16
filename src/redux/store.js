import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import eventReducer from './slices/eventSlice';
import categoryReducer from './slices/categorySlice';
import bookingReducer from './slices/bookingSlice';
import notificationReducer from './slices/notificationSlice';
import packageReducer from './slices/packageSlice';
import reviewReducer from './slices/reviewSlice';
import paymentReducer from './slices/paymentSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventReducer,
    categories: categoryReducer,
    bookings: bookingReducer,
    notifications: notificationReducer,
    packages: packageReducer,
    reviews: reviewReducer,
    payment: paymentReducer,
  },
});

export default store;
