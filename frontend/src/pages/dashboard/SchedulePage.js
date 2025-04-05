import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SchedulePage = () => {
  return (
    <Box>
      <Typography variant="h4" color="primary" gutterBottom fontWeight="bold">
        Meet Schedule
      </Typography>
      
      <Typography variant="body1" paragraph>
        Manage your team's meet schedule, practices, and important events.
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
          Coming soon: Create and manage a calendar of meets, practices, and team events.
          Track locations, transportation details, and event results all in one place.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SchedulePage; 