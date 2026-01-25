'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useTranslations } from 'next-intl';

interface ErrorBoundaryProps {
  reset: () => void;
}

export default function ErrorBoundary({ reset }: ErrorBoundaryProps) {
  const t = useTranslations('common');

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
        {t('error')}
      </Typography>
      <Button variant='contained' onClick={reset}>
        {t('refresh')}
      </Button>
    </Box>
  );
}
