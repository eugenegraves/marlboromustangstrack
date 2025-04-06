import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  CircularProgress, 
  Alert 
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import EventIcon from '@mui/icons-material/Event';
import { gsap } from 'gsap';
import { format } from 'date-fns';
import { getEvents } from '../../services/eventService';
import MustangAnimation from '../../components/MustangAnimation';
import InventorySummary from '../../components/InventorySummary';

const DashboardHome = () => {
  const { currentUser } = useAuth();
  const username = currentUser?.email ? currentUser.email.split('@')[0] : 'Coach';
  
  // State for upcoming events
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for animations
  const eventsRef = useRef(null);
  const cardRefs = useRef([]);
  
  // Dashboard navigation cards
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
  
  // Fetch all events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get all events
        const eventsData = await getEvents();
        
        // Sort by date and filter for upcoming events only
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to beginning of today
        
        const upcomingEvents = eventsData
          .filter(event => new Date(event.date) >= today)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 10); // Limit to the next 10 events
        
        setEvents(upcomingEvents);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load upcoming events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);
  
  // Format date for display
  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy, h:mm a");
  };
  
  // Animate events cards when they load
  useEffect(() => {
    if (!loading && events.length > 0 && eventsRef.current) {
      // Animate the events section
      gsap.fromTo(
        eventsRef.current,
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6, 
          ease: 'power3.out' 
        }
      );
      
      // Animate each event card with stagger effect
      gsap.fromTo(
        cardRefs.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          duration: 0.6, 
          stagger: 0.1,
          ease: 'back.out(1.2)'
        }
      );
    }
  }, [loading, events]);
  
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
      
      {/* Add MustangAnimation component above Upcoming Events */}
      <MustangAnimation containerHeight={120} />
      
      {/* Upcoming Events Section */}
      <Box 
        sx={{ mt: 5 }}
        ref={eventsRef}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 3,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: 0,
            right: 0,
            height: 3,
            background: 'repeating-linear-gradient(to right, #ffc107 0px, #ffc107 10px, transparent 10px, transparent 20px)'
          }
        }}>
          <EventIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
          <Typography variant="h5" color="primary" fontWeight="bold">
            Upcoming Events
          </Typography>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress color="secondary" />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : events.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No upcoming events scheduled
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {events.map((event, index) => (
              <Grid item xs={12} sm={6} md={4} key={event.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px) scale(1.02)',
                      boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
                    },
                    border: '1px solid',
                    borderColor: 'rgba(255, 193, 7, 0.3)',
                    position: 'relative'
                  }}
                  ref={el => cardRefs.current[index] = el}
                >
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      height: 4, 
                      bgcolor: event.type === 'Meet' ? '#cc0000' : '#1a237e'
                    }} 
                  />
                  <CardContent>
                    <Typography 
                      variant="h6" 
                      color="primary" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 'medium',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <EventIcon sx={{ mr: 1, fontSize: 20 }} />
                      {event.title}
                    </Typography>
                    
                    <Typography 
                      color="text.secondary" 
                      gutterBottom
                      sx={{ 
                        mb: 1,
                        fontSize: '0.9rem'
                      }}
                    >
                      {formatEventDate(event.date)}
                    </Typography>
                    
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <Typography 
                        variant="body2" 
                        color="primary"
                        sx={{ 
                          bgcolor: 'rgba(26, 35, 126, 0.1)',
                          py: 0.5,
                          px: 1.5,
                          borderRadius: 4,
                          display: 'inline-block',
                          fontWeight: 'medium',
                          fontSize: '0.8rem'
                        }}
                      >
                        {event.type}
                      </Typography>
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: '0.8rem' }}
                      >
                        {Array.isArray(event.group) 
                          ? (event.group.length > 1 
                              ? `${event.group[0]} + ${event.group.length - 1} more`
                              : event.group[0])
                          : event.group}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      
      {/* Inventory Summary Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Inventory Status
        </Typography>
        <InventorySummary />
      </Box>
      
      {/* Three.js integration suggestion */}
      <Box 
        sx={{ 
          mt: 6, 
          p: 3, 
          border: '1px dashed rgba(0,0,0,0.1)', 
          borderRadius: 2,
          backgroundColor: 'rgba(0,0,0,0.02)',
          position: 'relative'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          <strong>Three.js Integration Idea:</strong> A 3D running track model could be placed in the background or as a decorative element on this dashboard.
          The track could animate when user hovers over different sections, with a mustang horse model running along the track above the "Upcoming Events" section.
          This would add a dynamic, sports-themed visual element to the dashboard without being intrusive.
        </Typography>
      </Box>
    </Box>
  );
};

export default DashboardHome; 