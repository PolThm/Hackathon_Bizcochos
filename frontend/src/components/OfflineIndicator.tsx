'use client';

import { Snackbar, Alert, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useOnlineStatus } from '@/hooks/usePWA';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const t = useTranslations('pwa.offline');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setOpen(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setOpen(false);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setOpen(false);
    }
  }, [isOnline]);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ mb: 2 }}
    >
      <Alert
        severity='warning'
        action={
          <IconButton
            size='small'
            aria-label='close'
            color='inherit'
            onClick={handleClose}
          >
            <Close fontSize='small' />
          </IconButton>
        }
        sx={{ width: '100%' }}
      >
        {t('message')}
      </Alert>
    </Snackbar>
  );
}
