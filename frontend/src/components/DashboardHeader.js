import React, { useRef, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  useTheme, 
  useMediaQuery 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutButton from './LogoutButton';
import Logo3D from './Logo3D';
import { gsap } from 'gsap';

const DashboardHeader = ({ toggleSidebar }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const logoRef = useRef(null);
  
  // GSAP animation for the logo container
  useEffect(() => {
    // Animate logo container with a subtle bounce effect
    gsap.fromTo(
      logoRef.current,
      { rotation: -5, scale: 0.9, opacity: 0 },
      { 
        rotation: 0, 
        scale: 1, 
        opacity: 1, 
        duration: 1.2, 
        ease: 'elastic.out(1, 0.5)' 
      }
    );
  }, []);
  
  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        backgroundColor: 'primary.main'
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={toggleSidebar}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* 3D Logo */}
          <Box 
            ref={logoRef}
            sx={{ 
              height: 40, 
              width: 40,
              mr: 2,
              opacity: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }} 
          >
            <Logo3D width={40} height={40} />
          </Box>
          
          <Typography
            variant="h6"
            component="h1"
            noWrap
            sx={{
              fontWeight: 'bold',
              color: 'white',
              display: { xs: isMobile ? 'none' : 'block', sm: 'block' }
            }}
          >
            Track Team Dashboard
          </Typography>
        </Box>
        
        <LogoutButton />
      </Toolbar>
    </AppBar>
  );
};

export default DashboardHeader; 