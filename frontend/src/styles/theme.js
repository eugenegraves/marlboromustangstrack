import { createTheme } from '@mui/material/styles';

// Team colors
const navyBlue = '#1C2526';
const darkerNavy = '#0F1516'; // Darker navy for hover effects
const yellow = '#FFC107';
const darkerYellow = '#FFB300'; // Darker yellow for hover effects
const white = '#FFFFFF';

// Create a custom theme with the team's colors
const theme = createTheme({
  palette: {
    primary: {
      main: navyBlue,
      dark: darkerNavy,
      contrastText: white,
    },
    secondary: {
      main: yellow,
      dark: darkerYellow,
      contrastText: navyBlue,
    },
    background: {
      default: '#F5F7F9', // Light gray background
      paper: white,
    },
    text: {
      primary: navyBlue,
      secondary: '#455A64', // Slightly lighter text for secondary content
    },
    error: {
      main: '#EF5350',
    },
    warning: {
      main: '#FF9800',
    },
    info: {
      main: '#2196F3',
    },
    success: {
      main: '#4CAF50',
    },
  },
  typography: {
    fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.08)',
    '0px 6px 12px rgba(0, 0, 0, 0.10)',
    // ... rest of shadows
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        
        body {
          background-image: linear-gradient(to bottom, rgba(28, 37, 38, 0.03), rgba(255, 255, 255, 0));
          background-attachment: fixed;
          background-size: 100% 100%;
        }
        
        /* Add a subtle track pattern background */
        .dashboard-container {
          position: relative;
        }
        
        .dashboard-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 98h100v2H0v-2zm0-20h100v2H0v-2zM0 58h100v2H0v-2zm0-20h100v2H0v-2zM0 18h100v2H0v-2zM0 0h100v2H0V0z' fill='%231C2526' fill-opacity='0.03'/%3E%3C/svg%3E");
          background-size: 100px 100px;
          opacity: 0.5;
          z-index: -1;
          pointer-events: none;
        }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          transition: 'transform 0.3s, background-color 0.3s, box-shadow 0.3s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        },
        containedPrimary: {
          backgroundColor: navyBlue,
          '&:hover': {
            backgroundColor: darkerNavy,
          },
        },
        containedSecondary: {
          backgroundColor: yellow,
          color: navyBlue,
          '&:hover': {
            backgroundColor: darkerYellow,
          },
        },
        outlinedSecondary: {
          borderColor: yellow,
          color: navyBlue,
          '&:hover': {
            borderColor: darkerYellow,
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          transition: 'transform 0.3s, box-shadow 0.3s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
        colorPrimary: {
          backgroundColor: navyBlue,
        },
        colorSecondary: {
          backgroundColor: yellow,
          color: navyBlue,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          '& .MuiDataGrid-cell:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-columnHeader:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'rgba(255, 193, 7, 0.08)',
          },
        },
        columnHeaders: {
          backgroundColor: navyBlue,
          color: white,
          fontWeight: 600,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: navyBlue,
          color: white,
          fontWeight: 600,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: navyBlue,
          color: white,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
  },
});

export default theme; 