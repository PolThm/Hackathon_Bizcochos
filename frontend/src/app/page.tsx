'use client';

import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { useRef, useState, useEffect, useCallback } from 'react';

const DEFAULT_RANGE = 10;
const DEFAULT_TIMER = 30;

export default function Home() {
  const beepLongRef = useRef<any>();
  const beepShortRef = useRef<any>();

  const [isRunning, setIsRunning] = useState(false);
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [timer, setTimer] = useState(DEFAULT_TIMER);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const playSound = (audioRef: any) => audioRef.current?.play();

  const startRoutine = () => {
    setIsRunning(true);
    setTimer(DEFAULT_TIMER);
    setRange(DEFAULT_RANGE);
    playSound(beepLongRef);

    const id = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer > 1) {
          if (prevTimer === Math.round(DEFAULT_TIMER / 2) + 1) playSound(beepShortRef);
          if (prevTimer <= 4) playSound(beepShortRef);
          return prevTimer - 1;
        } else {
          playSound(beepLongRef);
          setRange((prevRange) => prevRange - 1);
          return DEFAULT_TIMER;
        }
      });
    }, 1000);
    setIntervalId(id);
  };

  const stopRoutine = useCallback(() => {
    if (intervalId) clearInterval(intervalId);
    setIsRunning(false);
    setRange(DEFAULT_RANGE);
    setTimer(DEFAULT_TIMER);
  }, [intervalId]);

  useEffect(() => {
    if (range === 0) stopRoutine();
  }, [range, stopRoutine]);

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
        justifyContent: 'space-evenly',
      }}>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}>
        <Typography variant="h2">Étirements</Typography>
        <Typography sx={{ textAlign: 'center' }}>
          {DEFAULT_RANGE} série{range > 1 && 's'} de {DEFAULT_TIMER} secondes
        </Typography>
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4,
          mt: -8,
          minHeight: '300px',
        }}>
        {!isRunning ? (
          <Button variant="contained" size="large" onClick={startRoutine}>
            COMMENCER
          </Button>
        ) : (
          <>
            <Typography variant="h1" component="p" sx={{ fontSize: '4rem !important' }}>
              {timer}
            </Typography>
            <Typography variant="h4">
              {range === 1 ? `Dernière série !` : `Séries restantes : ${range - 1}`}
            </Typography>
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
          mt: -4,
        }}>
        <Button
          variant="outlined"
          size="large"
          onClick={stopRoutine}
          sx={{ visibility: !isRunning ? 'hidden' : 'visible' }}>
          STOP
        </Button>
      </Box>
      <>
        <audio ref={beepLongRef} src="/sounds/beep-long.mp3" />
        <audio ref={beepShortRef} src="/sounds/beep-short.mp3" />
      </>
    </Box>
  );
}
