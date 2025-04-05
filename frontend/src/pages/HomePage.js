import React, { useRef, useEffect } from 'react';
import { Box, Typography, Container, Button, Stack } from '@mui/material';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useAuth } from '../contexts/AuthContext';
import Logo3D from '../components/Logo3D';

const HomePage = () => {
  const titleRef = useRef(null);
  const logoRef = useRef(null);
  const buttonsRef = useRef(null);
  
  const { isAuthenticated } = useAuth();
  
  // GSAP animations
  useEffect(() => {
    // Animate the title
    gsap.fromTo(
      titleRef.current, 
      { y: -50, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1.5, ease: 'power3.out' }
    );
    
    // Animate the logo container
    gsap.fromTo(
      logoRef.current, 
      { scale: 0.8, opacity: 0 }, 
      { scale: 1, opacity: 1, duration: 1.2, delay: 0.3, ease: 'back.out(1.7)' }
    );
    
    // Animate the buttons
    gsap.fromTo(
      buttonsRef.current, 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1, delay: 0.6, ease: 'power3.out' }
    );
  }, []);
  
  return (
    <Box
      sx={{
        backgroundColor: 'primary.main',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Container maxWidth="md">
        <Typography
          ref={titleRef}
          variant="h2"
          component="h1"
          align="center"
          sx={{
            color: 'secondary.main',
            fontWeight: 'bold',
            mb: 4,
            opacity: 1
          }}
        >
          Mustangs Track Team
        </Typography>
        
        <Box
          ref={logoRef}
          sx={{
            textAlign: 'center',
            my: 4,
            opacity: 1,
            height: 250,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Logo3D width={250} height={250} />
        </Box>
        
        <Typography
          variant="h5"
          align="center"
          sx={{
            color: 'white',
            mb: 4,
            maxWidth: '700px',
            mx: 'auto'
          }}
        >
          Welcome to the official Mustangs Track Team Management System. 
          Track athlete performance, manage meets, and more.
        </Typography>
        
        <Stack
          ref={buttonsRef}
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          sx={{ mt: 4, opacity: 1 }}
        >
          {isAuthenticated ? (
            <Button 
              component={Link} 
              to="/dashboard" 
              variant="contained" 
              color="secondary"
              size="large"
              sx={{ 
                fontWeight: 'bold',
                px: 4,
                py: 1.5,
                borderRadius: 2
              }}
            >
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button 
                component={Link} 
                to="/login" 
                variant="contained" 
                color="secondary"
                size="large"
                sx={{ 
                  fontWeight: 'bold',
                  px: 4,
                  py: 1.5,
                  borderRadius: 2
                }}
              >
                Coach Login
              </Button>
              
              <Button 
                component={Link} 
                to="/register" 
                variant="outlined" 
                color="secondary"
                size="large"
                sx={{ 
                  fontWeight: 'bold',
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2
                  }
                }}
              >
                Register
              </Button>
            </>
          )}
          
          <Button 
            component={Link} 
            to="/upload-demo" 
            variant="outlined" 
            color="secondary"
            size="large"
            sx={{ 
              fontWeight: 'bold',
              px: 4,
              py: 1.5,
              borderRadius: 2,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2
              }
            }}
          >
            Try Upload Demo
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};

export default HomePage; 