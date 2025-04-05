import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LogoutButton = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  
  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut();
      // Redirect to login page after sign out
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button
      variant="contained"
      color="secondary"
      onClick={handleLogout}
      disabled={loading}
      startIcon={loading ? <CircularProgress size={20} color="primary" /> : <LogoutIcon />}
      sx={{
        fontWeight: 'bold',
        borderRadius: 2,
        px: 3
      }}
    >
      {loading ? 'Signing Out' : 'Sign Out'}
    </Button>
  );
};

export default LogoutButton; 