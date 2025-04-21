import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent,
  CardActionArea,
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  CircularProgress, 
  Alert,
  Chip,
  useTheme,
  Tooltip,
  styled,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { gsap } from 'gsap';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { getEvents } from '../../services/eventService';
import InventorySummary from '../../components/InventorySummary';

// Set initial opacity for styled components
const initialStyle = {
  opacity: 1
};

// Apply initial style to all styled components
const DashboardContainer = styled(Box)(({ theme }) => ({
  ...initialStyle,
  position: 'relative',
  padding: theme.spacing(2),
  overflow: 'hidden',
  minHeight: '80vh',
  maxWidth: '1200px',
  margin: '0 auto',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    background: 'radial-gradient(circle at top right, rgba(255,255,255,1) 0%, rgba(240,242,245,1) 70%)',
    zIndex: -1,
  }
}));

const WelcomeSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(4),
  position: 'relative',
  paddingBottom: theme.spacing(2),
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '2px',
    background: `linear-gradient(to right, ${theme.palette.primary.main}, transparent)`
  }
}));

const WelcomeBanner = styled(Paper)(({ theme }) => ({
  ...initialStyle,
  position: 'relative',
  padding: theme.spacing(3),
  overflow: 'hidden',
  backgroundColor: theme.palette.primary.main,
  backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  borderRadius: 16,
  marginBottom: theme.spacing(4),
  color: '#ffffff',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '30%',
    background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1))',
    transform: 'skewX(-30deg) translateX(10%)'
  }
}));

const StatCard = styled(Box)(({ theme }) => ({
  ...initialStyle,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1),
  borderRadius: 12,
  backgroundColor: 'rgba(255,255,255,0.1)',
  backdropFilter: 'blur(10px)',
  minWidth: 80,
  height: 80
}));

const SectionTitle = styled(Box)(({ theme }) => ({
  ...initialStyle,
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
    height: 3,
    background: `repeating-linear-gradient(to right, ${theme.palette.secondary.main} 0px, ${theme.palette.secondary.main} 10px, transparent 10px, transparent 20px)`
  }
}));

const DashboardCard = styled(Paper)(({ theme }) => ({
  ...initialStyle,
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  borderRadius: 16,
  transition: 'all 0.3s ease-in-out',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  cursor: 'pointer',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100px',
    height: '100px',
    background: 'radial-gradient(circle at top right, rgba(255,193,7,0.2), transparent 70%)',
    borderTopRightRadius: '16px',
    zIndex: 0
  }
}));

const IconWrapper = styled(Box)(({ theme, color }) => ({
  ...initialStyle,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  backgroundColor: 'rgba(28, 37, 38, 0.08)',
  width: 65,
  height: 65,
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(135deg, ${color || theme.palette.primary.light} 0%, transparent 80%)`,
    opacity: 0.2,
    transition: 'opacity 0.3s ease'
  },
  '&:hover::after': {
    opacity: 0.5
  },
  '& svg': {
    transition: 'all 0.3s ease',
    fontSize: 32
  }
}));

const EventCard = styled(Paper)(({ theme, priority }) => {
  // Define priority colors with improved visibility
  const priorityColors = {
    high: theme.palette.error.main,
    medium: theme.palette.warning.main,
    low: theme.palette.success.main,
    normal: theme.palette.secondary.main
  };
  
  const priorityColor = priorityColors[priority] || priorityColors.normal;
  
  return {
    ...initialStyle,
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.3s ease-in-out',
    overflow: 'hidden',
    position: 'relative',
    height: '100%',
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
    '&:after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '5px',
      height: '100%',
      background: priorityColor
    },
    '&:before': {
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      width: '100%',
      height: '5px',
      background: `linear-gradient(to right, transparent, ${priorityColor})`
    }
  };
});

const DashboardHome = () => {
  const { currentUser } = useAuth();
  const username = currentUser?.email ? currentUser.email.split('@')[0] : 'Coach';
  const navigate = useNavigate();
  const theme = useTheme();

  // State for upcoming events
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Statistics state (mock data - replace with actual data in production)
  const [stats, setStats] = useState({
    athletes: 0,
    upcomingEvents: 0,
    inventoryItems: 0
  });
  
  // Refs for animations
  const welcomeTextRef = useRef(null);
  const welcomeSubtextRef = useRef(null);
  const eventsRef = useRef(null);
  const cardRefs = useRef([]);
  const navCardRefs = useRef([]);
  const welcomeBannerRef = useRef(null);
  
  // Dashboard navigation cards
  const dashboardCards = [
    { 
      title: 'Roster', 
      icon: <PeopleIcon fontSize="large" />,
      description: 'Manage your athletes, coaches, and team members.',
      link: '/dashboard/roster',
      color: theme.palette.primary.main
    },
    { 
      title: 'Inventory', 
      icon: <InventoryIcon fontSize="large" />,
      description: 'Track equipment, uniforms, and supplies.',
      link: '/dashboard/inventory',
      color: theme.palette.secondary.main
    },
    { 
      title: 'Schedule', 
      icon: <EventIcon fontSize="large" />,
      description: 'Manage meets, practices, and events.',
      link: '/dashboard/schedule',
      color: '#4CAF50'
    }
  ];
  
  // Fetch all events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const allEvents = await getEvents();
        
        // Process events data
        const now = new Date();
        const upcomingEvents = allEvents
          .filter(event => {
            try {
              const eventDate = new Date(event.date);
              return eventDate >= now;
            } catch (err) {
              console.error("Error parsing date:", event.date, err);
              return false;
            }
          })
          .sort((a, b) => {
            try {
              return new Date(a.date) - new Date(b.date);
            } catch (err) {
              console.error("Error sorting dates:", err);
              return 0;
            }
          })
          .slice(0, 6); // Show top 6 upcoming events
          
        // Force opacity to 1 for all event cards
        upcomingEvents.forEach(event => {
          event._forceOpacity = 1;
        });
        
        setEvents(upcomingEvents);
        
        // Update statistics
        setStats(prev => ({
          ...prev,
          upcomingEvents: upcomingEvents.length
        }));
      } catch (error) {
        console.error("Error fetching events:", error);
        setError("Failed to load upcoming events. Please try again later.");
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
  
  // Get priority level for event (based on how soon it is)
  const getEventPriority = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'high';
    if (isTomorrow(date)) return 'medium';
    if (isThisWeek(date)) return 'low';
    return 'normal';
  };
  
  // Get event date badge
  const getEventDateBadge = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) return { label: 'Today', color: 'error' };
    if (isTomorrow(date)) return { label: 'Tomorrow', color: 'warning' };
    if (isThisWeek(date)) return { label: 'This Week', color: 'info' };
    return { label: format(date, 'MMM dd'), color: 'default' };
  };
  
  // Optimize animations by ensuring everything is visible first
  useEffect(() => {
    // Ensure all elements have full opacity regardless of animation state
    const elementsToEnsureVisibility = [
      welcomeTextRef.current,
      welcomeSubtextRef.current,
      welcomeBannerRef.current,
      eventsRef.current,
      ...navCardRefs.current.filter(Boolean),
      ...cardRefs.current.filter(Boolean)
    ].filter(Boolean);

    // Set all elements to be fully visible
    gsap.set(elementsToEnsureVisibility, { opacity: 1 });
    
    // Continue with animations as usual, knowing elements are visible
  }, [loading, events]);
  
  // Handle card click with improved animation
  const handleCardClick = (path) => {
    // Animation before navigation
    gsap.to('.dashboard-container', {
      y: -10,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        navigate(path);
      }
    });
  };
  
  return (
    <DashboardContainer className="dashboard-container">
      <WelcomeBanner ref={welcomeBannerRef}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Typography 
              variant="h4" 
              gutterBottom 
              fontWeight="bold"
              ref={welcomeTextRef}
            >
              Welcome, {username}!
            </Typography>
            
            <Typography 
              variant="body1" 
              ref={welcomeSubtextRef}
              sx={{ mb: 2, opacity: 0.9 }}
            >
              Track your team's progress and manage upcoming events.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<AddIcon />}
                onClick={() => navigate('/dashboard/schedule')}
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)', 
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                }}
              >
                Add Event
              </Button>
              <Button 
                variant="outlined" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/dashboard/roster')}
                sx={{ 
                  color: '#fff', 
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                View Roster
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' }, mt: { xs: 2, md: 0 } }}>
              <StatCard>
                <Typography variant="h4" fontWeight="bold">{stats.athletes}</Typography>
                <Typography variant="caption">Athletes</Typography>
              </StatCard>
              <StatCard>
                <Typography variant="h4" fontWeight="bold">{stats.upcomingEvents}</Typography>
                <Typography variant="caption">Events</Typography>
              </StatCard>
              <StatCard>
                <Typography variant="h4" fontWeight="bold">{stats.inventoryItems}</Typography>
                <Typography variant="caption">Items</Typography>
              </StatCard>
            </Box>
          </Grid>
        </Grid>
      </WelcomeBanner>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Quick Access
        </Typography>
        <Grid container spacing={3}>
          {dashboardCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={card.title}>
              <DashboardCard
                elevation={2}
                ref={el => navCardRefs.current[index] = el}
                onClick={() => handleCardClick(card.link)}
              >
                <IconWrapper 
                  className="icon-wrapper"
                  color={card.color}
                  sx={{ 
                    '&:hover': {
                      transform: 'scale(1.1) rotate(5deg)',
                    }
                  }}
                >
                  <Box sx={{ color: card.color }}>
                    {card.icon}
                  </Box>
                </IconWrapper>
                <Typography 
                  variant="h6" 
                  color="primary" 
                  gutterBottom
                  fontWeight="bold"
                >
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </DashboardCard>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      {/* Upcoming Events Section */}
      <Box 
        sx={{ mt: 8, mb: 5, position: 'relative' }}
        ref={eventsRef}
      >
        <SectionTitle>
          <EventIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
          <Typography variant="h5" color="primary" fontWeight="bold">
            Upcoming Events
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button 
            color="primary" 
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/dashboard/schedule')}
            sx={{ fontWeight: 'medium' }}
          >
            View All
          </Button>
        </SectionTitle>
        
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
          <Grid container spacing={3}>
            {events.map((event, index) => {
              const priority = getEventPriority(event.date);
              const dateBadge = getEventDateBadge(event.date);
              
              return (
                <Grid item xs={12} sm={6} md={4} key={event.id}>
                  <EventCard 
                    priority={priority}
                    ref={el => cardRefs.current[index] = el}
                  >
                    <CardActionArea 
                      onClick={() => handleCardClick('/dashboard/schedule')}
                      sx={{ height: '100%', p: 0 }}
                    >
                      <CardContent sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography 
                            variant="h6" 
                            component="div" 
                            fontWeight="bold" 
                            sx={{ 
                              color: 'primary.main',
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: 1.2,
                              pb: 0.5,
                              opacity: 1 // Ensure full opacity
                            }}
                          >
                            {event.title}
                          </Typography>
                          <Chip 
                            label={dateBadge.label} 
                            color={dateBadge.color} 
                            size="small"
                            sx={{ 
                              fontWeight: 'bold', 
                              ml: 1,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          />
                        </Box>
                        
                        <Divider sx={{ mb: 1.5 }} />
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ opacity: 1 }}
                          >
                            {formatEventDate(event.date)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOnIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              opacity: 1
                            }}
                          >
                            {event.location || 'No location specified'}
                          </Typography>
                        </Box>
                        
                        {event.group && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <GroupsIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ opacity: 1 }}
                            >
                              {event.group}
                            </Typography>
                          </Box>
                        )}
                        
                        {event.notes && (
                          <Box sx={{ 
                            mt: 2,
                            backgroundColor: 'rgba(0,0,0,0.02)',
                            borderRadius: '8px',
                            p: 1
                          }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'text.secondary',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                opacity: 1,
                                fontStyle: 'italic'
                              }}
                            >
                              {event.notes}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </CardActionArea>
                  </EventCard>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
      
      <Box sx={{ mt: 5, opacity: 1 }}>
        <SectionTitle>
          <InventoryIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
          <Typography variant="h5" color="primary" fontWeight="bold">
            Inventory Summary
          </Typography>
        </SectionTitle>
        <InventorySummary />
      </Box>
    </DashboardContainer>
  );
};

export default DashboardHome; 