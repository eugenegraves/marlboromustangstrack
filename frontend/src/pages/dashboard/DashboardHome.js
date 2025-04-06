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
  styled
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
import { gsap } from 'gsap';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { getEvents } from '../../services/eventService';
import InventorySummary from '../../components/InventorySummary';

// Styled components for dashboard layout
const DashboardContainer = styled(Box)(({ theme }) => ({
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
    background: 'radial-gradient(circle at top right, rgba(255,255,255,0.8) 0%, rgba(240,242,245,0.3) 70%)',
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
    height: 3,
    background: `repeating-linear-gradient(to right, ${theme.palette.secondary.main} 0px, ${theme.palette.secondary.main} 10px, transparent 10px, transparent 20px)`
  }
}));

const DashboardCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  height: '100%',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
  },
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 100%)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover:before': {
    opacity: 1,
  }
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  backgroundColor: 'rgba(28, 37, 38, 0.08)',
  width: 60,
  height: 60,
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease',
  '& svg': {
    transition: 'all 0.3s ease',
  }
}));

const EventCard = styled(Card)(({ theme, priority }) => ({
  height: '100%',
  borderRadius: theme.shape.borderRadius * 1.5,
  overflow: 'hidden',
  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
  transition: 'transform 0.3s, box-shadow 0.3s',
  border: '1px solid',
  borderColor: 'rgba(255, 193, 7, 0.2)',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-6px) scale(1.02)',
    boxShadow: '0 16px 32px rgba(0, 0, 0, 0.12)',
  },
  '&:after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '4px',
    height: '100%',
    background: priority === 'high' 
      ? theme.palette.error.main 
      : priority === 'medium' 
        ? theme.palette.warning.main 
        : theme.palette.secondary.main
  }
}));

const DashboardHome = () => {
  const { currentUser } = useAuth();
  const username = currentUser?.email ? currentUser.email.split('@')[0] : 'Coach';
  const navigate = useNavigate();
  const theme = useTheme();

  // State for upcoming events
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for animations
  const welcomeTextRef = useRef(null);
  const welcomeSubtextRef = useRef(null);
  const eventsRef = useRef(null);
  const cardRefs = useRef([]);
  const navCardRefs = useRef([]);
  
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
  
  // Animate components when they load
  useEffect(() => {
    // Set initial opacity to 1 for all elements to ensure they're visible after animation
    if (welcomeTextRef.current) {
      gsap.set(welcomeTextRef.current, { opacity: 1 });
    }
    
    if (welcomeSubtextRef.current) {
      gsap.set(welcomeSubtextRef.current, { opacity: 1 });
    }
    
    if (navCardRefs.current.length) {
      navCardRefs.current.forEach(card => {
        gsap.set(card, { opacity: 1 });
      });
    }
    
    // Initial animations
    const timeline = gsap.timeline();
    
    // Animate welcome text
    if (welcomeTextRef.current) {
      timeline.fromTo(welcomeTextRef.current, 
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', clearProps: "all" }
      );
    }
    
    // Animate welcome subtext
    if (welcomeSubtextRef.current) {
      timeline.fromTo(welcomeSubtextRef.current, 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', clearProps: "all" },
        '-=0.4'
      );
    }
    
    // Animate nav cards
    if (navCardRefs.current.length) {
      timeline.fromTo(navCardRefs.current, 
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.15, duration: 0.7, ease: 'power2.out', clearProps: "all" },
        '-=0.4'
      );
    }
    
    // Animate card icons with delayed bounce
    setTimeout(() => {
      navCardRefs.current.forEach((card, index) => {
        const iconWrapper = card.querySelector('.icon-wrapper');
        if (iconWrapper) {
          gsap.set(iconWrapper, { opacity: 1 });
          gsap.fromTo(iconWrapper, 
            { scale: 0.5, opacity: 0 },
            { 
              scale: 1, 
              opacity: 1, 
              duration: 0.6, 
              delay: index * 0.1, 
              ease: 'elastic.out(1, 0.5)',
              clearProps: "all"
            }
          );
        }
      });
    }, 1000);
  }, []);
  
  // Animate events cards when they load
  useEffect(() => {
    if (!loading && events.length > 0 && eventsRef.current) {
      // Set initial opacity to 1
      gsap.set(eventsRef.current, { opacity: 1 });
      
      if (cardRefs.current.length) {
        cardRefs.current.forEach(card => {
          if (card) gsap.set(card, { opacity: 1 });
        });
      }
      
      // Animate the events section
      gsap.fromTo(
        eventsRef.current,
        { opacity: 0, y: 40 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.7, 
          ease: 'power3.out',
          delay: 0.3,
          clearProps: "all"
        }
      );
      
      // Animate each event card with stagger effect
      gsap.fromTo(
        cardRefs.current,
        { 
          opacity: 0, 
          y: 30, 
          scale: 0.95,
          rotation: -1
        },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          rotation: 0,
          duration: 0.6, 
          stagger: 0.1,
          ease: 'back.out(1.4)',
          delay: 0.5,
          clearProps: "all"
        }
      );
    }
  }, [loading, events]);
  
  // Handle card click
  const handleCardClick = (path) => {
    // Animation before navigation
    gsap.to('.dashboard-container', {
      opacity: 0,
      y: -20,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        navigate(path);
      }
    });
  };
  
  return (
    <DashboardContainer className="dashboard-container">
      <WelcomeSection>
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant="h4" 
            color="primary" 
            gutterBottom 
            fontWeight="bold"
            ref={welcomeTextRef}
          >
            Welcome, {username}!
          </Typography>
          
          <Typography 
            variant="body1" 
            ref={welcomeSubtextRef}
            sx={{ maxWidth: '600px' }}
          >
            Select a section below to get started with your track team management system.
          </Typography>
        </Box>
      </WelcomeSection>
      
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {dashboardCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={card.title}>
            <DashboardCard
              elevation={2}
              ref={el => navCardRefs.current[index] = el}
              onClick={() => handleCardClick(card.link)}
            >
              <IconWrapper 
                className="icon-wrapper"
                sx={{ 
                  '&:hover': {
                    backgroundColor: 'rgba(255, 193, 7, 0.15)',
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
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
                              pb: 0.5
                            }}
                          >
                            {event.title}
                          </Typography>
                          <Chip 
                            label={dateBadge.label} 
                            color={dateBadge.color} 
                            size="small"
                            sx={{ fontWeight: 'bold', ml: 1 }}
                          />
                        </Box>
                        
                        <Divider sx={{ mb: 1.5 }} />
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
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
                              overflow: 'hidden'
                            }}
                          >
                            {event.location || 'No location specified'}
                          </Typography>
                        </Box>
                        
                        {event.group && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <GroupsIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              {event.group}
                            </Typography>
                          </Box>
                        )}
                        
                        {event.notes && (
                          <Box sx={{ mt: 2 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'text.secondary',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                opacity: 0.8
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
      
      <Box sx={{ mt: 5 }}>
        <InventorySummary />
      </Box>
    </DashboardContainer>
  );
};

export default DashboardHome; 