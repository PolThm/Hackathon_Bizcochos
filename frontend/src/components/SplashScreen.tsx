'use client';

import { useEffect, useState } from 'react';
import { Box } from '@mui/material';

/**
 * Splash overlay for mobile PWA. Renders as sibling (not wrapper) to avoid hydration issues.
 * Hidden on desktop via CSS media query - no JS detection needed.
 */
export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: { xs: 'flex', sm: 'none' },
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#FDDDBD', // Logo background color
        pb: 'env(safe-area-inset-bottom)',
        pl: 'env(safe-area-inset-left)',
        pr: 'env(safe-area-inset-right)',
        pt: 'env(safe-area-inset-top)',
        transition: 'opacity 300ms',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <Box
        component='img'
        src='/icons-256.png'
        alt='Logo'
        sx={{
          height: 128,
          width: 128,
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.7 },
          },
        }}
      />
    </Box>
  );
}
