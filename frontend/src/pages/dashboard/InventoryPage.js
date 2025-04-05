import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const InventoryPage = () => {
  return (
    <Box>
      <Typography variant="h4" color="primary" gutterBottom fontWeight="bold">
        Equipment Inventory
      </Typography>
      
      <Typography variant="body1" paragraph>
        Track and manage your team's equipment, uniforms, and supplies.
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
          Coming soon: Add, categorize, and manage inventory items. Track quantities, conditions,
          checkout status, and maintenance schedules for all your track equipment.
        </Typography>
      </Paper>
    </Box>
  );
};

export default InventoryPage; 