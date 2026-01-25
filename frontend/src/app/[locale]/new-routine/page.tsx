'use client';

import { useState } from 'react';

import { Box, Typography, TextField, Button } from '@mui/material';

import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/routing';

import { getItem, setItem } from '@/utils/indexedDB';

import { Routine, Exercise } from '@/types';

export default function NewRoutinePage() {
  const t = useTranslations('newRoutine');

  const router = useRouter();

  const [userInput, setUserInput] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateRoutine = async () => {
    if (!userInput.trim()) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generateRoutine', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({ prompt: userInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate routine');
      }

      const result = await response.json();

      if (result.status === 'ok' && result.data) {
        const apiRoutine = result.data;

        // Map API response to our Routine type

        const newRoutine: Routine = {
          id: apiRoutine.id,

          name: apiRoutine.name,

          breakDuration: apiRoutine.breakDuration,

          preparationDuration: apiRoutine.preparationDuration,

          exercises: apiRoutine.exercises.map((ex: any, index: number) => ({
            id: Date.now() + index, // Generate numeric id

            name: ex.name,

            duration: ex.duration,

            exerciseId: ex.id, // The string ID from API goes here
          })),
        };

        // Save to IndexedDB

        const existingRoutinesStr = await getItem('allRoutines');

        const existingRoutines: Routine[] = existingRoutinesStr
          ? JSON.parse(existingRoutinesStr)
          : [];

        // Check if routine already exists to avoid duplicates

        const routineExists = existingRoutines.some(
          (r) => r.id === newRoutine.id,
        );

        let updatedRoutines;

        if (routineExists) {
          updatedRoutines = existingRoutines.map((r) =>
            r.id === newRoutine.id ? newRoutine : r,
          );
        } else {
          updatedRoutines = [...existingRoutines, newRoutine];
        }

        await setItem('allRoutines', JSON.stringify(updatedRoutines));

        await setItem('routine', JSON.stringify(newRoutine));

        // Redirect to the setup page for the new routine

        router.push('/setup');
      }
    } catch (error) {
      console.error('Error generating routine:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flex: 1,
        maxWidth: '600px',
        mx: 'auto',
        gap: 2,
      }}
    >
      <Typography
        variant='h3'
        textAlign='center'
        sx={{ textTransform: 'uppercase', mb: 2 }}
      >
        {t('title')}
      </Typography>

      <Typography
        variant='h6'
        sx={{
          fontWeight: 500,
        }}
      >
        {t('description')}
      </Typography>

      <Typography
        variant='body1'
        sx={{
          color: 'text.secondary',
          lineHeight: 1.6,
          mb: 1,
        }}
      >
        {t('invitationText')}
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={6}
        variant='outlined'
        placeholder={t('placeholder')}
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      />

      <Button
        fullWidth
        variant='contained'
        size='large'
        onClick={handleGenerateRoutine}
        disabled={!userInput.trim() || isGenerating}
        sx={{
          mt: 'auto',
          py: 1.5,
          borderRadius: 2,
          fontWeight: 600,
        }}
      >
        {isGenerating ? t('generating') : t('generateButton')}
      </Button>
    </Box>
  );
}
