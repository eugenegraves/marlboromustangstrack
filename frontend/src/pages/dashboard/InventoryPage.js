import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  Container,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import {
  DataGrid,
  GridToolbar,
  GridActionsCellItem
} from '@mui/x-data-grid';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AssignmentInd as AssignmentIndIcon
} from '@mui/icons-material';
import { gsap } from 'gsap';
import { toast } from 'react-hot-toast';
import { 
  getInventoryItems, 
  createInventoryItem, 
  updateInventoryItem, 
  deleteInventoryItem,
  assignInventoryItem
} from '../../services/inventoryService';
import { getAthletes } from '../../services/athleteService';

export default function InventoryPage() {
  // State variables
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [athletes, setAthletes] = useState([]);
  
  // New item form state
  const [itemData, setItemData] = useState({
    itemId: '',
    type: 'Uniform',
    status: 'Available',
    assignedTo: ''
  });
  
  // References for animations
  const titleRef = useRef(null);
  const gridRef = useRef(null);
  
  // Fetch inventory items and athletes when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get inventory items
        const inventoryItems = await getInventoryItems();
        setItems(inventoryItems);
        
        // Get athletes for assignee dropdown
        const athleteList = await getAthletes();
        setAthletes(athleteList);
        
        // Run animations after data is loaded
        runEntranceAnimations();
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load inventory items. Please try again later.');
        toast.error('Failed to load inventory items');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Animation functions
  const runEntranceAnimations = () => {
    const timeline = gsap.timeline();
    
    if (titleRef.current) {
      timeline.fromTo(
        titleRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
    
    if (gridRef.current) {
      timeline.fromTo(
        gridRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.3'
      );
    }
  };
  
  // Handle opening the add/edit item dialog
  const handleOpenItemDialog = (item = null) => {
    if (item) {
      // Editing an existing item
      setItemData({
        itemId: item.itemId,
        type: item.type,
        status: item.status,
        assignedTo: item.assignedTo || ''
      });
      setSelectedItem(item);
    } else {
      // Adding a new item
      setItemData({
        itemId: '',
        type: 'Uniform',
        status: 'Available',
        assignedTo: ''
      });
      setSelectedItem(null);
    }
    
    setOpenItemDialog(true);
  };
  
  // Handle opening the delete confirmation dialog
  const handleOpenDeleteDialog = (item) => {
    setSelectedItem(item);
    setOpenDeleteDialog(true);
  };
  
  // Handle opening the assign dialog
  const handleOpenAssignDialog = (item) => {
    setSelectedItem(item);
    setItemData({
      ...itemData,
      assignedTo: item.assignedTo || ''
    });
    setOpenAssignDialog(true);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setItemData({
      ...itemData,
      [name]: value
    });
    
    // If status is not "Checked Out", clear assignedTo
    if (name === 'status' && value !== 'Checked Out') {
      setItemData(prev => ({
        ...prev,
        assignedTo: ''
      }));
    }
  };
  
  // Handle saving an inventory item (create or update)
  const handleSaveItem = async () => {
    try {
      if (selectedItem) {
        // Update existing item
        await updateInventoryItem(selectedItem.id, itemData);
        toast.success('Item updated successfully');
      } else {
        // Create new item
        await createInventoryItem(itemData);
        toast.success('Item added successfully');
      }
      
      // Refresh inventory items
      const refreshedItems = await getInventoryItems();
      setItems(refreshedItems);
      
      // Close dialog
      setOpenItemDialog(false);
      
      // Animate the updated grid
      if (gridRef.current) {
        gsap.fromTo(
          gridRef.current,
          { opacity: 0.8 },
          { opacity: 1, duration: 0.5, ease: 'power2.out' }
        );
      }
    } catch (err) {
      console.error('Error saving item:', err);
      toast.error(err.message || 'Failed to save item');
    }
  };
  
  // Handle deleting an inventory item
  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    
    try {
      await deleteInventoryItem(selectedItem.id);
      toast.success('Item deleted successfully');
      
      // Refresh inventory items
      const refreshedItems = await getInventoryItems();
      setItems(refreshedItems);
      
      // Close dialog
      setOpenDeleteDialog(false);
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error(err.message || 'Failed to delete item');
    }
  };
  
  // Handle assigning an item to an athlete
  const handleAssignItem = async () => {
    if (!selectedItem || !itemData.assignedTo) return;
    
    try {
      await assignInventoryItem(selectedItem.id, itemData.assignedTo);
      toast.success('Item assigned successfully');
      
      // Refresh inventory items
      const refreshedItems = await getInventoryItems();
      setItems(refreshedItems);
      
      // Close dialog
      setOpenAssignDialog(false);
    } catch (err) {
      console.error('Error assigning item:', err);
      toast.error(err.message || 'Failed to assign item');
    }
  };
  
  // DataGrid columns configuration
  const columns = [
    { 
      field: 'itemId', 
      headerName: 'Item ID', 
      flex: 1,
      minWidth: 120
    },
    { 
      field: 'type', 
      headerName: 'Type', 
      flex: 1,
      minWidth: 120
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <Chip 
          label={params.value}
          color={
            params.value === 'Available' ? 'success' :
            params.value === 'Checked Out' ? 'secondary' :
            params.value === 'Damaged' ? 'error' :
            'default'
          }
          size="small"
        />
      )
    },
    { 
      field: 'assignedToName', 
      headerName: 'Assigned To', 
      flex: 1.5,
      minWidth: 180,
      valueGetter: (params) => {
        return params.row.assignedToName || 'Not Assigned';
      }
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleOpenItemDialog(params.row)}
        />,
        <GridActionsCellItem
          icon={<AssignmentIndIcon />}
          label="Assign"
          onClick={() => handleOpenAssignDialog(params.row)}
          showInMenu
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleOpenDeleteDialog(params.row)}
          showInMenu
        />
      ]
    }
  ];
  
  return (
    <Container maxWidth="xl">
      <Box mb={5}>
        <Typography 
          variant="h3" 
          component="h1" 
          paragraph
          ref={titleRef}
        >
          Equipment Inventory
        </Typography>
        <Typography gutterBottom>
          Track and manage team equipment, uniforms, and other inventory items
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <Box sx={{ p: 3, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Inventory Items
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {items.length} items in inventory
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenItemDialog()}
              >
                Add Item
              </Button>
            </Box>
            
            <Box sx={{ height: 500, mx: 3, mb: 3 }} ref={gridRef}>
              {loading ? (
                <LinearProgress />
              ) : error ? (
                <Typography color="error" sx={{ p: 2 }}>
                  {error}
                </Typography>
              ) : (
                <DataGrid
                  rows={items}
                  columns={columns}
                  initialState={{
                    pagination: {
                      paginationModel: {
                        pageSize: 10,
                      },
                    },
                  }}
                  pageSizeOptions={[5, 10, 25, 50]}
                  slots={{
                    toolbar: GridToolbar
                  }}
                  density="standard"
                  autoHeight
                  sx={{
                    '& .MuiDataGrid-cell:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                />
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
      
      {/* Add/Edit Item Dialog */}
      <Dialog 
        open={openItemDialog} 
        onClose={() => setOpenItemDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Item ID"
              name="itemId"
              value={itemData.itemId}
              onChange={handleInputChange}
              required
              placeholder="e.g. U-1001"
            />
            
            <FormControl fullWidth required>
              <InputLabel>Type</InputLabel>
              <Select
                name="type"
                value={itemData.type}
                onChange={handleInputChange}
                label="Type"
              >
                <MenuItem value="Uniform">Uniform</MenuItem>
                <MenuItem value="Equipment">Equipment</MenuItem>
                <MenuItem value="Accessory">Accessory</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth required>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={itemData.status}
                onChange={handleInputChange}
                label="Status"
              >
                <MenuItem value="Available">Available</MenuItem>
                <MenuItem value="Checked Out">Checked Out</MenuItem>
                <MenuItem value="Damaged">Damaged</MenuItem>
                <MenuItem value="Lost">Lost</MenuItem>
              </Select>
            </FormControl>
            
            {itemData.status === 'Checked Out' && (
              <FormControl fullWidth required>
                <InputLabel>Assigned To</InputLabel>
                <Select
                  name="assignedTo"
                  value={itemData.assignedTo}
                  onChange={handleInputChange}
                  label="Assigned To"
                >
                  {athletes.map(athlete => (
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
          <Button onClick={() => setOpenItemDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveItem} 
            variant="contained" 
            color="primary"
            disabled={!itemData.itemId || !itemData.type || !itemData.status || 
                      (itemData.status === 'Checked Out' && !itemData.assignedTo)}
          >
            {selectedItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete item {selectedItem?.itemId}?
            {selectedItem?.assignedTo && (
              <Typography color="error" sx={{ mt: 1 }}>
                Warning: This item is currently assigned to an athlete.
              </Typography>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteItem} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Assign Item Dialog */}
      <Dialog
        open={openAssignDialog}
        onClose={() => setOpenAssignDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Assign Item {selectedItem?.itemId}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Assign To Athlete</InputLabel>
            <Select
              name="assignedTo"
              value={itemData.assignedTo}
              onChange={handleInputChange}
              label="Assign To Athlete"
            >
              <MenuItem value="">
                <em>Not Assigned</em>
              </MenuItem>
              {athletes.map(athlete => (
                <MenuItem key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignItem} 
            variant="contained" 
            color="primary"
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 