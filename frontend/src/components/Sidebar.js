import React, { useEffect, useRef } from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Box, 
  useTheme, 
  useMediaQuery 
} from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';

// Icons
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import EventIcon from '@mui/icons-material/Event';
import MessageIcon from '@mui/icons-material/Message';
import DashboardIcon from '@mui/icons-material/Dashboard';

const drawerWidth = 240;

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const sidebarRef = useRef(null);
  
  // GSAP animation for sidebar opening/closing
  useEffect(() => {
    if (isMobile) {
      if (open) {
        // Animate sidebar in
        gsap.fromTo(
          sidebarRef.current,
          { x: -drawerWidth, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
        );
      }
    }
  }, [open, isMobile]);
  
  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: <DashboardIcon /> },
    { name: 'Roster', path: '/dashboard/roster', icon: <PeopleIcon /> },
    { name: 'Inventory', path: '/dashboard/inventory', icon: <InventoryIcon /> },
    { name: 'Schedule', path: '/dashboard/schedule', icon: <EventIcon /> },
    { name: 'Messages', path: '/dashboard/messages', icon: <MessageIcon /> },
  ];
  
  const content = (
    <Box
      ref={sidebarRef}
      sx={{
        width: drawerWidth,
        backgroundColor: 'primary.main',
        height: '100%',
        color: 'white',
      }}
    >
      <List sx={{ pt: 2 }}>
        {navItems.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton
              component={NavLink}
              to={item.path}
              sx={{
                py: 1.5,
                '&.active': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRight: `3px solid ${theme.palette.secondary.main}`,
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.secondary.main,
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />
      <Box sx={{ p: 2, opacity: 0.7 }}>
        <Box sx={{ fontSize: '0.8rem', textAlign: 'center' }}>
          Mustangs Track Team
        </Box>
        <Box sx={{ fontSize: '0.7rem', textAlign: 'center', mt: 0.5 }}>
          Management System v1.0
        </Box>
      </Box>
    </Box>
  );
  
  return (
    <>
      {isMobile ? (
        // Mobile drawer (temporary variant)
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
            },
          }}
        >
          {content}
        </Drawer>
      ) : (
        // Desktop drawer (permanent variant)
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
            },
          }}
          open
        >
          {content}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar; 