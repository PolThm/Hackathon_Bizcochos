'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface ErrorBoundaryProps {
  reset: () => void;
}

export default function ErrorBoundary({ reset }: ErrorBoundaryProps) {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Typography variant='h5' gutterBottom>
        Oups, une erreur est survenue...
      </Typography>
      <Button variant='contained' onClick={reset}>
        RAFRAÎCHIR
      </Button>
    </Box>
  );
}
