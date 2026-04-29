import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Placeholder Pages
import Login from './pages/auth/Login';
import CustomerHome from './pages/customer/Home';
import Cart from './pages/customer/Cart';
import Profile from './pages/customer/Profile';
import StaffDashboard from './pages/staff/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminStaff from './pages/admin/Staff';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside Layout */}
          <Route element={<Layout />}>
            {/* Customer Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerHome />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cart" 
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Cart />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            {/* Staff Routes */}
            <Route 
              path="/staff" 
              element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <StaffDashboard />
                </ProtectedRoute>
              } 
            />
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/products" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminProducts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/staff" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminStaff />
                </ProtectedRoute>
              } 
            />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
