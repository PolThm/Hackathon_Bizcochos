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
        Welcome to Bizcochos!
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          Let's personalize your daily sessions.
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
          <Step>
            <StepLabel>Profile</StepLabel>
          </Step>
          <Step>
            <StepLabel>Context</StepLabel>
          </Step>
        </Stepper>

        {activeStep === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="What's your name?"
              name='name'
              fullWidth
              value={profile.name}
              onChange={handleChange}
              placeholder='e.g. Alessio'
              required
            />
            <TextField
              select
              label='Fitness Level'
              name='level'
              fullWidth
              value={profile.level}
              onChange={handleChange}
            >
              <MenuItem value='Beginner'>Beginner</MenuItem>
              <MenuItem value='Intermediate'>Intermediate</MenuItem>
              <MenuItem value='Advanced'>Advanced</MenuItem>
            </TextField>
            <TextField
              select
              label='Primary Goal'
              name='goals'
              fullWidth
              value={profile.goals}
              onChange={handleChange}
            >
              <MenuItem value='Mobility'>Mobility & Flexibility</MenuItem>
              <MenuItem value='Strength'>Strength & Tone</MenuItem>
              <MenuItem value='Recovery'>Recovery & Pain Relief</MenuItem>
            </TextField>
            <TextField
              label='Injuries or Limitations?'
              name='limitations'
              fullWidth
              multiline
              rows={2}
              value={profile.limitations}
              onChange={handleChange}
              placeholder='e.g. Lower back pain, stiff neck...'
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
              Connect your Google Calendar to allow the AI to adapt your
              routines to your schedule.
            </Typography>
            <Button
              variant='outlined'
              onClick={handleConnectCalendar}
              disabled={googleConnected}
              startIcon={
                <Image
                  src='https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png'
                  alt='Google Calendar'
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
              {googleConnected
                ? 'Calendar Connected!'
                : 'Connect Google Calendar'}
            </Button>
            <Typography
              variant='caption'
              color='text.secondary'
              textAlign='center'
            >
              We only read your schedule to optimize exercise timing.
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
          {activeStep === 0 ? 'Continue' : 'Finish Onboarding'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
