import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';
import './App.css';

// Layouts
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import MyEventsPage from './pages/MyEventsPage';
import MyBookingsPage from './pages/MyBookingsPage';
import BookingDetailsPage from './pages/BookingDetailsPage';
import SimpleTicketBookingPage from './pages/SimpleTicketBookingPage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryPage from './pages/CategoryPage';
import NotificationsPage from './pages/NotificationsPage';
import NotFoundPage from './pages/NotFoundPage';

// Payment Pages
import CheckoutPage from './components/payment/CheckoutPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailedPage from './pages/PaymentFailedPage';
import BookingSuccess from './pages/BookingSuccess';

// Protected Route Component
import ProtectedRoute from './components/routing/ProtectedRoute';
import OrganizerRoute from './components/routing/OrganizerRoute';
import AdminRoute from './components/routing/AdminRoute';

function App() {
  // Get user info from Redux store
  const { userInfo } = useSelector((state) => state.auth);
  
  // Determine user role for conditional UI
  const userRole = userInfo ? userInfo.role : 'guest';
  const isOrganizer = userRole === 'organizer' || userRole === 'admin';
  
  return (
    <div className={`App d-flex flex-column min-vh-100 ${isOrganizer ? 'organizer-view' : 'attendee-view'}`}>
      <Header />
      <main className="flex-grow-1 py-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/categories/:id" element={<CategoryPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes */}
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
            <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetailsPage /></ProtectedRoute>} />
            <Route path="/book-tickets/:id" element={<ProtectedRoute><SimpleTicketBookingPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            
            {/* Payment Routes */}
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/payment-failed" element={<PaymentFailedPage />} />
            <Route path="/payment-cancelled" element={<PaymentFailedPage />} />
            <Route path="/booking-success/:bookingId" element={<ProtectedRoute><BookingSuccess /></ProtectedRoute>} />
            
            {/* Organizer Routes */}
            <Route path="/events/create" element={<OrganizerRoute><CreateEventPage /></OrganizerRoute>} />
            <Route path="/events/edit/:id" element={<OrganizerRoute><EditEventPage /></OrganizerRoute>} />
            <Route path="/myevents" element={<OrganizerRoute><MyEventsPage /></OrganizerRoute>} />
            
            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      </div>
  );
}

export default App;
