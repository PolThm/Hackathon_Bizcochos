'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { MODAL_MAX_WIDTH } from '@/constants/layout';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (profile: any) => void;
  handleConnectCalendar: () => void;
  googleConnected: boolean;
}

export default function OnboardingModal({
  isOpen,
  onComplete,
  handleConnectCalendar,
  googleConnected,
}: OnboardingModalProps) {
  const t = useTranslations('onboarding');
  const [activeStep, setActiveStep] = useState(0);
  const [profile, setProfile] = useState({
    name: '',
    level: 'Beginner',
    goals: 'Mobility',
    limitations: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (activeStep === 0 && profile.name) {
      setActiveStep(1);
    } else if (activeStep === 1) {
      onComplete(profile);
    }
  };

  return (
    <Dialog
      open={isOpen}
      fullWidth
      maxWidth='xs'
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: { sm: '90vh' },
          maxWidth: { sm: MODAL_MAX_WIDTH },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, textAlign: 'center' }}>
        {t('title')}
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          {t('subtitle')}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
          <Step>
            <StepLabel>{t('stepProfile')}</StepLabel>
          </Step>
          <Step>
            <StepLabel>{t('stepContext')}</StepLabel>
          </Step>
        </Stepper>

        {activeStep === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label={t('nameLabel')}
              name='name'
              fullWidth
              value={profile.name}
              onChange={handleChange}
              placeholder={t('namePlaceholder')}
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
            }}
          >
            <Typography variant='body1' textAlign='center'>
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
              }}
            >
              {googleConnected ? t('calendarConnected') : t('connectCalendar')}
            </Button>
            <Typography
              variant='caption'
              color='text.secondary'
              textAlign='center'
            >
              {t('calendarPrivacy')}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          fullWidth
          variant='contained'
          onClick={handleNext}
          disabled={activeStep === 0 && !profile.name}
          sx={{ py: 1.5, borderRadius: '12px', fontWeight: 600 }}
        >
          {activeStep === 0 ? t('continue') : t('finish')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
