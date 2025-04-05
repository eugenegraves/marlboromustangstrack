import React from 'react';
import { ThemeProvider, CssBaseline, Box, Typography, Container, Button } from '@mui/material';
import theme from './styles/theme';
import { gsap } from 'gsap';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UploadDemo from './pages/UploadDemo';
// We'll use Three.js in future components

function HomePage() {
  // Reference for GSAP animation
  const titleRef = React.useRef(null);

  React.useEffect(() => {
    // Simple GSAP animation for the title
    gsap.from(titleRef.current, {
      y: -50,
      opacity: 0,
      duration: 1.5,
      ease: 'power3.out'
    });
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
          }}
        >
          Track Team App
        </Typography>
        <Typography
          variant="h5"
          align="center"
          sx={{
            color: 'background.paper',
            mb: 2,
          }}
        >
          Coming Soon
        </Typography>
        <Box
          sx={{
            textAlign: 'center',
            my: 4,
          }}
        >
          {/* Logo placeholder - will be replaced with actual team logo */}
          <Box
            sx={{
              width: 200,
              height: 200,
              backgroundColor: 'secondary.main',
              borderRadius: '50%',
              margin: '0 auto',
              border: '4px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: 'primary.main',
                fontWeight: 'bold',
              }}
            >
              LOGO
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button 
            component={Link} 
            to="/upload-demo" 
            variant="contained" 
            color="secondary"
            sx={{ fontWeight: 'bold' }}
          >
            Try Upload Demo
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/upload-demo" element={<UploadDemo />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
