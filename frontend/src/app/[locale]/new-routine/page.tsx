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
  const [proposedRoutine, setProposedRoutine] = useState<Routine | null>(null);

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

        const newRoutine: Routine = {
          id: apiRoutine.id,
          name: apiRoutine.name,
          breakDuration: apiRoutine.breakDuration,
          preparationDuration: apiRoutine.preparationDuration,
          exercises: apiRoutine.exercises.map((ex: any, index: number) => ({
            id: Date.now() + index,
            name: ex.name,
            duration: ex.duration,
            exerciseId: ex.id,
          })),
        };

        setProposedRoutine(newRoutine);
      }
    } catch (error) {
      console.error('Error generating routine:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndAction = async (path: '/' | '/setup') => {
    if (!proposedRoutine) return;

    try {
      const existingRoutinesStr = await getItem('allRoutines');
      const existingRoutines: Routine[] = existingRoutinesStr
        ? JSON.parse(existingRoutinesStr)
        : [];

      const routineExists = existingRoutines.some(
        (r) => r.id === proposedRoutine.id,
      );

      let updatedRoutines;
      if (routineExists) {
        updatedRoutines = existingRoutines.map((r) =>
          r.id === proposedRoutine.id ? proposedRoutine : r,
        );
      } else {
        updatedRoutines = [...existingRoutines, proposedRoutine];
      }

      await setItem('allRoutines', JSON.stringify(updatedRoutines));
      await setItem('routine', JSON.stringify(proposedRoutine));

      router.push(path);
    } catch (error) {
      console.error('Error saving routine:', error);
    }
  };

  if (proposedRoutine) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          maxWidth: '600px',
          mx: 'auto',
          gap: 3,
          py: 4,
        }}
      >
        <Typography
          variant='h4'
          textAlign='center'
          sx={{ textTransform: 'uppercase', mb: 1 }}
        >
          {t('propositionTitle')}
        </Typography>

        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: 'background.paper',
            boxShadow: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant='h5' gutterBottom sx={{ fontWeight: 700 }}>
            {proposedRoutine.name}
          </Typography>
          <Typography variant='body2' color='text.secondary' gutterBottom>
            {proposedRoutine.exercises.length} exercises •{' '}
            {Math.floor(
              proposedRoutine.exercises.reduce((acc, ex) => acc + ex.duration, 0) /
                60,
            )}{' '}
            min
          </Typography>

          <Box sx={{ mt: 2, maxHeight: '300px', overflowY: 'auto' }}>
            {proposedRoutine.exercises.map((ex, index) => (
              <Box
                key={ex.id}
                sx={{
                  py: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom:
                    index === proposedRoutine.exercises.length - 1
                      ? 'none'
                      : '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant='body1'>{ex.name}</Typography>
                <Typography variant='body2' sx={{ opacity: 0.7 }}>
                  {ex.duration}s
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Button
            fullWidth
            variant='contained'
            size='large'
            onClick={() => handleSaveAndAction('/')}
            sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
          >
            {t('startPractice')}
          </Button>

          <Button
            fullWidth
            variant='outlined'
            size='large'
            onClick={() => handleSaveAndAction('/setup')}
            sx={{ py: 1.5, borderRadius: 2, fontWeight: 600 }}
          >
            {t('editRoutine')}
          </Button>

          <Button
            fullWidth
            variant='text'
            size='medium'
            onClick={() => {
              setProposedRoutine(null);
              handleGenerateRoutine();
            }}
            disabled={isGenerating}
            sx={{ py: 1, fontWeight: 500 }}
          >
            {isGenerating ? t('generating') : t('retryButton')}
          </Button>
        </Box>
      </Box>
    );
  }

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
