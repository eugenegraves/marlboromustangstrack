import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const MessagesPage = () => {
  return (
    <Box>
      <Typography variant="h4" color="primary" gutterBottom fontWeight="bold">
        Team Messages
      </Typography>
      
      <Typography variant="body1" paragraph>
        Communicate with your team through announcements and messages.
      </Typography>
      
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          borderRadius: 2, 
          border: '1px dashed rgba(0,0,0,0.1)',
          backgroundColor: 'rgba(0,0,0,0.02)',
          mt: 2
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Coming soon: Create and send team announcements, communicate with individual athletes,
          and manage important team updates all in one place.
        </Typography>
      </Paper>
    </Box>
  );
};

export default MessagesPage; 