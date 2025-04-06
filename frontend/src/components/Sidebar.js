import React, { useEffect, useRef } from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Divider,
  Avatar,
  Typography,
  Tooltip,
  useTheme,
  styled
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Dashboard as DashboardIcon, 
  Group as GroupIcon, 
  EventNote as EventNoteIcon, 
  Inventory as InventoryIcon, 
  Message as MessageIcon, 
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { gsap } from 'gsap';
import { auth } from '../firebase';
import Logo3D from './Logo3D';

// Styled components for enhanced UI
const SidebarHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  position: 'sticky',
  top: 0,
  zIndex: 1,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
}));

const UserSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledListItemButton = styled(ListItemButton)(({ theme, active }) => ({
  margin: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  transition: 'all 0.3s',
  '&:hover': {
    backgroundColor: `rgba(${active ? '255, 193, 7' : '28, 37, 38'}, 0.12)`,
    transform: 'translateX(4px)',
  },
  ...(active && {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
    boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)',
    '& .MuiListItemIcon-root': {
      color: theme.palette.secondary.contrastText,
    },
    '&:hover': {
      backgroundColor: theme.palette.secondary.dark,
    },
  }),
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}));

const BottomSection = styled(Box)(({ theme }) => ({
  marginTop: 'auto',
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

// Main Sidebar Component
export default function Sidebar({ open, toggleSidebar }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);
  const listItemsRef = useRef([]);
  
  // Add global CSS fix for icon visibility
  useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    // Add a rule to make all svg elements in the sidebar fully opaque
    style.innerHTML = `
      .MuiDrawer-root svg {
        opacity: 1 !important;
      }
      .sidebar-icon {
        opacity: 1 !important;
      }
      .sidebar-icon svg {
        opacity: 1 !important;
      }
    `;
    // Append the style element to the head
    document.head.appendChild(style);
    
    // Clean up when component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Navigation items
  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Roster', icon: <GroupIcon />, path: '/dashboard/roster' },
    { text: 'Schedule', icon: <EventNoteIcon />, path: '/dashboard/schedule' },
    { text: 'Inventory', icon: <InventoryIcon />, path: '/dashboard/inventory' },
    { text: 'Messages', icon: <MessageIcon />, path: '/dashboard/messages' },
  ];
  
  // Animation for opening/closing sidebar
  useEffect(() => {
    if (sidebarRef.current) {
      const sidebar = sidebarRef.current;
      
      // Safe animation setup - check if elements exist first
      const iconElements = document.querySelectorAll('.sidebar-icon');
      if (iconElements && iconElements.length > 0) {
        gsap.set(iconElements, { opacity: 1 });
      }
      
      // Make sure we have valid listItems before trying to animate them
      const validListItems = Array.from(listItemsRef.current || []).filter(item => item !== null && item !== undefined);
      
      const tl = gsap.timeline();
      
      if (open) {
        // When opening - animate the width first
        tl.to(sidebar, {
          width: '240px',
          duration: 0.4,
          ease: 'power3.out',
        });
        
        // Only animate list items if they exist
        if (validListItems.length > 0) {
          tl.to(validListItems, {
            opacity: 1,
            x: 0,
            stagger: 0.05,
            duration: 0.3,
            ease: 'power2.out',
          }, '-=0.2');
        }
      } else {
        // When closing - find and animate text elements if they exist
        const textElements = validListItems
          .map(item => item.querySelector('.MuiListItemText-root'))
          .filter(Boolean);
          
        if (textElements.length > 0) {
          tl.to(textElements, {
            opacity: 0,
            x: -20,
            stagger: 0.03,
            duration: 0.2,
            ease: 'power2.in',
          });
        }
        
        // Animate sidebar width
        tl.to(sidebar, {
          width: '64px',
          duration: 0.3,
          ease: 'power3.in',
        }, textElements.length > 0 ? '-=0.1' : 0);
      }
    }
  }, [open]);
  
  // Animation for active menu item highlight
  useEffect(() => {
    const indicator = document.querySelector('.active-menu-indicator');
    if (indicator) {
      const activeIndex = navItems.findIndex(item => item.path === location.pathname);
      if (activeIndex >= 0) {
        gsap.to(indicator, {
          y: activeIndex * 48 + 24,
          duration: 0.4,
          ease: 'power3.out',
        });
      }
    }
  }, [location.pathname, navItems]);
  
  // Handle navigation and animate transitions
  const handleNavigation = (path) => {
    const element = document.querySelector(`[data-path="${path}"]`);
    if (!element) {
      navigate(path);
      return;
    }
    
    // Button press animation with safety check
    gsap.to(element, {
      scale: 0.95,
      duration: 0.1,
      ease: 'power1.in',
      onComplete: () => {
        gsap.to(element, {
          scale: 1,
          duration: 0.3,
          ease: 'elastic.out(1, 0.5)',
          clearProps: "scale",
          onComplete: () => navigate(path)
        });
      },
    });
  };
  
  // Handle logout with animation
  const handleLogout = () => {
    gsap.to(sidebarRef.current, {
      x: -300,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        auth.signOut().then(() => {
          navigate('/login');
        });
      },
    });
  };
  
  // Drawer content for both mobile and desktop
  const drawerContent = (
    <>
      <SidebarHeader>
        <IconButton 
          className="sidebar-icon"
          onClick={toggleSidebar}
          sx={{ color: 'white' }}
        >
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </SidebarHeader>
      
      {open && (
        <UserSection>
          <Avatar 
            sx={{ 
              width: 64, 
              height: 64, 
              mb: 1,
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              border: '2px solid white'
            }}
          >
            C
          </Avatar>
          <Typography variant="subtitle1" fontWeight="bold">Coach</Typography>
          <Typography variant="body2" color="text.secondary">Head Coach</Typography>
        </UserSection>
      )}
      
      {!open && (
        <LogoContainer>
          <Box className="sidebar-icon" sx={{ opacity: 1 }}>
            <Logo3D width={48} height={48} />
          </Box>
        </LogoContainer>
      )}
      
      {/* Active menu item indicator */}
      <Box
        className="active-menu-indicator"
        sx={{
          position: 'absolute',
          left: 0,
          width: 4,
          height: 32,
          backgroundColor: 'secondary.main',
          borderTopRightRadius: 4,
          borderBottomRightRadius: 4,
          boxShadow: '0 0 8px rgba(255, 193, 7, 0.5)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: 'translate(0, 24px)',
          opacity: open ? 1 : 0,
          zIndex: 0,
        }}
      />
      
      <List sx={{ flexGrow: 1, position: 'relative' }}>
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem 
              key={item.text} 
              disablePadding 
              sx={{ overflow: 'hidden' }}
              ref={el => {
                if (listItemsRef.current && el) {
                  listItemsRef.current[index] = el;
                }
              }}
            >
              <StyledListItemButton
                active={isActive ? 1 : 0}
                onClick={() => handleNavigation(item.path)}
                data-path={item.path}
              >
                <Tooltip title={open ? '' : item.text} placement="right" arrow>
                  <ListItemIcon
                    className="sidebar-icon"
                    sx={{ 
                      color: isActive ? 'secondary.contrastText' : 'inherit',
                      minWidth: open ? 36 : 'auto',
                      mr: open ? 1 : 'auto',
                      justifyContent: 'center',
                      opacity: 1
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                </Tooltip>
                {open && <ListItemText primary={item.text} />}
              </StyledListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      <BottomSection>
        {open ? (
          <>
            <Divider sx={{ mb: 2 }} />
            <StyledListItemButton onClick={() => navigate('/dashboard/settings')}>
              <ListItemIcon className="sidebar-icon" sx={{ opacity: 1 }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </StyledListItemButton>
            <StyledListItemButton onClick={handleLogout}>
              <ListItemIcon className="sidebar-icon" sx={{ opacity: 1 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </StyledListItemButton>
          </>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Settings" placement="right" arrow>
              <IconButton className="sidebar-icon" sx={{ opacity: 1 }} onClick={() => navigate('/dashboard/settings')}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Logout" placement="right" arrow>
              <IconButton className="sidebar-icon" sx={{ opacity: 1 }} onClick={handleLogout}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </BottomSection>
    </>
  );
  
  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={toggleSidebar}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: 240,
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop persistent drawer */}
      <Drawer
        variant="permanent"
        ref={sidebarRef}
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            width: open ? 240 : 64,
            transition: theme.transitions.create(['width', 'transform'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
            backgroundColor: theme.palette.background.paper,
            overflow: 'hidden',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            borderRight: 'none',
            height: '100%',
          },
        }}
        open={open}
      >
        {drawerContent}
      </Drawer>
    </>
  );
} 