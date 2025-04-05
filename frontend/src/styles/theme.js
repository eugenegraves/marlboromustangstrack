import { createTheme } from '@mui/material/styles';

// Team colors
const navyBlue = '#1C2526';
const yellow = '#FFC107';
const white = '#FFFFFF';

// Create a custom theme with the team's colors
const theme = createTheme({
  palette: {
    primary: {
      main: navyBlue,
      contrastText: white,
    },
    secondary: {
      main: yellow,
      contrastText: navyBlue,
    },
    background: {
      default: white,
      paper: white,
    },
    text: {
      primary: navyBlue,
      secondary: navyBlue,
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#131A1B', // Darker navy blue
          },
        },
        containedSecondary: {
          '&:hover': {
            backgroundColor: '#E0A800', // Darker yellow
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

export default theme; 