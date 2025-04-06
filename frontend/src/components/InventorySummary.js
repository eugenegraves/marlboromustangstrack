import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress, 
  Alert,
  Chip,
  Grid,
  Divider,
  Button,
  useTheme,
  styled
} from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import { getInventoryItems, getInventoryNeedingAttention } from '../services/inventoryService';
import { auth } from '../firebase';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningIcon from '@mui/icons-material/Warning';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';

// Styled components
const SummaryCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 1.5,
  overflow: 'hidden',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
  },
  position: 'relative',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  }
}));

const SectionTitle = styled(Box)(({ theme }) => ({
  display: 'flex', 
  alignItems: 'center', 
  marginBottom: theme.spacing(3),
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -8,
    left: 0,
    right: 0,
    height: 2,
    background: `repeating-linear-gradient(to right, ${theme.palette.secondary.main} 0px, ${theme.palette.secondary.main} 10px, transparent 10px, transparent 20px)`
  }
}));

const AttentionItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  background: 'rgba(255, 193, 7, 0.08)',
  border: '1px solid rgba(255, 193, 7, 0.2)',
  marginBottom: theme.spacing(1),
  transition: 'transform 0.2s, background-color 0.2s',
  '&:hover': {
    transform: 'translateX(4px)',
    background: 'rgba(255, 193, 7, 0.15)',
  }
}));

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
  
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Refs for animations
  const cardRef = useRef(null);
  const chartRef = useRef(null);
  const statsRef = useRef(null);
  const attentionRef = useRef(null);
  
  // Colors for the pie chart
  const COLORS = [
    theme.palette.success.main, 
    theme.palette.info.main, 
    theme.palette.warning.main, 
    theme.palette.grey[500]
  ];
  
  useEffect(() => {
    fetchInventoryData();
    
    // Initial animation
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 40 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.7, 
          ease: 'power3.out',
          delay: 0.6
        }
      );
    }
  }, []);
  
  useEffect(() => {
    if (inventoryData.items.length > 0) {
      calculateStats();
      
      // Animate chart and stats when data is loaded
      if (chartRef.current && statsRef.current) {
        gsap.fromTo(
          chartRef.current,
          { opacity: 0, scale: 0.9 },
          { 
            opacity: 1, 
            scale: 1, 
            duration: 0.6, 
            ease: 'back.out(1.2)',
            delay: 0.3
          }
        );
        
        gsap.fromTo(
          statsRef.current,
          { opacity: 0, x: 20 },
          { 
            opacity: 1, 
            x: 0, 
            duration: 0.5, 
            ease: 'power2.out',
            delay: 0.5
          }
        );
      }
      
      // Animate items needing attention with stagger
      if (attentionRef.current) {
        const items = attentionRef.current.querySelectorAll('.attention-item');
        if (items.length) {
          gsap.fromTo(
            items,
            { opacity: 0, x: -20 },
            { 
              opacity: 1, 
              x: 0, 
              duration: 0.4, 
              stagger: 0.1,
              ease: 'power2.out',
              delay: 0.7
            }
          );
        }
      }
    }
  }, [inventoryData.items]);
  
  const fetchInventoryData = async () => {
    try {
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
        <Box sx={{ 
          bgcolor: 'background.paper', 
          p: 1.5, 
          border: '1px solid rgba(0,0,0,0.1)', 
          borderRadius: 1,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="body2" fontWeight="bold">
            {`${payload[0].name}: ${payload[0].value} items`}
          </Typography>
        </Box>
      );
    }
    return null;
  };
  
  // Handle navigation to inventory page
  const handleViewInventory = () => {
    gsap.to(cardRef.current, {
      opacity: 0,
      y: -10,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        navigate('/dashboard/inventory');
      }
    });
  };
  
  if (inventoryData.loading) {
    return (
      <SummaryCard ref={cardRef}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={40} color="secondary" />
        </CardContent>
      </SummaryCard>
    );
  }
  
  if (!inventoryData.isAuthenticated) {
    return (
      <SummaryCard ref={cardRef}>
        <CardContent>
          <Typography variant="body1" color="text.secondary" align="center">
            Sign in to view inventory summary
          </Typography>
        </CardContent>
      </SummaryCard>
    );
  }
  
  if (inventoryData.error) {
    return (
      <SummaryCard ref={cardRef}>
        <CardContent>
          <Alert severity="error">{inventoryData.error}</Alert>
        </CardContent>
      </SummaryCard>
    );
  }
  
  return (
    <SummaryCard ref={cardRef}>
      <CardContent sx={{ p: 3 }}>
        <SectionTitle>
          <InventoryIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
          <Typography variant="h6" fontWeight="bold" color="primary">
            Inventory Summary
          </Typography>
        </SectionTitle>
        
        <Grid container spacing={3}>
          {/* Pie chart section */}
          <Grid item xs={12} md={6} ref={chartRef}>
            <Box sx={{ height: 240 }}>
              {getPieData().length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getPieData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {getPieData().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          style={{ filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))' }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      wrapperStyle={{
                        paddingLeft: '10px',
                        fontSize: '12px'
                      }}
                    />
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
            <Box ref={statsRef}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Total Items: <Chip label={stats.total} size="small" color="primary" sx={{ ml: 1, fontWeight: 'bold' }} />
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                <Chip 
                  label={`Available: ${stats.available}`} 
                  size="small" 
                  style={{ backgroundColor: COLORS[0], color: 'white' }} 
                  icon={<CheckIcon style={{ color: 'white !important' }} />}
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
              
              {/* Items needing attention */}
              <Typography 
                variant="subtitle1"
                fontWeight="bold"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  mb: 1.5
                }}
              >
                <WarningIcon sx={{ color: 'warning.main', mr: 1, fontSize: 18 }} />
                Items Needing Attention
              </Typography>
              
              <Box ref={attentionRef} sx={{ maxHeight: 150, overflow: 'auto', pr: 1 }}>
                {stats.needsAttention && stats.needsAttention.length > 0 ? (
                  stats.needsAttention.map((item, index) => (
                    <AttentionItem key={item.id} className="attention-item">
                      <Typography variant="body2" fontWeight="medium">
                        {item.name} ({item.category})
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.reason}
                      </Typography>
                    </AttentionItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No items currently need attention
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button 
            variant="outlined" 
            color="primary"
            size="small"
            onClick={handleViewInventory}
            sx={{ 
              borderRadius: 6,
              px: 2,
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }
            }}
          >
            View Full Inventory
          </Button>
        </Box>
      </CardContent>
    </SummaryCard>
  );
};

export default InventorySummary; 