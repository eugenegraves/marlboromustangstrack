import React from 'react';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import { Toaster } from 'react-hot-toast';

// Layouts
import DashboardLayout from './components/DashboardLayout';

// Pages
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFoundPage from './pages/NotFoundPage';
import UploadDemo from './pages/UploadDemo';

// Dashboard Pages
import DashboardHome from './pages/dashboard/DashboardHome';
import RosterPage from './pages/dashboard/RosterPage';
import InventoryPage from './pages/dashboard/InventoryPage';
import SchedulePage from './pages/dashboard/SchedulePage';
import MessagesPage from './pages/dashboard/MessagesPage';

// Create theme directly in App.js
const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e', // Navy blue
    },
    secondary: {
      main: '#ffc107', // Yellow
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/upload-demo" element={<UploadDemo />} />
            
            {/* Dashboard routes - all protected and using the dashboard layout */}
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <DashboardLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="roster" element={<RosterPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="messages" element={<MessagesPage />} />
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
        
        {/* Toast notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              borderRadius: '8px',
              padding: '12px 20px',
            },
            success: {
              style: {
                background: '#1a237e',
                color: '#fff',
              },
              iconTheme: {
                primary: '#ffc107',
                secondary: '#1a237e',
              },
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
