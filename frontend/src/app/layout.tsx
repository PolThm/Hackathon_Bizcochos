import type { Metadata } from 'next';
import '@/app/_global/globals.css';
import theme from '@/app/_global/theme';
import Navbar from '@/app/_global/Navbar';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode } from 'react';
import { Container, Box } from '@mui/material';
import { ConsecutiveDaysProvider } from '@/contexts/ConsecutiveDaysContext';

export const metadata: Metadata = {
  title: 'Routines',
  description: 'Developed by Pol Thomas',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang='fr'>
      <body>
        <AppRouterCacheProvider options={{ key: 'css' }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <ConsecutiveDaysProvider>
              <Container
                maxWidth='xs'
                disableGutters
                sx={{
                  height: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  border: { sm: '1px solid' },
                  borderColor: 'secondary.main',
                }}
              >
                <Navbar />
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    '& > *': { padding: 2 },
                  }}
                >
                  {children}
                </Box>
              </Container>
            </ConsecutiveDaysProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
