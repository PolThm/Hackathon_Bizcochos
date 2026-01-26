'use client';

import { useState, useEffect, Fragment } from 'react';
import {
  Button,
  Snackbar,
  Box,
  Typography,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  Slide,
  IconButton,
} from '@mui/material';
import {
  Download,
  Close,
  PhoneAndroid,
  IosShare,
  Apple,
  Share,
} from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import theme from '@/app/[locale]/_global/theme';
import { usePWAInstall } from '@/hooks/usePWA';

export default function PWAInstallPrompt() {
  const t = useTranslations('pwa.installPrompt');
  const tInstructions = useTranslations('pwa.installPrompt.instructions');

  const {
    isVisible,
    isInstalled,
    isMounted,
    showManualInstructions,
    handleInstallClick,
    handleDismiss,
    handleCloseManualInstructions,
  } = usePWAInstall();

  // SSR-safe device detection
  const [deviceInfo, setDeviceInfo] = useState({
    isIOS: false,
    isAndroid: false,
    isMobile: false,
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIOS =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (navigator.maxTouchPoints > 1 && /Macintosh/.test(userAgent));
    const isAndroid = /Android/.test(userAgent);
    const isMobile =
      isIOS ||
      isAndroid ||
      /webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
      (window.innerWidth <= 768 && navigator.maxTouchPoints > 0);

    setDeviceInfo({ isIOS, isAndroid, isMobile });
  }, []);

  // Don't render on server, on desktop, or if already installed
  if (!isMounted || !deviceInfo.isMobile || isInstalled) {
    return null;
  }

  return (
    <>
      {/* Install Prompt Snackbar */}
      <Snackbar
        open={isVisible && !showManualInstructions}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 2, px: 2 }}
        TransitionComponent={(props) => <Slide {...props} direction='up' />}
        // No onClose handler - prevents clickaway dismissal
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: 360,
            backgroundColor: theme.palette.secondary.main,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e0e0e0',
          }}
        >
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              {/* Download Button */}
              <Button
                onClick={handleInstallClick}
                sx={{
                  minWidth: 'auto',
                  p: 1,
                  backgroundColor: '#0D0509',
                  color: '#ffffff',
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: '#1a0f14',
                  },
                }}
              >
                <Download fontSize='small' />
              </Button>

              {/* Text */}
              <Typography
                variant='body2'
                sx={{
                  color: '#333333',
                  fontWeight: 500,
                  lineHeight: 1.3,
                  fontSize: '0.875rem',
                  flex: 1,
                  cursor: 'pointer',
                }}
                onClick={handleInstallClick}
              >
                {t('title')}
              </Typography>

              {/* Close Button */}
              <IconButton
                onClick={handleDismiss}
                size='small'
                sx={{
                  color: '#666666',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    color: '#333333',
                  },
                }}
              >
                <Close fontSize='small' />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      </Snackbar>

      {/* Manual Installation Instructions Dialog */}
      <Dialog
        open={showManualInstructions}
        onClose={handleCloseManualInstructions}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {tInstructions('title')}
          <IconButton
            onClick={handleCloseManualInstructions}
            size='small'
            sx={{ ml: 2 }}
          >
            <Close fontSize='small' />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {deviceInfo.isIOS ? (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Apple sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant='body1' sx={{ fontWeight: 600 }}>
                    iPhone
                  </Typography>
                </Box>
                <Box component='ol' sx={{ ml: 3, pl: 1, '& li': { mb: 1.5 } }}>
                  <Typography
                    component='li'
                    variant='body2'
                    sx={{ display: 'flex', alignItems: 'start' }}
                  >
                    <Box
                      component='span'
                      sx={{ fontWeight: 'bold', color: 'primary.main', mr: 1 }}
                    >
                      1.
                    </Box>
                    <Box component='span'>
                      {tInstructions('ios1')}
                      <IosShare
                        sx={{
                          ml: 0.5,
                          fontSize: '1rem',
                          verticalAlign: 'middle',
                        }}
                      />
                    </Box>
                  </Typography>
                  <Typography
                    component='li'
                    variant='body2'
                    sx={{ display: 'flex', alignItems: 'start' }}
                  >
                    <Box
                      component='span'
                      sx={{ fontWeight: 'bold', color: 'primary.main', mr: 1 }}
                    >
                      2.
                    </Box>
                    <Box component='span'>
                      <Fragment>
                        {tInstructions.rich('ios2', {
                          b: (chunks) => (
                            <Box
                              component='strong'
                              sx={{ fontWeight: 600 }}
                              key='bold'
                            >
                              {chunks}
                            </Box>
                          ),
                        })}
                      </Fragment>
                    </Box>
                  </Typography>
                </Box>
              </Box>
            ) : deviceInfo.isAndroid ? (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PhoneAndroid sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant='body1' sx={{ fontWeight: 600 }}>
                    Android
                  </Typography>
                </Box>
                <Box component='ol' sx={{ ml: 3, pl: 1, '& li': { mb: 1.5 } }}>
                  <Typography
                    component='li'
                    variant='body2'
                    sx={{ display: 'flex', alignItems: 'start' }}
                  >
                    <Box
                      component='span'
                      sx={{ fontWeight: 'bold', color: 'primary.main', mr: 1 }}
                    >
                      1.
                    </Box>
                    <Box component='span'>
                      <Fragment>
                        {tInstructions.rich('android1', {
                          b: (chunks) => (
                            <Box
                              component='strong'
                              sx={{ fontWeight: 600 }}
                              key='bold'
                            >
                              {chunks}
                            </Box>
                          ),
                        })}
                      </Fragment>
                    </Box>
                  </Typography>
                  <Typography
                    component='li'
                    variant='body2'
                    sx={{ display: 'flex', alignItems: 'start' }}
                  >
                    <Box
                      component='span'
                      sx={{ fontWeight: 'bold', color: 'primary.main', mr: 1 }}
                    >
                      2.
                    </Box>
                    <Box component='span'>
                      <Fragment>
                        {tInstructions.rich('android2', {
                          b: (chunks) => (
                            <Box
                              component='strong'
                              sx={{ fontWeight: 600 }}
                              key='bold'
                            >
                              {chunks}
                            </Box>
                          ),
                        })}
                      </Fragment>
                    </Box>
                  </Typography>
                  <Typography
                    component='li'
                    variant='body2'
                    sx={{ display: 'flex', alignItems: 'start' }}
                  >
                    <Box component='span'>
                      <Fragment>
                        {tInstructions.rich('android3', {
                          b: (chunks) => (
                            <Box
                              component='strong'
                              sx={{ fontWeight: 600 }}
                              key='bold'
                            >
                              {chunks}
                            </Box>
                          ),
                        })}
                      </Fragment>
                    </Box>
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Share sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant='body1' sx={{ fontWeight: 600 }}>
                    {tInstructions('otherLabel')}
                  </Typography>
                </Box>
                <Typography variant='body2' component='div'>
                  <Fragment>
                    {tInstructions.rich('other', {
                      b: (chunks) => (
                        <Box
                          component='strong'
                          sx={{ fontWeight: 600 }}
                          key='bold'
                        >
                          {chunks}
                        </Box>
                      ),
                    })}
                  </Fragment>
                </Typography>
              </Box>
            )}

            <Typography
              variant='caption'
              sx={{ color: 'text.secondary', display: 'block', mt: 2 }}
            >
              {tInstructions('intro')}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
