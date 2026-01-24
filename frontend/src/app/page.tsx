'use client';

import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useConsecutiveDays } from '@/contexts/ConsecutiveDaysContext';
import { useWakeLock } from 'react-screen-wake-lock';
import { Howl } from 'howler';
import beepLong from '../../public/sounds/beep-long.mp3';
import beepShort from '../../public/sounds/beep-short.mp3';
import victory from '../../public/sounds/victory.mp3';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import EditModal from '@/app/_home/EditModal';

const DEFAULT_EXERCISES_AMOUNT = 10;
const DEFAULT_EXERCISE_TIME = 30;
const DEFAULT_BREAK_TIME = 5;
const DEFAULT_PREPARATION_TIME = 5;

export default function Home() {
  const { incrementConsecutiveDays } = useConsecutiveDays();

  const [isRunning, setIsRunning] = useState(false);
  const [exercisesAmount, setExercisesAmount] = useState(
    DEFAULT_EXERCISES_AMOUNT,
  );
  const [timer, setTimer] = useState(DEFAULT_EXERCISE_TIME);
  const [initialExercisesAmount, setInitialExercisesAmount] = useState(
    DEFAULT_EXERCISES_AMOUNT,
  );
  const [initialExerciseTime, setInitialExerciseTime] = useState(
    DEFAULT_EXERCISE_TIME,
  );
  const [initialBreakTime, setInitialBreakTime] = useState(DEFAULT_BREAK_TIME);
  const [initialPreparationTime, setInitialPreparationTime] = useState(
    DEFAULT_PREPARATION_TIME,
  );
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPreparationRef = useRef(true);
  const isBreakRef = useRef(false);
  const exerciseTimeRef = useRef(DEFAULT_EXERCISE_TIME);

  useEffect(() => {
    exerciseTimeRef.current = timer;
  }, [timer]);

  const { request, release } = useWakeLock({
    onError: () => setErrorMessage("Erreur de verrouillage de l'écran"),
  });

  useEffect(() => {
    if (!isRunning) {
      setInitialExercisesAmount(exercisesAmount);
      setInitialExerciseTime(timer);
    }
  }, [isRunning, exercisesAmount, timer]);

  const startRoutine = () => {
    const beepLongSound = new Howl({
      src: [beepLong],
      html5: true,
      onload: function () {
        setErrorMessage(null);
      },
      onloaderror: function (_id, error) {
        console.error('Erreur de chargement du son beepLongSound:', error);
        setErrorMessage('Erreur de chargement du son');
      },
      onplayerror: function (_id, error) {
        console.error('Erreur de lecture du son beepLongSound:', error);
        setErrorMessage('Erreur de lecture du son');
      },
    });
    const beepShortSound = new Howl({ src: [beepShort], html5: true });

    request(); // Requesting screen wake lock
    setIsRunning(true);
    beepLongSound.play();

    let timerId: NodeJS.Timeout;

    if (isPreparationRef.current) {
      setTimer(initialPreparationTime);
      timerId = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer > 1) {
            if (prevTimer <= 4) beepShortSound.play();
            return prevTimer - 1;
          } else {
            isPreparationRef.current = false;
            clearInterval(timerId);
            startRoutine();
            return initialExerciseTime;
          }
        });
      }, 1000);
    } else {
      timerId = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer > 1) {
            if (
              prevTimer === Math.round(initialExerciseTime / 2) + 1 ||
              prevTimer <= 4
            ) {
              beepShortSound.play();
            }
            return prevTimer - 1;
          } else {
            beepLongSound.play();
            isBreakRef.current = !isBreakRef.current;
          }
          if (isBreakRef.current) {
            setExercisesAmount((prevCount) => prevCount - 1);
            return initialBreakTime;
          }
          return initialExerciseTime;
        });
      }, 1000);
    }

    setIntervalId(timerId);
  };

  const stopRoutine = useCallback(() => {
    setIsRunning(false);
    isBreakRef.current = false;
    isPreparationRef.current = true;

    release(); // Releasing screen wake lock
    if (intervalId) clearInterval(intervalId);
    setExercisesAmount(initialExercisesAmount);
    setTimer(initialExerciseTime);
  }, [initialExercisesAmount, initialExerciseTime, intervalId, release]);

  useEffect(() => {
    if (exercisesAmount <= 0) {
      const victorySound = new Howl({ src: [victory], html5: true });

      stopRoutine();
      victorySound.play();
      incrementConsecutiveDays();
    }
  }, [exercisesAmount, stopRoutine, incrementConsecutiveDays]);

  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

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
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Typography variant='h2' sx={{ mt: 4 }}>
          Étirements
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ textAlign: 'center' }}>
            {initialExercisesAmount} exercice{initialExercisesAmount > 1 && 's'}{' '}
            de {initialExerciseTime} secondes
          </Typography>
          <IconButton
            size='small'
            onClick={() => setIsEditModalOpen(true)}
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
          gap: 4,
        }}
      >
        {!isRunning ? (
          <Button variant='contained' size='large' onClick={startRoutine}>
            COMMENCER
          </Button>
        ) : (
          <>
            <Typography
              variant='h1'
              component='p'
              sx={{ mt: -4, fontSize: '4rem !important' }}
            >
              {timer}
            </Typography>
            {isBreakRef.current ? (
              <Typography variant='h4'>Repos</Typography>
            ) : isPreparationRef.current ? (
              <Typography variant='h4'>Préparation</Typography>
            ) : (
              <Typography variant='h4'>
                {exercisesAmount === 1 && 'Dernier exercice'}
                {exercisesAmount === 2 && 'Exercice restant : 1'}
                {exercisesAmount > 2 &&
                  `Exercices restants : ${exercisesAmount - 1}`}
              </Typography>
            )}
          </>
        )}
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Button
          variant='outlined'
          size='large'
          onClick={stopRoutine}
          sx={{ visibility: !isRunning ? 'hidden' : 'visible' }}
        >
          STOP
        </Button>
        <Typography sx={{ mt: '4vh', color: 'error.main' }}>
          {errorMessage}
        </Typography>
      </Box>
      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        exercisesAmount={exercisesAmount}
        setExercisesAmount={setExercisesAmount}
        exerciseTime={timer}
        setExerciseTime={setTimer}
        breakTime={initialBreakTime}
        setBreakTime={setInitialBreakTime}
        preparationTime={initialPreparationTime}
        setPreparationTime={setInitialPreparationTime}
      />
    </Box>
  );
}
