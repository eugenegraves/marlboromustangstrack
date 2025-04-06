import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Snackbar,
  Stack,
  styled,
  Switch,
  FormControlLabel,
  Checkbox,
  ListItemText,
  Chip
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { gsap } from 'gsap';
import { toast } from 'react-hot-toast';

import { getEvents, createEvent, updateEvent, deleteEvent, getAthleteGroups } from '../../services/eventService';
import ScheduleTrack3D from '../../components/ScheduleTrack3D';

// Styled components
const TrackLaneBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `repeating-linear-gradient(
      to right,
      ${theme.palette.secondary.main} 0,
      ${theme.palette.secondary.main} 10px,
      transparent 10px,
      transparent 20px
    )`
  }
}));

const AddButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.primary.main,
  '&:hover': {
    backgroundColor: theme.palette.secondary.dark,
  }
}));

// Helper function to format date for input field
const formatDateForInput = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to format time for input field
const formatTimeForInput = (date) => {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const SchedulePage = () => {
  // State variables
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [show3D, setShow3D] = useState(true);
  const [open, setOpen] = useState(false);
  const [availableGroups, setAvailableGroups] = useState(['All']);
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [eventData, setEventData] = useState({
    title: '',
    date: new Date(),
    group: [],
    type: 'Practice',
  });
  
  // References for animations
  const calendarRef = useRef(null);
  const dialogRef = useRef(null);
  
  // Animate calendar when it loads
  const animateCalendar = () => {
    if (calendarRef.current) {
      // Fade in the calendar
      gsap.fromTo(
        calendarRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
      );
      
      // Animate events with stagger effect
      const eventElements = document.querySelectorAll('.fc-event');
      if (eventElements.length > 0) {
        gsap.fromTo(
          eventElements,
          { opacity: 0, scale: 0.8 },
          { 
            opacity: 1, 
            scale: 1, 
            duration: 0.4, 
            stagger: 0.05, 
            ease: 'back.out(1.7)' 
          }
        );
      }
    }
  };
  
  // Fetch events and athlete groups on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventsData, groupsData] = await Promise.all([
          getEvents(),
          getAthleteGroups()
        ]);
        
        setEvents(eventsData);
        setAvailableGroups(groupsData);
        
        // After data is loaded, animate the calendar
        setTimeout(() => {
          animateCalendar();
        }, 300);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load schedule data. Please try again.');
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Animate dialog when it opens
  useEffect(() => {
    if (open && dialogRef.current) {
      gsap.fromTo(
        dialogRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
      );
    }
  }, [open]);
  
  // Handle date click for adding a new event
  const handleDateClick = (arg) => {
    setEventData({
      title: '',
      date: arg.date,
      group: [],
      type: 'Practice',
    });
    
    setOpen(true);
  };
  
  // Handle input changes in the event form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'group') {
      setEventData({
        ...eventData,
        [name]: value
      });
    } else {
      setEventData({
        ...eventData,
        [name]: value
      });
    }
  };
  
  // Handle form submission for adding/updating an event
  const handleAddEvent = async () => {
    try {
      if (eventData.id) {
        // Update existing event
        await updateEvent(eventData.id, eventData);
      } else {
        // Create new event
        await createEvent(eventData);
      }
      
      // Close the dialog
      setOpen(false);
      
      // Reset form data
      setEventData({
        title: '',
        date: new Date(),
        group: [],
        type: 'Practice',
      });
      
      // Refresh events
      const updatedEvents = await getEvents(selectedGroup);
      
      // Format events for FullCalendar
      const formattedEvents = updatedEvents.map(event => ({
        id: event.id,
        title: event.title,
        start: event.date,
        group: event.group,
        type: event.type,
        // Apply different colors based on event type
        backgroundColor: event.type === 'Meet' ? '#cc0000' : '#1a237e',
        borderColor: '#ffc107',
        textColor: '#ffc107'
      }));
      
      setEvents(formattedEvents);
      
      toast.success(eventData.id ? 'Event updated successfully!' : 'Event added successfully!');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(error.message || 'Failed to save event. Please try again.');
    }
  };
  
  // Handle deleting an event
  const handleDeleteEvent = async () => {
    if (!eventData.id) return;
    
    try {
      await deleteEvent(eventData.id);
      
      // Close the dialog
      setOpen(false);
      
      // Reset form data
      setEventData({
        title: '',
        date: new Date(),
        group: [],
        type: 'Practice',
      });
      
      // Refresh events
      const updatedEvents = await getEvents(selectedGroup);
      
      // Format events for FullCalendar
      const formattedEvents = updatedEvents.map(event => ({
        id: event.id,
        title: event.title,
        start: event.date,
        group: event.group,
        type: event.type,
        // Apply different colors based on event type
        backgroundColor: event.type === 'Meet' ? '#cc0000' : '#1a237e',
        borderColor: '#ffc107',
        textColor: '#ffc107'
      }));
      
      setEvents(formattedEvents);
      
      toast.success('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(error.message || 'Failed to delete event. Please try again.');
    }
  };
  
  // Toggle 3D visualization
  const handle3DToggle = (event) => {
    setShow3D(event.target.checked);
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
    setError('');
    setSuccessMessage('');
  };
  
  // Fetch events when the component mounts
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get available groups for filtering
        const groups = await getAthleteGroups();
        setAvailableGroups(groups);
        
        // Get events filtered by the selected group
        const fetchedEvents = await getEvents(selectedGroup);
        
        // Format events for FullCalendar
        const formattedEvents = fetchedEvents.map(event => ({
          id: event.id,
          title: event.title,
          start: event.date,
          group: event.group,
          type: event.type,
          // Apply different colors based on event type
          backgroundColor: event.type === 'Meet' ? '#cc0000' : '#1a237e',
          borderColor: '#ffc107',
          textColor: '#ffc107'
        }));
        
        setEvents(formattedEvents);
      } catch (err) {
        console.error('Error loading events:', err);
        setError('Failed to load events. Please refresh the page and try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadEvents();
  }, [selectedGroup]); // Re-fetch when selected group changes
  
  // Handle clicking an event on the calendar
  const handleEventClick = (info) => {
    const { id, title, start, extendedProps } = info.event;
    
    setEventData({
      id,
      title,
      date: start,
      group: Array.isArray(extendedProps.group) ? extendedProps.group : [extendedProps.group],
      type: extendedProps.type
    });
    
    setOpen(true);
  };
  
  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      {/* 3D Track visualization - shown conditionally */}
      {show3D && <ScheduleTrack3D />}
      
      <Container maxWidth="xl">
        <Stack 
          direction="row" 
          alignItems="center" 
          justifyContent="space-between" 
          mb={5}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Team Schedule
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Manage practices, meets, and other team events
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
              control={
                <Switch 
                  checked={show3D} 
                  onChange={handle3DToggle} 
                  color="secondary"
                />
              }
              label="Show 3D Track"
            />
            
            <AddButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
            >
              Add Event
            </AddButton>
          </Stack>
        </Stack>
        
        <TrackLaneBox 
          component={Card} 
          sx={{ 
            p: 3, 
            height: 'calc(100vh - 200px)',
            minHeight: 600,
            backgroundColor: 'white',
            position: 'relative'
          }}
        >
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%' 
            }}>
              <CircularProgress sx={{ color: 'secondary.main' }} />
            </Box>
          ) : (
            <Box 
              ref={calendarRef} 
              sx={{ 
                height: '100%',
                opacity: 0, // Start with opacity 0 for animation
                '& .fc': {
                  fontFamily: 'inherit',
                  '--fc-border-color': 'rgba(0,0,0,0.1)',
                  '--fc-event-border-color': '#ffc107',
                  '--fc-button-text-color': '#1a237e',
                  '--fc-button-bg-color': '#f5f5f5',
                  '--fc-button-border-color': '#ddd',
                  '--fc-button-hover-bg-color': '#e6e6e6',
                  '--fc-button-hover-border-color': '#ddd',
                  '--fc-button-active-bg-color': '#ffc107',
                  '--fc-button-active-border-color': '#ffc107',
                },
                '& .fc-toolbar-title': {
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#1a237e'
                },
                '& .fc-event': {
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    border: '2px solid #ffc107 !important'
                  }
                },
                '& .fc-header-toolbar': {
                  mb: 3,
                  flexWrap: 'wrap',
                  gap: 1,
                }
              }}
            >
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={events}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                height="100%"
                eventTimeFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  meridiem: 'short'
                }}
                eventDisplay="block"
                nowIndicator={true}
                dayMaxEvents={true}
              />
            </Box>
          )}
        </TrackLaneBox>
      </Container>
      
      {/* Add/Edit Event Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {eventData.id ? 'Edit Event' : 'Add Event'}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <TextField
              autoFocus
              name="title"
              label="Event Title"
              type="text"
              fullWidth
              value={eventData.title}
              onChange={handleInputChange}
              required
            />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Event Date and Time"
                value={eventData.date}
                onChange={(newDate) => {
                  setEventData({
                    ...eventData,
                    date: newDate
                  });
                }}
                slotProps={{ 
                  textField: { 
                    required: true,
                    fullWidth: true
                  } 
                }}
              />
            </LocalizationProvider>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel id="group-label">Group(s)</InputLabel>
            <Select
              labelId="group-label"
              id="group"
              name="group"
              multiple
              value={eventData.group}
              onChange={handleInputChange}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
              label="Group(s)"
              required
            >
              {availableGroups.slice(1).map((group) => (
                <MenuItem key={group} value={group}>
                  <Checkbox checked={eventData.group.indexOf(group) > -1} />
                  <ListItemText primary={group} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel id="type-label">Event Type</InputLabel>
            <Select
              labelId="type-label"
              id="type"
              name="type"
              value={eventData.type}
              onChange={handleInputChange}
              label="Event Type"
              required
            >
              <MenuItem value="Practice">Practice</MenuItem>
              <MenuItem value="Meet">Meet</MenuItem>
              <MenuItem value="Team Event">Team Event</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          {eventData.id && (
            <Button 
              onClick={handleDeleteEvent} 
              color="error"
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          )}
          <Button onClick={() => setOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleAddEvent} 
            variant="contained" 
            color="primary"
            disabled={!eventData.title || !eventData.date || eventData.group.length === 0 || !eventData.type}
          >
            {eventData.id ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for messages */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SchedulePage; 