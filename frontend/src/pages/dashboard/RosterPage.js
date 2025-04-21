import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  MenuItem, 
  IconButton, 
  CircularProgress, 
  Alert,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControlLabel,
  Switch,
  Chip
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EventIcon from '@mui/icons-material/Event';
import { useAuth } from '../../contexts/AuthContext';
import { gsap } from 'gsap';
import { format } from 'date-fns';
import { 
  getAthletes, 
  createAthlete, 
  updateAthlete, 
  deleteAthlete 
} from '../../services/athleteService';
import { getEvents } from '../../services/eventService';
import { getAthleteInventory } from '../../services/inventoryService';

// Constants for athlete groups
const ATHLETE_GROUPS = [
  'Beginner Sprinters',
  'Intermediate Sprinters',
  'Elite Sprinters',
  'Beginner Distance',
  'Intermediate Distance',
  'Elite Distance',
  'Beginner Throwers',
  'Intermediate Throwers',
  'Elite Throwers',
  'Beginner Jumpers',
  'Intermediate Jumpers',
  'Elite Jumpers'
];

const RosterPage = () => {
  const { currentUser } = useAuth();
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    group: '',
    uniformID: ''
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState(null);
  
  // New state for athlete inventory
  const [athleteInventory, setAthleteInventory] = useState({});
  
  // New state for events
  const [groupEvents, setGroupEvents] = useState({});
  const [eventsLoading, setEventsLoading] = useState({});
  const [eventsError, setEventsError] = useState({});
  const [expandedGroup, setExpandedGroup] = useState(false);
  
  // Add a state to control showing past events
  const [showPastEvents, setShowPastEvents] = useState(false);
  
  const tableRef = useRef(null);
  const dialogRef = useRef(null);
  const accordionRefs = useRef({});
  
  // Fetch athletes on component mount
  useEffect(() => {
    fetchAthletes();
  }, []);
  
  // Fetch inventory items when athletes change
  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const inventoryData = {};
        for (const athlete of athletes || []) {
          if (athlete.id) {
            const items = await getAthleteInventory(athlete.id);
            inventoryData[athlete.id] = items;
          }
        }
        setAthleteInventory(inventoryData);
      } catch (error) {
        console.error('Error fetching inventory items:', error);
      }
    };
    
    fetchInventoryItems();
  }, [athletes]);
  
  // Extract unique groups from athletes and fetch events for each group
  useEffect(() => {
    if (athletes.length > 0) {
      // Get unique groups
      const uniqueGroups = [...new Set(athletes.map(athlete => athlete.group))];
      
      // For each unique group, fetch events
      uniqueGroups.forEach(group => {
        if (group) { // Check if group is defined
          fetchEventsForGroup(group);
        }
      });
    }
  }, [athletes]);
  
  // GSAP animation for table
  useEffect(() => {
    if (!loading && tableRef.current) {
      // Animate the table rows with a stagger effect
      gsap.fromTo(
        '.MuiDataGrid-row',
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.5, 
          stagger: 0.05,
          ease: 'power3.out',
          delay: 0.3
        }
      );
    }
  }, [loading, athletes]);
  
  // GSAP animation for dialog
  useEffect(() => {
    if (openDialog && dialogRef.current) {
      // Animate the dialog when it opens
      gsap.fromTo(
        dialogRef.current,
        { y: -50, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.4, 
          ease: 'power3.out'
        }
      );
    }
  }, [openDialog]);
  
  // Animate accordion when expanded
  useEffect(() => {
    if (expandedGroup && accordionRefs.current[expandedGroup]) {
      // Get all list items within the expanded accordion
      const accordionEl = accordionRefs.current[expandedGroup];
      if (!accordionEl) {
        console.warn(`No accordion reference found for group: ${expandedGroup}`);
        return;
      }
      
      const listItems = accordionEl.querySelectorAll('.event-list-item');
      if (listItems.length === 0) {
        console.log(`No event list items found for group: ${expandedGroup}`);
        return;
      }
      
      // Animate list items with stagger effect
      gsap.fromTo(
        listItems,
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.4, 
          stagger: 0.1,
          ease: 'power2.out'
        }
      );
    }
  }, [expandedGroup, groupEvents]);
  
  // Fetch events for a specific group
  const fetchEventsForGroup = async (group) => {
    if (!group) {
      console.warn('Attempted to fetch events for undefined or empty group');
      return;
    }
    
    setEventsLoading(prev => ({ ...prev, [group]: true }));
    setEventsError(prev => ({ ...prev, [group]: null }));
    
    try {
      console.log(`Fetching events for group: "${group}"`);
      const events = await getEvents(group);
      console.log(`Received ${events.length} events for group "${group}"`);
      
      if (events.length > 0) {
        // Check the structure of the first event to help debug
        const firstEvent = events[0];
        console.log('First event structure:', {
          id: firstEvent.id,
          title: firstEvent.title,
          date: firstEvent.date,
          dateType: typeof firstEvent.date,
          isDate: firstEvent.date instanceof Date,
          dateToString: firstEvent.date?.toString?.() || 'N/A',
          dateTime: firstEvent.date?.getTime?.() || 'N/A',
          group: firstEvent.group,
          displayGroups: firstEvent.displayGroups
        });
      }
      
      // Fix any date issues before sorting
      const eventsWithFixedDates = events.map(event => {
        if (!(event.date instanceof Date) || isNaN(event.date.getTime())) {
          console.warn(`Event ${event.id} has invalid date:`, event.date);
          // Try to fix it
          if (typeof event.date === 'object' && event.date?.seconds) {
            event.date = new Date(event.date.seconds * 1000);
          } else if (typeof event.date === 'string' || typeof event.date === 'number') {
            event.date = new Date(event.date);
          } else {
            // Fallback - use current date
            event.date = new Date();
          }
        }
        return event;
      });
      
      // Sort events by date (closest date first)
      const sortedEvents = eventsWithFixedDates.sort((a, b) => a.date - b.date);
      
      // Calculate today's date for filtering upcoming events
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to beginning of today
      console.log('Today\'s date for filtering:', today.toString(), today.getTime());
      
      // Filter for upcoming events
      const upcomingEvents = sortedEvents.filter(event => {
        // Force event.date to be a Date object
        const eventDate = new Date(event.date);
        // Log detailed info for debugging
        console.log(`Event "${event.title}":`, {
          rawDate: event.date,
          dateObj: eventDate,
          dateTime: eventDate.getTime(),
          todayTime: today.getTime(),
          isUpcoming: eventDate.getTime() >= today.getTime(),
          difference: eventDate.getTime() - today.getTime()
        });
        return eventDate.getTime() >= today.getTime();
      });
      
      console.log(`Found ${upcomingEvents.length} upcoming events out of ${sortedEvents.length} total events for group "${group}"`);
      
      // Set the events to display based on the showPastEvents state
      const displayEvents = showPastEvents ? sortedEvents : upcomingEvents;
      
      console.log(`Using ${displayEvents.length} events for display (showPastEvents: ${showPastEvents})`);
      setGroupEvents(prev => ({ ...prev, [group]: displayEvents }));
    } catch (error) {
      console.error(`Error fetching events for group "${group}":`, error);
      setEventsError(prev => ({ 
        ...prev, 
        [group]: `Failed to load events for this group: ${error.message}` 
      }));
    } finally {
      setEventsLoading(prev => ({ ...prev, [group]: false }));
    }
  };
  
  // Debug function to show events data structure
  const debugEventsData = (group) => {
    console.log(`=== DEBUG EVENTS FOR "${group}" ===`);
    console.log('Events loading state:', eventsLoading[group]);
    console.log('Events error state:', eventsError[group]);
    console.log('Events data:', groupEvents[group]);
    if (groupEvents[group]) {
      const firstEvent = groupEvents[group][0];
      if (firstEvent) {
        console.log('First event structure:', {
          id: firstEvent.id,
          title: firstEvent.title,
          date: firstEvent.date,
          group: firstEvent.group,
          displayGroups: firstEvent.displayGroups
        });
      }
    }
    console.log('==============================');
  };
  
  // Enhanced handleAccordionChange with debugging
  const handleAccordionChange = (group) => (event, isExpanded) => {
    if (isExpanded) {
      // Debug when expanding
      debugEventsData(group);
      
      // If we have an error or no events yet, retry fetching
      if (eventsError[group] || !groupEvents[group]) {
        console.log(`Retrying fetch for group "${group}" on expand`);
        fetchEventsForGroup(group);
      }
    }
    
    setExpandedGroup(isExpanded ? group : false);
  };
  
  // Format date for display
  const formatEventDate = (dateInput) => {
    try {
      // If it's already a Date object, use it directly
      let date;
      
      if (dateInput instanceof Date) {
        date = dateInput;
      } else {
        date = new Date(dateInput);
      }
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateInput);
        return 'Invalid date';
      }
      
      const formattedDate = format(date, "MMM dd, yyyy, h:mm a");
      return formattedDate;
    } catch (error) {
      console.error('Error formatting date:', dateInput, error);
      return String(dateInput);
    }
  };
  
  // Fetch athletes from API
  const fetchAthletes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching athletes from Firestore...');
      const data = await getAthletes();
      console.log('Athletes data received:', data);
      setAthletes(data || []); // Ensure we always set an array, even if data is null/undefined
      
      // Refresh inventory data when athletes change
      const inventoryData = {};
      for (const athlete of data || []) {
        try {
          if (athlete.id) {
            const items = await getAthleteInventory(athlete.id);
            inventoryData[athlete.id] = items;
          }
        } catch (error) {
          console.error(`Error fetching inventory for athlete ${athlete.id}:`, error);
        }
      }
      setAthleteInventory(inventoryData);
    } catch (error) {
      console.error('Error fetching athletes:', error);
      setError('Failed to load athletes. Please try again.');
      // Set empty array instead of null if there's an error
      setAthletes([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle dialog open for adding
  const handleAddClick = () => {
    setFormMode('add');
    setFormValues({
      name: '',
      group: '',
      uniformID: ''
    });
    setOpenDialog(true);
  };
  
  // Handle dialog open for editing
  const handleEditClick = (athlete) => {
    setFormMode('edit');
    setSelectedAthlete(athlete);
    setFormValues({
      name: athlete.name,
      group: athlete.group,
      uniformID: athlete.uniformID || ''
    });
    setOpenDialog(true);
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setOpenDialog(false);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    setError(null);
    
    try {
      if (formMode === 'add') {
        // Add new athlete
        await createAthlete(formValues);
      } else {
        // Update existing athlete
        await updateAthlete(selectedAthlete.id, formValues);
      }
      
      // Refresh athletes list
      fetchAthletes();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving athlete:', error);
      setError('Failed to save athlete. Please try again.');
    }
  };
  
  // Handle athlete deletion confirmation
  const handleDeleteClick = (athlete) => {
    setAthleteToDelete(athlete);
    setDeleteConfirmOpen(true);
  };
  
  // Handle athlete deletion
  const handleDeleteConfirm = async () => {
    setError(null);
    
    try {
      await deleteAthlete(athleteToDelete.id);
      
      // Refresh athletes list
      fetchAthletes();
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Error deleting athlete:', error);
      setError('Failed to delete athlete. Please try again.');
    }
  };
  
  // DataGrid columns configuration
  const columns = [
    { 
      field: 'name', 
      headerName: 'ATHLETE NAME', 
      flex: 1, 
      minWidth: 150,
      headerAlign: 'left',
      headerClassName: 'super-app-theme--header'
    },
    { 
      field: 'group', 
      headerName: 'TRAINING GROUP', 
      flex: 1, 
      minWidth: 150,
      headerAlign: 'left',
      headerClassName: 'super-app-theme--header'
    },
    { 
      field: 'uniformID', 
      headerName: 'ASSIGNED EQUIPMENT', 
      flex: 1, 
      minWidth: 180,
      headerAlign: 'left',
      headerClassName: 'super-app-theme--header',
      renderCell: (params) => {
        const athleteId = params.row.id;
        const items = athleteInventory[athleteId] || [];
        
        if (items.length === 0) {
          return <span>None</span>;
        }
        
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%' }}>
            {items.map((item, index) => (
              <Chip 
                key={item.id}
                label={`${item.name || item.itemId}${item.type ? ` (${item.type})` : ''}`}
                size="small"
                color={item.type === 'Singlet' || item.type === 'Shorts' ? 'secondary' : 'primary'}
                sx={{ 
                  mb: 0.5, 
                  maxWidth: '100%',
                  '& .MuiChip-label': { 
                    whiteSpace: 'normal',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }
                }}
              />
            ))}
          </Box>
        );
      }
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'ACTIONS',
      width: 100,
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header',
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleEditClick(params.row)}
          color="primary"
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDeleteClick(params.row)}
          color="error"
        />
      ]
    }
  ];
  
  // Update events display when showPastEvents changes
  useEffect(() => {
    if (expandedGroup) {
      // Just refetch the current expanded group when the filter changes
      fetchEventsForGroup(expandedGroup);
    }
  }, [showPastEvents, expandedGroup]);
  
  // Add a visual indicator for past events in the list item
  const isPastEvent = (date) => {
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  };
  
  // Handle DataGrid resizing issues in production
  useEffect(() => {
    const handleWindowResize = () => {
      // Force re-render of DataGrid on window resize
      if (tableRef.current) {
        const gridElement = tableRef.current.querySelector('.MuiDataGrid-root');
        if (gridElement) {
          // Apply height explicitly to ensure proper rendering
          gridElement.style.height = 'auto';
          gridElement.style.minHeight = '400px';
          
          // Fix width issues in production build
          gridElement.style.width = '100%';
          gridElement.style.minWidth = '0';
          
          // Fix parent container issues
          const parentContainer = tableRef.current;
          if (parentContainer) {
            parentContainer.style.minWidth = '0';
            parentContainer.style.width = '100%';
            parentContainer.style.maxWidth = '100%';
            parentContainer.style.overflow = 'hidden';
          }
          
          // Apply fixes to the inner virtual scroller
          const virtualScroller = gridElement.querySelector('.MuiDataGrid-virtualScroller');
          if (virtualScroller) {
            virtualScroller.style.width = '100%';
            virtualScroller.style.minWidth = '0';
          }
          
          // Fix column headers
          const columnHeaders = gridElement.querySelector('.MuiDataGrid-columnHeaders');
          if (columnHeaders) {
            columnHeaders.style.width = '100%';
            columnHeaders.style.minWidth = '0';
          }
        }
      }
      
      // Dispatch a resize event after a short delay to ensure DataGrid recalculates dimensions
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    };
    
    // Initial call
    handleWindowResize();
    
    // Call again after a short delay to ensure everything has rendered
    const timeoutId = setTimeout(handleWindowResize, 500);
    
    // Set up event listener
    window.addEventListener('resize', handleWindowResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleWindowResize);
      clearTimeout(timeoutId);
    };
  }, [athletes, loading]); // Re-apply when athletes change or loading state changes
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="primary" gutterBottom fontWeight="bold">
          Team Roster
        </Typography>
        
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          sx={{ 
            fontWeight: 'bold',
            px: 3
          }}
        >
          Add Athlete
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper
        elevation={1}
        sx={{ 
          height: 500, 
          width: '100%',
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
          // Track-inspired border
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `repeating-linear-gradient(
              to right,
              ${theme => theme.palette.secondary.main} 0,
              ${theme => theme.palette.secondary.main} 10px,
              transparent 10px,
              transparent 20px
            )`
          }
        }}
        ref={tableRef}
      >
        <DataGrid
          rows={athletes}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 25]}
          disableSelectionOnClick
          loading={loading}
          autoHeight
          getRowHeight={({ id }) => {
            const items = athleteInventory[id] || [];
            // Base height plus additional height for each item
            return Math.max(52, 52 + (items.length * 32));
          }}
          components={{
            LoadingOverlay: () => (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress color="secondary" />
              </Box>
            )
          }}
          sx={{
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'primary.main',
              color: 'secondary.main',
              fontWeight: 'bold'
            },
            '& .super-app-theme--header': {
              fontSize: '0.875rem',
              letterSpacing: '0.5px',
              color: 'secondary.main'
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 'bold',
              fontSize: '0.875rem'
            },
            '& .MuiDataGrid-columnHeader': {
              padding: '0 16px'
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(255, 193, 7, 0.1)',
            },
            '& .MuiDataGrid-cell:focus-within': {
              outline: 'none',
            },
            border: 'none'
          }}
        />
      </Paper>
      
      {/* Upcoming Events Accordions */}
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" color="primary" gutterBottom fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <EventIcon sx={{ mr: 1 }} />
          Upcoming Events by Group
        </Typography>
        
        {/* Create accordion for each unique group in the athletes array */}
        {athletes.length > 0 && 
          [...new Set(athletes.map(athlete => athlete.group))]
            .filter(group => group) // Filter out any undefined groups
            .sort() // Sort alphabetically
            .map((group, index) => (
              <Accordion 
                key={group} 
                expanded={expandedGroup === group}
                onChange={handleAccordionChange(group)}
                ref={el => { accordionRefs.current[group] = el }}
                sx={{ 
                  mb: 2,
                  backgroundColor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderRadius: '8px !important',
                  overflow: 'hidden',
                  position: 'relative',
                  // Track lane-inspired border
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    background: theme => theme.palette.secondary.main
                  },
                  '&.Mui-expanded': {
                    margin: '0 0 16px 0',
                  }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ 
                    backgroundColor: 'rgba(26, 35, 126, 0.05)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Typography fontWeight="medium" color="primary">
                      {group} ({athletes.filter(a => a.group === group).length} athletes)
                    </Typography>
                    <Box>
                      {!eventsLoading[group] && (
                        <Typography variant="body2" color="text.secondary" component="span" sx={{ mr: 2 }}>
                          {groupEvents[group] ? 
                            `${groupEvents[group].filter(event => {
                              const eventDate = new Date(event.date);
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return eventDate >= today;
                            }).length} upcoming` : 
                            'No events'}
                        </Typography>
                      )}
                      <FormControlLabel
                        control={
                          <Switch 
                            size="small"
                            checked={showPastEvents}
                            onChange={(e) => {
                              e.stopPropagation();
                              setShowPastEvents(e.target.checked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        }
                        label={<Typography variant="body2">Show Past</Typography>}
                        sx={{ mr: 1 }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button 
                        size="small" 
                        startIcon={<EventIcon fontSize="small" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchEventsForGroup(group);
                        }}
                        sx={{ ml: 1 }}
                      >
                        Reload
                      </Button>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {eventsLoading[group] ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
                      <CircularProgress color="secondary" size={24} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Loading events...
                      </Typography>
                    </Box>
                  ) : eventsError[group] ? (
                    <Alert 
                      severity="error" 
                      sx={{ mt: 1 }}
                      action={
                        <Button 
                          color="inherit" 
                          size="small"
                          onClick={() => fetchEventsForGroup(group)}
                        >
                          Retry
                        </Button>
                      }
                    >
                      {eventsError[group]}
                    </Alert>
                  ) : (
                    <>
                      {groupEvents[group] && groupEvents[group].length > 0 ? (
                        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                          {groupEvents[group].map((event, eventIndex) => (
                            <React.Fragment key={event.id}>
                              <ListItem 
                                className="event-list-item"
                                sx={{ 
                                  py: 1.5,
                                  transition: 'background-color 0.2s',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                  },
                                  // Add a background color based on whether the event is upcoming or past
                                  bgcolor: (theme) => 
                                    isPastEvent(event.date) 
                                      ? 'rgba(244, 67, 54, 0.08)' 
                                      : 'rgba(76, 175, 80, 0.08)'
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Typography fontWeight="medium" color="primary.main">
                                        {event.type}: {event.title}
                                      </Typography>
                                      {isPastEvent(event.date) && (
                                        <Chip size="small" label="Past" color="error" 
                                          variant="outlined" sx={{ ml: 1, height: 20 }} />
                                      )}
                                    </Box>
                                  }
                                  secondary={
                                    <>
                                      <Typography variant="body2" color="text.secondary">
                                        Date: {formatEventDate(event.date)}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        Raw Date: {event.date?.toString() || 'N/A'}
                                      </Typography>
                                      {event.displayGroups && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                          Groups: {event.displayGroups.join(', ')}
                                        </Typography>
                                      )}
                                    </>
                                  }
                                />
                              </ListItem>
                              {eventIndex < groupEvents[group].length - 1 && (
                                <Divider component="li" />
                              )}
                            </React.Fragment>
                          ))}
                        </List>
                      ) : (
                        <Typography 
                          color="primary" 
                          align="center" 
                          sx={{ py: 2 }}
                        >
                          No upcoming events for this group
                        </Typography>
                      )}
                    </>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
        
        {athletes.length === 0 && !loading && (
          <Alert severity="info">
            Add athletes to the roster to see their upcoming events
          </Alert>
        )}
      </Box>
      
      {/* Add/Edit Athlete Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          ref: dialogRef
        }}
      >
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
          {formMode === 'add' ? 'Add New Athlete' : 'Edit Athlete'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1, px: 3, mt: 1 }}>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            name="name"
            label="Athlete Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formValues.name}
            onChange={handleInputChange}
            required
            sx={{ mb: 3 }}
          />
          <TextField
            select
            margin="dense"
            id="group"
            name="group"
            label="Group"
            fullWidth
            variant="outlined"
            value={formValues.group}
            onChange={handleInputChange}
            required
            sx={{ mb: 3 }}
          >
            {ATHLETE_GROUPS.map((group) => (
              <MenuItem key={group} value={group}>
                {group}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            id="uniformID"
            name="uniformID"
            label="Uniform ID"
            type="text"
            fullWidth
            variant="outlined"
            value={formValues.uniformID}
            onChange={handleInputChange}
            disabled
            helperText="To be assigned later"
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="secondary">
            {formMode === 'add' ? 'Add Athlete' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the athlete "{athleteToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Three.js integration suggestion */}
      <Box sx={{ mt: 4, opacity: 0.7 }}>
        <Typography variant="body2" color="text.secondary">
          <i>Note: A subtle Three.js running track visualization (similar to the dashboard background) 
          could be added behind this table to enhance the athletic theme.</i>
        </Typography>
      </Box>
    </Box>
  );
};

export default RosterPage; 