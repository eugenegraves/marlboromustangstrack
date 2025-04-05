import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Stack,
  Paper,
  Button,
  TableRow,
  TableBody,
  TableCell,
  Container,
  Typography,
  IconButton,
  TableContainer,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Box,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Assignment as AssignmentIcon } from '@mui/icons-material';
import { getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem, assignInventoryItem } from '../../services/inventoryService';
import { getAthletes } from '../../services/athleteService';

export default function InventoryPage() {
  // State
  const [inventoryItems, setInventoryItems] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formValues, setFormValues] = useState({
    itemId: '',
    type: '',
    status: 'Available',
    assignedTo: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemsData, athletesData] = await Promise.all([
          getInventoryItems(),
          getAthletes(),
        ]);
        setInventoryItems(itemsData);
        setAthletes(athletesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load inventory data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Define item types
  const itemTypes = [
    'Uniform - Jersey',
    'Uniform - Shorts',
    'Warmup',
    'Track Spikes',
    'Equipment - Hurdle',
    'Equipment - Shot Put',
    'Equipment - Discus',
    'Equipment - Javelin',
    'Equipment - Pole Vault',
    'Equipment - High Jump',
    'Equipment - Relay Baton',
    'Equipment - Stopwatch',
    'Equipment - Measuring Tape',
    'Other',
  ];

  // Define status options
  const statusOptions = [
    'Available',
    'Checked Out',
    'In Repair',
    'Lost/Damaged',
    'Retired',
  ];

  // Column definitions for DataGrid
  const columns = [
    { field: 'itemId', headerName: 'Item ID', width: 150, flex: 1 },
    { 
      field: 'type', 
      headerName: 'Type', 
      width: 200, 
      flex: 1 
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 150,
      flex: 1,
      renderCell: (params) => {
        let color = 'default';
        switch (params.value) {
          case 'Available':
            color = 'success';
            break;
          case 'Checked Out':
            color = 'primary';
            break;
          case 'In Repair':
            color = 'warning';
            break;
          case 'Lost/Damaged':
          case 'Retired':
            color = 'error';
            break;
          default:
            color = 'default';
        }
        
        return (
          <Chip 
            label={params.value} 
            color={color}
            size="small"
          />
        );
      }
    },
    { 
      field: 'assignedToName', 
      headerName: 'Assigned To', 
      width: 200,
      flex: 1,
      renderCell: (params) => {
        if (!params.value && params.row.status !== 'Checked Out') {
          return '—';
        }
        
        if (!params.value && params.row.status === 'Checked Out') {
          return 'Unknown Athlete';
        }
        
        return params.value;
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Edit">
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(params.row);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Assign">
            <span>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAssign(params.row);
                }}
                disabled={params.row.status !== 'Available' && params.row.status !== 'Checked Out'}
              >
                <AssignmentIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Delete">
            <IconButton 
              size="small" 
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(params.row.id);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Handlers for CRUD operations
  const handleAdd = () => {
    setFormValues({
      itemId: '',
      type: '',
      status: 'Available',
      assignedTo: '',
    });
    setOpenAdd(true);
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setFormValues({
      itemId: item.itemId,
      type: item.type,
      status: item.status,
      assignedTo: item.assignedTo || '',
    });
    setOpenEdit(true);
  };

  const handleAssign = (item) => {
    setCurrentItem(item);
    setFormValues({
      ...formValues,
      assignedTo: item.assignedTo || '',
    });
    setOpenAssign(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteInventoryItem(id);
        
        // Update local state
        setInventoryItems(inventoryItems.filter(item => item.id !== id));
        
        // Show success message
        setSuccessMessage('Inventory item deleted successfully');
        setOpenSnackbar(true);
      } catch (error) {
        console.error('Error deleting item:', error);
        setError(error.message || 'Failed to delete item');
        setOpenSnackbar(true);
      }
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    
    try {
      // Validate status and assignedTo combination
      if (formValues.status === 'Checked Out' && !formValues.assignedTo) {
        throw new Error('When status is "Checked Out", an athlete must be assigned');
      }
      
      const newItem = await createInventoryItem(formValues);
      
      // Update local state with the new item
      if (newItem.assignedTo) {
        // Find athlete name for display
        const athlete = athletes.find(a => a.id === newItem.assignedTo);
        newItem.assignedToName = athlete ? athlete.name : 'Unknown Athlete';
      }
      
      setInventoryItems([...inventoryItems, newItem]);
      setOpenAdd(false);
      
      // Show success message
      setSuccessMessage('Inventory item added successfully');
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error adding item:', error);
      setError(error.message || 'Failed to add item');
      setOpenSnackbar(true);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate status and assignedTo combination
      if (formValues.status === 'Checked Out' && !formValues.assignedTo) {
        throw new Error('When status is "Checked Out", an athlete must be assigned');
      }
      
      const updatedItem = await updateInventoryItem(currentItem.id, formValues);
      
      // Update local state
      if (updatedItem.assignedTo) {
        // Find athlete name for display
        const athlete = athletes.find(a => a.id === updatedItem.assignedTo);
        updatedItem.assignedToName = athlete ? athlete.name : 'Unknown Athlete';
      }
      
      setInventoryItems(
        inventoryItems.map(item => (item.id === currentItem.id ? { ...updatedItem } : item))
      );
      
      setOpenEdit(false);
      
      // Show success message
      setSuccessMessage('Inventory item updated successfully');
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error updating item:', error);
      setError(error.message || 'Failed to update item');
      setOpenSnackbar(true);
    }
  };

  const handleSubmitAssign = async (e) => {
    e.preventDefault();
    
    try {
      const updatedItem = await assignInventoryItem(currentItem.id, formValues.assignedTo || null);
      
      // Update local state
      setInventoryItems(
        inventoryItems.map(item => (item.id === currentItem.id ? { ...updatedItem } : item))
      );
      
      setOpenAssign(false);
      
      // Show success message
      const message = formValues.assignedTo 
        ? 'Item assigned successfully' 
        : 'Item unassigned successfully';
        
      setSuccessMessage(message);
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error assigning item:', error);
      setError(error.message || 'Failed to assign item');
      setOpenSnackbar(true);
    }
  };

  // Handler for form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for status changes
    if (name === 'status' && value !== 'Checked Out') {
      // If status is not 'Checked Out', clear assignedTo
      setFormValues({
        ...formValues,
        [name]: value,
        assignedTo: '',
      });
    } else {
      setFormValues({
        ...formValues,
        [name]: value,
      });
    }
  };

  // Close dialogs
  const handleClose = () => {
    setOpenAdd(false);
    setOpenEdit(false);
    setOpenAssign(false);
    setCurrentItem(null);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
    setError('');
    setSuccessMessage('');
  };

  return (
    <Box>
      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Equipment Inventory
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Track and manage team equipment, uniforms, and other assets
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            New Item
          </Button>
        </Stack>

        <Card>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, minHeight: 400 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ height: 650, width: '100%' }}>
              <DataGrid
                rows={inventoryItems}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                checkboxSelection
                disableSelectionOnClick
                density="standard"
                autoHeight
              />
            </Box>
          )}
        </Card>
      </Container>

      {/* Add Item Dialog */}
      <Dialog open={openAdd} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Inventory Item</DialogTitle>
        <form onSubmit={handleSubmitAdd}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Item ID"
                name="itemId"
                required
                value={formValues.itemId}
                onChange={handleInputChange}
                placeholder="e.g. JERSEY-001"
              />
              
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={formValues.type}
                  onChange={handleInputChange}
                  label="Type"
                >
                  {itemTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formValues.status}
                  onChange={handleInputChange}
                  label="Status"
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {formValues.status === 'Checked Out' && (
                <FormControl fullWidth required>
                  <InputLabel>Assigned To</InputLabel>
                  <Select
                    name="assignedTo"
                    value={formValues.assignedTo}
                    onChange={handleInputChange}
                    label="Assigned To"
                  >
                    {athletes.map((athlete) => (
                      <MenuItem key={athlete.id} value={athlete.id}>
                        {athlete.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Add Item
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={openEdit} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Inventory Item</DialogTitle>
        <form onSubmit={handleSubmitEdit}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Item ID"
                name="itemId"
                required
                value={formValues.itemId}
                onChange={handleInputChange}
              />
              
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={formValues.type}
                  onChange={handleInputChange}
                  label="Type"
                >
                  {itemTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formValues.status}
                  onChange={handleInputChange}
                  label="Status"
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {formValues.status === 'Checked Out' && (
                <FormControl fullWidth required>
                  <InputLabel>Assigned To</InputLabel>
                  <Select
                    name="assignedTo"
                    value={formValues.assignedTo}
                    onChange={handleInputChange}
                    label="Assigned To"
                  >
                    {athletes.map((athlete) => (
                      <MenuItem key={athlete.id} value={athlete.id}>
                        {athlete.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Save Changes
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Assign Item Dialog */}
      <Dialog open={openAssign} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {formValues.assignedTo ? 'Reassign Item' : 'Assign Item'}
        </DialogTitle>
        <form onSubmit={handleSubmitAssign}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Typography variant="body1">
                Item ID: <strong>{currentItem?.itemId}</strong>
              </Typography>
              
              <Typography variant="body1">
                Type: <strong>{currentItem?.type}</strong>
              </Typography>
              
              <FormControl fullWidth>
                <InputLabel>Assign To</InputLabel>
                <Select
                  name="assignedTo"
                  value={formValues.assignedTo}
                  onChange={handleInputChange}
                  label="Assign To"
                >
                  <MenuItem value="">
                    <em>None (Unassign)</em>
                  </MenuItem>
                  {athletes.map((athlete) => (
                    <MenuItem key={athlete.id} value={athlete.id}>
                      {athlete.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              {formValues.assignedTo ? 'Reassign' : 'Unassign'}
            </Button>
          </DialogActions>
        </form>
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
} 