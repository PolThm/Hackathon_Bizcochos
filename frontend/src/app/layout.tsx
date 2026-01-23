import type { Metadata } from 'next';
import './globals.css';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/theme';
import { ReactNode } from 'react';
import { Container } from '@mui/material';
import Navbar from '@/app/Navbar';

export const metadata: Metadata = {
  title: 'Routines',
  description: 'Developed by Pol Thomas',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ key: 'css' }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Container
              maxWidth="xs"
              disableGutters
              sx={{
                border: '1px solid black',
                minHeight: '100dvh',
                display: 'flex',
                flexDirection: 'column',
              }}>
              <Navbar />
              <Container sx={{ pt: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                {children}
              </Container>
            </Container>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
