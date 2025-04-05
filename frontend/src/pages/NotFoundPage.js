import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFoundPage = () => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
          py: 8,
        }}
      >
        <ErrorOutlineIcon 
          sx={{ 
            fontSize: 100, 
            color: 'primary.main',
            mb: 4
          }} 
        />
        
        <Typography 
          variant="h1" 
          component="h1" 
          sx={{ 
            fontWeight: 'bold',
            fontSize: { xs: '3rem', md: '6rem' },
            mb: 2
          }}
        >
          404
        </Typography>
        
        <Typography 
          variant="h4" 
          component="h2"
          sx={{ mb: 4 }}
        >
          Page Not Found
        </Typography>
        
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 6, 
            maxWidth: 600
          }}
        >
          The page you're looking for doesn't exist or has been moved.
          Please check the URL or navigate back to the home page.
        </Typography>
        
        <Button
          component={Link}
          to="/"
          variant="contained"
          color="primary"
          size="large"
          sx={{ 
            px: 4,
            py: 1.5,
            fontWeight: 'bold'
          }}
        >
          Back to Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage; 