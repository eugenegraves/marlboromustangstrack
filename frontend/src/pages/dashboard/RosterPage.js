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
  Divider
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
  
  // New state for events
  const [groupEvents, setGroupEvents] = useState({});
  const [eventsLoading, setEventsLoading] = useState({});
  const [eventsError, setEventsError] = useState({});
  const [expandedGroup, setExpandedGroup] = useState(false);
  
  const tableRef = useRef(null);
  const dialogRef = useRef(null);
  const accordionRefs = useRef({});
  
  // Fetch athletes on component mount
  useEffect(() => {
    fetchAthletes();
  }, []);
  
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
      const listItems = accordionRefs.current[expandedGroup].querySelectorAll('.event-list-item');
      
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
    setEventsLoading(prev => ({ ...prev, [group]: true }));
    setEventsError(prev => ({ ...prev, [group]: null }));
    
    try {
      console.log(`Fetching events for group: ${group}`);
      const events = await getEvents(group);
      
      // Sort events by date (most recent first)
      const sortedEvents = events.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Only include upcoming events (today or later)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to beginning of today
      
      const upcomingEvents = sortedEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today;
      });
      
      setGroupEvents(prev => ({ ...prev, [group]: upcomingEvents }));
    } catch (error) {
      console.error(`Error fetching events for group ${group}:`, error);
      setEventsError(prev => ({ ...prev, [group]: 'Failed to load events for this group' }));
    } finally {
      setEventsLoading(prev => ({ ...prev, [group]: false }));
    }
  };
  
  // Handle accordion expansion change
  const handleAccordionChange = (group) => (event, isExpanded) => {
    setExpandedGroup(isExpanded ? group : false);
  };
  
  // Format date for display
  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy, h:mm a");
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
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'group', headerName: 'Group', flex: 1, minWidth: 150 },
    { 
      field: 'uniformID', 
      headerName: 'Uniform ID', 
      flex: 0.7, 
      minWidth: 120,
      renderCell: (params) => {
        console.log('Uniform cell params:', params);
        return <span>{params.row.uniformID || 'None'}</span>;
      }
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
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
              color: 'white',
              fontWeight: 'bold'
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
                  <Typography fontWeight="medium" color="primary">
                    {group} ({athletes.filter(a => a.group === group).length} athletes)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {eventsLoading[group] ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                      <CircularProgress color="secondary" size={24} />
                    </Box>
                  ) : eventsError[group] ? (
                    <Alert severity="error" sx={{ mt: 1 }}>
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
                                  }
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Typography fontWeight="medium" color="primary.main">
                                      {event.type}: {event.title}
                                    </Typography>
                                  }
                                  secondary={
                                    <Typography variant="body2" color="text.secondary">
                                      {formatEventDate(event.date)}
                                    </Typography>
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