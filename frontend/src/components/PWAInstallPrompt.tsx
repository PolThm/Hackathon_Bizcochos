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
  DialogActions,
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
    showInstallPrompt,
    isInstalled,
    showManualInstructions,
    setShowManualInstructions,
    handleCloseManualInstructions,
    handleInstallClick,
    handleDismiss,
  } = usePWAInstall();

  const [isExiting, setIsExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Detect platform
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  const isAndroid = /Android/.test(navigator.userAgent);

  // Detect if device is mobile (iOS, Android, or other mobile devices)
  const isMobile =
    isIOS ||
    isAndroid ||
    /webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (typeof window !== 'undefined' &&
      window.innerWidth <= 768 &&
      navigator.maxTouchPoints > 0);

  useEffect(() => {
    if (showInstallPrompt && !isInstalled) {
      setShouldRender(true);
      setIsExiting(false);
    } else if (!showInstallPrompt && shouldRender) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsExiting(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showInstallPrompt, isInstalled, shouldRender]);

  // Don't show on desktop or if we shouldn't render
  if (!isMobile || ((isInstalled || !shouldRender) && !isExiting)) {
    return null;
  }

  return (
    <>
      {/* Install Prompt Snackbar */}
      <Snackbar
        open={shouldRender && !showManualInstructions}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 2, px: 2 }}
        autoHideDuration={null}
        TransitionComponent={(props) => <Slide {...props} direction='up' />}
        TransitionProps={{
          timeout: 500,
        }}
        onClose={handleDismiss}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: 360,
            backgroundColor: theme.palette.secondary.main,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e0e0e0',
            cursor: 'pointer',
          }}
          onClick={handleInstallClick}
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleInstallClick();
                }}
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
                }}
              >
                {t('title')}
              </Typography>

              {/* Close Button */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                sx={{
                  minWidth: 'auto',
                  p: 0.5,
                  color: '#666666',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    color: '#333333',
                  },
                }}
              >
                <Close fontSize='small' />
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Snackbar>

      {/* Manual Installation Instructions Dialog */}
      <Dialog
        open={showManualInstructions}
        onClose={(event, reason) => {
          console.log('[PWA] Dialog onClose called', { reason });
          // Only close if clicking outside or pressing escape
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            handleCloseManualInstructions();
          }
        }}
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
            {isIOS ? (
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
            ) : isAndroid ? (
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
