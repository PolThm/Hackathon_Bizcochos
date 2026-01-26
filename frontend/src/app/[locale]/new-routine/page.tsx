'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Fade,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/routing';
import { getItem, setItem } from '@/utils/indexedDB';
import { Routine, Exercise } from '@/types';

interface LoadingStateProps {
  messages: string[];
}

function LoadingState({ messages }: LoadingStateProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);

      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        setFadeIn(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        gap: 4,
        py: 6,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress
          size={80}
          thickness={3}
          sx={{
            color: 'secondary.main',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: 'secondary.main',
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  opacity: 0.4,
                  transform: 'scale(1)',
                },
                '50%': {
                  opacity: 1,
                  transform: 'scale(1.3)',
                },
              },
            }}
          />
        </Box>
      </Box>

      <Fade in={fadeIn} timeout={500}>
        <Box sx={{ minHeight: '60px', display: 'flex', alignItems: 'center' }}>
          <Typography
            variant='body1'
            sx={{
              textAlign: 'center',
              fontWeight: 400,
              px: 3,
              maxWidth: '350px',
              color: 'text.primary',
              lineHeight: 1.6,
            }}
          >
            {messages[currentMessageIndex]}
          </Typography>
        </Box>
      </Fade>

      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
        }}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'secondary.main',
              animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
              '@keyframes bounce': {
                '0%, 80%, 100%': {
                  transform: 'scale(0.6)',
                  opacity: 0.3,
                },
                '40%': {
                  transform: 'scale(1)',
                  opacity: 1,
                },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

export default function NewRoutinePage() {
  const t = useTranslations('newRoutine');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [userInput, setUserInput] = useState('');
  const [refinementInput, setRefinementInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposedRoutine, setProposedRoutine] = useState<Routine | null>(null);
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);

  // Get translated loading messages
  const loadingMessages = [
    t('loadingMessages.0'),
    t('loadingMessages.1'),
    t('loadingMessages.2'),
    t('loadingMessages.3'),
    t('loadingMessages.4'),
    t('loadingMessages.5'),
    t('loadingMessages.6'),
    t('loadingMessages.7'),
  ];

  // Restore proposed routine from sessionStorage on mount
  useEffect(() => {
    const savedProposedRoutine = sessionStorage.getItem('tempProposedRoutine');
    const savedUserInput = sessionStorage.getItem('tempUserInput');

    if (savedProposedRoutine) {
      try {
        setProposedRoutine(JSON.parse(savedProposedRoutine));
      } catch (error) {
        console.error('Failed to restore proposed routine:', error);
      }
    }

    if (savedUserInput) {
      setUserInput(savedUserInput);
    }
  }, []);

  // Save proposed routine to sessionStorage when it changes
  useEffect(() => {
    if (proposedRoutine) {
      sessionStorage.setItem(
        'tempProposedRoutine',
        JSON.stringify(proposedRoutine),
      );
      sessionStorage.setItem('tempUserInput', userInput);
    }
  }, [proposedRoutine, userInput]);

  const handleGenerateRoutine = async (isRefinement = false) => {
    const prompt = isRefinement
      ? `Original request: ${userInput}. Refinement request: ${refinementInput}`
      : userInput;

    if (!userInput.trim()) return;

    setIsGenerating(true);
    if (isRefinement) setIsRefineModalOpen(false);

    try {
      const response = await fetch('/api/generateRoutine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
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
        setRefinementInput(''); // Clear refinement after use
      }
    } catch (error) {
      console.error('Error generating routine:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartOver = () => {
    setProposedRoutine(null);
    setUserInput('');
    setRefinementInput('');
    setIsRefineModalOpen(false);
    // Clear temporary data from sessionStorage
    sessionStorage.removeItem('tempProposedRoutine');
    sessionStorage.removeItem('tempUserInput');
  };

  const handleSaveAndAction = async (path: '/setup' | '/practice') => {
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

      // Clear temporary data from sessionStorage after saving
      sessionStorage.removeItem('tempProposedRoutine');
      sessionStorage.removeItem('tempUserInput');

      router.push(path);
    } catch (error) {
      console.error('Error saving routine:', error);
    }
  };

  if (proposedRoutine) {
    if (isGenerating) {
      return <LoadingState messages={loadingMessages} />;
    }

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          width: '100%',
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

        <Typography
          variant='body1'
          sx={{ color: 'text.secondary', lineHeight: 1.6 }}
        >
          {t('introText')}
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
              proposedRoutine.exercises.reduce(
                (acc, ex) => acc + ex.duration,
                0,
              ) / 60,
            )}{' '}
            min
          </Typography>

          <Box sx={{ mt: 2, overflowY: 'auto' }}>
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
                <Typography
                  component={Link}
                  href={`/exercise/${ex.exerciseId}?from=new-routine`}
                  variant='body1'
                  sx={{
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    color: 'primary.main',
                    '&:hover': {
                      color: 'secondary.main',
                    },
                  }}
                >
                  {ex.name}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.7 }}>
                  {ex.duration}s
                </Typography>
              </Box>
            ))}
          </Box>

          <Typography
            variant='body2'
            sx={{
              mt: 2,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              color: 'text.secondary',
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            {t('exploreExercisesText')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Button
            fullWidth
            variant='contained'
            size='large'
            onClick={() => handleSaveAndAction('/practice')}
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
            onClick={() => setIsRefineModalOpen(true)}
            disabled={isGenerating}
            sx={{ py: 1, fontWeight: 500 }}
          >
            {isGenerating ? t('generating') : t('retryButton')}
          </Button>
        </Box>

        <Dialog
          open={isRefineModalOpen}
          onClose={() => setIsRefineModalOpen(false)}
          fullWidth
          maxWidth='sm'
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: isMobile ? 0 : 3,
              p: isMobile ? 0 : 1,
              maxHeight: isMobile ? '100%' : '90vh',
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              pb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <IconButton
              onClick={() => setIsRefineModalOpen(false)}
              sx={{ color: 'text.primary' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant='h6' sx={{ fontWeight: 700, flex: 1 }}>
              {t('refineModalTitle')}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant='body2' sx={{ mb: 2, color: 'text.secondary' }}>
              {t('invitationText')}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant='outlined'
              placeholder={t('refinePlaceholder')}
              value={refinementInput}
              onChange={(e) => setRefinementInput(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <Button
              fullWidth
              variant='contained'
              onClick={() => handleGenerateRoutine(true)}
              disabled={!refinementInput.trim() || isGenerating}
              sx={{ borderRadius: 2, py: 1.5, fontWeight: 600 }}
            >
              {t('refineButton')}
            </Button>

            <Divider sx={{ my: 3 }}>
              <Typography variant='caption' color='text.secondary'>
                {tCommon('or')}
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant='outlined'
              onClick={handleStartOver}
              sx={{ borderRadius: 2, py: 1, fontWeight: 500 }}
            >
              {t('startOverButton')}
            </Button>
          </DialogContent>
        </Dialog>
      </Box>
    );
  }

  if (isGenerating) {
    return <LoadingState messages={loadingMessages} />;
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
        onClick={() => handleGenerateRoutine(false)}
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
