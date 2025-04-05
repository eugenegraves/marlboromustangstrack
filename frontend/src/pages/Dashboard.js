import React, { useEffect, useRef } from 'react';
import { Container, Box, Typography, Paper, Grid } from '@mui/material';
import { auth } from '../firebase';
import { gsap } from 'gsap';
import LogoutButton from '../components/LogoutButton';

const Dashboard = () => {
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  
  // User info
  const user = auth.currentUser;
  const email = user ? user.email : 'Coach';
  const username = email.split('@')[0];
  
  // GSAP animation
  useEffect(() => {
    // Animate title
    gsap.fromTo(
      titleRef.current, 
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
    );
    
    // Animate content
    gsap.fromTo(
      contentRef.current, 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, delay: 0.3, ease: 'power3.out' }
    );
  }, []);
  
  return (
    <Box
      sx={{
        backgroundColor: 'primary.main',
        minHeight: '100vh',
        pt: 4,
        pb: 6
      }}
    >
      <Container maxWidth="lg">
        {/* Header with welcome message */}
        <Box ref={titleRef} sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 1 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color: 'secondary.main',
              fontWeight: 'bold'
            }}
          >
            Welcome, {username}!
          </Typography>
          
          <LogoutButton />
        </Box>
        
        {/* Dashboard content */}
        <Box ref={contentRef} sx={{ opacity: 1 }}>
          <Grid container spacing={3}>
            {/* Overview card */}
            <Grid item xs={12}>
              <Paper 
                elevation={3}
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: 'white',
                    mb: 2,
                    fontWeight: 'bold'
                  }}
                >
                  Coach Dashboard
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{ color: 'white' }}
                >
                  This is your track team management dashboard. From here, you'll be able to manage athletes, 
                  track performances, schedule meets, and more. More features will be added soon!
                </Typography>
              </Paper>
            </Grid>
            
            {/* Quick stats cards */}
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={3}
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'secondary.main',
                    mb: 1,
                    fontWeight: 'bold'
                  }}
                >
                  Athletes
                </Typography>
                <Typography 
                  variant="h3"
                  sx={{ 
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  0
                </Typography>
                <Typography 
                  variant="body2"
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    mt: 1
                  }}
                >
                  Total registered athletes
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={3}
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'secondary.main',
                    mb: 1,
                    fontWeight: 'bold'
                  }}
                >
                  Upcoming Meets
                </Typography>
                <Typography 
                  variant="h3"
                  sx={{ 
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  0
                </Typography>
                <Typography 
                  variant="body2"
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    mt: 1
                  }}
                >
                  Scheduled for this season
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={3}
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'secondary.main',
                    mb: 1,
                    fontWeight: 'bold'
                  }}
                >
                  Records
                </Typography>
                <Typography 
                  variant="h3"
                  sx={{ 
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  0
                </Typography>
                <Typography 
                  variant="body2"
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    mt: 1
                  }}
                >
                  School records set this season
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard; 