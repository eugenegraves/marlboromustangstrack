import React, { useState } from 'react';
import { Box, Toolbar, Paper } from '@mui/material';
import { Outlet } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import Sidebar from './Sidebar';
import TrackBackground from './TrackBackground';

const drawerWidth = 240;

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Three.js Track Background */}
      <TrackBackground />
      
      {/* Header */}
      <DashboardHeader toggleSidebar={handleDrawerToggle} />
      
      {/* Sidebar */}
      <Sidebar open={mobileOpen} onClose={handleDrawerToggle} />
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Toolbar /> {/* Adds spacing below fixed app bar */}
        <Paper
          elevation={2}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            bgcolor: 'white',
            flexGrow: 1,
            mb: 2,
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            // Track-inspired border - yellow dashed line
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '4px',
              background: `repeating-linear-gradient(
                to right,
                ${theme => theme.palette.secondary.main} 0,
                ${theme => theme.palette.secondary.main} 10px,
                transparent 10px,
                transparent 20px
              )`
            }
          }}
        >
          {/* Render nested routes */}
          <Outlet />
        </Paper>
        
        {/* Footer */}
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 2, 
            opacity: 0.6,
            fontSize: '0.8rem'
          }}
        >
          &copy; {new Date().getFullYear()} Mustangs Track Team • All Rights Reserved
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout; 