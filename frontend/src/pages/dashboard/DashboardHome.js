import React from 'react';
import { Box, Typography, Grid, Paper, Icon } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import EventIcon from '@mui/icons-material/Event';

const DashboardHome = () => {
  const { currentUser } = useAuth();
  const username = currentUser?.email ? currentUser.email.split('@')[0] : 'Coach';
  
  const dashboardCards = [
    { 
      title: 'Roster', 
      icon: <PeopleIcon fontSize="large" sx={{ color: '#1a237e' }} />,
      description: 'Manage your athletes, coaches, and team members.',
      link: '/dashboard/roster'
    },
    { 
      title: 'Inventory', 
      icon: <InventoryIcon fontSize="large" sx={{ color: '#1a237e' }} />,
      description: 'Track equipment, uniforms, and supplies.',
      link: '/dashboard/inventory'
    },
    { 
      title: 'Schedule', 
      icon: <EventIcon fontSize="large" sx={{ color: '#1a237e' }} />,
      description: 'Manage meets, practices, and events.',
      link: '/dashboard/schedule'
    }
  ];
  
  return (
    <Box>
      <Typography variant="h4" color="primary" gutterBottom fontWeight="bold">
        Welcome, {username}!
      </Typography>
      
      <Typography variant="body1" paragraph>
        Select a section below to get started managing your track team.
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {dashboardCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.title}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 2,
                height: '100%',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                  '& .icon-wrapper': {
                    backgroundColor: 'secondary.main',
                    '& svg': {
                      color: 'white !important'
                    }
                  }
                }
              }}
            >
              <Box 
                className="icon-wrapper"
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(26, 35, 126, 0.1)',
                  width: 60,
                  height: 60,
                  mb: 2,
                  transition: 'background-color 0.3s ease'
                }}
              >
                {card.icon}
              </Box>
              <Typography variant="h6" color="primary" gutterBottom>
                {card.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {card.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {/* Three.js integration suggestion */}
      <Box 
        sx={{ 
          mt: 4, 
          p: 3, 
          border: '1px dashed rgba(0,0,0,0.1)', 
          borderRadius: 2,
          backgroundColor: 'rgba(0,0,0,0.02)'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          <strong>Three.js Integration Idea:</strong> A 3D running track model could be placed in the background or as a decorative element on this dashboard.
          The track could animate when user hovers over different sections, with a mustang horse model running along the track.
          This would add a dynamic, sports-themed visual element to the dashboard without being intrusive.
        </Typography>
      </Box>
    </Box>
  );
};

export default DashboardHome; 