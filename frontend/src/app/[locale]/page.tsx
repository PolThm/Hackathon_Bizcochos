'use client';

import { Link } from '@/i18n/routing';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useObjectStorage } from '@/hooks/useStorage';
import type { Routine } from '@/types';

export default function Home() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const theme = useTheme();
  const [allRoutines, , , isLoading] = useObjectStorage<Routine[]>(
    'allRoutines',
    [],
  );
  const hasNoRoutines = allRoutines.length === 0;

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: 3,
        py: 4,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background element */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: theme.palette.secondary.main,
          opacity: 0.1,
          [theme.breakpoints.up('md')]: {
            width: '200px',
            height: '200px',
            top: '15%',
            right: '10%',
          },
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          left: '5%',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: theme.palette.primary.main,
          opacity: 0.05,
          [theme.breakpoints.up('md')]: {
            width: '150px',
            height: '150px',
            bottom: '20%',
            left: '10%',
          },
        }}
      />

      {/* Main content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '600px',
          zIndex: 1,
        }}
      >
        <Typography
          variant='h1'
          sx={{
            mb: 2,
            fontSize: '2.5rem !important',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            [theme.breakpoints.up('md')]: {
              fontSize: '3.5rem !important',
            },
          }}
        >
          ROUTINES
        </Typography>

        <Typography
          variant='h4'
          sx={{
            color: theme.palette.primary.main,
            fontWeight: 400,
            opacity: 0.8,
            mb: 6,
          }}
        >
          {t('welcome')}
        </Typography>

        {isLoading ? (
          <div
            style={{
              minHeight: '168px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress sx={{ color: theme.palette.secondary.main }} />
          </div>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              width: '100%',
              maxWidth: '320px',
              minHeight: '168px',
            }}
          >
            {!hasNoRoutines && (
              <Button
                variant='contained'
                size='large'
                component={Link}
                href='/practice'
                sx={{
                  py: 2.5,
                  px: 4,
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  backgroundColor: theme.palette.primary.main,
                  boxShadow: '0 4px 20px rgba(13, 5, 9, 0.15)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main,
                    opacity: 0.9,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 25px rgba(13, 5, 9, 0.2)',
                  },
                }}
              >
                {tCommon('goToPractice')}
              </Button>
            )}
            <Button
              variant='outlined'
              size='large'
              component={Link}
              href='/daily-routine'
              sx={{
                py: 2.5,
                px: 4,
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 500,
                textTransform: 'none',
                borderColor: theme.palette.secondary.main,
                color: theme.palette.secondary.main,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: theme.palette.secondary.main,
                  backgroundColor: 'rgba(214, 195, 165, 0.1)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {tCommon('dailyRoutine')}
            </Button>
            <Button
              variant={hasNoRoutines ? 'contained' : 'outlined'}
              size='large'
              component={Link}
              href='/new-routine'
              sx={{
                py: 2.5,
                px: 4,
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 500,
                textTransform: 'none',
                borderColor: theme.palette.primary.main,
                color: hasNoRoutines ? '#fff' : theme.palette.primary.main,
                backgroundColor: hasNoRoutines
                  ? theme.palette.primary.main
                  : 'transparent',
                boxShadow: hasNoRoutines
                  ? '0 4px 20px rgba(214, 195, 165, 0.15)'
                  : 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: theme.palette.secondary.main,
                  backgroundColor: theme.palette.secondary.main,
                  color: theme.palette.primary.main,
                  opacity: hasNoRoutines ? 0.9 : 1,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 25px rgba(214, 195, 165, 0.2)',
                },
              }}
            >
              {tCommon('createNewRoutineWithAI')}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
