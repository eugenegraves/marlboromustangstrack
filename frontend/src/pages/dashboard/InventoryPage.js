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
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  Alert,
  Snackbar,
  Autocomplete,
  Tooltip
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
  AssignmentInd as AssignmentIndIcon,
  Assignment as AssignmentIcon
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
import { format } from 'date-fns';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// Status options for inventory items
const statusOptions = ['Available', 'Checked Out', 'Maintenance', 'Retired'];

// Condition options for inventory items
const conditionOptions = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'];

// Category options for equipment
const categoryOptions = [
  'Uniform',
  'Shoes',
  'Accessories',
  'Training Equipment',
  'Competition Equipment',
  'Other'
];

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
  const [athletesLoading, setAthletesLoading] = useState(true);
  const [athletesError, setAthletesError] = useState(null);
  
  // State for the DataGrid pagination
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  
  // New item form state
  const [itemData, setItemData] = useState({
    name: '',
    itemId: '',
    type: 'Singlet',
    category: 'Uniform',
    status: 'Available',
    size: '',
    condition: 'Good',
    location: '',
    notes: '',
    assignedTo: '',
    athleteId: null,
    athleteName: ''
  });
  
  // State for snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Refs for animation
  const titleRef = useRef(null);
  const gridRef = useRef(null);
  const dialogRef = useRef(null);
  
  // Add this function before the useEffect hook
  const transformInventoryData = (items) => {
    return items.map(item => {
      // Ensure each item has an ID
      const id = item.id || Math.random().toString(36).substring(2, 11);
      
      // Ensure essential fields
      return {
        ...item,
        id,
        // Ensure name field is present and not empty
        name: item.name || item.itemId || 'Unnamed Item',
        // Other fields
        type: item.type || '',
        category: item.category || item.type || '',
        status: item.status || 'Available',
        // Ensure we have the assignedTo field (the athlete ID)
        assignedTo: item.assignedTo || null
      };
    });
  };
  
  // Fetch inventory items and athletes when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get athletes for assignee dropdown first (needed for name lookups)
        const athleteList = await getAthletes();
        console.log('===== ATHLETE DATA DEBUG =====');
        console.log('Athletes count:', athleteList.length);
        console.log('First athlete:', athleteList[0]);
        console.log('First athlete keys:', athleteList[0] ? Object.keys(athleteList[0]) : 'No athletes');
        console.log('Athletes IDs:', athleteList.map(a => a.id));
        console.log('Athletes Names:', athleteList.map(a => a.name));
        console.log('Athletes FirstName/LastName:', athleteList.map(a => ({ 
          id: a.id, 
          firstName: a.firstName, 
          lastName: a.lastName 
        })));
        console.log('Athlete data structure check - FULL:', athleteList.slice(0, 3));
        
        setAthletes(athleteList);
        
        // Get inventory items
        const inventoryItems = await getInventoryItems();
        console.log('Inventory items received:', inventoryItems);
        
        // Transform items to ensure consistent structure
        const transformedItems = transformInventoryData(inventoryItems);
        console.log('Transformed items:', transformedItems);
        
        setItems(transformedItems);
        
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
  
  // Handle DataGrid resizing issues in production
  useEffect(() => {
    const handleWindowResize = () => {
      // Force re-render of DataGrid on window resize
      if (gridRef.current) {
        const gridElement = gridRef.current.querySelector('.MuiDataGrid-root');
        if (gridElement) {
          // Apply height explicitly to ensure proper rendering
          gridElement.style.height = 'auto';
          gridElement.style.minHeight = '400px';
        }
      }
    };
    
    // Initial call
    handleWindowResize();
    
    // Set up event listener
    window.addEventListener('resize', handleWindowResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [items, loading]); // Re-apply when items change or loading state changes
  
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
  
  // Handle opening the item dialog
  const handleOpenItemDialog = (item = null) => {
    // If we're editing an existing item
    if (item) {
      setSelectedItem(item);
      
      // Populate form with item data
      setItemData({
        name: item.name || '',
        itemId: item.itemId || '',
        type: item.type || 'Singlet',
        category: item.category || 'Uniform',
        status: item.status || 'Available',
        size: item.size || '',
        condition: item.condition || 'Good',
        location: item.location || '',
        notes: item.notes || '',
        assignedTo: item.assignedTo || '',
        athleteId: item.assignedTo || null,
        athleteName: item.athleteName || ''
      });
    } else {
      // Reset for new item
      setSelectedItem(null);
      setItemData({
        name: '',
        itemId: '',
        type: 'Singlet',
        category: 'Uniform',
        status: 'Available',
        size: '',
        condition: 'Good',
        location: '',
        notes: '',
        assignedTo: '',
        athleteId: null,
        athleteName: ''
      });
    }
    
    // Open the dialog
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
    
    if (name === 'status') {
      if (value !== 'Checked Out') {
        // If status is not "Checked Out", clear athlete assignment fields
        setItemData(prev => ({
          ...prev,
          [name]: value,
          assignedTo: '',
          athleteId: null,
          athleteName: ''
        }));
      } else {
        // Just update the status
        setItemData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else if (name === 'assignedTo') {
      // When assignedTo changes, update athleteId and potentially athleteName
      const selectedAthlete = athletes.find(a => a.id === value);
      
      if (selectedAthlete) {
        setItemData(prev => ({
          ...prev,
          assignedTo: value,
          athleteId: value,
          athleteName: `${selectedAthlete['First Name']} ${selectedAthlete['Last Name']}`
        }));
      } else {
        // No athlete selected
        setItemData(prev => ({
          ...prev,
          assignedTo: value,
          athleteId: value || null,
          athleteName: ''
        }));
      }
    } else {
      // For all other fields, just update normally
      setItemData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle saving a new or updated item
  const handleSaveItem = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!itemData.name || !itemData.type || !itemData.category || !itemData.status) {
        setSnackbar({
          open: true,
          message: 'Please fill in all required fields',
          severity: 'error'
        });
        return;
      }
      
      // Validate that an athlete is assigned when the status is "Checked Out"
      if (itemData.status === 'Checked Out' && !itemData.assignedTo) {
        setSnackbar({
          open: true,
          message: 'Please select an athlete when status is Checked Out',
          severity: 'error'
        });
        return;
      }
      
      // Create data object for Firestore with only necessary fields
      const firestoreData = {
        name: itemData.name.trim(), // Ensure name is trimmed
        itemId: itemData.itemId || `ITEM-${Math.floor(Math.random() * 10000)}`,
        type: itemData.type,
        category: itemData.category,
        size: itemData.size || '',
        condition: itemData.condition || 'Good',
        location: itemData.location || '',
        notes: itemData.notes || '',
        status: itemData.status,
        assignedTo: itemData.assignedTo || null,
        lastUpdated: new Date().toISOString()
      };
      
      // For debugging
      console.log('Saving item with name:', firestoreData.name);
      
      // Set creation date for new items
      if (!selectedItem) {
        firestoreData.addedDate = new Date().toISOString();
      }
      
      console.log('Saving item data:', firestoreData);
      
      let savedItem;
      
      if (selectedItem) {
        // Updating existing item
        const itemRef = doc(db, 'inventory', selectedItem.id);
        await updateDoc(itemRef, firestoreData);
        savedItem = { id: selectedItem.id, ...firestoreData };
        
        // Update the items state
        setItems(items.map(item => 
          item.id === selectedItem.id ? savedItem : item
        ));
      } else {
        // Creating new item
        const inventoryCollection = collection(db, 'inventory');
        const docRef = await addDoc(inventoryCollection, firestoreData);
        savedItem = { id: docRef.id, ...firestoreData };
        
        // Add to the items state
        setItems([...items, savedItem]);
      }
      
      console.log('Item saved successfully:', savedItem);
      
      // Close dialog
      setOpenItemDialog(false);
      
      // Refresh athletes to get updated uniform information
      const refreshedAthletes = await getAthletes();
      setAthletes(refreshedAthletes);
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Item ${selectedItem ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
      
      // Animate the newly added or updated item
      if (savedItem) {
        const itemElement = document.querySelector(`[data-id="${savedItem.id}"]`);
        if (itemElement) {
          gsap.from(itemElement, {
            backgroundColor: 'rgba(76, 175, 80, 0.3)',
            duration: 2,
            ease: 'power2.out'
          });
        }
      }
    } catch (error) {
      console.error('Error saving item:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle deleting an inventory item
  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    
    try {
      console.log('Deleting item:', selectedItem);
      
      await deleteInventoryItem(selectedItem.id);
      toast.success('Item deleted successfully');
      
      // Directly update items in state
      setItems(prevItems => prevItems.filter(item => item.id !== selectedItem.id));
      
      // Close dialog
      setOpenDeleteDialog(false);
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error(err.message || 'Failed to delete item');
    }
  };
  
  // Handle assigning a uniform to an athlete
  const handleAssignItem = async () => {
    try {
      setLoading(true);
      console.log('Assignment data:', itemData);
      console.log('Selected item for assignment:', selectedItem);

      // Update the item with assignment data
      const updatedItemData = {
        ...selectedItem,
        status: itemData.assignedTo ? 'Checked Out' : 'Available',
        assignedTo: itemData.assignedTo || null
      };

      console.log('Updated item data for assignment:', updatedItemData);

      // Find athlete for logging and updates
      const selectedAthlete = athletes.find(a => a.id === itemData.assignedTo);
      console.log('Selected athlete:', selectedAthlete);
      
      if (selectedAthlete) {
        console.log(`Assigning item to: ${selectedAthlete.firstName} ${selectedAthlete.lastName}`);
      } else if (itemData.assignedTo) {
        console.log(`Assigning to athlete ID but athlete not found in list: ${itemData.assignedTo}`);
      } else {
        console.log('Unassigning item (making available)');
      }

      // First, update the inventory item in Firestore
      const itemRef = doc(db, 'inventory', selectedItem.id);
      
      // Only save essential fields to Firestore
      const firestoreData = {
        status: updatedItemData.status,
        assignedTo: updatedItemData.assignedTo
      };
      
      await updateDoc(itemRef, firestoreData);
      console.log('Item updated in Firestore:', firestoreData);

      // Next, if this is a uniform category item, update the athlete's 'Has Uniform?' field
      if (selectedItem.category === 'Uniform' || selectedItem.type === 'Singlet' || selectedItem.type === 'Shorts') {
        // If we're assigning a uniform to an athlete
        if (itemData.assignedTo) {
          // Update the athlete record to indicate they have a uniform
          const athleteRef = doc(db, 'athletes', itemData.assignedTo);
          await updateDoc(athleteRef, {
            'Has Uniform?': true
          });
          console.log(`Updated athlete ${itemData.assignedTo} to show they have a uniform`);
        }
        
        // If we're un-assigning a uniform from an athlete
        if (selectedItem.assignedTo && !itemData.assignedTo) {
          // Check if the athlete had this uniform assigned
          const athleteRef = doc(db, 'athletes', selectedItem.assignedTo);
          
          // Update the athlete record to indicate they no longer have a uniform
          await updateDoc(athleteRef, {
            'Has Uniform?': false
          });
          console.log(`Updated athlete ${selectedItem.assignedTo} to show they no longer have a uniform`);
        }
      }

      // Update the item in the UI state
      setItems(items.map(item => 
        item.id === selectedItem.id ? updatedItemData : item
      ));

      // Close the dialog
      setOpenAssignDialog(false);
      
      // Refresh athletes to get updated uniform information
      const refreshedAthletes = await getAthletes();
      setAthletes(refreshedAthletes);
      
      setSnackbar({
        open: true,
        message: `Item ${itemData.assignedTo ? 'assigned' : 'unassigned'} successfully`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error assigning item:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle edit click
  const handleEditClick = (item) => {
    handleOpenItemDialog(item);
  };
  
  // Handle assign click
  const handleAssignClick = (item) => {
    handleOpenAssignDialog(item);
  };
  
  // Handle delete click
  const handleDeleteClick = (id) => {
    // Find the item with the given id
    const itemToDelete = items.find(item => item.id === id);
    if (itemToDelete) {
      handleOpenDeleteDialog(itemToDelete);
    } else {
      console.error(`Item with id ${id} not found`);
    }
  };
  
  // DataGrid columns configuration
  const columns = [
    { 
      field: 'name', 
      headerName: 'Item Name', 
      flex: 1,
      minWidth: 180,
      renderCell: (params) => {
        if (!params || !params.row) return 'Unknown Item';
        const name = params.row.name || params.row.itemId || 'Unnamed Item';
        // Add tooltip for longer names
        return (
          <Tooltip title={name} placement="top">
            <Typography 
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: '1.2em',
                maxHeight: '2.4em'
              }}
            >
              {name}
            </Typography>
          </Tooltip>
        );
      }
    },
    { 
      field: 'category', 
      headerName: 'Category', 
      width: 130
    },
    { 
      field: 'type', 
      headerName: 'Type', 
      width: 130
    },
    { 
      field: 'size', 
      headerName: 'Size', 
      width: 80
    },
    { 
      field: 'condition', 
      headerName: 'Condition', 
      width: 100
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 130
    },
    {
      field: 'assignedTo',
      headerName: 'Assigned To',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        // If we have an assignedTo ID, look up the athlete in our athletes array
        if (params.value) {
          const athlete = athletes.find(a => a.id === params.value);
          if (athlete) {
            return (
              <Box sx={{ py: 0.5 }}>
                <Chip 
                  label={`${athlete.firstName} ${athlete.lastName}`} 
                  color="primary" 
                  size="small" 
                />
              </Box>
            );
          } else {
            // If we can't find the athlete in our list, show the ID in a neutral color
            return (
              <Box sx={{ py: 0.5 }}>
                <Chip 
                  label={`ID: ${params.value.substring(0, 6)}...`} 
                  color="default" 
                  size="small" 
                />
              </Box>
            );
          }
        }
        return 'Not Assigned';
      }
    },
    { 
      field: 'lastUpdated', 
      headerName: 'Last Updated', 
      width: 150,
      valueFormatter: (params) => {
        if (!params || !params.value) return '-';
        return format(new Date(params.value), 'MM/dd/yyyy');
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => {
        if (!params || !params.row) {
          return null;
        }
        return (
          <Box>
            <IconButton 
              size="small" 
              onClick={() => handleEditClick(params.row)}
              aria-label="edit"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => handleAssignClick(params.row)}
              aria-label="assign"
            >
              <AssignmentIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => handleDeleteClick(params.row.id)}
              aria-label="delete"
            >
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Box>
        );
      }
    }
  ];
  
  return (
    <Container 
      maxWidth="xl"
      sx={{
        pb: 6
      }}
    >
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
          <Card
            sx={{
              overflow: 'visible',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
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
            
            <Box sx={{ mx: 3, mb: 3 }} ref={gridRef}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                  <Alert severity="error">{error}</Alert>
                </Box>
              ) : (
                <DataGrid
                  rows={items || []}
                  columns={columns}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  pageSizeOptions={[5, 10, 25, 50]}
                  slots={{
                    toolbar: GridToolbar,
                    noRowsOverlay: () => (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Typography variant="h6" color="text.secondary" align="center">
                          No inventory items found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center">
                          Add items to get started
                        </Typography>
                      </Box>
                    )
                  }}
                  density="standard"
                  autoHeight
                  getEstimatedRowHeight={() => 52}
                  getRowHeight={() => 52}
                  rowHeight={52}
                  disableRowSelectionOnClick
                  getRowId={(row) => {
                    if (!row) return Math.random().toString(36).substring(2, 11);
                    return row.id || Math.random().toString(36).substring(2, 11);
                  }}
                  sx={{
                    minHeight: '400px', // Ensure minimum height
                    height: 'auto',
                    width: '100%',
                    '& .MuiDataGrid-root': {
                      height: 'auto !important'
                    },
                    '& .MuiDataGrid-cell': {
                      padding: '16px 8px',
                      height: 'auto !important',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      overflow: 'visible'
                    },
                    '& .MuiDataGrid-row': {
                      minHeight: '52px',
                      maxHeight: 'none !important'
                    },
                    '& .MuiDataGrid-cell:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                  onError={(params) => {
                    console.error('DataGrid error:', params);
                    return null;
                  }}
                  componentsProps={{
                    cell: {
                      onError: (error) => {
                        console.log("DataGrid cell error:", error);
                        return null;
                      }
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                required
                fullWidth
                id="name"
                name="name"
                label="Item Name"
                value={itemData.name || ''}
                onChange={handleInputChange}
                error={!itemData.name?.trim()}
                helperText={!itemData.name?.trim() ? "Item name is required" : ""}
                InputProps={{
                  sx: { fontWeight: 'bold' }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="itemId"
                name="itemId"
                label="Item ID"
                value={itemData.itemId || ''}
                onChange={handleInputChange}
                placeholder="e.g., UNIFORM-001"
              />
            </Grid>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={itemData.category}
                    onChange={handleInputChange}
                    label="Category"
                  >
                    {categoryOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    value={itemData.type}
                    onChange={handleInputChange}
                    label="Type"
                  >
                    <MenuItem value="Singlet">Singlet</MenuItem>
                    <MenuItem value="Shorts">Shorts</MenuItem>
                    <MenuItem value="Footwear">Footwear</MenuItem>
                    <MenuItem value="Field Equipment">Field Equipment</MenuItem>
                    <MenuItem value="Track Equipment">Track Equipment</MenuItem>
                    <MenuItem value="Accessory">Accessory</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={itemData.status}
                    onChange={handleInputChange}
                    label="Status"
                  >
                    {statusOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Size"
                  name="size"
                  value={itemData.size || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. M, L, 10, 42"
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Condition</InputLabel>
                  <Select
                    name="condition"
                    value={itemData.condition || 'Good'}
                    onChange={handleInputChange}
                    label="Condition"
                  >
                    {conditionOptions.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={itemData.location || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. Equipment Room, Storage"
                />
              </Grid>
            </Grid>
            
            {itemData.status === 'Checked Out' && (
              <FormControl fullWidth required>
                <InputLabel>Assigned To</InputLabel>
                <Select
                  name="assignedTo"
                  value={itemData.assignedTo || ''}
                  onChange={handleInputChange}
                  label="Assigned To"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {athletes.map(athlete => (
                    <MenuItem key={athlete.id} value={athlete.id}>
                      {athlete.firstName ? `${athlete.firstName} ${athlete.lastName}` : athlete.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={itemData.notes || ''}
              onChange={handleInputChange}
              multiline
              rows={3}
              placeholder="Additional information about this item..."
            />
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenItemDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveItem} 
            variant="contained" 
            color="primary"
            disabled={!itemData.name || !itemData.category || !itemData.type || !itemData.status || 
                      (itemData.status === 'Checked Out' && !itemData.assignedTo)}
          >
            {selectedItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Production CSS fixes */}
      <style jsx global>{`
        .MuiDataGrid-cell {
          white-space: normal !important;
          word-wrap: break-word !important;
          overflow: visible !important;
          line-height: 1.43 !important;
          padding: 8px !important;
          height: auto !important;
        }
        .MuiDataGrid-row {
          min-height: 52px !important;
          max-height: none !important;
        }
        .MuiDataGrid-main {
          min-height: 400px;
        }
        .MuiDataGrid-virtualScroller {
          overflow: visible !important;
        }
      `}</style>
      
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
              value={itemData.assignedTo || ''}
              onChange={handleInputChange}
              label="Assign To Athlete"
            >
              <MenuItem value="">
                <em>Not Assigned</em>
              </MenuItem>
              {athletes.map(athlete => (
                <MenuItem key={athlete.id} value={athlete.id}>
                  {athlete.firstName ? `${athlete.firstName} ${athlete.lastName}` : athlete.name}
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
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 