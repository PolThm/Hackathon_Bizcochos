'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import Link from 'next/link';

export default function NotFound() {
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
      <Typography variant='h5'>Page non trouvée...</Typography>
      <Link href='/' passHref>
        <Button variant='contained'>ACCUEIL</Button>
      </Link>
    </Box>
  );
}
