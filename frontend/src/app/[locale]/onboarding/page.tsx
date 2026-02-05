'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  TextField,
  Typography,
  Box,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  useTheme,
} from '@mui/material';
import Image from 'next/image';
import Script from 'next/script';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { CONTENT_MAX_WIDTH } from '@/constants/layout';
import {
  GOOGLE_CLIENT_ID,
  STRAVA_CLIENT_ID,
  STRAVA_REDIRECT_URI,
  API_BASE_URL,
} from '@/utils/config';

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const theme = useTheme();
  const router = useRouter();

  const [activeStep, setActiveStep] = useState(0);
  const [profile, setProfile] = useState({
    name: '',
    level: 'Beginner',
    goals: 'Mobility',
    limitations: '',
  });
  const [googleConnected, setGoogleConnected] = useState(false);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [isGisLoaded, setIsGisLoaded] = useState(false);
  const authProcessing = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('googleAccessToken');
    setGoogleConnected(!!token);

    const sToken = localStorage.getItem('stravaAccessToken');
    setStravaConnected(!!sToken);

    // Handle Strava Redirect
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code && !authProcessing.current) {
        authProcessing.current = true;
        setActiveStep(1); // Restore context step
        // Exchange code for token
        fetch(`${API_BASE_URL}/api/auth/strava`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.access_token) {
              localStorage.setItem('stravaAccessToken', data.access_token);
              setStravaConnected(true);
              // Clean URL
              window.history.replaceState(
                {},
                document.title,
                window.location.pathname,
              );
            }
          })
          .catch((err) => console.error('Strava Auth Error:', err));
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleConnectCalendar = () => {
    if (!isGisLoaded) {
      console.error('Google Identity Services script not loaded');
      return;
    }

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/calendar.events',
        callback: (response: any) => {
          if (response.access_token) {
            localStorage.setItem('googleAccessToken', response.access_token);
            setGoogleConnected(true);
          }
        },
      });
      client.requestAccessToken();
    } catch (e) {
      console.error('Error initiating Google OAuth:', e);
    }
  };

  const handleConnectStrava = () => {
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
      STRAVA_REDIRECT_URI,
    )}&approval_prompt=auto&scope=activity:read_all`;
  };

  const handleNext = () => {
    if (activeStep === 0 && profile.name) {
      setActiveStep(1);
    } else if (activeStep === 1) {
      localStorage.setItem('userProfile', JSON.stringify(profile));
      router.replace('/');
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: CONTENT_MAX_WIDTH,
        margin: '0 auto',
        width: '100%',
        px: 2,
        py: 3,
      }}
    >
      <Script
        src='https://accounts.google.com/gsi/client'
        onLoad={() => setIsGisLoaded(true)}
      />

      <Typography
        variant='h4'
        sx={{
          fontWeight: 700,
          textAlign: 'center',
          color: theme.palette.primary.main,
          mb: 1,
        }}
      >
        {t('title')}
      </Typography>
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ textAlign: 'center', mb: 4 }}
      >
        {t('subtitle')}
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4, width: '100%' }}>
        <Step>
          <StepLabel>{t('stepProfile')}</StepLabel>
        </Step>
        <Step>
          <StepLabel>{t('stepContext')}</StepLabel>
        </Step>
      </Stepper>

      {activeStep === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            width: '100%',
          }}
        >
          <TextField
            label={t('nameLabel')}
            name='name'
            fullWidth
            value={profile.name}
            onChange={handleChange}
            placeholder={t('namePlaceholder')}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            select
            label={t('fitnessLevel')}
            name='level'
            fullWidth
            value={profile.level}
            onChange={handleChange}
          >
            <MenuItem value='Beginner'>{t('levelBeginner')}</MenuItem>
            <MenuItem value='Intermediate'>{t('levelIntermediate')}</MenuItem>
            <MenuItem value='Advanced'>{t('levelAdvanced')}</MenuItem>
          </TextField>
          <TextField
            select
            label={t('primaryGoal')}
            name='goals'
            fullWidth
            value={profile.goals}
            onChange={handleChange}
          >
            <MenuItem value='Mobility'>{t('goalMobility')}</MenuItem>
            <MenuItem value='Strength'>{t('goalStrength')}</MenuItem>
            <MenuItem value='Recovery'>{t('goalRecovery')}</MenuItem>
          </TextField>
          <TextField
            label={t('limitationsLabel')}
            name='limitations'
            fullWidth
            multiline
            rows={2}
            value={profile.limitations}
            onChange={handleChange}
            placeholder={t('limitationsPlaceholder')}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            py: 2,
            width: '100%',
          }}
        >
          {/* Calendar Section */}
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <Typography variant='body1' textAlign='left' sx={{ mb: 2 }}>
              {t('calendarIntro')}
            </Typography>
            <Button
              variant='outlined'
              onClick={handleConnectCalendar}
              disabled={googleConnected}
              startIcon={
                <Image
                  src='https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png'
                  alt={t('googleCalendarAlt')}
                  width={24}
                  height={24}
                />
              }
              sx={{
                borderRadius: '12px',
                py: 1.5,
                px: 4,
                textTransform: 'none',
                borderColor: googleConnected
                  ? 'success.main'
                  : 'rgba(0,0,0,0.1)',
                color: googleConnected ? 'success.main' : 'text.primary',
                width: '100%',
              }}
            >
              {googleConnected ? t('calendarConnected') : t('connectCalendar')}
            </Button>
            <Typography
              variant='caption'
              color='text.secondary'
              textAlign='center'
              display='block'
              sx={{ mt: 1 }}
            >
              {t('calendarPrivacy')}
            </Typography>
          </Box>

          {/* Strava Section */}
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <Typography variant='body1' textAlign='left' sx={{ mb: 2 }}>
              {t('stravaIntro')}
            </Typography>
            <Button
              variant='outlined'
              onClick={handleConnectStrava}
              disabled={stravaConnected}
              startIcon={
                <Image
                  src='/images/strava-logo.svg'
                  alt={t('stravaAlt')}
                  width={24}
                  height={24}
                  style={{ objectFit: 'contain' }}
                />
              }
              sx={{
                borderRadius: '12px',
                py: 1.5,
                px: 4,
                textTransform: 'none',
                borderColor: stravaConnected
                  ? 'success.main'
                  : 'rgba(0,0,0,0.1)',
                color: stravaConnected ? 'success.main' : 'text.primary',
                width: '100%',
              }}
            >
              {stravaConnected ? t('stravaConnected') : t('connectStrava')}
            </Button>
            <Typography
              variant='caption'
              color='text.secondary'
              textAlign='center'
              display='block'
              sx={{ mt: 1 }}
            >
              {t('stravaPrivacy')}
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ mt: 'auto', width: '100%', pt: 4 }}>
        <Button
          fullWidth
          variant='contained'
          onClick={handleNext}
          disabled={activeStep === 0 && !profile.name}
          sx={{
            py: 1.5,
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
          }}
        >
          {activeStep === 0 ? t('continue') : t('finish')}
        </Button>
      </Box>
    </Box>
  );
}
