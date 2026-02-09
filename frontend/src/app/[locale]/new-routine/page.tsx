'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import { getItem, setItem } from '@/utils/indexedDB';
import { useExercises } from '@/hooks/useExercises';
import { API_BASE_URL } from '@/utils/config';
import { Routine } from '@/types';
import { MODAL_MAX_WIDTH } from '@/constants/layout';
import LoadingState from '@/components/LoadingState';

const CAROUSEL_INTERVAL_MS = 4000;
const CAROUSEL_SWIPE_PAUSE_MS = 10000;
const CAROUSEL_SWIPE_THRESHOLD_PX = 50;
const CAROUSEL_INDEX_STORAGE_KEY_PREFIX = 'newRoutineCarouselIndex_';

export default function NewRoutinePage() {
  const t = useTranslations('newRoutine');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [userInput, setUserInput] = useState('');
  const [refinementInput, setRefinementInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposedRoutine, setProposedRoutine] = useState<Routine | null>(null);
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [skipCarouselTransition, setSkipCarouselTransition] = useState(false);
  const autoScrollPausedUntilRef = useRef(0);
  const touchStartXRef = useRef<number | null>(null);
  const swipeHandledRef = useRef(false);
  const exercisesLibrary = useExercises(locale);

  // Resolve exercise images from library (by locale)
  const exercisesWithImage = useMemo(() => {
    if (!proposedRoutine) return [];
    return proposedRoutine.exercises.map((ex) => ({
      ...ex,
      image: exercisesLibrary.find((e) => e.id === ex.exerciseId)?.image ?? '',
    }));
  }, [proposedRoutine, exercisesLibrary]);

  const exerciseCount = exercisesWithImage.length;

  // Auto-advance carousel (skipped while paused after swipe)
  useEffect(() => {
    if (!proposedRoutine || exerciseCount <= 1) return;
    const id = setInterval(() => {
      if (Date.now() < autoScrollPausedUntilRef.current) return;
      setCarouselIndex((prev) => (prev >= exerciseCount - 1 ? 0 : prev + 1));
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [proposedRoutine, exerciseCount]);

  // Restore carousel index when routine is loaded (e.g. back from exercise page)
  useEffect(() => {
    if (!proposedRoutine?.id || exerciseCount <= 0) return;
    const key = `${CAROUSEL_INDEX_STORAGE_KEY_PREFIX}${proposedRoutine.id}`;
    const saved = sessionStorage.getItem(key);
    const idx = saved !== null ? parseInt(saved, 10) : 0;
    if (!isNaN(idx) && idx >= 0 && idx < exerciseCount) {
      setSkipCarouselTransition(true);
      setCarouselIndex(idx);
    } else {
      setCarouselIndex(0);
    }
  }, [proposedRoutine?.id, exerciseCount]);

  // Re-enable transition after restore (avoids fast scroll-through on back)
  useEffect(() => {
    if (!skipCarouselTransition) return;
    const id = setTimeout(() => setSkipCarouselTransition(false), 0);
    return () => clearTimeout(id);
  }, [skipCarouselTransition]);

  // Persist carousel index so it's restored when returning from exercise detail
  useEffect(() => {
    if (!proposedRoutine?.id) return;
    const key = `${CAROUSEL_INDEX_STORAGE_KEY_PREFIX}${proposedRoutine.id}`;
    sessionStorage.setItem(key, String(carouselIndex));
  }, [proposedRoutine?.id, carouselIndex]);

  const handleCarouselSwipe = useCallback(
    (direction: 'prev' | 'next') => {
      setCarouselIndex((prev) => {
        if (direction === 'next') {
          return prev >= exerciseCount - 1 ? 0 : prev + 1;
        }
        return prev <= 0 ? exerciseCount - 1 : prev - 1;
      });
      autoScrollPausedUntilRef.current = Date.now() + CAROUSEL_SWIPE_PAUSE_MS;
      swipeHandledRef.current = true;
    },
    [exerciseCount],
  );

  const handleCarouselTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    swipeHandledRef.current = false;
  }, []);

  const handleCarouselTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const startX = touchStartXRef.current;
      if (startX === null) return;
      touchStartXRef.current = null;
      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - startX;
      if (Math.abs(deltaX) < CAROUSEL_SWIPE_THRESHOLD_PX) return;
      e.preventDefault();
      handleCarouselSwipe(deltaX > 0 ? 'prev' : 'next');
    },
    [handleCarouselSwipe],
  );

  const handleSlideClick = useCallback(
    (ex: (typeof exercisesWithImage)[0]) => {
      if (swipeHandledRef.current) {
        swipeHandledRef.current = false;
        return;
      }
      router.push(`/exercise/${ex.exerciseId}?from=new-routine`);
    },
    [router],
  );

  // Get translated loading messages
  const loadingMessages = Array.from({ length: 30 }, (_, i) =>
    t(`loadingMessages.${i}`),
  );

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
    console.log('Routine generation may take some time, please be patient...');

    try {
      const saved = await getItem('isDemoActivated');
      const isDemoActivated = saved === true || saved === 'true';
      const response = await fetch(`${API_BASE_URL}/api/generateRoutine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          locale,
          isDemoActivated: !!isDemoActivated,
        }),
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
          description: apiRoutine.description,
          breakDuration: 5, // Always set to 5 seconds
          preparationDuration: 5, // Always set to 5 seconds
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

        <Box
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant='h5' gutterBottom sx={{ fontWeight: 700 }}>
            {proposedRoutine.name}
          </Typography>
          {proposedRoutine.description && (
            <Typography
              variant='body2'
              sx={{
                color: 'text.secondary',
                lineHeight: 1.6,
                mb: 1.5,
                fontStyle: 'italic',
              }}
            >
              {proposedRoutine.description}
            </Typography>
          )}
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

          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                overflow: 'hidden',
                borderRadius: 2,
                position: 'relative',
                touchAction: 'pan-y',
              }}
              onTouchStart={handleCarouselTouchStart}
              onTouchEnd={handleCarouselTouchEnd}
            >
              <Box
                sx={{
                  display: 'flex',
                  transition: skipCarouselTransition
                    ? 'none'
                    : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  transform: `translateX(-${carouselIndex * 100}%)`,
                }}
              >
                {exercisesWithImage.map((ex) => (
                  <Box
                    key={ex.id}
                    role='button'
                    tabIndex={0}
                    onClick={() => handleSlideClick(ex)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSlideClick(ex);
                      }
                    }}
                    sx={{
                      flex: '0 0 100%',
                      minWidth: 0,
                      cursor: 'pointer',
                      display: 'block',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: 'action.hover',
                        aspectRatio: '4/3',
                      }}
                    >
                      {ex.image ? (
                        <Image
                          src={ex.image}
                          alt={ex.name}
                          fill
                          sizes='(max-width: 600px) 100vw, 400px'
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant='body2' color='text.secondary'>
                            {ex.name}
                          </Typography>
                        </Box>
                      )}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          px: 1.5,
                          py: 1,
                          background:
                            'linear-gradient(transparent, rgba(0,0,0,0.6))',
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography
                          variant='body2'
                          sx={{
                            color: 'white',
                            fontWeight: 600,
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                          }}
                        >
                          {ex.name}
                        </Typography>
                        <Typography
                          variant='caption'
                          sx={{
                            color: 'rgba(255,255,255,0.9)',
                            fontWeight: 500,
                          }}
                        >
                          {ex.duration}s
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
              {exercisesWithImage.length > 1 && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 0.75,
                    mt: 1.5,
                  }}
                >
                  {exercisesWithImage.map((_, index) => (
                    <Box
                      key={index}
                      onClick={() => setCarouselIndex(index)}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor:
                          index === carouselIndex
                            ? 'primary.main'
                            : 'action.selected',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s, transform 0.2s',
                        '&:hover': {
                          bgcolor:
                            index === carouselIndex
                              ? 'primary.dark'
                              : 'action.hover',
                          transform: 'scale(1.2)',
                        },
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
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

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
            sx={{ py: 1, fontWeight: 500, textDecoration: 'underline' }}
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
              borderRadius: { sm: 2 },
              maxHeight: { sm: '90vh' },
              maxWidth: { sm: MODAL_MAX_WIDTH },
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
