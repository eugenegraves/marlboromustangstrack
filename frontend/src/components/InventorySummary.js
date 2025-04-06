import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress, 
  Alert,
  Chip,
  Grid,
  Divider 
} from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { getInventoryItems, getInventoryNeedingAttention } from '../services/inventoryService';
import { getAuth } from 'firebase/auth';

/**
 * InventorySummary - A component that displays a summary of inventory status
 * Used on the dashboard to quickly show inventory statistics
 */
const InventorySummary = () => {
  const [inventoryData, setInventoryData] = useState({
    items: [],
    loading: true,
    error: null,
    isAuthenticated: true
  });
  
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    checkedOut: 0,
    maintenance: 0,
    retired: 0,
    needsAttention: []
  });
  
  // Colors for the pie chart
  const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#9e9e9e'];
  
  useEffect(() => {
    fetchInventoryData();
  }, []);
  
  useEffect(() => {
    if (inventoryData.items.length > 0) {
      calculateStats();
    }
  }, [inventoryData.items]);
  
  const fetchInventoryData = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        setInventoryData({
          items: [],
          loading: false,
          error: null,
          isAuthenticated: false
        });
        console.log('User not authenticated, showing empty inventory summary');
        return;
      }
      
      const items = await getInventoryItems();
      const needsAttention = await getInventoryNeedingAttention();
      
      setInventoryData({
        items,
        loading: false,
        error: null
      });
      
      setStats(prevStats => ({
        ...prevStats,
        needsAttention
      }));
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      setInventoryData({
        items: [],
        loading: false,
        error: 'Failed to load inventory data',
        isAuthenticated: true
      });
    }
  };
  
  const calculateStats = () => {
    const { items } = inventoryData;
    
    // Count items by status
    const statusCounts = {
      Available: 0,
      'Checked Out': 0,
      Maintenance: 0,
      Retired: 0
    };
    
    items.forEach(item => {
      if (statusCounts.hasOwnProperty(item.status)) {
        statusCounts[item.status]++;
      }
    });
    
    setStats(prevStats => ({
      ...prevStats,
      total: items.length,
      available: statusCounts.Available,
      checkedOut: statusCounts['Checked Out'],
      maintenance: statusCounts.Maintenance,
      retired: statusCounts.Retired
    }));
  };
  
  // Prepare data for pie chart
  const getPieData = () => {
    return [
      { name: 'Available', value: stats.available },
      { name: 'Checked Out', value: stats.checkedOut },
      { name: 'Maintenance', value: stats.maintenance },
      { name: 'Retired', value: stats.retired }
    ].filter(item => item.value > 0); // Only show categories with values
  };
  
  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ bgcolor: 'background.paper', p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
          <Typography variant="body2">{`${payload[0].name}: ${payload[0].value} items`}</Typography>
        </Box>
      );
    }
    return null;
  };
  
  if (inventoryData.loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={40} />
        </CardContent>
      </Card>
    );
  }
  
  if (!inventoryData.isAuthenticated) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body1" color="text.secondary" align="center">
            Sign in to view inventory summary
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  if (inventoryData.error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{inventoryData.error}</Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Inventory Summary
        </Typography>
        
        <Grid container spacing={2}>
          {/* Pie chart section */}
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 220 }}>
              {getPieData().length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getPieData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {getPieData().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">
                    No inventory data available
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
          
          {/* Stats and items needing attention */}
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Total Items: <Chip label={stats.total} size="small" color="primary" />
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip 
                  label={`Available: ${stats.available}`} 
                  size="small" 
                  style={{ backgroundColor: COLORS[0], color: 'white' }} 
                />
                <Chip 
                  label={`Checked Out: ${stats.checkedOut}`} 
                  size="small" 
                  style={{ backgroundColor: COLORS[1], color: 'white' }} 
                />
                <Chip 
                  label={`Maintenance: ${stats.maintenance}`} 
                  size="small" 
                  style={{ backgroundColor: COLORS[2], color: 'white' }} 
                />
                <Chip 
                  label={`Retired: ${stats.retired}`} 
                  size="small" 
                  style={{ backgroundColor: COLORS[3], color: 'white' }} 
                />
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                Items Needing Attention: {stats.needsAttention.length}
              </Typography>
              
              <Box sx={{ maxHeight: 120, overflow: 'auto' }}>
                {stats.needsAttention.length > 0 ? (
                  stats.needsAttention.slice(0, 5).map((item) => (
                    <Box key={item.id} sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {item.name} ({item.condition})
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.notes?.substring(0, 60) || 'No notes'}
                        {item.notes?.length > 60 ? '...' : ''}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No items need attention
                  </Typography>
                )}
                
                {stats.needsAttention.length > 5 && (
                  <Typography variant="caption" color="primary">
                    + {stats.needsAttention.length - 5} more items
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default InventorySummary; 