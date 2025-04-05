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
  Paper
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../../contexts/AuthContext';
import { gsap } from 'gsap';
import { 
  getAthletes, 
  createAthlete, 
  updateAthlete, 
  deleteAthlete 
} from '../../services/athleteService';

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
  
  const tableRef = useRef(null);
  const dialogRef = useRef(null);
  
  // Fetch athletes on component mount
  useEffect(() => {
    fetchAthletes();
  }, []);
  
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