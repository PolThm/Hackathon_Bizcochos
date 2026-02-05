'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/routing';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
  useTheme,
  Modal,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  ArrowBackIosNew as ArrowBackIosNewIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  Edit as EditIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  VolumeOff as VolumeOffIcon,
  VolumeUp as VolumeUpIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useWakeLock } from 'react-screen-wake-lock';
import { useTranslations } from 'next-intl';
import { MODAL_MAX_WIDTH } from '@/constants/layout';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { getExercisesByLocale } from '@/utils/exercises';

import { useConsecutiveDays } from '@/contexts/ConsecutiveDaysContext';
import SwitchRoutineTitle from '@/components/SwitchRoutineTitle';
// TODO: See if it's better to keep or remove the default routines
// import routineExampleEn from '@/mocks/routine-example-en.json';
// import routineExampleFr from '@/mocks/routine-example-fr.json';
// import routineExampleEs from '@/mocks/routine-example-es.json';
import { Routine, Exercise } from '@/types';
import { setItem, getItem } from '@/utils/indexedDB';
import { useObjectStorage } from '@/hooks/useStorage';

export default function Practice() {
  const { incrementConsecutiveDays } = useConsecutiveDays();
  const params = useParams();
  const currentLocale = params.locale as string;
  const allExercises = getExercisesByLocale(currentLocale);
  const theme = useTheme();
  const [allRoutines] = useObjectStorage<Routine[]>('allRoutines', []);
  const hasNoRoutines = allRoutines.length === 0;
  const tCommon = useTranslations('common');

  const [isRunning, setIsRunning] = useState(false);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [totalDuration, setTotalDuration] = useState('');
  const [initialExercisesAmount, setInitialExercisesAmount] = useState(0);
  const [preparationTime, setPreparationTime] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [routine, setRoutine] = useState<Routine>();
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeExercises, setActiveExercises] = useState<Exercise[]>([]);
  const [exerciseStartTime, setExerciseStartTime] = useState<number | null>(
    null,
  );
  const [currentExerciseDuration, setCurrentExerciseDuration] = useState(0);
  const [, setForceUpdate] = useState(0);
  const [isInExercise, setIsInExercise] = useState(false);
  const [pausedElapsedTime, setPausedElapsedTime] = useState<number | null>(
    null,
  );
  const [wasInBreakWhenPaused, setWasInBreakWhenPaused] = useState(false);
  const [wasInPreparationWhenPaused, setWasInPreparationWhenPaused] =
    useState(false);
  const [wasInExerciseWhenPaused, setWasInExerciseWhenPaused] = useState(false);
  const [pausedExerciseTimer, setPausedExerciseTimer] = useState<number | null>(
    null,
  ); // Store remaining exercise time when paused

  const isPreparationRef = useRef(true);
  const isBreakRef = useRef(false);
  const isResumingFromExerciseRef = useRef(false);

  const nextExerciseIndexRef = useRef<number>(0);

  // TODO: See if it's better to keep or remove the default routines
  // const getLocalizedRoutineExample = useCallback(() => {
  //   switch (currentLocale) {
  //     case 'fr':
  //       return routineExampleFr;
  //     case 'es':
  //       return routineExampleEs;
  //     default:
  //       return routineExampleEn;
  //   }
  // }, [currentLocale]);

  const t = useTranslations('home');
  const tExerciseDetails = useTranslations('exerciseDetails');

  // State for exercise details modal
  const [exerciseDetailsModalOpen, setExerciseDetailsModalOpen] =
    useState(false);
  const [selectedExercise, setSelectedExercise] = useState<{
    id: string;
    name: string;
    image: string;
    instructions: string[];
    tips: string[];
    modifications: string[];
    benefits: string[];
  } | null>(null);

  // Helper function to check if an exercise is from the library
  const isExerciseFromLibrary = useCallback(
    (exercise: Exercise): boolean => {
      if (!exercise.exerciseId) return false;
      return allExercises.some((ex) => ex.id === exercise.exerciseId);
    },
    [allExercises],
  );

  // Helper function to get library exercise details
  const getLibraryExerciseDetails = useCallback(
    (exerciseId: string) => allExercises.find((ex) => ex.id === exerciseId),
    [allExercises],
  );

  // Function to open exercise details modal
  const handleOpenExerciseDetails = useCallback(
    (exercise: Exercise) => {
      if (!isExerciseFromLibrary(exercise) || !exercise.exerciseId) return;

      const libraryExercise = getLibraryExerciseDetails(exercise.exerciseId);
      if (!libraryExercise) return;

      // Pause if running and not already paused (same as clicking Pause button)
      if (isRunning && !isPaused) {
        setIsPaused(true);
        // Store the current state (break/preparation/exercise)
        setWasInBreakWhenPaused(isBreakRef.current);
        setWasInPreparationWhenPaused(isPreparationRef.current);
        const inExercise =
          !isBreakRef.current && !isPreparationRef.current && isInExercise;
        setWasInExerciseWhenPaused(inExercise);

        // Store the current visual position of the progress bar (freeze where it is)
        if (inExercise && exerciseStartTime) {
          const elapsed = (Date.now() - exerciseStartTime) / 1000;
          setPausedElapsedTime(elapsed);
          setPausedExerciseTimer(timer); // Store remaining exercise time
        }
        if (intervalId) clearInterval(intervalId);
        getGlobalSounds()?.timerLoop?.pause();
      }

      setSelectedExercise(libraryExercise);
      setExerciseDetailsModalOpen(true);
    },
    [
      isExerciseFromLibrary,
      getLibraryExerciseDetails,
      isRunning,
      isPaused,
      intervalId,
      exerciseStartTime,
      timer,
      isInExercise,
    ],
  );

  // Function to close exercise details modal
  const handleCloseExerciseDetails = () => {
    setExerciseDetailsModalOpen(false);
    setSelectedExercise(null);
    // Don't resume automatically - stay paused
  };

  // Helper function to get global sounds
  const getGlobalSounds = (): Record<string, any> => {
    if (typeof window !== 'undefined' && (window as any).appSounds) {
      return (window as any).appSounds;
    }
    return {};
  };

  useEffect(() => {
    // Load muted state from IndexedDB
    const loadMutedState = async () => {
      try {
        const savedMutedState = await getItem('isMuted');
        if (savedMutedState !== null) {
          const isMuted =
            typeof savedMutedState === 'string'
              ? JSON.parse(savedMutedState)
              : savedMutedState;
          setIsMuted(isMuted);
          // Apply muted state to global sounds
          if (typeof window !== 'undefined' && (window as any).appSounds) {
            Object.values((window as any).appSounds).forEach((sound: any) =>
              sound?.mute(isMuted),
            );
          }
        }
      } catch (error) {
        console.error('Failed to load muted state:', error);
      }
    };

    loadMutedState();
  }, []);

  useEffect(() => {
    const loadRoutine = async () => {
      try {
        const savedRoutine = await getItem('routine');
        const savedAllRoutines = await getItem('allRoutines');
        const allRoutinesParsed = savedAllRoutines
          ? JSON.parse(savedAllRoutines)
          : [];
        if (savedRoutine) {
          const parsedRoutine = JSON.parse(savedRoutine);
          setRoutine(parsedRoutine);
        } else if (allRoutinesParsed.length > 0) {
          setRoutine(allRoutinesParsed[0]);
        } else {
          // TODO: See if it's better to keep or remove the default routines
          // setRoutine(getLocalizedRoutineExample());
          setRoutine(undefined);
        }
      } catch (error) {
        console.error('Failed to load routine:', error);
        // TODO: See if it's better to keep or remove the default routines
        // setRoutine(getLocalizedRoutineExample());
        setRoutine(undefined);
      }
    };

    loadRoutine();
  }, [currentLocale]);

  useEffect(() => {
    if (routine) {
      const activeExercises = routine.exercises.filter(
        (exercise) => !exercise.isPaused,
      );
      setActiveExercises(activeExercises);
      setInitialExercisesAmount(activeExercises.length);
      setTimer(activeExercises[0]?.duration);
      setPreparationTime(routine.preparationDuration);
      const totalDurationInSeconds =
        activeExercises.reduce((acc, exercise) => acc + exercise.duration, 0) +
        routine.preparationDuration +
        routine.breakDuration * (activeExercises.length - 1);
      const totalDurationDate = new Date(0, 0, 0, 0, 0, totalDurationInSeconds);
      const minutes = totalDurationDate.getMinutes();
      const seconds = totalDurationDate.getSeconds();
      const totalExercisesDuration = `${minutes}m${seconds.toString().padStart(2, '0')}s`;

      setTotalDuration(`${totalExercisesDuration}`);
      setIsLoading(false);
    }
  }, [routine]);

  const { request, release } = useWakeLock({
    onError: () => setErrorMessage("Erreur de verrouillage de l'écran"),
  });

  const startRoutine = (isResuming = false) => {
    if (!routine) return;

    const activeExercises = routine.exercises.filter(
      (exercise) => !exercise.isPaused,
    );

    if (activeExercises.length === 0) {
      setErrorMessage(t('noActiveExercises'));
      return;
    }

    request(); // Requesting screen wake lock
    setIsRunning(true);

    let timerId: NodeJS.Timeout;
    let loopExerciseIndex = isResuming ? exerciseIndex : 0;
    let currentTimer = isResuming ? timer : preparationTime;

    // Only set preparation and break flags if not resuming
    if (!isResuming) {
      isPreparationRef.current = true;
      isBreakRef.current = false;
    } else {
      // When resuming, restore the state we were in when paused
      if (wasInBreakWhenPaused) {
        isBreakRef.current = true;
        isPreparationRef.current = false;
        // Keep the current timer (break duration)
      } else if (wasInPreparationWhenPaused) {
        isPreparationRef.current = true;
        isBreakRef.current = false;
        currentTimer = preparationTime;
      } else if (wasInExerciseWhenPaused) {
        // Resuming from exercise - show preparation first
        isPreparationRef.current = true;
        isBreakRef.current = false;
        isResumingFromExerciseRef.current = true; // Mark that we're resuming from exercise
        currentTimer = preparationTime;
        // Keep isInExercise false during preparation, but keep pausedElapsedTime for progress bar
      } else {
        // Default: start with preparation time
        isPreparationRef.current = true;
        isBreakRef.current = false;
        currentTimer = preparationTime;
      }
    }

    setExerciseIndex(loopExerciseIndex);
    setTimer(currentTimer);

    getGlobalSounds()?.beepStart?.play();

    if (!isPreparationRef.current && !isBreakRef.current) {
      getGlobalSounds()?.timerLoop?.play();
    }

    timerId = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer > 1) {
          const currentExerciseDuration =
            activeExercises[loopExerciseIndex].duration;
          const isHalfTime =
            prevTimer === Math.round(currentExerciseDuration / 2) + 1;
          if ((isHalfTime && prevTimer > 4) || prevTimer <= 4) {
            getGlobalSounds()?.beepShort?.play();
          }
          return prevTimer - 1;
        } else {
          getGlobalSounds()?.beepLong?.play();
          if (isPreparationRef.current) {
            isPreparationRef.current = false;
            getGlobalSounds()?.timerLoop?.play();

            // Check if we're resuming from a paused exercise
            if (isResumingFromExerciseRef.current) {
              isResumingFromExerciseRef.current = false;
              // Use stored timer from when we paused
              const exerciseDuration =
                pausedExerciseTimer ??
                activeExercises[loopExerciseIndex].duration;
              // Calculate elapsed time synced with the stored timer
              const syncedElapsed = currentExerciseDuration - exerciseDuration;
              setExerciseStartTime(Date.now() - syncedElapsed * 1000);
              setPausedElapsedTime(null);
              setPausedExerciseTimer(null);
              setIsInExercise(true);
              return exerciseDuration;
            }

            // Normal start - full exercise duration
            const exerciseDuration =
              activeExercises[loopExerciseIndex].duration;
            setCurrentExerciseDuration(exerciseDuration);
            setExerciseStartTime(Date.now());
            setIsInExercise(true);
            return exerciseDuration;
          }
          if (isBreakRef.current) {
            isBreakRef.current = false;
            getGlobalSounds()?.timerLoop?.play();
            const exerciseDuration =
              activeExercises[loopExerciseIndex].duration;
            setCurrentExerciseDuration(exerciseDuration);
            setExerciseStartTime(Date.now());
            setIsInExercise(true);
            return exerciseDuration;
          } else {
            getGlobalSounds()?.timerLoop?.pause();
            setExerciseStartTime(null);
            setCurrentExerciseDuration(0);
            setPausedElapsedTime(null);
            setIsInExercise(false);
            if (loopExerciseIndex < activeExercises.length - 1) {
              nextExerciseIndexRef.current = loopExerciseIndex + 1;
              loopExerciseIndex++;
              setExerciseIndex(loopExerciseIndex);
              isBreakRef.current = true;
              return routine.breakDuration;
            } else {
              clearInterval(timerId);
              launchVictory();
              return 0;
            }
          }
        }
      });
    }, 1000);

    setIntervalId(timerId);
  };

  const stopRoutine = useCallback(() => {
    getGlobalSounds()?.timerLoop?.stop();
    setIsRunning(false);
    setIsPaused(false);
    isBreakRef.current = false;
    isPreparationRef.current = true;
    setExerciseStartTime(null);
    setCurrentExerciseDuration(0);
    setPausedElapsedTime(null);
    setPausedExerciseTimer(null);
    setWasInBreakWhenPaused(false);
    setWasInPreparationWhenPaused(false);
    setWasInExerciseWhenPaused(false);
    isResumingFromExerciseRef.current = false;
    setIsInExercise(false);

    release(); // Releasing screen wake lock
    if (intervalId) clearInterval(intervalId);
    setExerciseIndex(0);
    setTimer(preparationTime);
    // Remove paused state from IndexedDB
    setItem('pausedState', null).catch(console.error);
  }, [intervalId, release, preparationTime]);

  const launchVictory = () => {
    getGlobalSounds()?.victory?.play();
    stopRoutine();
    // Defer the state update to avoid render warning
    setTimeout(() => incrementConsecutiveDays(), 0);
  };

  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  useEffect(() => {
    if (!isRunning || isPaused || !isInExercise || !exerciseStartTime) {
      return;
    }

    let animationFrameId: number;
    const updateProgress = () => {
      // Force re-render to update progress bar
      setForceUpdate((prev) => prev + 1);
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    animationFrameId = requestAnimationFrame(updateProgress);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning, isPaused, isInExercise, exerciseStartTime]);

  const handlePauseResume = () => {
    setIsPaused((prevPaused) => !prevPaused);
    if (isPaused) {
      // Resuming - keep pausedElapsedTime for now (will be cleared after preparation)
      // Clear the paused state flags
      setWasInBreakWhenPaused(false);
      setWasInPreparationWhenPaused(false);
      setWasInExerciseWhenPaused(false);
      startRoutine(true); // Pass true to indicate resuming
    } else {
      // Pausing - store the current state (break/preparation/exercise)
      setWasInBreakWhenPaused(isBreakRef.current);
      setWasInPreparationWhenPaused(isPreparationRef.current);
      const inExercise =
        !isBreakRef.current && !isPreparationRef.current && isInExercise;
      setWasInExerciseWhenPaused(inExercise);

      // Store the current visual position of the progress bar (freeze where it is)
      if (inExercise && exerciseStartTime) {
        const elapsed = (Date.now() - exerciseStartTime) / 1000;
        setPausedElapsedTime(elapsed);
        setPausedExerciseTimer(timer); // Store remaining exercise time
      }
      if (intervalId) clearInterval(intervalId);
      getGlobalSounds()?.timerLoop?.pause();
    }
  };

  const handlePrevious = () => {
    if (!routine || exerciseIndex <= 0) return;
    setExerciseIndex((prev) => {
      // Go to prev - 1 if timer equals the current exercise's full duration
      const currentExerciseDuration = activeExercises[prev]?.duration;
      const newIndex = timer === currentExerciseDuration ? prev - 1 : prev;
      resetTimer(newIndex);
      return newIndex;
    });
  };

  const handleNext = () => {
    if (!routine) return;
    if (exerciseIndex < activeExercises.length - 1) {
      setExerciseIndex((prev) => {
        const newIndex = prev + 1;
        resetTimer(newIndex);
        return newIndex;
      });
    }
  };

  const resetTimer = (newIndex: number) => {
    if (!routine) return;
    const newDuration = activeExercises[newIndex].duration;
    setTimer(newDuration);
    isBreakRef.current = false;
    isPreparationRef.current = false;
    setExerciseStartTime(null);
    setCurrentExerciseDuration(0);
    setPausedElapsedTime(null);
    setPausedExerciseTimer(null);
    setWasInBreakWhenPaused(false);
    setWasInPreparationWhenPaused(false);
    setWasInExerciseWhenPaused(false);
    isResumingFromExerciseRef.current = false;
    setIsInExercise(false);
    if (intervalId) clearInterval(intervalId);
    setIsPaused(true);
    getGlobalSounds()?.timerLoop?.pause();
  };

  const toggleMute = useCallback(() => {
    setIsMuted((prevMuted) => {
      const newMutedState = !prevMuted;
      // Save to IndexedDB
      setItem('isMuted', JSON.stringify(newMutedState)).catch(console.error);
      const sounds = getGlobalSounds();
      if (sounds) {
        Object.values(sounds).forEach((sound: any) => {
          if (sound) {
            sound.mute(newMutedState);
          }
        });
      }
      return newMutedState;
    });
  }, []);

  // Resolve translated exercise name from library by exerciseId, else routine name
  const getExerciseDisplayName = (
    exercise: Exercise | undefined,
  ): string | null => {
    if (!exercise) return null;
    if (exercise.exerciseId) {
      const libraryExercise = allExercises.find(
        (ex) => ex.id === exercise.exerciseId,
      );
      if (libraryExercise?.name) return libraryExercise.name;
    }
    if (exercise.name) return exercise.name;
    return null;
  };

  const getNextExerciseName = () => {
    if (!routine || nextExerciseIndexRef.current >= activeExercises.length)
      return null;
    const nextExercise = activeExercises[nextExerciseIndexRef.current];
    const displayName = getExerciseDisplayName(nextExercise);
    return (
      displayName ||
      `${t('exercise').charAt(0).toLocaleUpperCase()}${t('exercise').slice(1)} ${nextExerciseIndexRef.current + 1}`
    );
  };

  const getCurrentExerciseName = () => {
    if (!routine || exerciseIndex >= activeExercises.length) return null;
    const currentExercise = activeExercises[exerciseIndex];
    const displayName = getExerciseDisplayName(currentExercise);
    return (
      displayName ||
      `${t('exercise').charAt(0).toLocaleUpperCase()}${t('exercise').slice(1)} ${exerciseIndex + 1}`
    );
  };

  const getCurrentExercise = () => {
    if (!routine || exerciseIndex >= activeExercises.length) return null;
    return activeExercises[exerciseIndex];
  };

  const getNextExercise = () => {
    if (!routine || nextExerciseIndexRef.current >= activeExercises.length)
      return null;
    return activeExercises[nextExerciseIndexRef.current];
  };

  // Helper function to render exercise name as clickable if from library
  const renderExerciseName = (
    exercise: Exercise | null,
    name: string | null,
    sx: any = {},
  ) => {
    if (!name || !exercise) return null;

    const isClickable = isExerciseFromLibrary(exercise);

    const typographyProps = {
      variant: 'h4' as const,
      sx: {
        fontSize: 'clamp(1rem, 7vw, 2.5rem)',
        textAlign: 'center' as const,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        lineHeight: 1.2,
        ...(isClickable && {
          cursor: 'pointer',
          textDecoration: 'underline',
          '&:hover': {
            opacity: 0.8,
          },
        }),
        ...sx,
      },
      ...(isClickable && {
        onClick: () => handleOpenExerciseDetails(exercise),
      }),
    };

    return (
      <Typography {...typographyProps}>
        <strong>{name}</strong>
      </Typography>
    );
  };

  const getCurrentExerciseImage = () => {
    if (
      !routine ||
      exerciseIndex >= activeExercises.length ||
      isBreakRef.current ||
      isPreparationRef.current
    )
      return null;

    const currentExercise = activeExercises[exerciseIndex];
    if (!currentExercise.exerciseId) return null;

    const libraryExercise = allExercises.find(
      (ex) => ex.id === currentExercise.exerciseId,
    );

    return libraryExercise?.image || null;
  };

  const getProgressPercentage = () => {
    if (!routine || exerciseIndex >= activeExercises.length) return 0;

    // Special case: during preparation when resuming from exercise, show stored progress
    if (
      isPreparationRef.current &&
      pausedElapsedTime !== null &&
      currentExerciseDuration > 0
    ) {
      const progress = Math.min(
        100,
        (pausedElapsedTime / currentExerciseDuration) * 100,
      );
      return Math.max(0, progress);
    }

    if (isBreakRef.current || isPreparationRef.current) return 0;
    if (!exerciseStartTime || currentExerciseDuration === 0) return 0;

    // If paused, use the stored elapsed time
    if (isPaused && pausedElapsedTime !== null) {
      const progress = Math.min(
        100,
        (pausedElapsedTime / currentExerciseDuration) * 100,
      );
      return Math.max(0, progress);
    }

    // If running, calculate elapsed time
    const now = Date.now();
    const elapsed = (now - exerciseStartTime) / 1000; // en secondes
    const progress = Math.min(100, (elapsed / currentExerciseDuration) * 100);
    return Math.max(0, progress);
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          flex: 1,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (hasNoRoutines) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Typography
          variant='h3'
          sx={{ textAlign: 'center', textTransform: 'uppercase' }}
        >
          {tCommon('practice')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
            flex: 1,
            textAlign: 'center',
          }}
        >
          <Typography variant='h5'>{tCommon('noRoutinesMessage')}</Typography>
          <Button
            variant='contained'
            size='large'
            component={Link}
            href='/new-routine'
          >
            {tCommon('createNewRoutineWithAI')}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor:
          isRunning && !isBreakRef.current && !isPreparationRef.current
            ? 'secondary.main'
            : 'inherit',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          mt: -2,
          minHeight: '88px',
        }}
      >
        {routine && (
          <SwitchRoutineTitle
            routine={routine}
            setRoutine={setRoutine}
            isRunning={isRunning}
          />
        )}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mt: -0.5,
          }}
        >
          <Typography sx={{ textAlign: 'center' }}>
            {initialExercisesAmount} {t('exercise')}
            {initialExercisesAmount > 1 && 's'}
            {activeExercises.length > 0 && ` | ${totalDuration}`}
          </Typography>
          <IconButton
            size='small'
            component={Link}
            href='/setup'
            disabled={isRunning}
          >
            <EditIcon fontSize='small' />
          </IconButton>
        </Box>
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {!isRunning ? (
          <Box
            sx={{
              mt: 'auto',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Button
              variant='contained'
              size='large'
              onClick={() => startRoutine()}
              sx={{ mb: 2 }}
            >
              {t('start')}
            </Button>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '220px',
                mt: 1.5,
                mb: 1,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 240,
                  height: 240,
                  zIndex: 0,
                }}
              >
                <svg
                  width='240'
                  height='240'
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  <circle
                    cx='120'
                    cy='120'
                    r='110'
                    fill='none'
                    stroke='rgba(0,0,0,0.1)'
                    strokeWidth='8'
                  />
                  <circle
                    cx='120'
                    cy='120'
                    r='110'
                    fill='none'
                    stroke={theme.palette.primary.main}
                    strokeWidth='8'
                    strokeLinecap='round'
                    strokeDasharray={`${2 * Math.PI * 110}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 110 * (1 - getProgressPercentage() / 100)
                    }`}
                  />
                </svg>
              </Box>
              {getCurrentExerciseImage() && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 220,
                    height: 220,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    zIndex: 0,
                  }}
                >
                  <Image
                    src={getCurrentExerciseImage()!}
                    alt={getCurrentExerciseName() || ''}
                    fill
                    style={{
                      objectFit: 'cover',
                    }}
                    sizes='220px'
                  />
                </Box>
              )}
              {!getCurrentExerciseImage() && (
                <Typography
                  variant='h1'
                  component='p'
                  sx={{
                    fontSize: '4rem !important',
                    position: 'relative',
                    zIndex: 1,
                    minWidth: '120px',
                    textAlign: 'center',
                  }}
                >
                  {timer}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                height: 'auto',
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mt: 0.5,
              }}
            >
              {isBreakRef.current ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Typography variant='h4'>
                    {t('rest')}{' '}
                    <span style={{ opacity: 0.7, fontSize: '1rem' }}>
                      ➝ {t('next')}
                    </span>
                  </Typography>
                  {getNextExerciseName() &&
                    renderExerciseName(
                      getNextExercise(),
                      getNextExerciseName(),
                      {
                        opacity: 0.7,
                      },
                    )}
                </Box>
              ) : isPreparationRef.current ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Typography variant='h4'>
                    {t('preparation')}{' '}
                    <span style={{ opacity: 0.7, fontSize: '1rem' }}>
                      ➝ {t('next')}
                    </span>
                  </Typography>
                  {getCurrentExerciseName() &&
                    renderExerciseName(
                      getCurrentExercise(),
                      getCurrentExerciseName(),
                      {
                        opacity: 0.7,
                      },
                    )}
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Typography
                    variant='h5'
                    sx={{
                      textTransform:
                        exerciseIndex + 1 === activeExercises.length
                          ? 'none'
                          : 'capitalize',
                      visibility: !getExerciseDisplayName(
                        activeExercises[exerciseIndex],
                      )
                        ? 'hidden'
                        : 'visible',
                      minHeight: '24px',
                    }}
                  >
                    {exerciseIndex + 1 === activeExercises.length
                      ? t('lastExercise')
                      : `${t('exercise')} ${exerciseIndex + 1}`}
                  </Typography>
                  {getExerciseDisplayName(activeExercises[exerciseIndex]) ? (
                    renderExerciseName(
                      activeExercises[exerciseIndex],
                      getExerciseDisplayName(activeExercises[exerciseIndex])!,
                    )
                  ) : (
                    <Typography
                      variant='h4'
                      sx={{
                        fontSize: 'clamp(1rem, 7vw, 2.5rem)',
                        textAlign: 'center',
                        textTransform:
                          exerciseIndex + 1 === activeExercises.length
                            ? 'none'
                            : 'capitalize',
                      }}
                    >
                      {exerciseIndex + 1 === activeExercises.length
                        ? t('lastExercise')
                        : `${t('exercise')} ${exerciseIndex + 1}`}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                my: 1,
              }}
            >
              <IconButton
                onClick={handlePrevious}
                disabled={exerciseIndex === 0}
              >
                <ArrowBackIosNewIcon />
              </IconButton>
              <IconButton onClick={handlePauseResume} size='large'>
                {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
              </IconButton>
              <IconButton
                onClick={handleNext}
                disabled={exerciseIndex === (activeExercises.length ?? 0) - 1}
              >
                <ArrowForwardIosIcon />
              </IconButton>
            </Box>
          </>
        )}
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          pt: 1,
        }}
      >
        <Button
          variant='text'
          onClick={stopRoutine}
          sx={{
            visibility: !isRunning ? 'hidden' : 'visible',
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 400,
            color: 'text.secondary',
            textDecoration: 'underline',
            '&:hover': {
              backgroundColor: 'transparent',
              textDecoration: 'underline',
            },
          }}
        >
          {t('stop')}
        </Button>
        <Typography sx={{ mt: 2, color: 'error.main' }}>
          {errorMessage}
        </Typography>
      </Box>
      <IconButton
        onClick={toggleMute}
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
        }}
      >
        {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
      </IconButton>

      {/* Exercise Details Modal */}
      <Modal
        open={exerciseDetailsModalOpen}
        onClose={handleCloseExerciseDetails}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Paper
          sx={{
            maxWidth: { xs: '90vw', sm: MODAL_MAX_WIDTH },
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {selectedExercise && (
            <>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Typography
                  variant='h4'
                  sx={{ textTransform: 'uppercase', fontWeight: 600 }}
                >
                  {selectedExercise.name}
                </Typography>
                <IconButton
                  onClick={handleCloseExerciseDetails}
                  sx={{ color: 'text.primary' }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '4/3',
                      borderRadius: 2,
                      backgroundColor: 'action.hover',
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Image
                      src={selectedExercise.image}
                      alt={selectedExercise.name}
                      fill
                      style={{
                        objectFit: 'cover',
                      }}
                      sizes='100vw'
                    />
                  </Box>
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  {selectedExercise.benefits[0] && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        backgroundColor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant='h6'
                        gutterBottom
                        sx={{ fontWeight: 600, mb: 1.5 }}
                      >
                        {tExerciseDetails('benefits')}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedExercise.benefits[0]
                          .split(', ')
                          .filter(Boolean)
                          .map((benefit, index) => (
                            <Chip
                              key={index}
                              label={benefit.trim()}
                              sx={{
                                fontWeight: 500,
                                backgroundColor: 'primary.light',
                                color: 'primary.contrastText',
                              }}
                            />
                          ))}
                      </Box>
                    </Paper>
                  )}

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      backgroundColor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant='h6'
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      {tExerciseDetails('instructions')}
                    </Typography>
                    <List sx={{ pl: 0 }}>
                      {selectedExercise.instructions.map(
                        (instruction, index) => (
                          <ListItem key={index} sx={{ pl: 0, py: 0.5 }}>
                            <ListItemText
                              primary={`${index + 1}. ${instruction}`}
                              primaryTypographyProps={{
                                sx: { lineHeight: 1.6 },
                              }}
                            />
                          </ListItem>
                        ),
                      )}
                    </List>
                  </Paper>

                  {selectedExercise.tips.length > 0 && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        backgroundColor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant='h6'
                        gutterBottom
                        sx={{ fontWeight: 600 }}
                      >
                        {tExerciseDetails('tips')}
                      </Typography>
                      <List sx={{ pl: 0 }}>
                        {selectedExercise.tips.map((tip, index) => (
                          <ListItem key={index} sx={{ pl: 0, py: 0.5 }}>
                            <ListItemText
                              primary={tip}
                              primaryTypographyProps={{
                                sx: { lineHeight: 1.6 },
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}

                  {selectedExercise.modifications.length > 0 && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        backgroundColor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant='h6'
                        gutterBottom
                        sx={{ fontWeight: 600 }}
                      >
                        {tExerciseDetails('modifications')}
                      </Typography>
                      <List sx={{ pl: 0 }}>
                        {selectedExercise.modifications.map(
                          (modification, index) => (
                            <ListItem key={index} sx={{ pl: 0, py: 0.5 }}>
                              <ListItemText
                                primary={modification}
                                primaryTypographyProps={{
                                  sx: { lineHeight: 1.6 },
                                }}
                              />
                            </ListItem>
                          ),
                        )}
                      </List>
                    </Paper>
                  )}
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </Modal>
    </Box>
  );
}
