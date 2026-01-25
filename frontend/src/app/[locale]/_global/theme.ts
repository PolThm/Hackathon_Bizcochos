'use client';
import { Roboto, Wix_Madefor_Display } from 'next/font/google';
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const titlePolice = Wix_Madefor_Display({
  weight: ['400'],
  subsets: ['latin'],
  display: 'swap',
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#0D0509',
    },
    secondary: {
      main: '#D6C3A5',
    },
    error: {
      main: red[600],
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    action: {
      disabled: '#bfbfbf',
      hover: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
    h1: {
      fontFamily: titlePolice.style.fontFamily,
      fontWeight: 400,
      fontSize: '2rem',
      letterSpacing: '0.1em',
      '@media (min-width:600px)': {
        fontSize: '2.5rem',
      },
    },
    h2: {
      fontWeight: 700,
      fontSize: '1.75rem',
      '@media (min-width:600px)': {
        fontSize: '2rem',
      },
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.5rem',
      '@media (min-width:600px)': {
        fontSize: '1.75rem',
      },
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.25rem',
      '@media (min-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h5: {
      fontWeight: 400,
      fontSize: '1rem',
      '@media (min-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h6: {
      fontWeight: 400,
      fontSize: '0.875rem',
      '@media (min-width:600px)': {
        fontSize: '1rem',
      },
    },
    body1: {
      fontSize: '0.875rem',
      '@media (min-width:600px)': {
        fontSize: '1rem',
      },
    },
    body2: {
      fontSize: '0.75rem',
      '@media (min-width:600px)': {
        fontSize: '0.875rem',
      },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minWidth: '50%',
        },
      },
    },
  },
});

export default theme;
