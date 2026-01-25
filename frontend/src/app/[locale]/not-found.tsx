'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function NotFound() {
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
      <Typography variant='h5'>{t('pageNotFound')}</Typography>
      <Link href='/' passHref>
        <Button variant='contained'>{t('home')}</Button>
      </Link>
    </Box>
  );
}
